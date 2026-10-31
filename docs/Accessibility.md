# Accessibility — Checklist

Target: WCAG 2.1 AA as a goal. **No compliance is claimed until tested.** All "Status" cells start as `NOT RUN`; Antigravity fills them after manual checks it can actually perform (browser inspection, keyboard run, DevTools contrast/emulation).

| # | Area | Check | Status |
|---|---|---|---|
| A-01 | Semantic structure | One `h1` per page; ordered headings; landmarks (`header`, `nav`, `main`); lists/tables use correct elements | NOT RUN |
| A-02 | Keyboard | Every action reachable and operable by keyboard; logical tab order; no keyboard traps | NOT RUN |
| A-03 | Focus | Visible focus indicator on all controls; dialog traps focus, Escape closes, focus returns to trigger | NOT RUN |
| A-04 | Labels / names | Inputs have labels; icon-only buttons have accessible names; tower tiles announce id + status | NOT RUN |
| A-05 | Color contrast | Text ≥ 4.5:1; UI boundaries/icons ≥ 3:1; status never color-only (icon + text) | NOT RUN |
| A-06 | Touch targets | ≥ 44×44 px on mobile for buttons/links/tiles | NOT RUN |
| A-07 | Form errors | Errors adjacent to fields, linked via `aria-describedby`, specific and actionable | NOT RUN |
| A-08 | Async status | Loading, success, and error announced via `aria-live` regions (e.g., AI analysis, status change) | NOT RUN |
| A-09 | Responsive text/layout | Usable at 200% zoom and 375 px width; no horizontal page scroll; tables scroll within containers | NOT RUN |
| A-10 | Motion | Minimal animation; honor `prefers-reduced-motion`; no flashing | NOT RUN |
| A-11 | Charts (P1) | Charts have text summary or data table alternative | NOT RUN |
| A-12 | AI content | AI-generated label is text, not just color; facts and hypotheses sections have headings | NOT RUN |
| A-13 | Language | `lang` attribute set; Bengali Copilot text (if used) does not break layout | NOT RUN |

Manual checks Antigravity can realistically complete: keyboard-only Golden Path run, DevTools accessibility tree inspection, contrast spot checks, mobile emulation, reduced-motion emulation. Automated tools (if installed with PO approval) are supplementary only.
