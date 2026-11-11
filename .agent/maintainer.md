# Gary-UI 维护者指南

> 本文件只给维护者。外部 Agent 不需要读这里。

## Demo 维护

- **视觉基线**：完整 Demo 覆盖 Portal、组件、模板及制图。关键约束：44px 圆形图标（React 组件层图标来源 reicon-react；vanilla 静态层与 morph 仍取 Lucide 几何）、默认点网格背景（不叠加线网）。
- 实现入口：[icons-entry](../patterns/shared/icons-entry.mjs)、[dot-grid](../patterns/shared/dot-grid.js)、[material](../patterns/shared/material.js)。
- **验证**：[公开版验收](../docs/PUBLIC_RELEASE.md)。QA 脚本：`card_material_qa.mjs`、`portal_acceptance_qa.mjs`、`starter_generated_qa.mjs`。
- **六场景首页**：[examples/demos/](../examples/demos/index.html)，共享逻辑 [demo.js](../examples/demos/shared/demo.js)，数据 [project-data.js](../examples/demos/data/project-data.js)（人工示例，非真实业务）。
- **Background**：首页顶部一行文字入口，复用 [background-lab.js](../patterns/shared/background-lab.js)。不要浮动按钮、不要合并进"显示设置"。Portal 材质设置在"基础 → 材质"。
- **交互**：[INTERACTION_RECIPES.md](../docs/INTERACTION_RECIPES.md) + [interaction-lab](../examples/interaction-lab/index.html)，验证 `interaction_lab_qa.mjs`。

## 图表与材质规则

- 分析图表：[CHART_EXPRESSION.md](../docs/CHART_EXPRESSION.md) + [机器规则](../spec/chart-recipes.json)，17 类选型和 7 种标注语法。[demo0909](../demo0909.html) 是跨领域输入验证页。
- 图示：[DIAGRAM_EXPRESSION.md](../docs/DIAGRAM_EXPRESSION.md) + [机器规则](../spec/diagram-recipes.json)，七层阅读、边界命题、状态词闭集、跨边界绕行。
- 材质与光影：[VISUAL_EXPRESSION.md](../docs/VISUAL_EXPRESSION.md)；实体底纹、磨砂玻璃、超白/全透玻璃按内容选择 `data-gary-surface="solid|frosted|optical"`。鼠标联动光影默认关闭。
- 图表色彩：[CHART_COLOR.md](../docs/CHART_COLOR.md)；角色与主题值读取 `spec/chart-recipes.json` 的 `colorSystem`、`themes`。
- Apple 质量层：[DESIGN.md §1.1](../DESIGN.md#11-apple-quality-layer)。涉及 Apple 风格时，优先读已安装的 `apple-design`，再用 Apple HIG 校验边界。

## 生成产物

- `examples/**/outputs/` 是 visual adapter 生成的 HTML/PNG/SVG，不要直接改，从源码重新生成。
- `.last-good/` 是备份，不进 git。

## 公开仓库维护

- 公开仓库为 `KODxixi/Gary-UI`，完整 Demo 是 README 与在线站点的共同入口；普通预览用 `python scripts/preview.py --port 4173`。
- 原创代码采用 MIT，第三方保留各自条款。公开材质使用 `optical-glass.js` 与 `ambient-waves.js`；受再分发限制的旧移植与原始快照只保留在本地历史。
- `scripts/build_public.py` 从当前源码生成独立公开包，`scripts/build_site.py` 生成 Pages 静态站点；发布前运行公开检查并核对产物。
- `scripts/public_smoke.mjs` 验证公开页面、子路径部署与主要交互。

## Runtime

- [runtime/manifest.json](../runtime/manifest.json) 是可选的维护者投影配置。普通克隆修改自己的源码 checkout；只有启用了受管投影的环境才执行其既有同步流程。
