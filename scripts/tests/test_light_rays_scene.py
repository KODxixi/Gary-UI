"""Light Rays 仅作为显式可选场景的回归守卫。"""

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class LightRaysSceneContractTests(unittest.TestCase):
    def test_portal_does_not_mount_light_rays_by_default(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")

        self.assertEqual(html.count('class="gary-scene portal-scene"'), 1)
        self.assertNotIn('data-gary-scene-engine="light-rays"', html)
        self.assertNotIn('<script src="./light-rays.js" defer></script>', html)

    def test_scene_uses_requested_official_default_parameters(self):
        source = (ROOT / "portal" / "light-rays.js").read_text(encoding="utf-8")

        for fragment in (
            'raysOrigin: "top-center"',
            'raysColor: "#ffffff"',
            "raysSpeed: 1",
            "lightSpread: 0.5",
            "rayLength: 3",
            "fadeDistance: 1",
            "saturation: 1",
            "followMouse: true",
            "mouseInfluence: 0.1",
            "noiseAmount: 0",
            "distortion: 0",
        ):
            self.assertIn(fragment, source)

        self.assertIn('getContext("webgl2"', source)
        self.assertNotIn("fetch(", source)

    def test_scene_has_reduced_motion_and_static_fallback_states(self):
        source = (ROOT / "portal" / "light-rays.js").read_text(encoding="utf-8")
        css = (ROOT / "portal" / "app.css").read_text(encoding="utf-8")

        self.assertIn('matchMedia("(prefers-reduced-motion: reduce)")', source)
        self.assertIn('sceneStatus = "reduced-motion"', source)
        self.assertIn('sceneStatus = "fallback"', source)
        self.assertIn("IntersectionObserver", source)
        self.assertIn('.portal-scene[data-scene-status="ready"]', css)
        self.assertIn('.portal-scene[data-scene-status="fallback"]', css)

    def test_legacy_scene_can_honor_explicit_motion_override(self):
        app = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")
        scene = (ROOT / "portal" / "light-rays.js").read_text(encoding="utf-8")

        self.assertIn('storage.get("gary-portal-scene-motion")', app)
        self.assertIn('new CustomEvent("gary:scene-motion-change"', app)
        self.assertIn('addEventListener("gary:scene-motion-change"', scene)
        self.assertIn('scene.dataset.motionOverride === "on"', scene)
        self.assertIn("reduceMotion.matches && !motionOverride", scene)

    def test_public_scene_contract_does_not_advertise_retired_light_rays(self):
        scene = json.loads((ROOT / "components" / "scene.json").read_text(encoding="utf-8"))
        variants = {item["name"]: item["selector"] for item in scene["variants"]}
        self.assertNotIn("light-rays", variants)


if __name__ == "__main__":
    unittest.main()
