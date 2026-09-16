# Glass Surface 展示卡片

参考 [React Bits Glass Surface](https://reactbits.dev/components/glass-surface)，固定源码与许可见
[版本锁](glass-surface-lock.json) / [完整许可](glass-surface-LICENSE.md)。
母本原始 JSX 在 `provenance/react-bits/GlassSurface.jsx`。本地零依赖 DOM 适配器复用其 SVG 位移贴图、RGB 分通道和 screen 合成方法，不安装或重复维护 React 引擎。

## 明确选择才启用

目前只应用于 Demo 首页三个情境入口。其余卡片、导航、连续正文与表格不改成折射玻璃。
卡片沿用 30px 圆角及 Gary 字体，背景通过 `backdrop-filter` 折射，文字本身不使用 filter。
 样式权威仍是 `tokens/base.css` 导入的 `components/components.css`；refraction token 同时登记于 `tokens/tokens.json`。
第三张卡片在此模式隐藏原装饰等高线，三张不叠加环绕边缘动画，以免与背景动态争夺注意力。

```html
<!-- 页面已有 tokens/base.css 与 shared/material.js -->
<a href="target.html" class="scene-entry" data-gary-material="glass" data-gary-refraction>内容</a>
<script src="/patterns/shared/glass-surface.js"></script>
```

ResizeObserver 更新本地 SVG 贴图尺寸，每卡唯一 filter ID。移除卡片时释放观察器。
React 可通过相同 DOM 属性与共享 CSS 接入，但本轮未验证实际 React 页面，不宣称 React 组件已交付。

## 浏览器与验收

用户后续要求更强折射：默认强度从 100 提高至 180；背景实验室提供 0–300 滑块。
`GaryGlassSurface.setStrength(value)` 同步更新现有卡片与后续挂载默认值，仅改变背景位移，不改变字体、卡片尺寸或文字滤镜。
0 代表关闭位移，100 可对照上一版，180 为新默认，300 为上限；无 SVG backdrop 支持的降级浏览器无法产生等效位移。

- Chrome 实测本地 SVG backdrop filter 和实际像素位移；并非仅检查存在 SVG。
- Safari、Firefox 或 CSS 不支持时保守使用原 12px 中性磨砂底板；这两个浏览器的真实设备尚未验证。
- `?glass=frosted` 保留本轮前材质用于对照；`?glass=fallback` 强制降级用于测试。
- reduced-motion 静态呈现；打印去除折射。SVG/贴图无外链、无运行期网络与安装。
- `node scripts/glass_surface_qa.mjs`：明暗 × 1440/768/390、200% 文字、键盘、基线漂移、位移开关像素对照。
- `node scripts/glass_surface_fallback_qa.mjs`：强制与能力降级、file 断网、动态背景、尺寸重建、打印。
- 证据：`examples/demos/evidence/glass-surface/`。这是 Web 折射近似，不等同于 Apple 原生系统材质。
