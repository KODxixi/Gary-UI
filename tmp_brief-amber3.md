# 橙色主题收口：双档色值 + 让橙色真的出现在页面上

Gary 原话：「我要的是橙色，不是棕色」。上一版全偏暗（明度 60–72%），在屏幕上读作暗橙/土色 = 棕。

**根因两条，都要修：**

1. **色值全压错了档**。橙要明度 90%+ 才像橙，但亮橙做不了文字（白底只有 2.3–3.1:1）。所以必须拆两个角色：**亮橙做面，深橙做字**。
2. **页面上根本没有橙色的位置**。实测 `out/demo-report.html`：`var(--color-accent)` 有 28 个消费点，但**全部只做背景**，且真正渲染出来的只有 4 个小元素（时间轴圆点一类）。整页看过去是灰白 + 黑，橙色等于不存在。换哪一档橙都看不出差别。这是 2026-11-17 上一轮把绿 callout 降成灰之后留下的窟窿：品牌色没有落点了。

---

## 一、改色值（`theme/gary.theme.mjs`）

四行，直接抄：

```js
'--color-accent':        ['#F57C00', '#FFA94D'],   // 亮橙：按钮/色块/图形。hue 30 明度 96%
'--color-text-accent':   ['#B85C00', '#FFA94D'],   // 深橙：正文链接。白底 4.60 过 AA
'--color-accent-muted':  ['#FFF1E0', '#3A2213'],   // 浅橙底
'--color-on-accent':     ['#1A0E00', '#111111'],   // 亮橙底上用近黑字（7.02:1），不是白字
```

`--color-on-accent` 现在是 `#ffffff` —— 亮橙底上白字只有 **2.70:1**，必须改近黑。这条别漏。

`--color-surface-inverse: ['#181614', '#131211']` 和 `--color-surface-inverse-muted: ['#B8B0A8', '#A69E96']` 上一版已经对了，不动。

`--color-info: ['#4A6785', '#8FAFC9']` 上一版也对，不动。

---

## 二、让橙色出现在页面上（`agent/recipes/sections.mjs`）

只加三处，别重构，别动版式骨架：

**1. KPI 主指标的数字用亮橙**（最重要的一处）

主指标在反白块 `#181614` 里，数字现在走 `--color-surface-inverse-text`（近白）。把它改成 `--color-accent` —— 在这个深底上会取暗侧 `#FFA94D`，对比 **9.48:1**，很稳。

这是整页最大的一处橙色落点，也是唯一「一眼看见」的地方。

**2. section 标题前的标记用亮橙**

如果现在有圆点/短杠/序号的视觉标记，把它染成 `--color-accent`；如果没有，不要新造装饰，跳过这条。

**3. 表格里的强调行/列标记（如果有现成的 `tone` 或 badge）用 `--color-accent-muted` 做底**

没有就跳过。**不要为了放橙色而新造元素。**

判断标准：**橙色应该出现在它本来该在的语义位置上（主指标、强调、当前态），不是撒在装饰上。** 拿不准的地方宁可不加。

---

## 三、禁区

- 不改 `viz/`（图表是 Google 色板，与品牌无关）
- 不改 `node_modules/`、`out/`、不加 `<script>`、不引外链
- 不动版式、间距、圆角、字号
- 不改 `warning` / `success` / `error`
- 注释里凡是「ink green / 墨绿 / 深绿」全删

文档同步：`agent/CONTRACT.md` §5、`agent/content.schema.md` 品牌色段、`AGENTS.md`、`README.md` 里出现旧橙值的全部改成上面的。

---

## 四、验收

```bash
cd C:/AI/UI/gary-ui
npm run verify
```

`exit 0` + 最后一行 `ALL PASS`。**不许改闸阈值凑过。**

```bash
grep -rn "24514a\|5d9c8f\|1E3A34\|0E1C19\|2E1508\|C2410C\|墨绿\|ink.green" --include=*.mjs --include=*.md --include=*.json . 2>/dev/null | grep -v node_modules | grep -v "^./out/" | grep -v "^./archive/"
```

必须空输出。

```bash
"C:/Program Files/Python313/python.exe" - <<'EOF'
import re
src=open(r'C:/AI/UI/gary-ui/theme/gary.theme.mjs',encoding='utf-8').read()
def hsv(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    mx,mn=max(r,g,b),min(r,g,b); s=0 if mx==0 else (mx-mn)/mx
    if mx==mn: hu=0
    elif mx==r: hu=((g-b)/(mx-mn))%6
    elif mx==g: hu=(b-r)/(mx-mn)+2
    else: hu=(r-g)/(mx-mn)+4
    return round(hu*60), round(s*100), round(mx*100)
for n in ['--color-accent','--color-text-accent','--color-accent-muted','--color-on-accent']:
    m=re.search(r"'"+re.escape(n)+r"':\s*\['(#[0-9A-Fa-f]{6})',\s*'(#[0-9A-Fa-f]{6})'\]", src)
    print(f"MISSING {n}" if not m else f"{n:24} " + "  ".join(f"{v} hue{hsv(v)[0]:3} v{hsv(v)[2]:3}%" for v in m.groups()))
EOF
```

`--color-accent` 那行**明度必须 ≥ 90%**（低于 90 就又变成暗橙 = 棕）。`--color-on-accent` 明度必须 ≤ 15%（近黑）。

**最后自己截一张 `out/demo-report.html` 的顶部 1440×1000，确认橙色在 KPI 主数字上真的看得见**——如果看不见，说明第二步没做到，别回「已完成」。

---

## 五、回执

1. `npm run verify` 退出码 + 最后 3 行
2. 第一条 grep 输出（空就是空）
3. Python 脚本输出
4. `git diff --stat`
5. **一段话**：你把橙色加到了哪几处，每处是哪个函数/哪一行

不要写「更现代」「更有活力」。只要 exit code、grep、行号。
