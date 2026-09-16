"""已批准 Product Design 提案写入 GaryUI 母本的回归守卫。"""

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ApprovedProductDesignTokenTests(unittest.TestCase):
    def setUp(self):
        self.tokens = json.loads(
            (ROOT / "tokens" / "tokens.json").read_text(encoding="utf-8")
        )["tokens"]
        self.base_css = (ROOT / "tokens" / "base.css").read_text(encoding="utf-8")

    def test_approved_typography_spacing_and_radius_are_canonical(self):
        self.assertTrue(
            self.tokens["--gary-font-sans"]["value"].startswith('"Helvetica Neue", Helvetica, Arial')
        )
        self.assertEqual(
            self.tokens["--gary-density-layout-gap"]["balanced"], "8px"
        )
        self.assertEqual(self.tokens["--gary-radius-card"]["value"], "30px")

        self.assertIn('--gary-font-sans: "Helvetica Neue", Helvetica, Arial', self.base_css)
        self.assertIn('"Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑"', self.base_css)
        self.assertIn("--gary-density-layout-gap: 8px", self.base_css)
        self.assertIn("--gary-radius-card: 30px", self.base_css)

    def test_custom_card_tokens_and_component_variant_are_canonical(self):
        self.assertEqual(self.tokens["--gary-card-opacity"]["value"], "70%")
        self.assertEqual(
            self.tokens["--gary-card-hierarchy-contrast"]["value"], "8%"
        )
        self.assertIn("--gary-card-opacity: 70%", self.base_css)
        self.assertIn("--gary-card-hierarchy-contrast: 8%", self.base_css)

        contract = json.loads(
            (ROOT / "components" / "glass-card.json").read_text(encoding="utf-8")
        )
        variants = {item["name"]: item["selector"] for item in contract["variants"]}
        self.assertEqual(variants["custom"], '[data-card-style="custom"]')

        component_css = (ROOT / "components" / "components.css").read_text(
            encoding="utf-8"
        )
        self.assertIn('.gary-glass-card[data-card-style="custom"]', component_css)
        self.assertIn("var(--gary-card-opacity)", component_css)
        self.assertIn("var(--gary-card-hierarchy-contrast)", component_css)

    def test_apple_quality_layer_is_executable_across_adapters(self):
        self.assertEqual(self.tokens["--gary-duration-press"]["value"], "120ms")
        self.assertEqual(self.tokens["--gary-press-scale"]["value"], "0.97")
        self.assertEqual(self.tokens["--gary-tracking-title"]["value"], "-0.015em")
        self.assertIn("@media (prefers-reduced-transparency: reduce)", self.base_css)
        self.assertIn("@media (prefers-contrast: more)", self.base_css)

        component_css = (ROOT / "components" / "components.css").read_text(
            encoding="utf-8"
        )
        self.assertIn("(hover: hover) and (pointer: fine)", component_css)
        self.assertIn('html[data-gary-pointer-effects="on"]', component_css)
        self.assertIn("top:max(8px,env(safe-area-inset-top,0px))", component_css)

        react_css = (
            ROOT / "adapters" / "react-shadcn" / "src" / "styles" / "gary-ui.css"
        ).read_text(encoding="utf-8")
        self.assertIn("var(--gary-duration-press)", react_css)
        self.assertIn("@media (forced-colors: active)", react_css)

        system = json.loads(
            (ROOT / "spec" / "system.json").read_text(encoding="utf-8")
        )
        policy = system["appleQualityLayer"]
        self.assertEqual(policy["primaryMethodReference"], "apple-design")
        self.assertEqual(policy["surfacePolicy"]["maxGlassLayers"], 1)
        self.assertEqual(policy["motion"]["hover"], "fine-pointer-only-and-explicitly-enabled")

    def test_reduced_motion_keeps_non_spatial_feedback(self):
        self.assertNotIn("animation-duration: 0.01ms", self.base_css)
        self.assertNotIn("transition-duration: 0.01ms", self.base_css)

        component_css = (ROOT / "components" / "components.css").read_text(
            encoding="utf-8"
        )
        self.assertIn(
            "transition-duration:var(--gary-duration-fast)!important",
            component_css,
        )
        self.assertIn(
            "transition-property:color,background-color,border-color,box-shadow,opacity!important",
            component_css,
        )

        react_css = (
            ROOT / "adapters" / "react-shadcn" / "src" / "styles" / "gary-ui.css"
        ).read_text(encoding="utf-8")
        self.assertNotIn("animation-duration: .01ms", react_css)
        self.assertNotIn("transition-duration: .01ms", react_css)
        self.assertIn(
            "transition-property: color, background-color, border-color, box-shadow, opacity",
            react_css,
        )

    def test_react_button_hit_areas_and_progress_motion_follow_contract(self):
        button_source = (
            ROOT
            / "adapters"
            / "react-shadcn"
            / "src"
            / "components"
            / "ui"
            / "button.tsx"
        ).read_text(encoding="utf-8")
        self.assertIn('"h-11 gap-2 rounded-full', button_source)
        self.assertIn('icon: "size-11 ', button_source)
        self.assertIn('"icon-xs": "size-11 ', button_source)
        self.assertIn('"icon-sm": "size-11 ', button_source)

        react_css = (
            ROOT / "adapters" / "react-shadcn" / "src" / "styles" / "gary-ui.css"
        ).read_text(encoding="utf-8")
        self.assertNotRegex(react_css, r"transition\s*:\s*width\b")


if __name__ == "__main__":
    unittest.main()
