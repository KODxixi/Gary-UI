from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RECIPE_ROOT = ROOT / "patterns" / "recipes" / "decision-report"
TEXTURE_ASSET = (
    ROOT
    / "assets"
    / "textures"
    / "b-ridge-current-10-200-10-105-055-v1.svg"
)

DISTRIBUTION_FILES = (
    "shell.html",
    "decision-report.bundle.css",
    "decision-report.bundle.js",
)

BUSINESS_PATTERNS = (
    r"(?i)(?:^|[^a-z0-9])dds(?:[^a-z0-9]|$)",
    r"(?i)\bEvidencePackage\b",
    r"(?i)\bReportDocument\b",
    r"(?i)\bDDSReportRuntime\b",
    r"(?i)\bvalidated_for_decision\b",
    r"(?i)\bsource_admission_policy\b",
    r"(?i)\bunit_status\b",
    r"(?i)\bsource_refs\b",
    r"(?i)\bdecision_gate\b",
)

ABSOLUTE_OR_EXTERNAL_PATTERNS = (
    r"(?i)\bhttps?://",
    r"(?i)\bfile://",
    r"(?i)(?:^|[\s\"'(=])[a-z]:[\\/]",
    r"\\\\",
)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def projection_hash(file_hashes: dict[str, str]) -> str:
    digest = hashlib.sha256()
    for name in sorted(file_hashes):
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(file_hashes[name].encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


class DecisionReportRecipeTests(unittest.TestCase):
    def read_recipe_text(self, name: str) -> str:
        path = RECIPE_ROOT / name
        self.assertTrue(path.is_file(), f"missing recipe file: {name}")
        return path.read_text(encoding="utf-8")

    def test_distribution_files_exist(self) -> None:
        missing = [
            name for name in DISTRIBUTION_FILES if not (RECIPE_ROOT / name).is_file()
        ]

        self.assertEqual(missing, [])

    def test_profile_pins_the_exact_distribution_hashes(self) -> None:
        profile = json.loads((RECIPE_ROOT / "profile.json").read_text(encoding="utf-8"))
        self.assertIn("distribution", profile)
        distribution = profile["distribution"]
        entrypoints = distribution["entrypoints"]

        self.assertEqual(
            entrypoints,
            {
                "shell": "shell.html",
                "styles": "decision-report.bundle.css",
                "controller": "decision-report.bundle.js",
            },
        )
        self.assertTrue(distribution["offline"])
        self.assertEqual(distribution["externalDependencies"], [])

        expected_hashes = {
            name: sha256(RECIPE_ROOT / name) for name in DISTRIBUTION_FILES
        }
        actual_hashes = {
            name: value["sha256"]
            for name, value in distribution["files"].items()
        }
        self.assertEqual(actual_hashes, expected_hashes)
        self.assertEqual(
            distribution["projectionHash"],
            projection_hash(expected_hashes),
        )

    def test_distribution_exposes_neutral_shell_and_controller_contract(self) -> None:
        shell = self.read_recipe_text("shell.html")
        css = self.read_recipe_text("decision-report.bundle.css")
        controller = self.read_recipe_text("decision-report.bundle.js")

        for marker in (
            'data-gary-recipe="decision-report"',
            'data-gary-application-mode="scroll-report"',
            "data-gary-report-deck",
            "data-gary-report-sources",
            "data-gary-report-mode-target",
        ):
            self.assertIn(marker, shell)
        self.assertEqual(shell.count("gary-scene"), 1)
        for marker in (
            "--gary-control-height: 44px;",
            ".gary-decision-report",
            ".gary-decision-report__page",
            ".gary-decision-report__decision",
            ".gary-decision-report__conclusion",
            '[data-gary-report-mode="presentation"]',
            "aspect-ratio: 16 / 9",
            "@media print",
            "prefers-reduced-motion",
        ):
            self.assertIn(marker, css)
        self.assertIn("globalThis.GaryDecisionReport", controller)
        self.assertIn("mount(root", controller)

    def test_profile_and_example_lock_the_approved_ridge_texture(self) -> None:
        profile = json.loads((RECIPE_ROOT / "profile.json").read_text(encoding="utf-8"))
        self.assertEqual(
            profile["texture"],
            {
                "id": "b-ridge-current",
                "theme": "dark",
                "rendering": "deterministic-static-svg",
                "strengthPct": 10,
                "densityPer1000Px": 200,
                "disturbancePct": 10,
                "curvaturePct": 105,
                "strokePx": 0.55,
                "repeat": "none",
                "animation": False,
                "asset": "../../../assets/textures/b-ridge-current-10-200-10-105-055-v1.svg",
            },
        )

        self.assertTrue(TEXTURE_ASSET.is_file(), f"missing texture: {TEXTURE_ASSET}")
        texture = TEXTURE_ASSET.read_text(encoding="utf-8")
        for marker in (
            'data-texture="b-ridge-current"',
            'data-strength-pct="10"',
            'data-density-per-1000-px="200"',
            'data-disturbance-pct="10"',
            'data-curvature-pct="105"',
            'data-stroke-px="0.55"',
            'stroke-width="0.55"',
            'stroke-opacity="0.10"',
            'vector-effect="non-scaling-stroke"',
        ):
            self.assertIn(marker, texture)
        self.assertNotRegex(texture, r"(?i)<(?:script|animate|filter|pattern|circle|ellipse)\b")
        self.assertNotRegex(texture, r"(?i)\bZ\b")

        css = self.read_recipe_text("decision-report.css")
        self.assertIn(
            '--decision-report-texture-image: url("../../../assets/textures/'
            'b-ridge-current-10-200-10-105-055-v1.svg");',
            css,
        )
        self.assertIn("var(--decision-report-texture-image)", css)
        self.assertIn("background-repeat: no-repeat", css)
        self.assertIn("max(100%, 120rem) 12288px", css)

    def test_recipe_distribution_has_no_business_contract_vocabulary(self) -> None:
        checked = (
            *DISTRIBUTION_FILES,
            "profile.json",
            "README.md",
        )

        for name in checked:
            text = self.read_recipe_text(name)
            for pattern in BUSINESS_PATTERNS:
                with self.subTest(file=name, pattern=pattern):
                    self.assertIsNone(re.search(pattern, text))

    def test_distribution_has_no_absolute_or_external_dependencies(self) -> None:
        for name in DISTRIBUTION_FILES:
            text = self.read_recipe_text(name)
            for pattern in ABSOLUTE_OR_EXTERNAL_PATTERNS:
                with self.subTest(file=name, pattern=pattern):
                    self.assertIsNone(re.search(pattern, text))

        shell = self.read_recipe_text("shell.html")
        css = self.read_recipe_text("decision-report.bundle.css")
        controller = self.read_recipe_text("decision-report.bundle.js")

        self.assertNotRegex(shell, r"(?i)<(?:link|script)\b[^>]*(?:href|src)=")
        self.assertNotRegex(css, r"(?i)@import\b|url\s*\(")
        self.assertNotRegex(
            controller,
            r"(?i)\b(?:fetch|XMLHttpRequest|WebSocket)\b|"
            r"\bimport\s*(?:\(|[\"'{*])",
        )
        self.assertNotIn("</style", css.casefold())
        self.assertNotIn("</script", controller.casefold())


if __name__ == "__main__":
    unittest.main()
