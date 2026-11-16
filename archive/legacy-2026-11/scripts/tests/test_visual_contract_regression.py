"""D 族视觉契约缺口修复的静态回归守卫（三方审计 D1/D2/D5/D6/D7/D8）。

策略：全部为纯静态断言（grep 源码 / token 文件 / 构建产物），不依赖浏览器。
D6 的构建产物未提交时跳过（需先运行 adapters/react-shadcn 的构建）。
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[2]
MODES_CSS = ROOT / "patterns" / "application-modes" / "modes.css"
MODES_JS = ROOT / "patterns" / "application-modes" / "modes.js"
DECISION_REPORT_CSS = (
    ROOT / "patterns" / "recipes" / "decision-report" / "decision-report.css"
)
COMPONENTS_CSS = ROOT / "components" / "components.css"
TOKENS_JSON = ROOT / "tokens" / "tokens.json"
TOKENS_CSS = ROOT / "tokens" / "base.css"
ADAPTER_PACKAGE = ROOT / "adapters" / "react-shadcn" / "package.json"
ADAPTER_DIST_STYLE = (
    ROOT / "adapters" / "react-shadcn" / "dist" / "styles" / "gary-ui.css"
)


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def rule_text(css: str, selector: str) -> str:
    """返回 selector 对应的首个完整规则块（含选择器与大括号）。"""
    start = css.index(selector + " {")
    depth = 0
    for index in range(start, len(css)):
        if css[index] == "{":
            depth += 1
        elif css[index] == "}":
            depth -= 1
            if depth == 0:
                return css[start : index + 1]
    raise AssertionError(f"rule block not closed: {selector}")


# D1：light 主题分支缺失（.chart-bars span / .report-progress）
def test_d1_light_branch_for_chart_bars() -> None:
    css = read_text(MODES_CSS)
    assert '[data-gary-theme="light"] .chart-bars span' in css
    # 修复必须消费 token，禁止新硬编码色值
    assert "var(--gary-text-primary)" in css


def test_d1_light_branch_for_report_progress() -> None:
    css = read_text(MODES_CSS)
    assert '[data-gary-theme="light"] .report-progress' in css
    assert "var(--gary-text-primary)" in css


# D2：决策报告 h1 两行截断（不再 nowrap 单行静默截断）
def test_d2_decision_header_two_line_clamp() -> None:
    css = read_text(DECISION_REPORT_CSS)
    rule = rule_text(css, ".decision-page-header h1")
    assert "-webkit-line-clamp: 2" in rule
    assert "-webkit-box-orient: vertical" in rule
    assert "overflow: hidden" in rule
    assert "white-space: nowrap" not in rule


def test_d2_decision_header_mobile_branch_consistent() -> None:
    css = read_text(DECISION_REPORT_CSS)
    assert "@media (max-width: 720px)" in css
    # ≤720px 分支不再用 white-space: normal 恢复"无限换行"，与桌面两行截断保持一致
    assert "white-space: normal" not in css


# D5：data-preview-material 是孤儿属性（无契约背书、无 CSS/JS 消费）
def test_d5_no_orphan_data_preview_material() -> None:
    js = read_text(MODES_JS)
    assert "previewMaterial" not in js
    assert "data-preview-material" not in js


# D6：React 适配层样式必须构建时内联、自包含
def test_d6_adapter_package_points_to_dist_style() -> None:
    package = json.loads(read_text(ADAPTER_PACKAGE))
    assert package["exports"]["./styles.css"].endswith("dist/styles/gary-ui.css")
    assert "prebuild" in package["scripts"]
    assert package["style"].endswith("dist/styles/gary-ui.css")


def test_d6_adapter_dist_style_self_contained() -> None:
    if not ADAPTER_DIST_STYLE.is_file():
        pytest.skip(
            "dist/styles/gary-ui.css 未生成：请先运行 adapters/react-shadcn 的 "
            "npm run build（prebuild 内联 tokens/components）"
        )
    css = read_text(ADAPTER_DIST_STYLE)
    assert "@import" not in css
    assert "--gary-text-primary" in css
    assert "--gary-glass-brightness" in css
    assert ".gary-card" in css


# D7：决策网格玻璃配方与 base.css 玻璃契约一致（含 brightness/contrast）
def test_d7_decision_grid_glass_recipe_consistent() -> None:
    css = read_text(COMPONENTS_CSS)
    rule = rule_text(css, ".gary-decision-grid > [data-gary-decision]")
    assert "brightness(var(--gary-glass-brightness))" in rule
    assert "contrast(var(--gary-glass-contrast))" in rule


# D8：实际使用的字重必须声明进 token（扩展声明，不改渲染）
def test_d8_used_font_weights_declared_in_tokens() -> None:
    tokens = json.loads(read_text(TOKENS_JSON))["tokens"]
    weights = {
        "--gary-font-weight-medium-light": "500",
        "--gary-font-weight-extra-semibold": "620",
        "--gary-font-weight-semibold-strong": "660",
        "--gary-font-weight-semibold-extra": "670",
        "--gary-font-weight-bold-light": "680",
        "--gary-font-weight-bold-strong": "700",
        "--gary-font-weight-heavy": "740",
        "--gary-font-weight-black": "760",
        "--gary-font-weight-extra-black": "790",
    }
    for name, value in weights.items():
        assert name in tokens, f"tokens.json 缺 {name}"
        assert tokens[name]["value"] == value, f"{name} 值应为 {value}"
    css = read_text(TOKENS_CSS)
    for name, value in weights.items():
        assert f"{name}: {value};" in css, f"base.css 未投影 {name}"
