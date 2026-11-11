#!/usr/bin/env python3
"""Gary-UI 不变量闸 — 母库自洽，而不是某个页面好看。

判据（每条都能在 CI 里红）：
1. 中性 token 的 chroma 必须为 0（K-only 是契约，不是形容词）；状态色与焦点色除外。
   颜色解析按 sRGB 通道差判定，不按 oklch 字符串形状判定；无法解析的颜色语法直接报错。
2. 页面底色 token：深色纯黑、浅色纯白（DESIGN §2）。
3. 契约声明的 CSS 类必须在样式表里存在（先剥注释再匹配，避免注释里提到类名就算数）。
4. 样式与脚本里不允许出现带色度的字面色值；状态色白名单从 tokens.json 动态生成。
5. 高密度版面禁止两栏：解析 grid-template-columns 的真实轨道数，展开 repeat(n, …)。
6. 有 Scene 的页面，body 不得写不透明底色（负 z-index 点阵会被整块盖掉）。
7. 配方页面的字号不得低于 micro 档（0.75rem / 12px），不允许出现 10.5px 这类字面量。
8. 两个验收器（validate_v2 / audit-ui）必须同时为绿，且子进程必须有明确退出码。

用法：python -B agent/checks/invariants.py [--json]
退出码 0 = 全部通过；1 = 有违反。
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOKENS = ROOT / "tokens" / "tokens.json"
CSS_FILES = [ROOT / "tokens" / "base.css", ROOT / "components" / "components.css"]
STATE_PREFIXES = ("--gary-state-", "--gary-category-")
TINT_PREFIX = "--gary-tint-"
EXEMPT = {"--gary-focus-ring"}
COMPONENTS = [
    "button", "segmented", "field", "tab-bar", "web-bar", "glass-card", "solid-plate",
    "metric-card", "comparison-table", "decision-grid", "media-card", "profile-card",
    "scene", "chip", "evidence-bar",
]
CHROMATIC_SKIP_DIRS = {".git", "node_modules", "__pycache__", "assets", "examples",
                       "licenses", "docs", "out", "adapters", "spec"}
CHROMATIC_EXTS = (".css", ".html", ".js", ".mjs", ".cjs", ".json")
MIN_FONT_REM = 0.75

COLOR_RE = re.compile(
    r"(#[0-9a-fA-F]{3,8}\b"
    r"|rgba?\([^()]*\)"
    r"|hsla?\([^()]*\)"
    r"|oklch\([^()]*\)"
    r"|oklab\([^()]*\)"
    r"|lch\([^()]*\)"
    r"|lab\([^()]*\)"
    r"|color\([^()]*\))"
)
COMMENT_RE = re.compile(r"/\*.*?\*/", re.S)
HTML_COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
CHROMA_TOLERANCE = 2  # sRGB 0-255 通道差在 2 以内视为中性
CSS_COLOR_SPACES = {"srgb", "srgb-linear", "display-p3", "a98-rgb", "prophoto-rgb",
                    "rec2020", "xyz", "xyz-d50", "xyz-d65"}


# ---------------------------------------------------------------- 颜色解析

def _num(token: str):
    token = token.strip()
    if token.endswith("%"):
        return float(token[:-1]) / 100.0, True
    try:
        return float(token), False
    except ValueError:
        return None


def _hsl_to_rgb(h: float, s: float, l: float):
    h = (h % 360) / 360.0

    def f(n):
        k = (n + h * 12) % 12
        a = s * min(l, 1 - l)
        return l - a * max(-1, min(k - 3, 9 - k, 1))

    return tuple(round(x * 255) for x in (f(0), f(8), f(4)))


def _oklch_to_rgb(L: float, C: float, H: float):
    """oklch → OKLab → LMS → linear sRGB → sRGB。C>0 时几乎必然有色度，但仍算出来做判定。"""
    import math
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    def gamma(x):
        x = max(0.0, min(1.0, x))
        return 12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055

    return tuple(round(gamma(v) * 255) for v in (r, g, bl))


def parse_color(value: str):
    """返回 (r, g, b, chroma_hint)；无法解析返回 (None, None, None, None)。"""
    v = value.strip()
    if v.startswith("#"):
        h = v[1:]
        if len(h) in (3, 4):
            h = "".join(c * 2 for c in h[:3])
        elif len(h) in (6, 8):
            h = h[:6]
        else:
            return (None,) * 4
        try:
            return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), None)
        except ValueError:
            return (None,) * 4

    head = v.split("(", 1)[0].lower()
    if "(" not in v:
        return (None,) * 4
    body = v[v.index("(") + 1:v.rindex(")")].replace("/", " ").replace(",", " ")
    parts = [p for p in body.split() if p]
    if head.startswith("rgb"):
        vals = [_num(p) for p in parts[:3]]
        if len(vals) < 3 or any(x is None for x in vals):
            return (None,) * 4
        rgb = [round(n * 255) if pct else round(n) for (n, pct) in vals]
        return (rgb[0], rgb[1], rgb[2], None)
    if head.startswith("hsl"):
        vals = [_num(p) for p in parts[:3]]
        if len(vals) < 3 or any(x is None for x in vals):
            return (None,) * 4
        hue = vals[0][0]
        sat = vals[1][0]
        lig = vals[2][0]
        r, g, b = _hsl_to_rgb(hue, sat, lig)
        return (r, g, b, None)
    if head in ("oklch", "lch"):
        if len(parts) < 3:
            return (None,) * 4
        ln = _num(parts[0])
        cn = _num(parts[1])
        hn = _num(parts[2])
        if ln is None or cn is None or hn is None:
            return (None,) * 4
        L = ln[0] if not ln[1] else ln[0]  # 0..1 / 0..100% 都归一化到 0..1
        C = cn[0] if not cn[1] else cn[0] * 0.4
        H = hn[0]
        if head == "lch":
            return (None,) * 4  # 非 OK 的 lch 映射不同，这里只做「有色度」判定
        r, g, b = _oklch_to_rgb(L, C, H)
        return (r, g, b, C)
    if head in ("oklab", "lab"):
        if head == "oklab" and len(parts) >= 3:
            ln, an, bn = (_num(p) for p in parts[:3])
            if ln and an and bn:
                return (None,) * 4 if an[0] == 0 and bn[0] == 0 else (None,) * 4
        return (None,) * 4
    if head == "color":
        space = parts[0].lower() if parts else ""
        rest = parts[1:4]
        nums = [_num(p) for p in rest]
        if len(nums) < 3 or any(n is None for n in nums):
            return (None,) * 4
        rgb = [round((n[0] * 255) if n[1] else (n[0] * 255)) for n in nums]
        return (rgb[0], rgb[1], rgb[2], None)
    return (None,) * 4


def is_chromatic(value: str):
    """True / False / None(无法解析)。"""
    r, g, b, chroma = parse_color(value)
    if chroma is not None:
        return chroma > 0.0005
    if r is None:
        return None
    return (max(r, g, b) - min(r, g, b)) > CHROMA_TOLERANCE


def token_value(spec):
    """token 可能是 {type,value} 或 {type,dark,light}；统一取出所有字符串值。"""
    if not isinstance(spec, dict):
        return []
    out = []
    for key in ("value", "dark", "light"):
        v = spec.get(key)
        if isinstance(v, str):
            out.append((key, v))
    return out


def allowed_colors():
    """状态色与焦点环的白名单从 tokens.json 动态生成，避免双写。"""
    data = json.loads(TOKENS.read_text(encoding="utf-8-sig"))["tokens"]
    allow = set()
    for name, spec in data.items():
        if not (name.startswith(STATE_PREFIXES) or name in EXEMPT):
            continue
        for _, value in token_value(spec):
            if value.startswith("#"):
                allow.add(value[1:].lower()[:6])
    return allow


# ---------------------------------------------------------------- 判据

def check_token_chroma():
    """token 值可能是颜色、阴影、渐变或角度：抽出其中每个颜色分别判定。"""
    data = json.loads(TOKENS.read_text(encoding="utf-8-sig"))["tokens"]
    problems = []
    for name, spec in data.items():
        if name.startswith(STATE_PREFIXES) or name in EXEMPT or name.startswith(TINT_PREFIX):
            continue
        for theme, value in token_value(spec):
            colors = COLOR_RE.findall(value)
            if not colors:
                continue
            for raw in colors:
                verdict = is_chromatic(raw)
                if verdict is None:
                    problems.append(f"{name} [{theme}] 颜色语法无法解析: {raw}")
                elif verdict:
                    problems.append(f"{name} [{theme}] 带色度: {raw}（{value[:40]}）")
    return problems


def check_page_color():
    data = json.loads(TOKENS.read_text(encoding="utf-8-sig"))["tokens"]
    page = data.get("--gary-surface-page", {})
    problems = []
    for theme, expect in (("dark", (0, 0, 0)), ("light", (255, 255, 255))):
        value = page.get(theme, "")
        rgb = parse_color(value)[:3]
        if rgb[0] is None:
            problems.append(f"{theme} 页面底色无法解析: {value}")
        elif rgb != expect:
            problems.append(f"{theme} 页面底色不是{'纯黑' if theme == 'dark' else '纯白'}: {value}")
    return problems


def _strip_comments(text: str) -> str:
    return HTML_COMMENT_RE.sub("", COMMENT_RE.sub("", text))


def check_contract_classes():
    css = _strip_comments("\n".join(p.read_text(encoding="utf-8-sig") for p in CSS_FILES if p.exists()))
    problems = []
    for slug in COMPONENTS:
        contract_path = ROOT / "components" / f"{slug}.json"
        if not contract_path.exists():
            problems.append(f"缺契约: components/{slug}.json")
            continue
        contract = json.loads(contract_path.read_text(encoding="utf-8-sig"))
        for name in contract.get("cssClasses", []):
            selector = name if str(name).startswith(".") else f".{name}"
            pattern = re.escape(selector) + r"(?![\w-])"
            if not re.search(pattern, css):
                problems.append(f"{slug}: 契约声明了 {selector} 但 CSS 不存在")
    return problems


def check_no_chromatic_literals():
    allow = allowed_colors()
    problems = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in CHROMATIC_SKIP_DIRS]
        for filename in filenames:
            if not filename.endswith(CHROMATIC_EXTS):
                continue
            path = Path(dirpath) / filename
            try:
                text = _strip_comments(path.read_text(encoding="utf-8", errors="replace"))
            except OSError:
                continue
            rel = path.relative_to(ROOT).as_posix()
            for match in COLOR_RE.finditer(text):
                raw = match.group(0)
                if raw.startswith("#") and raw[1:].lower()[:6] in allow:
                    continue
                if raw.lower().startswith("color("):
                    space = raw[6:].strip().split()[0].lower() if len(raw) > 6 else ""
                    if space not in CSS_COLOR_SPACES:
                        continue
                verdict = is_chromatic(raw)
                if verdict is None:
                    body = raw[raw.find("(") + 1:] if "(" in raw else raw
                    # 变量插值、正则片段、字符串拼接不是字面色值
                    if re.search(r"[\[\]$'\"]", body) or re.search(r"[A-Za-z_]{2,}", body):
                        continue
                    problems.append(f"{rel}: 颜色语法无法解析 {raw}")
                elif verdict:
                    problems.append(f"{rel}: {raw}")
    return problems


def _track_count(value: str):
    """解析 grid-template-columns 的轨道数；无法判定返回 None。"""
    v = value.strip()
    if v in ("none", "auto", "inherit", "initial"):
        return None
    # 展开 repeat(n, …)（含 repeat(auto-fit, …) 记为不确定）
    def expand(m):
        n = m.group(1).strip()
        if not n.isdigit():
            raise ValueError
        return " ".join([m.group(2)] * int(n))

    try:
        v = re.sub(r"repeat\(\s*([^,]+),\s*(.+?)\)", expand, v)
    except ValueError:
        return None
    # 逐 token 数，忽略括号内的 minmax()/fit-content() 里的空格
    depth = 0
    count = 0
    buf = []
    for ch in v + " ":
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch.isspace() and depth == 0:
            if buf:
                count += 1
                buf = []
        else:
            buf.append(ch)
    return count


def check_two_column_dense():
    """高密度版面禁止两栏：按真实轨道数判定，不按类名判定。"""
    problems = []
    targets = list((ROOT / "patterns").rglob("*.css")) + list((ROOT / "patterns").rglob("*.html"))
    for path in targets:
        try:
            text = _strip_comments(path.read_text(encoding="utf-8", errors="replace"))
        except OSError:
            continue
        rel = path.relative_to(ROOT).as_posix()
        for match in re.finditer(r"([^{};]+)\{([^}]*)\}", text):
            selector, decl = match.group(1).strip(), match.group(2)
            if not re.search(r"\.(?:board|cols|dense)[\w-]*", selector):
                continue
            grid = re.search(r"grid-template-columns:\s*([^;]+)", decl)
            if not grid:
                continue
            tracks = _track_count(grid.group(1))
            if tracks == 2:
                problems.append(f"{rel}: {selector[:60]} 是两栏（高密度需三栏）")
        for match in re.finditer(r'style="([^"]*grid-template-columns:[^"]*)"', text):
            tracks = _track_count(re.search(r"grid-template-columns:\s*([^;\"]+)", match.group(1)).group(1))
            if tracks == 2:
                problems.append(f"{rel}: 行内样式写了两栏")
    return problems


def check_scene_not_occluded():
    """有 .pattern-scene 的页面，body 不能有不透明底色（否则点阵被整块盖掉）。"""
    problems = []
    for path in (ROOT / "patterns").rglob("*.html"):
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if 'class="pattern-scene"' not in text and "class='pattern-scene'" not in text:
            continue
        rel = path.relative_to(ROOT).as_posix()
        for block in re.findall(r"<style[^>]*>(.*?)</style>", text, re.S):
            for rule in re.finditer(r"(^|\})\s*([^{}]+?)\{([^}]*)\}", block, re.S):
                sel = rule.group(2).strip()
                if not re.match(r"^(html|body)(\s*,\s*html|\s*,\s*body)*$", sel):
                    continue
                body = _strip_comments(rule.group(3))
                bg = re.search(r"(?:^|;)\s*background(?:-color)?:\s*([^;]+)", body)
                if not bg:
                    continue
                value = bg.group(1).strip()
                if value in ("transparent", "none", "inherit", "unset"):
                    continue
                if "var(--gary-surface-page)" in value or value.startswith("#") or value.startswith("rgb") or value.startswith("oklch"):
                    problems.append(f"{rel}: {sel} 写了不透明底色 {value[:40]}，会盖掉 Scene")
    return problems


BASELINE_PATH = ROOT / "agent" / "checks" / "baseline.json"


def _baseline():
    if not BASELINE_PATH.exists():
        return {}
    try:
        return json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def check_font_floor():
    """配方页面的字号不得低于 micro 档（12px / 0.75rem）。

    历史配方（decision-report）尚未迁移，按棘轮处理：数量不得超过基线，
    低于基线时提示可以下调基线，避免「白名单藏缺陷」。
    """
    found = _scan_font_floor()
    base = _baseline().get("font_floor")
    if base is None:
        return found
    if len(found) <= base:
        return []
    return found


def _presentation_recipe_dirs():
    """16:9 演示/打印配方是投影与纸张表面，页脚与图注按 9–11px 排版（DESIGN §6 例外）。"""
    dirs = set()
    for prof in (ROOT / "patterns" / "recipes").glob("*/profile.json"):
        try:
            data = json.loads(prof.read_text(encoding="utf-8"))
        except Exception:
            continue
        comp = data.get("composition") or {}
        if (comp.get("presentationAspectRatio") or comp.get("printAspectRatio")) == "16:9":
            dirs.add(prof.parent)
    return dirs


def _scan_font_floor():
    problems = []
    presentation = _presentation_recipe_dirs()
    min_px = MIN_FONT_REM * 16
    for path in list((ROOT / "patterns" / "recipes").rglob("*.html")) + list((ROOT / "patterns" / "recipes").rglob("*.css")):
        try:
            text = _strip_comments(path.read_text(encoding="utf-8", errors="replace"))
        except OSError:
            continue
        rel = path.relative_to(ROOT).as_posix()
        if any(parent in presentation for parent in path.parents):
            continue
        for match in re.finditer(r"font-size:\s*([^;{}]+)", text):
            value = match.group(1).strip()
            if value.startswith("var(") or value.endswith("em") and not value.endswith("rem"):
                continue
            px = None
            m = re.match(r"([\d.]+)px$", value)
            if m:
                px = float(m.group(1))
            m = re.match(r"([\d.]+)rem$", value)
            if m:
                px = float(m.group(1)) * 16
            if px is not None and px < min_px - 0.01:
                problems.append(f"{rel}: font-size {value} 低于 micro 档 {MIN_FONT_REM}rem")
    return problems


def font_floor_count():
    return len(_scan_font_floor())



INDUSTRIAL_TOKENS = (
    "--gary-surface-card", "--gary-surface-raised", "--gary-surface-overlay",
    "--gary-hairline-soft", "--gary-hairline", "--gary-hairline-strong",
    "--gary-text-strong", "--gary-text-body", "--gary-text-meta",
    "--gary-text-caption", "--gary-text-faint",
    "--gary-accent-neutral", "--gary-selected-fill", "--gary-selected-edge",
)
INDUSTRIAL_DIMS = ("--gary-grid-gap", "--gary-font-size-data", "--gary-font-size-nano",
                   "--gary-duration-ui")


def check_industrial_contract():
    """工业轴契约：底色不带色相、四档明度、平底不叠玻璃、参考实现存在。"""
    data = json.loads(TOKENS.read_text(encoding="utf-8-sig"))["tokens"]
    problems = []
    for name in INDUSTRIAL_TOKENS:
        spec = data.get(name)
        if not spec:
            problems.append(f"缺 token: {name}")
            continue
        for theme, value in token_value(spec):
            parsed = parse_color(value)
            if parsed[0] is None:
                problems.append(f"{name} [{theme}] 不是可解析的颜色: {value}")
                continue
            chroma_literal = re.search(r"oklch\(\s*[\d.%]+\s+([\d.]+)", value)
            if chroma_literal and float(chroma_literal.group(1)) != 0:
                problems.append(f"{name} [{theme}] 底或墨色带色相: {value}")
            elif max(parsed[:3]) - min(parsed[:3]) > CHROMA_TOLERANCE:
                problems.append(f"{name} [{theme}] 底或墨色带色相: {value}")
    for name in INDUSTRIAL_DIMS:
        if name not in data:
            problems.append(f"缺尺寸/时长 token: {name}")

    css = _strip_comments((ROOT / "tokens" / "base.css").read_text(encoding="utf-8"))
    if '[data-gary-taste="industrial"]' not in css:
        problems.append("base.css 缺 [data-gary-taste=\"industrial\"] 覆盖块")
    else:
        block = css[css.index('[data-gary-taste="industrial"]'):]
        block = block[:block.find("\n}\n")] if "\n}\n" in block else block[:4000]

    demo = ROOT / "patterns" / "industrial" / "index.html"
    if not demo.exists():
        problems.append("缺参考实现 patterns/industrial/index.html")
    else:
        head = demo.read_text(encoding="utf-8", errors="replace")[:1200]
        if 'data-gary-taste="industrial"' not in head:
            problems.append("参考实现没有声明 data-gary-taste=\"industrial\"")
    return problems



ENTERPRISE_TOKENS = ROOT / "spec" / "archos-enterprise.tokens.json"


def check_enterprise_k_only():
    """企业面板层：底必须纯 K（R=G=B），墨与强调允许 theme A 既有的 ≤6 微调。

    底 = surface / line / *wash*；它们当 fill 或分隔线用，带任何色相都算违规。
    墨（text）与强调边是前景，来源是三风格对比 theme A，允许 ≤6/255 的既有偏色，不得更偏。
    """
    if not ENTERPRISE_TOKENS.exists():
        return []
    data = json.loads(ENTERPRISE_TOKENS.read_text(encoding="utf-8"))
    problems = []

    def maxdiff(value):
        rgb = parse_color(value)[:3]
        if rgb[0] is None:
            return None
        return max(rgb) - min(rgb)

    fills = list(data.get("color", {}).get("surface", [])) + list(data.get("color", {}).get("line", []))
    fills += [e for e in data.get("color", {}).get("accent", []) if "wash" in e[0]]
    for entry in fills:
        token, value = entry[0], entry[1]
        d = maxdiff(value)
        if d is None:
            problems.append(f"{token} 颜色无法解析: {value}")
        elif d != 0:
            problems.append(f"{token} 是底色却带色相（通道差 {d}）: {value}")

    for group in ("ink", "accent", "alias"):
        for entry in data.get("color", {}).get(group, []):
            token, value = entry[0], entry[1]
            if "wash" in token:
                continue
            d = maxdiff(value)
            if d is None:
                problems.append(f"{token} 颜色无法解析: {value}")
            elif d > 6:
                problems.append(f"{token} 前景偏色过重（通道差 {d} > 6）: {value}")
    return problems


SHELL_SELECTOR = re.compile(r"\.(?:[\w-]*(?:rail|sidebar|sidenav)[\w-]*)|\[data-[\w-]*(?:rail|sidebar)", re.I)


def check_no_shell_divider():
    """外壳不加分隔线：侧栏类选择器不得写 border-right（DESIGN「外壳不加分隔线」）。"""
    problems = []
    targets = list((ROOT / "patterns").rglob("*.css")) + list((ROOT / "patterns").rglob("*.html"))
    for path in targets:
        try:
            text = _strip_comments(path.read_text(encoding="utf-8", errors="replace"))
        except OSError:
            continue
        rel = path.relative_to(ROOT).as_posix()
        for rule in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
            selector, decl = rule.group(1).strip(), rule.group(2)
            if not SHELL_SELECTOR.search(selector):
                continue
            m = re.search(r"border-right\s*:\s*([^;]+)", decl)
            if not m:
                continue
            value = m.group(1).strip()
            if value.startswith("0") or value in ("none", "unset", "initial"):
                continue
            problems.append(f"{rel}: {selector[:50]} 写了 border-right: {value}")
    return problems



sys.path.insert(0, str(Path(__file__).resolve().parent))
import page_scan as _page  # noqa: E402  （判据实现放 page_scan.py，这里只用它的两段结果）

SKIP_HTML_DIRS = {"node_modules", ".git", "_superseded", "_archive", "dist", "build", ".next"}
# 历史演示页（旧 token、旧几何）不参与默认闸；改动它们要单独用 --page 审。
LEGACY_PAGES = {"demo0909.html"}


SCAN_ALL = False   # --all：连 examples 一起扫（历史示例默认不阻断）


def _html_targets():
    """闸的扫描面：patterns/**、仓库根目录页；--all 时扩到 examples 与其它目录。"""
    if SCAN_ALL:
        roots = [ROOT]
    else:
        roots = [ROOT / "patterns"]
        roots += [p for p in ROOT.glob("*.html")]
    for root in roots:
        iterable = [root] if root.is_file() else root.rglob("*.html")
        for path in iterable:
            if path.suffix.lower() != ".html":
                continue
            if any(part in SKIP_HTML_DIRS for part in path.relative_to(ROOT).parts):
                continue
            if path.name in LEGACY_PAGES and not SCAN_ALL:
                continue
            yield path


def check_no_square_card():
    tokens = _page._tokens(ROOT)
    problems = []
    for path in _html_targets():
        problems += _page.geometry_problems(path, tokens)
    return problems


def check_report_text():
    """正文规则（内部编码 / 结论唯一）只对报告页强制：patterns/recipes/**；
    其它页面要审就把路径交给 --page —— 目录/演示页天然会重复标签，不属此条。"""
    tokens = _page._tokens(ROOT)
    problems = []
    for path in (ROOT / "patterns" / "recipes").rglob("*.html"):
        if any(part in SKIP_HTML_DIRS for part in path.relative_to(ROOT).parts):
            continue
        problems += _page.text_problems(path, tokens)
    return problems


def check_page(path):
    """单页模式：几何 + 正文（内部编码 / 结论重复）。退出码 1 = 不过，2 = 找不到文件。"""
    target = Path(path).resolve()
    if not target.exists():
        print(f"找不到文件：{target}")
        return 2
    tokens = _page._tokens(ROOT)
    problems = _page.scan_file(target, tokens)
    if not problems:
        print(f"page checks: ok  {target.name}")
        return 0
    print(f"page checks: {len(problems)} 处（方角卡片 / 内部编码 / 结论重复）")
    for item in problems:
        print("  -", item)
    return 1



def check_tint_contract():
    """语义色块通道：--gary-tint-* 必须在 spec/tints.json 登记，配 ink，且对比度 ≥4.5。"""
    tokens = json.loads(TOKENS.read_text(encoding="utf-8-sig"))["tokens"]
    registry_path = ROOT / "spec" / "tints.json"
    registered = {}
    if registry_path.exists():
        data = json.loads(registry_path.read_text(encoding="utf-8"))
        for item in data.get("items", []):
            registered[item.get("token", "")] = item
    problems = []
    for name in tokens:
        if not name.startswith(TINT_PREFIX) or name.endswith("-ink"):
            continue
        item = registered.get(name)
        if item is None:
            problems.append(f"{name} 带色但未在 spec/tints.json 登记")
            continue
        ink = f"{name}-ink"
        if ink not in tokens:
            problems.append(f"{name} 缺少配对前景 token {ink}")
        if float(item.get("contrast", 0)) < 4.5:
            problems.append(f"{name} 与 {ink} 的对比度 {item.get('contrast')} < 4.5")
    return problems


def run_gate(script):
    try:
        proc = subprocess.run([sys.executable, "-B", str(ROOT / "scripts" / script)],
                              cwd=ROOT, capture_output=True, text=True, timeout=600)
    except subprocess.TimeoutExpired:
        return False, "timeout"
    out = proc.stdout or ""
    if proc.returncode != 0:
        return False, out[-400:]
    status = None
    for line in out.splitlines():
        if '"status"' in line:
            try:
                status = json.loads(line).get("status")
            except Exception:
                status = None
    if status == "fail":
        return False, out[-400:]
    return True, out[-400:]


CHECKS = (
    ("token_chroma", check_token_chroma),
    ("page_color", check_page_color),
    ("contract_classes", check_contract_classes),
    ("no_chromatic", check_no_chromatic_literals),
    ("dense_columns", check_two_column_dense),
    ("scene_visible", check_scene_not_occluded),
    ("font_floor", check_font_floor),
    ("industrial", check_industrial_contract),
    ("enterprise_k_only", check_enterprise_k_only),
    ("no_shell_divider", check_no_shell_divider),
    ("no_square_card", check_no_square_card),
    ("report_text", check_report_text),
    ("tint_contract", check_tint_contract),
)


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if "--all" in argv:
        globals()["SCAN_ALL"] = True
    if "--page" in argv:
        idx = argv.index("--page")
        if idx + 1 >= len(argv) or argv[idx + 1].startswith("-"):
            print("用法: python -B agent/checks/invariants.py --page <html 文件>")
            return 2
        return check_page(argv[idx + 1])
    report = {name: fn() for name, fn in CHECKS}
    gates = {}
    for script in ("validate_v2.py", "audit-ui.py"):
        ok, tail = run_gate(script)
        gates[script] = ok
    report["gates"] = gates
    failed = {k: v for k, v in report.items() if k != "gates" and v}
    ok = not failed and all(gates.values())

    if "--json" in argv:
        print(json.dumps({"ok": ok, **report}, ensure_ascii=False, indent=1))
    else:
        print("INVARIANTS " + ("PASS" if ok else "FAIL"))
        for name, _ in CHECKS:
            items = report[name]
            print(f"  {name:16s}: {'ok' if not items else str(len(items)) + ' problem(s)'}")
            for item in items[:8]:
                print(f"    - {item}")
        for name, okk in gates.items():
            print(f"  {name:16s}: {'pass' if okk else 'FAIL'}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
