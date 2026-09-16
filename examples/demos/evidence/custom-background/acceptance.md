# 强折射与本地背景素材

2026-09-07。目标为 `examples/demos/index.html`，不是制图画廊。

## 验收入口

[新版服务与背景实验室](http://127.0.0.1:4184/examples/demos/index.html?theme=dark&background=gradient-waves&customize=1)

在 `C:\AI\UI\gary-ui` 运行 `python -B scripts/serve_portal.py --surface portal --port 4184`。本轮已启动，仅绑定 localhost，不发布。旧 4173 未重启，其旧 CSP 不支持本地 Blob 视频；迁回旧端口需先由用户授权重启旧服务。

## 改动

- 折射 100 → 180；0–300 实时滑块，文字不参与位移。保留 30px、字体、内容、导航和银色三浪。仅三个 opt-in 展示入口使用此配方。
- 本地照片或视频：选择、替换、清除；铺满/完整显示；不透明度。无上传、不持久保存、刷新后重选。
- 图片 PNG/JPEG/WebP/AVIF ≤40 MiB；视频 MP4/WebM/Ogg ≤300 MiB。扩展名/容器不保证编码兼容，实际解码失败会保留旧背景。SVG/动画图片未支持。
- 静音循环视频，可暂停；减弱动态/隐藏/离屏/打印不播放。替换和清除释放 Blob URL。切换到其他背景仍保留当前选定素材，视频暂停，可切回。
- 服务只为 Demo 允许 self/blob 媒体；connect-src 仍 none，其他 surface 安全策略不放宽。

Gary Skill：integrate / web-ui / report-cover / dark 或 light / ultrathin / balanced。直接对话基线 targetArtifact=examples/demos/index.html，browserReport=examples/demos/evidence/glass-surface/target-browser-report.json，chatAuthorization=用户要求提高折射并支持视频照片。锁定其他样式，不创建 Session。TDD 先证明入口缺失与旧 CSP 阻断，再修改对应实现。

## 证据与步骤

- `scripts/custom_background_qa.mjs`，通过 `GARY_QA_ORIGIN=http://127.0.0.1:4184` 测试最终服务；结果 `qa-report.json`。
- 1440/768/390 × 明暗，6 个照片案例：有效解码、坏 PNG 和不支持 SVG 保留旧背景、fit、强度实际像素变化、200% 文字无页面横向溢出、清除回网格、无外网请求。
- 视频案例使用浏览器 Canvas/MediaRecorder 生成的本地 WebM，不采用外部或用户私人素材。测试播放时间推进、静音循环、暂停冻结、离屏暂停、恢复、reduced-motion 禁用播放、断网静帧、打印隐藏和清除。
- 最终截图 `{width}-{theme}.png`、`{width}-{theme}-controls200.png`，视频 `video-offline-reduced.png`。合成条纹仅为折射测试背景，不作为默认素材交付；生成视频仅为 QA fixture。
- `target-browser-report.json` 是新版实际服务的 CSS/44px/单 Scene 门禁；完整样式漂移与折射矩阵仍见 `../glass-surface/qa-report.json`。截图需由人判断，不等于整体视觉验收通过。

## 已知未完成

制图画廊 `examples/demos/visuals/outputs/index.html` 确认仍为旧生成模板和独立内联样式，生成回执时间为 2026-09-07 14:03（本地时间）；并非缓存。此轮新增两项没有更新画廊模板或重新生成所有图形导出。
旧 4173 视频入口待服务重启。Safari/Firefox 实机、手机真实硬件、MP4/Ogg 编码组合、长期功耗、刷新后素材持久化未验证或未实现；不能宣称所有格式均已验收。
受管同步与测试摘要见 `provenance/custom-background-sync.json`。无提交、推送或公共部署。
