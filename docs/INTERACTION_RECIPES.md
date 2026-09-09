# 交互配方与参考策展

更新：2026-09-09。面向在 Gary-UI 中制作前端、报告和视觉页面的 Agent。

[细节实验室](../examples/interaction-lab/index.html)提供两项可复用交互，以及 A「媒体轻倾斜」、B「标题分段呈现」两项待判断实验。完整 Demo 的已批准布局、材质、纯点阵背景和独立的 Background / 深浅主题入口继续作为基线。

## 筛选结果

来源是 React Bits 的[官方介绍](https://www.reactbits.dev/get-started/introduction)和[官方组件文档索引](https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/llms.txt)。表中参考行为来自官方文字说明；Gary 的处理是本项目的设计选择，不代表已逐项目测官方 Demo。

| 参考元素 | 参考行为 | 本轮处理与适用边界 |
| --- | --- | --- |
| [Count Up](https://www.reactbits.dev/text-animations/count-up) | 格式化数值与小数的动画变化 | **采用独立配方。** 分析页在筛选或真实数据更新后过渡到新值；首次显示不从零滚动，单位、口径和来源保持可读。 |
| [Carousel](https://www.reactbits.dev/components/carousel) | 响应式、触摸与内容切换 | **采用独立配方。** 案例、媒体证据和阶段记录使用原生横向滚动；圆形前后图标、当前位置、键盘可用，无自动播放和无限循环。 |
| [Animated Content](https://www.reactbits.dev/animations/animated-content) | 挂载或滚动时的内容出现 | **复用已有。** 展示页消费现有有限出现及播放控制；阅读页静态，分析页只反馈状态变化，不增加第二套动画引擎。 |
| [Spotlight Card](https://www.reactbits.dev/components/spotlight-card) | 光照随指针局部移动 | **复用已有。** 使用共享卡片材质的中性光泽和焦点反馈，不叠加彩色光斑、第二层玻璃或常驻动画。 |
| [Tilted Card](https://www.reactbits.dev/components/tilted-card) | 指针驱动透视倾斜 | **实验 A。** 默认关闭，最大 3°，仅媒体轻倾斜，说明文字稳定；用于案例封面评估，不用于表格、图表或精确图纸。 |
| [Split Text](https://www.reactbits.dev/text-animations/split-text) | 文字分段错峰进入 | **实验 B。** 手动播放短标题，按语义短语分段；不逐字拆中文、不动正文、不循环，保留暂停和重播。 |
| [Stepper](https://www.reactbits.dev/components/stepper) | 多步骤进度与激活态变化 | **按需再做。** 仅在实际存在分阶段输入或审阅流程时引入；本轮未实现，不为普通报告增加逐步解锁。 |
| [Scroll Stack](https://www.reactbits.dev/components/scroll-stack) | 随滚动层叠显露卡片 | **本轮跳过。** Gary 的证据和判断需要稳定阅读；不以遮挡、缩小正文或接管滚动来制造层次。 |

## 采用边界

- 阅读默认静态；数值过渡是分析场景的按需增强。展示动效有限、可控，`prefers-reduced-motion` 下直接显示完整内容。
- A / B 仅在实验室体验，必须经用户明确确认适用场景后才能推广到模板或消费项目。浏览器中保存的选择可供导出讨论，不等于已更新系统规范。
- 复用 [MetricCard 契约](../components/metric-card.json)、[MediaCard 契约](../components/media-card.json)和[共享资源](../patterns/shared/README.md)，不新增正式组件种类。交互页面仍须真实验证深浅主题、窄屏、键盘、减弱动态和打印。

## 数值更新：最小接入

以下片段放入已使用 `tokens/base.css` 的 Gary 页面，路径以仓库根目录中的 HTML 为例；复制到其他目录时保持共享资源的相对关系。示例数值为人工编制。

```html
<article class="gary-metric-card gary-thick" aria-labelledby="completion-label">
  <h2 id="completion-label" class="gary-metric-card__label">交付完成率</h2>
  <p class="gary-metric-card__value" aria-live="polite">
    <span id="completion-value">72.4</span><span>%</span>
  </p>
  <button id="previous-period" class="gary-button" type="button">查看上周</button>
  <p class="gary-metric-card__meta">人工编制示例 · 本周 72.4%，上周 68.1%</p>
</article>
<script src="patterns/shared/number-transition.js"></script>
<script>
  const value = document.querySelector('#completion-value');
  const format = number => number.toFixed(1);
  GaryNumberTransition.set(value, 72.4, { format });
  document.querySelector('#previous-period').addEventListener('click', () => {
    GaryNumberTransition.set(value, 68.1, { format });
  });
</script>
```

[number-transition.js](../patterns/shared/number-transition.js)的 `set(element, finiteNumber, { format })` 只接管独立数值文本槽：标签、单位、链接和按钮放在槽外。首次调用直接显示完整值，后续变化用 350ms 过渡；同值不重播，连续更新衔接当前显示值。`format` 应为无副作用的格式化函数，输入必须是有限数字。

最终文本立即进入可访问树，插值副本带 `aria-hidden`；模块不自动添加 `aria-live`，只在确需播报的局部添加。减弱动态、页面隐藏、打印或节点脱离页面时立即完成。非法输入或初次格式化失败会抛出错误并保留上次有效内容；不要把失败伪装为零。

## 内容轮播：最小接入

同样放入已加载 `tokens/base.css` 的 Gary 页面。轨道本身不套玻璃，卡片字幕独立于图片；此示例使用仓库内已有的暗色 Demo 预览。

```html
<link rel="stylesheet" href="patterns/shared/content-rail.css">
<section data-gary-rail aria-label="页面案例">
  <ol class="gary-content-rail" tabindex="0" aria-label="案例列表，方向键浏览">
    <li><figure class="gary-media-card">
      <img class="gary-media-card__media"
           src="examples/demos/evidence/edition-02/web-analysis-dark.png"
           alt="交付脉冲的筛选、趋势与判断页面" width="1440" height="1000">
      <figcaption class="gary-media-card__caption">分析 · 从数据到判断</figcaption>
    </figure></li>
    <li><figure class="gary-media-card">
      <img class="gary-media-card__media"
           src="examples/demos/evidence/edition-02/web-reading-dark.png"
           alt="项目知识库的文档搜索与正文页面" width="1440" height="1000">
      <figcaption class="gary-media-card__caption">阅读 · 让知识保持连贯</figcaption>
    </figure></li>
  </ol>
  <div class="gary-content-rail-controls">
    <button type="button" data-rail-prev data-gary-icon="arrow-left"
            aria-label="上一个案例"></button>
    <span data-rail-status role="status">1 / 2</span>
    <button type="button" data-rail-next data-gary-icon="arrow-left"
            aria-label="下一个案例"></button>
  </div>
</section>
<script src="patterns/shared/icons.js"></script>
<script src="patterns/shared/content-rail.js"></script>
```

[content-rail.css](../patterns/shared/content-rail.css)与 [content-rail.js](../patterns/shared/content-rail.js)使用原生滚动和 CSS scroll-snap；后一按钮复用左箭头并由 CSS 旋转。静态 HTML 自动挂载，轨道获得焦点时可用左右方向键、Home、End，不接管子项控件的按键。减弱动态立即定位；打印时所有卡片纵向完整展开。

动态插入整个区块后调用 `const rail = GaryContentRail.mount(host)`，重复挂载幂等。当前只支持静态条目集合；增删 `li` 前先 `rail.destroy()`，修改后再 `GaryContentRail.mount(host)`。这不是 React 适配器，也不需要安装 React、GSAP 或 Motion。

## 来源与许可

2026-09-09 核实的 React Bits [现行许可](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md)为 **MIT + Commons Clause**：允许作为应用、网站或产品的一部分使用，但限制对组件本身、组件包和移植版本的出售、再许可与再分发。不能仅看到 README 中的“开源”描述，就把上游组件放进 Gary-UI 的公开组件库。

本轮只从公开文档提炼行为与设计问题，Gary 实现使用原生浏览器能力和本仓库已有资源独立编写，采用本仓库 [MIT](../LICENSE)；未复制 React Bits 的组件源码、shader、样式或素材。不称为“React Bits 官方移植”，不声称已安装其 Skill，也不包含 Pro 资源。第三方声明继续以 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) 为准。

## 本轮验收

2026-09-09：[实际入口回执](../examples/interaction-lab/acceptance.json)和[浏览器样式报告](../examples/interaction-lab/target-browser-report.json)。新页 33 项浏览器检查通过，覆盖 1440 / 390 / 320px 深浅主题、数值连续更新与非法值保护、轮播键盘与滚轮、播放暂停重播、运行中减弱动态、读屏标题、选择保存与复制失败回退、Background 独立操作、打印及无脚本阅读。桌面和窄屏截图已人工复核；A / B 审美取舍仍待用户判断。复跑时用现有 Playwright 环境执行 `node scripts/interaction_lab_qa.mjs`，可通过 `GARY_UI_BASE_URL`、`GARY_UI_CHROME`、`GARY_UI_CAPTURE_DIR` 指定地址、浏览器和证据目录。

公开包检查通过，新增资源可以独立导出。完整 Demo 的 870 个已追踪文件无内容变更，16 个原始字节差异均为既有行尾格式差异。本轮未推送或部署。

全库 `validate_v2.py` **仍未通过**：旧检查器把未修改的 `optical-glass.js` 中 SVG 命名空间常量当成远程依赖，此问题已在基线提交复现。它不影响上述浏览器检查，但不能将本轮记为“全库验收通过”。
