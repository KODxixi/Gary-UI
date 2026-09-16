# Gary 公开材质实现

公开版的两个效果模块由 Gary-UI 独立编写，适用根目录 MIT 协议。它们遵循既有页面接口，不复制受限上游的 shader 或三通道合成实现。

## 光学玻璃

`optical-glass.js` 为圆角矩形生成边缘法线位移图，使用标准 SVG 位移滤镜改变背景采样。共享 CSS 继续决定卡片圆角、底板、高光、阴影与文字。默认强度180，`GaryGlassSurface.setStrength(0..300)` 可调；文字本身不应用 filter。动态挂载、尺寸变化和移除会更新或释放资源。不支持的浏览器使用原有磨砂底板。

## 环境波浪

`ambient-waves.js` 使用 Canvas 2D 绘制多层缓慢变化的波面，不需要 WebGL 或外部依赖。`GaryGradientWaves.mount` 提供更新、播放、暂停、重播、PNG 快照与销毁。默认页面仍只有点网格，必须在 Background 中主动选择波浪才创建它。

页面不可见、离开视口、打印时暂停；减弱动态时呈现静态波面。与早期内部波浪算法不同，参数与导出配置保留可解释的含义，不能把旧 shader 参数预设视为像素等价保证。

## 验证

`node scripts/public_surfaces_qa.mjs` 检查位移像素、前景无滤镜、布局不变、动态挂载、参数、暂停、减弱动态、PNG 与清理。页面集成由 `scripts/public_smoke.mjs` 验证。结果见仓库 `docs/PUBLIC_RELEASE.md`，未验证浏览器不作支持保证。
