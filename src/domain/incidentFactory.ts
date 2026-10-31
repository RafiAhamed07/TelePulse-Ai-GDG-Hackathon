import { ENV_CONFIG, INCIDENT_COOLDOWN_MS } from '../config/constants';
import {
  AnomalyCandidate,
  IncidentDocument,
  IncidentStatus,
} from './types';

export interface IncidentCheckResult {
  canCreate: boolean;
  reason?: 'active_incident_exists' | 'cooldown_active' | 'duplicate_id';
  existingIncident?: IncidentDocument;
}

export function canCreateIncidentForTower(
  candidate: AnomalyCandidate,
  sessionId: string,
  existingIncidents: IncidentDocument[],
  nowMs: number = Date.now()
): IncidentCheckResult {
  const deterministicId = `${sessionId}_${candidate.towerId}_${candidate.windowStartEpoch}`;

  const exactMatch = existingIncidents.find((inc) => inc.id === deterministicId);
  if (exactMatch) {
    return {
      canCreate: false,
      reason: 'duplicate_id',
      existingIncident: exactMatch,
    };
  }

  // Filter incidents for this tower in this session
  const towerIncidents = existingIncidents.filter(
    (inc) => inc.sessionId === sessionId && inc.towerId === candidate.towerId
  );

  // 1. One active incident per tower (Open or Investigating)
  const activeIncident = towerIncidents.find(
    (inc) => inc.status === 'Open' || inc.status === 'Investigating'
  );
  if (activeIncident) {
    return {
      canCreate: false,
      reason: 'active_incident_exists',
      existingIncident: activeIncident,
    };
  }

  // 2. Cooldown check: 2 minutes after Resolved
  for (const inc of towerIncidents) {
    if (inc.status === 'Resolved') {
      const resolvedTransition = [...inc.statusHistory]
        .reverse()
        .find((t) => t.to === 'Resolved');
      const resolvedTimeMs = resolvedTransition
        ? Date.parse(resolvedTransition.at)
        : Date.parse(inc.updatedAt);

      if (!Number.isNaN(resolvedTimeMs) && nowMs - resolvedTimeMs < INCIDENT_COOLDOWN_MS) {
        return {
          canCreate: false,
          reason: 'cooldown_active',
          existingIncident: inc,
        };
      }
    }
  }

  return { canCreate: true };
}

export function buildIncident(
  candidate: AnomalyCandidate,
  sessionId: string,
  sequenceNumber: number = 1,
  nowIso: string = new Date().toISOString()
): IncidentDocument {
  const cleanTower = candidate.towerId.replace(/[^A-Za-z0-9]/g, '');
  const seqStr = String(sequenceNumber).padStart(3, '0');
  const id = `${sessionId}_${candidate.towerId}_${candidate.windowStartEpoch}`;
  const displayId = `INC-${cleanTower}-${seqStr}`;

  return {
    id,
    displayId,
    orgId: ENV_CONFIG.DEMO_ORG_ID,
    sessionId,
    towerId: candidate.towerId,
    networkType: candidate.networkType,
    severity: candidate.severity,
    status: 'Open',
    detectedAt: candidate.detectedAt,
    detectionRule: candidate.detectionRule,
    triggeringMetrics: candidate.triggeringMetrics,
    baseline: candidate.baseline,
    evidenceSamples: candidate.evidenceSamples,
    dataOrigin: candidate.dataOrigin,
    aiAnalysis: null,
    statusHistory: [
      {
        from: null,
        to: 'Open',
        at: candidate.detectedAt,
      },
    ],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

const STATUS_ORDER: Record<IncidentStatus, number> = {
  Open: 0,
  Investigating: 1,
  Resolved: 2,
};

export function isValidStatusTransition(
  currentStatus: IncidentStatus,
  nextStatus: IncidentStatus
): boolean {
  // Forward-only transitions in P0: Open -> Investigating -> Resolved (or Open -> Resolved)
  return STATUS_ORDER[nextStatus] > STATUS_ORDER[currentStatus];
}

export function getAllowedNextStatuses(currentStatus: IncidentStatus): IncidentStatus[] {
  if (currentStatus === 'Open') {
    return ['Investigating', 'Resolved'];
  }
  if (currentStatus === 'Investigating') {
    return ['Resolved'];
  }
  return [];
}

