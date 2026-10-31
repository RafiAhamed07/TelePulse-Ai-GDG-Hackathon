import { IncidentDocument, ReportStats } from './types';

/**
 * Deterministic report statistics computed purely by code (never by Gemini).
 */
export function computeReportStats(incidents: IncidentDocument[]): ReportStats {
  const bySeverity = {
    critical: 0,
    warning: 0,
  };

  const byStatus = {
    Open: 0,
    Investigating: 0,
    Resolved: 0,
  };

  const towersSet = new Set<string>();
  const resolveDurationsMinutes: number[] = [];

  for (const inc of incidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] || 0) + 1;
    byStatus[inc.status] = (byStatus[inc.status] || 0) + 1;
    towersSet.add(inc.towerId);

    if (inc.status === 'Resolved') {
      const resolvedEntry = [...inc.statusHistory]
        .reverse()
        .find((h) => h.to === 'Resolved');
      const startMs = Date.parse(inc.detectedAt);
      const endMs = resolvedEntry ? Date.parse(resolvedEntry.at) : Date.parse(inc.updatedAt);

      if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs >= startMs) {
        resolveDurationsMinutes.push((endMs - startMs) / 60000);
      }
    }
  }

  let meanTimeToResolveMinutes: number | null = null;
  if (resolveDurationsMinutes.length > 0) {
    const sum = resolveDurationsMinutes.reduce((acc, v) => acc + v, 0);
    meanTimeToResolveMinutes = Math.round((sum / resolveDurationsMinutes.length) * 100) / 100;
  }

  return {
    incidentCount: incidents.length,
    bySeverity,
    byStatus,
    towersAffected: Array.from(towersSet).sort(),
    meanTimeToResolveMinutes,
  };
}

