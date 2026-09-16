"""Gary-UI 纯色点阵默认 Scene 的回归守卫。"""

import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class DotGridSceneContractTests(unittest.TestCase):
    def test_global_defaults_are_pure_black_white_and_ultrathin(self):
        tokens = json.loads((ROOT / "tokens" / "tokens.json").read_text(encoding="utf-8"))
        system = json.loads((ROOT / "spec" / "system.json").read_text(encoding="utf-8"))
        metadata = json.loads((ROOT / "metadata.json").read_text(encoding="utf-8"))

        self.assertEqual(tokens["tokens"]["--gary-surface-page"]["dark"], "#000000")
        self.assertEqual(tokens["tokens"]["--gary-surface-page"]["light"], "#ffffff")
        self.assertEqual(tokens["tokens"]["--gary-scene-image"]["value"], "none")
        self.assertEqual(system["visualAxes"]["defaults"]["material"], "ultrathin")
        self.assertEqual(
            system["visualAxes"]["viewportBaseline"],
            {
                "width": 1920,
                "height": 1080,
                "aspectRatio": "16:9",
                "priority": "primary",
                "responsiveFallbacks": "secondary",
            },
        )
        self.assertEqual(metadata["defaultScene"], "dot-grid")
        self.assertIsNone(metadata["defaultBackground"])
        self.assertEqual(metadata["defaultMaterial"], "ultrathin")

    def test_portal_mounts_one_local_dot_grid_without_default_photo(self):
        html = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
        app = (ROOT / "portal" / "app.js").read_text(encoding="utf-8")

        self.assertEqual(html.count('class="gary-scene portal-scene"'), 1)
        self.assertIn('data-gary-scene-engine="dot-grid"', html)
        self.assertIn('<script src="../patterns/shared/dot-grid.js" defer></script>', html)
        self.assertNotIn('<script src="./light-rays.js"', html)
        self.assertIn("defaultBackground: null", app)
        self.assertIn('material: "ultrathin"', app)

    def test_dot_grid_is_local_pointer_interactive_and_reduced_motion_safe(self):
        source = (ROOT / "patterns" / "shared" / "dot-grid.js").read_text(encoding="utf-8")

        self.assertIn('getContext("2d"', source)
        self.assertIn('addEventListener("pointermove"', source)
        self.assertIn('matchMedia("(prefers-reduced-motion: reduce)")', source)
        self.assertIn('setStatus(reduced ? "reduced-motion" : "ready")', source)
        self.assertIn("requestAnimationFrame", source)
        self.assertIn("new MutationObserver", source)
        self.assertIn("const initialized = new WeakSet()", source)
        self.assertNotIn("fetch(", source)
        self.assertNotIn("gary-default-scene.png", source)

    def test_scene_contract_registers_dot_grid_as_default(self):
        scene = json.loads((ROOT / "components" / "scene.json").read_text(encoding="utf-8"))
        variants = {item["name"]: item["selector"] for item in scene["variants"]}

        self.assertEqual(scene["material"]["default"], "One local interactive dot grid over a pure theme background")
        self.assertEqual(variants["dot-grid"], '[data-gary-scene-engine="dot-grid"]')


if __name__ == "__main__":
    unittest.main()
