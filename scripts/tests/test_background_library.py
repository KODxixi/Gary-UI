"""Gary-UI 可选动态背景库的最小契约守卫。"""

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class BackgroundLibraryContractTests(unittest.TestCase):
    def test_lab_advertises_the_three_css_backgrounds(self) -> None:
        source = (ROOT / "patterns" / "shared" / "background-lab.js").read_text(
            encoding="utf-8"
        )
        for value, label in (
            ("aurora-bloom", "极光薄雾"),
            ("prism-veil", "棱镜幕帘"),
            ("mercury-orbit", "银色轨道"),
        ):
            self.assertIn(value, source)
            self.assertIn(label, source)
        self.assertIn("玻璃友好", source)

    def test_css_backgrounds_have_theme_and_motion_fallbacks(self) -> None:
        css = (ROOT / "patterns" / "shared" / "background-lab.css").read_text(
            encoding="utf-8"
        )
        for value in ("aurora-bloom", "prism-veil", "mercury-orbit"):
            self.assertIn(f'data-gary-background="{value}"', css)
        self.assertIn("prefers-reduced-motion:reduce", css)
        self.assertIn('data-gary-background-motion="static"', css)
        self.assertIn("@media print", css)

    def test_background_lab_keeps_the_original_wave_engine(self) -> None:
        source = (ROOT / "patterns" / "shared" / "background-lab.js").read_text(
            encoding="utf-8"
        )
        self.assertIn("动态海浪（原版引擎）", source)
        self.assertIn("new URL('gradient-waves.js',base)", source)
        self.assertIn("preset='silver'", source)
        self.assertIn("gary-webgl-gradient-waves-1", source)
        for value in (
            "horizonColor:light?'#b8c1cb':'#455164'",
            "waveColor:light?'#627389':'#8193ab'",
            "crestColor:light?'#c1cad6':'#dbe4ef'",
            "speed:.1",
            "amplitude:2",
            "waveScale:1.35",
            "waveRatio:.6",
            "swell:0",
            "turbulence:50",
            "tilt:1.12",
            "zoom:1",
            "height:10",
            "fogDepth:20",
            "brightness:1.1",
            "opacity:light?.32:.47",
            "parallaxStrength:.85",
            "grain:true",
            "grainIntensity:.01",
        ):
            self.assertIn(value, source)

    def test_background_lab_removes_builtin_video_keeps_local_media(self) -> None:
        source = (ROOT / "patterns" / "shared" / "background-lab.js").read_text(
            encoding="utf-8"
        )
        # Builtin rotating-earth video was removed to keep the repo lean.
        self.assertNotIn("planet-earth-video", source)
        self.assertNotIn("地球旋转 · 外太空", source)
        self.assertNotIn("planet-earth-rotation.mp4", source)
        # Local media upload must remain — users can still pick their own video.
        self.assertIn('data-media-file', source)
        self.assertIn('video/mp4', source)
        # The bulky asset is gone from the tree.
        asset = ROOT / "assets" / "backgrounds" / "planet-earth-rotation.mp4"
        self.assertFalse(asset.is_file())


if __name__ == "__main__":
    unittest.main()
