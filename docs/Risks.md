# Risks — Risk Register, Assumptions, Confirmations

L = likelihood, I = impact (H/M/L). Owner: PO = Product Owner, AG = Antigravity.

## 1. Risk register
| ID | Risk | L | I | Mitigation | Detection | Contingency | Owner |
|---|---|---|---|---|---|---|---|
| R-01 | Organizer rules may not allow bringing/using a pre-written documentation pack ("no pre-written code, templates, or old projects") | M | H | Docs contain no code; ask organizers before the event; do not use the pack if they object | Organizer reply | Delete pack; run Section 12 Steps A–C live | PO |
| R-02 | Surprise problem does not fit TelePulse | H | H | Phase 0 fit check; reuse patterns only | Phase 0 | Re-plan with Claude at the venue | PO |
| R-03 | Gemini quota/rate limit or model unavailable | M | H | User-initiated calls only; one call per incident; check quota in console early | 429 / error category | Labeled rule-based fallback; demo with a previously saved *real* analysis (labeled as saved) | AG |
| R-04 | AI Logic requires setup the team is unfamiliar with | M | H | Beginner guide in `HANDOVER.md` §6; PO sets up console items before Phase 4 | Phase 4 start | PO + Claude troubleshoot; if blocked, stop and ask PO (no backend approved) | PO |
| R-05 | Billing accidentally linked (Blaze) → changes Gemini free-tier behavior and cost | L | H | Stay on Spark; never link billing; explicit approval rule | Console plan indicator | Stop; PO review | PO |
| R-06 | Firestore Rules too open (no auth) | M | M | Rules per Schema §7; no open/test mode; D-04 option | Rules review, T-10/T-11 | Reduce writes; enable D-04 | AG |
| R-07 | Firestore Spark quota exceeded | L | M | Write only on incident/AI/status; no telemetry writes | Console usage | Switch to session-only display with banner | AG |
| R-08 | Schedule overrun | H | H | P0 first; cut list (Plan §5) | Phase checkpoints | Cut P2/P3 | PO |
| R-09 | Multi-tab/multi-user duplicates (each tab runs a simulator) | M | M | `sessionId` filter, deterministic IDs, dedup | Duplicate incidents in list | "Show all sessions" off by default | AG |
| R-10 | Gemini invents/misstates numbers | M | H | Numeric cross-check; facts vs hypotheses; code-computed values | Unverified badge | Hide analysis, show fallback | AG |
| R-11 | Prompt injection via Copilot question | M | M | Code-enforced operation allowlist; no free text from uploads | AI-09/AI-10 | Reject request | AG |
| R-12 | SPA deep link 404 on Hosting | M | M | Single-page rewrite; test deep link on live URL | T-13 | Fix config, redeploy | AG |
| R-13 | Venue Wi-Fi/Firebase/Gemini outage during demo | M | H | Fallback panel; screen recording of a *real earlier run*, labeled as recording [Confirm allowed] | Pre-demo check | Show recording + explain honestly | PO |
| R-14 | Env/config misconfigured in production | M | M | `.env.example` names; verify build on live URL | Console errors | Fix + redeploy | AG |
| R-15 | Secret committed (e.g., credentials file) | L | H | `.gitignore`; Git approval gate with scan | Pre-commit scan | Rotate credentials, purge history | AG/PO |
| R-16 | Browser-only logic can be tampered with (no trusted server) | H | L (demo) | Data simulated/non-private; documented | — | N/A for demo | PO |
| R-17 | Fake/dead controls reduce UX score | M | M | "No dead controls" rule; hide unbuilt pages | UX audit | Remove control | AG |
| R-18 | Antigravity unavailable/slow or quota-limited | L | H | Keep phases small; known-good checkpoint | Tool errors | PO + Claude help debug; manual fixes allowed [Official: any AI tools allowed] | PO |
| R-19 | Users upload real operator data (P1) | L | M | Warning on upload page; no persistence of rows; no free-text to Gemini | UI review | Remove upload | AG |
| R-20 | Judges cannot tell what is AI vs verified | M | M | Labels; separated sections | UX review | Adjust UI | AG |
| R-21 | Time zone/timestamp confusion | L | L | UTC everywhere, label "UTC" | Visual check | Fix formatting | AG |
| R-22 | Approval gates slow the build | M | M | Short reports; fixed templates; PO available | Phase timing | PO may approve multiple small steps explicitly | PO |

## 2. Source conflicts and resolutions
| Conflict | Sources | Resolution |
|---|---|---|
| FastAPI/Python/Cloud Run vs Firebase-only | Project rulebook vs PO answer (this chat) | **PO decision D-02: Firebase only.** Rulebook backend items superseded |
| Login/Demo Access page vs no login | Rulebook vs PO | **D-01: no login** |
| Authenticate before data reaches Gemini vs no login | Master prompt §4.4.1 vs PO | Cannot both hold. Documented exception D-03 (pending approval) |
| Telemetry stored in Firestore vs in memory | Rulebook vs plan | D-05 pending approval |
| ChatGPT excluded vs organizers allow any AI | Master prompt vs official PDF | Not a conflict: team decision to exclude |
| "GSD" mentioned | Master prompt only | Undefined; treated as optional task-organizing, no dependency |

## 3. Assumptions
A-1 Surprise problem may fit TelePulse (unverified). A-2 Availability thresholds (<98 warn, <95 critical) are recommendations. A-3 Firebase documentation on AI Logic/free tier was read from a snapshot that may be dated; verify. A-4 Event is 4–5 h; exact length unknown. A-5 The venue provides internet.

## 4. Unresolved questions
Which Gemini model to use today; Firestore Spark limits today; whether App Check fits in the time budget; whether PO wants anonymous sign-in (D-04).

## 5. Organizer confirmations required
1. May the documentation pack be brought and used at the venue? 2. May the team create the Firebase project/Google accounts in advance? 3. Exact build duration. 4. How "Smart use of … Antigravity" is judged and what evidence is expected. 5. Is a short recorded fallback allowed during the demo? 6. Is internet/Wi-Fi guaranteed? 7. Whether Firestore (in addition to Hosting) is acceptable (rules only mention Hosting as mandatory).

## 6. "Often Forgotten, We Will Check"
Ranked by impact vs effort. Status columns are blank until Antigravity actually performs and reports each check.
| Rank | ID | Check | Decision | Owner | Acceptance check | Est. | Status |
|---:|---|---|---|---|---|---:|---|
| 1 | OF-01 | Deployed URL (not localhost) tested end to end, including deep-link refresh | Must do | AG | Golden Path passes on live URL; `/incidents/:id` refresh loads | 10 min | |
| 2 | OF-02 | Success shown only after confirmed writes; no fake success | Must do | AG | Disable network → status change shows error, status unchanged | 10 min | |
| 3 | OF-03 | Exact numbers computed by code; AI numbers cross-checked | Must do | AG | Tampered AI number triggers unverified badge | 10 min | |
| 4 | OF-04 | Gemini failure fallback + double-click guard | Must do | AG | Forced failure shows labeled fallback; second click ignored in flight | 15 min | |
| 5 | OF-05 | First-use clarity (banner + Try-it card) | Must do | AG | A new person states purpose and next action in ~10 s | 10 min | |
| 6 | OF-06 | SIMULATED labeling everywhere | Must do | AG | Banner + per-record tag on dashboard, incident, report | 5 min | |
| 7 | OF-07 | Firestore Rules not in test/open mode | Must do | AG | Writes outside allowlist rejected | 10 min | |
| 8 | OF-08 | Duplicate incident prevention (tower, retries, tabs) | Must do | AG | Repeated trigger/refresh makes ≤ 1 active incident per tower per session | 10 min | |
| 9 | OF-09 | Phone viewport + keyboard-only run of Golden Path | Must do | AG | Completed at 375 px width without mouse | 15 min | |
| 10 | OF-10 | Evidence of Antigravity usage kept (phase reports/plan) for the 35% criterion | Must do | PO | Items collected and ready to show | 5 min | |
| 11 | OF-11 | Secret scan before any commit; no Gemini key anywhere | Must do | AG | Scan report clean; bundle search finds no key | 5 min | |
| 12 | OF-12 | Browser console and terminal clean on Golden Path | Must do | AG | Zero errors/unhandled rejections | 5 min | |
| 13 | OF-13 | Backup demo plan rehearsed (fallback panel, saved real analysis, recording) | Do if time remains | PO | Rehearsal done | 10 min | |
| 14 | OF-14 | Slow-network behavior (throttled) | Do if time remains | AG | Loading states appear; no duplicate writes on retry | 10 min | |
| 15 | OF-15 | Upload safety (type/size limits, malformed rows) | Do if time remains (P1 only) | AG | Bad rows listed, app stable | 10 min | |
| 16 | OF-16 | Authentication details (registration, MFA, reset, sessions) | Not applicable | — | No login in scope (D-01) | — | N/A |
| 17 | OF-17 | Field-level allowlist verified (only allowed fields in Gemini payload) | Must do | AG | Payload inspection shows allowlist only | 5 min | |

Scope-discipline item: **explicitly cut** maps, auth, backend, notifications, live NMS, dark mode.
