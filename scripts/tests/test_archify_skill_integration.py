from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
VENDOR = ROOT / "adapters" / "visual" / "vendor" / "archify"
CANONICAL = ROOT.parents[1] / "skills" / "archify"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_official_archify_skill_matches_locked_commit_and_managed_source() -> None:
    lock = json.loads((ROOT / "adapters" / "visual" / "toolchain.lock.json").read_text(encoding="utf-8"))
    expected = lock["archify"]["skillSha256"]
    assert lock["archify"]["commit"] == "c6519401f7b91b9d43011657880893b0a8955548"
    assert digest(VENDOR / "SKILL.md") == expected
    assert digest(CANONICAL / "SKILL.md") == expected
    skill = (CANONICAL / "SKILL.md").read_text(encoding="utf-8")
    assert "name: archify" in skill
    assert "Fast authoring path" in skill
    assert "deliver <type>" in skill


def test_gary_routes_to_managed_skill_with_offline_fallback() -> None:
    capabilities = json.loads((ROOT / "adapters" / "visual" / "capabilities.json").read_text(encoding="utf-8"))
    skill = capabilities["engines"]["archify"]["skill"]
    assert skill["name"] == "archify"
    assert "managed skill" in skill["runtimeDiscovery"]
    assert "schema" in skill["referenceLoading"]
    guide = (ROOT / "adapters" / "visual" / "ARCHIFY_SKILL.md").read_text(encoding="utf-8")
    assert "自然语言" in guide
    assert "上一有效版本" in guide
