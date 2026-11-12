# Gary-UI

> **Agent 自主驱动的 UI 系统：默认 Tonal Surface，液态玻璃为 opt-in 材质。**

设计系统真源在 token，React/shadcn 是执行层，60 个组件自动消费 Gary token。

## 你是谁？

| 角色 | 做什么 | 先读 |
|---|---|---|
| **消费方**（用 Gary-UI 做页面） | import 组件到自己的项目 | [react-shadcn/README.md](adapters/react-shadcn/README.md) |
| **贡献方**（改 Gary-UI 本身） | 改组件/token/规范 | 下面所有文件 |

## 消费方快速开始

```bash
# 方式 1：shadcn CLI 拉组件
npx shadcn@latest add https://raw.githubusercontent.com/KODxixi/Gary-UI/main/adapters/react-shadcn/registry.json --override

# 方式 2：clone 仓库后 link（npm publish 前的临时方案）
git clone https://github.com/KODxixi/Gary-UI.git
cd Gary-UI/adapters/react-shadcn && npm install && npm run build
# 在你的项目里 npm link ../../Gary-UI/adapters/react-shadcn
```

然后：
```tsx
import "@gary-ui/react-shadcn/styles.css"
import { Button, Card, Dialog, DialogContent } from "@gary-ui/react-shadcn"
import { useSpringStyle } from "@gary-ui/react-shadcn"
```

## 外部 Agent 快速路由

| 你要做什么 | 先读 | 然后 |
|---|---|---|
| **做页面（首选）** | [agent/CONTRACT.md](agent/CONTRACT.md) | 选配方 → 填 `agent/content.json` → `node agent/render.mjs` |
| **选组件** | [COMPONENTS.md](adapters/react-shadcn/COMPONENTS.md) | 决策树 → 相似对比 → 组件速查 |
| **写 React 组件** | [react-shadcn/README.md](adapters/react-shadcn/README.md) | Quick Start + Dialog Spring 示例 |
| **查设计规范** | `components/<slug>.json` | variant / size / state / interaction / a11y |
| **查 token 值** | [tokens/tokens.json](tokens/tokens.json) | 214 个 `--gary-*` 变量（`tokens/base.css` 生成物里 216 个唯一名，多出的是轴内覆盖） |
| **改 token** | `tokens/tokens.json` | 改完跑 `npm run tokens:generate` |
| **做页面 Demo** | [README.md](README.md) | 六场景 Demo + 五分钟开始 |
| **做图表** | [CHART_EXPRESSION.md](docs/CHART_EXPRESSION.md) | 17 类选型 + 7 种标注 |
| **做图示（架构 / 流程 / 时序 / 状态）** | [DIAGRAM_EXPRESSION.md](docs/DIAGRAM_EXPRESSION.md) · **过程图另看 [FLOW_DIAGRAM.md](docs/FLOW_DIAGRAM.md)** | 七层阅读 + 边界命题 → visual manifest；过程图走四色描边 + 正交折线 |
| **做 Gary-UI 流程图** | [FLOW_DIAGRAM.md](docs/FLOW_DIAGRAM.md) · 真源 [flow-diagram.json](spec/flow-diagram.json) | **触发语「Gary-UI流程图」**；报告页用 `scripts/flow_svg.py --report`；闸 `scripts/check_flow_diagram.py` |
| **交付前自检（必做）** | 在 `C:\AI\UI\gary-ui` 下跑 `python -B agent/checks/invariants.py` | 十二条不变量 + 两个验收器；母本之外的交付页用绝对路径加 `--page <文件>`（方角卡片 / 内部编码 / 结论重复） |
| **查版式红线（方角卡片、外壳分隔线、三栏、字号）** | [DESIGN.md](DESIGN.md) §7 | 卡片必须有圆角 ≥8px；贴边块与表格不算卡片；宁可不要底；禁止带色相的 2px 左条 |
| **改 DSH / ArchOS 外壳** | `C:\\GarchOS\\ArchOS\\AGENTS.md`「外壳规则」 | 侧栏与工作区不加分隔线，坑在 0.5px `--dsw-alias-border-l3` |
| **看组件长什么样** | Storybook | `cd adapters/react-shadcn && npm run storybook` |

## 关键指针

- **组件选择指南**：[adapters/react-shadcn/COMPONENTS.md](adapters/react-shadcn/COMPONENTS.md)
- **组件源码**：`adapters/react-shadcn/src/components/ui/*.tsx`（60 个）
- **Spring hook**：`useSpring` · `useGestureValue` · `useSpringStyle`（从 `@gary-ui/react-shadcn` 导出）
- **Token CSS 桥接**：`adapters/react-shadcn/src/styles/gary-ui.css`
- **组件契约**：`components/*.json`（64 个，另有 `index.json` 索引）
- **Token 源**：`tokens/tokens.json`（214 个 `--gary-*` 变量；`base.css` 生成物 216 个唯一名）
- **设计约束**：[DESIGN.md](DESIGN.md)
- **UI 工作流**：[SKILL.md](SKILL.md)
- **Agent 协作契约**：[调用白皮书](docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md)
- **材质与光影**：[VISUAL_EXPRESSION.md](docs/VISUAL_EXPRESSION.md)
- **图表色彩**：[CHART_COLOR.md](docs/CHART_COLOR.md)
- **图示语法**：[DIAGRAM_EXPRESSION.md](docs/DIAGRAM_EXPRESSION.md) · 真源 [diagram-recipes.json](spec/diagram-recipes.json)
- **Gary-UI流程图规范**（触发语：`Gary-UI流程图`）：[FLOW_DIAGRAM.md](docs/FLOW_DIAGRAM.md) · 真源 [flow-diagram.json](spec/flow-diagram.json) · 闸 `scripts/check_flow_diagram.py` · 生成器 `scripts/flow_svg.py`（报告页 `--report`）
- **系统及场景权威**：[spec/system.json](spec/system.json) · [spec/scene-recipes.json](spec/scene-recipes.json)
- **企业面板 token（ArchOS / GarchOS）**：[spec/ARCHOS-ENTERPRISE-TOKENS.md](spec/ARCHOS-ENTERPRISE-TOKENS.md) · 机器可读 [spec/archos-enterprise.tokens.json](spec/archos-enterprise.tokens.json)

## 常见任务命令

- **跑 demo**：`python scripts/preview.py --port 4173`
- **验证完整性**：`python scripts/validate.py`（输出组件数、模式数 JSON）
- **生成视觉图**：visual adapter 入口 `node adapters/visual/runtime/runner.cjs`，产物在 `examples/**/outputs/`
- **Python QA 脚本**：`scripts/*_qa.mjs`，按文件名猜功能（card_material_qa、portal_acceptance_qa 等）
- **新组件起步**：从 `adapters/react-shadcn/src/components/ui/` 复制现有组件改，登记 `components/index.json`

## 硬规则

1. **浮层入场用 `useSpringStyle`**，不用 CSS transition。Spring 层级表见 [COMPONENTS.md](adapters/react-shadcn/COMPONENTS.md)。
2. **改 token 先改 `tokens/tokens.json`**，再跑 `npm run tokens:generate`，不直接改 CSS。
3. **工具操作默认 44px 圆形图标，走 morph-icons 机制**（`patterns/shared/morph-icons.js`，React 组件层图标来源 reicon-react，vanilla 静态层与 morph 仍取 Lucide 几何 + morphicons morph 引擎）；导航和筛选保留文字。
4. **新组件必须登记 `components/index.json`**。
5. **`examples/**/outputs/` 是生成产物**，不要直接改。

## 交付前验证（贡献方）

```bash
cd adapters/react-shadcn
npm run typecheck      # tsc --noEmit
npm run build          # tsc -p tsconfig.build.json
npm run audit:ui       # 伪元素/token 映射/契约一致性
npm run audit:contrast # 对比度审计
```

四关全过才算完成。缺任何一项标注"未验证"。

## 维护者

Demo 维护、图表规则、材质细节、公开仓库发布流程见 [.agent/maintainer.md](.agent/maintainer.md)。外部 Agent 不需要读这里。

## 公开仓库

`KODxixi/Gary-UI` · MIT 许可 · 预览 `python scripts/preview.py --port 4173`

## 不要去哪找（已知错误位置）

- ❌ 不要找 Gary-UI 的分叉副本：唯一真相位置是 `C:\AI\UI\gary-ui`；`C:\Users\shiguanyu\Architect\06_ID\skills\gary-ui`、
  `C:\AI\prototypes\gary-ui-sessions`、`C:\GarchOS\var\release-*` 下的同名目录都已删除或被母本取代。
- ❌ 不要改 `*.bundle.css` 与 `examples/**/outputs/`：生成物，改源文件重跑生成。
- ❌ 不要从 `CHANGELOG.md` 抄数值：数值真源是 `tokens/tokens.json` 与 `spec/*.json`，CHANGELOG 只记发生了什么。
- ❌ 不要用 `scripts/validate.py` 当验收闸：它只打印、不看退出码；闸门是 `agent/checks/invariants.py`。
