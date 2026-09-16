# Changelog

## Unreleased — 2026-09-15（Apple quality layer）

- 以 MIT `apple-design` Skill 为 Apple 设计逻辑的首要入口，并用 Apple 官方 HIG 校验边界；新增可执行的质量层：Liquid Glass
  只承载导航、控件与短暂功能层，图表、表格、正文和密集证据保持稳定实体承载。
- 统一按压 100–160ms、频繁 UI 转场不超过 300ms、运动可中断、仅动量交互使用 bounce；
  hover 只用于精确指针且 Gary 指针联动仍默认关闭。
- 补齐字号相关字距/行高、动态文字、安全区、减弱动态、减弱透明度与增强对比度的组件契约。

## 2026-09-08 — Gary-UI 独立公开版

- 新建 `KODxixi/Gary-UI`，原创代码与文档采用 MIT；第三方原始许可证与版本清单随源码保留。
- README 以六个完整 Demo 讲解设计系统；在线入口直达 Demo，提供独立 Portal、贡献说明和路线图。
- 新增跨平台静态预览，普通克隆无需维护者机器路径、Node.js 或外部 CDN 即可浏览。
- 公开玻璃与环境波浪采用独立原创实现；旧受限移植不进入公开包，组件契约与 Agent 入口同步更新。
- 新增源码公开边界检查、Pages 子路径浏览器回归与内建 Pages 发布；自定义 Actions 检查作为可选模板保留。
- 已知的两项分析页数据一致性问题保持开放，详见公开版验收单。

以下为此前本地版本的历史记录，不代表公开克隆已配置维护者的全部集成环境。

## Unreleased — 2026-09-07（场景配方与本地制图工具链）

- Demo Edition 02：重做六个完整页面与案例首页，按分析工作、连续阅读、汇报展示区分信息组织；
  使用克制的纯黑白、单行短标题、共享指标条、固定示例数据与有限动效，不默认添加照片。
  新增同一示例项目的原生图形源、双主题产物、独立导出与最终浏览器证据；
  修复 Archify 工具栏覆盖清单初始主题、移动嵌入缩成小字及打印时关系图裁切。

- 新增阅读、分析、展示三类场景配方，固定六种文本角色、正文 16px / 1.68，并把已批准的
  8px 间距与 30px 主卡圆角保留为旧基线。
- 新增 `visual doctor / validate / render / export`，确定性接入 Archify、ECharts、Markmap、
  AntV Infographic、Mermaid 与 Lucide，保留原生源并生成自包含 HTML、SVG、PNG、PDF。
- 新增失败候选与 last-good 保护、输入/路径校验、本地依赖锁、主题映射、许可记录和十类样例。
- Portal 可直接打开制图样例；修复 Portal 对嵌入 patterns 与 visual outputs 的静态路由。
- 新增六个独立完整页面 Demo 与统一入口，覆盖 Web UI、Kanban、长篇报告和方案汇报；补齐
  三档视口、双主题、真实 200% 字号、键盘、reduced-motion、断网、完整 PDF 与交互证据。
- 修复候选未真实渲染仍覆盖正式结果、Archify 主题漂移、暂停/重播空实现、Archify SVG 样式
  丢失与 Lucide 仅导出首枚；生成状态明确区分失败候选、当前有效版本和陈旧产物。
- 按锁定提交接入 Archify 官方 Skill，并通过受管技能部署验证新会话可发现与调用。
- 按 AntV Infographic `0.2.20` 对应上游提交接入官方 `infographic-creator` 与
  `infographic-syntax-creator`，受管部署后分别完成全新会话成品/语法路由实测。
- 全局中英文字体改为 Latin/英文优先 Helvetica 系列、中文优先 Microsoft YaHei 系列；
  HTML、React、Portal、制图及导出共用本地字体栈，富文本提供 100–900 数值字重。
- 默认 Scene 改为本地 Canvas 点阵：深色纯黑、浅色纯白，鼠标附近交互，
  reduced-motion 下静态完整呈现；不再默认加载照片或图片背景。
- 大字展示标题统一为单行、无标点且不超过 12 个中文字符；长意图改写为短标题，
  完整语义下沉到副标题或正文，章节与内容标题仍允许自然换行。

- Product Design 提案获用户批准并写入 GaryUI 母本：Noto Sans SC 成为中文首选，均衡密度组件间距为 8px，主卡圆角为 30px；新增 70% 透明度 / 8% 层级对比的自定义 GlassCard 变体。
- Portal“显示”菜单新增背景动态开关：默认尊重 `prefers-reduced-motion`，用户可显式切换为强制动态，选择保存在本地。
- Product Design 实验室默认提案更新为 Noto Sans SC / 16px / 1.68 / 0em、8px 均衡密度与 70% / 30px / 8% 自定义卡片；仅调整实验预览与提案，不写入正式 Token。

## Unreleased — 2026-08-25（历史 Light Rays Scene 与 Harness 顶栏）

- Portal 默认背景替换为 React Bits Light Rays：白色、顶部中心、spread `0.5`、length `3`，
  并保留鼠标轻微跟随、reduced-motion 静态帧与 WebGL 图片降级。
- 顶部导航参考 DeepSeek Harness 首页改为轻量三段式排版；移除整条厚玻璃，重做主次按钮的
  hover、active 与 focus 层级，同时保留原导航功能。
- 补齐 Harness 动态状态：滚动超过 80px 后弹性收紧、玻璃底淡入、标题副标收起；按钮增加
  中心扩散 hover；390px 改为可展开菜单层并支持 Escape / 导航后自动关闭。

## 2026-08-25（MoltenMetal 默认 Scene）

- Portal 默认背景改为用户指定参数的黑白 MoltenMetal；采用 React Bits 官方着色器与动效
  模型，并用原生 WebGL2 适配当前无构建、离线 Portal。
- Product Design 实验室新增「统一玻璃 / 主次分层 / 极简实底」三个卡片预设，以及透明度、
  圆角、层级对比三个实时滑块；结果只进入 `proposal-only`，不直接写正式 Token。
- 保留单 Scene / 单全局遮罩；reduced-motion、WebGL2 不可用或上下文丢失时自动回退到
  `--gary-scene-image`，鼠标跟随仅在允许动态时启用。
- `proposal-only` 的 Compact 密度未写入正式 Token；默认密度仍为 Balanced。
- 增加来源哈希、第三方许可与 MoltenMetal Scene 契约回归测试。

## Unreleased — 2026-08-20（插件化 + 三族修复）

- **DSH 插件化**：新增 `adapters/dsh/`（gary-ui-dsh 工具插件，`gary_ui_serve` 只读
  静态预览 + `gary_ui_emit` 自包含 HTML 生成——样式与资源全内联，根治产物拷出即
  白屏的 critical 族）；新增 preset 母库 `C:\AI\agents\dsh-presets\gary-ui`（装配
  「Gary-UI 设计系统」，工具行为纯消费行）。
- **安全（C 族）**：`resume --takeover` 不再零证明接管——必须持有旧 writer capability
  或一次性 `--takeover-credential`（start 返回，接管后轮换）；健康 v3 会话无证明即
  拒绝；仅修复前创建的 legacy 会话保留迁移宽限并记录 `takeover_unverified_legacy`
  审计事件。凭证防泄漏扫描扩展到 proposal JSON 与 feedback envelope。
- **同步治理（B 族）**：`runtime_projection.py check` 的 runtimeOnly 降级为 warning；
  `sync_runtime.py` 废弃为指引 stub；`tools/governance/deploy.py` 读取
  `runtime/manifest.json` exclude；runtime 副本清理 65 个孤儿文件。
- **视觉契约（D 族）**：modes.css 补 light 主题柱状图/进度条分支（token 派生零硬编码）；
  decision-report h1 改两行截断并声明 dark-only；portal/session 死类清理；
  React 适配层新增 prebuild 内联脚本（发布物自包含，构建不再挂）；决策网格玻璃配方
  对齐；在用字重补入 tokens 与 DESIGN.md §6。
- 新增测试：takeover 安全 10 项、视觉契约回归 9 项、投影治理 6 项；全量
  `115 passed + 75 subtests`，`validate_v2` pass，runtime check pass。

## Unreleased — 2026-07-31

- 为深色 `scroll-report` 的 `decision-report` 配方登记获批的 `b-ridge-current` 静态纹理；
  固定强度 10%、密度 200 条/1000px、扰动 10%、曲率 105%、线宽 0.55px，并保持
  单 Scene、单全局遮罩与无动画、无重复平铺约束。
- Agent 协作改为当前对话默认：需求明确时直接实施，关键歧义只在对话中询问；受监控 HTML
  Session 仅在用户明确要求或确需视觉比较/批注/区域组合/偏差收敛/高影响多页面治理并经用户
  同意后启用。approvalId 与 Evidence receipt 只约束 Session 路径。
- 已批准集成基线支持 Session 引用或直接对话的目标产物/浏览器报告/对话授权二选一，保留
  `approved-baseline-drift` 防漂移检查。
- 将已确认的 DDS Liquid Glass 决策报告界面同步为
  `patterns/recipes/decision-report/` 通用配方，保留连续阅读、16:9 演示、左图右判、
  底部结论条与来源抽屉，不携带具体项目数据。

## 2.0.0 — 2026-07-28

- Gary-UI 升级为 Design System Kernel + Agent–User HTML 共创运行时；唯一 Skill 仍为
  `gary-liquidglass-ui`。
- 新增 Task、Session、Proposal、Feedback、Approval、Evidence 与 Command Result 契约，
  保留单元级 Visual Route。
- 新增受监控本地 Session：Quick / Compare / Deep Review、真实 sandbox HTML、方案切换、
  optionId 批注、区域组合和同 URL revision 更新。
- 固定 Quick 为一个 recommended；Compare/Deep Review 为 recommended、alternative、
  stretch 各一个。
- Session CLI 扩展为 11 个命令，新增 verify；finalize 进入 implementing，Evidence pass
  才进入 verified，close 只接受 verified。
- start/resume 返回敏感 writerCredential；写命令使用 `--writer-lease`，显式 takeover
  轮换 token 与 writer capability。
- Session 与 Portal 使用互斥 `--surface`；artifact/evidence URL 无 token，并由路径限定
  HttpOnly Cookie 保护。
- Evidence receipt 固定记录 checks、artifacts、skillsUsed；真正使用的 Skill 才能入回执。
- Session 固定写入 `C:\AI\prototypes\gary-ui-sessions`；Server 只绑定 `127.0.0.1`，
  不调用模型、不写母本或目标项目。
- runtime manifest 补入 Evidence Schema 与 Visual Route 校验器；runtime 对消费者只读，
  不持久化虚构同步回执。
- 保留 3 应用 × 4 页面、2 主题 × 4 材质 × 3 密度、15 组件和 React 5/15 边界。

## 1.0.1 — 2026-07-28

- 新增独立 `contracts/invocation.schema.json` 与无依赖调用校验器。
- `SKILL.md` 补齐 3 × 4 路由、标准文本与机器调用。
- Starting Points 的复制骨架与预览显式携带并应用材质。

## 1.0.0 — 2026-07-27

- 建立 `C:\AI\UI\gary-ui` 唯一真相源。
- 收编 15 个正式组件、四级材质、双主题、三档密度与三档动效。
- 补齐四种页面模式、三种应用模式、Starting Points、Portal 与 React/shadcn 适配器。
- 用户确认建筑场景图为默认背景，并保留 CSS token 自定义入口。
