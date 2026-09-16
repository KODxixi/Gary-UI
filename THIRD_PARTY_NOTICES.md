# Third-party notices

Gary-UI 原创 Token、组件契约、样式、页面模式、交互、文档、光学玻璃与环境波浪实现适用根目录 [MIT](LICENSE)。第三方作品不因被本仓库引用或打包而改变其原有许可。

## 实际分发的依赖

本地制图使用 Archify、ECharts、Markmap、AntV Infographic、Mermaid、Lucide、D3 与 Playwright Core；构建使用 esbuild。React 适配器使用 React、Tailwind CSS、Radix UI、class-variance-authority、clsx、tailwind-merge 等依赖。

版本与用途见 [适配器许可清单](adapters/visual/LICENSES.md)，完整原始许可文本见 [licenses/third-party/THIRD_PARTY_LICENSES.txt](licenses/third-party/THIRD_PARTY_LICENSES.txt)，版本与元数据见 [manifest.json](licenses/third-party/manifest.json)。生成物中内联的运行库同样受各自许可约束。第三方品牌标识可能另有署名、商标与用途限制，不纳入 Gary-UI 原创 MIT 授权。

## 设计参考与未分发内容

Apple 的 Liquid Glass、DeepSeek 与 COSMOS 仅为设计研究参考。本仓库不分发它们的专有字体、商标素材或网站媒体；默认字体来自用户设备。

维护者早期内部版本曾包含 React Bits 的 Light Rays、GlassSurface 和 GradientWaves 移植。其固定版本采用 MIT + Commons Clause，并限制组件及其移植版本的再分发；这些实现和原始快照不进入公开包。公开版本使用单一点阵，以及 Gary 独立编写的 `patterns/shared/optical-glass.js` 和 `patterns/shared/ambient-waves.js`，不沿用该上游的 shader 或 RGB 分通道实现。

不确定对外分发权限的历史背景图片不进入公开包。Demo 中的业务数据由人工编制；用户自行载入的图片和视频只在本地浏览器预览，不上传到仓库或网站。
