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
        self.assertIn("@media (hover: hover) and (pointer: fine) {\n  .top-nav-item:hover", css)
        self.assertIn(".top-nav-item:active", css)
        self.assertIn(".display-summary:hover", css)
        self.assertIn("transform: scale(0.97)", css)
        self.assertNotIn("translate(-50%, -50%) scale(0)", css)
        self.assertNotRegex(css, r"\.top-nav-item:hover\s*\{[^}]*transform")

    def test_topbar_motion_and_accessibility_fallbacks_are_bounded(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        harness = css[css.index("/* Harness header state model") :]
        self.assertNotRegex(harness, r"(?:width|padding|border-radius)\s+[3-9]\d{2}ms")
        self.assertIn("opacity 180ms ease-out", harness)
        self.assertIn("transition-duration: 100ms", harness)
        self.assertIn("transition-property: color, background-color, border-color, opacity", harness)
        self.assertIn("@media (prefers-reduced-transparency: reduce)", harness)
        self.assertIn("@media (prefers-contrast: more)", harness)

    def test_runtime_motion_is_interruptible_and_pointer_depth_is_opt_in(self):
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertNotIn("view-enter", css)
        self.assertNotIn("harness-menu-in", css)
        self.assertNotRegex(css, r"transition\s*:\s*width\b")

        pointer_motion = css[css.index("/* Decorative pointer depth") :]
        pointer_motion = pointer_motion[: pointer_motion.index(".review-choice input:checked")]
        self.assertIn("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", pointer_motion)
        self.assertIn('html[data-gary-pointer-effects="on"]', pointer_motion)
        for selector in (".gary-button", ".review-choice", ".component-item", ".swatch-card", ".material-sample"):
            self.assertIn(selector, pointer_motion)

        reduced_motion = css[css.index("@media (prefers-reduced-motion: reduce)") :]
        reduced_motion = reduced_motion[: reduced_motion.index("@media", 1)]
        self.assertIn("transition-property: color, background-color, border-color, opacity", reduced_motion)
        self.assertIn(".copy-toast.is-visible", reduced_motion)
        self.assertIn("transform: none", reduced_motion)

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
