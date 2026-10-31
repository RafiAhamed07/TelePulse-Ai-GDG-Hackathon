import { computeBaseline } from '../domain/analytics';
import { toEvidenceSample } from '../domain/detector';
import { computeReportStats } from '../domain/reportStats';
import {
  CopilotIntentResult,
  CopilotOperationName,
  HealthStatus,
  IncidentDocument,
} from '../domain/types';
import { simulatorService } from './simulator';

const ALLOWED_OPERATIONS = new Set<CopilotOperationName>([
  'listTowersByHealth',
  'getIncidentsSummary',
  'getTowerRecentMetrics',
  'compareTowers',
  'getIncidentDetail',
  'none',
]);

const TOWER_ID_PATTERN = /^DHK-\d{3}$/;

export interface CopilotExecutionOutput {
  allowed: boolean;
  operation: CopilotOperationName;
  data: unknown;
  refusalReason?: string;
}

/**
 * Trusted code validator and executor for G2 Copilot operations (API_Spec.md §3.2).
 * Enforces allowlisted operations and strict argument patterns before any data is fetched.
 */
export function executeCopilotOperation(
  intent: CopilotIntentResult,
  incidents: IncidentDocument[],
  currentSessionId: string
): CopilotExecutionOutput {
  if (!intent.supported || !ALLOWED_OPERATIONS.has(intent.operation) || intent.operation === 'none') {
    return {
      allowed: false,
      operation: 'none',
      data: null,
      refusalReason: "I can't answer that from the available data. Try asking about tower health, recent metrics for a tower (e.g., DHK-104), comparing two towers (e.g., DHK-101 vs DHK-104), or active incidents.",
    };
  }

  const snap = simulatorService.getSnapshot();
  const args = intent.args || {};

  switch (intent.operation) {
    case 'listTowersByHealth': {
      const healthArg = String(args.health || 'all').toLowerCase();
      const validHealth = ['healthy', 'degraded', 'critical', 'all'];
      const filterHealth = validHealth.includes(healthArg) ? healthArg : 'all';

      const rows = Object.values(snap.towers)
        .filter((t) => {
          if (filterHealth === 'all') return true;
          return (t.latestHealth?.status || 'healthy') === (filterHealth as HealthStatus);
        })
        .map((t) => ({
          towerId: t.definition.tower_id,
          networkType: t.definition.network_type,
          health: t.latestHealth?.status || 'healthy',
          latestMetrics: t.latestRecord ? toEvidenceSample(t.latestRecord) : null,
        }));

      return {
        allowed: true,
        operation: 'listTowersByHealth',
        data: { filterHealth, count: rows.length, towers: rows },
      };
    }

    case 'getIncidentsSummary': {
      const period = String(args.period || 'session');
      const nowMs = Date.now();
      let filtered = incidents;

      if (period === 'last_hour') {
        filtered = incidents.filter((i) => nowMs - Date.parse(i.detectedAt) <= 3600_000);
      } else if (period === 'session') {
        filtered = incidents.filter((i) => i.sessionId === currentSessionId);
      }

      const stats = computeReportStats(filtered);
      const list = filtered.slice(0, 20).map((i) => ({
        displayId: i.displayId,
        id: i.id,
        towerId: i.towerId,
        severity: i.severity,
        status: i.status,
        detectedAt: i.detectedAt,
      }));

      return {
        allowed: true,
        operation: 'getIncidentsSummary',
        data: { period, stats, incidents: list },
      };
    }

    case 'getTowerRecentMetrics': {
      const towerId = String(args.towerId || '').toUpperCase();
      if (!TOWER_ID_PATTERN.test(towerId) || !snap.towers[towerId]) {
        return {
          allowed: true,
          operation: 'getTowerRecentMetrics',
          data: { towerId, found: false, samples: [] },
        };
      }
      const windowSamples = Math.min(60, Math.max(1, Number(args.windowSamples) || 12));
      const tower = snap.towers[towerId];
      const samples = tower.samples.slice(-windowSamples).map(toEvidenceSample);
      const baseline = computeBaseline(tower.samples, 12);

      return {
        allowed: true,
        operation: 'getTowerRecentMetrics',
        data: {
          towerId,
          found: true,
          networkType: tower.definition.network_type,
          health: tower.latestHealth?.status || 'healthy',
          baseline,
          samples,
        },
      };
    }

    case 'compareTowers': {
      const towerIdA = String(args.towerIdA || 'DHK-101').toUpperCase();
      const towerIdB = String(args.towerIdB || 'DHK-104').toUpperCase();
      const windowSamples = Math.min(60, Math.max(1, Number(args.windowSamples) || 12));

      const towerA = snap.towers[towerIdA];
      const towerB = snap.towers[towerIdB];

      if (!towerA || !towerB) {
        return {
          allowed: true,
          operation: 'compareTowers',
          data: {
            found: false,
            missingTowers: [
              ...(!towerA ? [towerIdA] : []),
              ...(!towerB ? [towerIdB] : []),
            ],
          },
        };
      }

      return {
        allowed: true,
        operation: 'compareTowers',
        data: {
          found: true,
          windowSamples,
          towerA: {
            towerId: towerIdA,
            networkType: towerA.definition.network_type,
            health: towerA.latestHealth?.status || 'healthy',
            stats: computeBaseline(towerA.samples, windowSamples),
            latest: towerA.latestRecord ? toEvidenceSample(towerA.latestRecord) : null,
          },
          towerB: {
            towerId: towerIdB,
            networkType: towerB.definition.network_type,
            health: towerB.latestHealth?.status || 'healthy',
            stats: computeBaseline(towerB.samples, windowSamples),
            latest: towerB.latestRecord ? toEvidenceSample(towerB.latestRecord) : null,
          },
        },
      };
    }

    case 'getIncidentDetail': {
      const queryId = String(args.incidentId || '').trim();
      const match = incidents.find(
        (i) =>
          i.id === queryId ||
          i.displayId.toUpperCase() === queryId.toUpperCase() ||
          i.towerId.toUpperCase() === queryId.toUpperCase()
      );

      if (!match) {
        return {
          allowed: true,
          operation: 'getIncidentDetail',
          data: { found: false, incidentId: queryId },
        };
      }

      return {
        allowed: true,
        operation: 'getIncidentDetail',
        data: {
          found: true,
          displayId: match.displayId,
          towerId: match.towerId,
          networkType: match.networkType,
          severity: match.severity,
          status: match.status,
          detectedAt: match.detectedAt,
          triggeringMetrics: match.triggeringMetrics,
          baseline: match.baseline,
          aiSummary: match.aiAnalysis?.summary || null,
        },
      };
    }

    default:
      return {
        allowed: false,
        operation: 'none',
        data: null,
        refusalReason: "I can't answer that from the available data.",
      };
  }
}

