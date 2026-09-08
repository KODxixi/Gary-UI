# Gary-UI 2.0 Project Structure

以下路径均相对于当前 checkout 根目录；公开检查与证据入口为
[公开版验收](docs/PUBLIC_RELEASE.md)。公开包不携带维护者的全部历史验收和受限旧移植。

```text
gary-ui/
├─ SKILL.md / README.md / DESIGN.md
├─ metadata.json / library-consumption.json
├─ gary-ui.cmd
├─ spec/system.json / scene-recipes.json
├─ contracts/
│  ├─ task.schema.json / invocation.schema.json
│  ├─ session.schema.json / proposal.schema.json
│  ├─ feedback.schema.json / approval.schema.json
│  ├─ evidence.schema.json / command-result.schema.json
├─ tokens/ / components/ / assets/
├─ patterns/
│  ├─ application-modes/ / starting-points/
│  └─ recipes/decision-report/       已确认的建筑决策报告复用配方
├─ adapters/react-shadcn/
├─ adapters/visual/                 固定版本本地制图适配层与 Archify 副本
├─ examples/visuals/                原生源、清单与可复用生成物
├─ examples/demos/                  六个完整情境页面、打印 PDF 与公开证据
├─ session/                         任务级共创 UI
├─ portal/                          全局治理 UI
├─ docs/GARY_UI_AGENT_COLLABORATION_WHITEPAPER.md
├─ runtime/manifest.json
└─ scripts/
   ├─ preview.py                    纯 Python 本机静态预览，默认完整 Demo
   ├─ build_public.py / build_site.py 独立公开源码包与 Pages 站点
   ├─ public_smoke.mjs              公开包、子路径与主要交互检查
   ├─ gary_ui.py                    Session + visual 命令入口
   ├─ visual_adapter.py             制图清单校验与本地 runner 桥接
   ├─ demo_browser_qa.mjs           六页真实浏览器矩阵与交互验收
   ├─ export_demo_reports.mjs       两份完整汇报页打印 PDF
   ├─ standalone_svg_qa.mjs         SVG 脱离 HTML 的浏览器验收
   ├─ export_integrity_qa.py        SVG/PNG/PDF 独立重开与渲染证据
   ├─ visual_transaction_qa.mjs     成功/失败/恢复与上一有效版本保护
   ├─ session_contract.py / session_store.py
   ├─ serve_portal.py               单一 --surface
   ├─ invocation_contract.py
   ├─ runtime_projection.py
   └─ validate_v2.py
```

任务数据只适用于已配置的可选 Session 集成，其逻辑结构如下；`<session-storage>` 不是
当前脚本提供的配置参数。实现仍含维护者的固定本机默认值，公开用户应先阅读 `SKILL.md` 的
“可选 Session 集成”，不能把此目录图当作开箱配置。静态 Demo 不创建任务存储。

```text
<session-storage>/<session-id>/
├─ task.json / state.json / events.jsonl / decisions.json
├─ proposals\<revision>\<option-id>\
├─ feedback\ / approvals\
└─ evidence\<receipt-id>\
   ├─ receipt.json
   └─ 证据文件
```

## 权威层级

1. `spec/system.json`：版本、模式与协作策略。
2. `tokens/tokens.json`、`components/*.json`：视觉值与组件 API。
3. `contracts/*.schema.json`：Task、Visual、Session、Feedback、Evidence 与命令结构。
4. `DESIGN.md`：视觉和协作不可破坏约束。
5. 白皮书：选择、命令、恢复与验收解释。
6. CSS、Patterns、Adapter、Session UI 与 Portal：投影和实现。

源码权威是当前用户明确选择的 Gary-UI checkout。使用独立 runtime 时，它是只读消费投影，
不得反向覆盖源码或保存虚构同步回执。维护者本机的母本与部署规则仅约束该维护环境，
其他克隆不要求具备相同盘符或上层目录。

## 两条互斥 Surface

本节及下方 Writer capability、生命周期仅描述可选 Session/Portal 治理服务。
普通 Demo 与 Portal 静态阅读使用 `python scripts/preview.py --port 4173`。

- `--surface session`：单次任务 Proposal、Feedback、Approval、Evidence。
- `--surface portal`：Gary-UI 全局默认与维护策略。
- 不存在 combined mode；approvalId 与 Portal decisionId 不能互换。

Session URL 的 token 只用于 snapshot/SSE/反馈。snapshot 握手后为 artifact/evidence
设置路径限定 HttpOnly Cookie；两类资源 URL 本身不携带 token。

## Writer capability

start/resume 返回 `writerCredential`，写命令以 `--writer-lease` 或
`GARY_UI_WRITER_LEASE` 使用。凭据不得进入页面、日志、Evidence 或对话。
resume 会轮换 token 与 writer capability；显式 takeover 立即使旧 capability 失效。

## 生命周期

```text
created → proposal_ready → awaiting_feedback → feedback_received
→ revising → proposal_ready → approved
approved → reopen → feedback_received
approved → finalize → implementing
implementing → verify(fail) → implementing
implementing → verify(pass) → verified → close → closed
```

Evidence receipt 包含 checks、复制后的 artifacts 及 skillsUsed。close 只接受 verified。
