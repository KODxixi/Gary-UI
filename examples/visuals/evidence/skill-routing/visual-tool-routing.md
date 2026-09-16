| # | Gary purpose | 需求 | 唯一默认工具 | 原生源格式 | 禁用边界 | 实际调用的 Skill |
|---:|---|---|---|---|---|---|
| 1 | `quantitative` | 12 个月门店客流趋势与区域对比 | Apache ECharts | JSON：`data + option` | 禁止用装饰形状或思维导图替代定量刻度；必须保留单位、坐标轴、缺失值、来源和数据表替代。 | `gary-liquidglass-ui` |
| 2 | `outline` | 已有 Markdown 中文研究提纲，需要可折叠知识图 | Markmap | Markdown | 禁止用思维导图承载复杂关系；仅用于大纲、研究结构和知识层级。 | `gary-liquidglass-ui` |
| 3 | `simple-flow` | 已有 Mermaid 源的三节点简单审批流程 | Mermaid | `.mmd` / Mermaid / Markdown | 禁止用于需要交互或复杂关系校验的流程；复杂化后必须转 Archify。 | `gary-liquidglass-ui` |
| 4 | `icons` | 页面工具栏的搜索、下载、关闭图标 | Lucide | JSON icon list | 禁止超出界面操作和通用节点图标范围；每枚图标必须有可访问名称。 | `gary-liquidglass-ui` |
| 5 | `workflow` | 包含退款异常分支、参与系统和消息关系的订单工作流 | Archify | JSON，`diagram_type: "workflow"`、新建流程使用 `schema_version: 2` | 禁止用 Mermaid 简化替代；异常分支、系统泳道和消息关系必须显式建模。 | `gary-liquidglass-ui` → `archify` |
| 核验 | — | 完整读取的 Gary-UI Skill | — | `C:\Users\shiguanyu\.agents\skills\gary-liquidglass-ui\SKILL.md` | — | `gary-liquidglass-ui` |
| 核验 | — | 按复杂关系规则完整读取的受管 Skill | — | `C:\AI\skills\archify\SKILL.md` | — | `archify` |
| 依据 | — | 实际读取的制图能力清单 | — | `C:\AI\UI\gary-ui\adapters\visual\capabilities.json` | 路由以该清单为准，不以依赖或样例存在为依据。 | — |

