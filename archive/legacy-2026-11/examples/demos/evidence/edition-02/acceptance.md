# Gary-UI Demo Edition 02 验收报告

日期：2026-09-07。范围：六页 Demo 重做、共享实现、实际嵌图与导出、Portal 入口。
这是交给用户独立审美验收的候选版本，不把自动化通过等同于 Apple 发布会级质量认证。

## 打开与启动

首页：http://127.0.0.1:4173/examples/demos/index.html
Portal：http://127.0.0.1:4173/portal/#demos

```powershell
cd C:\AI\UI\gary-ui
python -B scripts\serve_portal.py --surface portal --port 4173
```

已有 4173 服务时直接打开，不要重复启动或重启共享服务。

| 页面 | 情境 | 相对入口 | 操作 |
|---|---|---|---|
| 交付脉冲 | Web UI / 分析 | web-analysis/index.html | 区域筛选联动指标、趋势、判断与表格；详情；加载、空、错误、恢复 |
| 项目知识库 | Web UI / 阅读 | web-reading/index.html | 搜索、文章切换、连续中文阅读、Markmap、来源展开 |
| 项目运行看板 | Kanban / 分析 | project-kanban/index.html | 状态筛选、工作项详情、风险、Mermaid 完成路径 |
| 管理层简报 | Kanban / 展示 | executive-board/index.html | 有限播放、暂停、恢复、重播、静态阅读、ECharts、Archify |
| 交付决策报告 | HTML 报告 / 阅读 | research-report/index.html | 目录锚点、长正文、实际业务图表、执行表、来源、PDF |
| 华东交付方案 | HTML 报告 / 展示 | proposal-presentation/index.html | 章节叙事、三地对比、关系图、步骤信息图、有限动效、PDF |

## 设计协调

- 保留 Helvetica / Microsoft YaHei 字体栈、30px 主卡圆角与旧 8px 基线；主标题采用无标点单行短句，完整意义留在副标题和正文。
- 深色纯黑、浅色纯白；只用本地低对比点阵和指针交互。没有默认照片、在线图片或假品牌媒体。
- 分析：指标共享底板与对齐，图表紧邻判断和证据，不把所有内容排成等权卡片。
- 阅读：侧栏检索与连续正文分工，合适行宽、长表格独立滚动，玻璃主要用于导航。
- 展示：大数字和章节留白建立主次，演示上限 2.4 秒，暂停保留进度，静态/减弱动态完整呈现。
- 六页使用同一份人工编制的“华东服务交付计划”验收数据，不是真实经营结论。修正 8 月趋势终点与完成率不一致；图表从零基线起，保留目标、单位、表格与来源。
- 不良对照：整页等权卡片、正文全装玻璃、小字塞完整关系图、不同页面重复同一工具截图。此版分别采用共享指标条、连续章节、图内滚动加文本结构、项目专属图形源。

## 实现和产物

共享实现：`../../shared/demo.css`、`../../shared/demo.js`、`../../shared/chart-policy.js`；案例定义：`../../demo-manifest.json`。
数据权威：`../../data/project-data.js`。图形清单：`../../visuals/visuals.json`。
原生源：`../../visuals/sources/`；双主题 HTML / SVG / PNG：`../../visuals/outputs/`。
两份完整 PDF 位于 `../../research-report/research-report.pdf` 与 `../../proposal-presentation/proposal-presentation.pdf`。
Lucide 操作图标通过本地最小 bundle 使用。十类工具画廊保留在 `../../../visuals/outputs/index.html`。

```powershell
node scripts/build_demo_assets.mjs
python -B scripts/gary_ui.py visual validate --manifest examples/demos/visuals/visuals.json
python -B scripts/gary_ui.py visual render --manifest examples/demos/visuals/visuals.json
python -B scripts/gary_ui.py visual export --manifest examples/demos/visuals/visuals.json
node scripts/export_demo_reports.mjs
```

固定版本：Archify `2.17.0-dev.1` / `c6519401f7b91b9d43011657880893b0a8955548`；ECharts `6.1.0`；Markmap lib/view `0.18.12`；AntV Infographic `0.2.20`；Mermaid `11.17.2`；Lucide `1.41.0`；Playwright Core `1.63.0`。未安装、升级或替换依赖。
本轮读取已锁定官方 Archify Skill、架构 schema 与官方例子，以及 AntV Creator Skill / Gary 接入约定；依此编写新项目图源，经现有适配器生成，没有重复维护引擎。

## 本轮发现并修复

1. Archify 工具栏从系统/存储覆盖 manifest 主题：受控适配明确清单初始值，保留用户手动切换，真实浏览器测试覆盖重载与嵌入。
2. Archify SVG 辅助雷达被误组装成图标板：导出只选主图直接 SVG；固化 `fill:none`，避免产生黑色填充。新增回归先复现失败再修复。
3. 移动端关系图被整体缩小：阅读嵌入保留可读画布、滚动浏览与独立缩放入口，旁附完整文字结构。
4. PDF 关系图裁切：打印单独适配宽度和 iframe 高度，自动展开文字结构；复审方案 PDF 第 3 页的完整六节点、五连线和图例。
5. 移动报告容器被长内容撑宽、指标条继承旧卡片分割：修正最小宽度和共享底板样式。

## 最终验证与证据

| 检查 | 实际结果 |
|---|---|
| 三档视口 × 双主题 × 六页 | 36 / 36 |
| 六页桌面和手机交互、真实 200% 字号、减弱动态 | 12 / 12 |
| 既有 Demo / Portal 浏览器回归 | 44 / 44 |
| 新项目独立 SVG / PNG | 20 / 20 |
| HTTP 首页分类、主题、源/导出链接、六页与 Portal 嵌入 | 5 / 5 |
| Python 项目回归 | 134 / 134 |
| 制图适配器回归 | 17 / 17 |
| final-ui 记录 schema | 6 / 6 |
| 本轮原生源真实 validate | 10 / 10 |
| 报告 PDF | 2 份生成成功；方案 6 页，含完整关系图与展开文本 |

受管同步使用 `scripts/runtime_projection.py check` 的精确哈希确认后执行 `sync`，
同步结果单独记录在母本 `provenance/demo-edition-02-sync.json`，不将 runtime-only 文件自动删除。

以同目录最终 JSON 为准：`layout-report.json`、`interaction-report.json`、`standalone-export-report.json`、`http-report.json`。
截图：`<页面>-dark.png` / `-light.png` 为桌面首屏；`-mobile.png` 为手机；`<页面>-390-text200.png` 为真实 200% 根字号；`<页面>-390-embed-0.png` 为图形可见区域。
独立图导出截图：`standalone-*.png`；打印复审：`proposal-pdf-page3.png`。
`*-target-browser-report.json` 是现有 final-ui 协议兼容记录，仅证明样式入口/基本结构，不独立代表视觉验收。

复现：`node scripts/demo_edition_qa.mjs`；`node scripts/demo_interaction_qa.mjs`；`node scripts/demo_browser_qa.mjs`；`node scripts/demo_export_qa.mjs`；`node scripts/demo_http_qa.mjs`。
Python 回归：`python -B -m unittest discover -s scripts/tests -q`。适配器回归：在 `adapters/visual` 执行 `npm test`。

## 验收边界

- 本轮实际使用 Chromium，1440 / 768 / 390 为模拟视口，不等于实体手机、Safari 或系统字体渲染全覆盖。
- 断网证据为浏览器阻断公共 HTTP(S)，保留本地 file / loopback；未更改系统网络配置。
- 200% 是根字号改到 32px 并检查正文与操作、重排，不是页面缩放截图。
- Chromium 全页截图对屏外 iframe 可能留白；已滚动到实际图形可见区域另截图，不能用整页截屏中的空白推断服务失败。
- SVG / PNG 独立打开及 PDF 页面复审不等于所有打印机硬件验收。未录制短视频，交互可按上述自动化脚本复现。
- 本轮没有再创建新的独立 Agent 会话；不把本轮工具调用冒充新会话 Skill 发现测试。旧整改新会话证据保留，不在本轮重做范围内重新认证。
- 保留未提交和无关改动，未提交、推送、发布、全局部署或清理 runtime-only 文件。
