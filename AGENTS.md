# Gary-UI

> **Astryx 底座上的 Gary 品牌层：content.json 进，零脚本单文件 HTML 出。**
> 设计真源在 `theme/`，执行层是 `@astryxdesign/core` 的 174 个组件，agent 只填数据、不写样式。

## 你是谁？

| 角色 | 做什么 | 先读 |
|---|---|---|
| **消费方**（用 Gary-UI 出页面） | 写一份 `content.json` → 跑渲染器 → 拿单文件 HTML | [agent/CONTRACT.md](agent/CONTRACT.md) |
| **贡献方**（改 Gary-UI 本身） | 改配方 / 主题 / 闸门 | [agent/content.schema.md](agent/content.schema.md) + 下面所有文件 |

## 外部 Agent 快速路由

| 你要做什么 | 先读 | 然后 |
|---|---|---|
| **做页面（唯一入口）** | [agent/CONTRACT.md](agent/CONTRACT.md) | 填 `content.json` → `node agent/render.mjs <in> -o out/<page>.html` |
| **查 block 字段怎么写** | [agent/content.schema.md](agent/content.schema.md) | `meta` + `blocks[]` 的 16 个 type（§3.1–3.16 一节一类）、每个 props 的必填与字数上限 |
| **要做图表 / 流程图** | [viz/README.md](viz/README.md) | 填 `type: "chart"`（7 种）或 `type: "flow"`（3 种）→ `node viz/render-viz.mjs <in> -o out/<page>.html`，见 [CONTRACT §7](agent/CONTRACT.md) |
| **查组件有哪些 / props 是什么** | `npx @astryxdesign/cli component --list` | `npx @astryxdesign/cli component <Name> --json`（174 个组件） |
| **改品牌色 / 字体 / 圆角** | [theme/gary.theme.mjs](theme/gary.theme.mjs) | 改 token 覆盖，**不写死样式**，改完重跑渲染 |
| **改页面骨架（竖向节奏 / 新页型）** | `agent/recipes/*.recipe.mjs` | `report`（gap 8，文章壳）· `table`（gap 6，叠放壳） |
| **加/改一个 block 类型** | `agent/recipes/sections.mjs` | `SECTIONS` 表是唯一的 type → 渲染函数映射 |
| **交付前自检（必做）** | 下面「交付前验证」 | `selfcheck` + `layout` 两条都 exit 0 |
| **查旧系统怎么了** | [MIGRATION.md](MIGRATION.md) | 旧 65 组件 / shadcn / portal / 自造 token 全在 `archive/legacy-2026-11/` |
| **看组件长什么样** | `out/specimen/` | `scripts/specimen.mjs` 生成的标本页（A–D 变体 + 圆角 + 字体） |

## 关键指针

- **调用契约**：[agent/CONTRACT.md](agent/CONTRACT.md) — agent 的唯一入口，读完就能开工
- **内容契约**：[agent/content.schema.md](agent/content.schema.md) — 字段级 v1，16 个 block type 一节一类
- **渲染器**：`agent/render.mjs`（React 19 SSR，内联 reset + astryx + 主题 CSS）
- **图表与图示**：`viz/` — [viz/README.md](viz/README.md)（模块地图 / 颜色契约 / 字号映射）· `viz/render-viz.mjs`（CLI，只接管 `chart` / `flow`）· `viz/charts.mjs`（7 种图表）· `viz/flow.mjs`（3 种流程图）
- **配方**：`agent/recipes/report.recipe.mjs` · `table.recipe.mjs` · `sections.mjs`（16 个 block 渲染函数）
- **主题真源**：`theme/gary.theme.mjs` — 墨绿 `#24514a`（暗 `#5d9c8f`）、圆角 12/12/8、Helvetica + 微软雅黑
- **闸门**：`agent/checks/selfcheck.mjs`（单文件约束 5 项）· `agent/checks/layout.mjs`（真实 DOM 几何 6 条）
- **示例内容**：`examples/demo-report.content.json` · `examples/demo-table.content.json`
- **产物**：`out/`（两页 + specimen + 选型稿），**生成物，不手改**
- **归档**：`archive/legacy-2026-11/`（旧系统全量，可回滚）· `archive/tokens/`（上一轮 token 备份）
- **依赖**：`package.json`（`@astryxdesign/core` 0.7.16 · React 19.3.1 · playwright-core 1.65.1）

## 常见任务命令

```powershell
cd C:\AI\UI\gary-ui

# 全量自证：build 六页产物 + 三条闸全跑（交付前只需这一条）
npm run verify

# 分步：build 六页 / 单跑某一闸
npm run build
npm run check      # selfcheck 单文件约束
npm run layout     # 版式几何六项
npm run contrast   # WCAG AA 对比度

# 渲染一页
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html

# 渲染图表 / 流程图页（只这两类走 viz）
node viz/render-viz.mjs examples/demo-viz.content.json  -o out/viz-charts.html
node viz/render-viz.mjs examples/demo-flow.content.json -o out/viz-flow.html

# 两条验收闸（图表页同样跑）
node agent/checks/selfcheck.mjs out/demo-report.html
node agent/checks/layout.mjs out/demo-report.html out/demo-table.html
node viz/check-flow.mjs out/viz-flow.html      # 仅流程图：几何闸

# 组件目录与单组件文档
npx @astryxdesign/cli component --list
npx @astryxdesign/cli component Card --json
```

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
- ❌ 不要把 `type: "chart"` / `"flow"` 喂给 `agent/render.mjs`——它只认 `SECTIONS` 的 16 类，图表页必须走 `viz/render-viz.mjs`。
