# MIGRATION · 旧 Gary-UI → archive/legacy-2026-11

> 轮次：R5 拆旧与仓骨架重建（2026-11-16）。
> 原则：**只搬不删**。旧 65 个自造组件、shadcn 适配层、portal、自造 CSS 变量体系整体退役，全部移入 `archive/legacy-2026-11/`，可回滚（`git log --follow` 仍能追到历史）。
> 新链路（`agent/render.mjs` + `agent/recipes/**` + `theme/gary.theme.mjs` + `agent/checks/{selfcheck,layout,shoot}.mjs`）零改动。

## 0. 统计

| 项 | 数 |
|---|---|
| 移动清单逐条行（§1 全表） | **87** |
| 归档后顶层条目 | **29**（17 个目录 + 12 个文件，见 §2） |
| 移动的 git 跟踪文件 | **1330**（`git status` 全部识别为 `R`，`D=0`，历史未断） |
| 原地保留的顶层条目 | **21**（见 §3） |
| 仓根已不再存在的旧目录 | `adapters/` `components/` `patterns/` `portal/` `runtime/` `tokens/` `spec/` `docs/` `contracts/` `session/` `provenance/` `decisions/` `assets/` `licenses/` |

判据：1330 个跟踪文件用 `git mv` 搬（保留历史）；未跟踪/被忽略的构建物（`adapters/**/node_modules` 6.4 万个文件、`__pycache__`、`*.bak-*` 备份）随目录一起搬走，不计入统计。

## 1. 移动清单

### 1.1 组件与适配层（整体退役）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `adapters/react-shadcn/`（337 个跟踪文件：src / dist / .storybook / eslint-rules / scripts + registry.json） | `archive/legacy-2026-11/adapters/react-shadcn/` | shadcn 适配层整体退役；新底座是 `@astryxdesign/core` 174 个组件 | 否（新链路零引用；消费入口改为 `agent/CONTRACT.md`） |
| `adapters/visual/`（93 个跟踪文件） | `archive/legacy-2026-11/adapters/visual/` | 旧视觉适配器（visual manifest / runner.cjs 生成图），退役 | 否 |
| `adapters/dsh/`（0 个跟踪文件，仅未跟踪的 `plugin/node_modules`） | `archive/legacy-2026-11/adapters/dsh/` | 旧 DSH 插件壳，随适配层一起退役（清单未点名，按「有疑问就移」处理） | 否 |
| `components/`（65 个 `*.json` + `index.json` + `components.css` 与 4 个 `.bak`） | `archive/legacy-2026-11/components/` | 旧组件契约，被 Astryx 组件取代；组件明细改为 `npx @astryxdesign/cli component <Name> --json` | 否（旧 `metadata.json`/`library-consumption.json` 指向它，二者同时归档） |
| `patterns/`（`application-modes/` `recipes/` `shared/` `starting-points/` `industrial/` + 4 个示例 html） | `archive/legacy-2026-11/patterns/` | 旧 morph-icons / 交互模式 / 起始点模板，退役 | 否 |

### 1.2 外壳与运行时

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `portal/`（`index.html` `app.js` `app.css` `light-rays.js` `evidence/`） | `archive/legacy-2026-11/portal/` | 旧 portal 门户，退役 | 否 |
| `runtime/`（`manifest.json`） | `archive/legacy-2026-11/runtime/` | 旧运行时清单，退役 | 否 |

### 1.3 旧 token 体系

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `tokens/`（`tokens.json` 214 个 `--gary-*` + 生成的 `base.css`） | `archive/legacy-2026-11/tokens/` | 自造 CSS 变量体系全部退役；新体系是 Astryx token，Gary 品牌层只覆盖 accent / 字体 / 圆角，真源 `theme/gary.theme.mjs` | 否（清单未点名，按背景「自造 CSS 变量体系全部退役」处理） |
| `archive/tokens/`（上一轮已归档的三组 chroma/neutral/pageblack 备份） | 原地不动（`archive/tokens/`） | 已是归档区，不再动 | — |

### 1.4 旧渲染链路（`agent/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `agent/primitives.css`（+ `primitives.css.bak-20261026-color`） | `archive/legacy-2026-11/agent/primitives.css`（备份件同目录） | 旧材质原语：`.surface` `.btn` `.eyebrow` 等自造类 | 否 |
| `agent/interactions.mjs` | `archive/legacy-2026-11/agent/interactions.mjs` | 旧交互声明注入（theme/palette/gutters），新产物零 `<script>` 不需要 | 否 |
| `agent/recipes.json` | `archive/legacy-2026-11/agent/recipes.json` | 旧配方表（workbench/dashboard/report/settings），被 `agent/recipes/*.recipe.mjs` 取代 | 否 |
| `agent/content.json` | `archive/legacy-2026-11/agent/content.json` | 旧示例内容（10678 B） | 否 |
| `agent/content.json.poc` | `archive/legacy-2026-11/agent/content.json.poc` | 旧 POC 内容件 | 否 |
| `agent/content.json.bak` | `archive/legacy-2026-11/agent/content.json.bak` | 旧内容备份（未跟踪） | 否 |
| `agent/out/`（`dashboard/report/settings/workbench.html`） | `archive/legacy-2026-11/agent/out/` | 旧渲染产物；新产物在仓根 `out/` | 否 |
| `agent/_shot-workbench.png` | `archive/legacy-2026-11/agent/_shot-workbench.png` | 旧工作台截图（未跟踪） | 否 |

### 1.5 旧验收体系（`agent/checks/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `agent/checks/audit.cjs` | `archive/legacy-2026-11/agent/checks/audit.cjs` | 旧对比度/溢出/报错闸 | 是 —— `.github/workflows/agent-gates.yml` Gate 3 引用（见 §5） |
| `agent/checks/check-label-align.cjs` | `archive/legacy-2026-11/agent/checks/check-label-align.cjs` | 旧标签对齐闸（量 `.eyebrow` 左缘） | 是 —— CI Gate 1 |
| `agent/checks/verify-interactions.cjs` | `archive/legacy-2026-11/agent/checks/verify-interactions.cjs` | 旧交互复验闸 | 是 —— CI Gate 2 |
| `agent/checks/no-wrap.cjs` | `archive/legacy-2026-11/agent/checks/no-wrap.cjs` | 旧不折行闸 | 是 —— CI Gate 4 |
| `agent/checks/contrast.cjs` | `archive/legacy-2026-11/agent/checks/contrast.cjs` | 像素法对比度实验版（未接入闸门） | 否 |
| `agent/checks/invariants.py` | `archive/legacy-2026-11/agent/checks/invariants.py` | 十二条不变量闸（旧母本验收总闸） | 否（`AGENTS.md` 已重写，不再指向它） |
| `agent/checks/page_scan.py` | `archive/legacy-2026-11/agent/checks/page_scan.py` | 方角卡片 / 内部编码 / 结论重复扫描器 | 否 |
| `agent/checks/test_chroma_gate.py` | `archive/legacy-2026-11/agent/checks/test_chroma_gate.py` | chroma 闸的单测 | 否 |
| `agent/checks/serve.cjs` | `archive/legacy-2026-11/agent/checks/serve.cjs` | 旧闸门用的静态服务 | 否 |
| `agent/checks/baseline.json` | `archive/legacy-2026-11/agent/checks/baseline.json` | 旧闸门基线值 | 否 |

> 留在 `agent/checks/` 的新闸：`selfcheck.mjs`、`layout.mjs`、`shoot.mjs`。

### 1.6 旧工具链（`scripts/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `scripts/`（89 个跟踪文件：`*_qa.mjs` 26 个、`validate.py` `validate_v2.py` `preview.py` `gary_ui.py` `flow_svg.py` `serve_portal.py` `session_store.py` 等 + `fixtures/` `tests/`） | `archive/legacy-2026-11/scripts/` | 旧 QA 与生成器，全部绑旧组件体系 | 否（`gary-ui.cmd` 调用 `scripts/gary_ui.py`，后者同时归档） |
| `scripts/specimen.mjs` | **原地保留** `scripts/specimen.mjs` | R2 新建的 Astryx 组件标本生成器（`out/specimen/`），属新链路 | 是（新工具，不归档） |

### 1.7 旧规范与图示配方（`spec/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `spec/chart-recipes.json` | `archive/legacy-2026-11/spec/chart-recipes.json` | 图表配方，独立工作区「重建·图表与图示」会先复制走再重做 | 否 |
| `spec/diagram-recipes.json` | `archive/legacy-2026-11/spec/diagram-recipes.json` | 图示配方，同上 | 否 |
| `spec/flow-diagram.json` | `archive/legacy-2026-11/spec/flow-diagram.json` | 流程图配方真源，同上 | 否 |
| `spec/scene-recipes.json` | `archive/legacy-2026-11/spec/scene-recipes.json` | 场景配方，同上 | 否 |
| `spec/tints.json` | `archive/legacy-2026-11/spec/tints.json` | 旧色相 tint 表 | 否 |
| `spec/ARCHOS-ENTERPRISE-TOKENS.md` | `archive/legacy-2026-11/spec/ARCHOS-ENTERPRISE-TOKENS.md` | 企业面板 token 规范（旧自造 token 体系） | 否 |
| `spec/archos-enterprise.tokens.json` | `archive/legacy-2026-11/spec/archos-enterprise.tokens.json` | 同上，机器可读件 | 否 |
| `spec/archos-enterprise.html` | `archive/legacy-2026-11/spec/archos-enterprise.html` | 上述 token 的演示页（清单未点名，随 token 规范一起走） | 否 |
| `spec/system.json` | `archive/legacy-2026-11/spec/system.json` | 旧系统权威（组件数/模式/入口），已被 Astryx 底座取代（清单未点名，见 §4） | 是 —— 已归档的 `metadata.json` 与 `library-consumption.json` 指向它 |

### 1.8 文档（`docs/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `docs/CHART_COLOR.md` | `archive/legacy-2026-11/docs/CHART_COLOR.md` | 图表色彩规范（旧 token 色板） | 否 |
| `docs/CHART_EXPRESSION.md` | `archive/legacy-2026-11/docs/CHART_EXPRESSION.md` | 图表 17 类选型（旧图表体系） | 否 |
| `docs/DIAGRAM_EXPRESSION.md` | `archive/legacy-2026-11/docs/DIAGRAM_EXPRESSION.md` | 图示语法（旧 visual manifest 链路） | 否 |
| `docs/FLOW_DIAGRAM.md` | `archive/legacy-2026-11/docs/FLOW_DIAGRAM.md` | Gary-UI 流程图规范（真源 `spec/flow-diagram.json` 同时归档） | 否 |
| `docs/HANDOFF-flow-diagram.md` | `archive/legacy-2026-11/docs/HANDOFF-flow-diagram.md` | 流程图交接记录 | 否 |
| `docs/VISUAL_EXPRESSION.md` | `archive/legacy-2026-11/docs/VISUAL_EXPRESSION.md` | 材质与光影（玻璃 opt-in 那一套） | 否 |
| `docs/INTERACTION_RECIPES.md` | `archive/legacy-2026-11/docs/INTERACTION_RECIPES.md` | 旧交互配方（palette/gutters/theme 注入） | 否 |
| `docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md` | `archive/legacy-2026-11/docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md` | 旧 agent 协作白皮书（proposal/approval/task 协议） | 否 |
| `docs/LOCAL_WORKFLOW.md` | `archive/legacy-2026-11/docs/LOCAL_WORKFLOW.md` | 旧本地工作流（preview.py / serve_portal.py） | 否 |
| `docs/PUBLIC_RELEASE.md` | `archive/legacy-2026-11/docs/PUBLIC_RELEASE.md` | 旧公开版验收流程 | 否 |
| `docs/PUBLISHING.md` | `archive/legacy-2026-11/docs/PUBLISHING.md` | 旧发布流程（shadcn registry） | 否 |
| `docs/ROADMAP.md` | `archive/legacy-2026-11/docs/ROADMAP.md` | 旧路线图（按旧 65 组件排期） | 否 |
| `docs/GARY_UI_ACCEPTANCE_2026-09-07.md` | `archive/legacy-2026-11/docs/GARY_UI_ACCEPTANCE_2026-09-07.md` | 旧验收报告 | 否 |
| `docs/GARY_UI_INDEPENDENT_ACCEPTANCE_2026-09-08.md` | `archive/legacy-2026-11/docs/GARY_UI_INDEPENDENT_ACCEPTANCE_2026-09-08.md` | 旧独立验收报告 | 否 |
| `docs/automation/` | `archive/legacy-2026-11/docs/automation/` | 旧自动化脚本说明 | 否 |
| `docs/images/` | `archive/legacy-2026-11/docs/images/` | 旧文档配图 | 否 |

### 1.9 示例（`examples/`）

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `examples/co-design/` | `archive/legacy-2026-11/examples/co-design/` | 旧协同设计示例 | 否 |
| `examples/demo0909/` | `archive/legacy-2026-11/examples/demo0909/` | 旧 0909 图表规范演示 | 否 |
| `examples/demos/` | `archive/legacy-2026-11/examples/demos/` | 旧六场景 Demo 首页（`index.html` 曾重定向到这里） | 否 |
| `examples/design-canon/` | `archive/legacy-2026-11/examples/design-canon/` | 旧设计准则示例 | 否 |
| `examples/flow/` | `archive/legacy-2026-11/examples/flow/` | 旧流程图示例 | 否 |
| `examples/interaction-lab/` | `archive/legacy-2026-11/examples/interaction-lab/` | 旧交互实验台 | 否 |
| `examples/morph-icons/` | `archive/legacy-2026-11/examples/morph-icons/` | 旧 morph 图标示例 | 否 |
| `examples/showcase/` | `archive/legacy-2026-11/examples/showcase/` | 旧组件橱窗 | 否 |
| `examples/typography-demo/` | `archive/legacy-2026-11/examples/typography-demo/` | 旧字体示例 | 否 |
| `examples/visual-lab/` | `archive/legacy-2026-11/examples/visual-lab/` | 旧视觉实验台 | 否 |
| `examples/visuals/` | `archive/legacy-2026-11/examples/visuals/` | 旧图表产物（含 `outputs/`） | 否 |
| `examples/decision-brief.html` | `archive/legacy-2026-11/examples/decision-brief.html` | 旧决策简报页 | 否 |
| `examples/tonal-default.html` | `archive/legacy-2026-11/examples/tonal-default.html` | 旧 tonal 默认示例页（青澜府周度去化） | 否 |
| `examples/demo-report.content.json` | **原地保留** | R4 新链路示例内容（`agent/render.mjs` 直接吃） | 是（验收命令与 `content.schema.md` 都引用） |
| `examples/demo-table.content.json` | **原地保留** | 同上 | 是 |

### 1.10 会话 / 溯源 / 决策 / 素材 / 许可 / 契约

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `session/`（`index.html` `app.js` `app.css` + 备份 `preview-bridge.js`） | `archive/legacy-2026-11/session/` | 旧会话工作台 UI，绑旧原语与 session_store.py | 否 |
| `provenance/`（`SOURCES.md` `source-manifest.json` `coverage.json` 8 个 `*-sync.json` + `react-bits/`） | `archive/legacy-2026-11/provenance/` | 旧视觉来源溯源（gradient-waves / silver-waves 等旧材质） | 否 |
| `decisions/review-latest.json` | `archive/legacy-2026-11/decisions/review-latest.json` | 旧评审决策记录 | 否 |
| `assets/`（`backgrounds/` `brand/` `fonts/` `scenes/` `textures/`） | `archive/legacy-2026-11/assets/` | 旧材质素材（玻璃/波光/场景底），新体系不用位图材质 | 否 |
| `licenses/`（`third-party/` 351 份 + `react-bits-LICENSE.md`） | `archive/legacy-2026-11/licenses/` | 旧依赖的第三方许可包（react-bits 等已退役） | 否 |
| `contracts/`（11 个 schema：`invocation` `session` `task` `proposal` `approval` `feedback` `evidence` `final-ui-report` `build-report` `command-result` `visual-manifest`） | `archive/legacy-2026-11/contracts/` | 旧 agent 协议 JSON Schema：`invocation.schema.json` 里写死 `patterns/starting-points/**`、`gary-glass` 材质名；随旧系统一起退役（清单未点名，见 §4） | 是 —— 已归档的 `library-consumption.json` readOrder 指向 `contracts/invocation.schema.json` |

### 1.11 仓根旧入口与旧文档

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `DESIGN.md` | `archive/legacy-2026-11/DESIGN.md` | 旧设计约束（§7 版式红线、`.gary-*` 圆角与左条规则），全部针对自造组件 | 否（`AGENTS.md` 已重写） |
| `SKILL.md` | `archive/legacy-2026-11/SKILL.md` | 旧 UI 工作流 skill（三栏骨架/配方调用） | 否 |
| `CHANGELOG.md` | `archive/legacy-2026-11/CHANGELOG.md` | 旧系统变更史（数值真源已改为 `theme/gary.theme.mjs`） | 否 |
| `CONTRIBUTING.md` | `archive/legacy-2026-11/CONTRIBUTING.md` | 旧贡献流程（`npm run typecheck/build/audit` 四关） | 否 |
| `PROJECT_STRUCTURE.md` | `archive/legacy-2026-11/PROJECT_STRUCTURE.md` | 旧目录结构说明（含已归档的 15 个目录） | 否 |
| `metadata.json` | `archive/legacy-2026-11/metadata.json` | 旧系统元数据：`componentAuthority: components/index.json`、`tokenAuthority: tokens/tokens.json`、`version 2.0.0` | 否（被 `package.json` + `theme/` 取代） |
| `library-consumption.json` | `archive/legacy-2026-11/library-consumption.json` | 旧消费方读取顺序（`SKILL.md` → `spec/system.json` → `contracts/`） | 否 |
| `demo0909.html` | `archive/legacy-2026-11/demo0909.html` | 旧图表规范演示单页 | 否 |
| `index.html` | `archive/legacy-2026-11/index.html` | 旧入口页，`meta refresh` 重定向到 `examples/demos/`（已归档） | 否 |
| `gary-ui.cmd` | `archive/legacy-2026-11/gary-ui.cmd` | 旧 Windows 包装，调用 `scripts/gary_ui.py`（已归档） | 否 |
| `THIRD_PARTY_NOTICES.md` | `archive/legacy-2026-11/THIRD_PARTY_NOTICES.md` | 旧依赖的第三方署名汇总，与 `licenses/` 成对 | 否（新依赖（React / Astryx / Playwright）尚未出新的 notices，见 §5） |

### 1.12 `.agent/`

| 原路径 | 去向 | 原因 | 是否仍被引用 |
|---|---|---|---|
| `.agent/maintainer.md` | `archive/legacy-2026-11/maintainer.md` | 旧维护者指南：指向 `patterns/shared/icons-entry.mjs`、`docs/PUBLIC_RELEASE.md`、`card_material_qa.mjs` 等已归档文件 | 否（新 `AGENTS.md` 不再指向它） |

## 2. 归档区布局

```
archive/legacy-2026-11/
├── adapters/          react-shadcn · visual · dsh      （63992 个文件，含旧 node_modules）
├── agent/             primitives.css(+bak) · interactions.mjs · recipes.json · content.json(+bak/poc) · _shot-workbench.png · out/ · checks/(10 个旧闸)
├── assets/            backgrounds · brand · fonts · scenes · textures
├── components/        65 个 *.json + index.json + components.css(+bak)
├── contracts/         11 个 schema
├── decisions/         review-latest.json
├── docs/              15 篇 md + automation/ + images/
├── examples/          11 个旧示例目录 + decision-brief.html + tonal-default.html
├── licenses/          third-party/ + react-bits-LICENSE.md
├── patterns/          application-modes · industrial · recipes · shared · starting-points + 4 个 html
├── portal/            index.html · app.js · app.css · light-rays.js · evidence/
├── provenance/        来源溯源 json + SOURCES.md + react-bits/
├── runtime/           manifest.json
├── scripts/           旧 QA/生成器（不含 specimen.mjs）
├── session/           会话工作台 UI
├── spec/              9 个配方/规范/演示件
├── tokens/            tokens.json + base.css
├── DESIGN.md · SKILL.md · CHANGELOG.md · CONTRIBUTING.md · PROJECT_STRUCTURE.md
├── metadata.json · library-consumption.json · demo0909.html · index.html
├── gary-ui.cmd · THIRD_PARTY_NOTICES.md · maintainer.md
```

## 3. 原地保留（21 项）

| 路径 | 为什么留 |
|---|---|
| `agent/render.mjs` | 新链路渲染器 |
| `agent/recipes/` | `report.recipe.mjs` · `table.recipe.mjs` · `sections.mjs` |
| `agent/checks/selfcheck.mjs` `layout.mjs` `shoot.mjs` | 新验收闸（搬 `agent/checks/` 时被一并带走，已原样取回，见 §6 注） |
| `agent/content.schema.md` | content.json 契约（v1） |
| `theme/gary.theme.mjs` | 品牌层 token 真源 |
| `examples/demo-report.content.json` `demo-table.content.json` | 新链路示例内容（搬 `examples/` 时一并带走，已取回） |
| `out/` | 新链路产物（两页 + specimen + 选型稿） |
| `scripts/specimen.mjs` | 新组件标本生成器（搬 `scripts/` 时一并带走，已取回） |
| `package.json` `package-lock.json` `node_modules/` | 依赖与脚本入口 |
| `LICENSE` | 仓库许可（沿用） |
| `.nojekyll` | GitHub Pages 开关 |
| `.gitignore` | 未改（仍含旧 `adapters/*` 忽略规则，见 §5） |
| `.git/` | 版本库 |
| `.github/` | PR/Issue 模板与 CI workflow（见 §5） |
| `archive/tokens/` | 上一轮归档区 |
| `viz/` | **另一个工作区（重建·图表与图示）在仓根建的目录**：`_src` 里是图表/图示/流程图三套规范与配方的副本，`palette.mjs` / `spec.mjs` 是其新产物。与本轮拆旧无关，不动不搬（副本与归档件 md5 一致，见 §6） |

## 4. 判断项（可能有争议，逐条给理由）

1. **`spec/system.json` 归档**（清单只点了 `chart-recipes` / `diagram-recipes` / `flow-diagram` / `scene-recipes` / `tints` / `archos-enterprise.*`）。
   理由：它自称「系统权威」，内容是旧系统的组件数、模式、入口清单（`componentAuthority` 指向已归档的 `components/index.json`）。留在仓根会让 agent 读到一个与 Astryx 底座冲突的权威源。风险：若 `spec/` 是被独立工作区按路径直接引用的，需要同步改指向 `archive/legacy-2026-11/spec/`。
2. **`tokens/` 归档**（清单未点名）。
   理由：背景明确「自造 CSS 变量体系全部退役」，`tokens/tokens.json` 的 214 个 `--gary-*` 与 Astryx token 并存会形成两套真源，而 `AGENTS.md` 旧版正是拿它当「token 值」入口。新真源只有 `theme/gary.theme.mjs`。
3. **`contracts/` 归档**（清单未点名）。
   理由：11 个 schema 属旧 agent 协议，`invocation.schema.json` 里直接枚举 `patterns/starting-points/*.html`、`gary-glass` 材质名，搬走 `patterns/` 后就已是悬空引用。保留一份在仓根会让外部 agent 按旧 schema 发包。
4. **`.agent/maintainer.md` 归档**（清单未点名）。
   理由：全篇指针指向已归档文件（`patterns/shared/icons-entry.mjs`、`docs/PUBLIC_RELEASE.md`、`card_material_qa.mjs`），留下即死链。按任务书要求 `.agent/` 未列入保留清单，故并入归档并置顶一层 `maintainer.md`。
5. **仓根 11 个旧入口/旧文档归档**（清单只列了 `AGENTS.md` `README.md` 与 `docs/`）。
   理由：`index.html` 重定向到已归档的 `examples/demos/`、`gary-ui.cmd` 调用已归档的 `scripts/gary_ui.py`、`metadata.json` 声明 `componentAuthority: components/index.json`——都是搬完即坏的指针；`DESIGN.md` / `SKILL.md` / `CONTRIBUTING.md` 描述的是已退役的 65 组件与 shadcn 四关。留一整套旧规范在根目录，比没有规范更糟。
   **例外保留**：`LICENSE`（许可必须留在根）、`.nojekyll`（Pages 需要）。
6. **`THIRD_PARTY_NOTICES.md` + `licenses/` 一起归档**。
   理由：它俩是同一份第三方署名（react-bits、旧 shadcn 依赖等），拆开存放没有意义。**代价**：新依赖（React 19 / Astryx / Playwright / StyleX）的署名汇总缺位，标为待办（§5），不在本轮写区内。
7. **`examples/tonal-default.html` 归档**。
   理由：它是旧 token 体系下的一页完整示例（青澜府周度去化监测），保留清单只放行 `examples/demo-*.content.json`。若后续要拿它当内容样本，内容层 JSON 可再从 archive 里取。
8. **`adapters/dsh/` 一并归档**。
   理由：`adapters/` 必须整体从仓根消失（硬性验收 4），且 DSH 适配器同样面向旧 shadcn 组件。

## 5. 未处理 / 下一轮

| 项 | 现状 | 为什么本轮不做 |
|---|---|---|
| `.github/workflows/agent-gates.yml` | 仍引用 `adapters/visual`（安装依赖）与 4 个旧闸（Gate 1–4），搬完后必红 | 属共享系统（CI 行为），任务书未授权改；且本轮 `不 commit 不 push`，不会触发。下一轮改写为 `render` + `selfcheck` + `layout` 三步 |
| `.github/ISSUE_TEMPLATE/*` · `pull_request_template.md` | 文案仍按旧组件/旧四关写的 | 同上，非写区 |
| `.gitignore` | 仍含 `adapters/**`、`portal/evidence/**`、`examples/**/outputs/**` 等失效规则 | 文件已是 `M` 状态（上一轮在途改动），本轮不动，避免覆盖他人在途内容 |
| `THIRD_PARTY_NOTICES`（新） | 缺位 | 需按新依赖清单重出，非本轮写区 |
| 文档重写（图表 / 图示 / 材质） | 全部随 `docs/` 归档 | 由独立工作区「重建·图表与图示」承接 |
| `agent/content.schema.md` §4 的「待实现」状态 | 实际 `SECTIONS` 表 11 个 type 键、10 个 block 类型全部有渲染实现（已实测，见 §6），schema 文本滞后 | 该文件不在本轮写区，已在 `agent/CONTRACT.md` §3 按真实代码校正 |
| `.pytest_cache/` | 旧 pytest 残留（被忽略） | 非搬移对象，未跟踪 |
| 归档区里 74 个「未跟踪」文件 | 旧验收截图（`examples/demos/evidence/**/*.png`）、`adapters/visual/browsers.json`、`runtime/` 构建物等，原本被 `.gitignore` 忽略；换到 `archive/` 后旧规则不再匹配，于是显示为 `??` | 它们本就是生成物/证据图，**不加入索引**，只随目录保留在磁盘上 |
| `archive/…/react-shadcn/dist`（249 个文件） | `dist/` 目录名命中 `.gitignore` 的 `dist/` 规则，`git mv` 无法直接搬，改用 `git add -f` 重新纳入索引以保持 rename 连续 | 若后续不想在库里存构建产物，下一轮可整体从索引移除并补 ignore 规则 |

## 6. 实测结果（2026-11-16，本机 Windows / pwsh 7.6.4）

```powershell
cd C:\AI\UI\gary-ui
git status --short
```

| 指标 | 实测 |
|---|---|
| `git status --short` 总行数 | 1409（移动前 13） |
| `R`（rename，历史未断） | **1330** |
| `D`（删除） | **0** |
| `??`（未跟踪，见 §5） | 74 |
| `M`（修改） | 5（`.gitignore` 在途改动 + 本轮重写的 3 份文档 + `agent/CONTRACT.md`） |

```powershell
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html
node agent/checks/selfcheck.mjs out/demo-report.html
node agent/checks/layout.mjs out/demo-report.html out/demo-table.html
```

```
WROTE C:\AI\UI\gary-ui\out\demo-report.html bytes=367637 recipe=report blocks=7 components=181

inline style bytes: 331468 · astryx semantic classes: 100
PASS 无 <script> / 无外链 / data-astryx-theme="gary" / 内联 style > 100000 B / ≥3 astryx 语义类
ALL PASS

===== out/demo-report.html =====  6 条全 PASS（卡片内距 20/24/28、圆角 14/20、不出血、不溢出）
===== out/demo-table.html  =====  6 条全 PASS（控件对齐 Δ0/Δ0）
LAYOUT ALL PASS
```

额外证据：

1. **十类 block 全跑通**：一份含 `cover/heading/text/metric/badge/callout/card/table/divider/prose` 的 content.json 渲染成功（`bytes=351048 blocks=10 components=95`），两闸 ALL PASS ——「10 个 block 类型全部有渲染实现」是实测结论，不是看代码猜的。
2. **README 示例可复现**：README 里那段 12 行示例原样落盘渲染，`bytes=343013 components=60`，两闸 ALL PASS。
3. **`viz/_src` 副本早于本次搬移且一致**：6 个文件 `CreationTime 17:17:20`（早于搬移），md5 与归档件逐一相同（`CHART_EXPRESSION.md` `45E2E4D4`、`chart-recipes.json` `79C7C120`、`DIAGRAM_EXPRESSION.md` `ED276583`、`diagram-recipes.json` `BB5FCBEB`、`FLOW_DIAGRAM.md` `45E95A87`、`flow-diagram.json` `79E8409F`）—— 证明「先复制走再重做」这一步确实发生，未被我拆旧打断。
4. **搬 `agent/checks/` 与 `examples/` 时误伤已修复**：`git mv` 是整目录搬，会把未跟踪的新文件一起带走。已把 `selfcheck.mjs` / `layout.mjs` / `shoot.mjs` 与两份 `demo-*.content.json`、`scripts/specimen.mjs` 原样取回，并重跑上述三条命令确认新链路完好。

回滚（未提交前）：`git restore --staged . ; git checkout -- .`；已提交后：`git revert <commit>` 或按 §1 表逐行 `git mv` 反向搬回。
