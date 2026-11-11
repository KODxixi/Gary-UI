from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEMOS = ROOT / "examples" / "demos"


def test_demo_manifest_has_six_complete_contextual_pages() -> None:
    manifest = json.loads((DEMOS / "demo-manifest.json").read_text(encoding="utf-8"))
    assert len(manifest["demos"]) == 6
    assert {item["category"] for item in manifest["demos"]} == {"web-ui", "kanban", "html-report"}
    assert {item["scene"] for item in manifest["demos"]} == {"reading", "analysis", "showcase"}
    for demo in manifest["demos"]:
        entry = DEMOS / demo["entry"]
        assert entry.is_file()
        html = entry.read_text(encoding="utf-8")
        assert 'data-gary-ui' in html
        assert 'tokens/base.css' in html
        assert 'data-demo-id=' in html
        assert 'data-demo-source' in html


def test_demo_pages_expose_required_real_interactions_and_states() -> None:
    required = {
        "web-analysis/index.html": ["data-filter-region", "data-state-loading", "data-state-empty", "data-state-error", "data-detail-trigger", "echarts"],
        "web-reading/index.html": ["data-search", "data-article-detail", 'data-visual-id="research-outline"', "data-source-drawer"],
        "project-kanban/index.html": ["data-status-filter", "data-work-item", "data-detail-trigger", "data-risk-table"],
        "executive-board/index.html": ["data-motion-action=\"play\"", "data-motion-action=\"pause\"", "data-motion-action=\"replay\"", 'data-visual-id="delivery-architecture"', "echarts"],
        "research-report/index.html": ["data-report-toc", "data-evidence", "data-source-drawer", "data-long-table", "@media print"],
        "proposal-presentation/index.html": ["data-motion-action=\"play\"", "data-static-reading", 'data-visual-id="summary-infographic"', "east-china-delivery-workflow.html", "@media print"],
    }
    for relative, markers in required.items():
        html = (DEMOS / relative).read_text(encoding="utf-8")
        for marker in markers:
            assert marker in html, f"{relative} missing {marker}"


def test_demo_data_is_fixed_and_explicitly_marked_as_acceptance_fixture() -> None:
    source = (DEMOS / "data" / "project-data.js").read_text(encoding="utf-8")
    assert "Gary-UI 验收固定示例数据" in source
    assert "Math.random" not in source
    assert "华东服务交付计划" in source


def test_report_pdfs_and_final_browser_evidence_exist() -> None:
    required = [
        DEMOS / "research-report" / "research-report.pdf",
        DEMOS / "proposal-presentation" / "proposal-presentation.pdf",
        DEMOS / "evidence" / "pdf-export.json",
        DEMOS / "evidence" / "browser" / "qa-report.json",
        DEMOS / "evidence" / "browser" / "proposal-archify-iframe-mobile.png",
        DEMOS / "evidence" / "browser" / "proposal-infographic-iframe-mobile.png",
        DEMOS / "evidence" / "export-integrity" / "standalone-svg-report.json",
        DEMOS / "evidence" / "export-integrity" / "integrity-report.json",
    ]
    for artifact in required:
        assert artifact.is_file(), f"missing final delivery artifact: {artifact}"
