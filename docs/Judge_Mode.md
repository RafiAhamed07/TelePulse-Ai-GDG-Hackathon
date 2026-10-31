# Judge_Mode — Specification

## 1. Is it useful and permitted?
Useful: judges have 2 minutes and may want to try the product. Permitted: the official rules do not mention or prohibit it [Confirm if unsure]. **Priority P2 (F-17).** The honest P0 substitute is the always-visible `TryItCard` and `SimulatorPanel` (F-09), so a judge can run the Golden Path unaided without Judge Mode.

## 2. Purpose and scope
A guided, honest walkthrough of the Golden Path on the real working app. It adds guidance and a reset; it does not add fake features or special data paths.

## 3. Entry and exit
Toggle in the header (P2 only). Exit via the same toggle or Escape. Not shown until built.

## 4. Guided sample scenario
Steps mirror GP-1…GP-6 (`docs/PRD.md` §9): trigger DHK-104 → watch incident → open → analyze → change status → refresh to see persistence. Each step highlights the real control; the user performs the action (no auto-click).

## 5. Sample data labeling
Everything is already simulated; the banner stays visible in Judge Mode. A "Guided demo" tag marks the session. No sample record is presented as live operator data.

## 6. One-click example and reset
- **One-click example:** the same **Trigger incident (DHK-104)** control, with a hint.
- **Reset:** creates a new `sessionId`, restarts the simulator in Normal mode, and hides earlier incidents by default. It does **not** delete Firestore documents (Rules forbid delete).

## 7. Real vs simulated
| Real | Simulated |
|---|---|
| Rule detection, Firestore writes, Gemini calls, validation, status workflow | Telemetry values, tower list, scenario timing |

## 8. How a judge verifies the Golden Path
Follow the guide; observe: incident created by rules with evidence; AI panel labeled with facts/hypotheses separate; status persists after refresh.

## 9. Failure fallback
If Gemini fails the guide points to the labeled fallback and Retry; it never skips or fakes a step.

## 10. If Judge Mode is not built
Use the P0 `TryItCard` (4 steps) as the judge-friendly path.
