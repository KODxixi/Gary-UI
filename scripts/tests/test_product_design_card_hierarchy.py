"""Product Design 实验室卡片层级的静态回归守卫。"""

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ProductDesignCardHierarchyTests(unittest.TestCase):
    def test_side_panels_share_the_same_regular_glass_material(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")

        self.assertIn(
            'class="pd-controls portal-surface gary-glass gary-regular"', html
        )
        self.assertIn(
            'class="pd-guide portal-surface gary-glass gary-regular"', html
        )

    def test_preview_stage_is_the_only_solid_outer_panel(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")

        self.assertEqual(html.count('class="pd-preview-frame gary-solid-plate"'), 1)
        self.assertIn(
            'class="pd-live-preview gary-glass gary-regular"', html
        )

    def test_preview_stage_uses_one_quiet_fill_without_decorative_gradient(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")
        match = re.search(r"\.pd-preview-frame\s*\{(?P<body>[^}]+)\}", css)

        self.assertIsNotNone(match)
        body = match.group("body")
        self.assertIn("padding: 12px", body)
        self.assertIn("background: var(--portal-plate)", body)
        self.assertNotIn("gradient", body)

    def test_internal_cards_share_one_edge_and_fill_rule(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertIn(
            ".pd-live-tabs,\n.pd-live-metrics > div,\n.pd-live-decision,\n.pd-prompt-card",
            css,
        )
        self.assertIn("--pd-inner-fill: var(--portal-track)", css)
        self.assertIn("background: var(--pd-inner-fill)", css)
        self.assertIn("box-shadow: none", css)

    def test_card_style_tuner_exposes_three_presets_and_three_sliders(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")

        for preset in ("unified-glass", "layered", "minimal-solid"):
            self.assertIn(f'data-pd-card-preset="{preset}"', html)
        for slider in ("pd-card-opacity", "pd-card-radius", "pd-card-contrast"):
            self.assertIn(f'id="{slider}"', html)

    def test_card_style_controls_update_preview_and_proposal_only(self):
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertIn("const productDesignCardPresets", source)
        self.assertIn('preview.style.setProperty("--lab-card-opacity"', source)
        self.assertIn('preview.style.setProperty("--lab-card-radius"', source)
        self.assertIn('preview.style.setProperty("--lab-card-contrast"', source)
        self.assertIn('"pd-card-opacity": "cardOpacity"', source)
        self.assertIn('"pd-card-radius": "cardRadius"', source)
        self.assertIn('"pd-card-contrast": "cardContrast"', source)
        self.assertIn("surfaces:", source)
        self.assertIn('"approved-canonical" : "proposal-only"', source)

    def test_card_style_css_uses_preview_scoped_variables(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertIn("--lab-card-opacity: 70%", css)
        self.assertIn("--lab-card-radius: 30px", css)
        self.assertIn("--lab-card-contrast: 8%", css)
        self.assertIn("var(--lab-card-opacity)", css)
        self.assertIn("var(--lab-card-radius)", css)
        self.assertIn("var(--lab-card-contrast)", css)

    def test_requested_values_are_the_proposal_only_defaults(self):
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        expected_defaults = (
            'font: "gary"',
            "fontWeight: 400",
            "layoutGap: 8",
            'density: "balanced"',
            'cardPreset: "custom"',
            "cardOpacity: 70",
            "cardRadius: 30",
            "cardContrast: 8",
        )
        for marker in expected_defaults:
            self.assertIn(marker, source)
        self.assertIn('"approved-canonical" : "proposal-only"', source)
        self.assertIn(': "用户确认后，才可写入 GaryUI 正式 Token"', source)

    def test_bilingual_font_stack_and_rich_text_weight_control_are_wired(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="pd-font-weight"', html)
        self.assertIn('min="100" max="900" step="100" value="400"', html)
        self.assertIn('--portal-font: var(--gary-font-sans)', css)
        tokens_css = (ROOT / "tokens" / "base.css").read_text(encoding="utf-8")
        self.assertIn('"Helvetica Neue", Helvetica, Arial', tokens_css)
        self.assertIn('"Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑"', tokens_css)
        self.assertIn("--lab-font-weight: 400", css)
        self.assertIn("font-weight: var(--lab-font-weight)", css)
        self.assertIn('preview.style.setProperty("--lab-font-weight"', source)
        self.assertIn('"pd-font-weight": "fontWeight"', source)

    def test_exact_canonical_values_report_approved_while_edits_return_to_proposal(self):
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertIn("function productDesignMatchesCanonical", source)
        self.assertIn(
            'status: canonicalMatch ? "approved-canonical" : "proposal-only"',
            source,
        )
        self.assertIn(
            'canonicalMatch\n        ? "已由用户确认并写入 GaryUI 正式 Token"',
            source,
        )

    def test_preview_heading_is_quieter_than_the_real_body_sample(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")
        match = re.search(r"\.pd-live-header h4\s*\{(?P<body>[^}]+)\}", css)

        self.assertIsNotNone(match)
        body = match.group("body")
        self.assertIn("font-size: clamp(28px, 2.5vw, 40px)", body)
        self.assertIn("font-weight: 680", body)


if __name__ == "__main__":
    unittest.main()
