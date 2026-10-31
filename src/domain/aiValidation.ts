import {
  AiAnalysis,
  DiagnosisInputPayload,
  IncidentDocument,
  ObservedFact,
  PossibleCause,
  RecommendedCheck,
  UnverifiedNumberFlag,
} from './types';

// Imperative commands to alter live equipment are prohibited per API_Spec.md §3.1 & AI-15
const UNSAFE_COMMAND_PATTERNS = [
  /\b(restart|reboot|shutdown|shut\s+down|power\s+cycle|reset|reconfigure|flash|disable\s+port|kill)\b.*\b(tower|base\s*station|router|switch|interface|node|equipment|radio|link)\b/i,
  /\b(execute|run)\s+(command|script|cli)\b/i,
];

export function containsUnsafeEquipmentCommand(text: string): boolean {
  return UNSAFE_COMMAND_PATTERNS.some((pattern) => pattern.test(text));
}

function collectAllowedMetricValues(
  input: DiagnosisInputPayload,
  metricName: string
): number[] {
  const values: number[] = [];

  for (const tm of input.triggeringMetrics) {
    if (tm.metric === metricName) {
      values.push(tm.value, tm.warnThreshold, tm.critThreshold);
    }
  }

  const baselineVal = (input.baseline as unknown as Record<string, unknown>)[metricName];
  if (typeof baselineVal === 'number') {
    values.push(baselineVal);
  }

  for (const sample of input.samples) {
    const sampleVal = (sample as unknown as Record<string, unknown>)[metricName];
    if (typeof sampleVal === 'number') {
      values.push(sampleVal);
    }
  }

  const thresholdObj = (input.thresholds as unknown as Record<string, { warn: number; crit: number }>)[
    metricName
  ];
  if (thresholdObj) {
    values.push(thresholdObj.warn, thresholdObj.crit);
  }

  return Array.from(new Set(values));
}

/**
 * Numeric cross-check per API_Spec.md §3.1:
 * Each cited metric/value in observedFacts must be within ±1% or ±0.5 absolute of supplied data.
 */
export function verifyMetricValue(
  claimedValue: number,
  allowedValues: number[]
): boolean {
  if (allowedValues.length === 0) {
    return false;
  }

  return allowedValues.some((expected) => {
    const absDiff = Math.abs(claimedValue - expected);
    if (absDiff <= 0.5) {
      return true;
    }
    if (expected !== 0 && absDiff / Math.abs(expected) <= 0.01) {
      return true;
    }
    return false;
  });
}

export interface AiValidationResult {
  ok: boolean;
  analysis?: AiAnalysis;
  errors: string[];
}

export function validateAndCrossCheckAiOutput(
  rawTextOrObject: unknown,
  inputPayload: DiagnosisInputPayload,
  modelName: string,
  nowIso: string = new Date().toISOString()
): AiValidationResult {
  const errors: string[] = [];
  let parsed: Record<string, unknown>;

  if (typeof rawTextOrObject === 'string') {
    try {
      const cleaned = rawTextOrObject
        .trim()
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      parsed = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return { ok: false, errors: ['AI response is not valid JSON.'] };
    }
  } else if (typeof rawTextOrObject === 'object' && rawTextOrObject !== null) {
    parsed = rawTextOrObject as Record<string, unknown>;
  } else {
    return { ok: false, errors: ['AI response is empty or not an object.'] };
  }

  // 1. summary: string, <= 60 words (allow slight margin up to 75 words, reject empty)
  if (typeof parsed.summary !== 'string' || parsed.summary.trim().length === 0) {
    errors.push('summary must be a non-empty string.');
  } else {
    const wordCount = parsed.summary.trim().split(/\s+/).length;
    if (wordCount > 75) {
      errors.push(`summary exceeds maximum length (${wordCount} words > 60 word target).`);
    }
  }

  // 2. observedFacts: array 1-6 of { statement, metric?, value? }
  const observedFacts: ObservedFact[] = [];
  const unverifiedNumberFlags: UnverifiedNumberFlag[] = [];

  if (!Array.isArray(parsed.observedFacts) || parsed.observedFacts.length < 1 || parsed.observedFacts.length > 6) {
    errors.push('observedFacts must be an array of 1 to 6 items.');
  } else {
    for (const item of parsed.observedFacts) {
      if (typeof item !== 'object' || item === null || typeof (item as Record<string, unknown>).statement !== 'string') {
        errors.push('Each observedFact must have a string statement.');
        continue;
      }
      const rawFact = item as Record<string, unknown>;
      const fact: ObservedFact = {
        statement: String(rawFact.statement).trim(),
      };

      if (typeof rawFact.metric === 'string' && rawFact.metric.trim() !== '') {
        fact.metric = rawFact.metric.trim();
      }
      if (typeof rawFact.value === 'number' && Number.isFinite(rawFact.value)) {
        fact.value = rawFact.value;
      }

      // Cross-check metric/value against supplied input
      if (fact.metric && fact.value !== undefined) {
        const allowedValues = collectAllowedMetricValues(inputPayload, fact.metric);
        if (!verifyMetricValue(fact.value, allowedValues)) {
          unverifiedNumberFlags.push({
            metric: fact.metric,
            claimedValue: fact.value,
            expectedValues: allowedValues,
            reason: `Claimed value ${fact.value} for ${fact.metric} does not match supplied telemetry within ±1% or ±0.5.`,
          });
        }
      }

      observedFacts.push(fact);
    }
  }

  // 3. possibleCauses: array 1-4 of { hypothesis, rationale, confidence, evidenceFor[], evidenceMissing[] }
  const possibleCauses: PossibleCause[] = [];
  if (!Array.isArray(parsed.possibleCauses) || parsed.possibleCauses.length < 1 || parsed.possibleCauses.length > 4) {
    errors.push('possibleCauses must be an array of 1 to 4 items.');
  } else {
    for (const item of parsed.possibleCauses) {
      if (typeof item !== 'object' || item === null) {
        errors.push('Invalid item in possibleCauses.');
        continue;
      }
      const rawCause = item as Record<string, unknown>;
      const confidence = rawCause.confidence;
      if (
        typeof rawCause.hypothesis !== 'string' ||
        typeof rawCause.rationale !== 'string' ||
        (confidence !== 'low' && confidence !== 'medium' && confidence !== 'high') ||
        !Array.isArray(rawCause.evidenceFor) ||
        !Array.isArray(rawCause.evidenceMissing)
      ) {
        errors.push('Each possibleCause must include hypothesis, rationale, confidence (low/medium/high), evidenceFor[], and evidenceMissing[].');
        continue;
      }
      possibleCauses.push({
        hypothesis: rawCause.hypothesis.trim(),
        rationale: rawCause.rationale.trim(),
        confidence,
        evidenceFor: rawCause.evidenceFor.map((e) => String(e)),
        evidenceMissing: rawCause.evidenceMissing.map((e) => String(e)),
      });
    }
  }

  // 4. customerImpact: { description, basis }
  let customerImpact = { description: '', basis: '' };
  if (typeof parsed.customerImpact !== 'object' || parsed.customerImpact === null) {
    errors.push('customerImpact must be an object with description and basis.');
  } else {
    const rawImpact = parsed.customerImpact as Record<string, unknown>;
    if (
      typeof rawImpact.description !== 'string' ||
      rawImpact.description.trim() === '' ||
      typeof rawImpact.basis !== 'string' ||
      rawImpact.basis.trim() === ''
    ) {
      errors.push('customerImpact.description and customerImpact.basis must be non-empty strings.');
    } else {
      customerImpact = {
        description: rawImpact.description.trim(),
        basis: rawImpact.basis.trim(),
      };
    }
  }

  // 5. recommendedChecks: array 3-6 of { step, priority, rationale }
  const recommendedChecks: RecommendedCheck[] = [];
  const unsafeCommandFlags: string[] = [];

  if (
    !Array.isArray(parsed.recommendedChecks) ||
    parsed.recommendedChecks.length < 3 ||
    parsed.recommendedChecks.length > 6
  ) {
    errors.push('recommendedChecks must be an array of 3 to 6 items.');
  } else {
    for (const item of parsed.recommendedChecks) {
      if (typeof item !== 'object' || item === null) {
        errors.push('Invalid item in recommendedChecks.');
        continue;
      }
      const rawCheck = item as Record<string, unknown>;
      const priority = rawCheck.priority;
      if (
        typeof rawCheck.step !== 'string' ||
        typeof rawCheck.rationale !== 'string' ||
        (priority !== 'high' && priority !== 'medium' && priority !== 'low')
      ) {
        errors.push('Each recommendedCheck must have step, priority (high/medium/low), and rationale.');
        continue;
      }

      const stepText = rawCheck.step.trim();
      if (containsUnsafeEquipmentCommand(stepText)) {
        unsafeCommandFlags.push(stepText);
        // Replace unsafe direct equipment mutation command with safe investigation wording
        recommendedChecks.push({
          step: `[Flagged unsafe command removed — Investigation only] Inspect logs and alarm state before any manual intervention.`,
          priority,
          rationale: rawCheck.rationale.trim(),
        });
      } else {
        recommendedChecks.push({
          step: stepText,
          priority,
          rationale: rawCheck.rationale.trim(),
        });
      }
    }
  }

  // 6. uncertainties & dataGaps
  if (!Array.isArray(parsed.uncertainties) || parsed.uncertainties.length === 0) {
    errors.push('uncertainties must be a non-empty array of strings.');
  }
  if (!Array.isArray(parsed.dataGaps)) {
    errors.push('dataGaps must be an array of strings.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const uncertainties = (parsed.uncertainties as unknown[]).map((u) => String(u));
  const dataGaps = (parsed.dataGaps as unknown[]).map((d) => String(d));

  // Ensure missing optional signal_strength_dbm is noted in dataGaps if absent from samples
  const hasSignalInSamples = inputPayload.samples.some(
    (s) => typeof s.signal_strength_dbm === 'number'
  );
  if (
    !hasSignalInSamples &&
    !dataGaps.some((gap) => gap.toLowerCase().includes('signal'))
  ) {
    dataGaps.push('signal_strength_dbm was not supplied in the telemetry samples.');
  }

  const analysis: AiAnalysis = {
    generatedAt: nowIso,
    model: modelName,
    summary: (parsed.summary as string).trim(),
    observedFacts,
    possibleCauses,
    customerImpact,
    recommendedChecks,
    uncertainties,
    dataGaps,
    unverifiedNumberFlags,
    ...(unsafeCommandFlags.length > 0 ? { unsafeCommandFlags } : {}),
    isRuleBasedFallback: false,
  };

  return { ok: true, analysis, errors: [] };
}

/**
 * Deterministic Rule-Based Fallback (API_Spec.md §4):
 * Always labeled "Rule-based summary — not AI". Never presented as Gemini output.
 */
export function generateRuleBasedFallback(
  incident: IncidentDocument,
  nowIso: string = new Date().toISOString()
): AiAnalysis {
  const latestSample = incident.evidenceSamples[incident.evidenceSamples.length - 1];
  const connectedUsers = latestSample?.connected_users ?? incident.baseline.connected_users;

  const observedFacts: ObservedFact[] = incident.triggeringMetrics.slice(0, 6).map((tm) => {
    const baseVal = (incident.baseline as unknown as Record<string, unknown>)[tm.metric];
    const baseText = typeof baseVal === 'number' ? ` (baseline: ${baseVal} ${tm.unit})` : '';
    return {
      statement: `${tm.metric} reached ${tm.value} ${tm.unit} vs critical threshold ${tm.critThreshold} ${tm.unit}${baseText}.`,
      metric: tm.metric,
      value: tm.value,
    };
  });

  if (observedFacts.length === 0 && latestSample) {
    observedFacts.push({
      statement: `Latest sample recorded latency ${latestSample.latency_ms} ms and packet loss ${latestSample.packet_loss_percent}%.`,
      metric: 'latency_ms',
      value: latestSample.latency_ms,
    });
  }

  const hasSignal = incident.evidenceSamples.some(
    (s) => typeof s.signal_strength_dbm === 'number'
  );

  return {
    generatedAt: nowIso,
    model: 'rule-based-fallback (not AI)',
    summary: `Rule-based summary for ${incident.towerId}: ${incident.triggeringMetrics.length} metric(s) breached thresholds over 2 consecutive samples.`,
    observedFacts,
    possibleCauses: [
      {
        hypothesis: 'Possible transport/backhaul congestion or radio link degradation (unconfirmed rule-based hypothesis).',
        rationale: 'Multiple sustained threshold breaches detected by deterministic threshold rules.',
        confidence: 'low',
        evidenceFor: incident.triggeringMetrics.map(
          (m) => `${m.metric} (${m.value} ${m.unit}) breached ${m.level} threshold`
        ),
        evidenceMissing: [
          'Backhaul link utilization logs',
          'Hardware alarm history',
          'Weather and power telemetry',
        ],
      },
    ],
    customerImpact: {
      description: `Approximately ${connectedUsers} connected users on tower ${incident.towerId} may experience degraded service quality.`,
      basis: 'connected_users field in latest telemetry sample',
    },
    recommendedChecks: [
      {
        step: `Check transport/backhaul link utilization and interface error counters for ${incident.towerId}.`,
        priority: 'high',
        rationale: 'Identifies whether packet loss and latency stem from transport congestion.',
      },
      {
        step: `Inspect active hardware and environmental alarms on site ${incident.towerId}.`,
        priority: 'high',
        rationale: 'Rules out power, transceiver, or hardware faults.',
      },
      {
        step: `Compare neighboring towers in the same sector against ${incident.towerId} baseline.`,
        priority: 'medium',
        rationale: 'Determines whether the degradation is isolated to one site or regional.',
      },
    ],
    uncertainties: [
      'AI analysis was unavailable; this is a deterministic rule-based summary — not AI.',
      'Root cause is not verified.',
    ],
    dataGaps: hasSignal
      ? ['No hardware alarm logs or backhaul utilization telemetry provided.']
      : [
          'signal_strength_dbm is missing from telemetry samples.',
          'No hardware alarm logs or backhaul utilization telemetry provided.',
        ],
    unverifiedNumberFlags: [],
    isRuleBasedFallback: true,
  };
}

