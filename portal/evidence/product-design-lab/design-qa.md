# Product Design Lab · Design QA

- Target: `portal/#product-design`
- Stack: HTML / CSS / JavaScript
- Theme / material / density: dark / regular / balanced
- Source visual: `source-portal-overview.png`
- Implementation desktop: `implementation-desktop.png`
- Implementation mobile: `implementation-mobile-390.png`
- Same-input comparison: `comparison-desktop.png`
- Desktop viewport: 1440 × 1000
- Mobile viewport: 390 × 844 browser viewport; 375px page client width after browser chrome and scrollbar
- State: default Product Design Lab view

## Visual comparison

- Preserved the GaryUI Portal top navigation, architectural scene, neutral glass hierarchy, radii, typography rhythm and left-top lighting direction.
- Added one new workbench view instead of creating a parallel design language or a second application shell.
- The three-column desktop layout follows the task sequence: tune parameters, observe the result, then formulate a Product Design instruction.
- At 390px the same sequence becomes one column, with no horizontal document overflow and no cropped control labels.
- Visible Scene count is 1. Visible nested glass count is 0.

## Interaction checks

- Font family, sample text, body size, Chinese line-height, letter spacing, layout gap and density update the live preview.
- The generated collaboration prompt and Token proposal update from the same state object.
- Prompt copy, Token proposal copy, preview tabs and reset are connected.
- The page exposes 18 native interactive controls and no positive `tabindex`; focus-visible styles are present. The in-app browser's synthetic Tab command did not advance focus, so tab traversal was assessed from native control semantics rather than claimed as a successful synthetic key event.

## Browser checks

- `tokens/base.css` loaded from the real local target.
- Computed `--gary-control-height` is `44px`.
- Desktop and 390px layouts have no horizontal document overflow.
- Browser console errors: 0.
- `target-browser-report.json` validates against `contracts/final-ui-report.schema.json`.

## Revision history

1. Matched the existing Portal visual baseline and added the lab as a first-class navigation view.
2. Verified live parameter controls and copy actions with realistic Chinese content.
3. Checked the desktop/mobile comparison and retained the default GaryUI hierarchy without a visual reset.

final result: passed
