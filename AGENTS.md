# Gary-UI

> **MWG 现代原生 CSS 为默认底座，Astryx（`@astryxdesign/core` 174 组件）为可选组件库：content.json 进，零脚本单文件 HTML 出。**
> 品牌真源在 `theme/gary.theme.mjs` 与 `mwg/tokens.css`（浅色 Paper `#F5F2EC` · 暗色 Carbon `#111111`），agent 只填数据、不写样式。

## 你是谁？

| 角色 | 做什么 | 先读 |
|---|---|---|
| **消费方**（用 Gary-UI 出页面） | 写一份 `content.json` → 跑渲染器（默认 `mwg/render.mjs`，可选 `agent/render.mjs`）→ 拿单文件 HTML | [agent/CONTRACT.md](agent/CONTRACT.md) |
| **贡献方**（改 Gary-UI 本身） | 改配方 / 主题 / MWG CSS / 闸门 | [agent/content.schema.md](agent/content.schema.md) + 下面所有文件 |

## 外部 Agent 快速路由

| 你要做什么 | 先读 | 然后 |
|---|---|---|
| **做页面（默认 MWG 原生底座，~45–80KB）** | [agent/CONTRACT.md](agent/CONTRACT.md) | 填 `content.json` → `node mwg/render.mjs <in> -o out/<page>.html`（全包 18 类区块 + `chart` + `flow`） |
| **做页面（可选 Astryx 组件库，~360–400KB）** | [agent/CONTRACT.md](agent/CONTRACT.md) | 文本区块：`node agent/render.mjs <in> -o out/<page>.html`；含图表：`node viz/render-viz.mjs <in> -o out/<page>.html` |
| **查 block 字段怎么写** | [agent/content.schema.md](agent/content.schema.md) | `meta` + `blocks[]` 的 18 个 type（§3.1–3.18 一节一类）、每个 props 的必填与字数上限 |
| **要做图表 / 流程图** | [viz/README.md](viz/README.md) | 填 `type: "chart"`（7 种）或 `type: "flow"`（3 种）→ 用 `mwg/render.mjs`（默认）或 `viz/render-viz.mjs`（可选 Astryx），见 [CONTRACT §7](agent/CONTRACT.md) |
| **查 Astryx 可选组件有哪些 / props** | `npx @astryxdesign/cli component --list` | `npx @astryxdesign/cli component <Name> --json`（174 个组件） |
| **改品牌色 / 字体 / 圆角** | [theme/gary.theme.mjs](theme/gary.theme.mjs) · [mwg/tokens.css](mwg/tokens.css) | 同步更新两处 token，**不写死样式**，改完重跑渲染 |
| **改页面骨架（竖向节奏 / 新页型）** | `mwg/components.css` · `agent/recipes/*.recipe.mjs` | `report` · `table` · `dashboard` · `landing` |
| **加/改一个 block 类型** | `mwg/render.mjs` · `agent/recipes/sections.mjs` | `BLOCK_RENDERERS`（MWG）与 `SECTIONS`（Astryx） |
| **交付前自检（必做）** | 下面「交付前验证」 | `npm run verify`（或 `selfcheck` + `layout` + `contrast`）全 exit 0 |
| **查旧系统怎么了** | [MIGRATION.md](MIGRATION.md) | 旧 65 组件 / shadcn / portal / 自造 token 全在 `archive/legacy-2026-11/` |
| **看组件与风格选型页** | `out/specimen/` | `token-showcase.html` · `style-pick.html`（10 种风格选型）· 组件标本页 |

## 关键指针

- **调用契约**：[agent/CONTRACT.md](agent/CONTRACT.md) — agent 的唯一入口，读完就能开工
- **内容契约**：[agent/content.schema.md](agent/content.schema.md) — 字段级 v1，18 个 block type 一节一类
- **默认引擎（MWG 原生底座）**：`mwg/render.mjs` · `mwg/tokens.css` · `mwg/base.css` · `mwg/components.css` · `mwg/verify-mwg.mjs`
- **可选组件渲染器（Astryx）**：`agent/render.mjs`（React 19 SSR，内联 reset + astryx + 主题 CSS）
- **图表与图示**：`viz/` — [viz/README.md](viz/README.md)（模块地图 / 颜色契约 / 字号映射）· `viz/render-viz.mjs`（Astryx 轨独立 CLI）· `viz/charts.mjs`（7 种图表）· `viz/flow.mjs`（3 种流程图）；MWG 轨由 `mwg/render.mjs` 直接一并渲染
- **配方**：`agent/recipes/report.recipe.mjs` · `table.recipe.mjs` · `dashboard.recipe.mjs` · `landing.recipe.mjs` · `sections.mjs`（18 个 block 渲染函数）
- **主题真源**：`theme/gary.theme.mjs` & `mwg/tokens.css` — 亮色 Paper `#F5F2EC` / 暗色 Carbon `#111111`；亮橙 `#F57C00` 写面 / 深橙 `#A35200` 写字（暗 `#FFA94D`）、圆角四档 8/12/14/18、Helvetica + 微软雅黑
- **闸门**：`agent/checks/content.mjs`（内容契约，吃 JSON，0.2s 出字段级错）· `agent/checks/selfcheck.mjs`（单文件约束 6 项，双轨支持）· `agent/checks/layout.mjs`（真实 DOM 几何 5 条，含 375px）· `agent/checks/contrast.mjs`（WCAG AA，四语义全测）· `agent/checks/verify-all.mjs`（唯一总闸）
- **示例内容**：`examples/demo-report.content.json` · `examples/demo-table.content.json`
- **产物**：`out/`（Astryx 11 页 + MWG 5 页，**生成物，不手改**；选型页在 `out/specimen/`）
- **归档**：`archive/legacy-2026-11/`（旧系统全量，可回滚）· `archive/tokens/`（上一轮 token 备份）
- **依赖**：`package.json`（`@astryxdesign/core` 0.7.16 · React 19.3.1 · playwright-core 1.65.1）

## 常见任务命令

```powershell
cd C:\AI\UI\gary-ui

# 全量自证：build 16 页产物 + 全部闸门（含 flow 几何 + 375px + 20 反例）
npm run verify

# 分步：build 16 页 / 单跑某一闸
npm run build
npm run check       # selfcheck 单文件约束
npm run layout      # 版式几何五项
npm run contrast    # WCAG AA 对比度
npm run verify:mwg  # MWG P0/P2/Carbon 专项实测 + 截图

# 渲染一页（默认 MWG 原生底座，支持文本 + 图表 + 流程图）
node mwg/render.mjs examples/demo-report.content.json -o out/mwg-demo-report.html
node mwg/render.mjs examples/demo-report.content.json -o out/mwg-demo-report-dark.html --theme dark

# 渲染一页（可选 Astryx 组件库）
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html
node viz/render-viz.mjs examples/demo-viz.content.json  -o out/viz-charts.html
node viz/render-viz.mjs examples/demo-flow.content.json -o out/viz-flow.html

# 验收闸
node agent/checks/selfcheck.mjs out/mwg-demo-report.html
node agent/checks/layout.mjs out/mwg-demo-report.html out/mwg-demo-table.html
node viz/check-flow.mjs out/mwg-viz-flow.html      # 仅流程图：几何闸

# 可选 Astryx 组件目录与单组件文档
npx @astryxdesign/cli component --list
npx @astryxdesign/cli component Card --json
```

## 装了 Modern Web Guidance，优先级如下（2026-11-17）

`.agents/skills/modern-web-guidance` 是 Google 的现代 web 编码知识库（17 类 211 篇指南）。
它的 `SKILL.md` 自称 `MANDATORY: Execute FIRST for all HTML/CSS and clientside JS tasks` ——
**这个「优先」只对「怎么写代码」成立，不对「用什么组件」成立**。按官方 note inc. 落地口径
（`developer.chrome.com/blog/mwg-with-internal-component`），本仓固定三条：

1. **Gary-UI 已提供的组件一律用它**。不许因为 MWG 推荐 `<dialog>` / `popover` / 原生 `<input>`，
   就把 `card` / `callout` / `device` / `table` / `scorecard` 拆成原生元素——那是拆品牌层和四道闸。
2. **Gary-UI 覆盖不到才查 MWG**：真交互（popover 灯箱、锚点定位）、渐进增强、性能细节、
   可访问性补充。
3. **MWG 可抄的只有渲染层 CSS**：`agent/recipes/sections.mjs` 与 `viz/` 里的手写样式可吸收
   container query / `oklch` / `subgrid` / `text-wrap` / `@supports`，但**不许让 agent 在
   `content.json` 里写 CSS 或协议**。

它不构成对 `content.json` + 四道闸的替代：211 篇指南里没有任何一条涉及品牌 token /
内容契约 / 输出校验（2026-11-17 实测核实）。它回答「怎么写现代代码」，本仓回答
「品牌是什么、内容允许什么、产物过不过闸」——正交。

## 硬规则

1. **只拼不造**：页面 = `meta` + `blocks`；不写 HTML / CSS / JS，不加 `<script>`，不引外链。
2. **零字面量**：内容层与 props 里不出现颜色 / 字号 / 圆角（`#hex`、`rgb()`、`px`）。要改观感改 `theme/`。
3. **不手写 class**：类名全部由 Astryx 组件生成。
4. **卡片圆角/内距归渲染器**：`sections.mjs` 的 `CARD_FRAMES` 按宽度分三档，别给 Card 传 `style` 圆角。
5. **闸门是硬的**：`selfcheck` 与 `layout` 任一非 0 不得交付；失败按打印的实测 px 值改内容，不绕闸。
6. **`out/` 与 `examples/*.content.json` 是产物/输入两侧**：`out/` 不手改；示例内容改动要同步过闸。
7. **图表与流程图只走 `viz/render-viz.mjs`**：`chart` / `flow` 不在 `agent/render.mjs` 的 `SECTIONS` 表里，喂错渲染器直接抛「未知区块类型」。

## 交付前验证（贡献方）

```powershell
cd C:\AI\UI\gary-ui
node agent/checks/content.mjs examples/demo-report.content.json                   # 内容契约（先跑，0.2s）
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html   # 渲染
node agent/checks/selfcheck.mjs out/demo-report.html                             # 单文件约束
node agent/checks/layout.mjs out/demo-report.html out/demo-table.html            # 版式几何

# 改过 viz/ 或图表页内容时追加
node viz/render-viz.mjs examples/demo-viz.content.json -o out/viz-charts.html
node agent/checks/selfcheck.mjs out/viz-charts.html
node viz/check-flow.mjs out/viz-flow.html                                         # 流程图几何
```

三条全过才算完成；动了图表链路时上面 viz 三条同样要过。缺任何一项标注「未验证」。

## 公开仓库

`KODxixi/Gary-UI` · MIT 许可 · 单文件产物双击即开，无需服务

## 不要去哪找（已知错误位置）

- ❌ 不要找 65 个自造组件、shadcn 适配层、`components/*.json`、`primitives.css`、`tokens/tokens.json`——全部退役，见 [MIGRATION.md](MIGRATION.md)，实体在 `archive/legacy-2026-11/`。
- ❌ 不要跑 `npm run typecheck / build / audit:ui / audit:contrast`（旧 shadcn 四关），已不存在；验收只认 `selfcheck` + `layout`。
- ❌ 不要用 `python scripts/validate.py` 当闸——脚本已归档，且它只打印不看退出码。
- ❌ 不要从 `archive/legacy-2026-11/CHANGELOG.md` 抄数值——数值真源是 `theme/gary.theme.mjs` 与 `agent/recipes/sections.mjs`。
- ❌ 不要改 `out/` 里的 html、也不要改 `*.bundle.css`——生成物，改源文件重跑。
- ❌ 不要找 Gary-UI 的分叉副本：唯一真相位置是 `C:\AI\UI\gary-ui`。
- ❌ 不要把 `type: "chart"` / `"flow"` 喂给 `agent/render.mjs`——它只认 `SECTIONS` 的 18 类，图表页必须走 `viz/render-viz.mjs`。
