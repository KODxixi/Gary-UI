"""Harness 式轻量顶栏的静态回归守卫。"""

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class HarnessTopbarContractTests(unittest.TestCase):
    def test_topbar_uses_lightweight_harness_shell(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertIn('class="portal-topbar harness-topbar"', html)
        match = re.search(r"\.harness-topbar\s*\{(?P<body>[^}]+)\}", css)
        self.assertIsNotNone(match)
        self.assertIn("background: transparent", match.group("body"))
        self.assertIn("box-shadow: none", match.group("body"))

    def test_navigation_and_actions_use_harness_button_hierarchy(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertIn(".top-navigation {", css)
        self.assertIn("backdrop-filter: blur(14px)", css)
        self.assertIn(".top-nav-item:hover", css)
        self.assertIn(".top-nav-item:active", css)
        self.assertIn(".display-summary:hover", css)
        self.assertIn("transform: translateY(-1px)", css)
        self.assertIn("transform: scale(0.97)", css)

    def test_topbar_compacts_after_the_harness_scroll_threshold(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertIn('data-scroll-threshold="80"', html)
        self.assertIn(".portal-topbar.is-scrolled", css)
        self.assertIn(".portal-topbar::before", css)
        self.assertIn("window.scrollY > 80", source)
        self.assertIn('classList.toggle("is-scrolled"', source)
        self.assertIn("requestAnimationFrame", source)

    def test_mobile_navigation_uses_a_toggleable_menu(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")
        source = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertIn('id="topbar-menu-toggle"', html)
        self.assertIn('aria-controls="top-navigation"', html)
        self.assertIn('id="top-navigation"', html)
        self.assertIn(".top-navigation.is-open", css)
        self.assertIn('setAttribute("aria-expanded"', source)
        self.assertIn('classList.toggle("is-open"', source)


if __name__ == "__main__":
    unittest.main()
