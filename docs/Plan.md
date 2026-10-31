# Plan — Implementation Plan

Event time: **4–5 hours** [Official]. The exact duration is announced at the venue. This plan uses a 4-hour baseline (240 min incl. ~10 min buffer); with 5 hours, add the extra hour to Phase 3 (P1 features) and Phase 6. Times include the stop-and-approve gate (~2–3 min each). Estimates are planning guesses, not guarantees.

## 1. Strategy
P0 Golden Path first, deployed early enough to find configuration problems. Cut P2/P3 before P0 reliability. Never start a phase without PO approval.

## 2. Schedule
| Phase | Target | Goal |
|---|---:|---|
| 0 Documentation review + surprise-problem check | 15 min | Fit check, roadmap, questions. **No code** |
| 1 Foundation | 20 min | Vite + React shell, routing, design tokens |
| 2 UI | 35 min | P0 screens with states, responsive, no fake controls |
| 3 Core functionality | 55 min | Simulator, validation, analytics, detector, incident logic (in memory), dashboard wiring, status logic |
| 4 Gemini integration | 35 min | G1 diagnosis, validation, fallback |
| 5 Firebase integration | 25 min | Firestore persistence + Rules, AI Logic confirmed, (App Check if time), optional preview smoke deploy |
| 6 Quality audit | 25 min | Tests, a11y, security checks, fixes |
| 7 Deployment + demo rehearsal | 20 min | Live deploy, Golden Path on live URL, rehearse |
| Buffer | 10 min | |

## 3. Phase details
### Phase 0 — Review (no code)
Tasks: read all docs; run the surprise-problem check; list contradictions/gaps; confirm decisions D-03/D-04/D-05; list accounts and env var names; show the "Often Forgotten" list (`docs/Risks.md` §6). **DoD:** roadmap presented, questions answered, PO approval received.
### Phase 1 — Foundation
Tasks: create the project from scratch (React + Vite); routing with placeholder P0 routes; Tailwind; base layout; `DemoBanner`; create `.gitignore` and `.env.example`; run app. **DoD:** app runs locally; no secrets in repo; report + stop.
### Phase 2 — UI
Tasks: Dashboard layout, `TryItCard`, health summary and tile grid, incident feed/list, incident detail shell, AI panel states, status control + dialog, empty/loading/error states (with static states only), responsive. **DoD:** all P0 screens render at phone and laptop widths; no dead controls (unbuilt controls are hidden or labeled unavailable); browser-inspected.
### Phase 3 — Core functionality
Tasks: telemetry validation; thresholds config; simulator (20 towers, Normal/Incident, trigger, auto-end); baseline + health; detector (2 consecutive critical); incident factory + dedup + cooldown; live dashboard wiring; forward-only status logic (in memory until Phase 5). **DoD:** GP-1…GP-4 work locally; unit-level checks on validation/detector done (T-02…T-05).
### Phase 4 — Gemini
Tasks: AI Logic init (needs Firebase project with AI Logic enabled — PO sets up first); allowlist builder; G1 call with response schema; validation + numeric cross-check; timeout/retry/error mapping; fallback panel. Real-call tests only after the PO authorizes. **DoD:** GP-5 works; AI-01…AI-06 run and recorded.
### Phase 5 — Firebase
Tasks: Firestore init; incidents service; realtime listener; Rules per Schema §7; wire create/status/analysis to Firestore with confirmed-write UX; refresh persistence. P1 stretch: App Check. Optional: preview-channel smoke deploy (**separate PO approval**). **DoD:** GP-6 persists after refresh; Rules tested (T-10, T-11); no billing change.
### Phase 6 — Quality
Run `docs/Testing.md`, `docs/AI_Test_Cases.md`, `docs/Accessibility.md`; secret scan; console/terminal check; fix critical/high bugs. **DoD:** all must-pass tests recorded honestly; known issues listed.
### Phase 7 — Deployment + rehearsal
Confirm build/hosting config; ask approval; deploy; open the real URL; run the Golden Path there; verify deep-link refresh; rehearse `docs/Demo_Script.md` twice; note fallback. **DoD:** live URL verified by actual browser test; demo timed ≤ 2 min.

## 4. P1/P2 insertion (only if the Golden Path is stable)
Order: F-11 Analytics (in Phase 3/6 spare time) → F-12 Sites → F-13 Upload → F-14 Copilot → F-15 App Check → F-16 Reports → F-17 Judge Mode → F-18 warning incidents. Each addition needs PO approval; do not break approved functionality.

## 5. Cut list (when time runs short, cut in this order)
F-18 → F-17 → F-16 → F-14 → F-13 → F-12 → F-11 → F-15. Never cut: F-01…F-10.

## 6. Must not start without approval
Any phase; any Git commit/push; any deployment (including preview channels); any billing change; creation/selection of a Firebase project; real Gemini test calls; adding any new library/service; changing approved scope.

## 7. Often Forgotten, We Will Check — short checklist (full table: `docs/Risks.md` §6)
1. First-use clarity (banner + Try-it card). 2. Success shown only after confirmed writes. 3. Exact numbers by code, AI numbers cross-checked. 4. Gemini failure fallback + double-click guard. 5. Live URL tested, deep-link refresh. 6. Firestore Rules not in open mode. 7. SIMULATED labeling everywhere. 8. No duplicate incidents. 9. Phone viewport + keyboard. 10. Evidence of Antigravity usage kept for the 35% criterion. 11. Secret scan before any commit. 12. Console clean.
