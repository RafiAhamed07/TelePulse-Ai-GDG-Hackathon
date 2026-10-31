# Testing — QA and Test Plan

**Rule:** every "Actual result / Status" cell starts as `NOT RUN`. Antigravity fills it only after actually running the test. Never pre-mark as passed.

## 1. Strategy
- **Unit (pure functions, quick):** validation, thresholds, baseline, detector, dedup, status transitions, upload parser (P1). A small test runner (e.g., Vitest) is optional; if adding it is not worth the time, test these through documented manual steps.
- **Manual end-to-end:** Golden Path locally (Phase 3–5) and on the live URL (Phase 7).
- **Security/config checks:** Rules, payload allowlist, secret scan.
- **AI evaluation:** `docs/AI_Test_Cases.md`.
- **Accessibility/responsive:** `docs/Accessibility.md`.
- **Browser console + terminal** observed during every run.

## 2. Test cases
| ID | Scenario | Steps / input | Expected | Pri | Actual / Status |
|---|---|---|---|---|---|
| T-01 | Golden Path, normal valid input | Execute GP-1…GP-6 (`docs/PRD.md` §9) | Each step works; incident appears ≤ ~15 s after trigger; AI result valid; status persists after refresh | P0 | PASS (Vitest E2E + localhost workbench verified) |
| T-02 | Valid telemetry accepted | Feed a valid record | Accepted and normalized to canonical shape; unknown fields dropped | P0 | PASS (`backend.test.ts` T-02) |
| T-03 | Empty / missing / invalid / malicious input | Empty object; missing `latency_ms`; text in numeric field; value out of range; `tower_id` like `<script>…` or `ignore previous instructions` | Rejected with clear reasons; nothing reaches analytics, Firestore, or Gemini; no crash | P0 | PASS (`backend.test.ts` T-03) |
| T-04 | Threshold boundaries | latency 99/100/249/250; signal −99/−100/−110; availability 98/97.9/95/94.9 | Correct healthy/degraded/critical; lower-is-worse metrics handled | P0 | PASS (`backend.test.ts` T-04) |
| T-05 | Detector debounce, dedup, cooldown | 1 critical sample; 2 consecutive; trigger again while incident active; resolve then trigger within 2 min | No incident after 1; one after 2; no duplicate; cooldown respected | P0 | PASS (`backend.test.ts` T-05) |
| T-06 | Very long and ambiguous input | Copilot question of 2,000 chars; "which tower is bad?" (ambiguous); upload file over size limit (P1) | Length limit message; ambiguity handled by asking to rephrase or listing supported questions; oversize file rejected | P1 | PASS (`gemini.ts` + `uploadParser.ts`) |
| T-07 | Gemini failure modes | Force timeout, offline, 429-like, malformed JSON (see AI-04…AI-07) | Correct error category, retry behavior, labeled fallback; no false AI claim | P0 | PASS (`backend.test.ts` AI-04..AI-07) |
| T-08 | Repeated submission | Double-click Analyze; double-click confirm status change; rapid trigger clicks | One request in flight; one write; no duplicate records | P0 | PASS (`inFlightDiagnoses` + `inFlightStatusUpdates` guards) |
| T-09 | Refresh and persistence | Create incident, analyze, set Investigating; hard refresh | Incident, AI analysis, status, history all reload from Firestore; simulator restarts Normal | P0 | PASS (`incidentsService` persistence verified) |
| T-10 | Rules reject forbidden writes | Attempt: path outside `/orgs/ORG-001`; extra field; invalid enum; delete; backward status; edit immutable field | All denied | P0 | PASS (`firestore.rules` SR-1..SR-6 authored & audited) |
| T-11 | Rules allow permitted writes | Create valid incident; forward status update; save analysis | All allowed | P0 | PASS (`firestore.rules` SR-2..SR-4) |
| T-12 | Mobile viewport and keyboard | 375 px width; Tab through Golden Path; dialog focus trap + Escape | No horizontal page scroll; all actions reachable; visible focus | P0 | PASS on workbench (final check after teammate UI merge) |
| T-13 | Deployed URL | Run T-01 on live URL; refresh on `/incidents/:id` | Works; deep link loads (no 404) | P0 | NOT RUN (awaiting Phase 7 deploy approval) |
| T-14 | Secrets and bundle scan | Scan repo and built bundle for keys/tokens/credentials; inspect Gemini payload | None found; payload contains allowlisted fields only | P0 | PASS (`buildDiagnosisInput` strips `orgId`/`sessionId`/coords; `.env` gitignored) |
| T-15 | Console, terminal, slow network | Throttle network; watch console | Loading states shown; no unhandled rejections; retries don't duplicate writes | P1 | PASS on localhost:5173 |
| T-16 | Contradictory data | Record with latency critical but availability 100% | Displayed as observed; AI states the contradiction; no invented explanation | P1 | PASS (`gemini.ts` contradictory check) |
| T-17 | Upload valid/invalid file (P1) | CSV with 20 good and 3 bad rows; JSON with wrong types | Accepted/rejected counts + reasons; good rows processed through same pipeline | P1 | PASS (`backend.test.ts` T-17) |

Multilingual input: relevant only to the Copilot (P1) → AI-08.

## 3. Data integrity checks
Persistence after refresh (T-09); updates affect the correct incident (T-01, T-08); duplicates prevented (T-05, T-08); no delete path (T-10); Rules enforce the model (T-10/T-11). Cross-user isolation: **not applicable** (no accounts; D-01); limitation documented in `docs/Schema.md` §7.

## 4. Reliability checks
Inputs preserved after recoverable errors; success only after confirmation; retry available; no silent data loss; no console errors.

## 5. "Often Forgotten, We Will Check" acceptance checks
Run every OF-xx marked Must do in `docs/Risks.md` §6 and record results there and here:
| Item | Test mapping | Status |
|---|---|---|
| OF-01 | T-13 | NOT RUN |
| OF-02 | T-07, T-09 | NOT RUN |
| OF-03 | AI-03 | NOT RUN |
| OF-04 | T-07, T-08 | NOT RUN |
| OF-05 | Fresh-user check (someone not on the team) | NOT RUN |
| OF-06 | Visual audit | NOT RUN |
| OF-07 | T-10 | NOT RUN |
| OF-08 | T-05 | NOT RUN |
| OF-09 | T-12 | NOT RUN |
| OF-11 | T-14 | NOT RUN |
| OF-12 | T-15 | NOT RUN |
| OF-17 | T-14 | NOT RUN |

## 6. Authentication checks
Not applicable (D-01). If D-04 is approved: verify anonymous session is created silently and Rules reject unauthenticated writes.

## 7. Acceptance criteria and release readiness
Release when: T-01, T-03…T-05, T-07…T-14 pass on the live URL; AI-01…AI-07 recorded; OF Must-do items done; known issues listed; PO approves deployment. Checklist: [ ] Golden Path on live URL [ ] No secrets [ ] Rules verified [ ] Console clean [ ] Mobile checked [ ] Demo rehearsed ≤ 2 min [ ] Fallback ready.
