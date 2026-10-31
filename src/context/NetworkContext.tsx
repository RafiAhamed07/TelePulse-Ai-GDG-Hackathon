import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { simulatorService, SimulatorSnapshot } from '../services/simulator';
import { incidentsService } from '../services/firestore';
import { geminiService } from '../services/gemini';
import { TOWER_REGISTRY, DEFAULT_THRESHOLDS } from '../config/constants';
import { detectAnomaly } from '../domain/detector';
import { buildIncident, canCreateIncidentForTower } from '../domain/incidentFactory';
import {
  IncidentDocument,
  IncidentStatus,
  AiAnalysis,
} from '../domain/types';

interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'healthy';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: string;
  read: boolean;
}

export interface FrontendTowerRecord {
  id: string;
  tower_id: string;
  name: string;
  region: string;
  network_type: '4G' | '5G';
  networkType: '4G' | '5G';
  latitude: number;
  longitude: number;
  health: 'healthy' | 'warning' | 'critical';
  latency_ms: number;
  packet_loss_percent: number;
  jitter_ms: number;
  availability_percent: number;
  signal_strength_dbm?: number;
  connected_users: number;
  traffic_mbps: number;
  history?: unknown[];
}

export interface NetworkContextValue {
  towers: FrontendTowerRecord[];
  incidents: IncidentDocument[];
  activeIncidents: IncidentDocument[];
  isSimRunning: boolean;
  activeDegradation: string | null;
  selectedTowerId: string | null;
  setSelectedTowerId: (id: string | null) => void;
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  toasts: ToastItem[];
  addToast: (message: string, type?: 'info' | 'warning' | 'critical' | 'healthy', duration?: number) => void;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  startSimulator: () => void;
  stopSimulator: () => void;
  triggerIncident: (towerId?: string) => void;
  clearIncident: (towerId?: string) => void;
  updateIncidentStatus: (incidentId: string, newStatus: IncidentStatus, reason?: string) => Promise<IncidentDocument>;
  diagnoseIncidentWithAI: (incidentId: string, forceFallback?: boolean) => Promise<AiAnalysis>;
  resetSession: () => void;
  stats: {
    totalTowers: number;
    healthyTowers: number;
    warningTowers: number;
    criticalTowers: number;
    meanLatency: number;
    meanPacketLoss: string;
    meanAvailability: string;
  };
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<SimulatorSnapshot>(() => simulatorService.getSnapshot());
  const [incidents, setIncidents] = useState<IncidentDocument[]>(() => incidentsService.getIncidentsSync());
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'NOC System Online',
      message: 'Continuous monitoring active for 20 Dhaka Metro cell sites.',
      time: 'Just now',
      type: 'info',
      read: false,
    },
  ]);

  const addToast = useCallback((message: string, type: 'info' | 'warning' | 'critical' | 'healthy' = 'info', duration: number = 4000) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const addNotification = useCallback((title: string, message: string, type: string = 'info') => {
    const notif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      time: 'Just now',
      type,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
  }, []);

  // Subscribe to real-time simulator ticks
  useEffect(() => {
    const unsubSim = simulatorService.subscribe((newSnap) => {
      setSnapshot(newSnap);

      // Check detector on each tower's ring buffer for 2 consecutive critical samples
      for (const [tId, tData] of Object.entries(newSnap.towers)) {
        if (!tData.samples || tData.samples.length < 2) continue;
        const candidate = detectAnomaly(tData.samples, DEFAULT_THRESHOLDS);
        if (candidate) {
          const currentIncidents = incidentsService.getIncidentsSync();
          const check = canCreateIncidentForTower(candidate, 'sess-telepulse-live', currentIncidents);
          if (check.canCreate) {
            const nextIdx = currentIncidents.filter((i) => i.towerId === candidate.towerId).length + 1;
            const newDoc = buildIncident(candidate, 'sess-telepulse-live', nextIdx);
            incidentsService.create(newDoc).then((created) => {
              addToast(`CRITICAL ANOMALY: Incident ${created.displayId} opened on ${created.towerId}`, 'critical', 6000);
              addNotification(
                `Critical Incident: ${created.displayId}`,
                `Tower ${created.towerId} breached latency and packet loss thresholds.`,
                'critical'
              );
            }).catch((err) => {
              console.error('Failed to create incident candidate:', err);
            });
          }
        }
      }
    });

    // Subscribe to Firestore / localStorage persistence updates
    const unsubInc = incidentsService.subscribe((list) => {
      setIncidents([...list]);
    });

    // Auto-start simulator on boot
    simulatorService.start();

    return () => {
      unsubSim();
      unsubInc();
    };
  }, [addToast, addNotification]);

  // Transform snapshot towers into teammate's expected UI format
  const towers: FrontendTowerRecord[] = useMemo(() => {
    return TOWER_REGISTRY.map((def) => {
      const live = snapshot.towers[def.tower_id];
      const samples = live?.samples || [];
      const latest = samples[samples.length - 1];
      const rawHealth = live?.latestHealth?.status || 'healthy';
      const health: 'healthy' | 'warning' | 'critical' =
        rawHealth === 'degraded' ? 'warning' : rawHealth === 'critical' ? 'critical' : 'healthy';

      return {
        id: def.tower_id,
        tower_id: def.tower_id,
        name: def.name,
        region: def.region,
        network_type: def.network_type,
        networkType: def.network_type,
        latitude: def.latitude,
        longitude: def.longitude,
        health,
        latency_ms: latest?.latency_ms ?? 45,
        packet_loss_percent: latest?.packet_loss_percent ?? 0.4,
        jitter_ms: latest?.jitter_ms ?? 10,
        availability_percent: latest?.availability_percent ?? 99.8,
        signal_strength_dbm: latest?.signal_strength_dbm,
        connected_users: latest?.connected_users ?? def.base_users,
        traffic_mbps: latest?.traffic_mbps ?? def.base_traffic_mbps,
        history: samples,
      };
    });
  }, [snapshot]);

  const startSimulator = useCallback(() => {
    simulatorService.start();
    addToast('Telemetry simulator stream resumed.', 'info');
  }, [addToast]);

  const stopSimulator = useCallback(() => {
    simulatorService.stop();
    addToast('Telemetry simulator paused.', 'warning');
  }, [addToast]);

  const triggerIncident = useCallback((towerId = 'DHK-104') => {
    simulatorService.triggerIncident(towerId);
    addToast(`Triggered critical degradation on ${towerId}! Observing consecutive breach detection...`, 'warning', 6000);
    addNotification('Incident Mode Activated', `Stress test injection running on tower ${towerId} (auto-ends in 90s).`, 'warning');
  }, [addToast, addNotification]);

  const clearIncident = useCallback((towerId = 'DHK-104') => {
    simulatorService.clearIncident(towerId);
    addToast(`Cleared incident simulation on ${towerId}.`, 'info');
  }, [addToast]);

  const updateIncidentStatus = useCallback(async (incidentId: string, newStatus: IncidentStatus, reason = '') => {
    try {
      const updated = await incidentsService.updateStatus(incidentId, newStatus);
      addToast(`Incident ${updated.displayId} status changed to ${newStatus}.`, 'healthy');
      addNotification(`Status Update: ${updated.displayId}`, `Marked as ${newStatus} by NOC Operator.`, 'healthy');
      return updated;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast(msg, 'critical');
      throw err;
    }
  }, [addToast, addNotification]);

  const diagnoseIncidentWithAI = useCallback(async (incidentId: string, forceFallback = false) => {
    const inc = incidentsService.getIncidentsSync().find((i) => i.id === incidentId || i.displayId === incidentId);
    if (!inc) throw new Error('Incident not found');

    if (forceFallback) {
      geminiService.setTestSimMode('mock_timeout_ai04');
    }

    try {
      const diag = await geminiService.diagnose(inc);
      if (diag.ok && diag.analysis) {
        await incidentsService.saveAnalysis(inc.id, diag.analysis);
        addToast('TowerMind AI analysis complete and grounded with evidence.', 'healthy');
        return diag.analysis;
      }
      if (diag.fallback) {
        await incidentsService.saveAnalysis(inc.id, diag.fallback);
        addToast(diag.error?.userMessage || 'AI service unavailable — rule-based fallback attached.', 'warning');
        return diag.fallback;
      }
      throw new Error(diag.error?.userMessage || 'AI analysis failed');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addToast(`AI analysis error: ${msg}`, 'critical');
      throw err;
    } finally {
      if (forceFallback) {
        geminiService.setTestSimMode('live_or_auto');
      }
    }
  }, [addToast]);

  const resetSession = useCallback(() => {
    simulatorService.resetSessionTowers();
    simulatorService.clearIncident('DHK-104');
    addToast('Demo session reset. Normal telemetry baseline active.', 'info');
  }, [addToast]);

  // Aggregate stats derived from live towers
  const totalTowers = towers.length;
  const healthyTowers = towers.filter((t) => t.health === 'healthy').length;
  const warningTowers = towers.filter((t) => t.health === 'warning').length;
  const criticalTowers = towers.filter((t) => t.health === 'critical').length;

  const meanLatency = totalTowers > 0
    ? Math.round(towers.reduce((acc, t) => acc + (t.latency_ms || 0), 0) / totalTowers)
    : 0;

  const meanPacketLoss = totalTowers > 0
    ? (towers.reduce((acc, t) => acc + (t.packet_loss_percent || 0), 0) / totalTowers).toFixed(2)
    : '0.00';

  const meanAvailability = totalTowers > 0
    ? (towers.reduce((acc, t) => acc + (t.availability_percent || 0), 0) / totalTowers).toFixed(2)
    : '99.8';

  const activeIncidents = incidents.filter((i) => i.status === 'Open' || i.status === 'Investigating');

  const value: NetworkContextValue = {
    towers,
    incidents,
    activeIncidents,
    isSimRunning: snapshot.isRunning,
    activeDegradation: snapshot.degradedTowerId,
    selectedTowerId,
    setSelectedTowerId,
    selectedIncidentId,
    setSelectedIncidentId,
    toasts,
    addToast,
    notifications,
    setNotifications,
    startSimulator,
    stopSimulator,
    triggerIncident,
    clearIncident,
    updateIncidentStatus,
    diagnoseIncidentWithAI,
    resetSession,
    stats: {
      totalTowers,
      healthyTowers,
      warningTowers,
      criticalTowers,
      meanLatency,
      meanPacketLoss,
      meanAvailability,
    },
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
