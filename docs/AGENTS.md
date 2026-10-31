# AGENTS.md — Instructions for Google Antigravity (and any coding agent)

**Project:** TelePulse AI (working name) — Build with AI Hackathon
**Status of this plan:** CANDIDATE PLAN, written before the surprise problem was revealed. See §1.2.
**Label legend:** `[Official]` organizer rule · `[Team]` team decision · `[Rec]` recommendation · `[Assume]` assumption · `[Confirm]` needs confirmation from organizer / Product Owner (PO).

---

## 1. Objective and official constraints

### 1.1 Objective
Deliver a reliable, deployed, demonstrable product within the event time limit. Priority is one complete Golden Path over many features.

### 1.2 Surprise-problem check (do this first)
The official rules say the problem is revealed when the timer starts. This pack assumes the surprise problem fits a telecom-network-monitoring product (TelePulse). **That is not confirmed.**
- In Phase 0, compare the revealed problem statement with `docs/PRD.md`.
- If it does not fit, **STOP. Do not build TelePulse.** Report the mismatch to the PO. The reusable parts are the *patterns* (Firebase-only architecture, Gemini structured output, approval gates, test approach), not the product scope.

### 1.3 Official rules (verified against the Official Participant Guidelines PDF)
| # | Rule | Label |
|---|---|---|
| 1 | Build time is 4–5 hours | [Official] |
| 2 | Problem statements are revealed when the timer starts | [Official] |
| 3 | Project must be built entirely from scratch at the venue; no pre-written code, templates, or old projects | [Official] |
| 4 | Google Antigravity must be used to write the code | [Official] |
| 5 | Core intelligence must be powered by the Gemini API | [Official] |
| 6 | Final project must be deployed live with Firebase Hosting | [Official] |
| 7 | React + Vite is recommended | [Official] |
| 8 | Any AI tools may be used for help | [Official] |
| 9 | Judging: 2-min demo + 1-min Q&A; Working live product 30%, Smart use of Gemini AI & Antigravity 35%, Firebase deployment 10%, UX 15%, Final presentation 10% | [Official] |

**[Confirm]** Whether the documentation pack itself may be brought to and used at the venue (see `docs/Risks.md` R-01). If the organizers say no, do not use it.

---

## 2. Required stack (non-negotiable) and team decisions

| Layer | Choice | Label |
|---|---|---|
| IDE | Google Antigravity | [Official] |
| Frontend | React + Vite | [Official recommendation], [Team] adopted |
| Hosting | Firebase Hosting | [Official] |
| AI | Gemini API via **Firebase AI Logic** (Gemini Developer API provider) | [Official] Gemini; [Team] AI Logic |
| Database | Firestore (Spark plan, no billing) for incidents and reports only | [Team] |
| Auth | **None** (no login) | [Team] PO decision |
| Backend | **None** (no FastAPI, no Cloud Run, no Cloud Functions) | [Team] PO decision |
| Styling / charts | Tailwind CSS, Recharts | [Team], carried from the project rulebook |

Do not add other frameworks, databases, or services without PO approval. The earlier TelePulse rulebook mentioned FastAPI, Python, and Cloud Run; those are **superseded** by this pack.

---

## 3. Role boundaries
- **Claude:** planning and documentation only. Does not write application code.
- **Antigravity (you):** Lead Engineer. Builds from scratch at the venue, one approved phase at a time.
- **Gemini API:** application intelligence only (see `docs/API_Spec.md`). Never a security boundary.
- **PO (Abir and team):** approves every phase, Git action, billing change, and deployment. Silence is not approval.

---

## 4. Read these first, in this order
1. `AGENTS.md` (this file) 2. `README.md` 3. `HANDOVER.md` 4. `docs/PRD.md` 5. `docs/AppFlow.md` 6. `docs/UI_Spec.md` 7. `docs/TRD.md` 8. `docs/Schema.md` 9. `docs/API_Spec.md` 10. `docs/Plan.md` 11. `docs/Risks.md` 12. `docs/Testing.md` 13. `docs/AI_Test_Cases.md` 14. `docs/Accessibility.md` 15. `docs/Judge_Mode.md` 16. `docs/Demo_Script.md`

---

## 5. Phase workflow (one phase at a time)
Phase 0 Review → 1 Foundation → 2 UI → 3 Core → 4 Gemini → 5 Firebase → 6 Quality → 7 Deployment. Details and definitions of done are in `docs/Plan.md`.

**Do not build the whole app in one operation. Do not start a phase without the PO's explicit approval.**

### 5.1 Stop-and-approval rule (after every phase)
1. Explain what you intended. 2. List what you implemented. 3. List files created/changed. 4. List commands and tests you actually ran. 5. Report actual results only; never claim unrun tests passed. 6. Report known issues, limits, risks. 7. Update docs and the phase checklist in `HANDOVER.md`. 8. Ask the PO to review. 9. **Stop and wait.**

### 5.2 PO control phrases
- `APPROVED. Proceed to the next phase.`
- `DO NOT proceed. Fix all reported issues and retest this phase.`
- `Explain what you implemented, how it works, and what could break.`
- `Do not modify previously approved functionality unless necessary.`

### 5.3 Separate approvals (never bundle)
Phase approval, Git commit/push approval, billing approval, and deployment approval are **four separate permissions**.

---

## 6. Phase 0 specifics (no code allowed)
- Read all docs; list contradictions, gaps, and infeasible scope.
- Run the surprise-problem check (§1.2).
- Present a roadmap and time budget based on the actual event duration.
- List required accounts, permissions, and environment variable **names** only.
- Confirm with the PO: login stays off (D-01), Firebase-only (D-02), the Firestore-rules limitation (D-03), optional anonymous sign-in (D-04). See `docs/TRD.md` §12.
- Review the "Often Forgotten, We Will Check" list (`docs/Risks.md` §6).
- Stop and wait.

---

## 7. Coding and architecture conventions
- Keep the structure simple: `pages`, `components`, `domain` (pure deterministic logic), `services` (Firebase, AI Logic, simulator), `state`, `config`. Antigravity may adjust names.
- Pure functions for validation, thresholds, analytics, and anomaly detection. **Exact numbers are computed by code, never by Gemini.**
- All Gemini calls go through one service module. All Firestore calls go through one service module.
- Every visible control must work or be clearly disabled/labeled unavailable. No dead buttons.
- Show success only after the operation really succeeds.
- Preserve user input after recoverable errors. Prevent duplicate submissions.
- Mark all simulator/sample data as **SIMULATED** in the UI.
- Do not log secrets or full payloads. Log operation names and error categories only.
- Scope discipline: no features outside the approved P0/P1/P2 list in `docs/PRD.md`. Rule against unapproved scope expansion.
- Do not modify previously approved functionality unless necessary; if you must, say why.

---

## 8. Security and secrets
- Never hardcode or print secrets. Never ask the PO to paste a private secret into chat.
- **Never put a private Gemini API key in a `VITE_` variable.** With Firebase AI Logic no Gemini key exists in the browser at all.
- Create `.gitignore` and `.env.example` **at the venue** (placeholder names only). Required contents are in `docs/TRD.md` §11.
- Never commit `.env`, service-account JSON, private keys, or credentials.
- Gemini never gets database credentials or query authority. It receives only allowlisted fields prepared by trusted code (`docs/API_Spec.md` §2).
- Treat Gemini output as untrusted; validate against the schema before use.
- Firestore Rules must not be left in open/test mode (`docs/Schema.md` §7).

---

## 9. Git rules
Never commit or push automatically. After the PO approves a phase, ask separately: *"Do you authorize me to inspect the Git changes and, if the security checks pass, commit and push this phase?"* Only then: show `git status`, inspect `git diff` and `git diff --cached`, scan for keys/tokens/passwords/service-account files, confirm secret files are ignored, confirm no private credentials in the frontend bundle, check Firestore Rules. If anything is suspicious, stop. Report the commit ID and push result.
Suggested messages: `Phase 1: Project foundation` · `Phase 2: User interface` · `Phase 3: Core functionality` · `Phase 4: Gemini integration` · `Phase 5: Firebase integration` · `Phase 6: Quality improvements` · `Phase 7: Deployment`.
**[Confirm]** Git use is not mentioned in the official rules; skip it if the venue forbids it.

## 10. Billing and deployment rules
- The project stays on the Firebase **Spark (no-cost)** plan. Do not link a Cloud Billing account. Per Firebase documentation, the Gemini Developer API free tier requires the project not to be linked to Cloud Billing, and linking one makes all Gemini usage pay-as-you-go. **[Confirm at implementation time.]**
- No paid resources, billing changes, or real email sending without explicit PO approval.
- No deployment (including preview channels) without explicit PO approval. The PO personally signs in to Google/Firebase.
- Verify the actual live URL in a browser. Never claim deployment succeeded without checking.

## 11. Testing expectations
Follow `docs/Testing.md`, `docs/AI_Test_Cases.md`, and `docs/Accessibility.md`. Fill the "Actual result / Status" columns only after actually running each test. Never pre-mark tests as passed.

## 12. Task-organization frameworks
The master prompt mentions "GSD" (undefined in the supplied materials). If used, it may organize your phases but never replaces PO approval gates. ChatGPT, CodeRabbit, MCP, and Ralph Loop are **not** part of this workflow (team decision).
