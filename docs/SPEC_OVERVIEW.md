# TelePulse AI (working name)

> **Status: documentation only. No application exists yet.** The app will be built from scratch at the Build with AI Hackathon venue using Google Antigravity [Official]. This plan is a **candidate**: it must be checked against the surprise problem first (`AGENTS.md` §1.2).

## Product
**Monitor. Detect. Diagnose. Decide.** TelePulse AI turns simulated telecom tower telemetry into incidents and Gemini-assisted investigation for NOC teams.
- **Problem:** operators see many numbers but still have to work out what is wrong and what to check first.
- **Solution:** rule-based detection opens incidents; Gemini explains evidence, separates facts from hypotheses, and suggests checks; a human decides.

## Main features and Golden Path
P0 features F-01…F-10 (simulator, validation, anomaly detection, incidents, dashboard, Gemini diagnosis, status workflow, simulated-data labeling, Hosting deployment). Golden Path: open URL → trigger incident on DHK-104 → incident appears → open it → Analyze with Gemini → set Investigating/Resolved → status persists after refresh. See `docs/PRD.md`.

## Technology stack
React + Vite, Tailwind, Recharts · Firebase Hosting · Firestore (Spark plan) · Gemini via Firebase AI Logic · Google Antigravity. No backend, no login (PO decisions).

## High-level architecture
Browser app (simulator + pure-logic detection) → Firestore (incidents) and Firebase AI Logic → Gemini (allowlisted fields only). See `docs/TRD.md`.

## Prerequisites
Google account (signed in personally by the Product Owner), Firebase project on the **Spark** plan, Node.js and npm, Google Antigravity, Firebase CLI (installed at the venue). Beginner steps: `HANDOVER.md` §6.

## Local setup (placeholders only)
1. Antigravity creates the project at the venue.
2. Copy `.env.example` to `.env` and fill values locally. Never commit `.env`.
3. Variable names (no secret values here): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_APPCHECK_SITE_KEY`, `VITE_GEMINI_MODEL`, `VITE_DEMO_ORG_ID`, `VITE_SIM_INTERVAL_MS`. **There is no Gemini API key variable.**

## Run, test, build, deploy
Commands are determined by Antigravity when it creates the project (typical Vite scripts: dev, build, preview). Tests: `docs/Testing.md`. Deploy to Firebase Hosting **only after explicit PO approval**; verify the live URL.

## Firebase notes
Hosting (build output `dist`, single-page rewrite), Firestore (incidents/reports; Rules per `docs/Schema.md` §7), AI Logic (Gemini), App Check (P1). Stay on Spark; do not link billing.

## Gemini notes
User-initiated calls only; JSON schema output; validated; fallback labeled "not AI"; quotas and model availability must be checked at implementation time. `docs/API_Spec.md`.

## Security warnings
No secrets in code, chat, logs, or Git. Data is simulated; do not upload real operator data. No login means Firestore Rules are the only server-side control (D-03).

## Documentation index
`AGENTS.md`, `HANDOVER.md`, `docs/PRD.md`, `AppFlow.md`, `UI_Spec.md`, `TRD.md`, `Schema.md`, `API_Spec.md`, `Plan.md`, `Risks.md`, `Testing.md`, `AI_Test_Cases.md`, `Demo_Script.md`, `Judge_Mode.md`, `Accessibility.md`.

## Known limitations
Simulated data only; single demo organization; browser-only logic; no authentication; telemetry not persisted; nothing implemented or tested yet.
