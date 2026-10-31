import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { DEFAULT_THRESHOLDS, ENV_CONFIG } from '../config/constants';
import { detectAnomaly } from '../domain/detector';
import {
  buildIncident,
  canCreateIncidentForTower,
} from '../domain/incidentFactory';
import { computeReportStats } from '../domain/reportStats';
import {
  AiAnalysis,
  AppError,
  CopilotAnswerResult,
  IncidentDocument,
  IncidentStatus,
  ReportDocument,
  TelemetryRecord,
} from '../domain/types';
import { parseUploadContent, UploadParseResult } from '../domain/uploadParser';
import { incidentsService, PersistenceMode } from '../services/firestore';
import {
  DiagnoseResult,
  geminiService,
  GeminiTestSimMode,
} from '../services/gemini';
import {
  simulatorService,
  SimulatorSnapshot,
} from '../services/simulator';

const SESSION_STORAGE_KEY = 'telepulse_session_id_v1';

function getOrCreateSessionId(): string {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = `sess-${Date.now().toString(36)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  }
  return `sess-${Date.now().toString(36)}`;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface TelePulseContextValue {
  sessionId: string;
  showAllSessions: boolean;
  setShowAllSessions: (show: boolean) => void;
  simulator: SimulatorSnapshot;
  incidents: IncidentDocument[];
  allIncidentsCount: number;
  reports: ReportDocument[];
  persistenceMode: PersistenceMode;
  healthCounts: {
    total: number;
    healthy: number;
    degraded: number;
    critical: number;
  };
  networkAverages: {
    latency_ms: number;
    packet_loss_percent: number;
    availability_percent: number;
    worstTowerId: string | null;
    worstTowerLatency: number;
  };
  diagnosingIds: Record<string, boolean>;
  updatingStatusIds: Record<string, boolean>;
  aiErrorsByIncident: Record<string, AppError | null>;
  fallbackByIncident: Record<string, AiAnalysis | null>;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  // Simulator controls
  startSimulator: () => void;
  stopSimulator: () => void;
  triggerIncident: (towerId?: string) => void;
  clearDegradation: () => void;
  stepSimulatorOnce: () => void;
  resetDemoSession: () => void;
  // Incident actions
  analyzeIncident: (incidentId: string) => Promise<DiagnoseResult | null>;
  updateIncidentStatus: (
    incidentId: string,
    nextStatus: IncidentStatus
  ) => Promise<boolean>;
  // P1 / P2 Backend actions
  uploadTelemetry: (content: string, fileName: string) => UploadParseResult;
  askCopilot: (question: string) => Promise<CopilotAnswerResult>;
  generateReport: (periodLabel?: string) => Promise<ReportDocument | null>;
  // QA & Runtime Config
  geminiModel: string;
  setGeminiModel: (model: string) => void;
  hasGeminiKey: boolean;
  setRuntimeGeminiKey: (key: string) => void;
  testSimMode: GeminiTestSimMode;
  setTestSimMode: (mode: GeminiTestSimMode) => void;
  simulateWriteFailure: boolean;
  setSimulateWriteFailure: (enabled: boolean) => void;
}

const TelePulseContext = createContext<TelePulseContextValue | null>(null);

export const TelePulseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sessionId, setSessionId] = useState<string>(getOrCreateSessionId);
  const [showAllSessions, setShowAllSessions] = useState<boolean>(false);
  const [simulator, setSimulator] = useState<SimulatorSnapshot>(() =>
    simulatorService.getSnapshot()
  );
  const [allIncidents, setAllIncidents] = useState<IncidentDocument[]>([]);
  const [reports, setReports] = useState<ReportDocument[]>(() =>
    incidentsService.getReports()
  );
  const [diagnosingIds, setDiagnosingIds] = useState<Record<string, boolean>>({});
  const [updatingStatusIds, setUpdatingStatusIds] = useState<Record<string, boolean>>({});
  const [aiErrorsByIncident, setAiErrorsByIncident] = useState<
    Record<string, AppError | null>
  >({});
  const [fallbackByIncident, setFallbackByIncident] = useState<
    Record<string, AiAnalysis | null>
  >({});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [geminiModel, setGeminiModelState] = useState<string>(
    geminiService.getModelName()
  );
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(
    geminiService.hasApiKey()
  );
  const [testSimMode, setTestSimModeState] = useState<GeminiTestSimMode>(
    geminiService.getTestSimMode()
  );
  const [simulateWriteFailure, setSimulateWriteFailureState] = useState<boolean>(
    incidentsService.getSimulateWriteFailure()
  );

  const incidentsRef = useRef<IncidentDocument[]>([]);
  incidentsRef.current = allIncidents;
  const sessionIdRef = useRef<string>(sessionId);
  sessionIdRef.current = sessionId;

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [{ id, type, message }, ...prev].slice(0, 5));
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Process newly emitted telemetry records through the deterministic anomaly detector
  const handleTelemetryBatch = useCallback(
    async (records: TelemetryRecord[]) => {
      const snap = simulatorService.getSnapshot();
      const currentSession = sessionIdRef.current;

      for (const rec of records) {
        const towerState = snap.towers[rec.tower_id];
        if (!towerState) continue;

        const candidate = detectAnomaly(towerState.samples, DEFAULT_THRESHOLDS);
        if (!candidate) continue;

        const check = canCreateIncidentForTower(
          candidate,
          currentSession,
          incidentsRef.current
        );

        if (!check.canCreate) {
          continue;
        }

        const seqNum =
          incidentsRef.current.filter((i) => i.sessionId === currentSession)
            .length + 1;
        const newIncident = buildIncident(candidate, currentSession, seqNum);

        // Optimistically update ref to prevent race conditions within the same batch
        incidentsRef.current = [newIncident, ...incidentsRef.current];

        try {
          await incidentsService.create(newIncident);
          addToast(
            'info',
            `Critical incident ${newIncident.displayId} detected on tower ${newIncident.towerId}.`
          );
        } catch (err) {
          // Rollback ref if confirmed write failed (OF-02)
          incidentsRef.current = incidentsRef.current.filter(
            (i) => i.id !== newIncident.id
          );
          const appErr = err as AppError;
          addToast(
            'error',
            appErr.userMessage || 'Failed to save detected incident to database.'
          );
        }
      }
    },
    [addToast]
  );

  useEffect(() => {
    simulatorService.setBatchHandler(handleTelemetryBatch);
    const unsubSim = simulatorService.subscribe((snap) => {
      setSimulator(snap);
    });
    const unsubInc = incidentsService.subscribe((docs) => {
      setAllIncidents(docs);
    });

    // Start simulator automatically on mount
    simulatorService.start(ENV_CONFIG.SIM_INTERVAL_MS);

    return () => {
      unsubSim();
      unsubInc();
      simulatorService.stop();
    };
  }, [handleTelemetryBatch]);

  const filteredIncidents = showAllSessions
    ? allIncidents
    : allIncidents.filter((inc) => inc.sessionId === sessionId);

  // Compute health counts and live network averages by deterministic code (US-01, OF-03)
  const towerStates = Object.values(simulator.towers);
  let healthyCount = 0;
  let degradedCount = 0;
  let criticalCount = 0;
  let sumLat = 0;
  let sumLoss = 0;
  let sumAvail = 0;
  let metricCount = 0;
  let worstTowerId: string | null = null;
  let worstTowerLatency = -1;

  for (const t of towerStates) {
    const status = t.latestHealth?.status || 'healthy';
    if (status === 'critical') criticalCount += 1;
    else if (status === 'degraded') degradedCount += 1;
    else healthyCount += 1;

    if (t.latestRecord) {
      sumLat += t.latestRecord.latency_ms;
      sumLoss += t.latestRecord.packet_loss_percent;
      sumAvail += t.latestRecord.availability_percent;
      metricCount += 1;
      if (t.latestRecord.latency_ms > worstTowerLatency) {
        worstTowerLatency = t.latestRecord.latency_ms;
        worstTowerId = t.definition.tower_id;
      }
    }
  }

  const healthCounts = {
    total: towerStates.length,
    healthy: healthyCount,
    degraded: degradedCount,
    critical: criticalCount,
  };

  const networkAverages = {
    latency_ms: metricCount > 0 ? Math.round((sumLat / metricCount) * 10) / 10 : 0,
    packet_loss_percent:
      metricCount > 0 ? Math.round((sumLoss / metricCount) * 100) / 100 : 0,
    availability_percent:
      metricCount > 0 ? Math.round((sumAvail / metricCount) * 100) / 100 : 100,
    worstTowerId,
    worstTowerLatency: worstTowerLatency > 0 ? worstTowerLatency : 0,
  };

  const analyzeIncident = useCallback(
    async (incidentId: string): Promise<DiagnoseResult | null> => {
      if (diagnosingIds[incidentId]) {
        return null; // Ignore duplicate click in flight (T-08)
      }

      const target = incidentsRef.current.find((i) => i.id === incidentId);
      if (!target) return null;

      setDiagnosingIds((prev) => ({ ...prev, [incidentId]: true }));
      setAiErrorsByIncident((prev) => ({ ...prev, [incidentId]: null }));

      try {
        const result = await geminiService.diagnose(target);
        setFallbackByIncident((prev) => ({
          ...prev,
          [incidentId]: result.fallback,
        }));

        if (result.ok && result.analysis) {
          await incidentsService.saveAnalysis(incidentId, result.analysis);
          addToast(
            'success',
            `Gemini diagnosis saved for ${target.displayId}.`
          );
        } else if (result.error) {
          setAiErrorsByIncident((prev) => ({
            ...prev,
            [incidentId]: result.error,
          }));
          addToast(
            'error',
            `${result.error.userMessage} Showing rule-based summary instead.`
          );
        }
        return result;
      } catch (err) {
        const appErr = err as AppError;
        setAiErrorsByIncident((prev) => ({ ...prev, [incidentId]: appErr }));
        addToast(
          'error',
          appErr.userMessage || 'Failed to save AI analysis.'
        );
        return null;
      } finally {
        setDiagnosingIds((prev) => ({ ...prev, [incidentId]: false }));
      }
    },
    [diagnosingIds, addToast]
  );

  const updateIncidentStatus = useCallback(
    async (incidentId: string, nextStatus: IncidentStatus): Promise<boolean> => {
      if (updatingStatusIds[incidentId]) {
        return false;
      }
      setUpdatingStatusIds((prev) => ({ ...prev, [incidentId]: true }));
      try {
        const updated = await incidentsService.updateStatus(
          incidentId,
          nextStatus
        );
        addToast(
          'success',
          `Incident ${updated.displayId} marked as ${nextStatus} (confirmed write).`
        );
        return true;
      } catch (err) {
        const appErr = err as AppError;
        addToast(
          'error',
          appErr.userMessage || 'Could not update incident status.'
        );
        return false;
      } finally {
        setUpdatingStatusIds((prev) => ({ ...prev, [incidentId]: false }));
      }
    },
    [updatingStatusIds, addToast]
  );

  const uploadTelemetry = useCallback(
    (content: string, fileName: string): UploadParseResult => {
      const parsed = parseUploadContent(content, fileName);
      if (parsed.ok && parsed.acceptedRecords.length > 0) {
        simulatorService.ingestValidatedRecords(parsed.acceptedRecords);
        addToast(
          'success',
          `Processed ${parsed.acceptedRecords.length} valid record(s) from ${fileName}.`
        );
      } else if (!parsed.ok && parsed.fileError) {
        addToast('error', parsed.fileError);
      }
      return parsed;
    },
    [addToast]
  );

  const askCopilot = useCallback(
    async (question: string): Promise<CopilotAnswerResult> => {
      return geminiService.askCopilot(question, allIncidents, sessionId);
    },
    [allIncidents, sessionId]
  );

  const generateReport = useCallback(
    async (periodLabel: string = 'Current Session'): Promise<ReportDocument | null> => {
      const targetIncidents = allIncidents.filter(
        (i) => i.sessionId === sessionId
      );
      const stats = computeReportStats(targetIncidents);
      const narrative = await geminiService.generateReportNarrative(
        stats,
        targetIncidents
      );
      const nowIso = new Date().toISOString();
      const report: ReportDocument = {
        id: `rep_${sessionId}_${Date.now()}`,
        orgId: ENV_CONFIG.DEMO_ORG_ID,
        sessionId,
        period: {
          from:
            targetIncidents[targetIncidents.length - 1]?.detectedAt || nowIso,
          to: nowIso,
          label: periodLabel,
        },
        generatedAt: nowIso,
        stats,
        narrative,
        model: geminiService.getModelName(),
      };

      try {
        await incidentsService.createReport(report);
        setReports(incidentsService.getReports(sessionId));
        addToast('success', 'Session report generated and saved.');
        return report;
      } catch (err) {
        const appErr = err as AppError;
        addToast('error', appErr.userMessage || 'Failed to save report.');
        return null;
      }
    },
    [allIncidents, sessionId, addToast]
  );

  const resetDemoSession = useCallback(() => {
    const newSess = `sess-${Date.now().toString(36)}`;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, newSess);
    }
    setSessionId(newSess);
    setShowAllSessions(false);
    simulatorService.resetSessionTowers();
    addToast(
      'info',
      `Started fresh demo session (${newSess}). Previous incidents remain stored but hidden by default.`
    );
  }, [addToast]);

  const setGeminiModel = useCallback((model: string) => {
    geminiService.setModelName(model);
    setGeminiModelState(geminiService.getModelName());
  }, []);

  const setRuntimeGeminiKey = useCallback(
    (key: string) => {
      geminiService.setRuntimeApiKey(key);
      setHasGeminiKey(geminiService.hasApiKey());
      if (key.trim()) {
        addToast('success', 'Runtime Gemini API key set for this session.');
      }
    },
    [addToast]
  );

  const setTestSimMode = useCallback((mode: GeminiTestSimMode) => {
    geminiService.setTestSimMode(mode);
    setTestSimModeState(mode);
  }, []);

  const setSimulateWriteFailure = useCallback((enabled: boolean) => {
    incidentsService.setSimulateWriteFailure(enabled);
    setSimulateWriteFailureState(enabled);
  }, []);

  return (
    <TelePulseContext.Provider
      value={{
        sessionId,
        showAllSessions,
        setShowAllSessions,
        simulator,
        incidents: filteredIncidents,
        allIncidentsCount: allIncidents.length,
        reports,
        persistenceMode: incidentsService.getPersistenceMode(),
        healthCounts,
        networkAverages,
        diagnosingIds,
        updatingStatusIds,
        aiErrorsByIncident,
        fallbackByIncident,
        toasts,
        dismissToast,
        startSimulator: () => simulatorService.start(ENV_CONFIG.SIM_INTERVAL_MS),
        stopSimulator: () => simulatorService.stop(),
        triggerIncident: (towerId = 'DHK-104') =>
          simulatorService.triggerIncident(towerId),
        clearDegradation: () => simulatorService.clearDegradation(),
        stepSimulatorOnce: () => {
          simulatorService.stepOnce();
        },
        resetDemoSession,
        analyzeIncident,
        updateIncidentStatus,
        uploadTelemetry,
        askCopilot,
        generateReport,
        geminiModel,
        setGeminiModel,
        hasGeminiKey,
        setRuntimeGeminiKey,
        testSimMode,
        setTestSimMode,
        simulateWriteFailure,
        setSimulateWriteFailure,
      }}
    >
      {children}
    </TelePulseContext.Provider>
  );
};

export function useTelePulse(): TelePulseContextValue {
  const ctx = useContext(TelePulseContext);
  if (!ctx) {
    throw new Error('useTelePulse must be used within a TelePulseProvider');
  }
  return ctx;
}

