# Schema — Data Schema

All examples are fictional and simulated. No real personal data. Nothing is implemented yet.

## 1. Entities and relationships
- **Organization** (single demo org `ORG-001`) has many **Incidents** and **Reports**.
- **Tower** (runtime registry, not stored) produces **Telemetry** (in memory only, D-05).
- **Incident** belongs to one tower and embeds its evidence, AI analysis, and status history.
- **ThresholdConfig** (code configuration, not stored) keyed by network type.

## 2. Telemetry record (in memory; canonical shape)
| Field | Type | Required | Validation |
|---|---|---|---|
| organization_id | string | yes | equals `ORG-001` in MVP |
| tower_id | string | yes | `^[A-Za-z0-9_-]{1,32}$` |
| timestamp | ISO-8601 UTC string | yes | parseable; not more than 5 min in the future |
| latitude / longitude | number | no | −90..90 / −180..180 |
| network_type | enum | yes | `4G` or `5G` |
| latency_ms | number | yes | 0..10000 |
| packet_loss_percent | number | yes | 0..100 |
| jitter_ms | number | yes | 0..5000 |
| signal_strength_dbm | number | no | −140..−30 |
| connected_users | integer | yes | 0..1,000,000 |
| traffic_mbps | number | yes | 0..1,000,000 |
| availability_percent | number | yes | 0..100 |
| origin | enum | yes (added by app) | `simulated` / `uploaded` / `sample` |

Unknown fields are dropped. Invalid records are rejected with a reason and never reach analytics.

Example (illustrative, simulated):
```json
{"organization_id":"ORG-001","tower_id":"DHK-104","timestamp":"2026-10-31T10:00:00Z","network_type":"4G","latency_ms":320,"packet_loss_percent":18,"jitter_ms":45,"signal_strength_dbm":-110,"connected_users":1250,"traffic_mbps":850,"availability_percent":92,"origin":"simulated"}
```

## 3. Tower registry (runtime)
20 simulated towers `DHK-101` … `DHK-120`. [Rec] 14 × 4G, 6 × 5G. `DHK-104` is the demo incident tower; `DHK-101` is the comparison tower. Coordinates, if used, are fictional.

## 4. Firestore structure
```
/orgs/ORG-001                        (doc: name, isDemo, createdAt)
/orgs/ORG-001/incidents/{incidentId} (docs)
/orgs/ORG-001/reports/{reportId}     (docs, P2)
```
No telemetry collection in MVP (D-05).

### 4.1 Incident document
| Field | Type | Req | Notes |
|---|---|---|---|
| displayId | string | yes | e.g. `INC-DHK104-001`, human-readable |
| orgId | string | yes | `ORG-001` |
| sessionId | string | yes | demo session; supports reset and multi-tab filtering |
| towerId | string | yes | |
| networkType | enum | yes | `4G`/`5G` |
| severity | enum | yes | `critical` (P0); `warning` (P2) |
| status | enum | yes | `Open` default, `Investigating`, `Resolved` |
| detectedAt | timestamp | yes | |
| detectionRule | string | yes | e.g. `critical_consecutive_2` |
| triggeringMetrics | array | yes | items: `{metric, value, unit, warnThreshold, critThreshold, level}` |
| baseline | map | yes | metric → mean of the previous 12 samples (code-computed) |
| evidenceSamples | array (≤12) | yes | validated telemetry records, allowlisted metric fields |
| dataOrigin | enum | yes | `simulated`/`uploaded`/`sample` |
| aiAnalysis | map or null | no | see §4.2 |
| statusHistory | array | yes | items: `{from, to, at}` |
| createdAt / updatedAt | timestamp | yes | |

Document ID: deterministic `{sessionId}_{towerId}_{windowStartEpoch}` to make retried writes idempotent. Size is well below Firestore's 1 MiB document limit.

### 4.2 `aiAnalysis` map
`{ generatedAt, model, summary, observedFacts[], possibleCauses[], customerImpact{description,basis}, recommendedChecks[], uncertainties[], dataGaps[], unverifiedNumberFlags[] }` — shape per `docs/API_Spec.md` §3.1. Stored only after validation passes.

### 4.3 Report document (P2)
`{ period{from,to}, generatedAt, stats{incidentCount, bySeverity, byStatus, towersAffected, meanTimeToResolveMinutes|null}, narrative (AI), model, sessionId }`. `stats` are computed by code.

## 5. ThresholdConfig (code config; illustrative demo defaults, **not telecom standards**)
| Metric | Warning | Critical | Source |
|---|---|---|---|
| latency_ms | 100 | 250 | Source rulebook |
| packet_loss_percent | 2 | 10 | Source rulebook |
| jitter_ms | 30 | 50 | Source rulebook |
| signal_strength_dbm (lower is worse) | ≤ −100 | ≤ −110 | Source rulebook |
| availability_percent (lower is worse) | < 98 | < 95 | **[Rec]** — not defined in the source rulebook; PO to confirm |

Keyed by network type; start with identical values for 4G and 5G. Health: `critical` if any metric critical; `degraded` if any warning; else `healthy`. Missing optional metric (e.g., signal) is skipped, not treated as healthy-by-default evidence.

## 6. Lifecycle and deletion
Incidents are never deleted by the app (Rules forbid delete). Demo reset creates a new `sessionId`; old incidents remain but are hidden by default. Cleanup of old demo data is a manual console action by the PO.

## 7. Security Rules requirements (to be implemented in Phase 5)
Layer: **Firestore Security Rules** enforce all of these; the UI enforces them only for usability.
| # | Requirement |
|---|---|
| SR-1 | Default deny. Open/test mode must not be used or left enabled |
| SR-2 | Access only under `/orgs/ORG-001/...`; every other path denied |
| SR-3 | Create incident only if fields exactly match the allowlist, types and enums are valid, `status == Open`, string/array sizes are capped |
| SR-4 | Update incident only to change `status`, `statusHistory`, `aiAnalysis`, `updatedAt`; status transitions forward-only; immutable fields unchanged |
| SR-5 | No delete on any document |
| SR-6 | Reports: create-only with schema and size checks (P2) |
| SR-7 | If D-04 is approved: require `request.auth != null` on all operations |
| SR-8 | If App Check is enforced for Firestore: require valid App Check token |

**Known limitation (D-03):** without authentication, anyone who obtains the public web config can create or modify demo-shaped documents within these constraints. Acceptable only because the data are simulated, non-private, and size-limited. Not suitable for real operator data.

## 8. Validation and integrity
Validation in `domain` before any use; Firestore Rules re-validate on write. Duplicate prevention via deterministic IDs and one-active-incident-per-tower with a cooldown (2 min after Resolved). Timestamps are UTC ISO strings in telemetry and Firestore timestamps in documents.
