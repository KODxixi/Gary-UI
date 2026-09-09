# Gary-UI 项目入口

本文件适用于当前 Gary-UI 仓库；所有相对路径以包含本文件的目录为准。维护者的母本位于 `C:\AI\UI\gary-ui`，仅在该环境内继续遵循上层工作约定。其他克隆不要求具备此路径。

## 按任务读取

- 快速启动、场景 Demo、交付状态：[README.md](README.md)。
- UI 工作流：[SKILL.md](SKILL.md)；设计约束：[DESIGN.md](DESIGN.md)。
- 分析图表与表格：先读 [CHART_EXPRESSION.md](docs/CHART_EXPRESSION.md)及[机器规则](spec/chart-recipes.json)，执行 17 类选型和 7 种标注语法；[demo0909](demo0909.html)是跨领域输入验证页。五种[共享 SVG 配方](patterns/shared/chart-recipes.js)只作数据驱动参考实现，其余走既有工具，不能宣称所有类型／标注已自动实现。数据、尺度、判断和来源须一起迁移；固定行业字段与编号不是通用模板。
- 材质与光影：[VISUAL_EXPRESSION.md](docs/VISUAL_EXPRESSION.md)；实体底纹、磨砂玻璃、超白/全透玻璃按内容选择 `data-gary-surface="solid|frosted|optical"`，不重新当作待选候选。鼠标联动光影默认关闭，只在 Background 显式开启后响应。
- 图表色彩：[CHART_COLOR.md](docs/CHART_COLOR.md)；角色与主题值读取 `spec/chart-recipes.json` 的 `colorSystem`、`themes`，不在各个示例另立色彩权威。
- 系统及场景权威：[spec/system.json](spec/system.json)、[spec/scene-recipes.json](spec/scene-recipes.json)。
- 样式权威：[tokens/tokens.json](tokens/tokens.json)、[tokens/base.css](tokens/base.css)、[components/components.css](components/components.css)。
- Agent 协作契约：[调用白皮书](docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md)；不要为确定性维护自动启动 Session。
- 制图：[adapters/visual/README.md](adapters/visual/README.md)；官方专项 Skill 入口见 [Archify](adapters/visual/ARCHIFY_SKILL.md) 和 [AntV](adapters/visual/ANTV_SKILLS.md)。
- Runtime 范围：[runtime/manifest.json](runtime/manifest.json)；这是可选的维护者投影配置。普通克隆修改自己的源码 checkout；只有启用了受管投影的环境才执行其既有同步流程。

## Demo 维护入口

- 完整 Demo 为视觉验收基线，覆盖 Portal、组件、模板及制图目录；工具操作默认 44px 圆形 Lucide 图标，导航/筛选保留文字。默认背景只要一套点网格，禁止默认叠加线网和卡片等高线；显式实体底纹与章节嵌套结构按 [材质规范](docs/VISUAL_EXPRESSION.md#实体底纹与章节子卡) 调用。实现入口：[共享图标](patterns/shared/icons-entry.mjs)、[点阵](patterns/shared/dot-grid.js)、[卡片材质](patterns/shared/material.js)。
- 公开版检查与证据入口：[公开版验收](docs/PUBLIC_RELEASE.md)。按该记录验证当前公开包的页面、导航、主题传递与复制产物；旧维护者历史不能替代本次复验。
- 更广的本机回归入口为 `scripts/card_material_qa.mjs`、`scripts/portal_acceptance_qa.mjs`、`scripts/starter_generated_qa.mjs`。按其依赖配置浏览器，测试真实展开菜单及独立加载复制出的 HTML；维护者运行 Python 投影测试前，先等待浏览器证据写入结束。

- 六场景首页：[examples/demos/index.html](examples/demos/index.html)；共享逻辑：[examples/demos/shared/demo.js](examples/demos/shared/demo.js)。
- 数值更新与媒体轮播：[交互配方](docs/INTERACTION_RECIPES.md)、[细节实验室](examples/interaction-lab/index.html)；验证用 `scripts/interaction_lab_qa.mjs`。媒体倾斜与分段标题仍待用户判断，不自动推广为默认。
- Background 是首页顶部的一行文字入口；首页不要重新生成右下角浮动按钮。面板复用 [background-lab.js](patterns/shared/background-lab.js) 与 [background-lab.css](patterns/shared/background-lab.css)。
- Background 与其他局部修改以当前完整 Demo 为基线，避免重新套用旧样例。公开验收单保留未关闭问题；修复后追加当前版本的复验记录。
- Demo 数据为人工固定示例，数据源为 [project-data.js](examples/demos/data/project-data.js)，不能表述成真实业务结果。

本文件只维护项目入口与 Demo 特定约定；通用治理、模型偏好和系统路径遵循当前用户的 Agent 环境。维护者在自己的 `C:\AI` 环境中继续遵循其上层权威文档，其他克隆不继承该本机配置。

Portal 与完整 Demo 的顶栏入口保持一致：纯文字 `Background` 只打开共享背景功能卡；旁边的圆形深浅按钮独立切换主题。不要把二者合并进“显示设置”，也不要把 Background 改成图标按钮。Portal 的视口、材质和背景动态覆盖设置位于“基础 → 材质”。

## 公开仓库维护

- 公开仓库为 `KODxixi/Gary-UI`，完整 Demo 是 README 与在线站点的共同入口；普通预览用 `python scripts/preview.py --port 4173`。
- 原创代码采用 MIT，第三方保留各自条款。公开材质使用 `optical-glass.js` 与 `ambient-waves.js`；受再分发限制的旧移植与原始快照只保留在本地历史，不加入公开包。
- `scripts/build_public.py` 从当前源码生成独立公开包，`scripts/build_site.py` 生成 Pages 静态站点；发布前运行公开检查并核对产物，不能从 C:\AI 整仓推送到 UI 仓库。
- `scripts/public_smoke.mjs` 验证公开页面、子路径部署与主要交互；本机治理、运行投影及外部 Skill 测试属于另一个集成范围。不要为了公共 CI 把它们的失败改成通过。
