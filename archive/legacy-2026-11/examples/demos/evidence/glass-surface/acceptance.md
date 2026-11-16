# 银色三浪与展示玻璃验收

> 后续预设确认已覆盖下文历史波形：最新参数见 `../gradient-waves/approved-default.json` 与 `approved-default.md`。本目录截图和矩阵已按最新默认值重跑；历史授权和改动说明保留，不代表当前参数。

日期：2026-09-07。范围仅为 Demo 首页可选波浪和三个情境入口，不代表六个业务 Demo 或完整制图链路重新验收。

## 查看与操作

- [银色三浪 持续播放](http://127.0.0.1:4173/examples/demos/index.html?theme=dark&background=gradient-waves)
- [浅色](http://127.0.0.1:4173/examples/demos/index.html?theme=light&background=gradient-waves)
- [同背景 原磨砂卡片对照](http://127.0.0.1:4173/examples/demos/index.html?theme=dark&background=gradient-waves&glass=frosted)
- 当前 4173 服务未重启；如未启动，在 `C:\AI\UI\gary-ui` 执行 `python -B scripts/serve_portal.py --surface portal --port 4173`。
- 右下角背景实验室：暂停、继续、重播、调整参数、恢复银色三浪、导出 JSON、保存波面 PNG。

用户最新 JSON 的深色 options 全量保留：银色 #455164 / #8193ab / #dbe4ef，波幅 2.9、尺度 0.95、比例 0.6、倾角 1.42、高度 13、雾深 18、透明度 0.42 等。颗粒和鼠标关闭；存储的颗粒强度 0.05、视差 0.85 不会自行启用。浅色保留原银色主题映射和 0.32 透明度。
明确的“默认持续播放”覆盖所贴旧 JSON 的 durationSeconds 20。导出使用 continuous / null；连续时间推进，不在 20 秒强行回绕。系统减弱动态仍静态，隐藏页面或离屏暂停渲染，用户暂停优先。全局默认仍是点状网格。

## 卡片与锁定基线

采用 React Bits GlassSurface 的 SVG 位移贴图与 RGB 分通道方法，只作用背景、不扭曲文字。主卡 30px、字体、标题、导航、页面几何与内容不变。仅三个入口选择新材质，第三张不再叠加原装饰线和边缘环绕动画。
版本锁与许可在 `patterns/shared/glass-surface-lock.json` 和同目录 LICENSE；波浪原始着色器锁定版本不变。未安装依赖、无运行期 CDN。

Gary Skill 执行记录：operation=integrate；Visual Route 为 web-ui / report-cover / dark 或 light / ultrathin / balanced。直接对话 targetArtifact=examples/demos/index.html；基线 browserReport=examples/demos/evidence/header-brand/target-browser-report.json；授权为用户指定卡片折射、银色波面、三浪参数和持续播放。未创建 Session，也未伪造 approvalId。
技能影响：保留未授权区域，使用共享 token 与降级；TDD 先捕获参数不符和旧 20 秒自动停止，再改实现。

## 最终版本证据

- `node scripts/glass_surface_qa.mjs`：6/6（1440、768、390 × 明暗），包括 200% 根文字尺寸、焦点/Enter 导航、30px、无横向溢出、内容与矩形基线相等、阻断外网。
- 桌面明暗各用同一冻结背景，将位移归零但保持文字/边框/阴影不变，实际截图像素不同；`dark-refraction-on.png` / `dark-refraction-zero.png` 和 light 对照证明背景位移真实生效。
- `node scripts/glass_surface_fallback_qa.mjs`：4/4，强制降级、模拟能力不足、file 真断网、动态背景像素变化；同时检查缩放后贴图尺寸、每卡唯一 filter、打印去折射。
- `node scripts/gradient_waves_qa.mjs`：6/6，波浪与面板的响应式、明暗、200% 文字、控件、导出和网络检查。证据在 `../gradient-waves/`。
- `node scripts/gradient_waves_lifecycle_qa.mjs`：7/7，新增银色 options 精确比较、真实等待超过 20 秒仍 playing，暂停冻结、重播回零、导出 continuous/null；保留上下文丢失、缺失脚本、重试、离屏和断网减弱动态。
- 新截图：本目录 `{width}-{theme}-after.png` 与 `text200.png`；已人工查看最终 1440 深色和 390 浅色，文字清晰，浪面穿过卡片时有明显折射，浅色更克制。视觉偏好仍由用户验收，不用自动通过替代审美判断。
- `target-browser-report.json`：真实目标 CSS 加载、44px 控件、单 Scene、无嵌套玻璃、无页面脚本错误。结构门禁不是视觉质量证明。
- 配置文件：`../gradient-waves/silver-three-waves.json`；独立 PNG：`../gradient-waves/standalone-background.png`（已独立打开验证完整非空图层）。

## 限制

Chrome 实测；Safari / Firefox 仅保守降级策略，未在对应真实浏览器验收。低端实体手机、长期 GPU 功耗未验证。此材质为 Web 折射近似，不是 Apple 原生材质。共享 React 样式已构建与类型检查，但未验收实际 React 消费页面。无提交、推送、发布或公共部署。

受管同步回执保存在 `provenance/silver-waves-glass-sync.json`；runtime-only 文件不清理。
