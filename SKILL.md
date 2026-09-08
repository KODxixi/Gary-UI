---
name: gary-liquidglass-ui
description: 使用 Gary-UI 设计、实现或审查 Liquid Glass 界面。默认在当前对话中澄清关键问题并直接实施；以本 SKILL.md 所在的完整仓库为资源根。只有用户明确要求且已配置本地 Session 集成时，才升级为受监控的 HTML 共创 Session。
---

# Gary-UI 2.0

Gary-UI 是内容可读性优先的 Liquid Glass Design System，也提供可选的 Agent–User HTML 共创集成。
公开仓库为 [KODxixi/Gary-UI](https://github.com/KODxixi/Gary-UI)。下文所有项目相对路径均从
本 `SKILL.md` 所在的完整仓库根目录解析；运行命令前先将工作目录切到该目录，不依赖盘符或用户名。

## 在自己的 Agent 中使用

- 可以直接让 Agent 读取当前 checkout 的 `SKILL.md`，随后按本文件的相对路径加载契约、样式和 Demo。
- 需要自动发现时，使用所选 Agent 支持的技能登记或目录链接方式，保留完整仓库资源树；
  单独复制这份 Markdown 不构成可用安装。克隆仓库不会自动注册任何 Agent Skill。
- 开发与维护修改写入用户选择的源码 checkout。若使用独立运行副本，该副本只读；
  同步由该安装环境负责，不从运行副本反向覆盖源码。
- 直接对话设计与静态 Demo 不需要 Session 服务、模型凭据或外部专项 Skill。
  Archify、AntV 等专项 Skill 的发现、锁定版本与缺失状态分别见下文接入指南。

## 必读顺序

1. 读 `spec/system.json` 与 `docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md`。
2. 读 `contracts/task.schema.json`，把完整任务归一化为 Task v2。
3. 读 `contracts/invocation.schema.json`，为每个 Proposal option 生成完整 Visual Route。
4. 涉及报告、图表或图示时，读 `spec/scene-recipes.json`、
   `contracts/visual-manifest.schema.json` 与 `adapters/visual/capabilities.json`。
   涉及 AntV 信息图时再读 `adapters/visual/ANTV_SKILLS.md`，按其中规则发现官方 Skill。
5. 只有决定升级 Session 后，才读 Session、Proposal、Feedback、Approval、Evidence 与 Command Result Schema。
6. 读 `DESIGN.md`、`tokens/tokens.json` 和目标 `components/<slug>.json`。
7. HTML 项目只引入 `tokens/base.css`；需要骨架时使用 `patterns/starting-points/`。
8. React/shadcn 项目再读 `adapters/react-shadcn/README.md`。

## 默认协作行为

- 默认使用当前对话，不自动创建或打开确认页面。需求已足够明确时直接实施；存在影响结果的
  歧义时，每轮只问 1–3 个最高影响问题，不为形式完整重复确认。
- Session 是按需升级能力，不是每次调用的前置步骤。只有满足以下任一条件时才建议启用：
  用户明确要求真实 HTML 共创；需要比较多个可信视觉方向；需要元素级批注或跨方案区域组合；
  对话与首版预览仍未收敛；高影响多页面治理用文字难以安全决定。
- Agent 启动 Session 前必须说明它解决的具体问题并取得用户同意；用户未同意时继续使用对话。
- `create`、`integrate`、`audit`、`govern`、纯同步与确定性维护均可走直接对话路径，
  不需要为“跳过 Session”额外辩护。
- 已启用 Session 时，`quick` 必须恰有一个 `recommended`；`compare` 与 `deep-review` 必须恰有
  三个方案，分别为一个 `recommended`、一个 `alternative` 和一个 `stretch`。
- 只有已选择 Session 路径时，Agent 才主动启动并打开 Session URL，不得只把地址留给用户寻找。
- 每轮最多突出 1–3 个高影响决定；展示理解、假设、推荐理由、风险和 changeSet。
- 使用 `session watch --timeout 45` 监听；一次等待不得超过 45 秒。
- 用户反馈后基于当前 `baseRevision` 更新同一 URL；批注节点使用稳定
  `data-gary-node-id`。
- `approvalId` 只约束已经启动的 Session：未获得匹配当前 proposal/revision 的
  `approvalId`，不得 finalize 该 Session。直接对话路径以用户当前任务指令或对话确认作为授权，
  不得伪造 `approvalId`。
- finalize 后状态为 `implementing`；只有 `session verify` 的 pass evidence 才能进入
  `verified`，只有 verified 才能 close。
- Agent 任务结束后网页不会自行唤醒模型；下一次调用使用 `session resume`。

默认闭环：

```text
normalize → 需求明确则 implement；有关键歧义则直接对话 → implement → browser/build verify
```

按需 Session 闭环：

```text
说明升级理由 → 用户同意 → start → propose → open URL → watch → feedback
→ revise → approve → reopen 或 finalize → implement → verify(pass) → close
```

### 已批准视觉基线防漂移

- `integrate` 遇到已经批准并验证的目标界面时，执行记录必须恰好选择一种基线来源，并把未被
  本轮 changeSet 明确修改的视觉区域视为锁定决定。
- Session 基线记录 `sessionId`、`approvalId` 与 `verificationId`；直接对话基线记录稳定的
  `targetArtifact`、`browserReport` 与 `chatAuthorization`。直接对话路径不得伪造 Session ID。
- 禁止用 Starting Point、其他 Proposal、通用模板或新生成风格覆盖已批准目标；本轮授权只允许
  changeSet 中列出的结构变化，不授权重做配色、材质、排版或组件语言。
- 实施前以所选基线及目标浏览器证据为准，实施后必须包含 `approved-baseline-drift` 检查，证明
  未授权区域保持一致；Session 路径写入 Evidence，直接对话路径写入最终验证回执。
- 如果基线记录损坏或文本编码异常，以可访问目标产物、浏览器报告和有效授权的可验证交集为准，
  不根据损坏文本猜测视觉决定。

### 最终稿判定（fail-closed）

- Starting Point、未样式化页面和只接通功能的骨架都只是草稿，永远不得作为最终稿交付。
- `create`、`integrate`、`govern` 只有在实际目标入口加载 Gary CSS，并由真实浏览器读取
  `--gary-control-height: 44px` 后，才允许声称完成。
- 固定检查 `gary-css-loaded` 与 `gary-browser-computed-style` 必须为 pass；目标浏览器报告使用
  label=`target-browser-report`、kind=`browser-report` 的 JSON，并通过
  `contracts/final-ui-report.schema.json`。
- React/shadcn 目标还必须在本轮对实际目标运行生产构建；固定检查
  `target-production-build` 必须为 pass，且 label=`target-production-build-report`、
  kind=`build-report` 的 JSON 必须通过 `contracts/build-report.schema.json`。
- Session 路径把上述报告写入 pass Evidence；直接对话路径在最终回执中引用同等级真实报告，
  不创建 Session receipt。缺少任一证据时只能标记为“功能骨架，未验证”，不得声称“最终稿”、
  “定稿”“完成”或 `verified`。
- Proposal 静态预览、截图观感、typecheck、单独运行 `validate_v2.py` 都不能替代目标入口、
  真实浏览器 computed-style 与目标生产构建证据。

Session surface 不能修改 Gary-UI 源码或目标项目；Portal 只承担全局 Design System 治理。
任务 approvalId 与 Portal decisionId 不能互换。当前 Session 存储仍属于维护者的可选本机集成，
不属于公共 checkout 的开箱能力，具体边界见“可选 Session 集成”。

## Agent 调用契约

外层机器权威是 `contracts/task.schema.json`。一个 Task 固定一个 applicationMode；每个 unit
选择 pageMode，视觉轴可以从 visualDefaults 继承。

内层机器权威是 `contracts/invocation.schema.json`。每个 option 的 Visual Route 必须写全
`schemaVersion`、`skill`、`application`、`page`、`theme`、`material`、`density`。
application 与 page 不得静默猜测。

发布 Proposal 时还必须满足以下交叉约束：

- proposal.mode 等于 Session/Task mode。
- visualRoute.application 等于 task.applicationMode。
- visualRoute.page 属于 task.units[].pageMode。
- 已确认 decision 不得再次开放；已拒绝 optionId 不得再次发布。
- annotation.optionId 与 combination.fromOptionId 必须属于当前 Proposal。

默认文本调用：

`使用 gary-liquidglass-ui；operation=create；application=web-ui；page=data-page；theme=dark；material=regular；density=balanced。需求明确就直接实施；有关键歧义先在当前对话问我，不要自动开启 HTML Session。`

按需 Session 调用：

`使用 gary-liquidglass-ui；operation=create；mode=compare；application=web-ui；page=data-page；需要比较三个真实视觉方向，请开启本地 HTML Session；approvalId 后实施，verify pass 后关闭。`

标准 Visual Route：

```json
{
  "schemaVersion": 1,
  "skill": "gary-liquidglass-ui",
  "application": "web-ui",
  "page": "data-page",
  "theme": "dark",
  "material": "regular",
  "density": "balanced"
}
```

使用 `python -B scripts/invocation_contract.py --application web-ui --page data-page --theme dark --material regular --density balanced`
校验 Visual Route。

### 3 × 4 路由表

| 应用模式 \ 页面模式 | `report-cover` | `image-page` | `data-page` | `manual-toc` |
|---|---|---|---|---|
| `board` | 结论概览 | 证据墙 | KPI 比较 | 快速目录 |
| `scroll-report` | 叙事开场 | 全幅证据段 | 逐段数据判断 | 章节议程 |
| `web-ui` | 任务首页 | 素材审阅 | 操作数据台 | 文档导航 |

应用模式基线：

- `application=board` → `patterns/application-modes/board.html`
- `application=scroll-report` → `patterns/application-modes/scroll-report.html`
- `application=web-ui` → `patterns/application-modes/web-ui.html`

页面模式基线：

- `report-cover` → `patterns/report-cover.html`
- `image-page` → `patterns/image-page.html`
- `data-page` → `patterns/data-page.html`
- `manual-toc` → `patterns/manual-toc.html`

实际生成从 `patterns/starting-points/preview.html` 组合，不创建 12 份副本。

### 已确认的复用配方

- 建筑前策、设计任务书与项目决策汇报优先从
  `patterns/recipes/decision-report/index.html` 起步，并完整阅读同目录 `README.md`。
- 该配方固定使用 `application=scroll-report`，单页仍按内容选择既有四种 page mode，
  不新增第五种页面模式。
- 已批准结构为：顶部 UltraThin 导航、左侧主要图表/分析图、右侧 Thick 判断卡、底部
  SolidPlate 结论条、来源抽屉，以及共享内容源的连续阅读与 16:9 演示模式。
- 配方只提供表现与交互，不携带 DDS 项目数据；正式报告必须替换为可追溯的真实证据。
- 此配方来自已确认目标界面的确定性同步。复用时若不改变上述视觉基线，可按 sync 维护；
  若改变结构、材质或信息主次，先在当前对话澄清；只有符合升级条件并获用户同意时才使用 Session。

## 可选 Session 集成

当前 `scripts/session_store.py` 的正式默认存储仍固定为维护者环境的
`C:\AI\prototypes\gary-ui-sessions`，没有供普通安装使用的持久化目录环境变量。
`GARY_UI_ALLOW_TEST_SESSION_ROOT` 仅用于测试，不得当作正式安装配置。
公开用户在配置并验证适合自己环境的 Session 集成前，继续使用直接对话和 `scripts/preview.py`，
不要运行以下有状态命令。维护者已有的源码母本与受管投影规则只适用于该维护环境。

以下命令从仓库根运行；Windows 的 `gary-ui.cmd` 只是同一 Python 入口的包装。

```text
python scripts/gary_ui.py session start --task <task.json>
python scripts/gary_ui.py session propose --session <id> --proposal <proposal.json> --writer-lease <secret>
python scripts/gary_ui.py session watch --session <id> --after <sequence> --timeout 45
python scripts/gary_ui.py session feedback --session <id> --after <sequence>
python scripts/gary_ui.py session revise --session <id> --base-revision <n> --writer-lease <secret>
python scripts/gary_ui.py session status --session <id>
python scripts/gary_ui.py session resume --session <id> --writer-lease <secret>
python scripts/gary_ui.py session reopen --session <id> --approval-id <id> --writer-lease <secret>
python scripts/gary_ui.py session finalize --session <id> --approval-id <id> --writer-lease <secret>
python scripts/gary_ui.py session verify --session <id> --evidence <evidence.json> --writer-lease <secret>
python scripts/gary_ui.py session close --session <id> --writer-lease <secret>
```

`start` 和 `resume` 返回敏感的 `writerCredential`（`start` 还返回一次性 `takeoverCredential`）。
推荐把它们只保存在当前进程的 `GARY_UI_WRITER_LEASE` 环境变量中；不得写入 HTML、反馈、
Evidence、聊天或日志。
除 start、watch、feedback、status 外的写命令必须提供 `--writer-lease` 或该环境变量。
`resume` 会轮换 Session token 与 writer capability；`resume --takeover` 只在明确授权接管时
使用，并立即使旧 capability 失效。
接管必须证明授权：传 `--writer-lease <旧 capability>` 或 `--takeover-credential <start 返回的
一次性接管凭据>`，二者至少一个有效；接管成功后 takeover 凭据轮换（新值在 resume 响应中返回）。
仅修复前创建的 legacy Session（无任何凭据材料）保留迁移宽限，且事件链会记录
`takeover_unverified_legacy` 审计事件。

发生 revision、writer capability、taskHash 或 event hash 漂移时停止写入，先读取 status。
`reopen` 只允许撤销尚未 finalize 的批准；成功回到 `feedback_received`，下一步必须 revise。
finalize 后状态进入 implementing，不能 reopen。

### Session Surface 与受保护资源

本节仅适用于已配置的 Session/Portal 治理集成；静态阅读 Portal 与 Demo 使用 `scripts/preview.py`。

- Session：`python -B scripts/serve_portal.py --surface session --port 8878`。
- Portal：`python -B scripts/serve_portal.py --surface portal --port 8878`。
- 两者不能在同一进程以 combined mode 暴露。
- 首次 Session snapshot 使用 URL token 完成握手，并设置路径限定的 HttpOnly、
  SameSite=Strict Cookie。
- artifactUrl 与 evidenceUrl 不携带 token，只接受相应路径 Cookie；不得手工给 URL 添加 token。
- Server 只绑定 `127.0.0.1`，不调用模型、不保存模型凭据。

## 不可破坏的视觉约束

- 一张页面只有一个 Scene 和一个全局遮罩；禁止 glass-in-glass。
- 默认 Scene 是纯黑/纯白底上的唯一点网格；禁止叠加线网、卡片等高线或 CSS/Canvas 双重点阵。不主动加照片或图片，除非用户明确定制。
- 完整 Demo 是 Portal、组件、模板与制图目录的视觉基线。普通卡片复用 `patterns/shared/material.js` / `patterns/shared/optical-glass.js`；实底证据板不折射。公开包使用原创光学实现，受再分发限制的旧移植仅保留在维护者本地。
- 工具操作以圆形 Lucide 图标为主，复用 `patterns/shared/icons.js` 的 `data-gary-icon` / `GaryIcons.set`，默认 44px 点击区、1.6px 描边和可访问名称；导航、分段筛选、内容选择保留文字。
- 玻璃保持 K-only 中性；状态色只用于小面积反馈。
- UltraThin、Regular、Thick、SolidPlate 分工明确；正文和表格优先 SolidPlate。
- 根节点用 `data-gary-material` 声明主材质，表面仍需对应 `gary-*` 类真正应用。
- 圆角遵循同心关系；控件、主卡、面板基准为 18、30、36px；30px 是已批准旧基线。
- 使用非对称边缘光、接触影和环境影。
- 中文正文行高默认 1.68，不为“高级感”牺牲可读性。
- 大字展示标题单行、无标点、中文最多 12 字；超长时改写短标题，完整语义放入副标题或正文，不使用 `<br>` 强制换行。
- 基础反馈用 150/250/350ms；参考卡片配方允许 200ms 光照、600ms 局部舒展与悬停单次 6s 边缘反馈，尊重 `prefers-reduced-motion`，不自动循环。接入前读取 `patterns/shared/README.md`，复用现有实现。
- 交付前在真实浏览器验证桌面、390px、键盘焦点与关键交互。

## 场景配方与制图路由

先判定内容目的，再选场景和引擎。阅读场景使用稳定正文底板与独立玻璃导航；分析场景以图表
主区、判断区和证据区组织；展示场景才允许更强玻璃、背景与有限演示动效。六种文本角色仅为
title、section-title、body、label、annotation、metric；正文默认 16px / 1.68，连续正文不强制装卡。

确定性默认路由：

- 技术架构、工作流、时序、数据流、生命周期 → Archify（JSON）。
- 定量比较、趋势、分布、构成、相关性 → Apache ECharts（JSON data + option）；必须保留单位、刻度、缺失值、来源与数据表替代。
- Markdown 大纲、研究提纲、知识层级 → Markmap（Markdown）；保留 Markdown 原生源，不承载复杂关系。
- 步骤、定性对比、结构与摘要信息图 → AntV Infographic（JSON）；完整成品读取官方 `infographic-creator`，仅语法读取官方 `infographic-syntax-creator` 及其指定引用。
- Markdown 内简单流程或已有 Mermaid 源 → Mermaid（`.mmd` / Markdown）；复杂交互与关系校验显式转 Archify 并核对语义。
- 界面操作与通用节点图标 → Lucide（JSON icon list）；必须有可访问名称，导出完整图标板或逐枚命名文件。

用户已有原生格式优先保留，但不得用思维导图承载复杂关系、用装饰形状替代定量刻度。Task v2
无需扩展 schema：把 `visuals.json` 作为既有 `brief.assets` 或 `units[].assets` 的本地资源引用。

```text
python scripts/gary_ui.py visual doctor
python scripts/gary_ui.py visual validate --manifest <visuals.json>
python scripts/gary_ui.py visual render --manifest <visuals.json> [--id <id>]
python scripts/gary_ui.py visual export --manifest <visuals.json> [--id <id>] [--format html|svg|png|pdf]
```

以上制图命令需要 Node.js；浏览器验证与导出需要本机 Chrome/Chromium/Edge，可通过
`GARY_UI_CHROME` 指定实际可执行文件。首次配置按 `adapters/visual/README.md` 与锁文件准备依赖；
静态 Demo 使用已构建资源，无需这些制图依赖。`visual doctor` 会检查额外的专项 Skill 集成，
须逐项报告缺失或失败，不能把已有 Demo 能打开等同于完整工具链已配置。

运行期不得更新 Archify、访问 CDN 或补装依赖。输出保留原生源、HTML、SVG/PNG/PDF 与生成回执；
失败候选写入 `.failed`，上一有效产物不得覆盖。未支持格式必须报错。复杂图允许独立缩放和平移，
同时提供文本结构；阅读默认静态，`prefers-reduced-motion` 下直接呈现完整内容。

复杂关系任务必须发现并完整读取已安装或仓库锁定离线包中的 `archify` 官方 Skill；随后只按任务读取 common schema、
一个匹配类型 schema 和一个匹配示例，进阶引用按需加载。Gary-UI 的
`adapters/visual/ARCHIFY_SKILL.md` 只规定路由、版本锁、主题与事务边界，不复写官方引擎方法。

信息图完整成品任务必须发现并完整读取已安装的 `infographic-creator` 官方 Skill；仅请求语法时改读
`infographic-syntax-creator` 并按其指示加载 `references/prompt.md`。官方 Skill 负责内容理解、模板
选择与语法，Gary 本地固定适配器负责 HTML/SVG/PNG/PDF；Gary 任务不得执行其上游 CDN 或
`@latest` 示例。精确提交、哈希与覆盖边界见 `adapters/visual/ANTV_SKILLS.md`。

六个完整情境 Demo 的统一入口是 `examples/demos/index.html`。本地启动命令：

```text
python scripts/preview.py --port 4173
```

打开 `http://127.0.0.1:4173/` 自动进入完整 Demo；`/portal/` 打开设计系统目录。

公开版本的验收范围、当前证据与未关闭问题统一见 [公开版验收](docs/PUBLIC_RELEASE.md)。
验收必须实际操作本次目标页面；任务涉及独立导出或事务回滚时，还须提供对应的新鲜报告。
不得用维护者旧历史、元素存在或控制台无错替代当前版本的视觉检查。

## Feedback 与区域组合

- annotations 必须写 optionId、nodeId、intent、priority 与 note。
- combinations 使用 regionId、fromOptionId 与 note，明确“哪个区域取自哪个方案”。
- approve 必须选择 selectedOptionId。
- Proposal 的 `lockedDecisions` 只携带前一 revision 已锁定值；首轮为 `[]`。冲突时先解释，不得静默覆盖。
- stretch 被拒绝后不得用相同 optionId 再次发布。

## Evidence 与完成回执

已启动 Session 时，`session verify` 的输入遵循 `contracts/evidence.schema.json`，必须匹配当前
session/proposal/revision/final approval，并包含：

- `checks`：唯一 id、pass/fail 与摘要；result=pass 时所有 checks 必须 pass。
- `acceptanceCoverage`：把当前 Task 的每项验收要求映射到一个 check 和相关 artifact label。
- `artifacts`：真实存在的截图、浏览器报告、控制台或可访问性文件。
- `skillsUsed`：真正影响 Task、Proposal、实现或验证的 Skill 名称。
- 最终稿门禁：固定检查与固定 label 的 JSON 报告必须满足上一节的 fail-closed 规则；
  React 目标额外要求实际目标生产构建报告。

`acceptanceCoverage[].requirementId` 使用零基索引稳定派生：

- `viewport:<index>` → `task.acceptance.viewports[index]`；
- `keyboard`、`browser` → 对应布尔验收值为 true 时存在；
- `visual:<index>`、`technical:<index>` → 对应 Task acceptance 数组项；
- `unit:<unitId>:<index>` → 对应 unit 的 `acceptance[index]`。

result=pass 时，coverage requirementId 必须与当前 Task 派生集合精确一致，每项恰好一次；
`checkId` 必须指向 status=pass 的 check。所有 `artifactLabels` 必须引用现有 artifact label；
每个 viewport requirement 至少引用一个 artifact，且该 artifact 的 `viewport` 与对应 Task
viewport 值匹配。

verify 会把证据复制进 Session 并生成 receipt；只有 pass 才进入 verified。Session 路径最终汇报列出
receiptId、最终 Visual Route、approvalId、checks、acceptanceCoverage、artifacts、skillsUsed 与剩余风险。
直接对话路径不创建虚构的 Session receipt 或 approvalId，但仍须报告真实浏览器/构建验证、
最终 Visual Route、skillsUsed 与剩余风险。仅阅读过 Skill 不得写入 skillsUsed；没有证据不得声称验证通过。

## 修改规则

- 先改 `tokens/tokens.json`，再同步 `tokens/base.css`。
- 组件行为先改 JSON 契约，再改 CSS/适配器；不得只修预览。
- 新组件加入 `components/index.json` 并通过验证。
- Task Session 不得直接改源码；在已启用维护者治理集成的环境中，全局默认变化走 Portal 治理。
  公共 checkout 的源码变更遵循其项目授权与贡献流程，不要求启动未配置的本机服务。
- runtime 只读，不保存虚构的同步回执；所有源修改写入当前安装明确指定的源码 checkout。
