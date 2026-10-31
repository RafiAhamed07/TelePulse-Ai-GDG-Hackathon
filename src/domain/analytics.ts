import { BASELINE_WINDOW, DEFAULT_THRESHOLDS } from '../config/constants';
import {
  BaselineMetrics,
  HealthEvaluation,
  HealthStatus,
  MetricEvaluation,
  MetricKey,
  MetricLevel,
  MetricThreshold,
  NetworkThresholds,
  TelemetryRecord,
  ThresholdConfig,
} from './types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function evaluateMetric(
  metric: MetricKey,
  value: number,
  threshold: MetricThreshold
): MetricEvaluation {
  let level: MetricLevel = 'healthy';

  if (threshold.direction === 'higher_is_worse') {
    if (value >= threshold.crit) {
      level = 'critical';
    } else if (value >= threshold.warn) {
      level = 'warning';
    }
  } else {
    // lower_is_worse (signal_strength_dbm uses <=, availability_percent uses <)
    if (threshold.strictInequality) {
      if (value < threshold.crit) {
        level = 'critical';
      } else if (value < threshold.warn) {
        level = 'warning';
      }
    } else {
      if (value <= threshold.crit) {
        level = 'critical';
      } else if (value <= threshold.warn) {
        level = 'warning';
      }
    }
  }

  return {
    metric,
    value,
    unit: threshold.unit,
    warnThreshold: threshold.warn,
    critThreshold: threshold.crit,
    level,
  };
}

export function evaluateHealth(
  record: TelemetryRecord,
  thresholdsConfig: ThresholdConfig = DEFAULT_THRESHOLDS
): HealthEvaluation {
  const netThresholds: NetworkThresholds = thresholdsConfig[record.network_type];

  const metrics: Partial<Record<MetricKey, MetricEvaluation>> = {};
  const breachedMetrics: MetricEvaluation[] = [];

  const requiredKeys: MetricKey[] = [
    'latency_ms',
    'packet_loss_percent',
    'jitter_ms',
    'availability_percent',
  ];

  for (const key of requiredKeys) {
    const val = record[key];
    if (typeof val === 'number') {
      const evalResult = evaluateMetric(key, val, netThresholds[key]);
      metrics[key] = evalResult;
      if (evalResult.level !== 'healthy') {
        breachedMetrics.push(evalResult);
      }
    }
  }

  // Optional metric: signal_strength_dbm — skipped if missing, not treated as healthy evidence
  if (typeof record.signal_strength_dbm === 'number') {
    const sigEval = evaluateMetric(
      'signal_strength_dbm',
      record.signal_strength_dbm,
      netThresholds.signal_strength_dbm
    );
    metrics.signal_strength_dbm = sigEval;
    if (sigEval.level !== 'healthy') {
      breachedMetrics.push(sigEval);
    }
  }

  let status: HealthStatus = 'healthy';
  if (breachedMetrics.some((m) => m.level === 'critical')) {
    status = 'critical';
  } else if (breachedMetrics.some((m) => m.level === 'warning')) {
    status = 'degraded';
  }

  return {
    status,
    metrics,
    breachedMetrics,
  };
}

export function computeBaseline(
  samples: TelemetryRecord[],
  windowSize: number = BASELINE_WINDOW
): BaselineMetrics {
  const slice = samples.slice(-windowSize);
  const count = slice.length;

  if (count === 0) {
    return {
      latency_ms: 0,
      packet_loss_percent: 0,
      jitter_ms: 0,
      connected_users: 0,
      traffic_mbps: 0,
      availability_percent: 100,
      sampleCount: 0,
    };
  }

  let sumLatency = 0;
  let sumLoss = 0;
  let sumJitter = 0;
  let sumUsers = 0;
  let sumTraffic = 0;
  let sumAvail = 0;
  let sumSignal = 0;
  let signalCount = 0;

  for (const s of slice) {
    sumLatency += s.latency_ms;
    sumLoss += s.packet_loss_percent;
    sumJitter += s.jitter_ms;
    sumUsers += s.connected_users;
    sumTraffic += s.traffic_mbps;
    sumAvail += s.availability_percent;
    if (typeof s.signal_strength_dbm === 'number') {
      sumSignal += s.signal_strength_dbm;
      signalCount += 1;
    }
  }

  const baseline: BaselineMetrics = {
    latency_ms: round2(sumLatency / count),
    packet_loss_percent: round2(sumLoss / count),
    jitter_ms: round2(sumJitter / count),
    connected_users: Math.round(sumUsers / count),
    traffic_mbps: round2(sumTraffic / count),
    availability_percent: round2(sumAvail / count),
    sampleCount: count,
  };

  if (signalCount > 0) {
    baseline.signal_strength_dbm = round2(sumSignal / signalCount);
  }

  return baseline;
}

