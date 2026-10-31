import {
  BASELINE_WINDOW,
  CONSECUTIVE_CRITICAL_REQUIRED,
  DEFAULT_THRESHOLDS,
} from '../config/constants';
import { computeBaseline, evaluateHealth } from './analytics';
import {
  AnomalyCandidate,
  EvidenceSample,
  TelemetryRecord,
  ThresholdConfig,
} from './types';

export function toEvidenceSample(record: TelemetryRecord): EvidenceSample {
  const sample: EvidenceSample = {
    timestamp: record.timestamp,
    latency_ms: record.latency_ms,
    packet_loss_percent: record.packet_loss_percent,
    jitter_ms: record.jitter_ms,
    connected_users: record.connected_users,
    traffic_mbps: record.traffic_mbps,
    availability_percent: record.availability_percent,
  };

  if (typeof record.signal_strength_dbm === 'number') {
    sample.signal_strength_dbm = record.signal_strength_dbm;
  }

  return sample;
}

/**
 * Rule-based anomaly detector:
 * Checks whether the most recent `CONSECUTIVE_CRITICAL_REQUIRED` (2) samples
 * for a tower are in `critical` state.
 */
export function detectAnomaly(
  towerBuffer: TelemetryRecord[],
  thresholdsConfig: ThresholdConfig = DEFAULT_THRESHOLDS
): AnomalyCandidate | null {
  if (towerBuffer.length < CONSECUTIVE_CRITICAL_REQUIRED) {
    return null;
  }

  const recentWindow = towerBuffer.slice(-CONSECUTIVE_CRITICAL_REQUIRED);
  const evaluations = recentWindow.map((sample) => evaluateHealth(sample, thresholdsConfig));

  const allCritical = evaluations.every((ev) => ev.status === 'critical');
  if (!allCritical) {
    return null;
  }

  // Find the start of the current unbroken critical streak so that windowStartEpoch stays
  // deterministic across subsequent critical samples in the same streak.
  let streakStartIndex = towerBuffer.length - CONSECUTIVE_CRITICAL_REQUIRED;
  while (streakStartIndex > 0) {
    const prevEval = evaluateHealth(towerBuffer[streakStartIndex - 1], thresholdsConfig);
    if (prevEval.status === 'critical') {
      streakStartIndex -= 1;
    } else {
      break;
    }
  }

  const firstCriticalSample = towerBuffer[streakStartIndex];
  const latestSample = recentWindow[recentWindow.length - 1];
  const latestEvaluation = evaluations[evaluations.length - 1];

  // Baseline is computed from up to 12 samples prior to the critical streak
  // (or from the available buffer if no prior healthy samples exist yet).
  const priorSamples = towerBuffer.slice(
    Math.max(0, streakStartIndex - BASELINE_WINDOW),
    streakStartIndex
  );
  const baselineSource = priorSamples.length > 0 ? priorSamples : towerBuffer.slice(0, streakStartIndex + 1);
  const baseline = computeBaseline(baselineSource, BASELINE_WINDOW);

  // Evidence samples: last <= 12 samples with only allowlisted metric fields
  const evidenceSamples = towerBuffer.slice(-BASELINE_WINDOW).map(toEvidenceSample);

  const triggeringMetrics = latestEvaluation.breachedMetrics.filter(
    (m) => m.level === 'critical' || m.level === 'warning'
  );

  const windowStartEpoch = Date.parse(firstCriticalSample.timestamp);

  return {
    towerId: latestSample.tower_id,
    networkType: latestSample.network_type,
    severity: 'critical',
    detectedAt: latestSample.timestamp,
    windowStartEpoch: Number.isNaN(windowStartEpoch) ? Date.now() : windowStartEpoch,
    detectionRule: `critical_consecutive_${CONSECUTIVE_CRITICAL_REQUIRED}`,
    triggeringMetrics,
    baseline,
    evidenceSamples,
    dataOrigin: latestSample.origin,
  };
}

