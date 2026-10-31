import { geminiService } from './gemini';
import { incidentsService } from './firestore';
import { simulatorService } from './simulator';
import { TOWER_REGISTRY } from '../config/constants';
import { parseUploadContent } from '../domain/uploadParser';
import { computeReportStats } from '../domain/reportStats';

export const apiClient = {
  // ---- Network & Towers ----
  async getTowers() {
    const snap = simulatorService.getSnapshot();
    return TOWER_REGISTRY.map((def) => {
      const live = snap.towers[def.tower_id];
      const samples = live?.samples || [];
      const latest = samples[samples.length - 1];
      return {
        ...def,
        id: def.tower_id,
        health: live?.latestHealth?.status || 'healthy',
        latency_ms: latest?.latency_ms ?? 45,
        packet_loss_percent: latest?.packet_loss_percent ?? 0.4,
        jitter_ms: latest?.jitter_ms ?? 10,
        availability_percent: latest?.availability_percent ?? 99.8,
        connected_users: latest?.connected_users ?? def.base_users,
        traffic_mbps: latest?.traffic_mbps ?? def.base_traffic_mbps,
        history: samples,
      };
    });
  },

  async getTowerById(towerId: string) {
    const snap = simulatorService.getSnapshot();
    const def = TOWER_REGISTRY.find((t) => t.tower_id === towerId);
    if (!def) return null;
    const live = snap.towers[towerId];
    const samples = live?.samples || [];
    const latest = samples[samples.length - 1];
    return {
      ...def,
      id: def.tower_id,
      health: live?.latestHealth?.status || 'healthy',
      latency_ms: latest?.latency_ms ?? 45,
      packet_loss_percent: latest?.packet_loss_percent ?? 0.4,
      jitter_ms: latest?.jitter_ms ?? 10,
      availability_percent: latest?.availability_percent ?? 99.8,
      connected_users: latest?.connected_users ?? def.base_users,
      traffic_mbps: latest?.traffic_mbps ?? def.base_traffic_mbps,
      history: samples,
    };
  },

  // ---- Incidents ----
  async getIncidents() {
    return incidentsService.getAll();
  },

  async getIncidentById(incidentId: string) {
    return incidentsService.getById(incidentId);
  },

  async updateIncidentStatus(incidentId: string, newStatus: 'Open' | 'Investigating' | 'Resolved', reason: string = '') {
    return incidentsService.updateStatus(incidentId, newStatus);
  },

  // ---- AI Diagnostics & Copilot ----
  async diagnoseIncident(incidentId: string) {
    const inc = incidentsService.getIncidentsSync().find((i) => i.id === incidentId || i.displayId === incidentId);
    if (!inc) throw new Error('Incident not found');

    const result = await geminiService.diagnose(inc);
    if (result.ok && result.analysis) {
      await incidentsService.saveAnalysis(inc.id, result.analysis);
      return result.analysis;
    }
    if (result.fallback) {
      await incidentsService.saveAnalysis(inc.id, result.fallback);
      return result.fallback;
    }
    throw new Error(result.error?.userMessage || 'Diagnosis failed');
  },

  async askCopilot(question: string, context?: { towers?: unknown[]; incidents?: unknown[] }) {
    const incs = incidentsService.getIncidentsSync();
    const res = await geminiService.askCopilot(question, incs, 'sess-telepulse-live');
    return {
      answer: res.answer,
      observedFacts: res.observedFacts.map((s) => ({ statement: s })),
      dataUsed: res.dataUsed,
      hypotheses: res.uncertainties.map((u) => ({ hypothesis: u, rationale: 'Unverified telemetry hypothesis', confidence: 'low' })),
      recommendedSteps: ['Inspect backhaul link metrics', 'Compare neighbor tower baselines'],
      isRefusal: res.isRefusal,
    };
  },

  async generateReport(period: string = 'Demo Session', contextStats?: Record<string, unknown>) {
    const incs = incidentsService.getIncidentsSync();
    const stats = computeReportStats(incs);
    const narrative = await geminiService.generateReportNarrative(stats, incs);
    return narrative;
  },

  parseUpload(content: string, filename: string) {
    return parseUploadContent(content, filename);
  },
};
