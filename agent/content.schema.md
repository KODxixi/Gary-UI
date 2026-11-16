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
| `theme` | string | 否 | 明暗 | `light`（默认）· `dark` |
| `lang` | string | 否 | 文档语言 | `zh-CN`（默认）· `en` |

### 1.2 `blocks[]`

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 否 | 锚点标识，供目录 / 深链使用；缺省按 `b0`、`b1`… 自动编号。沿用旧 `section.id` |
| `type` | string | 是 | 区块类型，取值见 §2 |
| `props` | object | 是 | 该 type 的字段集，见 §3 |

`blocks` 顺序即页面渲染顺序。数组长度 1–24；单个页面建议 4–10 块。

---

## 2. block 类型清单

| # | `type` | 中文 | 对应旧 section | 状态 |
|---|---|---|---|---|
| 1 | `heading` | 页眉 / 小节标题 | `head`（旧渲染器叫 `header`） | 已实现 |
| 2 | `text` | 正文段落 | `prose.items[].paras` 抽出来 | 待实现 |
| 3 | `metric` | 指标卡组 | `kpis` | 待实现 |
| 4 | `card` | 通用卡片 | `canvas` | 待实现 |
| 5 | `table` | 表格 | `table` | 已实现 |
| 6 | `badge` | 状态徽标行 | `head.badge` 独立成块 | 待实现 |
| 7 | `callout` | 结论 / 提示框 | 无（新增） | 待实现 |
| 8 | `divider` | 分隔线 | 无（新增） | 待实现 |
| 9 | `cover` | 封面 | `cover` | 已实现 |
| 10 | `prose` | 长文分节 | `prose` | 已实现 |

> 「已实现」= `agent/recipes/sections.mjs` 的 `SECTIONS` 表里已有对应函数（截至 2026-11-16 为 `header / cover / prose / table`）。
> `heading` 的 props 与现有 `header` 完全一致，只是类型名改成了语义更准的 `heading`；渲染器侧一行映射即可（§4.1）。

**明确不纳入本契约**（旧有、新版暂无承载能力）：

| 旧 section | 为什么不要 |
|---|---|
| `chart` | Astryx 无图表组件（组件全集已核，见 §4 注）；折线要自建，等图表规范定稿再进契约 |
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
| `items` | object[] | 是 | 指标项，1–6 个（建议 4）。沿用旧 `kpis.items` |
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
| `columns` | object[] | 是 | 列定义，2–8 列 |
| `columns[].label` | string | 是 | 列头文字。**单位写进列头**（`成交额 · 万`、`计容建面 · ㎡`），不另立单位行 |
| `columns[].num` | boolean | 否 | `true` = 数值列：右对齐 + 等宽数字（`hasTabularNumbers`）。沿用旧字段 |
| `rows` | string[][] | 是 | 数据行，1–40 行；**每行长度必须等于 `columns` 长度**，单元格只放字符串（数值也写成字符串） |
| `foot` | string[] | 否 | 合计 / 汇总行，长度 = 列数。首格通常写 `合计`。**当前渲染器未实现，会被忽略**（§4.1） |
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

---

## 4. 映射表：block → Astryx

> 组件与 props **全部取自本机 `astryx component <Name> --json`（cli/core 0.7.16）**，不是猜的。组件全集已核：无 `Stat` / `MetricCard` / `Chart` / `Callout` 组件。

| `type` | Astryx 组件 | props 怎么映射 | 状态 |
|---|---|---|---|
| `heading` | `VStack` + `HStack` + `Text` + `Badge` + `Heading` + `TextInput` / `Button` | `eyebrow`→`Text(type="supporting")`；`badge`→`Badge(variant="info", label)`；`title`→`Heading(level=level, type="display-2" 仅当 level=1)`；`sub`→`Text(type="large"/"supporting")`；`toolbar.search`→`TextInput(label, placeholder)`；`toolbar.action`→`Button(variant="primary", label)`；布局 `VStack(gap=4)` + `HStack(justify="between", align="end", gap=5, wrap="wrap")` | 已实现（函数名 `Header`） |
| `text` | `VStack` + `Text` | 每段 `Text(type=size==="large"?"large":"body")`，`VStack(gap=2)`；`note`→`Text(type="supporting", size="sm")` | 待实现 |
| `metric` | `HStack` + `Card` + `Text`（**无专用指标组件**） | 每项 `Card(padding=4, elevation="low")` 包 `VStack`：`label`→`Text(type="supporting", size="sm")`；`value`→`Text(size="2xl", weight="medium", hasTabularNumbers=true)`；`unit`→`Text(type="supporting")` 同行；`hint`→`Text(type="supporting", size="sm")`；`HStack(gap=4, wrap="wrap")` | 待实现 |
| `card` | `Card` + `VStack` + `Heading` + `Text` + `Badge` | `padding`/`variant`/`elevation` 直通 `Card`；`eyebrow`→`Text(supporting, sm)`；`title`→`Heading(level=3)`；`sub`/`note`/`tag`→`Text(supporting)`；`body[]`→`Text(body)`；`badge`→`Badge(variant="neutral")` | 待实现 |
| `table` | `Card` + `VStack` + `HStack` + `Heading` + `Text` + `Table` | `Table({ data, columns, density, dividers:"rows", hasHover:true })`，`columns` 需转成 `{key, header, align, width, renderCell}`：`label`→`header`；`num`→`align:"end"` + 单元格 `Text(hasTabularNumbers, justify:"end")`（`align`/`renderCell` 是 Astryx Table 的列描述形态，见 `sections.mjs`）；`title`→`Heading(level=2)`；`note`→`Text(supporting)` | 已实现（`foot` 未实现） |
| `badge` | `HStack` + `Badge`（+ `StatusDot`） | `items[].variant`/`label` 直通 `Badge`；`dot=true`→前置 `StatusDot`；`HStack(gap=2)` | 待实现 |
| `callout` | `Banner` | `tone`→`status`（枚举 `info/success/warning/error` 完全同名）；`title`→`title`；`body`→`description`；`eyebrow`→`description` 前缀或省略；`action`→`endContent=Button(variant="primary")` | 待实现 |
| `divider` | `Divider`（+ 外层 `VStack(gap=spacing)`） | `label`/`variant` 直通；`spacing` 变成外层 `VStack` 的 gap | 待实现 |
| `cover` | `VStack` + `HStack` + `Heading` + `Text` + `Badge` | `title`→`Heading(level=1, type="display-2")`；`sub`→`Text(type="large")`；`meta[]`→`HStack(gap=8, wrap)` 内每组 `VStack(k)` + `Text(v)`（也可换 `MetadataList(orientation="horizontal")`，二选一） | 已实现 |
| `prose` | `VStack` + `Heading` + `Text` | `n`→`Text(supporting, sm)`；`title`→`Heading(level=2)`；`paras`→`Text(body)` | 已实现 |

### 4.1 与当前渲染器的落差（必须知道，否则 JSON 喂不进去）

1. **键名**：契约是 `meta` + `blocks`；当前 `agent/render.mjs` 读的是 `content.type` + `content.sections`。渲染器侧改这一行即可，内容层不需要动：

   ```js
   const sections = (content.blocks ?? content.sections)
     .map((b) => ({ id: b.id, type: b.type === 'heading' ? 'header' : b.type, props: b.props }));
   const recipeId = content.meta?.recipe ?? content.type;
   ```

2. **类型覆盖**：`SECTIONS` 现有 `header / cover / prose / table` 四个；`metric / text / card / badge / callout / divider` 六个待实现（本文档先定契约，渲染实现归渲染器负责人）。
3. **`foot`**：Astryx `Table` 没有 footer 槽，合计行需要渲染器决定实现方式（追加带标记的数据行，或自建 footer row）。在此之前 `foot` 会被静默忽略 —— 因此**合计行宁可先写成最后一条 `rows`**，`foot` 只作为语义标记。
4. **`heading` vs `header`**：同一个东西，旧函数名保留 `Header`，`type` 用 `heading`。映射见上。

### 4.2 颜色与数值纪律

- 内容层**不出现任何颜色/尺寸字面量**（`#hex`、`rgb()`、`px`）。语义只到 `tone` / `variant` / `trend` 这一层，具体色值由 Astryx token 决定。
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
| `chart` / `groups` / `nav` / `inspector` / `composer` | 旧有 | **不进契约** | 见 §2 末尾：无图表组件 / 需运行时交互 / 属外壳职责 |
| `callout` / `divider` | 无 | 新增 | 旧的「结论」只能藏进段落或表注，没有承载；`Divider` 是 Astryx 现成组件，纳入成本几乎为零 |
| 字段类型 | 混合（`value` 是字符串已是对的；`sw` 的 `on` 是 boolean） | 统一：数值一律 string，状态一律枚举，布尔只用 `num` / `dot` | 枚举才能校验；旧 `composer`/`groups` 里的隐式布尔随交互块一起不进契约 |

---

## 8. 校验

JSON 必须能被标准解析器读完（无尾逗号、UTF-8、中文不转义）：

```powershell
cd C:\AI\UI\gary-ui
python -c "import json;d=json.load(open('examples/demo-report.content.json',encoding='utf-8'));print('ok',len(d.get('blocks',[])))"
python -c "import json;d=json.load(open('examples/demo-table.content.json',encoding='utf-8'));print('ok',len(d.get('blocks',[])))"
```

契约级自检（字段必填、列宽一致、枚举合法）：由渲染器侧或校验脚本承担，本契约只定义判据，不内置实现。

---

## 9. 变更史

| 日期 | 版本 | 变更 |
|---|---|---|
| 2026-11-16 | v1 | 首版：10 个 block 类型，映射到 Astryx 0.7.16 实测组件；`blocks` 化收编旧 4 配方 section |
