# Demo_Script — Final Presentation

**Format [Official]:** 2-minute demo + 1-minute Q&A. **Judging weights [Official]:** Working live product 30%, Smart use of Gemini AI & Antigravity 35%, Firebase deployment 10%, UX 15%, Final presentation 10%.

> Valid only if TelePulse is the problem fit and the features below are actually implemented and tested. Do not demo anything unbuilt. Re-time after the real build.

## 1. Starting state
Live Firebase Hosting URL open in a fresh tab; Dashboard in Normal mode, 20 simulated towers; DEMO/SIMULATED banner visible; browser zoom set for readability; second tab ready with the Antigravity project/phase reports; backup assets ready (§5).

## 2. Timed script (≈ 260 spoken words)
| Time | Section | Say | Do |
|---|---|---|---|
| 0:00–0:18 | Problem | "Telecom operators watch thousands of numbers, but when a tower degrades, engineers still have to work out what is wrong and what to check first." | Show Dashboard |
| 0:18–0:36 | Solution | "TelePulse AI detects problems with deterministic rules, then uses Gemini to explain the evidence, separate facts from possible causes, and suggest what to investigate. Everything here is simulated data." | Point at banner and tower grid |
| 0:36–1:44 | **Live Golden Path** | "I'll trigger a degradation on tower DHK-104." … "Within seconds the rules detect sustained critical latency and packet loss and open an incident — numbers computed by code, not by AI." … "Now Gemini analyzes only the allowlisted measurements." … "Observed facts are separate from hypotheses, with confidence and what data is missing." … "I confirm Investigating — saved to Firestore; it survives a refresh." | GP-2 click Trigger → GP-3 incident appears → GP-4 open, show metrics vs baseline → GP-5 Analyze → read facts vs hypotheses → GP-6 set Investigating (confirm), refresh to show persistence |
| 1:44–1:58 | Technical credibility | "Gemini runs through Firebase AI Logic so no key is in the browser; outputs are schema-validated and numbers cross-checked; incidents persist in Firestore; deployed on Firebase Hosting; built phase by phase in Antigravity." | Switch briefly to Antigravity phase reports/plan (only what really exists) |
| 1:58–2:00 | Impact | "It's a prototype on simulated data: it shortens the path from raw readings to a first set of checks, with a human in control. We haven't measured time saved." | Return to incident view |

## 3. What judges should notice
Live deployed product (30%); structured Gemini output with fact/hypothesis separation and validation, plus Antigravity workflow evidence (35%); Firebase Hosting + Firestore persistence (10%/30%); clear UI with honest labels (15%).

## 4. Proof points
URL is `*.web.app`/Firebase Hosting [verify]; refresh keeps status; AI panel shows "AI-generated" label; no login needed.

## 5. Backup plan
| Failure | Action |
|---|---|
| Gemini error/quota | Show the labeled rule-based fallback and say so honestly; then show a **previously saved real analysis** on an older incident (stored in Firestore) |
| Firebase/Wi-Fi down | Play a short screen recording of a **real earlier run**, say clearly it is a recording [Confirm allowed] |
| Simulator misbehaves | Reload; use Judge Mode reset (if built) |
Never fake a result or claim a failed step worked.

## 6. Q&A (≈ 60 s) — likely questions and short honest answers
| Question | Answer |
|---|---|
| Is this real network data? | No. Simulated telemetry; upload accepts CSV/JSON (if built) for sample files; live operator integration is future work |
| What does Gemini actually do? | Explains a code-detected incident: facts vs hypotheses, impact from supplied fields, investigation steps. Counts and thresholds come from code |
| How do you stop hallucinations? | Allowlisted inputs, JSON schema, numeric cross-check, hypotheses labeled, fallback, human decides |
| Where is the API key? | There is none in the browser; calls go through Firebase AI Logic |
| Security without login? | Data are simulated and non-private; Firestore Rules restrict paths, fields, and deletes. Real deployments need authentication and roles |
| What if Gemini is down? | Labeled rule-based summary; we never present it as AI |
| What did Antigravity do? | We built phase by phase with approval gates; [state only what actually happened] |
| What's next? | Auth/roles, multi-operator, authorized live data feeds, persisted history |
| Limitations? | Browser-only logic, simulated data, single demo org, no remediation |
