# Background 导航入口 · 2026-09-08

- 授权：当前对话明确要求把右下角背景实验室移到顶部 EDITION 02 位置，文字为 Background，呈现为一行纯文字。
- targetArtifact：examples/demos/index.html；browserReport：同目录 target-browser-report.json；skillsUsed：gary-liquidglass-ui。
- changeSet：替换首页导航文字；复用原背景面板事件；移除该页浮动入口；纯文字入口在窄屏仍可见。未部署运行投影。
- gary-css-loaded / gary-browser-computed-style：pass；真实浏览器计算 control-height 为 44px。
- approved-baseline-drift：pass；修改前后同一桌面视口、深色主题下 main 与 footer 的完整 DOM 一致；未改动主题、卡片、背景和正文样式。
- 桌面：Background 为 13px、透明底、无边框；浮动 launcher 数量为 0；点击打开、Escape 关闭及焦点返回通过。
- 390×844：入口可见、页面无横向溢出；点击和 Enter 均打开原面板，Escape 关闭通过。检查后已恢复普通视口。
- 浏览器捕获的 console error 为 0；本次为低影响入口调整，未新增单元测试或重跑无关制图回归。
