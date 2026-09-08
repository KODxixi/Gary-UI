from __future__ import annotations

import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
import sys


SCRIPTS = Path(__file__).resolve().parents[1]
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import runtime_projection


class RuntimeProjectionTests(unittest.TestCase):
    def test_literal_manifest_paths_are_anchored_to_the_project_root(self) -> None:
        self.assertTrue(runtime_projection.matches("README.md", "README.md"))
        self.assertFalse(
            runtime_projection.matches(
                "adapters/visual/node_modules/example/README.md", "README.md"
            )
        )

    def test_manifest_selects_session_runtime_and_excludes_governance(self) -> None:
        manifest = runtime_projection.read_manifest()
        selected = runtime_projection.expand_selected(manifest)

        self.assertIn("session/index.html", selected)
        self.assertIn("contracts/task.schema.json", selected)
        self.assertIn("scripts/gary_ui.py", selected)
        self.assertIn("scripts/visual_adapter.py", selected)
        self.assertIn("spec/scene-recipes.json", selected)
        self.assertIn("contracts/visual-manifest.schema.json", selected)
        self.assertIn("adapters/visual/runtime/runner.cjs", selected)
        self.assertIn("adapters/visual/vendor/browser/echarts.min.js", selected)
        self.assertIn("adapters/visual/vendor/archify/bin/archify.mjs", selected)
        self.assertIn("adapters/visual/vendor/node/playwright-core/index.js", selected)
        self.assertIn(
            "examples/visuals/fresh-session-delivery/east-china-delivery-workflow.json",
            selected,
        )
        self.assertIn(
            "examples/visuals/evidence/archify-skill/final-remediation.md", selected
        )
        self.assertIn(
            "examples/visuals/evidence/transaction/transaction-report.json", selected
        )
        self.assertNotIn("portal/index.html", selected)
        self.assertNotIn("decisions/review-latest.json", selected)
        self.assertNotIn("scripts/tests/test_session_store.py", selected)
        self.assertNotIn("adapters/visual/runner.mjs", selected)
        self.assertNotIn("adapters/visual/tests/runner.test.mjs", selected)

    def test_build_produces_hash_identical_projection(self) -> None:
        manifest = runtime_projection.read_manifest()
        selected = runtime_projection.expand_selected(manifest)
        expected_hash = runtime_projection.projection_hash(manifest, selected)

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            copied = runtime_projection.copy_projection(selected, target)
            comparison = runtime_projection.compare(selected, target)

        self.assertEqual(copied, len(selected))
        self.assertEqual(comparison["missing"], [])
        self.assertEqual(comparison["hashMismatch"], [])
        self.assertEqual(comparison["runtimeOnly"], [])
        self.assertEqual(len(expected_hash), 64)

    def test_runtime_only_is_reported_and_never_deleted(self) -> None:
        manifest = runtime_projection.read_manifest()
        selected = runtime_projection.expand_selected(manifest)

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            runtime_projection.copy_projection(selected, target)
            orphan = target / "local-only.txt"
            orphan.write_text("keep", encoding="utf-8")
            comparison = runtime_projection.compare(selected, target)

            self.assertEqual(comparison["runtimeOnly"], ["local-only.txt"])
            self.assertTrue(orphan.is_file())

    def test_sync_removes_only_exact_manifest_retirements(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            retired = target / "nested" / "retired.txt"
            retained = target / "nested" / "retained.txt"
            retired.parent.mkdir(parents=True)
            retired.write_text("old", encoding="utf-8")
            retained.write_text("keep", encoding="utf-8")
            manifest = {"retireRuntimeFiles": ["nested/retired.txt"]}

            result = runtime_projection.remove_retired_runtime_files(manifest, target)

            self.assertEqual(result["removed"], ["nested/retired.txt"])
            self.assertFalse(retired.exists())
            self.assertTrue(retained.is_file())

    def test_retirement_rejects_globs_and_parent_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            for relative in ("nested/*.txt", "../escape.txt"):
                with self.assertRaises(runtime_projection.ProjectionError):
                    runtime_projection.remove_retired_runtime_files(
                        {"retireRuntimeFiles": [relative]}, target
                    )

    def test_check_reports_runtime_only_as_warning_not_drift(self) -> None:
        manifest = runtime_projection.read_manifest()
        selected = runtime_projection.expand_selected(manifest)

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            runtime_projection.copy_projection(selected, target)
            (target / "local-only.txt").write_text("orphan", encoding="utf-8")
            captured = io.StringIO()
            with contextlib.redirect_stdout(captured):
                exit_code = runtime_projection.main(
                    ["--runtime", str(target), "check"]
                )
            payload = json.loads(captured.getvalue())

        self.assertEqual(exit_code, 0)
        self.assertEqual(payload["status"], "pass")
        self.assertEqual(payload["comparison"]["runtimeOnly"], ["local-only.txt"])
        self.assertTrue(payload["warnings"])

    def test_check_with_missing_file_still_reports_drift(self) -> None:
        manifest = runtime_projection.read_manifest()
        selected = runtime_projection.expand_selected(manifest)

        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / "runtime"
            runtime_projection.copy_projection(selected, target)
            (target / "SKILL.md").unlink()
            captured = io.StringIO()
            with contextlib.redirect_stdout(captured):
                exit_code = runtime_projection.main(
                    ["--runtime", str(target), "check"]
                )
            payload = json.loads(captured.getvalue())

        self.assertEqual(exit_code, 1)
        self.assertEqual(payload["status"], "drift")
        self.assertIn("SKILL.md", payload["comparison"]["missing"])


if __name__ == "__main__":
    unittest.main()
