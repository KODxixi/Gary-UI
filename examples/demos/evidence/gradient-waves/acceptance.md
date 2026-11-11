# Gradient Waves 背景试验交付

> 后续确认已覆盖初始配方：2026-09-07 最新为「银色三浪」与默认持续播放，完整参数见 `silver-three-waves.json`；当前目录截图及 lifecycle-report 已按最新版本重跑。下文的 Gary 初始配方和 20 秒预算说明保留为历史，不是当前 Demo 行为。最新验收见 `../glass-surface/acceptance.md`。

日期：2026-09-07。范围：Demo 首页的可选背景及实时调节面板，不改变全局默认，不替代六个业务 Demo 的完整验收。

本轮后续参数确认：按“颜色我要你做的 Gary 柔光”，保留 Gary 的原有配色，其他波形采用用户所贴 JSON；深色不透明度 0.6，浅色仍为 0.32。鼠标视差关闭、颗粒 0.02、细节 medium。银色/紫粉和页面排版不变。以下截图、配置与浏览器矩阵已按更新后的柔光配方重跑；原有 134 项测试的记录属于背景初次接入，参数调整未重复运行全部单元测试。

## 直接查看

- [深色实景](http://127.0.0.1:4173/examples/demos/index.html?theme=dark&background=gradient-waves)
- [浅色实景](http://127.0.0.1:4173/examples/demos/index.html?theme=light&background=gradient-waves)
- [打开调节面板](http://127.0.0.1:4173/examples/demos/index.html?theme=dark&background=gradient-waves&customize=1)
- [原有默认网格](http://127.0.0.1:4173/examples/demos/index.html)

在 `C:\AI\UI\gary-ui` 执行 `python -B scripts/serve_portal.py --surface portal --port 4173`。
当前服务已运行，本轮没有重启。也可从 Portal → 完整 Demo → 右下角「背景实验室」进入。

## 设计与范围

采用低饱和的 Gary 柔光作为波浪初始配方，保留银色和原版紫粉供比较。
亮色是白底上的轻薄波面，暗色是黑底上的低亮度空间层次；没有添加照片。
这类运动适合展示开场，不建议用在需要持续阅读或精确比较的主区。
根据 Gary Skill，锁定原字体、导航、主标题、30px 主卡、旧 8px 基线；新样式仅作用于背景和可选面板。
200% 文字放大后，参数按字体尺寸重排为单列，面板独立滚动，关闭与导出仍可键盘操作。

直接对话基线：

- targetArtifact：`examples/demos/index.html`
- browserReport：`examples/demos/evidence/header-brand/target-browser-report.json`
- chatAuthorization：用户认可现有设计，并要求将指定 Gradient Waves 做上去、增加自定义滑块。
- changeSet：可选波浪、面板、源码/许可、失效保护、相关测试；非本轮区域不重做。
- approved-baseline-drift：六个视口/主题组合中，切背景前后主标题矩形一致；既有卡片回归确认主题材质、30px、字形和交互保持。新增按钮及背景变化为已授权范围。

Visual Route：`schemaVersion=1; skill=gary-liquidglass-ui; application=web-ui; page=report-cover; theme=dark/light; material=ultrathin; density=balanced`。
本轮实际采用 Gary Skill 的基线/降级规则、界面动效指导、TDD 与完成前验证；未创建 Session 或伪造 approvalId。

## 功能与原生文件

3 种配方、3 个颜色、14 个数值滑块、细节、颗粒、鼠标视差、暂停/播放/重播、恢复配方、JSON 配置和透明背景 PNG 导出。
默认点阵不加载波浪引擎；只有选择波浪时才加载。参数不自动写全局、不执行 shell。
20 个有效动画秒后停留为静帧；减弱动态直接呈现完整静态波面，无视差。
WebGL2 不支持、context loss、缺失本地脚本都保留网格，并可明确重试。

- 共享引擎：`patterns/shared/gradient-waves.js`
- 面板：`patterns/shared/background-lab.js` / `background-lab.css`
- 接入说明：`patterns/shared/gradient-waves-README.md`
- 版本锁：`patterns/shared/gradient-waves-lock.json`
- 原始 JSX：`provenance/react-bits/GradientWaves.jsx`
- 上游：React Bits，提交 `88501f94882ef73be1ec79639ae7d3ad7ff7f23a`
- 原始 SHA-256：`92cf6aa408e3b7fe98474c6465441ecea7a7810250bbcc4a92b905e6848ae24f`
- 两段 shader 与固定版本逐字一致；本地 WebGL2 替代 React/OGL 挂载，零新增运行依赖、零 CDN。
- 完整 MIT + Commons Clause 随 `patterns/shared/gradient-waves-LICENSE.md` 保留，只在 Gary 内部应用边界使用。

## 实际验证

| 检查 | 结果与证据 |
|---|---|
| 浏览器矩阵 | 6/6：1440、768、390 × 明暗；`qa-report.json` |
| 键盘与字体放大 | 波幅方向键/End 实际改变导出波浪像素；Escape 恢复焦点；根字号 200% 重排并操作配置导出 |
| 生命周期与失败 | 6/6：逐项核对用户波形参数与 Gary 配色、无鼠标视差、20 秒完成、暂停/重播、主题、PNG、context loss、重试、无 WebGL、非法参数、本地脚本缺失与恢复、离屏 |
| 断网 | HTTP 禁止外部请求 + file 页面 context offline，仍可渲染；`lifecycle-report.json` |
| 减弱动态 | 时间冻结、鼠标位置保持中心、禁用播放；静态内容可读 |
| 独立 PNG | `standalone-background.png` 独立打开，检查尺寸与非透明像素；`standalone-background-open.png` |
| 既有卡片/网格/字体 | `node scripts/card_material_qa.mjs`，4/4，Helvetica 与 Microsoft YaHei 实际字形确认 |
| 原有测试 | `python -B -m unittest discover -s scripts/tests -q`，134/134 |
| 契约 | `python -B scripts/validate_v2.py`、Visual Route、`target-browser-report.json` Schema 均通过 |

重跑：`node scripts/gradient_waves_qa.mjs` 与 `node scripts/gradient_waves_lifecycle_qa.mjs`。
测试对比的是暂停时 Canvas 自身的 PNG 像素，不是包含滑块数字变化的整页截图。
截图与 QA 来自本轮最终功能版本。人工查看了桌面明暗、手机、200% 重排、原版紫粉与 Gary 柔光；判断是柔光更衬内容，紫粉更适合短时展示。此判断不等于用户最终视觉批准。

## 截图与复现

- `1440-dark.png` / `1440-light.png`：实景
- `1440-dark-controls.png` / `1440-light-controls.png`：参数区
- `390-dark.png` / `390-light.png`：手机实景
- `390-light-text200.png`：真正文字放大后的单列重排
- `offline-reduced.png`：断网减弱动态
- `1440-dark-config.json` 等：真实按钮导出的配置

打开面板 → 选择渐变波浪 → 改波幅 → 暂停 → 改波幅观察静帧变化 → 重播 → 切主题 → 保存 PNG → 切回点阵。
在系统减弱动态下重做：不会播放或跟随鼠标，但颜色和几何参数仍能用于静态预览。

## 同步与限制

受管同步沿用 `scripts/runtime_projection.py check / sync --confirm <hash>`，结果保留于母本 `provenance/gradient-waves-sync.json`。
不直接编辑运行副本，不 prune 其他 runtime-only 文件。未提交、推送或发布。
原有文件包含此前未提交工作，本轮只叠加上述改动。

未验证：低端实体手机、Safari、长期功耗、React 目标构建；本轮没有新增 React 组件或录屏。
30 fps / DPR 1.5 / 约 120 万像素是运行上限，不是对所有 GPU 的帧率保证。
PNG 是透明波浪层，不是整页导出；不提供伪 SVG 或视频导出。极端自定义颜色/不透明度不保证文字对比度。
当前只在 Demo 首页开放背景试验，没有自动扩散到六个业务页或改动 Portal 默认背景。
