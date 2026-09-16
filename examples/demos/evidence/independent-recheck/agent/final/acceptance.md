# 第二次修复后独立复验

**本专项通过。** 使用新的 Headless Chrome 上下文重新加载当前服务，真实点击菜单 SVG 中央并查看截图，未将前轮结果直接改为通过。

- Portal 320、390、700、701、768、900、1024、1100、1101、1280px：顶栏无可见重叠或遮挡，文档无横向溢出。<=1100px 菜单可展开并点击“组件”切页后收起；1101px 恢复常规导航。
- 独立 Demo 320、390、768px，以及 Portal 320/390px 中的嵌入 Demo：圆形菜单图标真实点击后保持展开，显示3个链接；关闭正常。Background 保持文字并独立打开面板，Escape 关闭；旁边主题按钮独立切换。
- Portal 320/390px 的 iframe viewport 和 document scrollWidth 分别为320/320、390/390；嵌入内容不再横裁，品牌和 Background 实际文字无重叠。
- Portal 10个测试宽度的主题切换均从外层传给嵌入 Demo：outer=light、inner=light，记录见 `report.json` 的 propagatedTheme。
- 滚动后顶栏另测320、390、701、1024、1101px，无可见重叠；320px 下菜单SVG、Background、主题SVG可真实点击。品牌可见右边界125.609px，Background左边界131.609px，间隔6px。
- 当前默认点阵宿主和伪元素背景图片均为none，每文档一个点阵canvas；截图保持点阵背景。

注意：320px 滚动时 h1 原始盒子仍延伸到x149，但品牌父容器 overflow:hidden、可见右边界125.609，实际没有重叠。`scrolled.json` 同时保留 rawBoxOverlap 和 visibleOverlap，避免只依据未裁剪DOM盒子误报。

原始失败证据在父目录及 `after/` 原样保留。本专项不包含全部组件、模板、数据准确性、导出/PDF、完整动画生命周期或runtime部署。
