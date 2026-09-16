# 第一次修复后独立复验

仍有两处须关闭，暂不通过：

1. Demo 新菜单图标点击后立即关闭。真实点击位于 SVG 中央时，`web-bar.js` 的 paint 替换 SVG，原始事件 target 离开 bar；随后 document click 使用 `bar.contains(e.target)`，把刚打开的菜单当作外部点击关掉。320/390px 嵌入 Demo 均复现 `aria-expanded=false`、可见链接=0。建议 outside-click 使用事件 composedPath 来判断本次事件的实际来源。
2. 320px Portal **滚动后**品牌标题与 Background 重叠17.390625px。标题 right=149，Background left=131.609375；首屏没有这个问题。来源共享 `.is-scrolled` 左右 padding 配合 Portal 固定品牌宽度，截图 `portal-320-scrolled.png`、几何 `scrolled.json`。

本次已通过：

- 701、768、900、1024、1100px Portal 菜单显示、可展开、点击组件跳转并收起；1101px 顶栏恢复完整主导航。
- 320/390px Portal iframe 实际宽度已与外层相等，document scrollWidth 相等，正文不裁剪，Demo 品牌和 Background 实际文本没有交叠。
- 独立 Demo 320/390/768 首屏 Background 与主题分离，菜单视觉变成圆形图标。
- 本次13个独立窗口的 Background 打开/ESC关闭/主题独立切换通过。

本记录保留第一次修复后的结果，后续修复另存新证据。
