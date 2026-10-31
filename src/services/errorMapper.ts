import { AppError, ErrorCategory } from '../domain/types';

/**
 * Central error mapper per TRD.md §8 & API_Spec.md §4.
 * Logs ONLY category + operation + incidentId; never logs payloads, keys, or secrets.
 */
export function mapError(
  rawError: unknown,
  operation: string,
  incidentId?: string
): AppError {
  const message =
    rawError instanceof Error
      ? rawError.message
      : typeof rawError === 'string'
        ? rawError
        : 'Unknown error';

  const lower = message.toLowerCase();
  let category: ErrorCategory = 'network';
  let userMessage = 'Network problem — unable to reach service.';
  let retryable = true;

  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) {
    category = 'timeout';
    userMessage = 'AI analysis timed out after 30 seconds. Retry or review the rule-based summary.';
    retryable = true;
  } else if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource_exhausted')
  ) {
    category = 'quota';
    userMessage = 'AI quota reached; please wait and try again later, or review the rule-based summary.';
    retryable = false;
  } else if (
    lower.includes('safety') ||
    lower.includes('blocked') ||
    lower.includes('finish_reason_safety') ||
    lower.includes('empty response')
  ) {
    category = 'blocked';
    userMessage = 'No analysis returned by AI safety filter. Retry or review the rule-based summary.';
    retryable = true;
  } else if (
    lower.includes('invalid_response') ||
    lower.includes('invalid json') ||
    lower.includes('malformed') ||
    lower.includes('schema') ||
    lower.includes('unusable response') ||
    lower.includes('validation failed')
  ) {
    category = 'invalid_response';
    userMessage = 'AI returned an unusable response that failed schema validation.';
    retryable = true;
  } else if (lower.includes('firestore_write') || lower.includes('write failed')) {
    category = 'firestore_write';
    userMessage = 'Not saved — database write could not be confirmed. Please retry.';
    retryable = true;
  } else if (lower.includes('firestore_read') || lower.includes('read failed')) {
    category = 'firestore_read';
    userMessage = "Can't load incidents from database. Please retry.";
    retryable = true;
  } else if (lower.includes('validation')) {
    category = 'validation';
    userMessage = message;
    retryable = false;
  } else if (
    lower.includes('offline') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('503') ||
    lower.includes('500') ||
    lower.includes('unavailable')
  ) {
    category = 'network';
    userMessage = 'AI service or network unavailable. Retry or review the rule-based summary.';
    retryable = true;
  }

  // Safe structured log (no secrets or payloads)
  console.warn(
    `[TelePulse][${category}] op=${operation}${incidentId ? ` incident=${incidentId}` : ''}`
  );

  return {
    category,
    operation,
    userMessage,
    retryable,
    incidentId,
  };
}
