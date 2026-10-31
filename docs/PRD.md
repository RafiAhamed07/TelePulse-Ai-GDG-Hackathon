# PRD — TelePulse AI (Candidate Plan)

**Labels:** [Official] organizer rule · [Problem] surprise-problem requirement · [Team] team decision · [Rec] recommendation · [Assume] assumption · [Confirm] needs confirmation.

> **[Problem] status: NOT AVAILABLE.** The surprise problem is revealed at timer start. This PRD is a candidate. Phase 0 must verify fit (`AGENTS.md` §1.2). Nothing below is implemented or tested.

## 1. Executive summary
TelePulse AI turns raw telecom tower telemetry into an understandable incident and a Gemini-assisted investigation. A browser-based simulator sends readings for 20 demo towers. Deterministic code detects abnormal conditions and opens an incident. A NOC engineer clicks "Analyze with Gemini" and gets a structured explanation that separates **observed facts** from **possible causes**, plus recommended investigation steps. The engineer, not the AI, decides and updates the incident status.

## 2. Problem and evidence
- **Problem (one sentence):** Network operations staff see large volumes of numbers but must still work out what is wrong and what to check first.
- **Who:** NOC engineers, network administrators, performance analysts, operations managers.
- **Why it matters:** slow or unclear diagnosis prolongs degradation for subscribers. [Assume] — no measured statistics are claimed.
- **Evidence from the challenge:** none yet; the problem is unrevealed. The domain comes from the team's own project rulebook.

## 3. Personas and needs
| Persona | Need | Pain point |
|---|---|---|
| NOC engineer | See which towers are unhealthy and why | Alerts without context |
| Network administrator | Know site and source status | Fragmented views |
| Performance analyst | Compare towers, spot trends | Manual comparison |
| Operations manager | Understand incident summaries | Technical noise |

## 4. Solution and value
**Solution (one sentence):** A Firebase-hosted React dashboard where rule-based detection opens incidents and Gemini explains them with evidence, uncertainty, and next checks.
**Differentiators:** AI output always separates facts from hypotheses; numbers come from code; evidence is shown next to every alert; no AI action touches infrastructure.

## 5. Goals and success criteria
| ID | Goal | Measurable check |
|---|---|---|
| G-1 | Golden Path works on the deployed URL | Completed end-to-end in ≤ 2 minutes, 3 consecutive runs |
| G-2 | Gemini output is structured and trustworthy | 100% of displayed analyses pass schema validation; 0 unverified numbers shown unflagged |
| G-3 | Failure states are honest | Gemini failure shows labeled fallback, never fake AI |
| G-4 | Judge understands product unaided | New user states purpose + next action within ~10 s |

## 6. Judging alignment [Official]
| Criterion | Weight | How this plan addresses it |
|---|---:|---|
| Working live product | 30% | Golden Path on deployed URL; no dead controls |
| Smart use of Gemini AI & Antigravity | 35% | Structured diagnosis, grounded Copilot, validation, fallback; visible Antigravity phase reports/plan as evidence of how it was used (only what actually exists) |
| Firebase deployment | 10% | Hosting live URL; Firestore persistence; AI Logic |
| User Experience | 15% | Clear hierarchy, states, responsive, accessible |
| Final presentation | 10% | 2-min script with fallback (`docs/Demo_Script.md`) |

## 7. Non-goals
Live operator integration, authentication/roles, multi-organization isolation, subscriber/personal data, automatic remediation, push notifications, a custom backend, real email.

## 8. Feature priorities
| ID | Feature | Pri |
|---|---|---|
| F-01 | In-browser simulator: 20 towers, Normal/Incident modes, trigger-incident button | P0 |
| F-02 | Telemetry validation and normalization (types, ranges) | P0 |
| F-03 | Analytics + rule-based anomaly detection (configurable thresholds) | P0 |
| F-04 | Incident creation with dedup, persisted to Firestore | P0 |
| F-05 | Dashboard: tower counts by health, live metrics, incident feed | P0 |
| F-06 | Incident list and detail with evidence | P0 |
| F-07 | Gemini incident diagnosis (structured, validated, fallback) | P0 |
| F-08 | Incident status workflow Open → Investigating → Resolved, persisted | P0 |
| F-09 | SIMULATED labeling + first-use guidance ("Try it" 4-step card) | P0 |
| F-10 | Live deployment on Firebase Hosting | P0 |
| F-11 | Network Analytics charts | P1 |
| F-12 | Network Sites list + tower detail | P1 |
| F-13 | CSV/JSON upload with validation report | P1 |
| F-14 | AI Copilot grounded in allowlisted data operations | P1 |
| F-15 | Firebase App Check | P1 |
| F-16 | Reports (code-computed stats + Gemini narrative) | P2 |
| F-17 | Judge Mode (guided demo, session reset) | P2 |
| F-18 | Warning-level incidents | P2 |
| — | Live NMS integration, auth/RBAC, multi-org, telemetry persistence, maps, notifications, custom backend (FastAPI/Cloud Run/Cloud Functions), automated remediation | P3 |

## 9. Golden Path (identical in AppFlow, Plan, Testing, Demo_Script)
1. **GP-1** Open the deployed URL. Dashboard shows a DEMO/SIMULATED banner, 20 towers in normal state, live-updating metrics.
2. **GP-2** Click **Trigger incident (DHK-104)**.
3. **GP-3** Within ~15 s (two consecutive breaching samples) a **critical** incident appears in the feed with its triggering metrics.
4. **GP-4** Open the incident; see triggering metrics versus baseline.
5. **GP-5** Click **Analyze with Gemini**; after a loading state a structured result appears: summary, observed facts, possible causes (hypotheses), customer impact, recommended checks, uncertainties, labeled AI-generated.
6. **GP-6** Change status to **Investigating** then **Resolved** (confirmation each time); status persists after page refresh.

## 10. User stories and acceptance criteria
| ID | Story | Acceptance criteria | Pri |
|---|---|---|---|
| US-01 | As a NOC engineer I see overall network health | Counts of healthy/degraded/critical towers equal code-computed values; updates each sample | P0 |
| US-02 | I trigger a demo degradation | Button starts incident mode on DHK-104; disabled while active; auto-ends | P0 |
| US-03 | I see an incident with evidence | Incident shows tower, severity, triggering metrics, thresholds, baseline, last samples | P0 |
| US-04 | I request AI analysis | One click; loading state; schema-valid result; facts and hypotheses visibly separate; AI label | P0 |
| US-05 | AI failure does not mislead me | Failure shows reason + retry + labeled rule-based fallback | P0 |
| US-06 | I update incident status | Confirmation dialog; success shown only after Firestore write confirmed; persists on refresh | P0 |
| US-07 | I know the data is simulated | Persistent banner and per-record SIMULATED tag | P0 |
| US-08 | I review charts | Latency, jitter, loss, availability, traffic charts per selected tower | P1 |
| US-09 | I upload CSV/JSON | Type/size limit; per-row errors listed; valid rows processed by the same pipeline | P1 |
| US-10 | I ask the Copilot | Only supported questions answered from allowlisted data; unsupported ones refused politely | P1 |
| US-11 | I generate a report | Code-computed counts + AI narrative, labeled | P2 |

## 11. Functional requirements (summary)
FR-1 Simulator emits one sample per tower every 5 s (configurable). FR-2 Every record is validated before use. FR-3 Thresholds are configurable by network type. FR-4 One active incident per tower; cooldown after resolution. FR-5 Gemini receives only the field allowlist. FR-6 Gemini output is schema-validated and numerically cross-checked. FR-7 Status transitions are forward-only in P0. Details: `docs/TRD.md`, `docs/Schema.md`, `docs/API_Spec.md`.

## 12. Non-functional requirements
Responsive (phone + laptop); WCAG 2.1 AA as a target (not claimed until tested); first load usable on slow connection; no console errors in the Golden Path; no secrets in the bundle; Spark plan only.

## 13. Constraints and assumptions
- [Official] constraints in `AGENTS.md` §1.3.
- [Team] No login, Firebase only (PO decisions D-01, D-02).
- [Assume] The surprise problem may fit this concept. [Confirm]
- [Assume] Availability thresholds are not defined in the source rulebook; the defaults in `docs/Schema.md` §5 are recommendations.
- [Assume] Telemetry stays in browser memory (not persisted) for the MVP.

## 14. Dependencies
Firebase project (Spark), Firestore, Firebase AI Logic (Gemini Developer API), Hosting, optionally App Check; Antigravity; internet at venue.

## 15. MVP boundary
**In:** F-01 to F-10. **Stretch in priority order:** F-11 → F-12 → F-13 → F-14 → F-15 → F-16 → F-17 → F-18. **Out:** everything P3.
