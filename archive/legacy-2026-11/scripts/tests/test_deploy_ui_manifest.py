"""deploy.py 的 ui target 必须与 runtime/manifest.json 的 exclude 语义一致。

旧实现按整树复制（仅跳过 SKIP_PARTS），把 portal/、decisions/、provenance/、
scripts/tests/、CHANGELOG.md 等 manifest 明确 exclude 的文件也部署进 runtime。
本测试把该不一致固定为回归：ui target 的选择器必须跳过 manifest-excluded 文件。
"""

from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
GOVERNANCE = Path(__file__).resolve().parents[4] / "tools" / "governance"
for directory in (GOVERNANCE, SCRIPTS):
    if str(directory) not in sys.path:
        sys.path.insert(0, str(directory))

import deploy  # noqa: E402


class DeployUiManifestExcludeTests(unittest.TestCase):
    def test_ui_target_skips_manifest_excluded_files(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            library = root / "library"
            home = root / "home"
            source = library / "UI" / "gary-ui"
            for relative in (
                "runtime",
                "session",
                "scripts",
                "portal",
                "decisions",
                "examples/co-design",
            ):
                (source / relative).mkdir(parents=True, exist_ok=True)
            (source / "runtime" / "manifest.json").write_text(
                json.dumps(
                    {
                        "include": [
                            "SKILL.md",
                            "session/index.html",
                            "scripts/gary_ui.py",
                            "examples/co-design/**/*",
                        ],
                        "exclude": ["portal/**", "decisions/**", "CHANGELOG.md"],
                    }
                ),
                encoding="utf-8",
            )
            (source / "SKILL.md").write_text("skill", encoding="utf-8")
            (source / "session" / "index.html").write_text("ui", encoding="utf-8")
            (source / "scripts" / "gary_ui.py").write_text("script", encoding="utf-8")
            (source / "portal" / "index.html").write_text("portal", encoding="utf-8")
            (source / "decisions" / "review-latest.json").write_text(
                "{}", encoding="utf-8"
            )
            (source / "CHANGELOG.md").write_text("log", encoding="utf-8")
            (source / "examples" / "co-design" / "demo.html").write_text(
                "demo", encoding="utf-8"
            )

            plan = deploy.build_plan(library, home)
            entry = plan["ui"][0]
            files = deploy._source_files(entry, library)

        self.assertIn("SKILL.md", files)
        self.assertIn("session/index.html", files)
        self.assertIn("scripts/gary_ui.py", files)
        self.assertNotIn("portal/index.html", files)
        self.assertNotIn("decisions/review-latest.json", files)
        self.assertNotIn("CHANGELOG.md", files)
        # 未进入 exclude 的非权威文件仍照旧部署（最小改动语义）
        self.assertIn("examples/co-design/demo.html", files)

    def test_ui_target_consistent_with_live_manifest_excludes(self) -> None:
        library_root = Path(deploy.__file__).resolve().parents[2]
        plan = deploy.build_plan(library_root, Path.home())
        entry = plan["ui"][0]
        files = deploy._source_files(entry, library_root)

        for excluded in (
            "portal/index.html",
            "decisions/review-latest.json",
            "provenance/source-manifest.json",
            "scripts/tests/test_runtime_projection.py",
            "scripts/apply_review.py",
            "scripts/sync_runtime.py",
            "scripts/runtime_projection.py",
            "scripts/validate.py",
            "scripts/validate_v2.py",
            "adapters/react-shadcn/dist/index.js",
            "adapters/react-shadcn/package-lock.json",
            "adapters/react-shadcn/THIRD_PARTY_NOTICES.md",
            "CHANGELOG.md",
            "THIRD_PARTY_NOTICES.md",
        ):
            self.assertNotIn(excluded, files)
        for included in (
            "SKILL.md",
            "session/index.html",
            "tokens/tokens.json",
            "adapters/react-shadcn/src/components/ui/button.tsx",
            "scripts/gary_ui.py",
        ):
            self.assertIn(included, files)


if __name__ == "__main__":
    unittest.main()
