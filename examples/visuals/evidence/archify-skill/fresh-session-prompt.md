这是一次全新会话的 Archify Skill 前向验收。请从已安装技能中发现并完整读取 `archify` Skill，再执行任务；不要重跑 Gary-UI 已有样例，不要安装或更新依赖，不要访问公共 CDN，也不要修改指定目录之外的文件。

自然语言需求：为“华东服务交付计划”制作一张新的工作流图。主路径为客户需求登记、区域负责人确认、证据检查、发布管理层报告、归档同版本产物；证据检查失败时进入合规阻断，修正后回到证据检查；发布失败时必须保留上一有效版本并记录失败候选。图中明确上海样板、江苏口径与浙江培训材料三个责任泳道，使用中文标签，静态为默认且支持交互查看。

请将原生 JSON、交互 HTML、独立 SVG 和 PNG 写入 `C:\AI\UI\gary-ui\examples\visuals\fresh-session-delivery\`，文件基名统一为 `east-china-delivery-workflow`。使用官方 Skill 规定的 showcase 校验与 deliver 流程；SVG、PNG 从最终 HTML 导出。最后回报实际读取的 Skill 路径、Archify 版本、校验摘要和四个绝对路径。不得提交、推送或发布。
