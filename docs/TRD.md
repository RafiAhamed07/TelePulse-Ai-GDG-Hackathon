# TRD — Technical Requirements and Architecture

Labels: [Official] · [Team] · [Rec] · [Assume] · [Confirm]. Nothing here is implemented or tested yet.

## 1. Stack and rationale
| Layer | Choice | Why |
|---|---|---|
| IDE | Google Antigravity | [Official] mandatory |
| Frontend | React + Vite (+ Tailwind, Recharts) | [Official] recommended; fast to build and deploy on Hosting |
| AI | Gemini via **Firebase AI Logic** (Gemini Developer API provider) | [Official] Gemini; keeps the model key out of browser code; no custom backend; can use App Check |
| Data | Firestore, Spark plan | Small amount of persistent state (incidents, status history, reports) |
| Hosting | Firebase Hosting | [Official] mandatory |
| Backend | None | PO decision D-02: Firebase only. Avoids a second runtime, billing, and a second deployment target |
| Auth | None | PO decision D-01 |

**Changes from the earlier TelePulse rulebook (all [Team], per PO):** FastAPI/Python → deterministic JavaScript/TypeScript module running in the browser; Cloud Run → removed; Login page → DEMO banner; telemetry persistence → in-memory (D-05).

## 2. System architecture
```
Browser (React SPA, served by Firebase Hosting)
 ├─ simulator service ──► telemetry (in memory)
 ├─ domain layer: validation → analytics → anomaly detector → incident factory (pure functions)
 ├─ firestore service ◄──► Firestore: /orgs/ORG-001/incidents, /reports
 └─ gemini service ──► Firebase AI Logic ──► Gemini API   (allowlisted fields only)
```
Trust boundary: the browser is **untrusted**. There is no trusted server code. Therefore protection comes from (a) no secrets in the client, (b) Firestore Security Rules, (c) App Check (P1), (d) the fact that all data is simulated and non-personal.

## 3. Frontend architecture
Suggested folders (Antigravity may adjust): `pages`, `components`, `domain` (pure logic, no Firebase imports), `services` (`simulator`, `firestore`, `gemini`, `copilotOps`), `state`, `config`. Routing: React Router (or equivalent). State: React Context + reducer/hooks; no Redux. Incidents come via a Firestore realtime listener; telemetry via the simulator subscription.

## 4. Data flow
1. Simulator emits records (5 s) → 2. `validateTelemetry` (types/ranges, canonical shape) → 3. in-memory ring buffer per tower (last 60 samples) → 4. analytics (baseline = mean of previous 12 samples; health per tower) → 5. detector (2 consecutive critical samples) → 6. incident factory + dedup → 7. Firestore write (confirmed before UI shows success) → 8. UI renders → 9. user clicks Analyze → 10. allowlist builder → 11. Gemini call → 12. validate + numeric cross-check → 13. write `aiAnalysis` → 14. user changes status → 15. Firestore update.

## 5. Gemini integration architecture
Gemini is the core intelligence [Official]. Features: **G1 incident diagnosis (P0)**, **G2 Copilot intent + answer (P1)**, **G3 report narrative (P2)**. Detailed contracts in `docs/API_Spec.md`.
- Calls go through Firebase AI Logic only. No Gemini API key exists in the repo, `.env`, or bundle.
- Model name is a config value `VITE_GEMINI_MODEL` (not a secret). [Confirm at implementation] choose a currently supported model, check quota and region availability in the Firebase console.
- Gemini never receives database credentials or query authority; it never decides access.
- Structured output (JSON response schema) + client-side validation + numeric cross-check.

## 6. Firebase services and rationale
| Service | Needed? | Reason |
|---|---|---|
| Hosting | Yes [Official] | Live deployment |
| Firestore | Yes (P0) | Persist incidents + status history so Golden Path step GP-6 survives refresh; real "persistence" credit |
| AI Logic | Yes | Gemini access without a client key |
| App Check | P1 | Reduce abuse of AI Logic/Firestore by non-app clients |
| Authentication | No (D-01); optional anonymous sign-in D-04 | See §12 |
| Cloud Functions / Cloud Run | No | Would need billing and a second runtime |

## 7. Security and privacy
- Data are simulated aggregate telemetry. No subscriber, personal, or call data. Do not upload real operator data.
- Allowlist before Gemini (`docs/API_Spec.md` §2). No free-text fields from uploads ever reach Gemini (prompt-injection control).
- Firestore Rules: see `docs/Schema.md` §7. Rules are the only server-enforced control; document the no-identity limitation honestly (D-03).
- Master-prompt rule (authenticate the requester before any data reaches Gemini): **cannot be met without login.** Conflict explained in §12 D-03; PO decision required. If any user-private data is ever introduced, this decision must be reopened.

## 8. Error handling and observability
Central error mapper (categories: `network`, `timeout`, `quota`, `invalid_response`, `blocked`, `firestore_write`, `firestore_read`, `validation`). Log category + operation + incident id only; never log payloads or config values. Visible error UI per `docs/AppFlow.md` §7. Browser console must be clean on the Golden Path.

## 9. Performance and reliability
20 towers × 1 sample / 5 s is light; cap chart points to 60; throttle re-render of tower grid. Firestore writes only on incident create, AI result, and status change (keeps within Spark limits [Confirm current limits]). One in-flight Gemini call per incident. Deterministic incident IDs and dedup prevent duplicates from retries.
Multi-tab caveat: each browser tab runs its own simulator, so two tabs could each create an incident for the same scenario. Mitigation: incidents carry `sessionId`; default views filter by the current session; "Show all sessions" toggle.

## 10. Build and deployment
Vite build → `dist`. Hosting: public dir `dist`, single-page rewrite to `index.html`. Deploy only with PO approval (`AGENTS.md` §10). Verify the live URL, including a deep-link refresh. Optional preview-channel smoke deploy in Phase 5 (separate approval).

## 11. Environment configuration (names only)
| Variable | Purpose | Secret? |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase web config | No (public client config), still kept local |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web config | No |
| `VITE_FIREBASE_PROJECT_ID` | Firebase web config | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase web config (only if used) | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase web config | No |
| `VITE_FIREBASE_APP_ID` | Firebase web config | No |
| `VITE_APPCHECK_SITE_KEY` | App Check provider site key (P1) | No (public site key) |
| `VITE_GEMINI_MODEL` | Model name | No |
| `VITE_DEMO_ORG_ID` | `ORG-001` | No |
| `VITE_SIM_INTERVAL_MS` | Simulator interval (default 5000) | No |

**There is no Gemini API key variable.** Never add one. The App Check debug token must never be placed in an env file (register it via the Firebase console flow only).

**Files to create at the venue (not pre-created, to respect the "no pre-written templates" rule [Confirm]):**
- `.env.example`: the variable names above with empty/placeholder values.
- `.gitignore` must cover: environment files (`.env`, `.env.*` except `.env.example`), credential/service-account JSON, private keys and certificates, dependency folders, build output, Firebase local cache/debug logs, editor/OS files, local-only notes.

## 12. Decision log
| ID | Decision | Status |
|---|---|---|
| D-01 | No login / no accounts | **Approved by PO** |
| D-02 | Firebase only; no custom backend; deterministic logic runs in the browser | **Approved by PO** |
| D-03 | No-identity Firestore Rules (path allowlist, field validation, size limits, no deletes) and an explicit exception to master-prompt §4.4.1 "authenticate before data reaches Gemini", because all data is simulated and non-private | **Product Owner decision pending approval** |
| D-04 | Optional invisible anonymous sign-in (no screens) so Rules can require `request.auth != null`. Default: off | **Product Owner decision pending approval** (recommended only if time permits; it is still Firebase Authentication, not a user login) |
| D-05 | Telemetry kept in browser memory only; only incidents/reports persist | **Product Owner decision pending approval** |
| D-06 | App Check is P1; enforce only after verifying it works | Recommendation |
| D-07 | Preview-channel smoke deploy in Phase 5 | Recommendation; needs separate approval |

## 13. Technical trade-offs and fallbacks
| Option | Trade-off | Fallback |
|---|---|---|
| AI Logic | Needs Firebase setup; model/quota limits | If unusable: stop and ask PO. A secure backend would need billing, which is not approved |
| Firestore | Rules without identity are weak | Keep data non-private; D-04 hardening |
| Browser-only logic | No server authority | Acceptable for simulated demo; documented |
| In-memory telemetry | Lost on refresh | Simulator restarts; incidents persist |

## 14. Needs confirmation
Organizer: pack usage (R-01), pre-creating Firebase project, event duration (4 vs 5 h), how Antigravity use is judged, Wi-Fi availability, recording fallback allowed. Product Owner: D-03, D-04, D-05. Implementation-time verification: AI Logic pricing/plan rules, model availability, free-tier quotas, Firestore Spark limits, Hosting limits.
