# 本机维护工作流（历史入口）

此文档记录维护者机器上的 Session、部署与旧验收配置。公开使用请从仓库根 README 开始；文中的 C 盘路径不是安装前提。

# Gary-UI 2.0

Gary-UI 是位于 `C:\AI\UI\gary-ui` 的 Liquid Glass Design System 唯一真相源。
统一 UI 工作流入口是 `gary-liquidglass-ui`；制图按下文路由调用官方专项 Skill。默认在当前对话中协作，受监控的真实 HTML Session
是按需升级能力；部署后的 runtime 只读。

## 60 秒开始

```text
使用 gary-liquidglass-ui 创建这个界面。
需求明确就直接实施；有影响结果的歧义先在当前对话问我，不要自动开启 HTML Session。
```

只有用户明确要求，或确需多方案视觉比较、元素级批注、区域组合、反复偏差收敛、高影响
多页面治理时，才在说明
理由并取得同意后启用 Session：

```powershell
cd C:\AI\UI\gary-ui
gary-ui.cmd session start --task <task.json>
```

Agent 应主动打开 `start` 返回的 sessionUrl。`writerCredential` 是写入 capability：
只放在当前进程的 `GARY_UI_WRITER_LEASE`，不得写入页面、反馈、证据、聊天或日志。

```powershell
gary-ui.cmd session propose --session <id> --proposal <proposal.json>
gary-ui.cmd session watch --session <id> --after <sequence> --timeout 45
gary-ui.cmd session feedback --session <id> --after <sequence>
gary-ui.cmd session revise --session <id> --base-revision <n>
gary-ui.cmd session status --session <id>
gary-ui.cmd session resume --session <id> [--takeover] [--takeover-credential <token>]
gary-ui.cmd session reopen --session <id> --approval-id <id>
gary-ui.cmd session finalize --session <id> --approval-id <id>
gary-ui.cmd session verify --session <id> --evidence <evidence.json>
gary-ui.cmd session close --session <id>
```

除 start、watch、feedback、status 外的写命令需要 `--writer-lease` 或
`GARY_UI_WRITER_LEASE`。resume 会轮换 token 与 writer capability；只有明确接管时使用
`--takeover`，且接管必须持有旧 writer capability 或 `start` 返回的一次性
`--takeover-credential`（接管成功后轮换）。

## 协作路由

- 默认：当前对话 → 必要时问 1–3 个高影响问题 → 直接实施 → 真实浏览器/构建验证。
- 需求已经明确时不重复确认；不自动创建确认页面。
- Session 只在用户明确要求或视觉问题确需交互比较时启用，启动前必须让用户知情并同意。
- create、integrate、audit、govern 都可直接走对话；不需要记录“跳过 Session”的理由。
- approvalId 只属于已启动 Session，直接对话路径不得伪造 approvalId。

## 按需 Session 闭环

```text
Task v2 → HTML Proposal → 页面反馈/区域组合 → Revision → Approval
→ Finalize → Implementing → Verify(pass) → Verified → Close
```

- Quick 恰好一个 recommended。
- Compare/Deep Review 恰好三个：recommended、alternative、stretch 各一个。
- watch 最多 45 秒；任务结束后页面不会自动唤醒 Agent。
- Session 未获得当前 revision 的 approvalId 不得 finalize。
- close 只接受 verified；失败 Evidence 保持 implementing。

Session 数据只写 `C:\AI\prototypes\gary-ui-sessions\<session-id>`。Session surface 与 Portal
surface 分离：

```powershell
python -B scripts/serve_portal.py --surface session --port 8878
python -B scripts/serve_portal.py --surface portal --port 8878
```

两者不存在 combined mode。artifact/evidence URL 不含 token，首次 snapshot 握手后使用路径限定的
HttpOnly、SameSite=Strict Cookie。

## 双层契约

- `contracts/task.schema.json`：目标、受众、栈、应用模式、页面单元和验收。
- `contracts/invocation.schema.json`：每个 option 的 application/page/theme/material/density。
- `contracts/evidence.schema.json`：verify 的 checks、acceptanceCoverage、artifacts 与 skillsUsed。

Proposal 发布时必须满足：application 与 Task 相同；page 属于 Task units；annotation.optionId
与 combination.fromOptionId 属于当前 Proposal；已拒绝 optionId 不得再次发布。

Evidence 的 `acceptanceCoverage` 使用零基稳定 ID：`viewport:<index>`、布尔值为 true 时的
`keyboard` / `browser`、`visual:<index>`、`technical:<index>`，以及
`unit:<unitId>:<index>`。result=pass 时 coverage 必须精确覆盖当前 Task 派生的全部要求，
每项恰好一次；`checkId` 指向 status=pass 的 check。`artifactLabels` 只能引用现有 artifact；
viewport 要求至少引用一个 `viewport` 值与 Task 对应值匹配的 artifact。

```json
{
  "schemaVersion": 1,
  "skill": "gary-liquidglass-ui",
  "application": "web-ui",
  "page": "data-page",
  "theme": "dark",
  "material": "ultrathin",
  "density": "balanced"
}
```

## HTML 使用

```html
<link rel="stylesheet" href="/path/to/gary-ui/tokens/base.css">
<div class="gary-scene" data-gary-scene-engine="dot-grid" aria-hidden="true"></div>
<main class="gary-ui"
  data-gary-application-mode="web-ui"
  data-gary-page-mode="data-page"
  data-gary-theme="dark"
  data-gary-material="ultrathin"
  data-gary-density="balanced">
  <section class="gary-glass-card" data-gary-material="glass" data-gary-refraction data-gary-node-id="summary-card">
    <!-- 真实内容 -->
    <button type="button" data-gary-icon="copy" aria-label="复制摘要">复制摘要</button>
  </section>
</main>
<script src="/path/to/gary-ui/patterns/shared/dot-grid.js"></script>
<script src="/path/to/gary-ui/patterns/shared/icons.js"></script>
<script src="/path/to/gary-ui/patterns/shared/material.js"></script>
<script src="/path/to/gary-ui/patterns/shared/glass-surface.js"></script>
```

完整 Demo 是统一视觉基线：Portal、组件、模板与制图目录复用同一光学卡片；工具操作默认圆形 Lucide 图标，导航与筛选保留文字。图标使用本地 `patterns/shared/icons.js`，通过 `GaryIcons.set(button, icon, label)` 更新状态。

默认页面背景为深色纯黑或浅色纯白，只保留一套点网格，禁止叠加线网与卡片等高线。本地点阵提供鼠标邻域反馈；
`prefers-reduced-motion` 下改为完整静态点阵。不会自动加载图片，只在用户显式定制时使用图片 Scene。

React/shadcn 读取 `adapters/react-shadcn/README.md`；适配范围保持
`5/15-demand-driven`。完整流程见
`docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md`。

## 本地制图

阅读、分析、展示三类场景分别以稳定正文、数据判断、有限玻璃表现为主，机器权威见
`spec/scene-recipes.json`。制图清单保留各引擎原生源，不转换为统一图形语言：Archify 负责复杂
关系图，ECharts 负责定量图表，Markmap 负责 Markdown 层级，AntV Infographic 负责精选信息图，
Mermaid 负责简单流程，Lucide 负责界面图标。

```powershell
.\gary-ui.cmd visual doctor
.\gary-ui.cmd visual validate --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual render --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual export --manifest examples\visuals\visuals.json
```

生成物为无 CDN 的自包含 HTML，并保留 native source、SVG、PNG、打印版 PDF 与回执。失败不会
覆盖上一有效结果。样例入口为 `examples/visuals/outputs/index.html`，详细能力和版本见
`adapters/visual/README.md`、`capabilities.json` 与 `toolchain.lock.json`。
部署后的 runtime 仍只读；实际任务把 visual manifest、原生源与 outputRoot 放在任务目标目录。

## 六个完整 Demo

先启动同一个只读本地服务，再从 Portal 的“完整 Demo”或统一首页进入：

```powershell
cd C:\AI\UI\gary-ui
python -B scripts\serve_portal.py --surface portal --port 4173
```

统一入口为 `http://127.0.0.1:4173/examples/demos/index.html`。Web UI 包含业务分析工作台与知识
资源工作台；Kanban 包含项目运行看板与管理层汇报大屏；HTML 汇报页包含长篇决策报告与项目
方案汇报。六页为共享 Token/CSS 与脚本的 HTML 页面，页面可切换明暗主题、查看原生源与导出结果；
展示页提供真实播放/暂停/重播，reduced-motion 直接呈现全部内容。两份完整打印 PDF 已作为固定
产物保存在各报告目录。浏览器矩阵、独立导出与事务回滚证据位于 `examples/demos/evidence` 和
`examples/visuals/evidence`。

首页顶部主题切换左侧的纯文字 **Background** 打开背景实验室，替代原 `EDITION 02` 标签及
右下角浮动入口；手机宽度同样可用，支持 Enter 打开、Escape 关闭并返回焦点。面板提供本地点阵、
渐变波浪和本地照片/视频预览；本地素材不上传，刷新后需重新选择。实现与验证见
[Background 入口验收](examples/demos/evidence/background-nav/acceptance.md)。

### 当前收尾状态（2026-09-08）

- 六页 Demo、官方专项 Skill 接入和 Background 入口已交付；详细独立验收保留在母本
  `docs/GARY_UI_INDEPENDENT_ACCEPTANCE_2026-09-08.md`。
- 整体仍有两项未修复问题：分析页切换区域后“查看具体事项”固定打开江苏事项；图表导出仍使用
  全部区域数据，不跟随当前筛选。收尾不代表这两项已通过复验。
- 后续 UI 自验发现并修复了响应式菜单、内嵌页裁切、主题传递、组件误筛选和复制模板故障；
  本轮范围、截图、失败记录及最终结果见 [UI 独立复验](examples/demos/evidence/independent-recheck/acceptance.md)。
- 本次更新母本文档及页面入口，未提交、发布或同步 runtime；使用运行投影前重新执行
  `python -B scripts/runtime_projection.py check`，不能沿用入口改动前的哈希检查结果。


Archify 不只作为引擎存在：官方 `SKILL.md` 固定在提交
`c6519401f7b91b9d43011657880893b0a8955548`，受管母本为 `C:\AI\skills\archify`，Gary-UI
只维护调用规则和主题/事务适配，不复制维护官方推理方法。加载与引用范围见
`adapters/visual/ARCHIFY_SKILL.md`。

AntV Infographic 同样不是“仅安装引擎”：官方 `infographic-creator` 与
`infographic-syntax-creator` 固定在提交 `2ea1894255e4002c7735586778be86d13ec30346`，受管母本位于
`C:\AI\skills`。它们负责理解内容、选择模板和生成语法；Gary 继续用本地固定 0.2.20 适配器完成
无 CDN 渲染、嵌入和导出，避免重复维护引擎。详见 `adapters/visual/ANTV_SKILLS.md`。

## DSH 插件（gary-ui-dsh）

DSH 里以 preset + 工具插件形式装配：`gary_ui_serve`（本机只读静态预览）与
`gary_ui_emit`（生成完全自包含 HTML，样式与资源全部内联，拷到任何交付路径都不坏）。
preset 为「Gary-UI 设计系统」，插件母库 `adapters/dsh/`，详见
`adapters/dsh/README.md`。

建筑前策、设计任务书与项目决策汇报可直接使用
`patterns/recipes/decision-report/index.html`。该配方提供连续阅读、16:9 演示、左侧主要视觉、
右侧判断卡、底部结论条与来源抽屉；项目数据和证据必须由消费项目接入。

## 验证与 runtime

```powershell
python -B scripts/validate_v2.py
python -B scripts/invocation_contract.py --application web-ui --page data-page --theme dark --material regular --density balanced
python -B scripts/runtime_projection.py check
```

runtime manifest 只投影 Agent 消费文件。实际 runtime 对消费者只读；所有源修改只发生在
`C:\AI\UI\gary-ui`。投影命令的 stdout 结果不是持久化或权威同步回执。

视觉一致性复验与截图见 [全系统对齐记录](examples/demos/evidence/system-consistency/acceptance.md)；复验命令为 `node scripts/card_material_qa.mjs`。

响应式导航与主题传递运行 `node scripts/portal_acceptance_qa.mjs`；复制出的 HTML 独立加载运行
`node scripts/starter_generated_qa.mjs`。这些浏览器检查会写入证据，应全部结束后再运行 Python
测试，避免投影测试复制母本期间证据文件变化。复制骨架依赖生成时的母本资源服务，不是离线单文件交付。

Portal 与完整 Demo 的顶栏入口保持一致：纯文字 `Background` 只打开共享背景功能卡；旁边的圆形深浅按钮独立切换主题。不要把二者合并进“显示设置”，也不要把 Background 改成图标按钮。Portal 的视口、材质和背景动态覆盖设置位于“基础 → 材质”。
