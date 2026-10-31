import { ENV_CONFIG } from '../config/constants';
import { DataOrigin, NetworkType, TelemetryRecord, ValidationResult } from './types';

const TOWER_ID_REGEX = /^[A-Za-z0-9_-]{1,32}$/;
const MAX_FUTURE_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

function isFiniteNumber(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

export function validateTelemetry(
  raw: unknown,
  defaultOrigin: DataOrigin = 'simulated',
  nowMs: number = Date.now()
): ValidationResult {
  const errors: string[] = [];

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ['Input record must be a non-null JSON object.'] };
  }

  const input = raw as Record<string, unknown>;

  // 1. organization_id
  const orgId = input.organization_id;
  if (typeof orgId !== 'string' || orgId !== ENV_CONFIG.DEMO_ORG_ID) {
    errors.push(`organization_id must equal '${ENV_CONFIG.DEMO_ORG_ID}'.`);
  }

  // 2. tower_id
  const towerId = input.tower_id;
  if (typeof towerId !== 'string' || !TOWER_ID_REGEX.test(towerId)) {
    errors.push('tower_id is required and must match ^[A-Za-z0-9_-]{1,32}$.');
  }

  // 3. timestamp
  const timestamp = input.timestamp;
  if (typeof timestamp !== 'string' || timestamp.trim() === '') {
    errors.push('timestamp is required and must be an ISO-8601 UTC string.');
  } else {
    const parsedMs = Date.parse(timestamp);
    if (Number.isNaN(parsedMs)) {
      errors.push('timestamp is not a valid ISO-8601 date string.');
    } else if (parsedMs > nowMs + MAX_FUTURE_DRIFT_MS) {
      errors.push('timestamp cannot be more than 5 minutes in the future.');
    }
  }

  // 4. latitude / longitude (optional)
  let latitude: number | undefined = undefined;
  if (input.latitude !== undefined && input.latitude !== null && input.latitude !== '') {
    if (!isFiniteNumber(input.latitude) || input.latitude < -90 || input.latitude > 90) {
      errors.push('latitude must be a number between -90 and 90.');
    } else {
      latitude = input.latitude;
    }
  }

  let longitude: number | undefined = undefined;
  if (input.longitude !== undefined && input.longitude !== null && input.longitude !== '') {
    if (!isFiniteNumber(input.longitude) || input.longitude < -180 || input.longitude > 180) {
      errors.push('longitude must be a number between -180 and 180.');
    } else {
      longitude = input.longitude;
    }
  }

  // 5. network_type
  const networkType = input.network_type;
  if (networkType !== '4G' && networkType !== '5G') {
    errors.push("network_type must be '4G' or '5G'.");
  }

  // 6. latency_ms (0..10000)
  const latency = input.latency_ms;
  if (!isFiniteNumber(latency) || latency < 0 || latency > 10000) {
    errors.push('latency_ms is required and must be a number between 0 and 10000.');
  }

  // 7. packet_loss_percent (0..100)
  const packetLoss = input.packet_loss_percent;
  if (!isFiniteNumber(packetLoss) || packetLoss < 0 || packetLoss > 100) {
    errors.push('packet_loss_percent is required and must be a number between 0 and 100.');
  }

  // 8. jitter_ms (0..5000)
  const jitter = input.jitter_ms;
  if (!isFiniteNumber(jitter) || jitter < 0 || jitter > 5000) {
    errors.push('jitter_ms is required and must be a number between 0 and 5000.');
  }

  // 9. signal_strength_dbm (optional, -140..-30)
  let signalStrength: number | undefined = undefined;
  if (
    input.signal_strength_dbm !== undefined &&
    input.signal_strength_dbm !== null &&
    input.signal_strength_dbm !== ''
  ) {
    if (
      !isFiniteNumber(input.signal_strength_dbm) ||
      input.signal_strength_dbm < -140 ||
      input.signal_strength_dbm > -30
    ) {
      errors.push('signal_strength_dbm must be a number between -140 and -30 dBm.');
    } else {
      signalStrength = input.signal_strength_dbm;
    }
  }

  // 10. connected_users (integer 0..1,000,000)
  const connectedUsers = input.connected_users;
  if (
    !isFiniteNumber(connectedUsers) ||
    !Number.isInteger(connectedUsers) ||
    connectedUsers < 0 ||
    connectedUsers > 1_000_000
  ) {
    errors.push('connected_users is required and must be an integer between 0 and 1,000,000.');
  }

  // 11. traffic_mbps (0..1,000,000)
  const traffic = input.traffic_mbps;
  if (!isFiniteNumber(traffic) || traffic < 0 || traffic > 1_000_000) {
    errors.push('traffic_mbps is required and must be a number between 0 and 1,000,000.');
  }

  // 12. availability_percent (0..100)
  const availability = input.availability_percent;
  if (!isFiniteNumber(availability) || availability < 0 || availability > 100) {
    errors.push('availability_percent is required and must be a number between 0 and 100.');
  }

  // 13. origin ('simulated' | 'uploaded' | 'sample')
  let origin: DataOrigin = defaultOrigin;
  if (input.origin !== undefined) {
    if (input.origin === 'simulated' || input.origin === 'uploaded' || input.origin === 'sample') {
      origin = input.origin;
    } else {
      errors.push("origin must be 'simulated', 'uploaded', or 'sample'.");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // Construct canonical record (unknown fields are strictly dropped)
  const canonicalRecord: TelemetryRecord = {
    organization_id: orgId as string,
    tower_id: towerId as string,
    timestamp: new Date(Date.parse(timestamp as string)).toISOString(),
    network_type: networkType as NetworkType,
    latency_ms: Number((latency as number).toFixed(2)),
    packet_loss_percent: Number((packetLoss as number).toFixed(2)),
    jitter_ms: Number((jitter as number).toFixed(2)),
    connected_users: connectedUsers as number,
    traffic_mbps: Number((traffic as number).toFixed(2)),
    availability_percent: Number((availability as number).toFixed(2)),
    origin,
  };

  if (latitude !== undefined) {
    canonicalRecord.latitude = latitude;
  }
  if (longitude !== undefined) {
    canonicalRecord.longitude = longitude;
  }
  if (signalStrength !== undefined) {
    canonicalRecord.signal_strength_dbm = Number(signalStrength.toFixed(2));
  }

  return { ok: true, record: canonicalRecord, errors: [] };
}

