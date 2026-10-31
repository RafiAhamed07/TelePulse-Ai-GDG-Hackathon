# HANDOVER

> **WARNING: No one may expose or commit secrets.** No API keys, tokens, passwords, service-account files, or private keys in chat, code, logs, screenshots, docs, or Git.

## 1. Current status and phase checklist
Backend domain, services, Gemini AI integration, Firestore Security Rules, and teammate's React frontend are **fully integrated, passing all 8 Vitest test suites, building cleanly, and running live on `http://localhost:5173`**.
- [x] Phase 0 Review + surprise-problem check — [x] PO approved (D-01..D-05 confirmed)
- [x] Phase 1 Foundation — [x] verified on localhost — [ ] Git approved
- [x] Phase 2 UI — [x] Teammate frontend adapted & integrated with live backend adapters — [ ] Git approved
- [x] Phase 3 Core — [x] verified on localhost & Vitest (`T-01`..`T-05`, `T-17`) — [ ] Git approved
- [x] Phase 4 Gemini — [x] verified on localhost & Vitest (`AI-01`..`AI-15`, `T-06`..`T-08`) with `gemini-flash-lite-latest` — [ ] Git approved
- [x] Phase 5 Firebase — [x] `firestore.rules` (`SR-1`..`SR-6`) + `incidentsService` verified — [ ] Git approved
- [x] Phase 6 Quality — [x] Vitest suite passing (8/8 tests, 100%), production build clean, 0 TypeScript errors — [ ] Git approved
- [ ] Phase 7 Deployment — [ ] approved (deployment approval is separate)

## 2. Product summary and approved scope
TelePulse AI candidate: P0 features F-01…F-10, Golden Path in `docs/PRD.md` §9. **Approved by PO:** Firebase only (D-02), no login (D-01). **Pending PO approval:** D-03 (no-identity Rules / §4.4.1 exception), D-04 (optional anonymous sign-in), D-05 (telemetry in memory).

## 3. Official rules [verified against the Official Participant Guidelines PDF]
4–5 h build from scratch; surprise problem at timer start; no pre-written code/templates/old projects; Antigravity mandatory; Gemini core; Firebase Hosting mandatory; React + Vite recommended; any AI tools allowed; judging 30/35/10/15/10; 2-min demo + 1-min Q&A.

## 4. Architecture overview and files
See `docs/TRD.md`. Source files are created by Antigravity at the venue.

## 5. Required accounts and services
Google account; Firebase project (Spark); Firestore; Firebase AI Logic (Gemini Developer API); Hosting; App Check (P1); Antigravity access. No other third-party APIs.

## 6. Firebase beginner guide (console labels may differ slightly; verify on screen)
Who: **the PO personally signs in.** Do not paste any credentials into chat.
1. **Create project:** Firebase console → Add project → name it → turn Google Analytics **off** (not needed).
2. **Stay on Spark (no-cost).** Do **not** add a billing account. Linking billing changes Gemini free-tier behavior and can create charges.
3. **Add a web app:** Project overview → Web (`</>`) → register app → copy the config values into your local `.env` using the variable names in `docs/TRD.md` §11. (Firebase web config values are public client config, but still keep `.env` out of Git.)
4. **Firestore:** Build → Firestore Database → Create database → pick the nearest location (**cannot be changed later**) → start **locked (production mode)**. Rules from `docs/Schema.md` §7 are added in Phase 5. Never leave "test mode / allow all".
5. **AI Logic (Gemini):** Build → AI Logic → Get started → choose the **Gemini Developer API** provider → follow prompts. Check which models are listed and their limits. (This is what lets the app call Gemini without a key in the browser.)
6. **App Check (P1, optional):** Build → App Check → register the web app with a reCAPTCHA provider → note the site key (`VITE_APPCHECK_SITE_KEY`). For local testing use a debug token through the console flow; never put it in an env file or Git. Enforce only after confirming the app still works.
7. **Hosting:** Build → Hosting → Get started. Antigravity installs the Firebase CLI. You run `firebase login` (browser sign-in) yourself. `firebase init hosting`: use the existing project, public directory `dist`, configure as **single-page app (yes)**, do **not** set up automatic GitHub deploys.
8. **Deploy (only after approval):** `firebase deploy --only hosting`. Optional smoke test first: a **preview channel** (`firebase hosting:channel:deploy <name>`), also needs your approval.
9. **Verify:** open the real URL (usually `https://<project-id>.web.app`) and run the Golden Path; refresh on `/incidents/<id>`.

Glossary: **Hosting** serves your built website. **Firestore** is the cloud database. **AI Logic** lets your web app call Gemini safely through Firebase. **Spark** is the free plan. **Security Rules** are the server-side access rules for Firestore. **App Check** helps block requests that don't come from your app.

## 7. Environment variables (names only)
See `docs/TRD.md` §11. No secret variables. No Gemini key variable.

## 8. Run / test / build / deploy
Per `README.md`; commands are fixed by Antigravity at the venue. Tests in `docs/Testing.md`.

## 9. Gemini integration, quota, and cost
Through Firebase AI Logic; user-initiated; schema-validated. Firebase documentation (snapshot read while planning) says AI Logic is free of charge, the Gemini Developer API free tier needs the project **not** linked to Cloud Billing, and linking billing makes all Gemini usage pay-as-you-go. **Verify current limits, model availability, and region support before relying on them.**

## 10. Git workflow and approval gates
No automatic commits/pushes. After each approved phase Antigravity asks separately for Git permission, shows `git status`/diffs, scans for secrets, confirms `.gitignore`, then commits and reports the commit ID. Commit messages: Phase 1…7 as in `AGENTS.md` §9. **[Confirm]** Git allowed at the venue.

## 11. Known issues, risks, assumptions
See `docs/Risks.md`. Highlights: surprise-problem fit (R-02), pack usage permission (R-01), Gemini quota (R-03), no-auth Rules (R-06), duplicates across tabs (R-09).

## 12. Demo instructions and fallback
`docs/Demo_Script.md` (2-min script, Q&A, backup plan).

## 13. Often Forgotten, We Will Check (summary; full table in `docs/Risks.md` §6)
Must do: live URL + deep-link test (OF-01); confirmed-write success only (OF-02); exact numbers by code + AI cross-check (OF-03); Gemini fallback + double-click guard (OF-04); first-use clarity (OF-05); SIMULATED labeling (OF-06); Rules not open (OF-07); no duplicate incidents (OF-08); phone + keyboard (OF-09); Antigravity usage evidence (OF-10); secret scan (OF-11); clean console (OF-12); allowlist verified (OF-17). Do if time remains: backup rehearsal (OF-13), slow network (OF-14), upload safety (OF-15). Not applicable: authentication details (OF-16). **Not complete until Antigravity actually performs and reports them.**

## 14. Next actions
1. PO: answer D-03, D-04, D-05. 2. PO: ask organizers the confirmations in `docs/Risks.md` §5 (especially R-01). 3. At the venue: read the surprise problem; upload this pack to Antigravity only if allowed; start Phase 0; wait for approval before any code.
