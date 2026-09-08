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


if __name__ == "__main__":
    unittest.main()
