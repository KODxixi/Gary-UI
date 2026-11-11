# Gradient Waves 可选背景

## 用在哪里

Gary-UI 默认仍为纯黑/纯白 + 点状网格，不变更 Portal 全局决定。
仅当用户明确选择动态背景时，用于展示首页、方案封面与章节开场。不要自动应用于长篇阅读、分析表格或所有六个 Demo。
本轮入口：`examples/demos/index.html?theme=dark&background=gradient-waves`；右下角「背景实验室」可切换回网格。
Portal 的完整 Demo 内同样可操作。参数只作用于当前页面，不写母本、不自动保存全局设置。

## 配方与交互

- Gary 柔光：保留原配色，采用用户 2026-09-07 提供的波形参数：波幅 2.6、比例 1、涌动 0、扰动 50、倾角 1.23、缩放 1.4、高度 11、速度 0.15、颗粒 0.02、中等细节；关闭鼠标视差。深色不透明度 0.60，浅色保留 0.32 以保持阅读对比。
- Gary 深色颜色仍是地平线 `#282d60`、波面 `#6976ad`、浪尖 `#c1cce6`；遵循“颜色我要你做的 Gary 柔光”，不采用所贴 custom JSON 的三个自选颜色。
- 银色三浪：已确认的用户调参默认预设，首次选择和「恢复配方」均使用它。深色地平线 `#455164`、波面 `#8193ab`、浪尖 `#dbe4ef`，浅色保留 `#b8c1cb` / `#627389` / `#c1cad6`。波幅 2、尺度 1.35、比例 0.6、涌动 0、扰动 50、倾角 1.12、缩放 1、高度 10、雾深 20、速度 0.1、中等细节、亮度 1.1；深色不透明度 0.47，浅色 0.32。颗粒开启、强度 0.01；关闭鼠标视差，仍保留强度 0.85，只有用户打开开关才生效。持续播放与减弱动态静态不变；`globalDefaultChanged: false`，不将波浪自动应用到全局页面。
- 原版紫粉：保留上游默认色和波形，Gary 将不透明度限制为配方的 0.60 / 0.35；手动调节仍可达 1。
- 自定义会保留用户选定的颜色，切主题不偷偷覆盖；「恢复配方」回到当前主题的银色波面。Gary 柔光仍可单独选择。
- 3 个颜色、14 个数值滑块、细节选择、颗粒开关、鼠标视差；Tab / 方向键 / Home / End 可操作滑块。
- Demo 可选波浪默认持续播放，暂停保留时刻，重播回到开始；不在 20 秒边界循环重置。速度为 0 时静止。最新明确指令覆盖所贴旧配置里的 20 秒；导出写入 `mode: continuous`、`durationSeconds: null`。
- reduced-motion 下直接显示静态完整波面，禁用播放与视差；不提供绕过系统偏好的强制播放。
- WebGL2 缺失或 context loss：立即保留原网格，显示原因；显式「重新加载」可重建。
- 打印不含动态背景及面板。PNG 为透明波浪图层，不是整页截图；配置导出为 JSON，可在接入代码中加载 `options`。

## 本地实现

### 自定义照片和视频

背景实验室也支持主动选择本地素材：PNG/JPEG/WebP/AVIF 最多 40 MiB，MP4/WebM/Ogg 最多 300 MiB，实际视频编码需浏览器支持。SVG、GIF 等不在本轮支持范围。
支持铺满裁切/完整显示、不透明度、替换/清除。先解码候选再切换，失败保留当前背景；旧 Blob URL 在替换/清除时释放。无上传、无自动存储，刷新需要重新选择文件。
视频静音循环，支持暂停；页面隐藏、离屏、打印和 reduced-motion 暂停，减弱动态保留已解码静帧。不会在未选择素材时增加默认照片/视频。
本地 Demo 服务 CSP 仅增加 `media-src 'self' blob:`，不开放远程媒体或连接。已运行的旧服务需要重启才能加载新策略；当前独立验收服务为 4184，未重启共享 4173。
测试：`GARY_QA_ORIGIN` 指定新服务后运行 `scripts/custom_background_qa.mjs`；证据见 `examples/demos/evidence/custom-background/`。

原作展示与交互：[React Bits Gradient Waves](https://reactbits.dev/backgrounds/gradient-waves)。

精确版本、哈希、来源见 [版本锁](gradient-waves-lock.json)，[完整许可](gradient-waves-LICENSE.md)。
原生 JSX 快照保留于母本 `provenance/react-bits/GradientWaves.jsx`，两段着色器原样嵌入
[共享引擎](gradient-waves.js)。不额外安装 React / OGL，不从 CDN 加载，无运行期升级。
主页面已通过 `shared/demo.css` 导入 Gary `tokens/base.css`；
`background-lab.css` 只补充可选面板样式，不建立第二份字体、主题或卡片 token。

```html
<!-- 宿主已有唯一 .gary-scene，勿再添加第二个 Scene -->
<script src="/patterns/shared/gradient-waves.js"></script>
<script>
  const host = document.querySelector('.gary-scene');
  const waves = GaryGradientWaves.mount(host, {
    horizonColor: '#282d60', waveColor: '#6976ad', crestColor: '#c1cce6',
    speed: 0.15, amplitude: 2.6, waveScale: 0.6, waveRatio: 1,
    swell: 0, turbulence: 50, tilt: 1.23, zoom: 1.4, height: 11,
    fogDepth: 15, detail: 'medium', brightness: 1, opacity: 0.6,
    grain: true, grainIntensity: 0.02, mouseInteraction: false, parallaxStrength: 0
  }, {durationSeconds: null}); // 明确持续播放；省略第三参数则维持通用引擎 20 秒预算
  // 宿主应根据 waves.state.status 显示波浪或回退网格
  // waves.update(options); waves.pause(); waves.play(); waves.replay();
  // 卸载时 waves.destroy(); PNG: waves.snapshot()
</script>
```

Canvas 样式与切换示范见 [面板 CSS](background-lab.css) / [面板控制器](background-lab.js)。
引擎初始挂载即按选项播放；仅在主动选择时挂载。React 消费方可在客户端 effect 中调用同一 mount，
cleanup 调 destroy，不维护另一份 shader。本轮没有新增或验证 React 组件，不能据此宣称 React 目标已验收。

## 性能边界

最多 30 fps、DPR 1.5、约 120 万绘制像素；Gary 柔光和银色三浪按用户配置固定中等 70 次步进，原版配方手机默认 40，桌面 70，高细节 110。
离屏、隐藏标签页停止计时和绘制，恢复不跳时。静帧只在参数、尺寸变化时重绘；网格在波浪启用时不绘制。
这些是预算上限，不是所有 GPU 的帧率保证。低端实体手机、Safari、长期功耗尚未验证。
上游为 MIT + Commons Clause，按现有 internal 边界只作为 Gary 应用的一部分使用，不将组件单独出售、再许可或再分发。

验收脚本：`scripts/gradient_waves_qa.mjs`、`scripts/gradient_waves_lifecycle_qa.mjs`。
证据在 `examples/demos/evidence/gradient-waves/`。
