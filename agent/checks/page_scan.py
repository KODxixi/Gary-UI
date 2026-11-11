"""页面扫描引擎 —— 几何（方角卡片）、正文内部编码、结论重复渲染。

只用标准库。判据按**语义与元素类型**，不按类名子串猜：
- 带填充且不贴页面边缘的块必须有 ≥8px 圆角；表格单元/表格行、贴边块（rail/band/strip）、
  状态填充（:hover/:active/[aria-*]/.is-）不属此条。
- 圆角值要能解析成真实长度：px / rem / em 换算后判；百分号 0% 视为 0；
  var(--gary-radius-*) 必须能在 tokens 里解析出 ≥8px，解析不出的按缺陷报（不可验证）。
- 正文出现 SC2 / AD3 / SRC-MKT-01 等内部编码即报；索引区必须显式写 data-gary-index。
- 同一段结论在页面上出现两次即报（≥12 字，空白与 &nbsp; 归一后比对）。
"""

from __future__ import annotations

import re
import unicodedata
from html.parser import HTMLParser
from pathlib import Path

BLOCK_TAGS = {
    "p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "td", "th",
    "figcaption", "blockquote", "section", "article", "header", "footer",
    "aside", "dd", "dt", "summary", "tr", "main", "nav",
}
# 表格单元与表格行：靠 1px 分隔线承担分区，不属「卡片」。
SHEET_TAGS = {"tr", "td", "th", "thead", "tbody", "tfoot", "colgroup", "col", "table"}
# 页面/场景底、图标、图表标记：不是「卡片」，不参与圆角判定。
SURFACE_TAGS = {"html", "body", "i", "svg", "img", "hr", "pre", "code", "kbd", "main"}
SURFACE_CLASS = re.compile(
    r"(?:^|[-_])(scene|stage|backdrop|bg|page|root|chart|bars?|series|spark|track|meter|gauge|"
    r"progress|icon|sheet|drawer|scrim|mask|cover|mass|figure|illustration)(?:[-_]|$)", re.I)
# 贴边块与不可见装饰：rail / band / strip / scrim / 分隔线不属卡片。
EDGE_CLASS = re.compile(r"(?:^|[-_])(rail|str?ip|band|bar|divider|scrim|rule|hairline|dot|grid-line)(?:[-_]|$)", re.I)
# 名字里只要带了这些词，就是卡片 —— 豁免不能靠「类名里有 page/rail」蒙混
CARD_HINT = re.compile(r"(?:^|[-_])(card|panel|box|block|tile|surface|plate|callout|judg|insight|verdict|tip|note)(?:[-_]|$)", re.I)
STATE_SEL = re.compile(r":(hover|active|focus|focus-visible|focus-within|disabled|checked|target|current)|::|\[aria-|\.is-|\[data-state", re.I)
INTERNAL_CODE = re.compile(r"(?<![A-Za-z0-9_-])(?:SC|AD)\s*[-‑–—#_·().:\[\]]?\s*\d{1,2}(?!\d)"
                           r"|(?<![A-Za-z0-9_-])SRC\s*[-‑#_·]?\s*[A-Z]{2,}(?:\s*[-‑]\s*[A-Z]{2,})?\s*[-‑]\s*\d+")
LENGTH = re.compile(r"^([0-9.]+)(px|rem|em|r?em|%)?$", re.I)
DISCLAIMER = re.compile(r"免责|示意|不代表|注：|数据来源|仅供|假数据|模拟数据")
AT_RULE_BLOCK = re.compile(r"@(?:media|supports|container|layer)[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", re.S)
RADIUS_TOKEN = re.compile(r"--gary-radius-(?:control|card|panel|pill|micro|sm|md|lg|[a-z-]+)")


class Page(HTMLParser):
    """收集可见文本、样式、元素，并标记索引区与代码区。"""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool, bool, set[str]]] = []
        self.blocks: list[str] = []
        self.all_blocks: list[tuple[str, bool]] = []   # (文本, 是否在索引区)
        self.buf: list[str] = []
        self.text_buf: list[str] = []
        self.inline: list[tuple[str, set[str], str]] = []   # (tag, classes, style attr)
        self.css: list[str] = []
        self.links: list[str] = []
        self._style_depth = 0
        self._script_depth = 0
        self.demo = False

    # -- helpers ---------------------------------------------------------
    def _state(self) -> tuple[bool, bool]:
        index = any(s[1] for s in self.stack)
        code = any(s[2] for s in self.stack)
        return index, code

    def handle_starttag(self, tag, attrs):
        a = {k.lower(): (v or "") for k, v in attrs}
        classes = set((a.get("class") or "").split())
        own_index = "data-gary-index" in a and tag not in {"body", "html"}
        index = own_index or any(s[1] for s in self.stack)
        code = tag in {"pre", "code"} or any(s[2] for s in self.stack)
        self.stack.append((tag, index, code, classes))
        if "style" in a:
            self.inline.append((tag, classes, a["style"]))
        if tag == "link" and "stylesheet" in (a.get("rel") or "").lower() and a.get("href"):
            self.links.append(a["href"])
        if tag == "style":
            self._style_depth += 1
        if tag == "script":
            self._script_depth += 1
        if "data-gary-demo" in a:
            self.demo = True
        if tag in BLOCK_TAGS:
            self._flush()

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1][0] == tag:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in BLOCK_TAGS:
            self._flush()
        if tag == "style":
            self._style_depth = max(0, self._style_depth - 1)
        if tag == "script":
            self._script_depth = max(0, self._script_depth - 1)
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self._style_depth:
            self.css.append(data)
            return
        if self._script_depth:
            return
        self.buf.append(data)

    def _flush(self):
        text = " ".join("".join(self.buf).split())
        if text:
            index, code = self._state()
            if not index and not code:
                self.blocks.append(text)
            in_nav = any(entry[0] == "nav" for entry in self.stack)
            self.all_blocks.append((text, code or in_nav))
        self.buf = []

    def close(self):
        super().close()
        self._flush()


def _tokens(repo_root: Path) -> dict[str, str]:
    """读 tokens 里的圆角变量真值（base.css 为生成物，与 tokens.json 同值）。"""
    out: dict[str, str] = {}
    css = repo_root / "tokens" / "base.css"
    if css.exists():
        for line in css.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.match(r"\s*(--gary-radius-[a-z-]+)\s*:\s*([^;]+);", line)
            if m:
                out[m.group(1)] = m.group(2).strip()
    return out


def radius_ok(value: str, tokens: dict[str, str], depth: int = 0, pseudo: bool = False) -> tuple[bool | None, str]:
    """True=合规, False=违规, None=无法判定。inherit 只有伪元素算合法（继承父级几何）。"""
    raw = re.sub(r"!\s*important\s*$", "", value.strip(), flags=re.I).strip()
    if raw == "inherit":
        return (True, "伪元素继承父级圆角") if pseudo else (None, "继承父级，父级未知")
    if not raw or raw in {"initial", "unset", "revert"}:
        return None, "未给值"
    parts = [p for p in re.split(r"[\s/]+", raw) if p]
    resolved: list[float | None] = []
    for part in parts:
        if part.startswith("var("):
            name = part[4:].split(",")[0].strip().rstrip(")")
            if name not in tokens:
                return None, f"变量 {name} 未在 tokens/base.css 定义"
            if depth > 3:
                return None, "变量递归过深"
            ok, why = radius_ok(tokens[name], tokens, depth + 1)
            if ok is None:
                return None, why
            if not ok:
                return False, f"{name} → {why}"
            resolved.append(8.0)
            continue
        if part.startswith("calc(") or part.startswith("clamp("):
            nums = [float(n) for n in re.findall(r"([0-9.]+)px", part)]
            resolved.append(max(nums) if nums else None)
            continue
        if part.startswith("-"):
            return False, f"负值 {part}"
        m = LENGTH.match(part)
        if not m:
            return None, f"无法解析 {part}"
        num, unit = float(m.group(1)), (m.group(2) or "px").lower()
        if unit == "px":
            resolved.append(num)
        elif unit in {"rem", "em"}:
            resolved.append(num * 16)
        elif unit == "%":
            if num == 0:
                resolved.append(0.0)
            elif num >= 50:
                resolved.append(999.0)                   # 50%+ = 圆形/胶囊
            else:
                resolved.append(None)
    if not resolved:
        return False, "未给值"
    values = [v for v in resolved if v is not None]
    if len(values) != len(resolved):
        return None, "含无法判定的单位或非 0 百分比"
    smallest = min(values)
    return (smallest >= 8.0), f"最小角 {smallest}px"


def _radius_decl(decl: str, tokens: dict[str, str] | None = None) -> tuple[str | None, float | None]:
    """返回（最后一条 border-radius 值, 长写单角里的最小值）。长写同样走 radius_ok。"""
    values = re.findall(r"(?<!-)border-radius\s*:\s*([^;]+)", decl, re.I)
    longhands = re.findall(r"border-(?:top|bottom)-(?:left|right)-radius\s*:\s*([^;]+)", decl, re.I)
    smallest: float | None = None
    for v in longhands:
        val: float | None = None
        for tok in re.split(r"[\s/]+", v.strip()):
            m = re.match(r"^([0-9.]+)(px|rem|em|%)?$", tok, re.I)
            if not m:
                continue
            num, unit = float(m.group(1)), (m.group(2) or "px").lower()
            cand = {"px": num, "em": num * 16, "rem": num * 16, "%": (0.0 if num == 0 else 999.0)}[unit]
            val = cand if val is None else min(val, cand)
        if val is None and tokens is not None:
            ok, _why = radius_ok(v, tokens, pseudo=True)
            val = 0.0 if ok is not True else 8.0      # 无法解析按 0 处理：宁可报也不放过
        if val is not None:
            smallest = val if smallest is None else min(smallest, val)
    return (values[-1].strip() if values else None), smallest


def _is_hairline(decl: str) -> bool:
    """高度或宽度 ≤2px 的填充条是发丝线/分隔条，不是卡片。"""
    for prop in ("height", "max-height", "min-height", "width", "max-width", "min-width"):
        m = re.search(rf"(?<!-){prop}\s*:\s*([\d.]+)px", decl)
        if m and float(m.group(1)) <= 2:
            return True
    return False


def _solid_fill(value: str) -> bool:
    v = value.strip().lower()
    if v in {"transparent", "none", "inherit", "unset", "initial"}:
        return False
    return True


def _chromatic(color: str) -> bool:
    """左边条只在带色相时算违规；中性灰/发丝线放行。"""
    c = color.strip().lower()
    if c.startswith(("var(--gary-line", "var(--gary-hairline", "var(--gary-border", "var(--gary-divider")):
        return False
    if c.startswith(("var(--gary-state", "var(--gary-accent")):
        return True
    m = re.search(r"#([0-9a-f]{3,8})\b", c)
    if m:
        h = m.group(1)
        if len(h) == 3:
            h = "".join(ch * 2 for ch in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return (max(r, g, b) - min(r, g, b)) > 8
    m = re.search(r"rgba?\(([^)]+)\)", c)
    if m:
        nums = [float(x) for x in re.findall(r"[0-9.]+", m.group(1))[:3]]
        if len(nums) == 3:
            return (max(nums) - min(nums)) > 8
    return True   # 命名色 / hsl / 渐变：默认按彩色处理



def _split_selector(selector: str) -> list[str]:
    """按逗号切选择器，忽略 :is()/:where() 括号里的逗号。"""
    parts, depth, buf, quote = [], 0, "", ""
    for ch in selector:
        if quote:
            buf += ch
            if ch == quote:
                quote = ""
            continue
        if ch in "\"'":
            quote = ch
            buf += ch
            continue
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0:
            parts.append(buf.strip()); buf = ""
        else:
            buf += ch
    if buf.strip():
        parts.append(buf.strip())
    return [x for x in parts if x]


def _flatten_pseudo(part: str) -> str:
    """展开 :is()/:where()；:not() 整个删掉（否则「非激活」会被当成状态豁免）。"""
    for _ in range(4):
        new = re.sub(r":not\([^()]*\)", "", part)
        new = re.sub(r":(?:is|where|has)\(([^()]*)\)", r"\1", new)
        if new == part:
            break
        part = new
    return part

_COMPONENT_CLASSES: set[str] | None = None


def component_classes(repo_root: Path | None = None) -> set[str]:
    """组件层真实存在的 .gary-* 类（几何由组件提供，不靠类名前缀猜）。"""
    global _COMPONENT_CLASSES
    if _COMPONENT_CLASSES is not None:
        return _COMPONENT_CLASSES
    names: set[str] = set()
    root = repo_root or Path(__file__).resolve().parents[2]
    for f in [root / "components" / "components.css", root / "tokens" / "base.css"]:
        if f.exists():
            names |= set(re.findall(r"\.(gary-[\w-]+)", f.read_text(encoding="utf-8", errors="replace")))
    _COMPONENT_CLASSES = names
    return names


def _edge_class(classes: set[str]) -> bool:
    """贴边块/页面底/图表标记算非卡片；但类名里同时出现 card/panel 这类词就不算豁免。"""
    if any(CARD_HINT.search(c) for c in classes):
        return False
    return any(EDGE_CLASS.search(c) or SURFACE_CLASS.search(c) for c in classes)



def _bar_problems(decl: str, label: str) -> list[str]:
    """≥2px 带色相的左边条：简写与长写都认。"""
    problems = []
    bar = re.search(r"border-(?:left|inline-start)\s*:\s*([\d.]+)px\s+\w+\s+([^;]+)", decl, re.I)
    if bar is not None:
        width, color = float(bar.group(1)), bar.group(2)
        if width >= 2 and _chromatic(color):
            problems.append(f"{label} 用 {width}px 彩色左边条强调（反 slop 红线）")
        return problems
    bw = re.search(r"border-(?:left|inline-start)-width\s*:\s*([\d.]+)px", decl, re.I)
    bc = re.search(r"border-(?:left|inline-start)-color\s*:\s*([^;]+)", decl, re.I)
    if bw is not None and bc is not None:
        width = float(bw.group(1))
        if width >= 2 and _chromatic(bc.group(1)):
            problems.append(f"{label} 用 {width}px 彩色左边条强调（反 slop 红线）")
    return problems


def rule_problems(css: str, rel: str, tokens: dict[str, str], radius_index: dict[str, str] | None = None) -> list[str]:
    radius_index = radius_index or {}
    problems: list[str] = []
    css = re.sub(r"/\*.*?\*/", " ", css, flags=re.S)
    for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css):
        raw_selector = m.group(1).strip()
        decl = m.group(2)
        if not raw_selector or raw_selector.startswith("@"):
            continue
        parts = [_flatten_pseudo(x) for x in _split_selector(raw_selector)]
        # 只要有一个部分是卡片，就必须写圆角（防止 .card, body{...} 半路豁免）
        selector = next((x for x in parts if not _edge_class(set(re.findall(r"\.([\w-]+)", x)))), parts[-1])
        bar_hits = _bar_problems(decl, f"{rel}: {raw_selector[:60]}")
        if not re.search(r"(?<!-)background(?:-color|-image)?\s*:", decl, re.I):
            problems += bar_hits
            continue
        bg = list(re.finditer(r"(?<!-)background(?:-color|-image)?\s*:\s*([^;]+)", decl, re.I))[-1].group(1)
        if not _solid_fill(bg):
            continue
        last = re.split(r"[\s>+~]+", selector)[-1]
        tag = re.match(r"([a-zA-Z][\w-]*)", last)
        tag = tag.group(1).lower() if tag else ""
        if tag in SURFACE_TAGS:
            continue                                    # 页面/场景底、图标
        if tag in SHEET_TAGS:
            continue                                    # 表格单元：靠分隔线，不属于卡片
        if "data-gary-scene" in selector.lower():
            continue                                    # 场景底（点阵/网格）
        pseudo_fill = bool(re.search(r"::?(before|after)", selector))
        if STATE_SEL.search(selector) and not pseudo_fill:
            continue                                    # 状态填充：hover/active/aria/is-
        classes = set(re.findall(r"\.([\w-]+)", selector))
        if _edge_class(classes):
            continue                                    # 贴边块：rail / band / strip
        if pseudo_fill and _is_hairline(decl):
            continue                                    # 1px 发丝线/分隔条
        radius, longhand_min = _radius_decl(decl, tokens)
        owned = bool(classes & component_classes())
        if radius is None:
            inherited = next((radius_index[k] for k in
                              (_flatten_pseudo(x) for x in parts) if k in radius_index), None)
            if inherited:
                ok, _why = radius_ok(inherited, tokens, pseudo=pseudo_fill)
                if ok is not False:
                    continue
            if owned and longhand_min is None:
                continue                                # 组件类：几何来自组件层
            if longhand_min is None:
                problems.append(f"{rel}: {selector[:60]} 有填充但没有圆角（方角卡片）")
        else:
            ok, why = radius_ok(radius, tokens, pseudo=pseudo_fill)
            if ok is None:
                problems.append(f"{rel}: {selector[:60]} 圆角无法验证（{why}）")
            elif not ok:
                problems.append(f"{rel}: {selector[:60]} 圆角不足 8px（{why}）")
        if longhand_min is not None and longhand_min < 8 and not pseudo_fill:
            problems.append(f"{rel}: {selector[:60]} 单角圆角 {longhand_min}px（<8px）")
        problems += bar_hits
    return problems


def inline_problems(tag: str, classes: set[str], style: str, rel: str, tokens: dict[str, str]) -> list[str]:
    problems: list[str] = []
    fills = list(re.finditer(r"(?<!-)background(?:-color|-image)?\s*:\s*([^;]+)", style, re.I))
    if not fills:
        return problems
    bg = fills[-1].group(1)
    if not _solid_fill(bg):
        return problems
    if tag.lower() in SHEET_TAGS or tag.lower() in SURFACE_TAGS or _edge_class(classes):
        return problems
    radius, longhand_min = _radius_decl(style, tokens)
    if not radius:
        if classes & component_classes() and longhand_min is None:
            return problems
        if longhand_min is None:
            problems.append(f"{rel}: <{tag}> 行内 style 有填充但没有圆角（方角卡片）")
    else:
        ok, why = radius_ok(radius, tokens)
        if ok is None:
            problems.append(f"{rel}: <{tag}> 行内圆角无法验证（{why}）")
        elif not ok:
            problems.append(f"{rel}: <{tag}> 行内圆角不足 8px（{why}）")
    if longhand_min is not None and longhand_min < 8:
        problems.append(f"{rel}: <{tag}> 行内单角圆角 {longhand_min}px（<8px）")
    bar = re.search(r"border-(?:left|inline-start)\s*:\s*([\d.]+)px\s+\w+\s+([^;]+)", style, re.I)
    if bar is not None:
        width, color = float(bar.group(1)), bar.group(2)
        if width >= 2 and _chromatic(color):
            problems.append(f"{rel}: <{tag}> 行内 {width}px 彩色左边条强调")
    return problems


ZERO_WIDTH = re.compile(r"[\u200b-\u200f\u2060\ufeff]")


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKC", text)      # 全角 → 半角
    text = ZERO_WIDTH.sub("", text).replace("\u00a0", "")
    return re.sub(r"\s+", "", text)


def geometry_problems(path: Path, tokens: dict[str, str]) -> list[str]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    page = Page()
    page.feed(raw)
    page.close()
    rel = path.name
    problems: list[str] = []
    local = dict(tokens)
    for css_text in page.css:
        for name, value in re.findall(r"(--[\w-]+)\s*:\s*([^;]+);", css_text):
            local[name] = value.strip()      # 页面里重定义就按页面判
    tokens = local

    # 1) 样式表（内联 <style> + 同目录外链 CSS）
    external = []
    for href in page.links:
        if href.startswith(("http:", "https:", "//")):
            continue
        target = (path.parent / href).resolve()
        if target.exists():
            external.append((href, target.read_text(encoding="utf-8", errors="replace")))
    index = radius_index([AT_RULE_BLOCK.sub(" ", t) for t in page.css + [t for _, t in external]])
    for css_text in page.css:
        problems += rule_problems(css_text, rel, tokens, index)
    for href, text in external:
        problems += rule_problems(text, f"{rel} → {href}", tokens, index)

    # 2) 行内 style
    for tag, classes, style in page.inline:
        problems += inline_problems(tag, classes, style, rel, tokens)

    # 2.5) 变量没装载：页面用 var(--gary-*) 但既没 link tokens/base.css 也没内联定义
    used = set(re.findall(r"var\((--gary-[\w-]+)", raw))
    if used:
        defined = set(re.findall(r"(--gary-[\w-]+)\s*:", "\n".join(page.css)))
        seen: set[Path] = set()
        queue = [(path.parent / h).resolve() for h in page.links if not h.startswith(("http", "//"))]
        while queue:
            css_path = queue.pop()
            if css_path in seen or not css_path.exists() or len(seen) > 8:
                continue
            seen.add(css_path)
            text = css_path.read_text(encoding="utf-8", errors="replace")
            defined |= set(re.findall(r"(--gary-[\w-]+)\s*:", text))
            for imp in re.findall(r'@import\s+(?:url\()?["\']?([^"\')\s]+)', text):
                queue.append((css_path.parent / imp).resolve())
        missing = sorted(used - defined)
        if missing:
            problems.append(f"{rel}: 用了 {', '.join(missing[:4])} 但页面没引入 tokens/base.css（变量失效，圆角等实际为 0）")

    return problems


def text_problems(path: Path, tokens: dict[str, str]) -> list[str]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    page = Page()
    page.feed(raw)
    page.close()
    rel = path.name
    problems: list[str] = []

    # 3) 内部编码（索引区与代码块除外）
    hits = sorted({m.group(0) for block in page.blocks for m in INTERNAL_CODE.finditer(_norm(block))})
    if hits:
        problems.append(f"{rel}: 正文出现内部编码 {', '.join(hits[:6])}（改成中文人话，或移入 data-gary-index 索引区）")

    # 4) 结论重复（演示页豁免：版式样本不承担内容质量）
    seen: dict[str, int] = {}
    for block, skip_dup in page.all_blocks:
        if skip_dup:
            continue
        norm = _norm(block)
        units = list(dict.fromkeys(u for u in re.split(r"(?<=[。！？])", norm) if u))
        for unit in units:
            if len(unit) < 20 or not re.search(r"[。，；：、]", unit) or DISCLAIMER.search(unit):
                continue                                # 标题、标签、跑马头不算结论
            seen[unit] = seen.get(unit, 0) + 1
            if seen[unit] == 2:
                problems.append(f"{rel}: 同一段结论重复渲染 —— “{unit[:26]}…”（结论只许渲染一次）")
                break
        # 同一块内重复（多个 span / 多个节点承载同一句）
        repeated = ""
        for length in range(min(48, len(norm) // 2), 11, -1):
            pos: dict[str, int] = {}
            for i in range(0, len(norm) - length + 1):
                chunk = norm[i:i + length]
                if chunk in pos and i - pos[chunk] >= length:
                    repeated = chunk
                    break
                pos.setdefault(chunk, i)
            if repeated:
                break
        if repeated:
            problems.append(f"{rel}: 同一段结论在块内重复出现 —— “{repeated[:24]}…”（结论只许渲染一次）")
    return problems


def radius_index(texts: list[str]) -> dict[str, str]:
    """收集「选择器 → 圆角值」，用于判跨规则的几何继承。"""
    index: dict[str, str] = {}
    for text in texts:
        text = re.sub(r"/\*.*?\*/", " ", text, flags=re.S)
        for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", text):
            radius = re.search(r"border-radius\s*:\s*([^;]+)", m.group(2))
            if not radius:
                continue
            for part in _split_selector(m.group(1).strip()):
                index.setdefault(_flatten_pseudo(part).strip(), radius.group(1).strip())
    return index


def scan_file(path: Path, tokens: dict[str, str]) -> list[str]:
    """几何 + 文本一次跑完（--page 用）。"""
    return geometry_problems(path, tokens) + text_problems(path, tokens)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("用法: python agent/checks/page_scan.py <html> [--repo <gary-ui 根>]")
        return 2
    target = Path(argv[1]).resolve()
    if not target.exists():
        print(f"找不到文件：{target}")
        return 2
    repo = Path(argv[argv.index("--repo") + 1]).resolve() if "--repo" in argv else target.parent
    problems = scan_file(target, _tokens(repo))
    if not problems:
        print(f"page checks: ok  {target.name}")
        return 0
    print(f"page checks: {len(problems)} 处")
    for item in problems:
        print("  -", item)
    return 1


if __name__ == "__main__":
    import sys

    raise SystemExit(main(sys.argv))
