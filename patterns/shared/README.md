# Gary 共享页面实现

- `material.js`：共享卡片交互和材质挂载；不创建装饰线网或等高线。
- `dot-grid.js`：唯一默认点阵，响应主题、视口、指针与减弱动态偏好。
- `web-bar.js`：滚动顶栏、圆形菜单、键盘与焦点行为。
- `icons.js` / `icons-entry.mjs`：固定 Lucide 图标子集，使用 `GaryIcons.set(button, icon, label)` 更新状态。
- `optical-glass.js`：Gary 原创边缘法线折射，前景内容保持稳定。
- `ambient-waves.js`：Gary 原创 Canvas 环境波面，主动选择后才运行。
- `background-lab.js`：纯文字 Background 入口、材质强度、本地照片/视频及波面参数；主题按钮独立。

用 `tokens/base.css` 导入共享组件样式。完整 Demo 是默认视觉基线；密集表格和正文使用稳定底板，工具操作默认44px圆形图标。

实现与许可证见 [SURFACES.md](SURFACES.md) 和根目录 [MIT](../../LICENSE)。系统字体来自宿主设备；G × 建筑体块标志是原创SVG，未作商标注册保证。
