# 银色三浪默认预设确认

2026-09-07 用户指令「这套作为默认」。范围为银色波浪预设，不更改全局点状网格（用户配置 globalDefaultChanged=false）。
按 Gary Skill 锁定 targetArtifact=examples/demos/index.html；基线 browserReport=examples/demos/evidence/glass-surface/target-browser-report.json；直接对话授权，仅参数与恢复/导出一致性变更。Visual Route：web-ui / report-cover / dark 或 light / ultrathin / balanced。无 Session、无新的全局默认决定。

深色 options 与用户 JSON 逐项一致：速度 0.1、波幅 2、尺度 1.35、比例 0.6、涌动 0、扰动 50、倾角 1.12、缩放 1、高度 10、雾深 20、中细节、亮度 1.1、不透明度 0.47、关闭鼠标交互、视差值 0.85、颗粒开启/0.01，银色三色不变。持续播放、durationSeconds=null、减弱动态静态。
浅色沿用同一波形与颗粒，但保留既有浅色三色和 0.32 不透明度。玻璃强度、字体、排版、自定义媒体功能不变。正式预设名称为 silver / 银色三浪，不再标记临时 custom。

实现：`patterns/shared/background-lab.js`；契约与指南：`components/scene.json`、`patterns/shared/gradient-waves-README.md`。
浏览器导出的精确配置：同目录 `approved-default.json`。`scripts/gradient_waves_lifecycle_qa.mjs` 检查初次加载、调参后恢复、导出逐项一致、持续播放/降级；`scripts/glass_surface_qa.mjs` 与 `scripts/gradient_waves_qa.mjs` 保存最新三宽度/明暗/200% 文字证据。

预览：http://127.0.0.1:4184/examples/demos/index.html?theme=dark&background=gradient-waves
本轮没有重启服务。135 项全项目回归为上一轮记录，本轮参数调整只重跑相关浏览器检查与 validate_v2，不能冒称全项目重新验收。旧制图画廊仍未更新。
同步与实际检查结果见 `provenance/approved-wave-default-sync.json`。
