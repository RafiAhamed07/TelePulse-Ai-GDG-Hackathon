import {
  DEFAULT_THRESHOLDS,
  ENV_CONFIG,
  INCIDENT_AUTO_END_MS,
  RING_BUFFER_SIZE,
  TOWER_REGISTRY,
} from '../config/constants';
import { evaluateHealth } from '../domain/analytics';
import {
  HealthEvaluation,
  TelemetryRecord,
  TowerDefinition,
} from '../domain/types';
import { validateTelemetry } from '../domain/validation';

export type SimulatorMode = 'normal' | 'incident';

export interface TowerRuntimeState {
  definition: TowerDefinition;
  latestRecord: TelemetryRecord | null;
  latestHealth: HealthEvaluation | null;
  samples: TelemetryRecord[];
}

export interface SimulatorSnapshot {
  isRunning: boolean;
  mode: SimulatorMode;
  degradedTowerId: string | null;
  degradedUntilMs: number | null;
  tickCount: number;
  lastTickAt: string | null;
  towers: Record<string, TowerRuntimeState>;
}

type SimulatorListener = (snapshot: SimulatorSnapshot) => void;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

class TelemetrySimulatorService {
  private isRunning = false;
  private mode: SimulatorMode = 'normal';
  private degradedTowerId: string | null = null;
  private degradedUntilMs: number | null = null;
  private tickCount = 0;
  private lastTickAt: string | null = null;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private autoEndTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private towers: Record<string, TowerRuntimeState> = {};
  private listeners: Set<SimulatorListener> = new Set();
  private onBatchCallback: ((records: TelemetryRecord[]) => void) | null = null;

  constructor() {
    this.initializeTowers();
  }

  private initializeTowers(): void {
    this.towers = {};
    for (const def of TOWER_REGISTRY) {
      this.towers[def.tower_id] = {
        definition: def,
        latestRecord: null,
        latestHealth: null,
        samples: [],
      };
    }
    // Pre-seed 12 normal baseline samples per tower so baseline is immediately ready on load
    const now = Date.now();
    for (let i = 12; i >= 1; i--) {
      const sampleTimeMs = now - i * ENV_CONFIG.SIM_INTERVAL_MS;
      for (const def of TOWER_REGISTRY) {
        const raw = this.generateRawSample(def, false, new Date(sampleTimeMs).toISOString());
        const validated = validateTelemetry(raw, 'simulated', sampleTimeMs);
        if (validated.ok && validated.record) {
          this.appendSampleToBuffer(validated.record);
        }
      }
    }
    this.tickCount = 12;
    this.lastTickAt = new Date(now - ENV_CONFIG.SIM_INTERVAL_MS).toISOString();
  }

  private generateRawSample(
    def: TowerDefinition,
    isDegraded: boolean,
    timestampIso: string
  ): Record<string, unknown> {
    if (isDegraded) {
      // Critical anomaly profile matching Schema.md §2 & AI-01:
      // latency ~315-330 ms (crit >= 250), packet_loss ~16-19% (crit >= 10),
      // jitter ~44-52 ms, signal -110 to -113 dBm (crit <= -110), availability ~91-93% (crit < 95)
      return {
        organization_id: ENV_CONFIG.DEMO_ORG_ID,
        tower_id: def.tower_id,
        timestamp: timestampIso,
        latitude: def.latitude,
        longitude: def.longitude,
        network_type: def.network_type,
        latency_ms: Number(randomBetween(315, 332).toFixed(1)),
        packet_loss_percent: Number(randomBetween(16.5, 19.2).toFixed(2)),
        jitter_ms: Number(randomBetween(44, 54).toFixed(1)),
        signal_strength_dbm: Number(randomBetween(-113, -110).toFixed(1)),
        connected_users: Math.round(def.base_users * randomBetween(0.97, 1.03)),
        traffic_mbps: Number((def.base_traffic_mbps * randomBetween(0.95, 1.04)).toFixed(1)),
        availability_percent: Number(randomBetween(91.5, 93.5).toFixed(2)),
        origin: 'simulated',
      };
    }

    // Normal healthy baseline profile (latency ~52-68 ms, loss ~0.4-1.1%, jitter ~8-16 ms, signal -82..-72 dBm, availability 99.2-99.9%)
    const is5G = def.network_type === '5G';
    return {
      organization_id: ENV_CONFIG.DEMO_ORG_ID,
      tower_id: def.tower_id,
      timestamp: timestampIso,
      latitude: def.latitude,
      longitude: def.longitude,
      network_type: def.network_type,
      latency_ms: Number(randomBetween(is5G ? 28 : 54, is5G ? 45 : 68).toFixed(1)),
      packet_loss_percent: Number(randomBetween(0.3, 1.1).toFixed(2)),
      jitter_ms: Number(randomBetween(6, 15).toFixed(1)),
      signal_strength_dbm: Number(randomBetween(-84, -72).toFixed(1)),
      connected_users: Math.round(def.base_users * randomBetween(0.95, 1.05)),
      traffic_mbps: Number((def.base_traffic_mbps * randomBetween(0.94, 1.06)).toFixed(1)),
      availability_percent: Number(randomBetween(99.1, 99.95).toFixed(2)),
      origin: 'simulated',
    };
  }

  private appendSampleToBuffer(record: TelemetryRecord): void {
    const towerState = this.towers[record.tower_id];
    if (!towerState) {
      return;
    }

    const updatedSamples = [...towerState.samples, record].slice(-RING_BUFFER_SIZE);
    const health = evaluateHealth(record, DEFAULT_THRESHOLDS);

    this.towers[record.tower_id] = {
      ...towerState,
      latestRecord: record,
      latestHealth: health,
      samples: updatedSamples,
    };
  }

  public setBatchHandler(handler: (records: TelemetryRecord[]) => void): void {
    this.onBatchCallback = handler;
  }

  public start(intervalMs: number = ENV_CONFIG.SIM_INTERVAL_MS): void {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.stepOnce();
    }, intervalMs);
    this.notify();
  }

  public stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.notify();
  }

  public setMode(mode: SimulatorMode, targetTowerId: string = 'DHK-104'): void {
    if (mode === 'incident') {
      this.triggerIncident(targetTowerId);
    } else {
      this.clearDegradation();
    }
  }

  public triggerIncident(towerId: string = 'DHK-104'): void {
    if (this.mode === 'incident' && this.degradedTowerId === towerId) {
      return; // Already active on this tower (double-click guard)
    }

    if (this.autoEndTimeoutId) {
      clearTimeout(this.autoEndTimeoutId);
    }

    const nowMs = Date.now();
    this.mode = 'incident';
    this.degradedTowerId = towerId;
    this.degradedUntilMs = nowMs + INCIDENT_AUTO_END_MS;

    // Auto-end after ~90 seconds per PRD US-02 & AppFlow §6
    this.autoEndTimeoutId = setTimeout(() => {
      this.clearDegradation();
    }, INCIDENT_AUTO_END_MS);

    this.notify();
  }

  public clearIncident(towerId?: string): void {
    this.clearDegradation();
  }

  public clearDegradation(): void {

    if (this.autoEndTimeoutId) {
      clearTimeout(this.autoEndTimeoutId);
      this.autoEndTimeoutId = null;
    }
    this.mode = 'normal';
    this.degradedTowerId = null;
    this.degradedUntilMs = null;
    this.notify();
  }

  public resetSessionTowers(): void {
    this.clearDegradation();
    this.initializeTowers();
    this.notify();
  }

  public stepOnce(): TelemetryRecord[] {
    const nowMs = Date.now();
    if (this.degradedUntilMs && nowMs >= this.degradedUntilMs) {
      this.clearDegradation();
    }

    const timestampIso = new Date(nowMs).toISOString();
    const emitted: TelemetryRecord[] = [];

    for (const def of TOWER_REGISTRY) {
      const isDegraded = this.mode === 'incident' && this.degradedTowerId === def.tower_id;
      const raw = this.generateRawSample(def, isDegraded, timestampIso);
      const validation = validateTelemetry(raw, 'simulated', nowMs);
      if (validation.ok && validation.record) {
        this.appendSampleToBuffer(validation.record);
        emitted.push(validation.record);
      }
    }

    this.tickCount += 1;
    this.lastTickAt = timestampIso;

    if (this.onBatchCallback) {
      this.onBatchCallback(emitted);
    }

    this.notify();
    return emitted;
  }

  public ingestValidatedRecords(records: TelemetryRecord[]): void {
    for (const rec of records) {
      this.appendSampleToBuffer(rec);
    }
    if (this.onBatchCallback && records.length > 0) {
      this.onBatchCallback(records);
    }
    this.notify();
  }

  public getSnapshot(): SimulatorSnapshot {
    return {
      isRunning: this.isRunning,
      mode: this.mode,
      degradedTowerId: this.degradedTowerId,
      degradedUntilMs: this.degradedUntilMs,
      tickCount: this.tickCount,
      lastTickAt: this.lastTickAt,
      towers: { ...this.towers },
    };
  }

  public subscribe(listener: SimulatorListener): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const simulatorService = new TelemetrySimulatorService();

