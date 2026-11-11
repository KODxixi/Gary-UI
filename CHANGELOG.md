## 2026-10-30 · flow-diagram 端点改水滴箭头

- 端点 marker 从 6/8px 圆点改为 `13×13` 水滴：路径 `M7.28 3.29 A3.3 3.3 0 1 0 7.28 8.71 L11.2 6 Z`，`refX 11.2` / `refY 6`，圆背半径 3.3。主路径亮白、旁支灰，实/虚/主/旁各一套 marker。
- **卡片宽度按像素自适应**：报告页整图 120–260px，按最长标题/副标题统一；14px 放不下退 12px，仍放不下才截断。**废弃按字符数截断**——`DNS 公网解析`、`archos core-flow`、`Console legacy 视图` 不再被「7 个字」规则误伤。
- **每个节点名称 + 摘要**：报告页胶囊 h=54 显示两行（名称 14 + 摘要 11）；`sub` 缺失直接报错。
- **点击节点弹详情**：`detail` 必填，点击节点在该节点弹出玻璃详情卡；Esc / 点空白 / 关闭按钮收起，16 个节点全有详情。
- 多图内联自动加 `fd-<hash>-` 前缀，避免 marker / filter id 相撞导致箭头消失。
- 闸保留「每条 line/polyline 必须有 marker-end」；曲线检查只作用于**有 stroke 的路径**，标记里的圆弧不会被误判。
- 规范、生成器、真实样例、compare/03 与 `stress-40` 同步；定稿 87 个元素全过，`--self-test` 7/7。

## 2026-10-30 · flow-diagram 报告页呈现定稿（03）

- **主路径成为唯一亮线**：`edges[].emphasis` 支持 `main` / `side`；主路径用 text-primary，旁支 52% 不透明；真实样例重排成一条水平脊梁（用户消息 → 意图路由 → 工具调用 → 结果校验 → 回复编排 → 最终答复）。
- **阶段框退成中性**：`--report` 把 1px 彩色虚线阶段框换成中性实线（24% 不透明），阶段标题 14/500 + `.12em` tracking；虚线只留给非主路径，解决「分块虚线」和「非主路径虚线」的语义打架。
- **玻璃卡片**：卡片填充 `--gary-card-surface-top`（半透明）+ 一层柔和落影（dy 6 / blur 12 / 35%）；不做发光 / 内高光，卡片仍然只染描边。
- **端点（历史）**：当时先用 6/8px 圆点并加 marker-end 闸；随后被顶部的水滴箭头条目取代。
- **删解释层**：报告页无眉标、无四色图例；标题下一句副标题；底部一行 key；页面垂直居中。
- **fan-in 端口**：`from_offset` / `to_offset` 把结果校验的三个入口分开，不再叠成一个圆点。
- 新增 `--report` 与 `report_graph` / `report_html`；`examples/flow/hermes-session.*` 为 03 定稿，`examples/flow/compare/` 保留 01/02/03 决策历史。三把尺全过。
- **定名与触发**：规范标题改为「Gary-UI 流程图规范」，触发语「Gary-UI流程图」写进 `gary-ui` skill description、母本 `SKILL.md`、Gary-UI `AGENTS.md` 与根 `C:\AI\AGENTS.md` 路由。以后说这句话直接读 `docs/FLOW_DIAGRAM.md`，报告页走 `--report`。

## 2026-10-29 · flow-diagram 端点改 6px 圆点

- 端点 marker 从直角三角形改为 `6px` 圆点（`markerUnits="userSpaceOnUse"`、`refX 6` / `refY 3` /
  `circle cx=3 cy=3 r=3`）：圆点与目标框边相切、圆心在路径中心线上，不再用方向三角；
  方向由线的走向承担，圆点只标记「接上了」。
- 规范 `spec/flow-diagram.json`、`docs/FLOW_DIAGRAM.md`、生成器、真实样例与 stress-40 fixture 同步；
  闸 `--self-test` 6/6，样例 76 元素全过。

## 2026-10-29 · flow-diagram 生成器、gary 变体与真实场景

- **新增 `FlowGraph`**（`scripts/flow_svg.py`）：固定尺寸网格 + 正交 A* 路由。节点按
  `stage / row` 放入固定单元，长标签截断，连线在节点与分块之间找通道；不再手填坐标。
  仍保留 `FlowDiagram` 的手写图元入口。
- **新增真实场景** `examples/flow/hermes-session.json`：Hermes 一次会话执行流，
  16 节点 / 18 条边，含辅助输入、重试回路、异步写回三类虚线；生成
  `examples/flow/hermes-session.svg` + `.html`，过样式/几何/页面三道闸。
- **gary 变体落地**：`tokens/tokens.json` 新增 `--gary-category-1..4`（dark/light 值同
  `spec/chart-recipes.json`），`flow_svg.py --palette gary --tokens` 输出 `var(--gary-*)`；
  预览页 0 hex / 0 host vars，过 skill `verify_preview_page.py`。
- **闸扩展**：允许 gary 字面色与 token 变量；`no_chromatic` / `token_chroma` 把
  `--gary-category-*` 当作语义色（与 state 同档）放行；几何闸新增「连线穿过卡片/胶囊」
  判据（1px 分块/子帧允许垂直穿越），`--self-test` 升到 6/6。修了 2 点虚线丢 `dasharray` 的 bug。
- **管线决定**：`adapters/visual/capabilities.json` 新增 `standalone.flow-diagram`
  （`routed: false`），不把本规范塞进 archify / mermaid 的自动布局。
- **文档**：`FLOW_DIAGRAM.md` 补 §9「生成器」、修 `verify_preview_page.py` 指针、
  更新 §8；`spec/flow-diagram.json` 的 layers 口径改为五层，补 gary token 与 generator 登记。

## 2026-10-29 · flow-diagram 打磨（箭头缩小 + 补几何闸 + 子帧层）

- **箭头 10×7 → 7×5**（`refX 6.3` / `refY 2.5`）。参照物在 2px 线宽下箭头偏大，
  相邻框间距 18–28px 时占了近四成空隙。规范里写明这是**有意偏离参照物**，
  并固定 `refX = 0.9×宽`、`refY = 高÷2` 两个关系——各改一个会让箭头浮在线上或压进框里。
- **补第 5 层「子帧」**（1px 实线 + gray75 填充 + rx4）。原规范漏了它，后果是容器里
  只有条目、内容只占一半高度。分块（1px 虚）与子帧（1px 实）是两种层，不能混用。
- **闸补几何判据**（重叠 / 出 viewBox）。起因是一次真事故：一张 27 元素「全部合规」的
  样例里，结论胶囊压住判定卡 10px——**样式判据看不见位置，闸全绿而图是坏的**。
  现在拿坏图回测能抓出 `重叠 10×36`，Phoenix 原图仍 30 元素全过（无误报）。
- 规范加 §7.1「画图时的四条位置规则」（胶囊离卡片 ≥18px、辅助线从源节点边缘出发且
  穿出后立即在框外走、落点取边中点、分块内要铺满）——这些闸管不到，靠人。
- 新增 `docs/HANDOFF-flow-diagram.md`：移交后续打磨的完整上下文与待办。

## 2026-10-28 · 过程型流程图规范（flow-diagram）定稿

- 新增 [docs/FLOW_DIAGRAM.md](docs/FLOW_DIAGRAM.md) + 机器源 [spec/flow-diagram.json](spec/flow-diagram.json)：
  过程型图（动作按先后穿过阶段）的四色描边 + 正交折线体系。
- **三个数字全部来自实测**：逆向测量 Arize Phoenix 空状态图（620×290 手写 SVG）的真实属性，
  不是目测。四角色色 `#e67e22` / `#2196f3` / `#9c27b0` / `#ffbf00`；字号只有 14/12/11；
  圆角只有 8 / 4 / h÷2；实线 2px、虚线 1.5px `dasharray 4 3`。
- **明文改母本三条**（写在 JSON 的 `authority.overrides` 里，带理由）：虚线 = 非主路径而非未成立、
  连线一律中性灰而不取目标色、卡片只染描边而填充恒 gray100。理由是过程图的读者问「下一步是谁」，
  不问「这一侧成立吗」；且角色色已占描边，边再上色会让主路径淹没。
- 新增闸 `scripts/check_flow_diagram.py`：判六项（色板 / 填充 / 圆角 / 字号 / 线宽 / marker），
  `--self-test` 拿手写反例跑出 5/5 红。用 Phoenix 原图当基准，30 个元素全过。
- 已知缺口已写明：**Mermaid / Graphviz 做不出这套几何**（按文字撑框、按算法选拐点），
  只能视觉近似——用了引擎不得声称合规。

## 2026-10-27 · 版式规则落地 + 闸重写

- 新增硬规则：卡片必须有圆角（≤8px 判违规）、同一结论只渲染一次、正文不许出现内部编码（SC2/AD3/SRC-*）。
  索引区改为显式 `data-gary-index`，类名不再作豁免。
- 闸重写：判据从 `invariants.py` 抽到 `agent/checks/page_scan.py`，按元素类型与边缘角色分「卡片 / 非卡片」，
  圆角解析 px·rem·em·var 真实值，行内 style 单双引号都读，外链 CSS 与 `::before` 一并扫；
  `--page` 单页模式同口径，`--all` 扩到历史演示页。
- `audit-ui.py` 补退出码契约（有 ERROR 即 exit 1），此前恒为 0。
- 判据收紧后复核：配方页真实重复为 0（原先 32 条全是单句段落自我误报），基线机制撤销。

# Changelog

## Unreleased — 2026-10-26（图示规范 v1 定稿并入）

- `docs/DIAGRAM_EXPRESSION.md` 重写为定稿版（210 行）：不再叠补丁，按「分工 → 三类断言 → 七层阅读 →
  五条硬语法 → 分层着色 → 状态词闭集 → 绕行 → 卡片同源 → 失败条件 → 场景交付 → 引擎边界 → 验证」
  一次讲完。三处此前写偏的口径（分块与卡片的关系、颜色锁在哪层、线色管什么）已收进正式条文。
- 新增**附录 A 最小实现**：五层着色的可复制 CSS（`color-mix()` + `context-stroke`，分类色由使用处
  注入，不硬编码 category 值），解决此前只有比例没有实现的问题。
- 新增**附录 B 参考实现**：`examples/visuals/diagram-spec/reference.html`＋`README.md`，
  一张真实图逐条对照规范，作为复用与验收的样板。
- 登记：`spec/diagram-recipes.json.references`（human / implementation / referenceCase）、
  `PROJECT_STRUCTURE.md` 目录树注释。`validate.py` issues 为空。

## Unreleased — 2026-10-26（虚线分块上色：三层强度分层）

- **明确「分块」是独立的一层**：虚线框不是纯线框，而是一个作用域块——描边取该块身份色 46%、
  块内极淡填充 5%、块标签取同族色。块与卡片、连线同源（`themes.dark.category1..8`），
  靠**强度**而非色相区分层级：分块最弱、卡片居中、连线最实。
- 页面底仍锁定纯 K（chroma = 0）；文字仍不上色。
- `docs/DIAGRAM_EXPRESSION.md §6/§11`、`spec/diagram-recipes.json.colorRoles.blocks` 同步。

## Unreleased — 2026-10-26（图示连线也上分类色）

- 口径再收敛一格：**只有页面底与边界框锁定中性**（纯 K，chroma = 0）。**卡片与连线都可用分类色**，
  连线与其箭头取目标节点的分组色，箭头用 `context-stroke` 跟线；文字仍保持中性不上色。
- 理由：线是「进入哪个模块」的视觉指针，跟目标节点同色比中性线更快读出归属；一旦线也中性，
  彩色卡片反而成了孤岛。缺口仍由线型（实/虚）与状态词表达，颜色不参与判断。
- `docs/DIAGRAM_EXPRESSION.md §6/§11`、`spec/diagram-recipes.json.colorRoles` 同步。

## Unreleased — 2026-10-26（图示色彩口径修正：底色中性，卡片分类）

- 澄清上一版写偏的一条：纯 K 只约束**页面底、边界、连线、文字**四层；**卡片可以有分类色**，
  取 `spec/chart-recipes.json` 的 `themes.dark.category1..8`，按职责分组（同类对象同色），
  颜色只分组不做判断。`docs/DIAGRAM_EXPRESSION.md §6/§11` 与
  `spec/diagram-recipes.json.colorRoles|engineColorConstraint` 同步改写。
- 保留的约束不变：缺口与未成立仍由线型与状态词承载；不整体搬用 archify preset 色板
  （它的节点色与深蓝底配套，单取节点色会破坏对比关系）。

## Unreleased — 2026-10-26（图示颜色：archify 语义色板与纯 K 基线冲突）

- **修正漂移**：`adapters/visual/theme-map.json` 的 `dark` 主题仍是旧值（`#000000` 底 + `#74a7ff` 蓝强调 +
  `#32363d` 冷色边框），与 `tokens/base.css` 的「工业表面与墨色」基线（`--gary-*` chroma 恒为 0）冲突。
  dark 收敛为 `#141414` / `#1c1c1c` / `#f7f7f7` / `#9d9ea2` / `#cfd0d3` / `#333333` / `#262626`。
  `light` 主题仍是旧值（暖底 + 蓝强调），等浅色面板 token 定稿后统一，本次不动。
- **记录能力边界**：archify 的 `visual_preset` 自带语义色板，不读 Gary token，`theme-map` 对 archify 只生效
  `fontFamily`。企业面板作用域内直接派发 archify 产物会得到蓝强调 + 多色节点的图。已在
  `docs/DIAGRAM_EXPRESSION.md §11` 与 `spec/diagram-recipes.json.engineColorConstraint` 写明：
  该作用域以 `tokens/base.css` 灰阶手写 SVG，缺口与未成立仍由线型与状态词表达；不做后处理换色。

## Unreleased — 2026-10-26（图示表达规范 v1 入库）

- 新增 `docs/DIAGRAM_EXPRESSION.md` + `spec/diagram-recipes.json`：把「边界承载状态命题、节点只写事实、
  线型承担成立性、跨边界必须绕行」固化为图示语法；七层阅读结构对应 CHART_EXPRESSION 的数据图表七层，
  不重复其数值，颜色与场景仍取各自真源。
- 状态词闭集五条（已接通 / 未接通 / 仅模型通道 / 拟接入 / 未知），`未知` 不得省略；颜色不承担好坏，
  缺口只由线型与状态词表达，避免把「实现缺失」和「实现错误」压成同一种视觉。
- 登记：`spec/system.json.authorities` 增加 `diagramRecipes` / `diagramExpression`；`SKILL.md`
  必读顺序第 4 条、`AGENTS.md` 路由与索引、`docs/CHART_COLOR.md` 关系图条目同步。
- 只写规范与登记，不改引擎、不改组件、不改 CSS。

## Unreleased — 2026-10-26（企业面板 token 规范 v1.1 入库）

- 新增 `spec/ARCHOS-ENTERPRISE-TOKENS.md`（v1.1 精简版）+ `spec/archos-enterprise.tokens.json`：
  27 色值 / 6 字号 / 4 圆角 / 6 间距 / 2 时长 / 6 组件态 + 3 页面态 / 8 条红线；
  强调色 `#cfd0d3`，选中 `#2a2a2d + #6a6b70`，状态色一套（空闲 `#5aa87f` / 已排挡 `#d9a04b` / 停用 `#c05a6a`）。
  v1.0 存档为 `ARCHOS-ENTERPRISE-TOKENS.v1.0.md`。
- 登记：`spec/system.json.authorities` 增加 `enterpriseTokens` / `enterpriseSpec`；
  `AGENTS.md` 索引与 `PROJECT_STRUCTURE.md` 目录树同步；DESIGN §4 新增「企业面板层」说明边界（一层，不是新主题轴）。
- 只写文档与登记，不改运行时 CSS、不改组件、不部署。

## Unreleased — 2026-10-26（工业界面轴 + 底色不带色相）

按《Gary-UI 工业 UI 设计与交互品味准则》新增一个正交轴 `data-gary-taste="industrial"`，
只在工具型、数据密集的工作台启用；报告与展示页保持默认玻璃味。

- **底色不带色相**：新增 14 个表面/墨色/选中 token，chroma 全部为 0（`oklch(L 0 0)`），
  暖调与冷调都算违规。`--gary-surface-card 0.145 / raised 0.195 / overlay 0.175` 四档明度 +
  `--gary-hairline-soft/hairline/strong` 三档发丝边。文字补到五级：strong / body / meta / caption / faint。
- **分层不靠装饰**：工业轴把所有玻璃、实板、指标卡压成平底 + 1px 发丝边，去掉 backdrop-filter 与阴影；
  唯一阴影给抽屉与浮层（`.gary-overlay`）。圆角收到 8 / 12 / 16 / 999。
- **交互只改底色**：hover 提亮一档、active 再提一档、`transform: none`；焦点改用亮灰描边
  `--gary-accent-neutral`；选中态 = 中性深灰底 + 亮灰描边。动效 120–180ms，reduced-motion 全瞬切。
- **刻度**：`--gary-grid-gap 6px`、`--gary-font-size-data 11px`、`--gary-font-size-nano 10px`、
  `--gary-duration-ui 160ms`；栅格用 `auto-fill minmax(150px,1fr)`。
- **参考实现** `patterns/industrial/index.html`：232px 导航 + 状态筛选 + 12 张成员卡 + 抽屉改状态 +
  今日变更记录；12 个交互全部实测可用（筛选 5/2/12、切视图、开抽屉、改状态、toast、关闭），
  390px 无横向溢出，深↔浅主题切换不残留旧底色。
- **修掉一个真 bug**：底色来自主题变量的元素若常驻 `transition`，切 `data-gary-theme` 时 Chromium
  会把旧值卡住（深色切浅色后卡片仍停在 `oklch(0.145 0 0)`）。过渡只挂交互态，这条写进 DESIGN 的已知坑。
- **验收器第八条** `industrial`：14 个 token 必须存在且 chroma 为 0、尺寸 token 齐全、
  工业覆盖块存在、参考实现存在并声明该轴。负向用例实测：暖深灰 `oklch(0.145 0.012 60)`
  与冷灰 `#c3c4c7` 都被判红。

## Unreleased — 2026-10-26（配方入口登记 + 字号例外定界）

- `patterns/starting-points/index.html` 新增「配方」区块，登记 `audit-report` 与 `decision-report`：
  写明各自的 3 × 4 组合、材质与密度，并声明配方只固定版式、不新增视觉轴。此前两个配方都没有入口。
- DESIGN §6 给 16:9 演示/打印配方定界：`profile.json` 声明 `presentationAspectRatio: 16:9` 的页面，
  页脚、来源与图注允许 9–11px；阅读型页面仍守 caption 13 与 micro 12。
  `font_floor` 据此按 `profile.json` 豁免，不再靠白名单文件，`baseline.json` 的 `font_floor` 归 0。
- 负向用例复测：无 `profile.json` 的配方写 10.5px 仍判红；16:9 配方 9px 通过。

## Unreleased — 2026-10-26（对抗性审查后的一轮修正）

对抗性审查（契约合规 + 验证充分性两路，逐条带行号与实测）认定这份配方不能作为参考实现，
修掉其中能指到证据的条目：

- **Scene 被 body 底色盖掉**（阻断）：`body { background: var(--gary-surface-page) }` 让负 z-index 的点阵
  一个像素都画不出来。实测：有底色时背景采样全 0，去掉后出现 24–40 的点阵像素。改为 body 不写底色，
  新增 `scene_visible` 检查。
- **390px 富文本带横溢**（阻断）：`.prose-band` 没有窄屏分支，口径卡被压到 96px 并溢出。并入 880px 断点。
- **字号跌破契约**（阻断）：全页 10.5–12.5px。新增 `--gary-font-size-micro: 0.75rem`（12px）作为栏头与
  次级数字的下限，正文走 caption 13，标题 20；行高随之回到 40–48px 的健康值（判定行 47px）。
- **面板几何改为组件承载**：删掉页面自写的 `border` / `box-shadow` / `border-radius`，改用
  `.gary-glass-card`，四边分层描边与三层阴影回到共享材质；补齐 `radius.js` 与 `data-gary-radius="auto"`，
  圆角实测 14 / 19 / 14px（原来三栏都是 32px，与 DESIGN 的 4%/28 不符）。
- **圆角上限对齐**：`--gary-radius-card` 从 `clamp(14px, 6cqi, 32px)` 改 `…, 28px`，与 DESIGN §7 的
  4% × 宽度 / 28 上限一致。
- **密度 token 落地**：栏间距与内边距改读 `--gary-density-layout-gap` / `--gary-density-surface-padding`，
  `data-gary-density` 不再是装饰属性。
- **补模式声明**：`data-gary-application-mode="scroll-report"` + `data-gary-page-mode="data-page"`。
- **删死代码**：`.strip` / `.sgrid` / `.two` / 不存在的 `.c-side > .note` 全删；脚本移进 `</body>`；
  93 字长段拆成两段（≤72 中文字符）；来源行改用 `<time datetime>`。
- **验收器六条扩成七条并修假阴性**：颜色判定改成解析成 sRGB 后比通道差（支持 hex3/4/6/8、rgb 空格与百分比、
  hsl、oklch 百分比、`color(srgb …)`），`.json` 纳入扫描，状态色白名单从 tokens.json 动态生成，
  契约类先剥注释再匹配，两栏判定按真实轨道数（含 `repeat(n, …)` 与行内样式）。
  新增 `scene_visible` 与 `font_floor`（棘轮基线，历史配方未迁移不阻断新改动）。
  五条负向用例全部实测变红。
- **契约修矛盾**：DESIGN §7 圆角数值统一；玻璃与实板分工写清（面板可全玻璃，长正文留纸面）；
  README 的断点 620→880、`space-between` 的说法与 DESIGN 对齐；配方补 `profile.json`，
  并如实记下 `starting-points` 尚未登记任何配方入口这一缺口。

## Unreleased — 2026-10-26（分块对齐进契约）

- DESIGN §7 新增「分块对齐」六条：并排面板等高（stretch + flex column，富余摊成均匀行距）；次级区块复用同一套
  列轨道与 gap；正文块左内边距 19px 使文字与栏头同竖线；页脚说明行同高；同栏内只有一种行距；内边距 ≥ 圆角一半。
- 配方 `patterns/recipes/audit-report/` 按该规则重排：三栏 472px 等高、顶底边对齐；富文本带与看板共用
  `1fr 1.34fr .94fr`，口径卡自动落在最右栏边缘；页脚统一落在同一 y；中栏 8 行行距统一 51px。
- 同步踩坑记录进配方 README（旧栏线规则会覆盖面板内边距、圆角切栏头、space-between 会拉出多种行距）。

## Unreleased — 2026-10-26（密度与富文本规则）

- DESIGN 新增 §7「密度与栏数」：高密度报告默认三栏，**禁止两栏**；单列表格可作为更高密度替代；
  窄屏 <880px 塌成单列是唯一例外。判定顺序改为「先算每条判定占多少高度（40–48px 为健康值），再定栏数」。
- DESIGN 新增 §6.1「富文本层级」：四级（主判断 18/500、小标题 16/600、正文 16/400、注脚 13/400），
  一页一个主判断；主次只靠字号档位、字重档位、颜色三级，禁止行内样式、临时色、`<br>` 排版、用 `<b>` 代替小标题。
- `patterns.css` 落地 `.gary-prose`（含 `__lede` / `__note` / 列表 / 引用 / 代码样式，全部 token 化）。
- 新增配方 `patterns/recipes/audit-report/`：三栏审计报告（风险 / 已修 / 待办），
  参考密度 15 条判定 + 3 条验收线 + 8 项改动 ≈ 570px。
- `agent/checks/invariants.py` 增至六条：新增「高密度版面两栏」检查（只查 `.board/.cols/.dense`，
  避免误伤页脚与表单）；负向测试已验证（放一个两栏 `.board` 立刻 FAIL）。

## Unreleased — 2026-10-26（全库黑白灰：色度清零到字面层）

- 226 处带色度的字面色值（hex / rgb / rgba）在 18 个样式与脚本里换成等亮度中性灰：
  `#101012`、`#3a3d43`、`#0e1117`、`#f7f4ee`、`#96d2da`、`rgb(8,8,10)`、`rgba(77,67,58)`（光面内阴影的暖棕）、
  `rgba(74,99,135)`（浅色指针光）等。换算是按相对亮度取灰，明暗关系不变。
- session 壳与 agent primitives 的独立调色板（青光、暖米、Apple 蓝 accent）统一为中性 token。
- 指标卡材质 thick → regular（层级交给字号与间距，不靠亮度）。
- `agent/checks/invariants.py` 增加第五条不变量：样式与脚本层不允许出现带色度字面色值，
  状态色（positive / caution / critical）与焦点环在白名单内；`spec/` 的图表配方属于数据语义色，单独治理。
- 现在一条命令同时验：中性 token 色度、页面深黑浅白、契约类、字面色度、两个验收器。

## Unreleased — 2026-10-26（第二波：跨壳调色板、排版越权、不变量闸）

- 全部中性 token 色度归零（含浅色主题与文字/描边，27 项），K-only 从「形容词」变成可机器断言的事实；
  页面底色深色 `oklch(0 0 0)`、浅色 `oklch(1 0 0)`。
- 去掉组件层里的离板色：`#101012`、`#111`、`#151515`、`#f5f5f7`、`#12202a16`、`rgba(18,20,24,…)`、
  `rgba(44,58,68,…)`、`rgba(74,99,135,…)` 一律改为 token 或 `color-mix`。降透明度兜底、打印、手机导航
  同样改用 token，不再另起一套灰。
- Portal 降透明度兜底由 `#0e1117` / `#f7f4ee`（蓝黑与暖米）改为 `--gary-surface-page`。
- 排版越权修正：`patterns.css` 的裸 `h1` / `h2` / `.metric` 原本用 `-.055em` / `-.035em` / `-.04em`
  与 760 字重，比 token 紧一倍且不受 token 约束（中文标题会挤在一起）；改为
  `--gary-tracking-display/title/metric` 与 `--gary-font-weight-bold`，行高 1.04 / 1.12。
- 新增 `agent/checks/invariants.py`：四条不变量（中性 token 色度为 0、页面底色深黑浅白、契约类存在、
  validate_v2 与 audit-ui 同时为绿），进 DESIGN §10 与 CONTRIBUTING 的验收表。

## Unreleased — 2026-10-26（元错误修正：表面色度、页面底色、表面几何、圆角与验收闸）

- 表面 token 的 chroma 归零：`page` / `sunken` / 三段 glass / `solid-plate` / `card-plate` / `action-fill`
  此前带 0.008–0.014 色度（hue 255），低亮度下整片偏蓝，与 DESIGN「K-only 中性」相违。
  文字与描边 token 未动（chroma ≤0.005，改动会影响对比度计算）。
- 深色页面底色对齐契约：`--gary-surface-page` 由 `oklch(0.145 …)` 改为 `oklch(0 0 0)`（纯黑）。
- `.gary-solid-plate` 补几何：此前只承载材质，单独使用会渲染成直角大方块；
  现在自带 `border-radius: var(--gary-radius-card)`，与 DESIGN「表面可直接使用」一致。
- 圆角随尺寸：主卡圆角改为 `clamp(14px, 4% × 宽度, 28px)`，新增 opt-in 助手
  `patterns/shared/radius.js`（`data-gary-radius="auto"`），小卡不再被套大圆角。
- 补齐契约变体的 CSS 实现：`button`（default/outline/secondary/ghost/destructive/link）、
  `chip`（soft/solid/neutral/success/warning/critical）、`evidence-bar`（四档语义色）、
  `solid-plate`（default/subtle/inverse + `__label`/`__value`）。
- 验收闸自身修正：`index.json` 判据由「集合完全相等」改为「正式 15 组件全部登记」
  （原判据与 audit-ui 的 64 份契约检查互相矛盾，两个闸不可能同时为绿）；
  `has_remote_dependency` 补上压缩产物里无 `const/let/var` 的 SVG 命名空间常量，
  不再把本地打包的 `morph-icons.js` 误判为远程依赖。
- 结果：`validate_v2.py` 与 `audit-ui.py` 首次同时为绿（此前 22 项既存失败）。

## Unreleased — 2026-10-25（图标来源：React 组件层与制图图标板改用 reicon）

- React 组件层的图标来源由 `lucide-react` 改为 `reicon-react`（`1.2.6`，MIT，2676 图标，
  支持 `Outline` / `Filled` 两个权重，默认权重见实现常量）；`components.json` 的 `iconLibrary`
  与 `registry.json` 的组件依赖同步，受影响的 20 处组件源码与 `dist/` 产物一并更新。
- visual adapter 的图标板引擎由 `lucide` 改为 `reicon`（`1.2.5`，MIT）：工具键、能力清单、
  manifest schema 的 tool 枚举与 `examples/visuals/sources/icons.json` 的 10 枚图标名同步更新。
- **vanilla 静态图标层与 morph 变形机制仍取 Lucide 几何**（`patterns/shared/icons.js`、
  `patterns/shared/morph-icons.js` 及其入口不变）。原因：morphicons 只接受描边中心线几何，
  而 reicon 现用 48 枚中约 84% 为填充绘制，morph 中间帧会糊。`adapters/visual/package.json`
  因此保留 `lucide` 依赖，reicon 为新增依赖而非替换。
- 许可证记录同步：`adapters/visual/LICENSES.md` 新增 reicon 及其上游 Solar Icons（CC BY 4.0，
  署名强制）与 Zappicon 条目；reicon 的 npm 包内不含 LICENSE 正文，记为 `declared-only`。
- 影响面：`README.md`、`SKILL.md`、`DESIGN.md`、`AGENTS.md`、`CONTRIBUTING.md`、
  `.agent/maintainer.md`、`patterns/shared/README.md`、`patterns/shared/vendor/README.md`、
  `spec/system.json`、`provenance/coverage.json`（新增吸纳条目）、`components/*.json`、
  `docs/LOCAL_WORKFLOW.md`、`docs/ROADMAP.md` 的现状描述同步更新。
  历史记录（本文件既有条目、两份验收文档、`examples/**/evidence/**`、`provenance/*sync.json`）保持原样。

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
