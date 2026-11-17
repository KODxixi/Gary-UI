# Gary-UI

> **写一份 JSON，得到一个能双击打开的单文件 HTML。** 底座 `@astryxdesign/core` 0.7.16（174 个组件），品牌层只有 Gary 的橙色、字体与圆角分级。

不需要服务器、不需要 CDN、不需要打包；产物零 `<script>`、零外链，发微信、塞邮件、丢进评审库都能直接看。

## 五分钟上手

前提：Node ≥ 22。

**① 装依赖**（本机 `node_modules/` 已就绪，可跳过这步）

```powershell
cd C:\AI\UI\gary-ui
npm install
```

**② 写一页内容** —— 新建 `examples/my-page.content.json`：

```json
{
  "meta": { "recipe": "report", "title": "季度复盘", "date": "2026-11-16" },
  "blocks": [
    { "type": "heading", "props": { "eyebrow": "经营 · Q3", "title": "季度复盘", "sub": "口径见页脚。" } },
    { "type": "metric",  "props": { "items": [
      { "label": "成交额", "value": "86.4", "unit": "万", "hint": "环比 +1.2%", "trend": "up" },
      { "label": "去化率", "value": "67.3", "unit": "%",  "hint": "环比 +4.0%", "trend": "up" }
    ] } },
    { "type": "table",   "props": {
      "columns": [{ "label": "渠道" }, { "label": "成交额 · 万", "num": true }],
      "rows": [["自然搜索", "21.4"], ["老带新", "64.9"]],
      "foot": ["合计", "86.3"]
    } },
    { "type": "callout", "props": { "tone": "info", "title": "结论：老带新是主力渠道", "body": "占比 75%，下周把物料预算向它倾斜。" } }
  ]
}
```

**③ 渲染**

```powershell
node agent/render.mjs examples/my-page.content.json -o out/my-page.html
```

输出一行确认（`examples/demo-report.content.json` 实测）：

```
WROTE C:\AI\UI\gary-ui\out\demo-report.html bytes=400473 recipe=report blocks=11 components=299
```

**④ 过两道闸**（都 exit 0 才算成）

```powershell
node agent/checks/selfcheck.mjs out/my-page.html     # 单文件：零脚本、零外链、主题落地
node agent/checks/layout.mjs    out/my-page.html     # 版式：内距、圆角分级、不出血、不溢出
```

**⑤ 看一眼图**（可选，用本机 chromium 缓存截图）

```powershell
node agent/checks/shoot.mjs out/my-page.html out/my-page.png
```

**⑥ 打开** `out/my-page.html` —— 双击即可。

要出**图表 / 流程图**：内容写法不变，只把第 ③ 步的渲染器换成 `node viz/render-viz.mjs`，见下面「图表与流程图」。

## 目录

| 路径 | 是什么 |
|---|---|
| `agent/render.mjs` | 渲染器：content.json → 单文件 HTML |
| `agent/content.schema.md` | 内容契约 v1：`meta` + `blocks[]`，16 个 block type 的字段与字数上限 |
| `agent/CONTRACT.md` | 给外部 agent 的调用契约（三步装配 / 组件查询 / 主题 / 闸门 / 图表 / 红线） |
| `agent/recipes/` | 配方：`report`（文章壳）· `table`（叠放壳）· `sections.mjs`（type → 渲染函数） |
| `viz/` | 图表与流程图：`render-viz.mjs`（CLI）· `charts.mjs`（7 种图表）· `flow.mjs`（3 种流程图）· `check-flow.mjs`（几何闸）· `README.md` |
| `theme/gary.theme.mjs` | 品牌层真源：亮橙 `#F57C00` 写面 / 深橙 `#B85C00` 写字（暗 `#FFA94D`）、Helvetica + 微软雅黑、圆角 12/12/8 |
| `agent/checks/` | 闸门：`selfcheck.mjs` · `layout.mjs`（+ `shoot.mjs` 截图） |
| `examples/demo-*.content.json` | 四份真实示例（报表 / 表格 / 图表 / 流程图） |
| `out/` | 产物目录（生成物，不手改） |
| `archive/legacy-2026-11/` | 旧系统全量归档（65 组件 / shadcn / portal / 自造 token），见 `MIGRATION.md` |

## 组件从哪来

174 个组件全在 `@astryxdesign/core`，**别猜 props**：

```powershell
npx @astryxdesign/cli component --list                # 组件目录（首行 Components (174)）
npx @astryxdesign/cli component Card --json           # 单个组件的 props / 用法 / 代码示例
npx @astryxdesign/cli component Card --props --json   # 只要 props 表
```

## 图表与流程图

图表不走 `agent/render.mjs`：`chart`（7 种）与 `flow`（3 种）由 `viz/render-viz.mjs` 接管，同一页里的正文、表格、卡片照样复用原来的区块，产物仍是零脚本单文件。

```powershell
node viz/render-viz.mjs examples/demo-viz.content.json  -o out/viz-charts.html   # 7 种图表
node viz/render-viz.mjs examples/demo-flow.content.json -o out/viz-flow.html     # 3 种流程图
node viz/check-flow.mjs out/viz-flow.html                                        # 流程图几何闸
```

- 图表类型：`bar`（单系列柱）· `grouped-bar`（分组柱）· `line`（折线）· `stacked`（百分比堆叠）· `donut`（环形）· `progress`（进度条组）· `sparkline`（KPI 迷你趋势）。
- 流程类型：`linear`（线性）· `branch`（分支）· `swimlane`（泳道）。
- 每张图必须带 `source` 与 `status`（实测 / 示例数据 / 推算）；字段细节见 [viz/README.md](viz/README.md)，命令与边界见 [agent/CONTRACT.md](agent/CONTRACT.md) §7。
- 颜色只有 token：`viz/*.mjs` 里没有 hex，换观感改 `theme/gary.theme.mjs`。
- 图表页同样过下面两道闸。

## 只想改样式？

改 `theme/gary.theme.mjs` 里的 token 覆盖（accent / 字体 / 圆角），重跑渲染即可；**不要在页面里写死颜色和 px**——卡片的内距与圆角由渲染器按宽度分档（14/20 · 16/24 · 20/28），闸门按档校验。

## 验收判据（硬）

| 闸 | 查什么 | 现在的结果 |
|---|---|---|
| `selfcheck.mjs` | 零 `<script>`、零外链、`data-astryx-theme="gary"`、内联样式 > 100 KB、≥3 个 astryx 语义类 | 5 项全 PASS |
| `layout.mjs` | 控件对齐 Δ≤1px、卡内距 ≥20px、圆角分级、首元素不贴边、横向不出血、文字不溢出 | 6 条全 PASS |

图表页同标准：`out/viz-charts.html` 与 `out/viz-flow.html` 的 `selfcheck` ALL PASS、`layout` 6 条全 PASS；流程图另跑 `node viz/check-flow.mjs out/viz-flow.html`（折线正交 / 每条边有箭头 / 节点框不相交，`FLOW GEOMETRY PASS`）。

## 旧的东西去哪了

65 个自造组件、shadcn 适配层、portal、`tokens/tokens.json` 的 214 个 `--gary-*`、旧的 10 个验收脚本，全部移入 `archive/legacy-2026-11/`（逐条去向见 [MIGRATION.md](MIGRATION.md)）。没有删除，可回滚。

## 许可

MIT。公开仓库 `KODxixi/Gary-UI`。
