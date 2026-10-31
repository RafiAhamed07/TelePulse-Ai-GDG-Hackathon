import { validateTelemetry } from './validation';
import { TelemetryRecord } from './types';

export interface RowError {
  rowNumber: number;
  errors: string[];
}

export interface UploadParseResult {
  ok: boolean;
  fileError?: string;
  acceptedRecords: TelemetryRecord[];
  rejectedRows: RowError[];
  totalRows: number;
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB limit per PRD US-09 / T-06
const MAX_UPLOAD_ROWS = 2000;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function coerceCsvRow(headers: string[], values: string[]): Record<string, unknown> {
  const numericFields = new Set([
    'latitude',
    'longitude',
    'latency_ms',
    'packet_loss_percent',
    'jitter_ms',
    'signal_strength_dbm',
    'connected_users',
    'traffic_mbps',
    'availability_percent',
  ]);

  const obj: Record<string, unknown> = {};
  headers.forEach((h, idx) => {
    const key = h.trim();
    const rawVal = values[idx] !== undefined ? values[idx].trim() : '';
    if (rawVal === '') {
      return;
    }
    if (numericFields.has(key)) {
      const num = Number(rawVal);
      obj[key] = Number.isNaN(num) ? rawVal : num;
    } else {
      obj[key] = rawVal;
    }
  });
  return obj;
}

export function parseUploadContent(
  content: string,
  fileName: string,
  byteLength: number = new Blob([content]).size,
  nowMs: number = Date.now()
): UploadParseResult {
  if (byteLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      fileError: `File exceeds maximum allowed size of 2 MB (${(byteLength / (1024 * 1024)).toFixed(2)} MB).`,
      acceptedRecords: [],
      rejectedRows: [],
      totalRows: 0,
    };
  }

  const lowerName = fileName.toLowerCase();
  const isJson = lowerName.endsWith('.json');
  const isCsv = lowerName.endsWith('.csv');

  if (!isJson && !isCsv) {
    return {
      ok: false,
      fileError: 'Unsupported file type. Only .csv and .json files are accepted.',
      acceptedRecords: [],
      rejectedRows: [],
      totalRows: 0,
    };
  }

  let rawRows: unknown[] = [];

  if (isJson) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        rawRows = parsed;
      } else if (typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as Record<string, unknown>).records)) {
        rawRows = (parsed as { records: unknown[] }).records;
      } else {
        return {
          ok: false,
          fileError: 'JSON upload must be an array of telemetry objects.',
          acceptedRecords: [],
          rejectedRows: [],
          totalRows: 0,
        };
      }
    } catch {
      return {
        ok: false,
        fileError: 'Failed to parse JSON file: invalid JSON syntax.',
        acceptedRecords: [],
        rejectedRows: [],
        totalRows: 0,
      };
    }
  } else {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        ok: false,
        fileError: 'CSV file must contain a header row and at least one data row.',
        acceptedRecords: [],
        rejectedRows: [],
        totalRows: 0,
      };
    }

    const headers = parseCsvLine(lines[0]);
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      rawRows.push(coerceCsvRow(headers, values));
    }
  }

  if (rawRows.length > MAX_UPLOAD_ROWS) {
    return {
      ok: false,
      fileError: `File contains ${rawRows.length} rows, exceeding maximum limit of ${MAX_UPLOAD_ROWS} rows.`,
      acceptedRecords: [],
      rejectedRows: [],
      totalRows: rawRows.length,
    };
  }

  const acceptedRecords: TelemetryRecord[] = [];
  const rejectedRows: RowError[] = [];

  rawRows.forEach((rawRow, index) => {
    const validation = validateTelemetry(rawRow, 'uploaded', nowMs);
    if (validation.ok && validation.record) {
      acceptedRecords.push({
        ...validation.record,
        origin: 'uploaded',
      });
    } else {
      rejectedRows.push({
        rowNumber: index + 1,
        errors: validation.errors,
      });
    }
  });

  return {
    ok: true,
    acceptedRecords,
    rejectedRows,
    totalRows: rawRows.length,
  };
}

