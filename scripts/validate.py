#!/usr/bin/env python3
"""Gary-UI 结构、契约与离线可用性验证。只读。"""
import json
import hashlib
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

from invocation_contract import (
    InvocationContractError,
    load_schema,
    normalize_invocation,
    validate_schema,
)

ROOT = Path(__file__).resolve().parents[1]
COMPONENTS = [
    "button", "segmented", "field", "tab-bar", "web-bar",
    "glass-card", "solid-plate", "metric-card", "comparison-table",
    "decision-grid", "media-card", "profile-card", "scene", "chip",
    "evidence-bar",
]
APPLICATION_MODES = {
    "board": "patterns/application-modes/board.html",
    "scroll-report": "patterns/application-modes/scroll-report.html",
    "web-ui": "patterns/application-modes/web-ui.html",
}
PAGE_MODES = {
    "report-cover": "patterns/report-cover.html",
    "image-page": "patterns/image-page.html",
    "data-page": "patterns/data-page.html",
    "manual-toc": "patterns/manual-toc.html",
}
THEMES = ["dark", "light"]
MATERIALS = ["ultrathin", "regular", "thick", "solid-plate"]
DENSITIES = ["spacious", "balanced", "compact"]
INVOCATION_AUTHORITY = "contracts/invocation.schema.json"
PATTERN_LEVEL_ORDER = ["application-mode", "page-mode"]
PATTERN_COMPOSITION_MODEL = "one-application-mode-with-shared-page-modes"
REVIEW_DECISION_SCHEMA_VERSION = 3
REQUIRED = [
    "SKILL.md", "DESIGN.md", "PROJECT_STRUCTURE.md", "README.md",
    "metadata.json", "library-consumption.json", "tokens/tokens.json",
    "contracts/invocation.schema.json",
    "provenance/source-manifest.json", "provenance/coverage.json",
    "tokens/base.css", "components/index.json",
    "components/components.css", "portal/index.html", "portal/app.css",
    "portal/app.js", "patterns/starting-points/index.html",
    "patterns/starting-points/app.js",
    "patterns/starting-points/preview.html",
    "patterns/starting-points/preview.css",
    "patterns/starting-points/preview.js",
    "patterns/starting-points/starting-points.css",
    "scripts/review_contract.py", "scripts/serve_portal.py",
    "scripts/apply_review.py", "scripts/invocation_contract.py",
    "scripts/tests/test_invocation_contract.py",
    "adapters/react-shadcn/README.md",
    "assets/backgrounds/gary-default-scene.png",
]
REMOTE = re.compile(r"https?://|//(?:unpkg|cdn|esm\.sh|jsdelivr)", re.I)
DEFAULT_BACKGROUND_SHA256 = "476d559ad52be6c801cda1954b602153e205dcb7b6a834622aca51bfc9683812"
PORTAL_MARKERS = {
    "portal/index.html": [
        'data-view-target="review"',
        'data-view="review"',
        'id="review-form"',
        'id="review-summary-json"',
        'id="review-save"',
        'id="review-coverage-title"',
        'id="review-impact-title"',
        'name="review-react-adapter-strategy"',
        'value="demand-driven"',
        'value="full-coverage"',
        'name="review-distribution-scope"',
        'value="internal"',
        'value="public"',
        'name="review-sync-audit-cadence"',
        'value="weekly"',
        'value="monthly"',
        '<legend><span>06</span>同步审计频率</legend>',
        'id="review-handoff"',
        '本地文件 · applied 回执',
        '单一心跳 · 无重复任务',
        '定稿 <span class="review-nav-state" aria-hidden="true">6</span>',
        '<dt>待你确认</dt><dd>基线 · 适配 · 发布边界 · 同步频率</dd>',
    ],
    "portal/app.js": [
        "gary-portal-review",
        "function reviewPayload(reviewState = state.review)",
        "function bindReview()",
        "function updateReviewGuidance()",
        "async function loadReviewHandoff()",
        "async function saveReviewHandoff()",
        'fetch("/api/review"',
        '"X-Gary-Review-Bridge": "1"',
        "schemaVersion: 3,",
        'reactAdapterStrategy: "demand-driven",',
        'distributionScope: "internal",',
        'syncAuditCadence: "weekly",',
        "reactAdapterStrategy: reviewState.reactAdapterStrategy,",
        "distributionScope: reviewState.distributionScope,",
        "syncAuditCadence: reviewState.syncAuditCadence,",
        '["weekly", "monthly"].includes(saved.syncAuditCadence)',
        "const recoverable = [2, reviewDefaults.schemaVersion].includes(saved.schemaVersion) && validCoreFields;",
        "syncAuditCadence: recoverable && validSyncAuditCadence",
        'status: "draft"',
        'state.review.reactAdapterStrategy === "demand-driven"',
        'state.review.distributionScope === "internal"',
        'state.review.syncAuditCadence === "weekly"',
        'setReviewChoice("review-sync-audit-cadence", state.review.syncAuditCadence);',
        'input[name="review-sync-audit-cadence"]:checked',
        'applied ? "✓" : ready ? "↗" : "6"',
        "bindReview();",
        "loadReviewHandoff();",
    ],
    "portal/app.css": [
        ".gary-background-nav {",
        ".application-mode-tabs {",
    ],
}
REQUIRED_TOKENS = {
    "--gary-font-size-caption",
    "--gary-font-size-label",
    "--gary-font-size-body",
    "--gary-font-size-lead",
    "--gary-font-size-title",
    "--gary-font-size-display",
    "--gary-font-weight-regular",
    "--gary-font-weight-medium",
    "--gary-font-weight-semibold",
    "--gary-font-weight-bold",
    "--gary-line-height-tight",
    "--gary-line-height-body",
}

REQUIRED_GLASS_TOKENS = {
    "--gary-glass-frost",
    "--gary-glass-highlight-angle",
    "--gary-glass-specular-opacity",
    "--gary-glass-sheen-opacity",
    "--gary-glass-brightness",
    "--gary-glass-contrast",
    "--gary-glass-saturate",
    "--gary-glass-edge-width",
}

REQUIRED_DENSITY_TOKENS = {
    "--gary-density-surface-padding",
    "--gary-density-layout-gap",
    "--gary-density-section-gap",
    "--gary-density-control-gap",
}

STATE_CSS_MARKERS = {
    "button": [".gary-button:hover", ".gary-button:active", ".gary-button:is(:disabled"],
    "field": [".gary-field:focus-within", 'aria-invalid="true"', 'aria-disabled="true"'],
    "tab-bar": ['[role="tab"][aria-selected="true"]', '[role="tab"]:hover', '[role="tab"]:disabled'],
    "web-bar": ['a[aria-current="page"]', ".gary-web-bar a:hover"],
    "glass-card": ['.gary-glass-card[data-interactive="true"]:hover', '.gary-glass-card[aria-disabled="true"]'],
    "solid-plate": ['.gary-solid-plate[aria-disabled="true"]'],
    "metric-card": ['.gary-metric-card[data-interactive="true"]:hover', '.gary-metric-card[aria-busy="true"]'],
    "comparison-table": ['[data-recommended="true"]', '.gary-comparison-table[data-state="empty"]'],
    "decision-grid": ['.gary-decision-grid > [aria-selected="true"]', '.gary-decision-grid > [aria-disabled="true"]'],
    "media-card": ['.gary-media-card[aria-busy="true"]', '.gary-media-card[data-state="error"]'],
    "profile-card": ['.gary-profile-card[data-status="available"]', '.gary-profile-card[aria-disabled="true"]'],
    "scene": ['[data-gary-theme="dark"]', '[data-gary-theme="light"]', "@media (prefers-reduced-motion: reduce)"],
    "chip": ['[aria-pressed="true"]', '[aria-selected="true"]', '.gary-chip:is(:disabled'],
    "evidence-bar": ['.gary-evidence-bar[data-state="verified"]', '.gary-evidence-bar[data-state="stale"]', '.gary-evidence-bar[data-state="missing"]'],
}


def has_remote_dependency(text):
    # SVG namespace metadata identifies a vocabulary; it does not load a resource.
    without_namespace = re.sub(
        r"\bxmlns\s*[:=]\s*(['\"])http://www\.w3\.org/2000/svg\1",
        "xmlns=local-svg-namespace",
        text,
    )
    without_namespace = re.sub(
        r"\bcreateElementNS\(\s*(['\"])http://www\.w3\.org/2000/svg\1",
        "createElementNS(local-svg-namespace",
        without_namespace,
    )
    without_namespace = re.sub(
        r"""(?:const|let|var)\s+\w+\s*=\s*(['"])http://www\.w3\.org/2000/svg\1""",
        "SVG_NS = local-svg-namespace",
        without_namespace,
    )
    return REMOTE.search(without_namespace) is not None


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.root_attrs = {}
        self.classes = set()
        self.ids = set()
        self.data_views = set()
        self.application_modes = set()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "html" and not self.root_attrs:
            self.root_attrs = values
        self.classes.update(values.get("class", "").split())
        if values.get("id"):
            self.ids.add(values["id"])
        if values.get("data-view"):
            self.data_views.add(values["data-view"])
        if values.get("data-application-mode"):
            self.application_modes.add(values["data-application-mode"])
        for key in ("href", "src"):
            if values.get(key):
                self.links.append(values[key])


def main():
    issues = []
    for rel in REQUIRED:
        if not (ROOT / rel).is_file():
            issues.append(f"缺必需文件: {rel}")

    background = ROOT / "assets" / "backgrounds" / "gary-default-scene.png"
    if background.exists():
        digest = hashlib.sha256(background.read_bytes()).hexdigest()
        if digest != DEFAULT_BACKGROUND_SHA256:
            issues.append("默认场景背景哈希与用户确认母本不一致")

    for rel in ("metadata.json", "library-consumption.json",
                "contracts/invocation.schema.json", "tokens/tokens.json",
                "components/index.json",
                "provenance/source-manifest.json", "provenance/coverage.json"):
        path = ROOT / rel
        if not path.exists():
            continue
        try:
            json.loads(path.read_text(encoding="utf-8-sig"))
        except Exception as error:
            issues.append(f"JSON 无效: {rel}: {error}")

    system = {}
    system_path = ROOT / "spec" / "system.json"
    if system_path.exists():
        try:
            system = json.loads(system_path.read_text(encoding="utf-8-sig"))
        except Exception as error:
            issues.append(f"JSON 无效: spec/system.json: {error}")
    visual_axes = system.get("visualAxes", {})
    defaults = visual_axes.get("defaults", {})

    metadata = {}
    metadata_path = ROOT / "metadata.json"
    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8-sig"))
        except Exception:
            metadata = {}
        if metadata:
            if metadata.get("patternCount") != len(PAGE_MODES):
                issues.append("metadata patternCount 必须等于正式页面模式数量")
            if metadata.get("patternCountScope") != "page-mode":
                issues.append("metadata patternCountScope 必须为 page-mode")
            if metadata.get("patternCoverage") != f"{len(PAGE_MODES)}/{len(PAGE_MODES)}":
                issues.append("metadata patternCoverage 与正式页面模式不一致")
            if metadata.get("applicationModeCount") != len(APPLICATION_MODES):
                issues.append("metadata applicationModeCount 与正式应用模式不一致")
            if metadata.get("invocationAuthority") != INVOCATION_AUTHORITY:
                issues.append("metadata invocationAuthority 不正确")
            if metadata.get("reviewDecisionSchemaVersion") != REVIEW_DECISION_SCHEMA_VERSION:
                issues.append("metadata reviewDecisionSchemaVersion 必须为 3")
            if metadata.get("syncAuditCadence") not in {"weekly", "monthly"}:
                issues.append("metadata syncAuditCadence 必须为 weekly 或 monthly")
            if metadata.get("reviewDecisionStatus") == "confirmed":
                confirmed_enums = {
                    "defaultTheme": {"dark", "light"},
                    "defaultMaterial": {"ultrathin", "regular", "thick", "solid-plate"},
                    "defaultDensity": {"spacious", "balanced", "compact"},
                    "reactAdapterStrategy": {"demand-driven", "full-coverage"},
                    "distributionScope": {"internal", "public"},
                }
                for key, allowed in confirmed_enums.items():
                    if metadata.get(key) not in allowed:
                        issues.append(f"已确认 metadata 字段无效: {key}")
                if not re.fullmatch(r"[0-9a-f]{16}", str(metadata.get("reviewDecisionId", ""))):
                    issues.append("已确认 metadata 缺有效 reviewDecisionId")
            usage_evidence = metadata.get("usageEvidence")
            if not isinstance(usage_evidence, str) or not Path(usage_evidence).is_absolute():
                issues.append("metadata usageEvidence 必须为绝对路径")
            elif usage_evidence != r"C:\AI\evidence\reports\skill-usage-latest.md":
                issues.append("metadata usageEvidence 路径不正确")
            elif not Path(metadata["usageEvidence"]).is_file():
                issues.append("metadata usageEvidence 指向的证据文件不存在")

    invocation_schema_path = ROOT / INVOCATION_AUTHORITY
    invocation_schema = {}
    if invocation_schema_path.exists():
        try:
            invocation_schema = load_schema(invocation_schema_path)
            validate_schema(invocation_schema)
        except (InvocationContractError, OSError, json.JSONDecodeError) as error:
            issues.append(f"Agent 调用 schema 无效: {error}")

    if invocation_schema:
        properties = invocation_schema["properties"]
        expected_enums = {
            "application": list(APPLICATION_MODES),
            "page": list(PAGE_MODES),
            "theme": THEMES,
            "material": MATERIALS,
            "density": DENSITIES,
        }
        for key, expected in expected_enums.items():
            if properties.get(key, {}).get("enum") != expected:
                issues.append(f"Agent 调用枚举与母本不一致: {key}")
        if properties.get("schemaVersion", {}).get("const") != 1:
            issues.append("Agent 调用 schemaVersion 必须为 1")
        if properties.get("skill", {}).get("const") != system.get(
            "skill", metadata.get("runtimeSkillName", "gary-liquidglass-ui")
        ):
            issues.append("Agent 调用 skill 与 system skill 不一致")

        expected_defaults = {
            "theme": defaults.get("theme"),
            "material": defaults.get("material"),
            "density": defaults.get("density"),
        }
        for key, expected in expected_defaults.items():
            if properties.get(key, {}).get("default") != expected:
                issues.append(f"Agent 调用默认值与 spec/system.json 不一致: {key}")

        examples = invocation_schema.get("examples", [])
        if not isinstance(examples, list) or len(examples) < len(APPLICATION_MODES):
            issues.append("Agent 调用 schema 至少需要覆盖 3 个应用模式的示例")
        else:
            example_applications = set()
            for index, example in enumerate(examples, start=1):
                try:
                    normalized = normalize_invocation(
                        example,
                        schema=invocation_schema,
                    )
                    example_applications.add(normalized["application"])
                except InvocationContractError as error:
                    issues.append(f"Agent 调用示例 {index} 无效: {error}")
            if example_applications != set(APPLICATION_MODES):
                issues.append("Agent 调用示例未覆盖全部 3 个应用模式")

        routing = invocation_schema.get("x-gary-routing", {})
        expected_routes = {
            "application": APPLICATION_MODES,
            "page": PAGE_MODES,
        }
        for key, expected in expected_routes.items():
            if routing.get(key) != expected:
                issues.append(f"Agent 调用路由与正式模式不一致: {key}")
        if routing.get("startingPoint") != "patterns/starting-points/index.html":
            issues.append("Agent 调用 Starting Point 路径不正确")
        expected_preview_template = (
            "patterns/starting-points/preview.html?"
            "application={application}&page={page}&theme={theme}"
            "&material={material}&density={density}"
        )
        if routing.get("previewTemplate") != expected_preview_template:
            issues.append("Agent 调用组合预览模板不正确")

        projection = invocation_schema.get("x-gary-projection", {})
        expected_root_attributes = {
            "application": "data-gary-application-mode",
            "page": "data-gary-page-mode",
            "theme": "data-gary-theme",
            "material": "data-gary-material",
            "density": "data-gary-density",
        }
        if projection.get("rootAttributes") != expected_root_attributes:
            issues.append("Agent 调用根属性投影不完整")
        expected_material_classes = {
            "ultrathin": ["gary-glass", "gary-ultrathin"],
            "regular": ["gary-glass", "gary-regular"],
            "thick": ["gary-glass", "gary-thick"],
            "solid-plate": ["gary-solid-plate"],
        }
        if projection.get("materialClasses") != expected_material_classes:
            issues.append("Agent 调用材质类投影不正确")

    library_path = ROOT / "library-consumption.json"
    if library_path.exists():
        try:
            library = json.loads(library_path.read_text(encoding="utf-8-sig"))
        except Exception:
            library = {}
        if library:
            if library.get("entrypoints", {}).get("invocation") != INVOCATION_AUTHORITY:
                issues.append("library-consumption 缺 Agent 调用入口")
            if library.get("readOrder", []).count(INVOCATION_AUTHORITY) != 1:
                issues.append("library-consumption 读取顺序缺唯一 invocation schema")

    source_manifest_path = ROOT / "provenance" / "source-manifest.json"
    coverage_path = ROOT / "provenance" / "coverage.json"
    if coverage_path.exists():
        coverage_data = json.loads(coverage_path.read_text(encoding="utf-8-sig"))
        allowed_statuses = set(coverage_data.get("statusValues", []))
        coverage_items = coverage_data.get("coverage", [])
        source_manifest_data = json.loads(source_manifest_path.read_text(encoding="utf-8-sig")) if source_manifest_path.exists() else {}
        required_sources = {
            source.get("id")
            for source in source_manifest_data.get("sources", [])
            if isinstance(source, dict) and source.get("id")
        }
        found_sources = {item.get("source") for item in coverage_items}
        for source in sorted(required_sources - found_sources):
            issues.append(f"来源覆盖表缺来源: {source}")
        for index, item in enumerate(coverage_items, start=1):
            if item.get("status") not in allowed_statuses:
                issues.append(f"来源覆盖表第 {index} 项状态无效")
            evidence = item.get("canonicalEvidence", [])
            if not evidence:
                issues.append(f"来源覆盖表第 {index} 项缺母本证据")
            for rel in evidence:
                if not (ROOT / rel).exists():
                    issues.append(f"来源覆盖证据失效: {rel}")

    component_css = ROOT / "components" / "components.css"
    base_css = ROOT / "tokens" / "base.css"
    css_text = "\n".join(
        path.read_text(encoding="utf-8-sig")
        for path in (base_css, component_css)
        if path.exists()
    )
    index_path = ROOT / "components" / "index.json"
    index_slugs = []
    if index_path.exists():
        data = json.loads(index_path.read_text(encoding="utf-8-sig"))
        raw = data.get("components", [])
        index_slugs = [item.get("slug") if isinstance(item, dict) else item for item in raw]
    if index_slugs and index_slugs != COMPONENTS:
        issues.append("components/index.json 的组件顺序或集合不是正式 15 组件契约")

    tokens_path = ROOT / "tokens" / "tokens.json"
    if tokens_path.exists():
        token_data = json.loads(tokens_path.read_text(encoding="utf-8-sig"))
        token_names = set(token_data.get("tokens", {}))
        for token_name in sorted(REQUIRED_TOKENS - token_names):
            issues.append(f"缺正式排版 token: {token_name}")
        base_text = base_css.read_text(encoding="utf-8-sig") if base_css.exists() else ""
        for token_name in sorted(REQUIRED_TOKENS):
            if token_name not in base_text:
                issues.append(f"排版 token 未投影到 CSS: {token_name}")
        for token_name in sorted(REQUIRED_GLASS_TOKENS - token_names):
            issues.append(f"missing formal glass token: {token_name}")
        for token_name in sorted(REQUIRED_GLASS_TOKENS):
            if token_name not in base_text:
                issues.append(f"glass token missing from CSS projection: {token_name}")
        if token_data.get("defaultDensity") not in {"spacious", "balanced", "compact"}:
            issues.append("tokens defaultDensity 必须为正式密度")
        if token_data.get("densities") != ["spacious", "balanced", "compact"]:
            issues.append("tokens densities 顺序或集合不一致")
        for token_name in sorted(REQUIRED_DENSITY_TOKENS - token_names):
            issues.append(f"缺正式密度 token: {token_name}")
        for token_name in sorted(REQUIRED_DENSITY_TOKENS):
            token = token_data.get("tokens", {}).get(token_name, {})
            for density in ("spacious", "balanced", "compact"):
                if density not in token:
                    issues.append(f"密度 token 缺 {density}: {token_name}")
            if token_name not in base_text:
                issues.append(f"密度 token 未投影到 CSS: {token_name}")

    for slug in COMPONENTS:
        path = ROOT / "components" / f"{slug}.json"
        if not path.exists():
            issues.append(f"缺组件契约: components/{slug}.json")
            continue
        try:
            contract = json.loads(path.read_text(encoding="utf-8-sig"))
        except Exception as error:
            issues.append(f"组件 JSON 无效: {slug}: {error}")
            continue
        if contract.get("slug") != slug:
            issues.append(f"组件 slug 不一致: {slug}")
        for key in ("name", "category", "material", "variants", "states",
                    "accessibility", "cssClasses"):
            if not contract.get(key):
                issues.append(f"组件 {slug} 缺字段: {key}")
        for class_name in contract.get("cssClasses", []):
            selector = class_name if str(class_name).startswith(".") else f".{class_name}"
            if selector not in css_text:
                issues.append(f"组件 {slug} 声明但 CSS 未实现: {selector}")
        for marker in STATE_CSS_MARKERS.get(slug, []):
            if marker not in css_text:
                issues.append(f"组件 {slug} 状态未实现: {marker}")

    for base in (ROOT / "portal", ROOT / "patterns"):
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in {".html", ".css", ".js"}:
                continue
            text = path.read_text(encoding="utf-8-sig", errors="replace")
            rel = path.relative_to(ROOT).as_posix()
            if has_remote_dependency(text):
                issues.append(f"离线页面含远程依赖: {rel}")
            if path.suffix.lower() != ".html":
                continue
            parser = Links()
            parser.feed(text)
            for link in parser.links:
                parsed = urlsplit(link)
                if parsed.scheme or link.startswith("#") or link.startswith("data:"):
                    continue
                target = (path.parent / parsed.path).resolve()
                if parsed.path and not target.exists():
                    issues.append(f"HTML 引用失效: {rel} -> {link}")

    design_path = ROOT / "DESIGN.md"
    if design_path.exists():
        design_text = design_path.read_text(encoding="utf-8-sig")
        for marker in ("应用模式（一级）", "页面模式（二级）", "`3 × 4`"):
            if marker not in design_text:
                issues.append(f"设计契约缺两级模式标记: {marker}")
        for marker in ("`schemaVersion: 3`", "`schemaVersion: 2`",
                       "`reactAdapterStrategy`", "`distributionScope`",
                       "`syncAuditCadence`", "`demand-driven`", "`internal`",
                       "`weekly`", "`monthly`", "降回草稿",
                       "只读周期检查"):
            if marker not in design_text:
                issues.append(f"共同定稿设计契约缺 v3 标记: {marker}")
        for slug in (*APPLICATION_MODES, *PAGE_MODES):
            if f"`{slug}`" not in design_text:
                issues.append(f"设计契约缺模式 slug: {slug}")

    skill_path = ROOT / "SKILL.md"
    if skill_path.exists():
        skill_text = skill_path.read_text(encoding="utf-8-sig")
        for marker in (
            "## Agent 调用契约",
            "contracts/invocation.schema.json",
            "scripts/invocation_contract.py",
            "### 3 × 4 路由表",
            "data-gary-material",
        ):
            if marker not in skill_text:
                issues.append(f"SKILL 缺 Agent 调用标记: {marker}")
        for slug in APPLICATION_MODES:
            json_marker = f'"application": "{slug}"'
            text_marker = f"application={slug}"
            if json_marker not in skill_text and text_marker not in skill_text:
                issues.append(f"SKILL 缺应用模式调用示例: {slug}")
        for slug, rel in PAGE_MODES.items():
            if f"`{slug}`" not in skill_text or rel not in skill_text:
                issues.append(f"SKILL 缺页面模式路由: {slug}")

    for slug, rel in APPLICATION_MODES.items():
        path = ROOT / rel
        if not path.exists():
            issues.append(f"缺应用模式页面: {rel}")
            continue
        parser = Links()
        parser.feed(path.read_text(encoding="utf-8-sig", errors="replace"))
        if parser.root_attrs.get("data-gary-application-mode") != slug:
            issues.append(f"应用模式根标识不一致: {rel} -> {slug}")
        if "./modes.css" not in parser.links:
            issues.append(f"应用模式未共享 modes.css: {rel}")

    application_dir = ROOT / "patterns" / "application-modes"
    if application_dir.exists():
        found_application_modes = {
            path.stem for path in application_dir.glob("*.html")
        }
        if found_application_modes != set(APPLICATION_MODES):
            issues.append("application-modes HTML 集合不是正式 3 个应用模式")

    style_import_chain = {
        "patterns/application-modes/modes.css":
            '@import url("../patterns.css");',
        "patterns/patterns.css":
            '@import url("../tokens/base.css");',
    }
    for rel, expected_import in style_import_chain.items():
        path = ROOT / rel
        if not path.exists():
            issues.append(f"缺模式共享样式: {rel}")
            continue
        css = path.read_text(encoding="utf-8-sig", errors="replace")
        if not css.lstrip().startswith(expected_import):
            issues.append(f"模式样式导入链不一致: {rel} -> {expected_import}")

    transparent_body = (
        r"(?:^|})\s*body\s*\{[^}]*\bbackground\s*:\s*transparent\s*;"
    )
    transparent_application_body = (
        r"(?:^|})\s*body\.application-mode\s*\{"
        r"[^}]*\bbackground\s*:\s*transparent\s*;"
    )
    patterns_css_path = ROOT / "patterns" / "patterns.css"
    if patterns_css_path.exists():
        patterns_css = patterns_css_path.read_text(
            encoding="utf-8-sig", errors="replace"
        )
        if not re.search(transparent_body, patterns_css, re.S):
            issues.append("patterns body 背景必须为 transparent")

    modes_css_path = ROOT / "patterns" / "application-modes" / "modes.css"
    if modes_css_path.exists():
        modes_css = modes_css_path.read_text(
            encoding="utf-8-sig", errors="replace"
        )
        scene_override = (
            r'\.mode-scene\s*\{[^}]*background-image\s*:\s*'
            r'radial-gradient\(circle,\s*var\(--gary-scene-dot-color\)'
        )
        if not re.search(scene_override, modes_css, re.S):
            issues.append("application-modes 缺默认本地点阵场景")
        if not re.search(transparent_application_body, modes_css, re.S):
            issues.append("application-modes body 背景必须为 transparent")

    for slug, rel in PAGE_MODES.items():
        path = ROOT / rel
        if not path.exists():
            issues.append(f"缺页面模式页面: {rel}")
            continue
        parser = Links()
        parser.feed(path.read_text(encoding="utf-8-sig", errors="replace"))
        if parser.root_attrs.get("data-gary-page-mode") != slug:
            issues.append(f"页面模式根标识不一致: {rel} -> {slug}")
        if "./patterns.css" not in parser.links:
            issues.append(f"页面模式未共享 patterns.css: {rel}")

    starting_path = ROOT / "patterns" / "starting-points" / "index.html"
    if starting_path.exists():
        starting_text = starting_path.read_text(
            encoding="utf-8-sig", errors="replace"
        )
        for slug in APPLICATION_MODES:
            if f'name="starter-application" value="{slug}"' not in starting_text:
                issues.append(f"Starting Points 缺应用模式选择: {slug}")
        for slug in PAGE_MODES:
            if f'name="starter-page" value="{slug}"' not in starting_text:
                issues.append(f"Starting Points 缺页面模式选择: {slug}")
        for marker in (
            'id="starter-preview-frame"',
            'id="starter-copy"',
            'src="./app.js"',
            "不是 12 份重复模板",
            f'data-gary-material="{defaults.get("material")}"',
        ):
            if marker not in starting_text:
                issues.append(f"Starting Points 缺组合器标记: {marker}")

    starting_js_path = ROOT / "patterns" / "starting-points" / "app.js"
    if starting_js_path.exists():
        starting_js = starting_js_path.read_text(
            encoding="utf-8-sig", errors="replace"
        )
        for marker in (
            'data-gary-material="${material}"',
            "function materialClasses(value)",
            'return value === "solid-plate"',
            "`gary-glass gary-${value}`",
            '${materialClasses(material)}',
            "document.documentElement.dataset.garyMaterial",
        ):
            if marker not in starting_js:
                issues.append(f"Starting Points 复制骨架缺材质投影: {marker}")

    starting_preview_path = ROOT / "patterns" / "starting-points" / "preview.html"
    if starting_preview_path.exists():
        preview_text = starting_preview_path.read_text(encoding="utf-8-sig", errors="replace")
        for slug in PAGE_MODES:
            if f'id="page-{slug}"' not in preview_text:
                issues.append(f"Starting Points 组合预览缺页面模板: {slug}")
        if "data-gary-application-mode" not in preview_text or "data-gary-page-mode" not in preview_text:
            issues.append("Starting Points 组合预览缺两级根标识")
        preview_parser = Links()
        preview_parser.feed(preview_text)
        if preview_parser.root_attrs.get("data-gary-material") != defaults.get("material"):
            issues.append("Starting Points 组合预览缺默认主材质根标识")

    starting_preview_js_path = (
        ROOT / "patterns" / "starting-points" / "preview.js"
    )
    if starting_preview_js_path.exists():
        preview_js = starting_preview_js_path.read_text(
            encoding="utf-8-sig", errors="replace"
        )
        for marker in (
            "root.dataset.garyMaterial = material",
            'surface.classList.add("gary-solid-plate")',
            'surface.classList.add("gary-glass", `gary-${material}`)',
        ):
            if marker not in preview_js:
                issues.append(f"Starting Points 组合预览缺材质应用: {marker}")

    modes_js_path = ROOT / "patterns" / "application-modes" / "modes.js"
    if modes_js_path.exists():
        modes_js = modes_js_path.read_text(encoding="utf-8-sig", errors="replace")
        for marker in ('"solid-plate"', "validDensities", "root.dataset.garyDensity"):
            if marker not in modes_js:
                issues.append(f"应用模式设置缺正式枚举/密度: {marker}")

    if re.search(
        r"@media\s*\(max-width:\s*900px\).*?\.gary-web-bar__nav\s*\{\s*display\s*:\s*none",
        css_text,
        re.S,
    ):
        issues.append("WebBar 窄屏仍隐藏主要导航")

    forbidden_solid_cards = {
        "patterns/report-cover.html": 'pattern-card span-4 gary-solid-plate',
        "patterns/image-page.html": 'pattern-card span-5 gary-solid-plate',
        "patterns/data-page.html": 'Option B</p><p class="metric">7.2</p><p class="muted">成本最低</p></article>',
    }
    for rel, marker in forbidden_solid_cards.items():
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8-sig", errors="replace")
        if rel == "patterns/data-page.html":
            if f'gary-solid-plate"><p class="eyebrow">{marker}' in text:
                issues.append(f"页面模式短卡误用 SolidPlate: {rel}")
        elif marker in text:
            issues.append(f"页面模式短卡误用 SolidPlate: {rel}")

    for rel, markers in PORTAL_MARKERS.items():
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8-sig", errors="replace")
        for marker in markers:
            if marker not in text:
                issues.append(f"共同定稿闭环缺标记: {rel} -> {marker}")

    portal_path = ROOT / "portal" / "index.html"
    if portal_path.exists():
        parser = Links()
        parser.feed(portal_path.read_text(encoding="utf-8-sig", errors="replace"))
        for class_name in ("portal-topbar", "top-navigation", "gary-background-nav"):
            if class_name not in parser.classes:
                issues.append(f"Portal 缺必需结构类: {class_name}")
        if "theme-toggle" not in parser.ids:
            issues.append("Portal 缺独立主题按钮: theme-toggle")
        if "portal-sidebar" in parser.classes:
            issues.append("Portal 仍含侧栏结构类: portal-sidebar")
        if "portal-sidebar" in parser.ids:
            issues.append("Portal 仍含侧栏结构 ID: portal-sidebar")
        if "patterns" not in parser.data_views:
            issues.append("Portal 缺应用模式视图: patterns")
        for slug in APPLICATION_MODES:
            if slug not in parser.application_modes:
                issues.append(f"Portal 缺应用模式入口: {slug}")

    forbidden = ["vendor", "specs", "reports"]
    for name in forbidden:
        if (ROOT / name).exists():
            issues.append(f"核心包含禁止的并行/生成目录: {name}/")

    result = {
        "root": str(ROOT),
        "componentCount": len(COMPONENTS),
        "applicationModeCount": len(APPLICATION_MODES),
        "pageModeCount": len(PAGE_MODES),
        "invocationSchemaVersion": (
            invocation_schema.get("properties", {})
            .get("schemaVersion", {})
            .get("const")
        ),
        "issues": issues,
        "status": "pass" if not issues else "fail",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 1 if issues else 0


if __name__ == "__main__":
    sys.exit(main())
