# viz/ — 图表与图示（R5）

原生 SVG，不引图表库。产物是单文件 HTML：零 `<script>`、零外链，颜色全部走 Astryx token。

## 模块地图

| 文件 | 职责 |
|---|---|
| `_src/` | 旧仓三份规范真源（`chart-recipes.json` / `flow-diagram.json` / `diagram-recipes.json` + 三份 docs）的副本，只读。不依赖 `spec/` 是否还在。 |
| `spec.mjs` | 从 `_src` 读只读几何：图表通道、字号梯度、笔画、间距、标注协议；流程图四色角色 / 圆角 / 箭头路径 / 线型 / dasharray。**不读旧主题的 hex。** |
| `palette.mjs` | 唯一的色板出口：`PALETTE`（accent / 语义色 / 中性阶梯 / accent 深浅档 / 流程角色）、`seriesColor(i, kind)`、`FONT`。全部是 CSS 变量字符串。 |
| `charts.mjs` | 6 类图表 + `KpiTile` + `ChartBlock`（标题 / 问题句 / 图 / 标注注释 / 来源与状态）。 |
| `flow.mjs` | 3 类流程图 + `FlowBlock`；正交路由、`marker` 定义、节点形状。 |
| `render-viz.mjs` | CLI：`content.json` → 单文件 HTML。只接管 `chart` / `flow`，其余区块复用 `agent/recipes/sections.mjs`。 |
| `check-flow.mjs` | 几何闸：折线必须严格正交、每条边必须带 `marker-end`、节点框互不相交。读产物 HTML，不重渲染。 |
| `shoot-full.mjs` | 全页截图助手（1440 宽 fullPage），只用于人眼复核；交付截图仍走 `agent/checks/shoot.mjs`。 |

## 颜色契约：0 个 hex

`viz/*.mjs` 里没有任何 `#rrggbb` 字面量。色值全部是 token 引用：

- 数据序列：**Google Charts 八色**，按系列下标绑定（blue/red/yellow/green/purple/cyan/orange/gray）
  - `series`：第 N 个系列取第 N 色，顺序沿用 Google Charts 默认（蓝红黄绿在前）
  - 单系列柱图按**类别**下标取色、不按系列下标——否则每张单系列图都是同一支蓝
  - 单系列折线固定取第 3 色（绿）；黄只做填充不做描边（白底 1.71，描边发虚）
  - 品牌 accent 不参与图表——图表用 `--color-data-categorical-*`，两套色互不干扰
- 语义：`--color-{success,warning,error,info}`（只留给状态，不拿来当系列色）
- 中性：`--color-{background-card,background-surface,background-muted,track,border,text-primary,text-secondary}`
- 流程四角色：input→orange、process→blue、decision→purple、result→teal（刻意不用 success/error 表达好坏，角色不代表评价）

SVG 里颜色写在 `style` 而不是表现属性：`var()` 在 presentation attribute 上不生效。所以改色只需改 `theme/gary.theme.mjs` 或 Astryx 默认 token，不用碰 `viz/`。

## 字号映射

规范给的是 16 / 14 / 12，theme 的步进是 base 14 / sm 12。映射写在 `palette.mjs` 的注释里：

| 语义 | 取用 | 实际 |
|---|---|---|
| 图表标题（block 层，不是 SVG 内） | Astryx `Heading` | 随主题 |
| 轴标签 / 数值标签 | `var(--font-size-sm)` | 12px |
| 图例 / 单位 | `var(--font-size-sm)` | 12px |
| 标注注脚 | `calc(var(--font-size-sm) - 1px)` | 11px |
| 指标数字 | `var(--font-size-2xl)` | 24px |
| 节点标题 | `var(--font-size-sm)`（600） | 12px |
| 节点副标题 | `calc(var(--font-size-sm) - 1px)` | 11px |

不硬写 16px：theme 里没有这一档，就近取步进并在文档里说明，比造一个孤儿字号诚实。

## 图表实现状态

| 类型 | `chart` 值 | 做了什么 |
|---|---|---|
| 单系列柱 | `bar` | 分组槽位、数值直标、极值 `anchor`（虚线引到柱右上）、`缺测` 不画零值 |
| 分组柱 | `grouped-bar` | 多系列同槽、右上图例、共同零点 |
| 折线 | `line` | 数据点 + 直标、`reference` 均值虚线 + 值标签、`band` 区间底色（支持，示例未用）、`anchor` 圆环、缺测断线不跨接、非零基线时轴脚注声明范围 |
| 百分比堆叠 | `stacked` | 一行一条、段间 2px 缝、右侧 100%、图例带套数与占比 |
| 环形 | `donut` | 中心合计、四色段、右侧图例（名称 / 值 / 占比） |
| 进度条组 | `progress` | 多行 `value/max`、分母提示、右侧百分比 |
| KPI 迷你趋势 | `sparkline` | `KpiTile`：指标名、大数、环比、迷你折线（viewBox 96 高 / 折线 2.4px / accent 20% 面积 / 首尾值直标 / 淡基线）、注脚、来源 |

标注协议按 `docs/CHART_EXPRESSION.md` 三身份：`kind: data | derived | assumed`，`basis` 写依据；`ChartBlock` 把每条标注折成「标注 1 · …（身份 · 依据）」一行，读者不用在图里找小字。

## 流程图实现状态

| 类型 | `flow` 值 | 网格 |
|---|---|---|
| 线性 | `linear` | 4 节点、宽高固定 200×96（capsule 56）、同一中心线 |
| 分支 | `branch` | 网格 250×150，节点 190×96，判定菱形 152×96；两条出边从菱形右侧 ±14 处各自出线 |
| 泳道 | `swimlane` | 泳道 156 高、列 258、节点 196×80；跨道走格子间隙 |

几何规则：折线全部 90°（`route()` 按主轴方向选择出入边），箭头是水滴 `M7.28 3.29 A3.3 3.3 0 1 0 7.28 8.71 L11.2 6 Z`（13×13，refX 11.2，`markerUnits="userSpaceOnUse"`），实线 2px / 虚线 1.5px `4 3`，每条 line/polyline 都有 `marker-end`。圆角只有三种：卡片 8、胶囊 h/2、泳道带 4。

## 新增一张图

1. 在 `charts.mjs` 写组件，只用 `PALETTE.*` + `FONT.*`，不要写死颜色或字号。
2. 在 `ChartBlock` 的 `BODIES` 映射里登记 `chart` 值，`KINDS` 里写显示名。
3. `examples/demo-viz.content.json` 里加一个 `type: "chart"` 区块，必须带 `source` 与 `status`（数据身份：实测 / 示例数据 / 推算）。
4. `node viz/render-viz.mjs examples/demo-viz.content.json -o out/viz-charts.html`，再跑 `agent/checks/selfcheck.mjs` 与 `agent/checks/layout.mjs`。

新增流程节点类型同理：`flow.mjs` 的 `Node()` 分派 + `FlowBlock` 的 `KINDS`。

## 跑法

```bash
node viz/render-viz.mjs examples/demo-viz.content.json -o out/viz-charts.html
node viz/render-viz.mjs examples/demo-flow.content.json  -o out/viz-flow.html
node viz/check-flow.mjs out/viz-flow.html          # 几何闸
node agent/checks/selfcheck.mjs out/viz-charts.html
node agent/checks/layout.mjs out/viz-charts.html
node agent/checks/shoot.mjs out/viz-charts.html out/viz-charts.png
```

## 和 `spec/` 的关系

`viz/_src/` 是旧仓规范的副本，本模块只从它读几何与线型，不改写它。`docs/*.md` 里的链接仍指向 `spec/`，若 `spec/` 已被归档，以 `viz/_src/` 为准。
