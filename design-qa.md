# Design QA — Archive

> Archive notice: this is a historical decision record, not the active Gary-UI specification. Current rules are defined by `DESIGN.md`, `spec/system.json`, and `docs/PUBLIC_RELEASE.md`.

final result: passed

## Approval

- Chat authorization: user approved merging the remaining Product Design decisions into the GaryUI canonical source.
- Visual route: `web-ui × data-page × dark × regular × balanced`.
- Baseline: the verified Product Design portal at `http://127.0.0.1:8878/portal/#product-design`; navigation, Light Rays visual language, page structure, and unrelated component styling remained locked.

## Sources

- Background: `https://reactbits.dev/backgrounds/light-rays`
- Navigation reference: `https://www.deepseek.com/harness/`
- Implementation: `http://127.0.0.1:8878/portal/#product-design`
- Source and implementation were captured in the Codex in-app browser at desktop width; implementation was additionally checked at `390 × 844`.

## Comparison result

- Product Design audit: the preview headline previously dominated the real Chinese sample, while the metric and decision cards sat too close in hierarchy. The headline was reduced from a 46px/720 ceiling to 40px/680; structure and copy were preserved.
- Proposal defaults: Noto Sans SC, 16px, 1.68, 0em, 8px, balanced density, and a custom 70% / 30px / 8% card are now the experiment's reset state.
- Scope guard: canonical changes are limited to the approved typography, balanced spacing, card geometry/custom variant, and scene-motion preference; unrelated visual regions remain unchanged.
- Canonical merge: the approved values are now present in `tokens/tokens.json` and synchronized to `tokens/base.css`; the previous proposal-only guard reports `approved-canonical` only while the lab values exactly match the canonical baseline.
- Custom card: the 70% / 30px / 8% decision is represented as a formal `GlassCard` custom variant, avoiding a global overwrite of every glass material.
- Motion: the scene still respects reduced motion by default; the Display menu can explicitly force Light Rays animation and persist the local choice.

- Background: replaced metallic folds with top-centered white rays on a low-saturation dark field. Official Light Rays defaults are preserved, with `lightSpread=0.5` and `rayLength=3` matching the inspected demo state.
- Topbar: removed the full-width thick glass capsule. Brand stays left, navigation is centered in a compact translucent pill, and the display action stays right.
- Buttons: active navigation uses the Harness-style light primary pill; inactive items use transparent secondary states with lift-on-hover and press feedback.
- Dynamic state: after `scrollY > 80`, the bar contracts from `1440px` to `1180px` at the tested wide viewport, the glass layer fades from 0 to 1, and the secondary kicker collapses.
- Mobile state: the horizontal strip is replaced by a labelled menu button and an accessible overlay menu; selecting a destination or pressing Escape closes it.
- Existing GaryUI navigation, popovers, Product Design controls, and unrelated component behavior remain functional.

## Browser gate

- Product Design desktop: computed body size `16px`, line height `26.88px` (16 × 1.68), layout gap `8px`, card radius `30px`; Noto Sans SC is first in the font stack; no horizontal overflow; console warnings/errors: 0.
- Product Design mobile `390 × 844`: body size `16px`, layout gap `8px`, card radius `30px`; no horizontal overflow.
- Generated canonical state reports `status: approved-canonical`; changing any lab value returns it to `proposal-only`.
- Target browser report: `--gary-control-height: 44px`; Noto Sans SC first; balanced gap `8px`; card radius `30px`; card opacity `70%`; hierarchy contrast `8%`; one global Portal Light Rays scene; nested glass count `0`; console warnings/errors `0`.
- Motion override: system-reduced state changed from `reduced-motion` to `ready` after activating the labelled toggle.

- Desktop `1569 × 912`: no horizontal overflow; one global Portal scene; one Light Rays canvas; `--gary-control-height: 44px`; no nested Gary glass; console warnings/errors: 0.
- Mobile `390 × 844`: no page overflow; the desktop navigation is replaced by the overlay menu; Light Rays canvas present; console warnings/errors: 0.
- Mobile `390 × 844` dynamic menu: closed state `aria-expanded=false`; open state `aria-expanded=true`, `display:flex`; no horizontal overflow.
- Current environment reports `prefers-reduced-motion`; default system mode renders a static frame, while the explicit override renders the live shader. WebGL-unavailable fallback remains covered by the static contract test.

## Resolved issues

- P2: preview headline overpowered the supplied real-content sample — resolved with a quieter size/weight ceiling.
- P2: experiment reset state did not reproduce the requested proposal — resolved, then promoted after explicit approval.
- P2: approved values existed only in the lab proposal — resolved by canonical token and component-contract promotion.
- P2: reduced-motion users had no explicit way to preview animation — resolved with a user-controlled override that defaults to system behavior.

- P1: heavy enclosing glass made the topbar compete with page content — resolved.
- P1: MoltenMetal did not match the requested background — resolved.
- P2: active and inactive navigation states lacked a clear primary/secondary hierarchy — resolved.
