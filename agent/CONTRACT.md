# Gary-UI · Agent 调用契约（Astryx 版 · v2）

> 位置 `agent/CONTRACT.md`。给外部 agent 的唯一调用入口：读完这一份就能出页，不用翻别的文档。
> 一句话：**页面 = content.json；只能拼，不能发明。** 不写 HTML、不写 CSS、不写 JS。
> 底座：`@astryxdesign/core` 0.7.16（174 个组件）+ React 19 SSR。品牌层：`theme/gary.theme.mjs`。

---

## 1. 三层与谁负责什么

| 层 | 文件 | 谁动 |
|---|---|---|
| 内容 | `<page>.content.json` | **agent 写**（只填数据） |
| 契约 | `agent/content.schema.md` | 维护者；agent 只读 |
| 配方 | `agent/recipes/report.recipe.mjs` · `table.recipe.mjs` · `sections.mjs` | 维护者；agent 只选 |
| 渲染 | `agent/render.mjs` | 维护者；agent 只调用 |
| 品牌 | `theme/gary.theme.mjs` | 维护者；agent 只读、不改 |
| 闸 | `agent/checks/selfcheck.mjs` · `layout.mjs` | 维护者；agent 交付前必跑 |

---

## 2. 三步装配

```powershell
cd C:\AI\UI\gary-ui
# 1. 写内容（照 §3 + agent/content.schema.md）
#    最小可用： { "meta": { "recipe": "report", "title": "季度复盘" }, "blocks": [ ... ] }

# 2. 渲染
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html

# 3. 两条闸都 exit 0 才算交付（见 §6）
node agent/checks/selfcheck.mjs out/demo-report.html
node agent/checks/layout.mjs out/demo-report.html
```

产物是**单文件 HTML**：内联 `reset.css` + `astryx.css` + 主题 CSS，**零 `<script>`、零外链**，双击就能开，可以直接发人。

渲染器成功时的 stdout（实测）：

```
WROTE C:\AI\UI\gary-ui\out\demo-report.html bytes=367637 recipe=report blocks=7 components=181
```

渲染器会拒绝这三类错误（当场 throw，不产出半成品）：
- `meta.recipe` 缺失或不在 `report` / `table` 里 → `未知配方 recipe="..."，可用: report, table`
- `blocks` 缺失或为空 → `content.json 缺少 blocks[]，无法渲染`
- 某个 block 缺 `type` / `type` 不在 `SECTIONS` 表里 → `未知区块类型 type="..."（支持: ...）`

---

## 3. content.json 契约索引

**字段级真源**：`agent/content.schema.md`（v1）。本节只给索引和铁律，写字段前先看那份。

### 3.1 顶层

```json
{ "meta": { "recipe": "report", "title": "…", … }, "blocks": [ { "id": "b0", "type": "heading", "props": { … } } ] }
```

- `meta.recipe`：`report`（文章壳，块间距 8）· `table`（叠放壳，块间距 6）。**两者可用 block 集合相同**，差别只是竖向节奏。
- `meta` 其余：`title`（必填，≤40 字）· `sub` · `eyebrow` · `badge` · `date` · `author` · `version` · `theme`（`light` 默认 / `dark`）· `lang`（`zh-CN` 默认 / `en`）。
- `blocks[]`：顺序即渲染顺序，1–24 块（建议 4–10）。

### 3.2 全部 block type（10 个，均已实现）

| `type` | 是什么 | 关键 props | 对应 Astryx 组件 |
|---|---|---|---|
| `heading` | 页眉 / 小节标题 | `title` · `eyebrow` · `badge` · `sub` · `level` · `toolbar{search,action}` | `VStack`+`HStack`+`Heading`+`Text`+`Badge`+`TextInput`+`Button` |
| `cover` | 封面 | `title` · `eyebrow` · `badge` · `sub` · `meta[{k,v}]` | `Heading(display-2)`+`Text`+`Badge`（唯一用衬线的块） |
| `prose` | 长文分节 | `items[{n,title,paras[]}]` | `Heading(l2)`+`Text(body)` |
| `text` | 正文段落 | `paras[]` · `note` · `size`(`body`/`large`) | `Text` |
| `metric` | 指标卡组 | `items[{label,value,unit,hint,trend}]` · `title` · `note` | `Card`+`Text`（**无专用指标组件**） |
| `card` | 通用卡片 | `title` · `eyebrow` · `sub` · `body[]` · `badge` · `tag` · `note` · `variant` · `elevation` | `Card`+`VStack`+`Heading(l3)`+`Text`+`Badge` |
| `table` | 表格 | `columns[{label,num}]` · `rows[][]` · `foot[]` · `density` · `dividers` · `title` · `note` | `Card`+`Table` |
| `badge` | 状态徽标行 | `items[{label,variant,dot}]` · `align` | `Badge`+`StatusDot` |
| `callout` | 结论 / 提示框 | `tone`(`info`/`success`/`warning`/`error`) · `title` · `body` · `eyebrow` · `action{label}` | `Banner` |
| `divider` | 分隔线 | `label` · `variant` · `spacing` | `Divider` |

> `type` 取 `header` 也走 `heading` 的渲染函数（改名兼容，schema 里叫 `heading`）。
> 实现状态以 `agent/recipes/sections.mjs` 的 `SECTIONS` 表为准：11 个 type 键、10 个 block 类型全部有渲染函数。**实测**：一份同时含这 10 类的 content.json 渲染成功（`bytes=351048 blocks=10 components=95`），`selfcheck` 与 `layout` 均 ALL PASS —— 不是看代码猜的。`content.schema.md` §2 里标的「待实现」是契约先写、实现后补的历史状态，以代码为准。
> **不进契约**：`chart`（Astryx 无图表组件）· `groups` / `composer`（要运行时交互，单文件零脚本承载不了）· `nav` / `inspector`（外壳职责，归配方）。

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
| `--color-accent` | `#24514a` 墨绿 | `#5d9c8f` | 品牌强调色 |
| `--color-accent-muted` | `#dde8e4` | `#22403a` | 同色相柔化底 |
| `--color-text-accent` | `#24514a` | `#5d9c8f` | 链接 / 强调文字（不自动跟随 accent） |
| `--color-icon-accent` | `#24514a` | `#5d9c8f` | 强调图标 |
| `--font-family-body` / `-heading` | Helvetica Neue → Helvetica → Microsoft YaHei → Arial | 同 | 正文与所有标题级 |
| 展示衬线 | `Georgia, Songti SC, SimSun, Times New Roman` | 同 | **只在 `cover` 的 `display-2` 标题上**，不是全局 token |
| `--radius-element` / `-container` | `12px` | 同 | 元素 / 容器圆角 |
| `--radius-inner` | `8px` | 同 | 内嵌件 |
| `--radius-full` | `9999px` | 同 | 胶囊、圆点（Gary 不覆盖，沿用中性默认） |

> Astryx 共 7 个圆角 token（`element` `container` `inner` `full` `none` `page` `chat`，实测 `astryx.css`）。Gary 只覆盖前三个，其余沿用中性默认。

- 语义色（success / warning / error / info）**沿用 Astryx 中性默认**，Gary 不铺平调色板。
- **卡片圆角与内距由渲染器按宽度分级**（`agent/recipes/sections.mjs` 的 `CARD_FRAMES`：小卡 14/20 · 中卡 16/24 · 大卡 20/28，px）。`layout.mjs` 按宽度带校验（`<320 → 12–16`、`320–700 → 14–18`、`>700 → 18–24`）。所以**不要给 Card 传 `style` 圆角**，会被闸门判违规。
- 明暗两种模式都是一等公民：`meta.theme: "dark"` 触发暗色 token 组，无需另写样式。

---

## 6. 验收闸（交付前必跑，两条都 exit 0）

```powershell
cd C:\AI\UI\gary-ui
node agent/render.mjs <你的 content.json> -o out/<page>.html
node agent/checks/selfcheck.mjs out/<page>.html
node agent/checks/layout.mjs out/<page>.html
```

### 6.1 `selfcheck.mjs` — 单文件约束（5 项）

| 项 | 判据 | 实测 |
|---|---|---|
| 无 `<script>` | 全文不得出现 `<script` | PASS |
| 无外链 | 不得有 `href/src=https:` 或 `url(http…)` | PASS |
| 含 `data-astryx-theme="gary"` | 主题确实落在根元素上 | PASS |
| 内联 `<style>` > 100000 B | 样式真的内联进去了 | 331468 B |
| ≥ 3 个 `astryx-` 语义类 | 组件确实来自 Astryx | 100 个 |

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

## 7. 红线（踩了就是退回）

1. **不写死颜色 / 字号 / 圆角**——不出现 `#hex`、`rgb()`、`px`、`rem` 字面量。
2. **不手写 class**——产物里的类名全部由 Astryx 组件生成，内容层没有 `className` 这个字段。
3. **不引外部 CSS / JS**——不加 `<link rel=stylesheet>`、不加 CDN、不加 `@import`。
4. **不加 `<script>`**——包括统计、动画、主题切换脚本；产物必须零脚本。
5. **不改配方绕过契约**——需要新 page 结构时提需求加配方，不手写 HTML。
6. **不碰 `theme/` 之外的颜色定义**，也不在 block props 里塞 `style`。

---

## 8. 常见追问

| 问 | 答 |
|---|---|
| 能不能加图表？ | 不能。Astryx 无图表组件，契约明确不收 `chart`。图表工作由独立工作区「重建·图表与图示」承接。 |
| 页面上要可点的按钮？ | 静态单文件，`Button` 只是视觉件（无 `onClick` 运行时）。要交互请改走应用层，不要塞脚本。 |
| 旧 `agent/content.json` / `primitives.css` / `recipes.json` 在哪？ | 全在 `archive/legacy-2026-11/agent/`，仅作回滚参考；**新页一律用当前 `agent/render.mjs` + `meta/blocks` 契约**。 |
| 旧的 65 组件契约 / shadcn 安装法？ | 作废。见 `MIGRATION.md` 与 `archive/legacy-2026-11/`。 |
| 产物多大？ | 两页实测 363–368 KB（样式内联占 90%）。单文件换零依赖，可接受。 |

---

## 9. 变更史

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-11-16 | v2 | 重写为 Astryx 版：三步装配、`meta`+`blocks` 契约索引、174 组件查询法、theme 真源、两闸验收、五条红线。旧 v1（primitives / recipes.json / 四配方 / 交互声明 / 十二条不变量）随旧体系整体归档 |
