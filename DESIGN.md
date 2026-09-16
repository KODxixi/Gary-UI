# Gary-UI Design Contract

## 1. 设计目标

Gary-UI 服务于高信息密度中文报告、分析界面与工具产品。判断顺序是：内容可读、层级可辨、
操作可预期，最后才是玻璃表现。Liquid Glass 是材料语言，不是装饰滤镜。

### 1.1 Apple quality layer

Gary-UI 以已安装的 `apple-design` 作为还原 Apple 设计逻辑的首要方法入口，再用 Apple 官方
HIG 校验边界；这是一层质量方法，不是配色或外观模板。采用的核心是目的、
用户控制、熟悉性、适应性、简洁与细节质量，以及响应及时、空间路径一致、运动可中断、
排版随字号变化和辅助功能降级。Gary 自己的三种表面、排版和图表规则仍是最终视觉权威。

- Liquid Glass 只承担导航、控件、工具条和短暂功能层，让下方内容保持上下文；图表、表格、
  长正文和密集证据使用稳定的实体材质，不把整页内容都玻璃化。
- 三种已命名表面保持为 **实体底纹、磨砂玻璃、超白/全透玻璃**；一页只有一个 Scene，
  玻璃最多一层，禁止 glass-in-glass。默认 Scene 仍是单一点网格。
- 按压在 `100–160ms` 内回应；频繁 UI 状态转场不超过 `300ms`。用户可以随时打断并反向操作；
  bounce 只用于真实拖拽、甩动或动量释放，不用于普通菜单和装饰入场。
- hover 运动仅对 `hover: hover` 且 `pointer: fine` 的设备生效；Gary 的指针联动仍默认关闭，
  只能从 Background 主动开启。触控和键盘路径不能依赖 hover。
- 减弱动态时保留短促的透明度或颜色反馈，去除位移、弹性、视差和持续循环；减弱透明度时
  提高表面不透明度并取消背景模糊；增强对比度时使用接近实底的表面和清晰边界。
- 字距和行高按字号分别设定：展示字可适度收紧，正文保持自然字距和舒适行高，小字号标签
  可轻微放宽。布局与间距使用可随文字缩放的单位，放大文本后仍保留层级、点击区和完整内容。
- 顶部与底部功能层必须尊重浏览器安全区；状态、操作和关键信息不能只靠透明度、颜色或运动表达。

官方参考：[Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)、
[Motion](https://developer.apple.com/design/human-interface-guidelines/motion)、
[Typography](https://developer.apple.com/design/human-interface-guidelines/typography)、
[Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)。
`apple-design` 提供 Web 层的材质、排版与运动判断顺序；Gary 不复制 Apple 组件、字体或素材。

## 2. 场景模型

页面只有三层：唯一 Scene、唯一 Global mask、以及 UltraThin / Regular / Thick /
SolidPlate Surface。同一区域只选一种主材质，禁止 glass-in-glass；玻璃内部使用间距、
分隔线和透明度差分组。

Portal 与起手模板默认使用 `patterns/shared/dot-grid.js` 的本地 Canvas 点阵（旧 assets 入口仅转发）：深色页面底色是
纯黑 `#000000`，浅色是纯白 `#ffffff`，鼠标仅对附近点作有限位移与亮度反馈。
默认背景只绘制点，不叠加线网、卡片等高线或第二套点阵。实体底纹仅按 [材质规范](docs/VISUAL_EXPRESSION.md#实体底纹与章节子卡) 显式裁切到实体外卡，不改变页面背景。Canvas 成功后隐藏 CSS 点阵；嵌入页保留独立的不透明页面底色。
`prefers-reduced-motion` 下直接绘制完整静态点阵。Canvas 不可用时由 CSS 点阵接管，不回退到图片。
默认不挂载照片或插图；只有用户明确提供或选择背景时，才允许覆盖 Scene。
产品壳使用顶部居中的 WebBar，不使用常驻侧边栏；窄屏收进可键盘操作的菜单，保留主题与当前品牌。

## 3. 材质

| 材质 | 用途 | 禁用 |
|---|---|---|
| UltraThin | 顶栏、浮动导航、轻工具条 | 长正文、复杂表格 |
| Regular | 常规卡片、控件、筛选 | 极低对比照片区 |
| Thick | 关键决策、主操作、短信息 | 连续大面积铺满 |
| SolidPlate | 表格、长正文、密集证据、降级 | 需要显露 Scene 的主视觉 |

玻璃保持 K-only 中性；状态色只用于文本、图标、焦点和小标记。短信息卡默认玻璃，
SolidPlate 不作为整页通用黑底。

## 4. Token 层

- 机器真相源：`tokens/tokens.json`；唯一 CSS 入口：`tokens/base.css`。
- 主题：`data-gary-theme="dark|light"`。
- 密度：`data-gary-density="spacious|balanced|compact"`，不降低最低点击尺寸。
- 根主材质：`data-gary-material`；表面仍必须使用 `.gary-ultrathin`、
  `.gary-regular`、`.gary-thick` 或 `.gary-solid-plate`。
  - 根标记仍遵循 invocation schema。元素级 `data-gary-material="glass"` 是新增的中性卡片配方，
    使用同一 token 与 components CSS；不改变根主材质枚举。密集正文与图表不套用互动卡片配方。
- 圆角：工具操作为 44 × 44px 圆形；其余 control 18px / card 30px / panel 36px / pill 999px。
- 完整 Demo 是 Portal、组件、模板和制图目录的视觉基线。工具操作优先使用 `data-gary-icon` 与共享 Lucide 图标，1.6px 描边；使用 `aria-label` 和悬停标题表达动作，状态切换保留图标。导航、分段筛选、内容选择保留文字。
- 普通卡片接入共享 `patterns/shared/material.js` 和原创 `patterns/shared/optical-glass.js`，复用 30px 光学边缘；实底信息板不施加折射，禁止在样例容器外再套玻璃卡片。受再分发限制的旧移植仅保留在维护者本地，不作为公开实现入口。
- 按压反馈使用 100–160ms；UI 状态转场不超过 300ms。600ms 舒展和悬停边缘单次 6s
  仅属于明确启用的展示配方，不能阻塞输入。
  所有运动均有限时长且尊重 `prefers-reduced-motion`，默认无持续循环或自动播放。
- 动态 Scene 必须停止动画和鼠标跟随；不可用时不得阻断页面，必须显示静态 Scene token。

Token 变更必须保持暗色、亮色与无 backdrop-filter 降级可用。

## 5. 组件系统

正式组件共 15 个：`Button`、`SegmentedControl`、`Field`、`TabBar`、`WebBar`、
`GlassCard`、`SolidPlate`、`MetricCard`、`ComparisonTable`、`DecisionGrid`、
`MediaCard`、`ProfileCard`、`Scene`、`Chip`、`EvidenceBar`。
契约以 `components/<slug>.json` 为准，集合与顺序以 `components/index.json` 为准。

## 6. 排版

- 中英混排采用本地字体级联：Latin/英文优先 Helvetica Neue / Helvetica / Arial，中文优先 Microsoft YaHei UI / Microsoft YaHei / 微软雅黑；富文本允许 100–900 数值字重并按本机可用字重回退。
- 正式字号 caption 13 / label 14 / body 16 / lead 18 / title 20–28 / display 32–72px。
- 字重（token 名 = 值，按值升序）：regular 400 / medium-light 500 / medium 600 /
  extra-semibold 620 / semibold 650 / semibold-strong 660 / semibold-extra 670 /
  bold-light 680 / bold-strong 700 / bold 720 / heavy 740 / black 760 /
  extra-black 790。正式语义角色 CSS 只应引用 `--gary-font-weight-*`；富文本编辑态可用
  `data-gary-font-weight="100|300|400|500|600|700|800|900"`，缺少真实字重时允许浏览器合成。
- 正文行高 1.68，段落宽度约 38–72 个中文字符。
- 字距与行高必须随字号分别调整：展示标题可适度负字距并收紧行高，正文接近自然字距，
  小字号标签可轻微正字距；中文可读性优先，不机械套用英文负字距。
- 页面文字和间距使用 `rem`、`em` 或可缩放的 `clamp()`；浏览器放大与用户文字缩放后，
  层级、44px 最小点击区和完整内容仍成立，不用固定高度裁切文本。
- 上述中间字重 token 是历史兼容别名；新页面只主动选择 400 / 500 / 600 / 700，展示标题可用 400，避免继续新增近似字重。富文本编辑仍允许数值调整。
- 大字展示标题必须单行且不带标点，中文不超过 12 字；超长时先改写短标题，完整语义移入副标题或正文，不用 `<br>` 硬换行。
- 章节标题可自然换行；标题依靠字号、字重和留白，数值用等宽数字。

## 7. 几何与动效

内外圆角同心；主卡基准圆角为 30px，内部卡使用 16–20px；均衡密度以 8px 为组件节奏，
并按 8 / 16 / 24px 组织留白。自定义主卡使用 70% 表面透明度与 8% 层级对比。
hover 只在精确指针设备使用轻微位移或阴影，active 在 100–160ms 内回应。UI 运动不超过
300ms，必须从当前画面值继续并允许立即打断；只有真实动量交互可以 bounce。键盘焦点必须清晰，
动效只表达状态变化。`prefers-reduced-motion` 下取消位移、弹性与视差，保留轻柔透明度或颜色反馈。

### 参考提炼与 Gary 落地

- DeepSeek：顶栏初始嵌入、80px 后浮动；桌面 46px 高、顶部 8px，1140→980px，超宽 1280→1180px。
  手机栏 54px 高以保留 44px 点击区域。导航源码共用 `patterns/shared/web-bar.js`。
- DeepSeek：中性半透明底板与独立边缘分层，只有链接/按钮有悬停、焦点和按压反馈。
  两个主题共用 `--gary-card-*` token；主卡仍为 30px。不创建装饰轮廓线，复用共享材质实现。
- COSMOS 本地镜像：安静的首屏中心、轻字重展示标题、充分章节间隔、内容本身作为展示主体。
  在 Demo 首页和展示情境使用 400 字重；中文不照搬英文的负字距，不加入镜像照片、视频或专有字体。
- 网格：仅一层 28px 点阵，复用 `patterns/shared/dot-grid.js`，不叠加线网或装饰等高线；指针仅影响邻域，减弱动态直接显示完整静态图形。
- 字体：用本地命名字体映射保障英文 Helvetica、中文微软雅黑，富文本可用 100–900。
  当前字体是静态字体，不把所有数值字重宣称为不同真实字形；缺失 Helvetica 的机器回退需披露。
- 专属标志：`patterns/shared/gary-architecture.svg`，由围合建筑体块与 G 的开口构成，可独立导出。

集成方式与设计边界见 `patterns/shared/README.md`；公开版本的实测范围、证据和未关闭问题见
[公开版验收](docs/PUBLIC_RELEASE.md)。历史截图不能替代对当前公开包的真实浏览器验收。

### 交互配方与实验边界

鼠标驱动的点阵位移、卡片光泽与波面视差默认关闭；通过 Background 的“鼠标光影”显式开启，刷新不自动恢复。根属性 `data-gary-pointer-effects="on"` 控制共享实现，减弱动态优先。点击、键盘焦点和图表读数提示保持可用。

分析图表与表格以[图表表达规范](docs/CHART_EXPRESSION.md)和[机器规则](spec/chart-recipes.json)为准：17 类选型、7 种标注，明确问题、数据前提、尺度、语义色、文字层次与来源。标注绑定对象与依据，推导判断随数据重算或失效；不能把行业字段、固定编号或原图颜色当作通用规则。[demo0909](demo0909.html)用跨领域输入验证五种[共享 SVG 参考配方](patterns/shared/chart-recipes.js)，不代表全部类型自动实现；其余走既有工具，正式适配器与导出契约不变。参数的自动消费与作者审查边界见规范的调用说明。

材质按[玻璃表达规则](docs/VISUAL_EXPRESSION.md)选择。三种材质已批准：Solid 用于密集数据与长正文，Frosted 用于摘要与导航，Optical 用于短内容与展示，数据与文字不加滤镜。图与数值表同源，手机先重排／分图、表格转带字段名的逐行布局；必要的复杂图可有提示地局部横向阅读，页面本身不横溢。联动光影由 Background 主动开启，刷新恢复关闭。

分析色彩按[图表色彩体系](docs/CHART_COLOR.md)选择类别、顺序、发散或状态角色，主题值统一由 `spec/chart-recipes.json` 管理。Apple／Google 的设计原则用于层次、适应与语义，不把任一套品牌色机械替换为 Gary 全局色板。

数值过渡与手动内容轮播按 [交互配方](docs/INTERACTION_RECIPES.md) 选择性复用：分析只反馈真实数据变化，轮播服务非连续的案例或媒体，正文与必要证据仍完整可见。阅读默认静态。媒体轻倾斜和标题分段出现仅属于 [细节实验室](examples/interaction-lab/index.html) 的待选方向；未经用户判断，不推广到完整 Demo、报告或全局默认。

## 8. 模式系统

Gary-UI 使用两级模式。一级决定页面壳、导航、滚动和交互密度；二级决定当前页面/区段
的内容主角。两级只组合现有 token 与组件。

### 8.1 应用模式（一级）

1. `board`：同屏扫描、比较、筛选和状态反馈。
2. `scroll-report`：章节叙事、纵向推进、进度和锚点。
3. `web-ui`：顶部 WebBar、路由/标签与连续任务操作。

`web-ui` 的可选应用端变体是[三列工作台](patterns/application-modes/workbench/index.html)：吸收
“史宝生图”中极简、可折叠、动态三列的交互骨架，左侧承载上下文与输入，中央保持一个稳定工作面，
右侧按需展示判断与交付详情。它不新增应用模式枚举，不改变 3 × 4 路由；侧栏在窄屏转为抽屉，
卡片仍遵守单 Scene、三种表面、不嵌套玻璃与默认关闭指针光影。

根节点使用 `data-gary-application-mode`。

### 8.2 页面模式（二级）

1. `report-cover`：结论优先。
2. `image-page`：证据图优先。
3. `data-page`：判断值与比较优先。
4. `manual-toc`：结构与定位优先。

根节点使用 `data-gary-page-mode`。

### 8.3 组合规则

先选应用模式，再选共享页面模式，形成 `3 × 4` 组合空间，不生成 12 份 token/CSS 副本。
入口是 `patterns/starting-points/index.html`。

外层 Task 权威是 `contracts/task.schema.json`，option Visual Route 权威是
`contracts/invocation.schema.json`。Proposal 发布时：

- proposal.mode 必须匹配 Session mode；
- visualRoute.application 必须等于 task.applicationMode；
- visualRoute.page 必须属于 task.units[].pageMode；
- application/page 不得静默猜测，theme/material/density 必须展开完整；
- 已确认 decision 不得再次开放，已拒绝 optionId 不得再次发布。

### 8.4 决策报告复用配方

建筑前策、设计任务书与项目决策汇报使用
`patterns/recipes/decision-report/`。它是既有 `scroll-report × page mode` 的组合配方，
不扩展 3 × 4 视觉轴。

- 连续阅读和 16:9 演示必须共享同一内容源；打印同为 16:9。
- 单页固定为左侧主要图表/分析图、右侧 Thick 判断卡、底部 SolidPlate 结论条与页脚。
- 每页必须同时回答具体问题、给出有依据的结论、展示主要证据或设计表达，并说明决策影响。
- 主要分析卡与流程节点使用玻璃；SolidPlate 只承载密集参数、表格、字幕、来源与结论条。
- 来源抽屉只展示本报告实际引用的来源；项目数据、证据准入和业务渲染仍由消费项目负责。
- 机器参数以 `patterns/recipes/decision-report/profile.json` 为准；示例不含项目数据。

## 9. 扩展边界

- 图标可用 Lucide 或系统图标，但继续消费 Gary tokens。
- 图表库保持中立；Gary-UI 规定容器和证据表达，不绑定具体库。
- Dialog 使用成熟可访问 primitive，再以 Thick/SolidPlate 呈现。
- 通用数据表使用原生 table + SolidPlate；比较任务才用 ComparisonTable。
- React 适配保持 `5/15-demand-driven`，发布边界保持 `internal`。

## 10. 验收门槛

- `python -B scripts/validate_v2.py` 通过。
- 桌面与 390px 无溢出、裁切或玻璃嵌套。
- 主题、材质、导航、筛选和页面模式可操作。
- 键盘焦点、可访问名称、reduced-motion 合格。
- reduced-transparency、increased-contrast 与安全区内边距可用；放大文本不裁切操作或关键信息。
- 控制台无错误；静态页面无外网依赖。

### 10.1 最终交付门禁

功能骨架/未样式化页面永远不是最终稿。Starting Point 只提供构图起点，Proposal HTML 只承担
视觉决策；两者都不能证明实际目标已消费 Gary-UI。

`create`、`integrate`、`govern` 的最终验证必须同时证明：

1. 实际目标入口加载 `tokens/base.css`；React/shadcn 加载
   `@gary-ui/react-shadcn/styles.css`。
2. 真实浏览器从实际目标读取 `--gary-control-height: 44px`，且唯一 Scene、无嵌套玻璃、
   控制台零错误。报告使用固定 label `target-browser-report` 并满足
   `contracts/final-ui-report.schema.json`。
3. React/shadcn 实际目标在本轮生产构建 exit code 为 0 且输出 CSS asset。报告使用固定 label
   `target-production-build-report` 并满足 `contracts/build-report.schema.json`。

Session 路径把这些报告写入 pass Evidence；直接对话路径在最终回执中引用同等级真实报告，
不创建 Session receipt 或 approvalId。缺少任一项时必须写“功能骨架，未验证”，不得写最终稿、
定稿、完成或 verified。typecheck、静态预览、截图和 `validate_v2.py` 只能作为补充，不能替代
上述目标级证据。

## 11. 全局共同定稿

Portal 是 Gary-UI 全局治理界面，不是任务 Session。它保留 `schemaVersion: 3` 决策摘要，
字段包括 `reactAdapterStrategy`、`distributionScope`、`syncAuditCadence`；审计频率只允许
`weekly` 或 `monthly`。旧 `schemaVersion: 2` 状态必须降回草稿，字段保存不等于创建任务；
只有 Agent 复述并获得确认后才更新只读周期检查。

### 11.1 Portal 全局治理兼容契约

Portal 的可提交决策摘要必须使用 `schemaVersion: 3`。其中 `reactAdapterStrategy` 只能取
`demand-driven`，`distributionScope` 只能取 `internal`，`syncAuditCadence` 只能取
`weekly` 或 `monthly`。读取到 `schemaVersion: 2` 时必须降回草稿：允许保留原字段供用户
核对，但不得据此更新全局默认值。只读周期检查只报告母本与实际生效目录的差异及健康状态，
不得写母本、运行时目录或伪造同步回执。

Portal 只使用 `--surface portal`；任务共创只使用 `--surface session`。不存在 combined mode。

## 12. Agent–User HTML 共创契约

### 12.1 默认对话与按需升级

所有 operation 默认使用当前对话，不自动建立确认页面。需求明确时直接实施；只有影响结果的
歧义才问 1–3 个最高影响问题。Session 只在用户明确要求，或多方案视觉比较、元素级批注、
跨方案区域组合、反复偏差收敛、高影响多页面治理确有需要时建议启用；启动前必须说明理由并
取得用户同意。直接对话不需要记录“跳过 Session”的理由。网页不会在 Agent 任务结束后自行
调用模型。

### 12.2 Proposal 形态

- Quick 恰好一个 recommended。
- Compare 与 Deep Review 恰好三个：recommended、alternative、stretch 各一个。
- Stretch 必须说明目标和预期收益；被拒绝 optionId 不得再次发布。
- 每轮最多突出 1–3 个高影响 decision。

### 12.3 可批注与组合 HTML

提案必须是真实 HTML。可批注元素使用稳定 `data-gary-node-id`。annotation 必须绑定
当前 optionId；区域组合使用 regionId + fromOptionId + note。iframe 使用
`sandbox="allow-scripts"`，不能访问母本、目标项目或 writer credential。

### 12.4 批准、实施、验证

已启动 Session 时，approve 只对当前 proposal/revision/selectedOptionId 有效。尚未 finalize
时可携 approvalId reopen；finalize 后状态进入 implementing，不能 reopen。Session 实施后必须
提交 `contracts/evidence.schema.json`：

- checks 的 id 唯一；result=pass 时全部 checks 都为 pass；
- artifacts 必须是实际存在且允许的证据文件；
- skillsUsed 只记录真正影响 Task、Proposal、实现或验证的 Skill。

`create`、`integrate`、`govern` 还必须满足 10.1 的最终交付门禁：固定检查 ID、真实目标
`target-browser-report`，以及 React 目标的 `target-production-build-report`。

verify 生成 receipt，包含 checks、复制后的 artifacts 与 skillsUsed。只有通过门禁的 pass 才进入
verified；close 只接受 verified。直接对话路径不创建 Session receipt 或 approvalId，但仍须满足
第 10.1 节的目标级浏览器/构建门禁并在最终回执列出证据。

### 12.5 Writer capability

start/resume 返回敏感 `writerCredential`。写命令必须用 `--writer-lease` 或
`GARY_UI_WRITER_LEASE`，不得把凭据写入页面、日志、Feedback、Evidence 或聊天。
resume 轮换 token 与 writer capability；显式 takeover 立即废止旧 capability。

### 12.6 资源与 Cookie

首次 snapshot 用 Session URL token 验证，并设置路径限定 HttpOnly、SameSite=Strict Cookie。
artifact/evidence URL 不含 token，只接受对应 Cookie。Server 只绑定 `127.0.0.1`。

### 12.7 权限与 runtime

源码修改写入当前用户选择的 Gary-UI checkout；独立 runtime 对消费者只读，不保存虚构同步回执。
已配置的 Session 只能写其专属任务存储，不能直接写源码或目标项目。当前脚本仍使用维护者的
固定本机存储默认值，公共克隆不应照搬该路径或自动启动 Session；配置限制与可选集成见
`SKILL.md` 的“可选 Session 集成”。维护者只在自己的环境内遵循其母本与投影治理规则。
