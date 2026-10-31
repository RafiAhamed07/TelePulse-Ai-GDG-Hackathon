import { DEFAULT_THRESHOLDS } from '../config/constants';
import {
  DiagnosisInputPayload,
  EvidenceSample,
  IncidentDocument,
  ThresholdConfig,
} from './types';

/**
 * Builds the strict field-allowlisted payload for Gemini G1 Diagnosis (API_Spec.md §2).
 * NEVER sends: organization_id, orgId, sessionId, coordinates (latitude/longitude),
 * Firestore document IDs/paths, free-text fields, or environment/secret values.
 */
export function buildDiagnosisInput(
  incident: IncidentDocument,
  thresholdsConfig: ThresholdConfig = DEFAULT_THRESHOLDS
): DiagnosisInputPayload {
  const sanitizedSamples: EvidenceSample[] = incident.evidenceSamples
    .slice(-12)
    .map((s) => {
      const cleanSample: EvidenceSample = {
        timestamp: String(s.timestamp),
        latency_ms: Number(s.latency_ms),
        packet_loss_percent: Number(s.packet_loss_percent),
        jitter_ms: Number(s.jitter_ms),
        connected_users: Number(s.connected_users),
        traffic_mbps: Number(s.traffic_mbps),
        availability_percent: Number(s.availability_percent),
      };
      if (typeof s.signal_strength_dbm === 'number') {
        cleanSample.signal_strength_dbm = Number(s.signal_strength_dbm);
      }
      return cleanSample;
    });

  const cleanBaseline = {
    latency_ms: Number(incident.baseline.latency_ms),
    packet_loss_percent: Number(incident.baseline.packet_loss_percent),
    jitter_ms: Number(incident.baseline.jitter_ms),
    connected_users: Number(incident.baseline.connected_users),
    traffic_mbps: Number(incident.baseline.traffic_mbps),
    availability_percent: Number(incident.baseline.availability_percent),
    sampleCount: Number(incident.baseline.sampleCount),
    ...(typeof incident.baseline.signal_strength_dbm === 'number'
      ? { signal_strength_dbm: Number(incident.baseline.signal_strength_dbm) }
      : {}),
  };

  return {
    incidentDisplayId: incident.displayId,
    towerId: incident.towerId,
    networkType: incident.networkType,
    severity: incident.severity,
    detectedAt: incident.detectedAt,
    triggeringMetrics: incident.triggeringMetrics.map((m) => ({
      metric: m.metric,
      value: Number(m.value),
      unit: m.unit,
      warnThreshold: Number(m.warnThreshold),
      critThreshold: Number(m.critThreshold),
      level: m.level,
    })),
    baseline: cleanBaseline,
    samples: sanitizedSamples,
    thresholds: thresholdsConfig[incident.networkType],
  };
}

