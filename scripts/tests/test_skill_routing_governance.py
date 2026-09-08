from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LIBRARY = ROOT.parents[1] / "skills"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def frontmatter_name(path: Path) -> str:
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("name:"):
            return line.split(":", 1)[1].strip().strip('"')
    raise AssertionError(f"missing skill name: {path}")


def test_official_antv_skills_are_pinned_and_routed_without_copying_engine() -> None:
    lock = json.loads(
        (ROOT / "adapters" / "visual" / "toolchain.lock.json").read_text(
            encoding="utf-8"
        )
    )
    antv = lock["antvInfographicSkills"]
    assert antv["repository"] == "https://github.com/antvis/Infographic"
    assert antv["commit"] == "2ea1894255e4002c7735586778be86d13ec30346"
    assert antv["packageVersion"] == "0.2.20"

    expected = {
        "infographic-creator": ["SKILL.md"],
        "infographic-syntax-creator": ["SKILL.md", "references/prompt.md"],
    }
    for name, files in expected.items():
        root = LIBRARY / name
        assert frontmatter_name(root / "SKILL.md") == name
        for relative in files:
            artifact = root / relative
            assert artifact.is_file()
            assert sha256(artifact) == antv["files"][name][relative]
        assert not (root / "node_modules").exists()

    capabilities = json.loads(
        (ROOT / "adapters" / "visual" / "capabilities.json").read_text(
            encoding="utf-8"
        )
    )
    skill = capabilities["engines"]["antv-infographic"]["skills"]
    assert skill["renderedDeliverable"] == "infographic-creator"
    assert skill["syntaxOnly"] == "infographic-syntax-creator"
    assert "local" in skill["garyOverride"].lower()


def test_kanban_trigger_and_layout_rules_are_contextual() -> None:
    text = (LIBRARY / "kanban" / "SKILL.md").read_text(encoding="utf-8")
    assert "仅 1 / 3 / 5" not in text
    assert "绝不允许 2 列或 4 列" not in text
    assert "HTML 报告 / 效果展示" not in text
    assert "1–5 列" in text
    assert "Gary-UI" in text and "场景配方" in text


def test_legacy_architecture_skill_defers_ordinary_requests_to_archify() -> None:
    text = (LIBRARY / "architecture-diagram" / "SKILL.md").read_text(
        encoding="utf-8"
    )
    description = text.split("---", 2)[1]
    assert "仅当用户明确要求旧版" in description
    assert "普通技术架构图使用 archify" in description
    assert "fonts.googleapis.com" not in text
    assert "cdn.jsdelivr.net" not in text
    assert "7px" not in text
    assert "8px" not in text


def test_runtime_projection_excludes_nested_archify_skill_entrypoint() -> None:
    manifest = json.loads((ROOT / "runtime" / "manifest.json").read_text(encoding="utf-8"))
    assert "adapters/visual/vendor/archify/SKILL.md" in manifest["exclude"]
