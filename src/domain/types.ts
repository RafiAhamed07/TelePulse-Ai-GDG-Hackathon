export type NetworkType = '4G' | '5G';
export type DataOrigin = 'simulated' | 'uploaded' | 'sample';
export type HealthStatus = 'healthy' | 'degraded' | 'critical';
export type MetricLevel = 'healthy' | 'warning' | 'critical';
export type IncidentSeverity = 'critical' | 'warning';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved';

export interface TelemetryRecord {
  organization_id: string;
  tower_id: string;
  timestamp: string; // ISO-8601 UTC string
  latitude?: number;
  longitude?: number;
  network_type: NetworkType;
  latency_ms: number;
  packet_loss_percent: number;
  jitter_ms: number;
  signal_strength_dbm?: number;
  connected_users: number;
  traffic_mbps: number;
  availability_percent: number;
  origin: DataOrigin;
}

export interface ValidationResult {
  ok: boolean;
  record?: TelemetryRecord;
  errors: string[];
}

export interface TowerDefinition {
  tower_id: string;
  name: string;
  region: string;
  network_type: NetworkType;
  latitude: number;
  longitude: number;
  base_users: number;
  base_traffic_mbps: number;
}

export interface MetricThreshold {
  warn: number;
  crit: number;
  unit: string;
  direction: 'higher_is_worse' | 'lower_is_worse';
  strictInequality?: boolean; // true for availability (< 98 warn, < 95 crit)
}

export interface NetworkThresholds {
  latency_ms: MetricThreshold;
  packet_loss_percent: MetricThreshold;
  jitter_ms: MetricThreshold;
  signal_strength_dbm: MetricThreshold;
  availability_percent: MetricThreshold;
}

export type ThresholdConfig = Record<NetworkType, NetworkThresholds>;

export type MetricKey = keyof NetworkThresholds;

export interface MetricEvaluation {
  metric: MetricKey;
  value: number;
  unit: string;
  warnThreshold: number;
  critThreshold: number;
  level: MetricLevel;
}

export interface HealthEvaluation {
  status: HealthStatus;
  metrics: Partial<Record<MetricKey, MetricEvaluation>>;
  breachedMetrics: MetricEvaluation[];
}

export interface BaselineMetrics {
  latency_ms: number;
  packet_loss_percent: number;
  jitter_ms: number;
  signal_strength_dbm?: number;
  connected_users: number;
  traffic_mbps: number;
  availability_percent: number;
  sampleCount: number;
}

export interface EvidenceSample {
  timestamp: string;
  latency_ms: number;
  packet_loss_percent: number;
  jitter_ms: number;
  signal_strength_dbm?: number;
  connected_users: number;
  traffic_mbps: number;
  availability_percent: number;
}

export interface AnomalyCandidate {
  towerId: string;
  networkType: NetworkType;
  severity: IncidentSeverity;
  detectedAt: string;
  windowStartEpoch: number;
  detectionRule: string;
  triggeringMetrics: MetricEvaluation[];
  baseline: BaselineMetrics;
  evidenceSamples: EvidenceSample[];
  dataOrigin: DataOrigin;
}

export interface StatusTransition {
  from: IncidentStatus | null;
  to: IncidentStatus;
  at: string;
}

export interface ObservedFact {
  statement: string;
  metric?: string;
  value?: number;
}

export interface PossibleCause {
  hypothesis: string;
  rationale: string;
  confidence: 'low' | 'medium' | 'high';
  evidenceFor: string[];
  evidenceMissing: string[];
}

export interface RecommendedCheck {
  step: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
}

export interface UnverifiedNumberFlag {
  metric: string;
  claimedValue: number;
  expectedValues: number[];
  reason: string;
}

export interface AiAnalysis {
  generatedAt: string;
  model: string;
  summary: string;
  observedFacts: ObservedFact[];
  possibleCauses: PossibleCause[];
  customerImpact: {
    description: string;
    basis: string;
  };
  recommendedChecks: RecommendedCheck[];
  uncertainties: string[];
  dataGaps: string[];
  unverifiedNumberFlags: UnverifiedNumberFlag[];
  unsafeCommandFlags?: string[];
  isRuleBasedFallback?: boolean;
}

export interface IncidentDocument {
  id: string; // Deterministic ID: {sessionId}_{towerId}_{windowStartEpoch}
  displayId: string; // e.g. INC-DHK104-001
  orgId: string;
  sessionId: string;
  towerId: string;
  networkType: NetworkType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detectedAt: string;
  detectionRule: string;
  triggeringMetrics: MetricEvaluation[];
  baseline: BaselineMetrics;
  evidenceSamples: EvidenceSample[];
  dataOrigin: DataOrigin;
  aiAnalysis: AiAnalysis | null;
  statusHistory: StatusTransition[];
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosisInputPayload {
  incidentDisplayId: string;
  towerId: string;
  networkType: NetworkType;
  severity: IncidentSeverity;
  detectedAt: string;
  triggeringMetrics: Array<{
    metric: MetricKey;
    value: number;
    unit: string;
    warnThreshold: number;
    critThreshold: number;
    level: MetricLevel;
  }>;
  baseline: BaselineMetrics;
  samples: EvidenceSample[];
  thresholds: NetworkThresholds;
}

export type ErrorCategory =
  | 'network'
  | 'timeout'
  | 'quota'
  | 'invalid_response'
  | 'blocked'
  | 'firestore_write'
  | 'firestore_read'
  | 'validation';

export interface AppError {
  category: ErrorCategory;
  operation: string;
  userMessage: string;
  retryable: boolean;
  incidentId?: string;
}

export type CopilotOperationName =
  | 'listTowersByHealth'
  | 'getIncidentsSummary'
  | 'getTowerRecentMetrics'
  | 'compareTowers'
  | 'getIncidentDetail'
  | 'none';

export interface CopilotIntentResult {
  operation: CopilotOperationName;
  args: Record<string, unknown>;
  supported: boolean;
}

export interface CopilotAnswerResult {
  answer: string;
  observedFacts: string[];
  dataUsed: string[];
  uncertainties: string[];
  isRefusal?: boolean;
}

export interface ReportStats {
  incidentCount: number;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  towersAffected: string[];
  meanTimeToResolveMinutes: number | null;
}

export interface ReportNarrative {
  executiveSummary: string;
  keyIncidents: string[];
  recommendationsForReview: string[];
  caveats: string[];
}

export interface ReportDocument {
  id: string;
  orgId: string;
  sessionId: string;
  period: {
    from: string;
    to: string;
    label: string;
  };
  generatedAt: string;
  stats: ReportStats;
  narrative: ReportNarrative | null;
  model: string;
}

