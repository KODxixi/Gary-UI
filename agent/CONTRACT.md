# Gary-UI · Agent 调用契约（Astryx 版 · v2）

> 位置 `agent/CONTRACT.md`。给外部 agent 的唯一调用入口：读完这一份就能出页，不用翻别的文档。
> 一句话：**页面 = content.json；只能拼，不能发明。** 不写 HTML、不写 CSS、不写 JS。
> 底座：`@astryxdesign/core` 0.7.16（174 个组件）+ React 19 SSR。品牌层：`theme/gary.theme.mjs`。
> 两个渲染器：`agent/render.mjs`（18 类文本区块）· `viz/render-viz.mjs`（同一套文本区块 + `chart` / `flow`，见 §7）。

---

## 1. 三层与谁负责什么

| 层 | 文件 | 谁动 |
|---|---|---|
| 内容 | `<page>.content.json` | **agent 写**（只填数据） |
| 契约 | `agent/content.schema.md` | 维护者；agent 只读 |
| 配方 | `agent/recipes/report.recipe.mjs` · `table.recipe.mjs` · `sections.mjs` | 维护者；agent 只选 |
| 图表 | `viz/charts.mjs` · `flow.mjs` · `README.md` | 维护者；agent 只读契约、只填 `chart` / `flow` 的 props |
| 渲染 | `agent/render.mjs`（文本区块）· `viz/render-viz.mjs`（文本区块 + 图表 / 流程图） | 维护者；agent 只调用 |
| 品牌 | `theme/gary.theme.mjs` | 维护者；agent 只读、不改 |
| 闸 | `agent/checks/content.mjs`（内容契约，吃 JSON、0.2s 出字段级错）· `selfcheck.mjs` · `layout.mjs` · `contrast.mjs` · `viz/check-flow.mjs`（仅流程图几何） | 维护者；agent 交付前必跑 |

---

## 2. 四步装配

```powershell
cd C:\AI\UI\gary-ui
# 1. 写内容（照 §3 + agent/content.schema.md）
#    最小可用： { "meta": { "recipe": "report", "title": "季度复盘" }, "blocks": [ ... ] }

# 2. 先验字段再渲染——字段写错在这一步 0.2s 就报，不用等起两次浏览器
node agent/checks/content.mjs <你的>.content.json

# 3. 渲染
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html

# 4. 三道闸都 exit 0 才算交付（见 §6）
node agent/checks/selfcheck.mjs out/demo-report.html
node agent/checks/layout.mjs out/demo-report.html
node agent/checks/contrast.mjs out/demo-report.html
```

> **第 2 步不是可选的。** 缺少必填字段、枚举写错、`donut` 用 `series` 而不是 `items` 这类错误，
> 渲染器全都能"成功"输出一张空图，后三道闸也全绿——历史上 18 份写错的内容里 15 份是这样过去的。
> `content.mjs` 是唯一会当场说「哪个 block 的哪个字段错了」的一道。

产物是**单文件 HTML**：内联 `reset.css` + `astryx.css` + 主题 CSS，**零 `<script>`、零外链**，双击就能开，可以直接发人。

渲染器成功时的 stdout（实测）：

```
WROTE C:\AI\UI\gary-ui\out\demo-report.html bytes=400473 recipe=report blocks=11 components=299
```

渲染器会拒绝这三类错误（当场 throw，不产出半成品）：
- `meta.recipe` 缺失或不在可用列表里 → `未知配方 recipe="..."，可用: report, table, dashboard, landing`
  （`viz` 也能写在内容里，但那是 `viz/render-viz.mjs` 的路由标记，`agent/render.mjs` 不认它）
- `blocks` 缺失或为空 → `content.json 缺少 blocks[]，无法渲染`
- 某个 block 缺 `type` / `type` 不在 `SECTIONS` 表里 → `未知区块类型 type="..."（支持: ...）`

---

## 3. content.json 契约索引

**字段级真源**：`agent/content.schema.md`（v1）。本节只给索引和铁律，写字段前先看那份。

### 3.1 顶层

```json
{ "meta": { "recipe": "report", "title": "…", … }, "blocks": [ { "id": "b0", "type": "heading", "props": { … } } ] }
```

- `meta.recipe`：四选一（`agent/render.mjs` 的 `RECIPES` 真源）——`report`（文章壳，块间距 8）· `table`（叠放壳，块间距 6）· `dashboard`（指标盘）· `landing`（落地页）。**block 集合相通**，差别在外壳与竖向节奏。图表页写 `viz`（`viz/render-viz.mjs` 的路由标记）。
- `meta` 其余：`title`（必填，≤40 字）· `sub` · `eyebrow` · `badge` · `date` · `author` · `version` · `theme`（`light` 默认 / `dark`）· `lang`（`zh-CN` 默认 / `en`）。
- `blocks[]`：顺序即渲染顺序，1–24 块（建议 4–10）。

### 3.1b `tone` 出现在三层，值域不重叠（别混）

| 写在哪 | 取值 | 管什么 |
|---|---|---|
| **block 级** `blocks[].tone` | `default` / `sunken` / `inverse` | **材质** —— 这一块在页面上是浮起（白）/ 凹陷（灰）/ 反白（深） |
| `callout.props.tone` | `info` / `success` / `warning` / `error` | **语义** —— 语气 |
| `metric.items[].tone`、`timeline.items[].tone` | `accent` / `success` / `warning` / `error` / `neutral` | **语义** —— 这一条读数的好坏 |

同名不同层，靠位置区分。渲染时 **block 级优先**（`ctx.surface` 覆盖 `props.tone`），所以「把绿色 callout 降级成灰底」要写在 block 上：

```json
{ "type": "callout", "tone": "sunken", "props": { "tone": "success", "title": "…" } }
```

长期看这个字段名是欠自解释的（豆包 2026-11-17 指出），但三层值域不重叠、渲染优先级明确，不构成冲突，暂不改名。

**全页 `inverse` 的额度**：`table` / `matrix` / `prose` 这类**整块**反白，一页最多一个——两个大块反白等于没有锚点。`metric` 的主指标反白是**块内构成**（一行高、宽度两倍以内），不占这个额度。

### 3.2 全部 block type（18 个，均已实现）

| `type` | 是什么 | 关键与必填 props | 对应 Astryx 组件 |
|---|---|---|---|
| `heading` | 页眉 / 小节标题 | `title` · `eyebrow` · `badge` · `sub` · `level` · `toolbar{search,action}` | `VStack`+`HStack`+`Heading`+`Text`+`Badge`+`TextInput`+`Button` |
| `cover` | 封面 | `title` · `eyebrow` · `badge` · `sub` · `meta[{k,v}]` | `Heading(display-2)`+`Text`+`Badge`（唯一用衬线的块） |
| `prose` | 长文分节 | `items[{n,title,paras[]}]` | `Heading(l2)`+`Text(body)` |
| `text` | 正文段落 | `paras[]` · `note` · `size`(`body`/`large`) | `Text` |
| `metric` | 指标卡组 | `items[{label,value,unit,hint,trend}]`（1–5 个） · `title` · `note` | `Card`+`Text`（**无专用指标组件**） |
| `card` | 通用卡片 | `title` · `eyebrow` · `sub` · `body[]` · `badge` · `tag` · `note` · `variant` · `elevation` | `Card`+`VStack`+`Heading(l3)`+`Text`+`Badge` |
| `table` | 表格（数据明细） | `columns[{label,num}]`（2–7 列） · `rows[][]` · `foot[]` · `density` · `dividers` · `title` · `note` | `Card`+`Table` |
| `badge` | 状态徽标行 | `items[{label,variant,dot}]` · `align` | `Badge`+`StatusDot` |
| `callout` | 结论 / 提示框 | `tone`(`info`/`success`/`warning`/`error`) · `title` · `body` · `eyebrow` · `action{label}` | `Banner` |
| `divider` | 分隔线 | `label` · `variant` · `spacing` | `Divider` |
| `timeline` | 时间轴 / 关键节点 | **必填** `items[]`（2–10 条）：每项 `date`（≤12 字）+ `title`（≤16 字）；可选 `items[].text`（≤60 字）· `items[].tone`（`accent`/`success`/`warning`/`error`/`info`）· 区块 `title` | `VStack`+`StatusDot`+`Text` |
| `matrix` | 方案 / 地块横向对比（可带状态徽标） | **必填** `columns[]`（每项 `key` + `label`，`num?`）与 `rows[]`（每项 `label` + `cells`）；`cells` 形如 `{ "<列key>": 字符串 \| {value, state?} }`，`state` 取 `good`/`warn`/`bad`；可选 `labelHeader` · `title` · `note` · `density` · `dividers` | `Card`+`Table`+`Badge` |
| `image` | 图片块（本地图内嵌成 data URI） | **必填** `src`（本地相对路径或 `data:` URI，`http(s)` 外链会被闸判失败；**仓里现成的图只有 `examples/assets/qingpu-siteplan.svg`，用 `ls examples/assets/` 看全部**）+ `alt`；可选 `caption`（≤60 字）· `ratio`（`16:9`/`4:3`/`3:2`/`1:1`/`21:9`/`auto`，默认 `16:9`）· `align` | `AspectRatio`+`img` |
| `steps` | 步骤条 / 推进节奏 | **必填** `items[]`（3–5 个）：每项 `title`（≤12 字）；可选 `items[].text`（≤24 字）· `active`（零基下标，默认 `1`）· 区块 `title` · `note` | `ol/li` + token 手画（R8 起不再用 `Stepper`，连接线是 StyleX 原子类改不动） |
| `quote` | 引文 / 结论强调 | **必填** `text`（≤120 字）；可选 `source`（≤40 字）· `eyebrow` · `tone`（`accent`/`success`/`warning`/`error`/`info`） | `Text(large)` + `border-left`（`Blockquote` 无 tone 旋钮） |
| `grid` | 多列容器（唯一的多列手段） | **必填** `cols`（`2`/`3`/`4`，数字）+ `children[]`（2–6 个 `{id?, type, props}`，结构与顶层 `blocks[]` 相同）；可选 `gap`（默认 `4`） | `Grid` |
| `device` | 设备模拟框（手机 / 笔记本，纯 CSS 机身） | **必填** `kind`（`phone`/`laptop`）+ `src`（本地相对路径或 `data:` URI，渲染时内嵌成 data URI；`http(s)` 会被闸判失败）+ `alt`；可选 `caption`（≤60 字）· `align`（`start`/`center`）· `tone` | `div`（机身/屏体）+ `img`（无 iframe、无外链） |
| `scorecard` | 多维评分卡（横向进度条，不用雷达图） | **必填** `items[]`（2–8 条）：每项 `label`（≤12 字）+ `score`（0–`max`）；可选 `items[].max`（默认 `100`）· `items[].state`（`good`/`warn`/`bad`，缺省 accent）· 区块 `title` · `note` · `density`（`compact`/`normal`） | `Card`+`VStack`+`HStack`+`Text`+`div`（`var(--color-border-subtle)` 轨道 + 语义色填充） |

> `type` 取 `header` 也走 `heading` 的渲染函数（改名兼容，schema 里叫 `heading`）。
> 实现状态以 `agent/recipes/sections.mjs` 的 `SECTIONS` 表为准：**19 个 type 键 = 18 个 block 类型 + 1 个 `header` 别名**，全部有渲染函数。**实测**：`examples/demo-dashboard.content.json`（8 blocks / `bytes=365511` / `components=169`，`recipe=dashboard`）与 `examples/demo-landing.content.json`（6 blocks / `bytes=356236` / `components=76`，`recipe=landing`）均渲染成功，`selfcheck` 与 `layout` 均 ALL PASS —— 不是看代码猜的。
> 字段级约束（字数上限、枚举、最小样例）在 `agent/content.schema.md` §3.1–3.18，一节一类型，本表与它同源；冲突以 schema 为准。
> **不在上面这张表里**：`chart` / `flow` 只由 `viz/render-viz.mjs` 接管（§7），`agent/render.mjs` 收到会抛「未知区块类型」。`groups` / `composer`（要运行时交互，单文件零脚本承载不了）· `nav` / `inspector`（外壳职责，归配方）仍不收。

### 3.3 内容铁律（闸门查得出来的和查不出来的）

1. 数值一律**字符串**（`"94,186"`、`"2.20"`），保千分位与小数位；`table.columns[].num: true` 负责右对齐 + 等宽数字。
2. 内容层**不出现颜色 / 尺寸字面量**（`#hex`、`rgb()`、`px`）。语义只到 `tone` / `variant` / `trend`。
3. `table.rows` 每行长度必须等于 `columns` 长度；合计行建议直接写进 `rows` 最后一行（`foot` 会追加成一行加粗，不是表尾槽）。
4. 结论只写一次：`meta.sub` 与 `heading.sub` 不要写同一句 ≥20 字的话。
5. 不用内部编码（`SC12`、`SRC-XX-01`）；演示数据页级 `meta.badge` 标 `示意数据`。
6. 数字自洽（合计 = 明细之和，指标 = 表汇总）——这条闸门查不出，是写内容的人的责任。

---

## 4. 可用组件（174 个）

`@astryxdesign/core` 共 **174 个组件**（实测 `npx @astryxdesign/cli component --list` 首行即 `Components (174)`）。别猜 props，查：

```powershell
cd C:\AI\UI\gary-ui

# 列全部（人读）
npx @astryxdesign/cli component --list

# 单个组件的完整文档（agent 用这个）
npx @astryxdesign/cli component Card --json

# 只要 props 表（省 token）
npx @astryxdesign/cli component Card --props --json

# 多个一起查
npx @astryxdesign/cli component Button Badge Text --json
```

### 4.1 `component <Name> --json` 返回结构

```jsonc
{
  "apiVersion": 1,
  "type": "component.detail",
  "package": "@astryxdesign/core",
  "data": {
    "name": "Card",
    "displayName": "Card",
    "group": "Card",
    "category": "Container",
    "keywords": ["card", "surface", "panel", …],
    "usage": { "description": "…", "bestPractices": [ { "guidance": true, "description": "…" } ] },
    "props": [
      { "name": "width", "type": "SizeValue", "default": null, "values": null, "description": "…" }
    ],
    "examples": [ … ],        // 源码级示例
    "playground": { … },      // 交互试参
    "theming": { … },         // 该组件吃哪些 token
    "import": "@astryxdesign/core/Card",
    "sourceAvailable": true
  },
  "meta": { … }
}
```

- `props[]` 每项结构 `{ name, type, default, values, description }`（`type` 是枚举名，如 `SizeValue` / `variant` 联合；`values` 给出合法枚举值）。
- `--props --json` 时 `type` 变成 `"component.detail.props"`，`data` 直接是 props 数组。
- 查不到组件时 exit 1 并说明未知 selector——**exit 1 就换名字，别硬编**。

### 4.2 组件选型的两条硬经验（来自 Astryx 文档原文）

- `Card` 不是默认布局工具：先问「这一块能不能被单独移除或重排」，能才是 card；否则用 标题 + 堆叠。
- `Table` 没有 footer 槽；`Badge` 同一状态不要满页刷。

---

## 5. 主题：样式只改 theme，不写死

真源 `theme/gary.theme.mjs`（`defineTheme` 扩展 `@astryxdesign/theme-neutral/built`）。agent 想要不同观感，**改这里或提需求给维护者**，不要在内容层或渲染里塞字面量。

| token | 亮 | 暗 | 说明 |
|---|---|---|---|
| `--color-accent` | `#F57C00` 亮橙 | `#FFA94D` | 品牌色写面：按钮 / 色块 / 图形 / KPI 数字 |
| `--color-accent-muted` | `#FFF1E0` | `#3A2213` | 同色相浅橙底 |
| `--color-on-accent` | `#1A0E00` | `#111111` | 亮橙底上的字（近黑，7.02:1；白字只有 2.70:1） |
| `--color-text-accent` | `#B85C00` 深橙 | `#FFA94D` | 链接 / 强调文字（白底 4.60） |
| `--color-icon-accent` | `#B85C00` | `#FFA94D` | 强调图标 |
| `--font-family-body` / `-heading` | Helvetica Neue → Helvetica → Microsoft YaHei → Arial | 同 | 正文与所有标题级 |
| 展示衬线 | `Georgia, Songti SC, SimSun, Times New Roman` | 同 | **只在 `cover` 的 `display-2` 标题上**，不是全局 token |
| `--radius-element` / `-container` | `12px` | 同 | 元素 / 容器圆角 |
| `--radius-inner` | `8px` | 同 | 内嵌件 |
| `--radius-full` | `9999px` | 同 | 胶囊、圆点（Gary 不覆盖，沿用中性默认） |

> Astryx 共 7 个圆角 token（`element` `container` `inner` `full` `none` `page` `chat`，实测 `astryx.css`）。Gary 只覆盖前三个，其余沿用中性默认。

- 语义色：`success` / `error` 沿用 Astryx 中性默认；`warning` 覆盖为深琥珀（`#7f6118` / `#e0a93b`），`info` 覆盖为中性灰蓝（`#4A6785` / `#8FAFC9`，暗侧为暗底提亮版），实际值只在 `theme/gary.theme.mjs`。
- 数据色：分类八色**复用底座已有的 `--color-data-categorical-*` 族**（blue / red / yellow / green / purple / cyan / orange / gray，值在 `theme/gary.theme.mjs` 覆盖，明暗各一套），另加角色色 `--color-data-primary` / `-secondary` / `-reference` / `-negative`。`--color-data-neutral` 取底座原值、**不再声明**（重复声明会在产物里出现两次并静默覆盖）。图表与流程图共用这组，`viz/*.mjs` 不新造色。
- **卡片圆角与内距由渲染器按宽度分级**（`agent/recipes/sections.mjs` 的 `CARD_FRAMES`：小卡 14/20 · 中卡 16/24 · 大卡 20/28，px）。`layout.mjs` 按宽度带校验（`<320 → 12–16`、`320–700 → 14–18`、`>700 → 18–24`）。所以**不要给 Card 传 `style` 圆角**，会被闸门判违规。
- 明暗两种模式都是一等公民：`meta.theme: "dark"` 触发暗色 token 组，无需另写样式。

---

## 6. 验收闸（交付前必跑，四道都 exit 0）

```powershell
cd C:\AI\UI\gary-ui
node agent/checks/content.mjs <你的 content.json>    # 1. 字段契约（吃 JSON，0.2s）
node agent/render.mjs <你的 content.json> -o out/<page>.html
node agent/checks/selfcheck.mjs out/<page>.html      # 2. 单文件约束
node agent/checks/layout.mjs out/<page>.html         # 3. 版式几何
node agent/checks/contrast.mjs out/<page>.html       # 4. WCAG AA
```

**含 viz 产物时闸门不变**：把第二行换成 `node viz/render-viz.mjs <in> -o out/<page>.html`（见 §7），后三道照样各跑一次；流程图页再加 `node viz/check-flow.mjs out/<page>.html`。实测 `out/viz-charts.html`（394 KB）与 `out/viz-flow.html`（360 KB）均 PASS。

**只记一条命令**：`npm run verify`——扫 `examples/*.content.json` 跑 content 闸、扫 `out/*.html` 跑后三道，是全仓唯一门禁，exit 0 即全部通过。

### 6.0 `content.mjs` — 字段契约（吃 JSON，不渲染）

| 覆盖 | 判据 |
|---|---|
| 18 类 block（含 `device` / `scorecard`） | 必填字段、枚举值域、数组上下限、非法未知字段 |
| 7 种 chart + 3 种 flow | `chart`/`flow` 子类型合法、形状对（`donut` 用 `items`、`stacked` 用 `rows[].parts`）、`series[].values` 与 `categories` 等长 |
| `image` / `device` 的 `src` | 指向的文件必须真实存在 |
| `matrix.rows[].cells` 的键 | 由 `columns[].key` 决定，动态键不判未知字段 |
| `callout.tone` | 材质（`default`/`sunken`/`inverse`）∪ 语义（`info`/`success`/`warning`/`error`）∪ 别名（`warn`/`danger`/…） |

报错形如 `blocks[3] (type=chart) chart="donut" 缺必填字段 items`——**指到 block 序号、type、字段名**，可直接照着改。
它挡的是渲染器的默认值兜底：10 种 viz 类型的每个数组参数都有 `= []` 默认值，缺了不抛错、只画空图，后三道闸照样全绿。

### 6.1 `selfcheck.mjs` — 单文件约束（5 项）

| 项 | 判据 | 实测 |
|---|---|---|
| 无 `<script>` | 全文不得出现 `<script` | PASS |
| 无外链 | 不得有 `href/src=https:` 或 `url(http…)` | PASS |
| 含 `data-astryx-theme="gary"` | 主题确实落在根元素上 | PASS |
| 内联 `<style>` > 100000 B | 样式真的内联进去了 | 331906 B |
| ≥ 3 个 `astryx-` 语义类 | 组件确实来自 Astryx | 104 个（viz 页 100 个） |

### 6.2 `layout.mjs` — 真实 DOM 几何（6 条，Playwright 量像素）

| # | 规则 | 实测基准 |
|---|---|---|
| 1 | 工具行：输入框壳与按钮 `top` / `height` 差 ≤ 1px | Δ0 / Δ0 |
| 2 | 每张卡的内边距四边 ≥ 20px | 小卡 20 · 中卡 24 · 大卡 28 |
| 3 | 圆角随宽度分级（见 §5） | 232px→14 · 1056px→20 |
| 4 | 卡内首个子元素距上/左 ≥ 20px | 21 / 29 |
| 5 | 横向不出血（右边界 ≤ 父右边界 +1） | 0 处（表格滚动壳整卡宽属白名单） |
| 6 | 文字不溢出（`scrollWidth ≤ clientWidth +1`） | 0 处 |

`layout.mjs` 支持多文件与视口宽度：`node agent/checks/layout.mjs out/a.html out/b.html --width 900`。

失败时它打印量到的真实 px 值，按值改**内容**（字太长就改文案或砍列）或提需求改 **theme**，不要绕闸。

---

## 7. 图表与流程图（viz/）

边界先说清，踩了白跑一轮：

- `chart` / `flow` **不在** `agent/render.mjs` 的 `SECTIONS` 表里。把 `type: "chart"` 直接喂给 `agent/render.mjs` 会当场抛 `sections: 未知区块类型`。
- 图表页统一用 `viz/render-viz.mjs`：它只接管 `chart` / `flow`，其余 18 类文本区块全部复用 `agent/recipes/sections.mjs`。所以一页里可以混排正文、表格、卡片和七张图。
- 它**不按 `meta.recipe` 分派**（不读这个字段），只按 `blocks[]` 顺序渲染；示例里的 `"recipe": "viz"` 只是标记。
- 模块地图、颜色契约、字号映射、几何规则的细节在 `viz/README.md`。

```powershell
cd C:\AI\UI\gary-ui
node viz/render-viz.mjs examples/demo-viz.content.json -o out/viz-charts.html
node viz/render-viz.mjs examples/demo-flow.content.json -o out/viz-flow.html
node viz/check-flow.mjs out/viz-flow.html          # 流程图几何闸（见 7.3）
node agent/checks/selfcheck.mjs out/viz-charts.html
node agent/checks/layout.mjs out/viz-charts.html
```

实测 stdout：

```
WROTE C:\AI\UI\gary-ui\out\viz-charts.html bytes=394211 blocks=12 charts=7 flows=0
WROTE C:\AI\UI\gary-ui\out\viz-flow.html bytes=359941 blocks=6 charts=0 flows=3
```

字节数会随 `theme` token 微调浮动（同一条命令两次实测 `393464 → 394211 B`），所以核对 `blocks` / `charts` / `flows` 三个计数与闸门结果，别拿字节数当验收值。

缺 `-o` 或漏了输入 → 打印 `用法: node viz/render-viz.mjs <content.json> -o <out.html>`，exit 2。

### 7.1 七种图表（`type: "chart"`）

共用必填：`chart`（下表之一）+ `title` + `source` + `status`。`status` 是数据身份，**必须以
`实测` / `推算` / `示例数据` / `示意数据` / `实现现状` 之一开头**（可加「仓库」前缀，如
`仓库示例数据 · 非业务系统导出`）——内容闸会拦这一条，因为写错了页面上完全看不出来。
`question` / `unit` / `digits` / `note` / `height` / `ariaLabel` / `annotations` 可选。

| `chart` 值 | 是什么 | 该型额外必填 / 结构 |
|---|---|---|
| `bar` | 柱状图 · 单系列 | `categories[]` + `series[{name, values[]}]` |
| `grouped-bar` | 柱状图 · 分组 | 同上，`series` 放多条（共同零点、右上图例） |
| `line` | 折线图 | `categories[]` + `series[{name, values[]}]`；可选 `annotations` 的 `reference` / `band` |
| `stacked` | 百分比堆叠 | `rows[{label, parts[{name, value}]}]`（**不是** `series`） |
| `donut` | 环形图 | `items[{name, value}]`；可选 `centerLabel` |
| `progress` | 进度条组 | `rows[{label, value, max, hint}]` |
| `sparkline` | KPI 迷你趋势 | `kpi{ label, value, unit?, delta?, categories[], values[], note?, source? }`（走 `KpiTile`，不进 `ChartBody`） |

- `grouped-bar` 含连字符，**别写成 `groupedBar`**。类型值就是上表这 7 个字符串，写错抛 `viz/charts: 未知图表类型 chart="…"`。
- 标注 `annotations[]`——三种，字段各不相同，渲染器只读下列字段：
  - `{ "type": "reference", "value": 4.28, "text": "集团均值" }` —— 数值轴上的横向参考线，标签拼成 `text（值 单位）`
  - `{ "type": "band", "start": "W44", "end": "W46" }` —— 区间底色，`start`/`end` 必须是 `categories` 里的原字符串
  - `{ "type": "anchor", "target": "W46", "text": "峰值" }` —— 标在某根柱上方，`target` 是 `categories` 里的原字符串

  每型取第一条（`band` 可多条）。标签画在图内紧贴图形，**不再在图下另起一行 caption**。
- 数值按数据原样给（`unit` / `digits` 只管显示），缺测不补零、不连线。
- **所有图表数值必须是 JSON `number`，不是字符串。** 渲染器用 `Number.isFinite(v) ? v : 0` 取值，
  写 `"12"` 会被判掉、**静默画成 0**——柱子全零、折线贴底、环形没有扇区，而四道闸照样全绿。
  内容闸会拦这一条（`series[].values[]` / `parts[].value` / `items[].value` / `rows[].value` / `kpi.values[]`）。
- 反过来，**文本块里的数字要用字符串**（`metric.items[].value: "1,234"`）：那里渲染器 `String()` 包一层，
  字符串才能保住千分位和单位。两处口径不同，别串。

### 7.2 三种流程图（`type: "flow"`）

共用必填：`flow`（下表之一）+ `title` + `source` + `status`；`question` / `note` 可选。

| `flow` 值 | 是什么 | 结构 |
|---|---|---|
| `linear` | 线性流程（同一中心线，4 节点） | `nodes[]` + `edges[]` |
| `branch` | 分支流程（判定菱形两条出边） | `nodes[]`（含 `kind: "decision"` 的判定）+ `edges[]` |
| `swimlane` | 泳道流程（每道各管一段） | `lanes[{title, sub}]` + `nodes[]`（带 `col` / `row`）+ `edges[]` |

- `nodes[]`：`{ id, role: input|process|decision|result, kind: capsule|card|decision, title, sub, col?, row? }`
- `edges[]`：`{ from, to, kind: main|side|dashed, label? }`（`main` 实线 + 深色箭头，`side` 浅色箭头，`dashed` 虚线旁支）
- 几何不归你：正交折线、90° 拐点、每条边带 `marker-end`、卡片圆角 8。四个角色各占一个色相（`input`=`categorical-gray` · `process`=`categorical-blue` · `decision`=`categorical-purple` · `result`=`categorical-green`）—— **成功出口不许用红**，红是 `negative`，一张图最多四色，颜色只表示分工、不表示好坏。写错 `flow` 值抛 `viz/flow: 未知流程类型 flow="…"`。

### 7.3 闸门与颜色

```powershell
node viz/check-flow.mjs out/viz-flow.html            # 折线正交 / 每条边有箭头 / 节点框不相交
node agent/checks/selfcheck.mjs out/viz-charts.html
node agent/checks/layout.mjs out/viz-charts.html
```

- 实测：`check-flow.mjs` 三张图 `edges` 合计 13 条，`非正交=0 无箭头=0`、`node boxes 相交=0`、`FLOW GEOMETRY PASS`；`viz-charts.html` 与 `viz-flow.html` 的 `selfcheck` ALL PASS、`layout` 6 条全 PASS。
- 颜色：`viz/*.mjs` 里 **0 个 hex**，全部取 `--color-*` token。多系列图表按**系列数组下标**取 `--color-data-categorical-*` —— 同一 `series` 顺序里第 N 项在各图拿到同一色，顺序一变颜色就跟着变（不按名字绑定，见「已知限制」第 1 条）。流程图的角色色也绑在同一组 data token 上，所以图与图之间不会各造一套色。要换观感改 `theme/gary.theme.mjs`，不改 `viz/`。
  **单系列裁决**：`series.length === 1` 不共用一支颜色。**柱图按类别位置取色** —— 每根柱是一个独立实体（渠道 / 月份 / 户型），一页七张图共用一支蓝会被读成单色，Gary 说的「颜色太单一」根子在这。折线是一整条线、没法按点取色，固定 `categorical-green`（见 `viz/palette.mjs` 的 `SINGLE_HUE`，只剩这一个键）。黄色 `categorical-yellow` 只做填充、不做线条 —— 白底 1.71，当描边看不见。
- 每张图必须给 `source`（渲染成卡底一行脚注，本地路径会被剥成文件名）；`status` 字段保留但**不渲染到页面**——它此前渲染成一个 badge 压在卡片里，占掉信息空间，2026-11-17 移除，写它不会有视觉效果。演示数据在页级 `meta.badge` 标 `示意数据`。没有来源的图不接受。

---

### 7.4 已知限制（2026-11-17 两轮对抗审查登记）

24 条攻击 → 独立裁判判有效 14 条。以下四条**明确不修**，改代码前先看这里：

1. **跨图同色不按名字绑定** —— 取色靠 `series` 数组下标或柱的类别位置，不是实体名。同一个
   楼盘在柱图排第 2、在环形图排第 5，就是两个颜色。要按名字绑定得在内容层给每个数据点加
   `entity` 字段，目前没这个需求（Gary 要的是「别太单一」，不是「严格同色」）。
2. **分类上限 8** —— 第 9 个起 modulo 回落与前面同色，`seriesStyle` 会 `console.warn` 一次
   但不阻断渲染（静默同色比报错更难查：图例出现两个同色块，读者会以为数据错了）。超过 8
   类请拆图或合并类别。
3. **三个浅色豁免 3:1** —— `categorical-yellow` 1.71 / `cyan` 2.74 / `orange` 2.74 对卡片底
   达不到非文本图形 3:1。`contrast` 闸把它们标成 `WAIVED` 并打印理由，**不标 PASS**。压深到
   3:1 会离开 Google 色板、回到 Gary 已否决两次的「太深」。这三个只做大面积填充。
4. **暗色侧色盲可分性** —— `categorical-purple` 与 `cyan` 在 deuteranopia 模拟下 ΔE≈5.5
   （亮侧 26.5）：暗色页上这两个相邻段对红绿色盲不可分。色板是 Material 200/300，换色相
   就不是这一套了。靠图例文字兜底。

## 8. 红线（踩了就是退回）

1. **不写死颜色 / 字号 / 圆角**——不出现 `#hex`、`rgb()`、`px`、`rem` 字面量。
2. **不手写 class**——产物里的类名全部由 Astryx 组件生成，内容层没有 `className` 这个字段。
3. **不引外部 CSS / JS**——不加 `<link rel=stylesheet>`、不加 CDN、不加 `@import`。
4. **不加 `<script>`**——包括统计、动画、主题切换脚本；产物必须零脚本。
5. **不改配方绕过契约**——需要新 page 结构时提需求加配方，不手写 HTML。
6. **不碰 `theme/` 之外的颜色定义**，也不在 block props 里塞 `style`。

---

## 9. 常见追问

| 问 | 答 |
|---|---|
| 能不能加图表 / 流程图？ | 能——但走 `viz/render-viz.mjs`（§7）：`chart` 7 种、`flow` 3 种。`agent/render.mjs` 仍不收这两类，混用会抛「未知区块类型」。 |
| 图表配色能改吗？ | 只能改 `theme/gary.theme.mjs` 的 token；`viz/*.mjs` 里没有 hex，改 `viz/` 不是入口。 |
| 页面上要可点的按钮？ | 静态单文件，`Button` 只是视觉件（无 `onClick` 运行时）。要交互请改走应用层，不要塞脚本。 |
| 旧 `agent/content.json` / `primitives.css` / `recipes.json` 在哪？ | 全在 `archive/legacy-2026-11/agent/`，仅作回滚参考；**新页一律用当前 `agent/render.mjs` + `meta/blocks` 契约**。 |
| 旧的 65 组件契约 / shadcn 安装法？ | 作废。见 `MIGRATION.md` 与 `archive/legacy-2026-11/`。 |
| 产物多大？ | 三页实测 359–400 KB（`demo-report` 400 KB · `viz-charts` 393 KB · `viz-flow` 359 KB），内联样式固定约 332 KB，占 83–92%。单文件换零依赖，可接受。 |

---

## 10. 变更史

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-11-16 | v3 | 契约补全：§3.2 从 10 类扩到 **16 类**（新增 `timeline` / `matrix` / `image` / `steps` / `quote` / `grid`，逐条给必填字段）；新增 **§7 图表与流程图**（7 种 `chart` + 3 种 `flow`，命令与边界）；§6 覆盖 viz 产物。红线顺移 §8，常见追问 §9，变更史 §10 |
| 2026-11-16 | v2 | 重写为 Astryx 版：三步装配、`meta`+`blocks` 契约索引、174 组件查询法、theme 真源、两闸验收、五条红线。旧 v1（primitives / recipes.json / 四配方 / 交互声明 / 十二条不变量）随旧体系整体归档 |
