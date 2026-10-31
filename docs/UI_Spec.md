# UI_Spec — UI/UX Specification

Judging weight for UX is 15% [Official]; the working product is 30%. Keep the UI simple and finish the Golden Path first.

## 1. Design direction
A calm, information-dense NOC dashboard: neutral surfaces, one accent color, status colors reserved for health. Clarity over decoration. No heavy animation, no gradients, no custom illustration. System font stack (no external font downloads).

## 2. Information architecture
Header → page title → primary content → supporting panels. Dashboard order: banner, "Try it" card, simulator controls, health summary, tower grid, incident feed.

## 3. Screen inventory
Dashboard, Incident list, Incident detail (P0); Sites, Tower detail, Analytics, Ingestion, Copilot (P1); Reports, Judge Mode overlay (P2). Routes in `docs/AppFlow.md` §2.

## 4. Layout and responsive behavior
| Viewport | Behavior |
|---|---|
| ≥ 1024 px | Header nav; dashboard 2-column (main + incident feed) |
| 640–1023 px | Single column; tower grid 3–4 columns |
| < 640 px | Single column; nav collapses to a menu button; tower grid 2 columns; tables become stacked cards; no horizontal page scroll (wide tables scroll inside their own container) |

## 5. Navigation and interaction patterns
Top nav with the current page marked (`aria-current`). Only built pages appear. Primary actions are buttons; navigation is links. Destructive/consequential actions (status change) use a confirmation dialog.

## 6. Component inventory
| Component | Responsibility | Pri |
|---|---|---|
| `DemoBanner` | Persistent "DEMO — SIMULATED DATA" notice | P0 |
| `TryItCard` | 4-step first-use guide | P0 |
| `SimulatorPanel` | Start/Stop, mode, Trigger incident | P0 |
| `HealthSummary` | Totals and counts by health | P0 |
| `TowerTile` / `TowerGrid` | Tower id, status icon + text, key metric | P0 |
| `IncidentFeed` / `IncidentTable` | List with severity and status badges | P0 |
| `EvidencePanel` | Metrics vs thresholds/baseline, last samples | P0 |
| `AiAnalysisPanel` | States: idle, loading, success, error, fallback | P0 |
| `StatusControl` + `ConfirmDialog` | Forward-only transitions | P0 |
| `StatusBadge`, `SeverityBadge`, `SimulatedTag`, `AiLabel` | Consistent markers | P0 |
| `Toast` / `InlineError` | Feedback | P0 |
| `MetricChart` (Recharts) | Time series | P1 |
| `UploadPanel`, `ValidationReport` | Upload + results | P1 |
| `CopilotChat` | Question + structured answer | P1 |
| `ReportView` | Report display | P2 |
| `JudgeGuide` | Guided steps | P2 |

## 7. Design tokens (practical level)
- **Spacing:** 4 px base scale (4, 8, 12, 16, 24, 32).
- **Type:** system stack; sizes 12 / 14 / 16 / 20 / 28; body ≥ 14 px; line-height ≥ 1.4.
- **Color roles:** surface, surface-alt, text, text-muted, border, accent, healthy (green), degraded (amber), critical (red), info (blue). All text/background pairs ≥ 4.5:1; UI component boundaries ≥ 3:1.
- **Status never relies on color alone:** each status has an icon and text label.
- **Radius/shadow:** one radius (8 px), minimal shadow.

## 8. Forms, validation, feedback
Inline validation with message linked to the field (`aria-describedby`); errors say what is wrong and how to fix it; submit buttons show pending state and disable during submission; toasts for success/failure; success only after confirmed operations.

## 9. State patterns
Use the tables in `docs/AppFlow.md` §7. AI analysis panel visual rules: AI content sits inside a bordered panel with an **AI-generated** label; observed facts and hypotheses are in **separate, clearly titled sections**; fallback content carries a **"Rule-based, not AI"** label.

## 10. Mobile behavior
Touch targets ≥ 44×44 px; sticky bottom action not required; dialogs fit small screens; keyboard does not hide the Copilot input.

## 11. Accessibility requirements
See `docs/Accessibility.md`. Summary: semantic landmarks and headings, labeled controls, visible focus, keyboard-operable dialogs with focus trap and Escape, live regions for async status, reduced-motion respected.

## 12. Microcopy guidance
Plain, specific, non-alarmist. Examples (suggested): "SIMULATED data — not from a real network." · "Possible cause (hypothesis, not confirmed)." · "AI analysis unavailable: request timed out. Retry or review the rule-based summary." · "Mark as Investigating? This updates the incident record only; it does not change the network."

## 13. Judge Mode and demo usability
P0 provides the `TryItCard` so a judge can run the Golden Path unaided. P2 adds `JudgeGuide` (`docs/Judge_Mode.md`).

## 14. Delivery-time guardrail
Do not add visual complexity (maps, animations, themes, custom icons) that threatens the Golden Path. Dark mode is out of scope.
