from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

import gary_ui  # noqa: E402
from visual_adapter import (  # noqa: E402
    VisualContractError,
    choose_default_tool,
    promote_candidate,
    validate_visual_manifest,
)


def minimal_manifest(root: Path) -> dict:
    source = root / "sources" / "trend.json"
    source.parent.mkdir(parents=True)
    source.write_text(
        json.dumps(
            {
                "title": "示例趋势",
                "sourceNote": "示例数据，不代表真实业务",
                "option": {
                    "xAxis": {"type": "category", "data": ["一月", "二月"]},
                    "yAxis": {"type": "value", "name": "项"},
                    "series": [{"type": "line", "data": [1, 2]}],
                },
                "table": [["月份", "值"], ["一月", "1"], ["二月", "2"]],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    return {
        "schemaVersion": 1,
        "project": "test-visuals",
        "outputRoot": "outputs",
        "visuals": [
            {
                "id": "trend",
                "purpose": "quantitative",
                "tool": "echarts",
                "source": "sources/trend.json",
                "scene": "analysis",
                "theme": "dark",
                "formats": ["html", "svg", "png"],
                "citation": {
                    "label": "示例数据",
                    "url": None,
                    "note": "仅用于版式验收",
                },
            }
        ],
    }


def test_default_tool_routing_is_deterministic() -> None:
    assert choose_default_tool("architecture") == "archify"
    assert choose_default_tool("workflow") == "archify"
    assert choose_default_tool("sequence") == "archify"
    assert choose_default_tool("data-flow") == "archify"
    assert choose_default_tool("lifecycle") == "archify"
    assert choose_default_tool("quantitative") == "echarts"
    assert choose_default_tool("outline") == "markmap"
    assert choose_default_tool("infographic") == "antv-infographic"
    assert choose_default_tool("simple-flow") == "mermaid"
    assert choose_default_tool("icons") == "lucide"


def test_existing_native_source_format_wins_when_compatible() -> None:
    assert choose_default_tool("simple-flow", source_suffix=".mmd") == "mermaid"
    assert choose_default_tool("outline", source_suffix=".md") == "markmap"
    assert choose_default_tool("quantitative", source_suffix=".json") == "echarts"


def test_manifest_validation_accepts_safe_local_sources(tmp_path: Path) -> None:
    manifest = minimal_manifest(tmp_path)
    normalized = validate_visual_manifest(manifest, tmp_path / "visuals.json")
    assert normalized["visuals"][0]["sourcePath"].is_file()
    assert normalized["outputRoot"] == (tmp_path / "outputs").resolve()


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("outputRoot", "../outside"),
        ("source", "../outside.json"),
        ("source", "https://example.com/chart.json"),
        ("source", "sources/payload.js"),
    ],
)
def test_manifest_validation_rejects_unsafe_paths(
    tmp_path: Path, field: str, value: str
) -> None:
    manifest = minimal_manifest(tmp_path)
    if field == "source":
        manifest["visuals"][0][field] = value
    else:
        manifest[field] = value
    with pytest.raises(VisualContractError):
        validate_visual_manifest(manifest, tmp_path / "visuals.json")


def test_manifest_validation_rejects_wrong_tool_for_purpose(tmp_path: Path) -> None:
    manifest = minimal_manifest(tmp_path)
    manifest["visuals"][0]["tool"] = "antv-infographic"
    with pytest.raises(VisualContractError, match="quantitative"):
        validate_visual_manifest(manifest, tmp_path / "visuals.json")


def test_failed_candidate_never_overwrites_last_good(tmp_path: Path) -> None:
    target = tmp_path / "diagram.html"
    target.write_text("last-good", encoding="utf-8")
    missing_candidate = tmp_path / ".candidates" / "missing.html"

    with pytest.raises(VisualContractError):
        promote_candidate(missing_candidate, target)

    assert target.read_text(encoding="utf-8") == "last-good"


def test_candidate_promotion_is_atomic_and_replaces_only_after_success(
    tmp_path: Path,
) -> None:
    target = tmp_path / "diagram.html"
    target.write_text("last-good", encoding="utf-8")
    candidate = tmp_path / ".candidates" / "diagram.html"
    candidate.parent.mkdir()
    candidate.write_text("verified-next", encoding="utf-8")

    promote_candidate(candidate, target)

    assert target.read_text(encoding="utf-8") == "verified-next"
    assert not candidate.exists()


def test_cli_exposes_visual_commands_without_changing_session_contract() -> None:
    for action in ("doctor", "validate", "render", "export"):
        args = gary_ui.parse_args(
            ["visual", action]
            + ([] if action == "doctor" else ["--manifest", "visuals.json"])
        )
        assert args.group == "visual"
        assert args.action == action

    session = gary_ui.parse_args(
        ["session", "status", "--session", "g2-existing1"]
    )
    assert session.group == "session"
    assert session.action == "status"


def test_visual_runtime_inventory_is_pinned_and_complete() -> None:
    lock = json.loads(
        (ROOT / "adapters" / "visual" / "toolchain.lock.json").read_text(
            encoding="utf-8"
        )
    )
    assert lock["archify"]["commit"] == "c6519401f7b91b9d43011657880893b0a8955548"
    assert lock["packages"] == {
        "@antv/infographic": "0.2.20",
        "echarts": "6.1.0",
        "lucide": "1.41.0",
        "markmap-lib": "0.18.12",
        "markmap-view": "0.18.12",
        "mermaid": "11.17.2",
        "playwright-core": "1.63.0",
    }
    assert lock["buildPackages"] == {"esbuild": "0.25.9"}

    capabilities = json.loads(
        (ROOT / "adapters" / "visual" / "capabilities.json").read_text(
            encoding="utf-8"
        )
    )
    assert set(capabilities["engines"]) == {
        "archify",
        "echarts",
        "markmap",
        "antv-infographic",
        "mermaid",
        "lucide",
    }
