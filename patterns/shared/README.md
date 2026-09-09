# Gary 共享页面实现

- `material.js`：共享卡片交互和材质挂载；优先处理 `data-gary-surface="solid|frosted|optical"`，在 `data-gary-light-scope` 内使用同坐标光影；不创建装饰线网或等高线。
- `dot-grid.js`：唯一默认点阵，响应主题与视口；鼠标效果默认关闭，显式开启后响应指针，减弱动态优先。
- `web-bar.js`：滚动顶栏、圆形菜单、键盘与焦点行为。
- `icons.js` / `icons-entry.mjs`：固定 Lucide 图标子集，使用 `GaryIcons.set(button, icon, label)` 更新状态。
- `optical-glass.js`：Gary 原创边缘法线折射，前景内容保持稳定。
- `ambient-waves.js`：Gary 原创 Canvas 环境波面，主动选择后才运行；独立 API 的 `mouseInteraction` 也默认 false，须同时满足根鼠标开关与非减弱动态。
- `background-lab.js`：纯文字 Background 入口、材质强度、本地照片/视频及波面参数；主题按钮独立。
- `number-transition.js`：独立数值槽的 350ms 更新；首次直接结果，真实终值即时可访问，减弱动态与打印立即结束。
- `content-rail.css` / `content-rail.js`：原生 scroll-snap 媒体浏览，手动前后、键盘与触摸，无自动播放。
- `chart-recipes.js`：读取 `spec/chart-recipes.json` 的五种数据驱动 SVG 参考配方与原生数据表；不新增正式 Visual Adapter 引擎。

两项配方的复制用法与实验边界见 [交互配方](../../docs/INTERACTION_RECIPES.md)，实际体验见 [细节实验室](../../examples/interaction-lab/index.html)。媒体倾斜与分段标题只在实验页内，尚未成为共享默认。

用 `tokens/base.css` 导入共享组件样式。完整 Demo 是默认视觉基线；密集表格和正文使用稳定底板，工具操作默认44px圆形图标。

实现与许可证见 [SURFACES.md](SURFACES.md) 和根目录 [MIT](../../LICENSE)。系统字体来自宿主设备；G × 建筑体块标志是原创SVG，未作商标注册保证。

三种表面已按场景批准：`solid` 用于密集数据、表格、长正文；`frosted` 用于摘要、导航、判断；`optical` 用于短内容、媒体、展示。使用 `data-gary-surface` 声明，规则见 [surfaceRecipes](../../spec/scene-recipes.json) 与[玻璃卡契约](../../components/glass-card.json)。该调用接口不改变任务协议中的 material 枚举。

鼠标光影统一由根属性 `data-gary-pointer-effects="on"` 开启；缺省/其他值关闭，在 Background 中显式开启，刷新不恢复，减弱动态优先。需要背景与玻璃联动时，在共同容器标记 `data-gary-light-scope`；该属性声明作用域，不会自行开启鼠标效果。一层玻璃、不嵌套，前景无滤镜、不 tilt；纯文字 Background 与圆形主题按钮保持独立。

材质调用见[视觉表达](../../docs/VISUAL_EXPRESSION.md)；图表以[图表表达规范](../../docs/CHART_EXPRESSION.md)和[机器规则](../../spec/chart-recipes.json)的 17 类选型、7 种标注为准。[demo0909](../../demo0909.html)使用 [cases.json](../../examples/demo0909/cases.json) 做跨领域验证，所有案例均为人工演示。业务字段、章节编号、状态结论与配色语义属于当前输入，不是共享默认。

图表 API 为 `GaryChartRecipes.render(type, config, { policy, theme })`、`table(type, config)`、`validate(type, config)`；返回 SVG／table DOM 或校验结果，由宿主挂载。`type` 仅限 `combo / waterfall / donut / radar / rose`，其他类型走现有 ECharts 等工具。参考实现读取 themes 中实际使用的颜色、geometry、字体 family／label／small／metric、strokes 和 fills；spacing、对比度、完整标注语法与布局规则仍须作者实施和验收。七种标注不是七个已实现 API，主题与数据更新也须由宿主重绘。[最小调用与具体边界](../../docs/CHART_EXPRESSION.md#55-参考实现的调用边界)是复制入口。

颜色角色选择见[图表色彩体系](../../docs/CHART_COLOR.md)，色值不在本文件重复。环图项目显式保持 `key / role`，雷达参考轮廓携带 `referenceMeta`，瀑布独立情景携带 `kind / basis`；避免换输入后保留原样本色义或假设身份。
