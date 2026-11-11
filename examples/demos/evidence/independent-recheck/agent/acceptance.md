# 独立窄屏验收 — 2026-09-08

结论：初次验收不通过。直接使用新的无痕 Headless Chrome 页面访问运行中的 4173 服务；未复用现有 QA 的通过结论，未修改产品源码。

## 已复现问题

1. **P1：701–1100px Portal 栏目导航全部不可达。** `components/components.css:984–986` 在 `max-width:1100px` 隐藏主导航并显示菜单；`portal/app.css:4360–4361` 又把菜单隐藏到 `max-width:700px` 才出现。实测 701、768、900、1024px 都只有品牌、Background 和主题按钮，不能切换栏目。证据：`portal-701.png`、`portal-1024.png` 和 `report.json`。修复建议：导航收起、菜单出现、弹层样式和事件使用同一个 1100px 断点，验收 700/701/1100/1101 边界及打开后的导航点击。

2. **P2：Portal 内嵌 Demo 在手机上被裁剪，品牌和 Background 重叠。** Portal 320/390px 的 iframe 实际宽度为 214/284px，Demo 仍是 320px 最小宽度；真实 `documentElement.scrollWidth` 都是 320。`examples/demos/shared/demo.css:25` 的 `body min-width:320px` 与 Portal 多层边距 `portal/app.css:3200–3201`、`:4327–4328`、`:2023–2036` 一起触发。品牌 flex box 在 214px 内宽时缩至 0，在 284px 内宽时仅 56.609px，实际内容溢出，和 Background 相压。不能只检查父文档 overflow 或两个 flex box 是否相交。证据：`portal-320-embedded.png`、`portal-390-embedded.png`、`embedded-controls.json`。建议缩减移动端预览外层留白，并针对嵌入窄宽度提供真实 reflow，保持品牌文本、Background 和主题/菜单触点完整，或使用明确的全屏入口且不展示失真的假预览。

3. **P2：Demo 动态生成的菜单按钮漏用图标，320px 会竖排为“菜／单”。** `patterns/shared/web-bar.js:14` 仍写 `toggle.textContent='菜单'`。`components/components.css:967,:991` 的高度与 padding 导致 320px 下菜单约 40×44px，而非统一 44px 圆形 Lucide。390px 仍是文字药丸。证据：`demo-320.png`、`demo-390.png` 及 `report.json`。建议复用本地图标渲染器，维持独立菜单功能、aria-expanded 和可访问名称，并确保动态渲染顺序。

## 独立通过的部分

- Portal 320、390、560、700、701、768、900、1024、1280、1600px：Background 纯文字，点击只打开面板；Escape 关闭后点击主题按钮 dark→light，不打开面板。
- 独立 Demo 320、390、768px：Background 与主题上述行为通过，页面没有横向溢出。此通过不包含第3条菜单外观。
- Portal 320/390px 的嵌入 Demo：Background、Escape、主题操作可真实点击。嵌入主题切换只影响 iframe，外层主题保持 dark。菜单可展开3个链接，但外观仍失败。
- 本批默认 reduced-motion 页面，每份文档只有一个 dot-grid 宿主和一个点阵 canvas；宿主和伪元素背景图片都是 none，没有叠加 CSS 网格。截图中仅点阵背景。未把卡片的折射高光算作装饰线网。

## 测量限制

- `report.json` 的 `overlap` 只反映盒子相交，无法发现品牌绘制溢出；独立截图和 `embedded-controls.json` 的 box/scrollWidth 弥补该盲点。
- 1280/1600 的4条空文本 `centerHit:false` 来自关闭的 details 子导航，不是可见顶栏遮挡；不作为问题。
- 本专项未验收所有组件、模板、数据正确性、图示导出、PDF、动画全生命周期或部署/runtime。未宣称这些通过。
- 修复后须新增复验记录；本原始失败报告及截图应保留。
