# Gary-UI 图表与玻璃表达

本页说明背景、玻璃与数据读数如何共存；图表的选型、排版和标注以[图表表达规范](CHART_EXPRESSION.md)及[机器规则](../spec/chart-recipes.json)为准。**实体底纹（Solid）、磨砂玻璃（Frosted）、超白/全透玻璃（Optical）三种表面已经用户批准，按内容用途选用；联动光影默认关闭，在 Background 显式开启。** [demo0909](../demo0909.html)用于跨领域输入验证和材质对照，[视觉实验页](../examples/visual-lab/index.html)保留逐层观察。三材质并排是同内容比较，不要求正式页面每屏都出现三种材质。

## 1. 图表先有语义，再选外壳

[图表表达规范](CHART_EXPRESSION.md)覆盖 **17 类图表与 7 种标注**：每类包含问题、数据前提、尺度、标签、构图、禁用条件和替代方案；标注区分 `data / derived / assumed`，绑定对象与依据。标题、叙述、绘图区、编码、参考、判断、来源构成七层阅读结构，不能用状态徽标代替分析依据。

主数据比参考线醒目；图内少量坐标参考线用于读数，与禁止重复叠加的页面线网格不同。直接标注优先，必要图例与来源不能省略。窄屏先重排、减少非必要刻度或分成小多图，不把所有文字缩小。依据见 [Apple Charts](https://developer.apple.com/design/human-interface-guidelines/charts)、[Carbon 轴与标签](https://carbondesignsystem.com/data-visualization/axes-and-labels/)及[图表构成](https://carbondesignsystem.com/data-visualization/chart-anatomy/)。

绘图区和密集表格使用稳定实色底板，光影不改变数据标记的颜色、位置或对比度。玻璃可用于导航、摘要或独立外壳，数据和正文不施加折射滤镜。遵守 [SolidPlate 契约](../components/solid-plate.json)和[对比表契约](../components/comparison-table.json)：手机表格转为带字段名的逐行布局，保留原生表格语义。数字右对齐、使用等宽数字；行内条形与小趋势辅助扫读，不能替代精确值。[Carbon 数据表](https://carbondesignsystem.com/components/data-table/usage/)

### 规范、实现与验证入口

| 入口 | 职责与边界 |
|---|---|
| [chart-recipes.json](../spec/chart-recipes.json) | 17 类选型规则、7 种标注语法和图内参数的真源；不表示 17 类都已自动渲染 |
| [chart-recipes.js](../patterns/shared/chart-recipes.js) | `combo / waterfall / donut / radar / rose` 五种数据驱动 SVG 参考实现；同一输入可生成图与原生数据表，不是正式适配器新增引擎 |
| [cases.json](../examples/demo0909/cases.json) 与 [demo0909](../demo0909.html) | 用服务、设施、项目、能源、产品与建筑等人工数据验证字段、数量、尺度和缺测改变后的表现；演示数据不证明真实业务判断 |
| [Visual Adapter](../adapters/visual/README.md) | 其余定量类型继续复用本地 ECharts；关系图走 Archify／Markmap 等既有路由，正式导出继续遵守[清单契约](../contracts/visual-manifest.schema.json) |

实际 API、最小调用和参数消费范围见[参考实现的调用边界](CHART_EXPRESSION.md#55-参考实现的调用边界)。颜色按当前字段与状态定义，不能固定为某行业、某种图形的专用色。状态 pill 有可读文字；圆形结论徽标只帮助定位，编号由当前文档决定；章节标签按当前内容组织。原参考中的房产字段、D2／D6、章节名、固定判断和配色都不是通用规范。

历史[视觉实验数据](../examples/visual-lab/data.json)与 [ECharts 研究脚本](../examples/visual-lab/charts.js)保留为样本对照，不作为跨领域迁移已经完成的证据。更换数据须重新检查单位、缺测、排序、阈值、聚合与标注依据；SVG 导出按钮也不能证明独立 HTML、PNG、PDF 已验收。

## 2. 点阵背景与玻璃共用一个空间

**鼠标驱动的点阵、高光和波面视差默认关闭。** 新页面只通过右上角 `Background` 明确开启，根元素为 `data-gary-pointer-effects="on"` 时才允许响应；属性缺失或其他值都视为关闭。历史实验页中的对照开关不作为新页面入口。系统“减弱动态”优先，触摸浏览保留完整静态材质。焦点、按压、图表读数提示等必要反馈不依赖装饰光影开关。相关系统偏好见 [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)。

背景仍只有一个点阵场景，卡片内不再生成一份点网格。透光玻璃采样自己后方的真实背景；实色分析底板遮住干扰。显式开启光影后，同一指针位置先确定页面光场，再转换到各卡片的局部坐标：背景亮处与卡片边缘亮处对应，不能让每张卡片各自跟随一束无关的光。

共享调用复用 [material.js](../patterns/shared/material.js)，不复制实验页的指针监听器到每张卡片。`data-gary-light-scope` 标记需要共同光场的容器；它只声明作用域，不会自行开启鼠标效果。[study.js](../examples/visual-lab/study.js) 与 [study.css](../examples/visual-lab/study.css)保留实验对比。底层复用 [dot-grid.js](../patterns/shared/dot-grid.js)、[optical-glass.js](../patterns/shared/optical-glass.js)、[ambient-waves.js](../patterns/shared/ambient-waves.js)和 [Background](../patterns/shared/background-lab.js)。背景选择、鼠标光影、深浅主题各自独立；`Background` 继续为纯文字入口，旁边的主题操作继续为圆形图标。

### 已批准的统一调用

| 属性值 | 适用内容 | 内容层要求 |
|---|---|---|
| `data-gary-surface="solid"` · 实体底纹 | 报告外卡、短指标；密集数据与正文使用无纹理实底 | 不透明，无背景折射；底纹显式调用 |
| `data-gary-surface="frosted"` · 磨砂玻璃 | 摘要、导航、判断 | 柔和散射，正文可读，避免装饰性形变 |
| `data-gary-surface="optical"` · 超白/全透玻璃 | 短内容、媒体、展示 | 清透与边缘折射；支持不足时回退为磨砂 |

页面载入 `tokens/base.css`，依次加载 `patterns/shared/material.js`、`patterns/shared/optical-glass.js` 后即可声明，例如：

```html
<section data-gary-light-scope>
  <article data-gary-surface="frosted">
    <h2>本期判断</h2>
    <p>写明结论与证据状态。</p>
  </article>
</section>
```

显式表面属性优先于旧页面的自动材质识别。一层玻璃、不嵌套玻璃滤镜；实体外卡可承载一层磨砂章节栏，其内部子卡不加玻璃滤镜；前景文字和数据无滤镜，不做 tilt。`data-gary-surface` 是按内容选表面的接口，不改变 Task 协议中的主 material 枚举。完整机器规则见[场景配方](../spec/scene-recipes.json)的 `surfaceRecipes`、`motion.pointerEffects` 和[玻璃卡契约](../components/glass-card.json)的 `surfaceRecipe`。

光场必须在关掉开关、离开页面、打印或启用减弱动态后停止，不改变正文和数字的位置。`backdrop-filter` 处理元素后方内容，透明或半透明底色才允许看到该效果；不要把 `filter` 加在包含文字的整张卡片上。见 [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)。

### 实体底纹与章节子卡

报告概览按「实体外卡 → 磨砂章节栏 → 四块独立子卡」组织。外卡用中性灰和细密、连续的指纹曲线；章节栏提供一层散射，子卡仅用深浅底色区分，不继续叠加玻璃滤镜。栏内先是组标题，再是编号、章节名称和短说明；手机排成两列，保留独立点击区域。参考实现见 [demo0909](../demo0909.html) 的 `.framework-card` 与 `.chapter-index`。

```html
<section data-gary-surface="solid" data-gary-texture="flow">
  <nav data-gary-surface="frosted" aria-label="报告章节">
    <!-- 组标题与独立章节链接；链接本身不声明玻璃材质 -->
  </nav>
  <header>报告标题与摘要</header>
</section>
```

底纹复用已有 `assets/textures/b-ridge-current-10-200-10-105-055-v1.svg`，由共享 `components/components.css` 裁切到实体卡内部。保留 `1920px × 12288px` 的纹理尺寸；不得把长图压缩到卡片高度，否则细线会挤成粗亮波纹。纹理静止、无拼接、不响应鼠标，深浅主题均为中性灰。不要在每个子卡或绘图区重复铺纹，也不要把它加到默认页面点阵上。打印时隐藏纹理，精确图表、密集表格与长正文使用不带 `data-gary-texture` 的 Solid 实底。

## 3. 玻璃质感来自哪些线索

| 线索 | 应观察什么 | 调整原则 |
|---|---|---|
| 透光、散射与折射 | 背景可辨程度、细节变柔、靠边位置发生弯折 | 透光决定看见多少，散射决定多柔，折射提示厚度；三者分别调整，文字保持清楚 |
| 窄边反光 | 边缘有轻微明暗差，形体与圆角清楚 | 用窄而有方向的边缘，不把整圈画成均匀霓虹；鼠标高光仍须显式开启 |
| 接触与投影 | 卡片与底面分离，有近处接触和远处柔影 | 阴影应符合背景明暗与层级；避免大黑影把轻玻璃变成厚塑料 |
| 背景参照 | 同一个形状或点阵穿过卡片前后时，位置、清晰度和明暗发生可解释变化 | 没有参照物的纯色背景很难判断折射；实验参照带仅用于观察，不推广成新的默认背景 |

实验页可逐项关闭透光、折射、边缘光、阴影，也可移除背景参照。若去掉某层几乎没变化，先检查该层是否真实生效；若数据难读，先回到实色底板。单纯增加 blur 通常只会变雾，并不会自动增加厚度或清透感。

“实体底纹／磨砂玻璃／超白/全透玻璃”现已成为按用途选择的三种表面。批准意味着可通过统一接口复用，不意味着将整页数据板改成清透玻璃。更换旧页面材质仍需核对内容用途与实际可读性；同一张卡片保持一个明确材质角色。

Apple 的[《Meet Liquid Glass》](https://developer.apple.com/videos/play/wwdc2025/219/)说明透镜、层次、背景适应与可读性的关系；这里借鉴视觉原则。Gary 的实现是 CSS、Canvas 位移图和 SVG 背景滤镜，不声称物理光追、Apple 原生实现或跨浏览器像素一致。支持条件与磨砂回退沿用[玻璃卡契约](../components/glass-card.json)及[公开材质说明](../patterns/shared/SURFACES.md)。

## 4. 修复、批准与验收分开记录

已修复的真实缺陷位于[共享生成器](../adapters/visual/lib/renderers.mjs)：原 `surfaceAlpha` 的 `0.98 / 0.96 / 0.86` 被直接写入 `color-mix()`，缺少百分比单位会使底板背景声明失效。现在输出 `98% / 96% / 86%`，保持原场景含义，不更换配色，也不批量重绘已批准资产。百分比语法见 [MDN color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/color_value/color-mix)。

生成器缺陷修复与用户批准三种材质是两项不同变更。后续验收覆盖双主题、手机布局、缺测与数值一致性、当前主题导出、装饰光影默认关闭及开启后的收束、减弱动态和回退；审美批准不能替代运行验证。

历史视觉实验页的[验收记录](../examples/visual-lab/acceptance.json)和[浏览器报告](../examples/visual-lab/target-browser-report.json)只说明当时的固定样本；它们不证明当前图表配方能够跨领域迁移。历史文件保留原样，不将旧检查数量移写为本轮结论。

当前页的证据入口为 [demo0909 验收回执](../examples/demo0909/acceptance.json)及[浏览器报告](../examples/demo0909/target-browser-report.json)。阅读时核对其时间、对象、输入案例和实际产物；若仍对应旧固定样本，须重新运行迁移检查。不得仅因报告文件存在就声称当前版本通过。复验应包含换领域与类别数量、缺测／零／负值、标注重算、图表与表格一致性、双主题、窄屏、独立导出，以及既有材质和 Background 边界；以[图表必须失败条件](CHART_EXPRESSION.md#7-验收出现以下任一项不得通过)约束结论。

页面与材质检查入口分别为 `scripts/demo0909_qa.mjs`、`scripts/surface_light_qa.mjs`，本地环境使用 `GARY_UI_BASE_URL`、`GARY_UI_CHROME`、`GARY_UI_CAPTURE_DIR`。记录实际验证的浏览器、尺寸、输入与格式，未测部分明确保留；局部通过不能替代全库验收或对所有 17 类图表的实现承诺。
