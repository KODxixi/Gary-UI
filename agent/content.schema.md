# content.json 契约 · v1（Astryx 底座）

> 位置 `agent/content.schema.md`。消费方：`agent/render.mjs`（`content.json` → 单文件 HTML）。
> 一句话：**页面 = meta + blocks；只能拼，不能发明。** agent 只填数据，不写 HTML/CSS/JS。
> 字段命名沿用旧 `content.json`（`garyui-teardown.md` §3.3 的词汇表），只替换渲染实现。

---

## 1. 顶层结构

```json
{ "meta": { ... }, "blocks": [ { "id": "...", "type": "...", "props": { ... } } ] }
```

### 1.1 `meta`

| 字段 | 类型 | 必填 | 说明 | 取值 / 约束 |
|---|---|---|---|---|
| `recipe` | string | 是 | 页型配方，决定外壳与允许的 block 集合（旧版这里是顶层键名，现在收进 meta） | `report` · `table`（当前已实现）；`dashboard` · `settings` · `workbench` 预留未实现 |
| `title` | string | 是 | 文档标题，同时写入 `<title>` | ≤ 40 字，单行 |
| `sub` | string | 否 | 副标题（旧字段名就是 `sub`） | ≤ 80 字；**不得与 blocks 内的长句重复**（见 §6 结论唯一） |
| `eyebrow` | string | 否 | 眉标 / 抬头 | ≤ 24 字，单行 |
| `badge` | string | 否 | 页级状态徽标文字 | ≤ 8 字（如 `示意数据`、`评审稿`）；带语义的状态请用 `badge` block |
| `date` | string | 否 | 日期 | `YYYY-MM-DD` |
| `author` | string | 否 | 署名 | ≤ 24 字 |
| `version` | string | 否 | 版本 / 状态行 | 如 `v1.2 · 评审稿` |
| `theme` | string | 否 | 明暗 | `light`（默认）· `dark`。渲染器 CLI 的 `--theme light\|dark` 可临时覆盖（不改内容） |
| `lang` | string | 否 | 文档语言 | `zh-CN`（默认）· `en` |

### 1.2 `blocks[]`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 锚点标识，供目录 / 深链使用；缺省按 `b0`、`b1`… 自动编号。沿用旧 `section.id` |
| `type` | string | 是 | 区块类型，取值见 §2 |
| `props` | object | 是 | 该 type 的字段集，见 §3 |

`blocks` 顺序即页面渲染顺序。数组长度 1–24；单个页面建议 6–12 块。
**只有 `grid` 的 `children` 可以嵌套 block**，其余类型的 `props` 内不放 block；嵌套层级最多一层（`grid` 里不能再放 `grid`）。

---

## 2. block 类型清单

| # | `type` | 中文 | 对应旧 section | 状态 |
|---|---|---|---|---|
| 1 | `heading` | 页眉 / 小节标题 | `head`（旧渲染器叫 `header`） | 已实现 |
| 2 | `text` | 正文段落 | `prose.items[].paras` 抽出来 | 已实现 |
| 3 | `metric` | 指标卡组 | `kpis` | 已实现 |
| 4 | `card` | 通用卡片 | `canvas` | 已实现 |
| 5 | `table` | 表格 | `table` | 已实现 |
| 6 | `badge` | 状态徽标行 | `head.badge` 独立成块 | 已实现 |
| 7 | `callout` | 结论 / 提示框 | 无（新增） | 已实现 |
| 8 | `divider` | 分隔线 | 无（新增） | 已实现 |
| 9 | `cover` | 封面 | `cover` | 已实现 |
| 10 | `prose` | 长文分节 | `prose` | 已实现 |
| 11 | `timeline` | 时间轴 / 关键节点 | 无（新增） | 已实现 |
| 12 | `matrix` | 对比矩阵 | 无（新增，复用 `Table`） | 已实现 |
| 13 | `image` | 图片块 | 无（新增，`AspectRatio` 包 `img`） | 已实现 |
| 14 | `steps` | 步骤条 / 推进节奏 | 无（新增，`Stepper`） | 已实现 |
| 15 | `quote` | 引文 / 结论强调 | 无（新增） | 已实现 |
| 16 | `grid` | 多列容器 | 无（新增，`Grid`） | 已实现 |
| 17 | `device` | 设备模拟框 | 无（新增，`div` 机身 + `img`） | 已实现 |
| 18 | `scorecard` | 多维评分卡 | 无（新增，`Card` + 进度条） | 已实现 |

> 「已实现」= `agent/recipes/sections.mjs` 的 `SECTIONS` 表里已有对应函数（截至 2026-11-17 为全部 18 种，`header` 作为 `heading` 的旧名同时保留）。
> `heading` 的 props 与现有 `header` 完全一致，只是类型名改成了语义更准的 `heading`；渲染器侧一行映射即可（§4.1）。

**明确不纳入本契约**（旧有、新版暂无承载能力）：

| 旧 section | 为什么不要 |
|---|---|
| `chart` | **已进契约**，但只在 `viz/render-viz.mjs` 一侧：`agent/render.mjs` 收到会抛「未知区块类型」。7 种类型与字段见 `CONTRACT.md` §7 与 `viz/README.md`。Astryx 无图表组件，`viz/charts.mjs` 用原生 SVG 自建（零依赖、零 `<script>`），颜色只从 theme 的 `--color-data-*` 取 |
| `groups` | 设置页的 `seg` / `switch` 控件，需要交互与状态，静态单文件页面承载不了 |
| `nav` / `inspector` | 外壳结构，属配方职责（`recipe` 决定），不进内容层 |
| `composer` | 输入框 + 发送，需要运行时；单文件产物零 `<script>`，不承载 |

---

## 3. 各 block 的 `props`

标注约定：**必填** = 缺了渲染报错；*可选* = 缺了不输出该部件。所有字符串均为纯文本，**不接受 HTML / Markdown 语法**（渲染层不做富文本解析）。

### 3.1 `heading`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `title` | string | 是 | 主标题，≤ 24 字 |
| `eyebrow` | string | 否 | 标题上方的眉标，≤ 24 字，单行 |
| `badge` | string | 否 | 标题旁的徽标文字，≤ 8 字；语义状态改用 `badge` block |
| `sub` | string | 否 | 一句话说明，≤ 120 字 |
| `level` | `1` \| `2` | 否 | `1`（默认）= 页面首屏；`2` = 章内小节 |
| `toolbar` | object | 否 | `{ "search"?: string, "action"?: string }`：`search` 是搜索框 label，`action` 是主按钮文案 |

### 3.2 `text`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `paras` | string[] | 是 | 段落数组，1–6 段。沿用旧 `prose.items[].paras` 的字段名 |
| `note` | string | 否 | 段末注释 / 口径说明 |
| `size` | `body` \| `large` | 否 | `body`（默认）· `large`（导语段） |

### 3.3 `metric`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 指标项，1–5 个（建议 4）。沿用旧 `kpis.items` |
| `items[].label` | string | 是 | 指标名，≤ 8 字，单行 |
| `items[].value` | string | 是 | 数值，**字符串**，保留千分位与小数位（`"94,186"`、`"2.20"`）；不要写成 number |
| `items[].unit` | string | 否 | 单位，≤ 4 字（`万㎡`、`户`、`%`）；无量纲指标省略 |
| `items[].hint` | string | 否 | 对比 / 口径说明，≤ 16 字（`环比 +9.1%`、`按订单加权`）。沿用旧 `hint` |
| `items[].trend` | `up` \| `down` \| `flat` | 否 | 涨跌语义，只供渲染层选图标/强调，不带颜色字面量（§4.2） |
| `title` | string | 否 | 指标组标题 |
| `note` | string | 否 | 口径说明 |

### 3.4 `card`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `title` | string | 是 | 卡片标题，≤ 20 字 |
| `eyebrow` | string | 否 | 卡片眉标（旧 `canvas.label` 的位置） |
| `sub` | string | 否 | 副说明，≤ 60 字 |
| `body` | string[] | 否 | 正文段落，0–4 段 |
| `badge` | string | 否 | 卡片角标文字，≤ 8 字 |
| `tag` | string | 否 | 单行标签（旧 `canvas.tag`，如 `3 层`） |
| `note` | string | 否 | 卡片底部注 |
| `padding` | `0` \| `1` \| `2` \| `3` \| `4` \| `5` \| `6` \| `8` | 否 | 直通 Astryx `Card.padding`（spacing 档位），默认取主题卡片内距 |
| `variant` | `default` \| `muted` \| `transparent` | 否 | 直通 `Card.variant`，默认 `default` |
| `elevation` | `none` \| `low` \| `med` \| `high` | 否 | 直通 `Card.elevation`，默认 `none` |

### 3.5 `table`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `columns` | object[] | 是 | 列定义，2–7 列 |
| `columns[].label` | string | 是 | 列头文字。**单位写进列头**（`成交额 · 万`、`计容建面 · ㎡`），不另立单位行 |
| `columns[].num` | boolean | 否 | `true` = 数值列：右对齐 + 等宽数字（`hasTabularNumbers`）。沿用旧字段 |
| `rows` | string[][] | 是 | 数据行，1–40 行；**每行长度必须等于 `columns` 长度**，单元格只放字符串（数值也写成字符串） |
| `foot` | string[] | 否 | 合计 / 汇总行，长度 = 列数。首格通常写 `合计`。渲染器追加为带标记的数据行（半粗，无单独 footer 槽） |
| `title` | string | 否 | 表标题 |
| `note` | string | 否 | 表注 / 口径 |
| `density` | `compact` \| `balanced` \| `spacious` | 否 | 直通 Astryx `Table.density`，默认 `balanced` |
| `dividers` | `rows` \| `columns` \| `grid` \| `none` | 否 | 直通 `Table.dividers`，默认 `rows` |

### 3.6 `badge`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 1–6 个徽标 |
| `items[].label` | string | 是 | 文案，≤ 12 字，单行 |
| `items[].variant` | `neutral` \| `info` \| `success` \| `warning` \| `error` \| `blue` \| `cyan` \| `green` \| `orange` \| `pink` \| `purple` \| `red` \| `teal` \| `yellow` | 否 | 直通 Astryx `Badge.variant`（14 个，取自 `astryx component Badge --json`），默认 `neutral` |
| `items[].dot` | boolean | 否 | `true` = 前面加状态圆点（`StatusDot`） |
| `align` | `start` \| `center` \| `end` | 否 | 行内对齐，默认 `start` |

> 用法红线（Astryx Badge 文档明文）：**同一状态不要满页重复**。全绿的「正常」不是信息；只标需要人注意的那几个（超期、滞后、待确认）。

### 3.7 `callout`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `tone` | `info` \| `success` \| `warning` \| `error` | 是 | 语气，直通 Astryx `Banner.status`（枚举同名同集） |
| `title` | string | 是 | 结论句，≤ 40 字 |
| `body` | string | 否 | 依据 / 补充，≤ 120 字 |
| `eyebrow` | string | 否 | 上方眉标（旧 `note` 的位置） |
| `action` | object | 否 | `{ "label": string }`：右侧按钮文案 |

> `callout` 是**新增**类型：旧体系里「结论」只能塞进 `prose` 的段落或 `table.note`，没有独立承载。它对应 Astryx `Banner`（无登录、可折叠为静态块），比 Card + Badge 自拼更准。

### 3.8 `divider`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `label` | string | 否 | 分隔线中的文字，省略则为纯线 |
| `variant` | `subtle` \| `strong` | 否 | 直通 `Divider.variant`，默认 `subtle` |
| `spacing` | `2` \| `3` \| `4` \| `5` \| `6` | 否 | 上下留白档位（spacing step），默认 `4` |

### 3.9 `cover`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `title` | string | 是 | 封面主标题，≤ 24 字 |
| `eyebrow` | string | 否 | 抬头 |
| `badge` | string | 否 | 徽标文字 |
| `sub` | string | 否 | 一句话导语，≤ 120 字 |
| `meta` | object[] | 否 | `[{ "k": string, "v": string }]`，1–8 组，如 作者 / 日期 / 版本 / 篇幅 |

### 3.10 `prose`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 1–8 节 |
| `items[].n` | string | 否 | 节号，如 `01 · 问题` |
| `items[].title` | string | 否 | 节标题，≤ 24 字 |
| `items[].paras` | string[] | 是 | 该节段落，1–6 段 |

### 3.11 `timeline`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 节点，2–10 个，按时间正序 |
| `items[].date` | string | 是 | 日期或阶段，≤ 12 字（`2026-09`、`D+30`）。左列固定 96px，等宽数字 |
| `items[].title` | string | 是 | 节点标题，≤ 16 字 |
| `items[].text` | string | 否 | 一句话说明，≤ 60 字 |
| `items[].tone` | `accent` \| `success` \| `warning` \| `error` \| `info` | 否 | 节点圆点的语义，默认 `accent`（品牌橙）。已完成的节点用 `success`，卡住的用 `warning` |
| `title` | string | 否 | 时间轴标题（`Heading level=2`） |

> 圆点走 `StatusDot`，颜色只来自 token；不写 `#hex`。竖排不需要连线，节点之间靠 `gap 4` 分隔。

**最小可用样例**

```json
{ "type": "timeline", "props": { "title": "关键节点", "items": [
  { "date": "2026-09", "title": "总图定案", "text": "5#、6# 加高至 26 层。", "tone": "success" },
  { "date": "2026-11", "title": "报建预审", "text": "等日照与消防回执。", "tone": "warning" }
] } }
```

### 3.12 `matrix`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `columns` | object[] | 是 | 对比维度，1–6 列（首列固定是行标签列，不在此列） |
| `columns[].key` | string | 是 | 取值键，与 `rows[].cells` 的键一一对应 |
| `columns[].label` | string | 是 | 列头文字，单位写进列头（`用地 · 万㎡`） |
| `columns[].num` | boolean | 否 | `true` = 数值列：右对齐 + 等宽数字 |
| `rows` | object[] | 是 | 对比行，1–12 行 |
| `rows[].label` | string | 是 | 行标签（地块 / 方案 / 周期） |
| `rows[].cells` | object | 是 | `{ "<column.key>": string \| { "value": string, "state"?: ... } }` |
| `rows[].cells.*.state` | `good` \| `warn` \| `bad` | 否 | 单元格语义：`good`→success 徽标、`warn`→warning、`bad`→error。**不给 state 就是纯文本**，别满格上色 |
| `labelHeader` | string | 否 | 行标签列的列头，默认 `对比项` |
| `title` | string | 否 | 表标题 |
| `note` | string | 否 | 口径 / 说明 |
| `density` | `compact` \| `balanced` \| `spacious` | 否 | 直通 `Table.density`，默认 `balanced` |
| `dividers` | `rows` \| `columns` \| `grid` \| `none` | 否 | 直通 `Table.dividers`，默认 `rows` |

> `matrix` 与 `table` 的区别：`table` 是数据明细（数值多、无状态色），`matrix` 是**方案/地块横向对比**（行是对象、列是维度、可带状态徽标）。实现复用 `Table`，因为 `Text` 没有语义色，状态必须走 `Badge`。

**最小可用样例**

```json
{ "type": "matrix", "props": { "title": "地块对比", "labelHeader": "地块",
  "columns": [ { "key": "far", "label": "容积率", "num": true }, { "key": "status", "label": "状态" } ],
  "rows": [ { "label": "01 地块", "cells": { "far": "2.20", "status": { "value": "已摘牌", "state": "good" } } } ] } }
```

### 3.13 `image`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `src` | string | 是 | 本地相对路径（如 `examples/assets/xxx.svg`）或 `data:` URI。**渲染器会把本地文件读成 data URI 内嵌**，产物仍是单文件；`http(s)` 外链会被 `selfcheck` 判失败 |
| `alt` | string | 是 | 替代文本，说明画面内容（无障碍必需） |
| `caption` | string | 否 | 图注，≤ 60 字。示意图必须写明「示意 / 非交付图」 |
| `ratio` | `16:9` \| `4:3` \| `3:2` \| `1:1` \| `21:9` \| `auto` | 否 | 画幅，默认 `16:9`；`auto` = 按图片自身高度，不裁切 |
| `align` | `start` \| `center` | 否 | 图注对齐，默认 `start` |

> 圆角跟随所在容器的卡片档位（页面宽度 = 大档 20px；`grid` 内 = 中档 16px），不单独写死半径。

**最小可用样例**

```json
{ "type": "image", "props": { "src": "examples/assets/qingpu-siteplan.svg",
  "alt": "青浦云谷总平关系示意图", "ratio": "16:9",
  "caption": "总平关系示意图（内部讨论用，非交付图纸）" } }
```

### 3.14 `steps`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 步骤，3–5 个（少于 3 个用 `timeline` 更合适） |
| `items[].title` | string | 是 | 步骤名，≤ 12 字（`报建预审`，不写长句） |
| `items[].text` | string | 否 | 一句话说明，≤ 24 字 |
| `active` | number | 否 | 当前步骤的零基下标，默认 `1`；它之前的步骤显示为已完成 |
| `title` | string | 否 | 区块标题 |
| `note` | string | 否 | 节奏说明 / 关键路径提示 |

> **R8 起不再用 Astryx `Stepper`**：它的连接线是 4px 的 StyleX 原子类（`var(--color-border)`，8% 黑）、序号圆点固定 16px，没有按状态改粗细/颜色的入口。现在由渲染器用 `ol/li` + token 画：圆点 22px（已走过与当前步 = accent 实心 + `--color-on-accent` 数字，未到 = 2px `--color-border-emphasized` 空心），连线 2px（已走过 `--color-accent`、未到 `--color-border-emphasized`），每步等宽、线首尾各内缩半格，不顶容器边。DOM 语义仍是 `ol` + `li`。

**最小可用样例**

```json
{ "type": "steps", "props": { "title": "推进节奏", "active": 1, "items": [
  { "title": "方案深化", "text": "总图与户型同步收口" },
  { "title": "报建预审", "text": "日照与消防两项回执" },
  { "title": "施工图", "text": "桩基与围护同步出图" },
  { "title": "开工", "text": "计划 2027-04 进场" }
] } }
```

### 3.15 `quote`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `text` | string | 是 | 引文 / 结论，≤ 120 字。字号比正文大一档（`Text type="large"`） |
| `source` | string | 否 | 出处，≤ 40 字（`2026-11-16 方案评审会`） |
| `eyebrow` | string | 否 | 出处前的眉标（`评审结论`），与 `source` 用 ` · ` 连接 |
| `tone` | `accent` \| `success` \| `warning` \| `error` \| `info` | 否 | 左竖线颜色，默认 `accent`（品牌橙）；情绪强度不改字号 |

> Astryx `Blockquote` 没有 tone/颜色旋钮（dist 里只有 atomic class），所以竖线由渲染器用 `border-left` + 语义 token 画，正文仍用 `Text`。

**最小可用样例**

```json
{ "type": "quote", "props": { "tone": "accent",
  "text": "指标已经封顶，这一轮竞争的焦点从「做多」转向「做好」。",
  "eyebrow": "评审结论", "source": "2026-11-16 方案评审会" } }
```

### 3.16 `grid`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `cols` | `2` \| `3` \| `4` | 是 | 列数（数字，不是字符串）。2 列是默认版式；3–4 列只用于短卡片 |
| `gap` | `2` \| `3` \| `4` \| `5` \| `6` | 否 | 列间距档位，默认 `4`（16px） |
| `children` | object[] | 是 | 子区块，2–6 个，每项 `{ id?, type, props }`，结构与顶层 `blocks[]` 相同 |

> **`grid` 是最关键的容器**：没有它所有区块只能单列竖排。子区块会拿到「所在列数」上下文，卡片按列宽自动降到中/小档圆角内距（2–3 列 = 中档 16/24，4 列 = 小档 14/20），因此 `layout` 的圆角分级断言在 grid 内同样成立。`grid` 内不要再套 `grid`。

**最小可用样例**

```json
{ "type": "grid", "props": { "cols": 2, "gap": "4", "children": [
  { "type": "card", "props": { "title": "总图策略", "body": ["双塔靠东、板楼退南。"] } },
  { "type": "image", "props": { "src": "examples/assets/qingpu-siteplan.svg", "alt": "总平示意", "ratio": "16:9" } }
] } }
```

### 3.17 `device`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `kind` | `phone` \| `laptop` | 是 | 机身形态：`phone` 300px 宽 / 屏比 0.462；`laptop` 720px 宽 / 屏比 1.6。都居中放在卡片里 |
| `src` | string | 是 | 屏内静态截图。本地相对路径（如 `examples/assets/xxx.svg`）或 `data:` URI，**渲染器读成 data URI 内嵌**；`http(s)` 外链会被 `selfcheck` 判失败 |
| `alt` | string | 是 | 截图内容说明（无障碍必需，同时作为缺省图注） |
| `caption` | string | 否 | 图注，≤ 60 字；缺省回退到 `alt` |
| `align` | `start` \| `center` | 否 | 图注对齐，默认 `center`（机身本身始终居中） |
| `tone` | `default` \| `sunken` \| `inverse` | 否 | 卡片材质，同 §3.1「`tone` 通用规则」 |

> 机身与屏体都是渲染器用 token 画的 `div`：机身底 `--color-surface-inverse` + `--color-border-inverse` 描边，屏体圆角按 `kind` 走、`overflow:hidden` 裁切截图，`objectFit:cover`。**没有 iframe、没有外链、没有 `<script>`**；换截图只换 `src`，不动样式。

**最小可用样例**

```json
{ "type": "device", "props": { "kind": "phone",
  "src": "examples/assets/qingpu-siteplan.svg",
  "alt": "移动端总览页静态截图（示意，非交付图）",
  "caption": "移动端总览页静态截图（示意）" } }
```

### 3.18 `scorecard`

| 字段 | 类型 | 必填 | 说明 / 约束 |
|---|---|---|---|
| `items` | object[] | 是 | 评分项，2–8 条 |
| `items[].label` | string | 是 | 维度名，≤ 12 字（`去化速度`） |
| `items[].score` | number | 是 | 得分，0–`max`；缺省按 0 处理 |
| `items[].max` | number | 否 | 满分，默认 `100`；右侧读数按 `score / max` 显示 |
| `items[].state` | `good` \| `warn` \| `bad` | 否 | 进度条颜色：`success` / `warning` / `error`；缺省用 `--color-accent` |
| `title` | string | 否 | 区块标题 |
| `note` | string | 否 | 口径说明，≤ 40 字 |
| `density` | `compact` \| `normal` | 否 | 行间距档位，默认 `normal`（`compact` 行距 8px / 常规 12px） |
| `tone` | `default` \| `sunken` \| `inverse` | 否 | 卡片材质，同 §3.1「`tone` 通用规则」 |

> **不用雷达图**：静态单文件没有 tooltip，4–6 轴的雷达在打印尺寸下不可读。横向进度条一维一读，`max` 不同也能对齐同一轨道宽度（按百分比归一）。轨道用 `--color-border-subtle`，填充只取语义 token，不写 hex。

**最小可用样例**

```json
{ "type": "scorecard", "props": { "title": "交付准备度", "density": "compact",
  "note": "四项各 0–100，低于 70 分需在开工前补齐",
  "items": [
    { "label": "总图定案", "score": 96, "max": 100, "state": "good" },
    { "label": "报建预审", "score": 74, "max": 100, "state": "warn" },
    { "label": "施工图", "score": 68, "max": 100, "state": "warn" }
] } }
```

---

## 4. 映射表：block → Astryx

> 组件与 props **全部取自本机 `astryx component <Name> --json`（cli/core 0.7.16）**，不是猜的。组件全集已核：无 `Stat` / `MetricCard` / `Chart` / `Callout` 组件。

| `type` | Astryx 组件 | props 怎么映射 | 状态 |
|---|---|---|---|
| `heading` | `VStack` + `HStack` + `Text` + `Badge` + `Heading` + `TextInput` / `Button` | `eyebrow`→`Text(type="supporting")`；`badge`→`Badge(variant="info", label)`；`title`→`Heading(level=level, type="display-2" 仅当 level=1)`；`sub`→`Text(type="large"/"supporting")`；`toolbar.search`→`TextInput(label, placeholder)`；`toolbar.action`→`Button(variant="primary", label)`；布局 `VStack(gap=4)` + `HStack(justify="between", align="end", gap=5, wrap="wrap")` | 已实现（函数名 `Header`） |
| `text` | `VStack` + `Text` | 每段 `Text(type=size==="large"?"large":"body")`，`VStack(gap=2)`；`note`→`Text(type="supporting", size="sm")` | 已实现 |
| `metric` | `HStack` + `Card` + `Text`（**无专用指标组件**） | 每项 `Card(width="232px", style=CARD_FRAMES.small)` 包 `VStack`：`label`→`Text(type="supporting", size="sm")`；`value`→`Text(size="2xl", weight="medium", hasTabularNumbers=true)`；`unit`→`Text(type="supporting")` 同行；`hint`→`Text(type="supporting", size="sm")`；`HStack(gap=4, wrap="wrap")` | 已实现 |
| `card` | `Card` + `VStack` + `Heading` + `Text` + `Badge` | `padding`/`variant`/`elevation` 直通 `Card`；`eyebrow`→`Text(supporting, sm)`；`title`→`Heading(level=3)`；`sub`/`note`/`tag`→`Text(supporting)`；`body[]`→`Text(body)`；`badge`→`Badge(variant="neutral")`；卡片档位由 `tierForContext` 决定（页面宽度 `large` / grid 内 `medium`·`small`） | 已实现 |
| `table` | `Card` + `VStack` + `HStack` + `Heading` + `Text` + `Table` | `Table({ data, columns, density, dividers, hasHover:true })`，`columns` 需转成 `{key, header, align, width, renderCell}`：`label`→`header`；`num`→`align:"end"` + 单元格 `Text(hasTabularNumbers, justify:"end")`；`foot`→追加 `__foot` 数据行（半粗）；`title`→`Heading(level=2)`；`note`→`Text(supporting)` | 已实现 |
| `badge` | `HStack` + `Badge`（+ `StatusDot`） | `items[].variant`/`label` 直通 `Badge`；`dot=true`→前置 `StatusDot`；`HStack(gap=2)` | 已实现 |
| `callout` | `Banner` | `tone`→`status`；`title`→`title`；`body`→`description`；`eyebrow`→`description` 前缀；`action`→`endContent=Button(variant="primary")` | 已实现 |
| `divider` | `Divider`（+ 外层 `VStack(paddingBlock=spacing)`） | `label`/`variant` 直通；`spacing` 变成外层留白 | 已实现 |
| `cover` | `VStack` + `HStack` + `Heading` + `Text` + `Badge` | `title`→`Heading(level=1, type="display-2")` + 衬线字体栈；`sub`→`Text(type="large")`；`meta[]`→`HStack(gap=8, wrap)` 内每组 `VStack(k)` + `Text(v)` | 已实现 |
| `prose` | `VStack` + `Heading` + `Text` | `n`→`Text(supporting, sm)`；`title`→`Heading(level=2)`；`paras`→`Text(body)` | 已实现 |
| `timeline` | `VStack` + `HStack` + `Text` + `StatusDot`（**无 Timeline 组件**） | 每行 `HStack(gap=5, align="start")`：日期列 `div(flex:0 0 96px)` + `Text(supporting, sm, tabular)`；`VStack(gap=1)` 内标题行 `HStack(StatusDot, Text(weight="semibold"))` + 说明 `Text(supporting)` | 已实现 |
| `matrix` | `Card` + `VStack` + `Heading` + `Table` + `Badge` | 列 = 标签列 + `columns[]`；`state`→`Badge(variant=success/warning/error)`，无 state→`Text` | 已实现 |
| `image` | `AspectRatio` + `img`（**无 Image/Figure 组件**） | `ratio`→`AspectRatio(ratio=number, fit="cover")`，`auto` 时不套 `AspectRatio`；`src` 本地路径→渲染时读成 data URI；外框 `borderRadius` 取 `CARD_FRAMES[tier].borderRadius` | 已实现 |
| `steps` | `ol` + `li` + `VStack` + `Text`（**R8 起不用 `Stepper`**） | `active`→决定实心/空心与已完成段长度；每项 `li` 内：22px 序号圆点 + 标题 + 说明，连线 2px 由 token 上色 | 已实现 |
| `quote` | `Text` + `div(border-left)`（`Blockquote` 无 tone 旋钮） | `text`→`Text(type="large")`；`source`/`eyebrow`→`Text(supporting, sm)` 拼接；`tone`→`border-left: 4px solid var(--color-*)` | 已实现 |
| `grid` | `Grid` + `div` | `cols`→`Grid(columns=n)`；`gap`→`Grid.gap`；每个子 block 经 `renderBlock(child, { cols })` 渲染 | 已实现 |
| `device` | `div`（机身/屏体）+ `img`（**无 DeviceFrame 组件**） | `kind`→机身 `maxWidth` 300/720 + 圆角 38/16 + 屏体 `aspect-ratio` 0.462/1.6；机身 `background:var(--color-surface-inverse)` + `1px solid var(--color-border-inverse)`；`src`→`embedImage`（本地路径读成 data URI）；`caption`/`alt`→`Text(supporting, sm)`；外框走 `SurfaceCard`（`CARD_OWNED`，不叠加 `surfaceFrame`） | 已实现（函数名 `DeviceBlock`） |
| `scorecard` | `Card` + `VStack` + `HStack` + `Text` + `div` | 每项 `HStack(justify="between")` 放 `label`→`Text(sm)` 与 `score / max`→`Text(sm, hasTabularNumbers)`；轨道 `div(8px, radius 9999, background:var(--color-border-subtle))` 内嵌 `width:pct%` 填充，色按 `state`→`success`/`warning`/`error`，缺省 `var(--color-accent)`；`title`→`Heading(level=2)`；`note`→`Text(supporting, sm)`；`density`→行间距 8/12px | 已实现（函数名 `ScorecardBlock`） |

### 4.1 与渲染器的对接现状

1. **键名已对齐**：`agent/render.mjs` 直接读 `content.meta.recipe` + `content.blocks[]`；`content.type` / `content.sections` 仅作兼容回退。内容层按本文档写即可。
2. **类型覆盖**：`SECTIONS` 已覆盖全部 18 种（`header` 作为 `heading` 的旧名保留）。未知类型会抛 `未知区块类型 type="…"（支持: …）`，报错带类型名。
3. **`foot`**：Astryx `Table` 没有 footer 槽，渲染器把 `foot` 追加成一条带 `__foot` 标记的数据行（单元格半粗）。合计行也可以直接写在 `rows` 末尾，两种都合法，但同一页只用一种。
4. **`heading` vs `header`**：同一个东西，旧函数名保留 `Header`，`type` 用 `heading`。映射见上。
5. **暗色**：`meta.theme` 是内容层的明暗声明；渲染器 CLI 另支持 `--theme light|dark` 覆盖，用于出对照产物（`node agent/render.mjs <in> -o <out> --theme dark`）。这是 CLI 增补，不改配方/主题管线。

### 4.2 颜色与数值纪律

- 内容层**不出现任何颜色/尺寸字面量**（`#hex`、`rgb()`、`px`）。语义只到 `tone` / `variant` / `trend` 这一层，具体色值由 Astryx token 决定。
- 品牌实际色：`accent` 亮橙 `#F57C00`（暗 `#FFA94D`，用于色块 / 按钮 / KPI 数字，配近黑字 `#1A0E00`）；正文链接用深橙 `#B85C00`（白底 4.60）；浅橙底 `#FFF1E0` / `#3A2213`。`info` 从 Astryx 默认亮蓝改为中性灰蓝（实心 `#4A6785` / 底 `#EDF1F6` / 文字 `#3A5670`，暗 `#8FAFC9` / `#1E2A35`）；`warning` 改为深琥珀（实心 `#7f6118` + 奶白字 `#fff6e0` / 底 `#fbf6ea` / 文字 `#8a6a1f`），不再用刺眼黄。`success` / `error` 仍为 Astryx 默认。反白块用暖近黑 `#181614`（暗 `#131211`），不用橙铺底。
- 所有数值走 `string` + `hasTabularNumbers`；不要依赖 `number` 类型丢失千分位。
- `Text` 组件没有 `success` / `error` 色（枚举只有 `primary/secondary/disabled/placeholder/accent/inherit`），所以涨跌**不能靠文字染色**；要表达涨跌，用 `trend` 选图标，或用 `badge` 的语义 variant。

---

## 5. 最小示例（14 行）

```json
{
  "meta": { "recipe": "report", "title": "季度复盘", "date": "2026-11-16", "theme": "light" },
  "blocks": [
    { "type": "heading", "props": { "eyebrow": "经营 · Q3", "title": "季度复盘", "sub": "口径说明见页脚。" } },
    { "type": "metric", "props": { "items": [
      { "label": "成交额", "value": "86.4", "unit": "万", "hint": "环比 +1.2%", "trend": "up" }
    ] } },
    { "type": "table", "props": { "columns": [{ "label": "渠道" }, { "label": "成交额 · 万", "num": true }],
      "rows": [["自然搜索", "21.4"]] } },
    { "type": "divider", "props": {} }
  ]
}
```

---

## 6. 内容红线（从旧闸门搬来，与视觉无关）

1. **结论只写一次**：去空白后相同、长度 ≥ 20 字且含中文标点的句子，全文第二次出现即判重复。`meta.sub` 与 `heading.sub` 不要写同一句话。豁免：标题、表格标签、显式索引区（旧 `data-gary-index`）。
2. **不泄漏内部编码**：不写 `SC12` / `AD3` / `SRC-XX-01` 这类内部编号形态；要给编号就给业务编号（`5#`、`7#`）或明确说明来源。
3. **禁 lorem ipsum、禁占位符**（`xxx`、`todo`、`待填`）。演示数据必须标注口径（页级 `meta.badge` 写 `示意数据`），不得冒充真实业务数字。
4. **数字自洽**：同一页里合计 = 明细之和，指标 = 表格汇总，环比与绝对值不打架。这是内容作者的责任，闸门只查文字重复，查不出算术错。
5. **术语**：中文正文 + 英文术语原形（`容积率` 不写成 `FAR` 之外的混写；`CAD`、`DDS` 保留英文）。

---

## 7. 与旧 `content.json` 的差异（保留 / 改动 / 为什么）

| 项 | 旧 | 新 | 为什么 |
|---|---|---|---|
| 顶层结构 | 顶层键 = 配方名（`dashboard` / `report` / …），其下按 `section.id` 分块 | `meta`（含 `recipe`）+ 平铺 `blocks[]` | 平铺数组才好按号插块、按 `id` 深链；配方名收进 `meta` 后，一个文件只描述一页，不再是一份多页大对象 |
| `head` | section type `head`，props `eyebrow/title/badge/sub` | `heading`，props **同名不变** | 旧 `render.mjs` 内部函数叫 `header`、旧内容键叫 `head`，一物三名；统一成语义最准的 `heading`，props 一个不动 |
| `kpis` | `items[{label,value,unit,hint}]` | `metric`，`items` 结构**完全保留**，新增可选 `trend` | 只改类型名（`metric` 是任务点名的词）；`trend` 是新增，因为旧体系靠 `hint` 里手写 `+1.2%`，渲染层无法据此选图标 |
| `table` | `title/note/columns[{label,num}]/rows[][]` | 全保留，新增可选 `foot` / `density` / `dividers` | `foot` 是「合计行」这一真实需求的缺口（旧只能把合计塞进 `rows` 最后一行，无强调）；两张密度/分隔线是直通 Astryx `Table` 的既有能力，不新增自造概念 |
| `prose` | `items[{n,title,paras[]}]` | 原样保留 | 长文报告的主力结构，无改动价值 |
| `cover` | `eyebrow/title/sub/meta[{k,v}]` | 原样保留（新增 `badge`） | 旧 `report` 页就是用 `cover` 起头；`badge` 是旧 `head` 已有的字段，对齐到封面 |
| `canvas` | `badge/label/title/sub/tag/note` | 收敛成 `card`（`label`→`eyebrow`，其余同名） | `canvas` 是「预览画板」专用，语义太窄；`card` 才是有复用价值的通用块 |
| `chart` | 旧有 | **进契约，但归 viz 一侧** | 见 §2 末尾：`viz/render-viz.mjs` 接管，`agent/render.mjs` 不认 |
| `groups` / `nav` / `inspector` / `composer` | 旧有 | **不进契约** | 需运行时交互 / 属外壳职责 |
| `callout` / `divider` | 无 | 新增 | 旧的「结论」只能藏进段落或表注，没有承载；`Divider` 是 Astryx 现成组件，纳入成本几乎为零 |
| 字段类型 | 混合（`value` 是字符串已是对的；`sw` 的 `on` 是 boolean） | 统一：数值一律 string，状态一律枚举，布尔只用 `num` / `dot` | 枚举才能校验；旧 `composer`/`groups` 里的隐式布尔随交互块一起不进契约 |

---

## 8. 校验

JSON 必须能被标准解析器读完（无尾逗号、UTF-8、中文不转义）：

```powershell
cd C:\AI\UI\gary-ui
python -c "import json;d=json.load(open('examples/demo-report.content.json',encoding='utf-8'));print('ok',len(d.get('blocks',[])))"
```

**契约级自检有实现，就是 `agent/checks/content.mjs`**（吃 JSON、0.2s、报错指到 block 序号与字段名）：

```powershell
node agent/checks/content.mjs <你的>.content.json
```

它覆盖本文件 §3.1–3.18 的必填字段 / 枚举 / 上下限（含 `device` / `scorecard`），外加
`CONTRACT.md §7.1 / §7.2` 的 7 种 `chart` + 3 种 `flow` 形状，以及 `image` / `device` 的 `src` 文件存在性。

**为什么它不可省**：渲染器对每个数组参数都有 `= []` 默认值，缺字段不抛错、只画空图；
`selfcheck` / `layout` / `contrast` 三道闸照样全绿。历史实测 18 份写错的内容里 15 份是这样过去的。

`chart` / `flow` 的 props **不在本文件展开**——真源是 `CONTRACT.md §7.1 / §7.2`（各型必填、
`rows[].parts` 与 `items` 的换用、`annotations` 结构、`status` 数据身份）。同一份事实写两处必然漂移。

---

## 9. 变更史

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-11-16 | v1 | 首版：10 个 block 类型，映射到 Astryx 0.7.16 实测组件；`blocks` 化收编旧 4 配方 section |
| 2026-11-16 | v1.1 | 扩到 16 个类型（新增 `timeline` / `matrix` / `image` / `steps` / `quote` / `grid`）；修正滞后状态列（`text`/`metric`/`card`/`badge`/`callout`/`divider` 标为已实现）；`grid` 为唯一嵌套容器并传递列数上下文（卡片档位随列宽）；`image` 本地路径渲染为 data URI；`theme` 支持 CLI 覆盖 |
| 2026-11-16 | v1.2 | 六个新区块各补「最小可用样例」；`steps` 改为语义列表重绘并写明原因（`Stepper` 原子类无法改圆点/连线）；`warning` 深琥珀写入 §4.2 |
