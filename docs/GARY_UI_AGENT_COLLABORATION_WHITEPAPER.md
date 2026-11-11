# Gary-UI 2.0 Agent–User 协作调用白皮书

> 唯一 Skill：`gary-liquidglass-ui`。唯一可编辑母本：`C:\AI\UI\gary-ui`。

## 1. 完成定义

Gary-UI 是 Design System Kernel + 可选的 monitored local Co-design Runtime。默认协作面是
当前对话：需求明确就直接实施，有影响结果的歧义才问 1–3 个最高影响问题，不自动创建确认页。

Session 只在用户明确要求，或多方案视觉比较、元素级批注、区域组合、反复偏差收敛、高影响
多页面治理确有价值时启用；Agent 必须先说明具体收益并取得用户同意。直接对话路径以当前任务
指令或对话确认作为授权，完成条件是 Task/Visual 合法、真实浏览器/构建验证通过且最终回执列出
真实 skillsUsed。只有已启动 Session 时才要求 approvalId、Evidence receipt、verified 与 close。

## 2. 权威与边界

| 内容 | 权威 |
|---|---|
| 完整任务 | `contracts/task.schema.json` |
| 单元视觉路由 | `contracts/invocation.schema.json` |
| Session/Proposal/Feedback/Approval | 对应 Schema |
| 验证证据 | `contracts/evidence.schema.json` |
| Token / 组件 | `tokens/tokens.json` / `components/*.json` |
| 视觉约束 | `DESIGN.md` |
| 系统策略 | `spec/system.json` |

Portal 只做全局治理；Session 只做单任务共创。唯一源修改位置是
`C:\AI\UI\gary-ui`；runtime 只读，不能反向写母本或保存虚构同步回执。

## 3. 双层契约

Task v2 示例：

```json
{
  "schemaVersion": 2,
  "skill": "gary-liquidglass-ui",
  "operation": "create",
  "mode": "compare",
  "target": {
    "stack": "html",
    "scope": "项目决策看板",
    "deliveryPath": "C:\\AI\\prototypes\\decision-board"
  },
  "brief": {
    "goal": "比较三项方案并确认推荐项",
    "audience": "项目负责人",
    "content": "结论、指标、风险、证据",
    "assets": [],
    "interactions": ["方案切换", "区域组合"],
    "constraints": ["离线可用"]
  },
  "applicationMode": "board",
  "visualDefaults": {
    "theme": "dark",
    "material": "regular",
    "density": "compact"
  },
  "units": [{
    "id": "overview",
    "pageMode": "data-page",
    "content": "三方案比较",
    "assets": [],
    "visualOverrides": {},
    "acceptance": ["首屏可比较"]
  }],
  "acceptance": {
    "viewports": ["desktop", "390px"],
    "keyboard": true,
    "browser": true,
    "visual": ["信息层级清晰"],
    "technical": ["控制台无错误"]
  }
}
```

Visual Route 示例：

```json
{
  "schemaVersion": 1,
  "skill": "gary-liquidglass-ui",
  "application": "board",
  "page": "data-page",
  "theme": "dark",
  "material": "regular",
  "density": "compact"
}
```

发布时强制：

- proposal.mode = Session/Task mode；
- application = task.applicationMode；
- page 属于 task.units[].pageMode；
- recommendation 指向唯一 recommended；
- Quick 恰好一个 recommended；
- Compare/Deep Review 恰好 recommended、alternative、stretch 各一个；
- proposal.lockedDecisions 只携带前一 revision 已锁定值；首轮为 []；
- 已确认 decision 不再开放，已拒绝 optionId 不再发布；
- annotation.optionId 与 combination.fromOptionId 属于当前 Proposal。

### 3.1 已批准视觉基线

`integrate` 已有批准目标时，执行记录必须恰好选择一种来源：Session 基线记录
`sessionId / approvalId / verificationId`；直接对话基线记录稳定的
`targetArtifact / browserReport / chatAuthorization`，不得伪造 Session ID。两种来源都要锁定
changeSet 未授权区域，并在实施后执行 `approved-baseline-drift` 检查。

## 4. 协作路由与闭环

默认路径：

```text
理解并归一化任务 → 已明确则直接实施
→ 有关键歧义则当前对话提问 → 实施 → 真实浏览器/构建验证 → 回执
```

升级 Session 的判断顺序：

1. 用户是否明确要求真实 HTML 共创；
2. 是否存在多个可信视觉方向，文字无法高效比较；
3. 是否需要元素级批注或跨方案区域组合；
4. 对话与首版预览是否仍未收敛；
5. 是否为高影响多页面视觉治理，交互比较能显著降低误解。

若均不满足，不启动 Session；无需为此写“跳过理由”。满足任一条件时，Agent 先在当前对话
说明为什么值得升级，取得同意后才启动。

按需 Session 路径：

```text
start → propose → Agent 主动打开 URL → watch(≤45s)
→ feedback/区域组合 → revise → approve
→ reopen 或 finalize → implementing → verify
→ pass: verified → close
→ fail: implementing → 修复后再次 verify
```

页面允许切换三种方案、调节 theme/material/density/pageMode/layout，对
`data-gary-node-id` 执行 keep/adjust/delete/question + must/should/could，并用
regionId/fromOptionId 组合多个方案的区域。每轮只突出 1–3 个高影响决定。

## 5. 自然语言调用

```text
使用 gary-liquidglass-ui 创建项目数据看板。需求明确就直接实施；有关键歧义先在当前对话
问我，不要自动开启 HTML Session。完成后用真实浏览器验证桌面与 390px。
```

```text
使用 gary-liquidglass-ui 比较三个项目数据看板方向；mode=compare。
这次我需要在真实 HTML 中切换、批注和组合区域，请开启受监控本地 Session。
取得 approvalId 后再实施，提交真实 Evidence，verify pass 后再 close。
```

## 6. CLI 与敏感凭据

```text
gary-ui.cmd session start --task <task.json>
gary-ui.cmd session propose --session <id> --proposal <proposal.json> --writer-lease <secret>
gary-ui.cmd session watch --session <id> --after <sequence> --timeout 45
gary-ui.cmd session feedback --session <id> --after <sequence>
gary-ui.cmd session revise --session <id> --base-revision <n> --writer-lease <secret>
gary-ui.cmd session status --session <id>
gary-ui.cmd session resume --session <id> --writer-lease <secret>
gary-ui.cmd session reopen --session <id> --approval-id <id> --writer-lease <secret>
gary-ui.cmd session finalize --session <id> --approval-id <id> --writer-lease <secret>
gary-ui.cmd session verify --session <id> --evidence <evidence.json> --writer-lease <secret>
gary-ui.cmd session close --session <id> --writer-lease <secret>
```

start/resume 输出 `writerCredential`。它是秘密，不得写入页面、日志、Feedback、Evidence、
白皮书示例的真实值或聊天。优先只存当前进程的 `GARY_UI_WRITER_LEASE`。
resume 会轮换 token 与 writer capability；`--takeover` 仅用于明确授权接管，并废止旧能力。

watch 超时是 needs-human heartbeat，不是批准。reopen 只允许未 finalize 的 approval。

## 7. Surface、URL 与 Cookie

```powershell
python -B scripts/serve_portal.py --surface session --port 8878
python -B scripts/serve_portal.py --surface portal --port 8878
```

一个进程只暴露一个 surface。Session URL token 用于 snapshot/SSE/反馈；首次 snapshot
设置 artifact/evidence 专用、路径限定、HttpOnly、SameSite=Strict Cookie。artifactUrl 与
evidenceUrl 本身不携带 token，也拒绝 query token/Header token。

## 8. 按需 Session HTML 工作流

1. 读取 Token、组件契约和 Starting Point。
2. 为可批注语义元素设置稳定 `data-gary-node-id`。
3. 每个 option 输出独立 UTF-8 HTML；artifact 不访问 Bridge 或 writer credential。
4. iframe 使用 `sandbox="allow-scripts"` 和受限 postMessage。
5. 用户 approve 后 finalize；再把批准方案实施到 deliveryPath。
6. 用真实浏览器生成桌面、390px、键盘、控制台和可访问性证据。
7. verify pass 后 close。

```html
<link rel="stylesheet" href="/path/to/gary-ui/tokens/base.css">
<main class="gary-ui"
  data-gary-application-mode="web-ui"
  data-gary-page-mode="data-page"
  data-gary-theme="dark"
  data-gary-material="regular"
  data-gary-density="balanced">
  <section class="gary-glass gary-regular" data-gary-node-id="summary-card">
    <!-- 真实内容 -->
  </section>
</main>
```

### 8.1 最终稿不是功能骨架

Starting Point、Proposal HTML、未样式化页面和功能骨架都不是最终稿。两种协作路径都必须完成
目标级验证：

- pass check `gary-css-loaded` 与 `gary-browser-computed-style`；
- 固定 label=`target-browser-report` 的真实浏览器 JSON，证明实际目标加载正确样式入口并读取
  `--gary-control-height: 44px`；
- React/shadcn 额外包含 pass check `target-production-build` 与固定
  label=`target-production-build-report` 的本轮实际目标生产构建 JSON。

Session 路径把这些报告放进 `session verify` 的 pass Evidence；直接对话路径在最终回执中引用
同等级报告，不创建 Session receipt 或 approvalId。缺证据时只能写“功能骨架，未验证”。静态
预览、截图、typecheck、Adapter 自身 build 或 `validate_v2.py` 均不能替代目标级证据。

## 9. React/shadcn 工作流

Task stack 设为 `react-shadcn`。默认在当前对话澄清后直接实现；只有符合升级条件且用户同意时，
才先在 HTML Session 打磨结构并在 finalize 后阅读 adapter README/registry。只使用已正式适配的
5/15 组件，其余优先组合核心 HTML/CSS。验收包括 typecheck、build、样式入口和浏览器检查；
Session 路径再写 Evidence receipt。

## 10. Session Evidence

本节只适用于已经启动并 finalize 的 Session；直接对话路径使用第 8.1 节的目标级验证回执。

```json
{
  "schemaVersion": 1,
  "sessionId": "<session-id>",
  "proposalId": "<proposal-id>",
  "revision": 2,
  "approvalId": "apr_<24-hex>",
  "result": "pass",
  "summary": "桌面与移动端验收通过",
  "checks": [
    {"id": "desktop", "status": "pass", "summary": "桌面无溢出"},
    {"id": "mobile-390", "status": "pass", "summary": "390px 无裁切"},
    {"id": "keyboard", "status": "pass", "summary": "焦点顺序正确"},
    {"id": "browser", "status": "pass", "summary": "关键交互正常"},
    {"id": "visual-scene", "status": "pass", "summary": "仅一个 Scene"},
    {"id": "console", "status": "pass", "summary": "控制台无错误"},
    {"id": "unit-overview-390", "status": "pass", "summary": "overview 在 390px 可用"}
  ],
  "acceptanceCoverage": [
    {"requirementId": "viewport:0", "checkId": "desktop", "artifactLabels": ["desktop"]},
    {"requirementId": "viewport:1", "checkId": "mobile-390", "artifactLabels": ["mobile-390"]},
    {"requirementId": "keyboard", "checkId": "keyboard", "artifactLabels": ["browser"]},
    {"requirementId": "browser", "checkId": "browser", "artifactLabels": ["browser"]},
    {"requirementId": "visual:0", "checkId": "visual-scene", "artifactLabels": ["desktop"]},
    {"requirementId": "technical:0", "checkId": "console", "artifactLabels": ["console"]},
    {"requirementId": "unit:overview:0", "checkId": "unit-overview-390", "artifactLabels": ["mobile-390"]}
  ],
  "artifacts": [
    {
      "kind": "screenshot",
      "label": "desktop",
      "sourcePath": "C:\\path\\desktop.png",
      "viewport": "desktop"
    },
    {
      "kind": "screenshot",
      "label": "mobile-390",
      "sourcePath": "C:\\path\\mobile-390.png",
      "viewport": "390px"
    },
    {"kind": "browser-report", "label": "browser", "sourcePath": "C:\\path\\browser.json"},
    {"kind": "console-log", "label": "console", "sourcePath": "C:\\path\\console.json"}
  ],
  "skillsUsed": ["gary-liquidglass-ui"]
}
```

`acceptanceCoverage[].requirementId` 从当前 Task 使用零基索引稳定派生：

| requirementId | 对应 Task 验收要求 |
|---|---|
| `viewport:<index>` | `task.acceptance.viewports[index]` |
| `keyboard` | `task.acceptance.keyboard` 为 true |
| `browser` | `task.acceptance.browser` 为 true |
| `visual:<index>` | `task.acceptance.visual[index]` |
| `technical:<index>` | `task.acceptance.technical[index]` |
| `unit:<unitId>:<index>` | 对应 unit 的 `acceptance[index]` |

result=pass 时，coverage requirementId 必须与当前 Task 派生集合精确一致，每项恰好一次，
不能缺项或增加未知 requirementId；每个 `checkId` 必须指向 status=pass 的 check。
`artifactLabels` 只能引用本次 Evidence 中现有的 artifact label；每个 viewport requirement
至少引用一个 artifact，且该 artifact 的 `viewport` 必须与对应 Task viewport 值匹配。

Evidence/receipt 规范包含 checks、acceptanceCoverage、带哈希 artifacts 与 skillsUsed。仅阅读的 Skill
不进入 skillsUsed。

## 11. 恢复与错误表

| 情况 | 行为 |
|---|---|
| application/page 不明确 | 问一个最高影响问题，不猜 |
| Proposal 与 Task 路由不一致 | 阻断并修正 |
| Compare/Deep 少方案 | 补齐三种 kind 后重发 |
| annotation/combination optionId 非当前方案 | 阻断 |
| revision 过期 | status 后基于最新 revision |
| writer capability 缺失/过期 | 用有效 capability resume；接管需显式 takeover |
| watch 超时 | 继续监听，不当作批准 |
| approvalId 不匹配 | 不 reopen/finalize |
| finalize 后反悔 | 新建 Session |
| Evidence fail | 保持 implementing，修复后再次 verify |
| 未 verified 就 close | 拒绝 |
| Session 损坏或 hash 漂移 | 标记 corrupt、保留现场、停止写 |
| 任务结束 | 下次显式 resume，不自动唤醒模型 |

## 12. 最终验收

- 两种路径都要求 Task/Visual 合法、真实目标浏览器/构建证据通过，并列出真实 skillsUsed。
- 直接对话路径不创建 Session、approvalId 或 receipt；用户当前任务指令或对话确认即为授权。
- Session 路径要求 Proposal、Feedback、Approval、Evidence 通过契约与交叉约束。
- Session 路径在同一 URL 完成真实 HTML 反馈，且 approvalId 与 active proposal/revision 匹配。
- Session 路径 Evidence pass、receipt 可访问、状态 verified 后才 close。
- 3×4 路由、2×4×3 视觉轴、无 glass-in-glass 与真实浏览器证据齐全。
- 回执列出适用于当前路径的验证证据、skillsUsed 和剩余风险。
