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

### 1.2 首要画布基准

正式网页设计、视觉验证与导出首先以 **1920 × 1080 px（16:9）** 为唯一首要基准。
先保证 16:9 比例、内容层级、Scene 和可读性；其他视口只在基准通过后做次级适配，
不得反过来改变基准几何。机器读取以 `spec/system.json.viewportBaseline` 为准。

## 2. 场景模型

页面只有三层：唯一 Scene、唯一 Global mask、以及 UltraThin / Regular / Thick /
SolidPlate Surface。同一区域只选一种主材质，禁止 glass-in-glass；玻璃内部使用间距、
分隔线和透明度差分组。

Portal 与起手模板默认使用 `patterns/shared/dot-grid.js` 的本地 Canvas 点阵（旧 assets 入口仅转发）：深色页面底色是
纯黑 `#000000`，浅色是纯白 `#ffffff`，鼠标仅对附近点作有限位移与亮度反馈。表面 token 必须与页面底色一致（`--gary-surface-page` 深色 = `#000000`）：用「近黑」或带色度的灰代替纯黑，视为契约缺陷（2026-10-26 修正）。
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

**K-only 是硬约束，不是形容词**：表面 token（page / sunken / glass ×3 / solid-plate / card-plate / action-fill）
的 chroma 必须为 0。带 chroma 的表面在低亮度下会整片偏蓝，与中性卡并排立刻露馅（2026-10-26 修正）。

**SolidPlate 自带几何**：`.gary-solid-plate` 单独使用时也必须呈圆角（`--gary-radius-card`），
变体为 `--default` / `--subtle` / `--inverse`，内部标题与数值用 `__label` / `__value`。
材质类不再只给背景不给形状。

## 4. Token 层

### K-only 底色（硬规则，2026-10-26）

**中性面必须纯 K；有意为之的语义色块走单独的 tint 通道。** 这两件事别混：
「脏灰 / 脏黑」（往 `#141414` 里掺一点蓝或棕，想调中性却调歪了）必须禁；
「明确要一块带色的面」（图表分块、品牌强调块、图片蒙层）不该被同一条规则误伤。

- 范围按 token 角色，不按名字枚举：所有 `*surface*`、`*glass*`、`*plate*`、`*card-surface*`、`*scene*`、
  线类（`*border*`、`*hairline*`、`*line*`、`*edge*`）以及阴影色，取值只能是 `oklch(L 0 H)` 或 R=G=B 的 hex。
- 深色页面底是纯黑 `#000000` / `oklch(0 0 0)`，浅色页面底是纯白；表面只能靠明度分层，不得靠色相。
- **严禁任何带色相的深色或灰色作底**：暖调（`#141414` 里掺一点棕）、冷调（掺一点蓝）都算违规，
  低亮度下会整片偏色，与中性卡并排立刻露馅。
- 唯一允许带色相的是**前景语义色**：状态色（positive / caution / critical）与图表语义色（`spec/chart-recipes.json`）。
  它们只作文字、图标、圆点、细边，不铺大面积底。
- 企业面板层（§4 上一节）同样适用：`#141414` / `#1c1c1c` / `#262626` / `#333333` 的 R=G=B，强调与状态色不进底色。
- **语义色块通道（2026-10-27 明确）**：需要带色底的场景用 `--gary-tint-*` 命名，且必须
  ① 在 `spec/tints.json` 里登记 `bg` / `ink` / `contrast`；② 配一个 `--gary-tint-*-ink` 前景 token；
  ③ `contrast ≥ 4.5`。没有登记、没有配墨、对比度不够的带色底一律算违规。
  默认仍然是 K：tint 是例外，不是日常；一整页里带色块不应超过两处，其余靠明度分层。
- 机器守：`agent/checks/invariants.py` 的 `token_chroma`（全部非状态 token）与 `enterprise_k_only`
  （`spec/archos-enterprise.tokens.json` 的表面 / 线 / 墨 / 强调边）必须同时绿。


### 企业面板层（ArchOS / GarchOS，2026-10-26）

企业面板（工作台、管理台、抽屉、列表）另有一套已定稿的 token，权威是
[spec/ARCHOS-ENTERPRISE-TOKENS.md](spec/ARCHOS-ENTERPRISE-TOKENS.md)（机器可读
[spec/archos-enterprise.tokens.json](spec/archos-enterprise.tokens.json)，已在
`spec/system.json.authorities.enterpriseTokens` 登记）。

- 它是**一层**，不是新主题轴：不改 `data-gary-theme/density/material` 的枚举，也不新增视觉轴。
- 该层底色 `#141414`（暖深黑），强调色亮灰 `#cfd0d3`，选中 `#2a2a2a` + `#6a6b70`；表面平底 + 1px 发丝边，不用玻璃与渐变。
- 边界：报告、展示与 HTML 共创产物继续用本文件默认的纯黑 + 玻璃；工具型工作台用企业面板层。
  两套不混用同一页面，也不互相覆盖 token 名。
- 取值纪律：27 个色值全部来自 `apps/archos-console/src/tokens.css` 与 `三风格对比.html` theme A，
  不新增颜色；加 token 前先回答「哪个组件状态会用到它」。

- 机器真相源：`tokens/tokens.json`；唯一 CSS 入口：`tokens/base.css`。
- 主题：`data-gary-theme="dark|light"`。
- 密度：`data-gary-density="spacious|balanced|compact"`，不降低最低点击尺寸。
- 根主材质：`data-gary-material`；表面仍必须使用 `.gary-ultrathin`、
  `.gary-regular`、`.gary-thick` 或 `.gary-solid-plate`。
  - 根标记仍遵循 invocation schema。元素级 `data-gary-material="glass"` 是新增的中性卡片配方，
    使用同一 token 与 components CSS；不改变根主材质枚举。密集正文与图表不套用互动卡片配方。
- 圆角：工具操作为 44 × 44px 圆形；其余 control 18px / panel 36px / pill 999px；
  card 圆角随尺寸变化（见 §7），仍有 14–28px 的上下限。
- 完整 Demo 是 Portal、组件、模板和制图目录的视觉基线。工具操作优先使用 `data-gary-icon` 与共享图标（React 组件层图标来源 reicon-react；vanilla 静态层与 morph 仍取 Lucide 几何），1.6px 描边；使用 `aria-label` 和悬停标题表达动作，状态切换保留图标。导航、分段筛选、内容选择保留文字。
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
- 正式字号 caption 13 / label 14 / body 16 / lead 18 / title 20–28 / display 32–72px；
  高密度报告的栏头与次级数字可用 micro 12px（`--gary-font-size-micro`），正文不得低于 caption。
- **例外只对 16:9 演示与打印配方**：`profile.json` 声明 `presentationAspectRatio: "16:9"` 的页面，
  页脚、来源与图注允许 9–11px（投影与纸张的观看距离不同于连续阅读）。阅读型页面不适用。
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

### 富文本层级（2026-10-26）

长正文与说明块统一走 `.gary-prose`，不允许在富文本里临时写字号、字重或颜色。四级，只有四级：

| 层级 | 角色 | 字号 / 行高 | 字重 | 颜色 | 用途 |
|---|---|---|---|---|---|
| 主判断 | `.gary-prose__lede` | 18 / 1.68 | 500 | text-primary | 一段话讲完结论，一页只有一条 |
| 小标题 | `h3` / `h4` | 16 / 1.4 | 600 | text-primary | 分组，不承担观点 |
| 正文 | `p` | 16 / 1.68 | 400 | text-secondary | 依据与解释，每段 ≤72 中文字符 |
| 注脚 | `small` / `.gary-prose__note` | 13 / 1.55 | 400 | text-tertiary | 来源、口径、时间 |

规则：

- **一页一个主判断**，出现在第一屏，不藏在第三段。
- **主次靠三件事**：字号档位、字重档位、颜色三级；不靠加粗堆砌，不用第二个强调色。
- 富文本里**禁止**：行内 `!important`、临时 hex 色、`<br>` 排版、以 `<b>` 代替小标题。
- 列表用于并列（同一层级 ≥3 项）；单个结论不用列表包装。
- 引用与代码块用 `.gary-prose q` / `.gary-prose pre`，颜色只用 text-secondary / sunken 表面。

## 7. 几何与动效

### 密度与栏数（2026-10-26）

高密度报告与面板**默认三栏竖排**：左「风险 / 待处理」、中「已处理 / 证据」、右「待办 / 改动」。**禁止只做两栏**——
两栏在同等信息量下会把每列拉到 700px 以上，扫描路径变长，且必然出现大片竖向空白。
单列表格不属于两栏，可作为更高密度的替代；两栏只在窄屏（<880px）由三栏塌缩时出现。

判定顺序：先算一条判定占多少高度（40–48px 为健康值），再决定栏数；信息量撑不满三栏时，用验收线、改动清单等
真实内容补齐，不要靠留白凑版面。

### 分块对齐（2026-10-26）

同一版面里的块必须共用一套对齐关系，不能各写各的：

1. **等高**：并排的面板用 `align-items: stretch` + 内部 `display:flex; flex-direction:column`，顶边与底边同时对齐。
   行数少的块把富余摊成**均匀行距**（`justify-content: space-between`），不要在面板底部堆一块空白。
2. **共用列轨道**：面板下方的次级区块（富文本带、结论条）复用上方同一套 `grid-template-columns` 与 `gap`，
   于是右侧小卡自动落在最右栏的左右边缘上，不需要二次对宽度。
3. **内容左缘一致**：面板内边距 18px 时，正文块的左内边距取 19px（含 1px 边框），文字与栏头落在同一条竖线上。
4. **页脚同高**：各栏末尾的说明行统一 13px、落在同一 y 上；没有说明的栏留同高留白，不要用别的内容顶替。
5. **一行一个节奏**：同一栏内行距恒定；跨栏允许不同（8 条与 4 条的信息量不同），但同一栏内不得出现两三种间距。
6. **内边距 ≥ 圆角的一半**：32px 圆角配 10px 内边距时圆弧会切掉栏头，实测内边距 <14px 必然出问题。
7. **几何由组件承载**：面板用 `.gary-glass-card` 拿圆角、内边距与分层描边，页面只写排版，
   不自己写 `border` / `box-shadow` / `border-radius` —— 手写会把共享材质的四边描边和三层阴影压掉。
8. **玻璃与实板分工**：报告的三栏允许全部是 `GlassCard`（判断与状态用玻璃），
   长正文、参数表、来源条留纸面或 `SolidPlate`；不把连续阅读的正文套进玻璃。

内外圆角同心；主卡圆角随卡片尺寸变化——`r = clamp(14px, 4% × 卡片宽度, 28px)`，与
`--gary-radius-card: clamp(14px, 6cqi, 28px)` 上下限一致（无脚本时按视口 6cqi 兜底，有脚本时按卡片宽度 4%）。
在根或容器加 `data-gary-radius="auto"` 并加载 `patterns/shared/radius.js` 即可，元素级可用
`data-gary-radius-min/max/ratio` 覆盖；小卡不再被套上大圆角，宽卡也不会显得生硬。内部卡使用 16–20px；均衡密度以 8px 为组件节奏，
并按 8 / 16 / 24px 组织留白。自定义主卡使用 70% 表面透明度与 8% 层级对比。
hover 只在精确指针设备使用轻微位移或阴影，active 在 100–160ms 内回应。UI 运动不超过
300ms，必须从当前画面值继续并允许立即打断；只有真实动量交互可以 bounce。键盘焦点必须清晰，
动效只表达状态变化。`prefers-reduced-motion` 下取消位移、弹性与视差，保留轻柔透明度或颜色反馈。

### 工业界面品味（2026-10-26，`data-gary-taste="industrial"`）

对象是数据密集、工具型、高频使用的工作台，不是营销页。默认的玻璃味（GlassCard + 分层阴影 + 光学边缘）
只在报告与展示页成立；工具型界面切到这个轴，规则如下。

**三条硬约束**

1. **底色不带色相**：`--gary-surface-*`、`--gary-hairline-*`、`--gary-text-*`、`--gary-accent-neutral`
   的 chroma 恒为 0（`oklch(L 0 0)`），暖调、冷调都算违规。带色相的深色/灰色不得用作底。
2. **分层靠明度，不靠装饰**：`page → card(0.145) → raised(0.195) → overlay(0.175)` 四档明度 + 1px 发丝边；
   不叠投影、不叠毛玻璃、不叠渐变。唯一的阴影给抽屉与浮层（`.gary-overlay`）。
3. **交互只改底色**：hover 提亮一档、active 再提一档，不改位移、不改尺寸、不发光；
   键盘焦点用亮灰描边 `--gary-accent-neutral`，不用彩色环。

**刻度**

| 项 | 工业轴取值 | token |
|---|---|---|
| 圆角 | 控件 8 / 卡片 12 / 面板 16 / 胶囊 999 | `--gary-radius-control/card/panel/pill` |
| 字号 | 26 标题 / 17 小节 / 13 正文 / 11 数据 / 10 极弱 | `title-micro-data-nano` 五档 |
| 间距 | 4 的倍数，卡片与列表 gap 6 | `--gary-space-*`、`--gary-grid-gap` |
| 动效 | 120–180ms，ease-out，只在状态变化时 | `--gary-duration-press/ui` |
| 栅格 | `repeat(auto-fill, minmax(150px, 1fr))`，不写死列数 | — |

**文字五级**：`text-strong`（标题/姓名）→ `text-body`（正文）→ `text-meta`（meta 值）→
`text-caption`（说明）→ `text-faint`（占位/工号）。层级只靠明度，不换色相；正文不小于 13px，
数据格不小于 11px，工号与时间戳可用 10px（仅限这两类，不用于说明文字）。

**状态与选中**：空闲绿 / 已排挡金 / 停用红，只落在边框、小圆点与数字上，不铺底、不做彩虹色。
选中态 = `--gary-selected-fill` 中性深灰底 + `--gary-selected-edge` 亮灰描边，不用暖棕、不用品牌大色块。
空态、加载态、错误态都要有文案，不许留空白。

**零死按钮**：看着像能点的必须真有反应；hover / active / focus 三态齐全；动效尊重 `prefers-reduced-motion`。

**反 slop 红线**：渐变背景（抽屉封面除外）、毛玻璃铺满、发光边框、彩色大 hero、
超过一个强调色、按钮全胶囊、装饰性图标、为动而动的动效 —— 一律不做。

参考实现：`patterns/industrial/index.html`（排班工作台：左侧 232px 导航 + 状态筛选 + 12 张成员卡 +
抽屉改状态 + 今日变更记录；12 个交互全部实测可用，390px 无横向溢出）。

**已知坑**：底色来自主题变量的元素不要常驻 `transition`。切换 `data-gary-theme` 时
Chromium 会把旧底色卡住（实测从深色切浅色后卡片仍停在 `oklch(0.145 0 0)`）。
过渡只挂在 `:hover / :active / :focus-visible / [aria-selected] / [aria-pressed]` 上。

### 报告排版：同一结论只渲染一次（硬规则，2026-10-27）

一条结论在页面上只出现一次。多组件共用同一个结论字段时，只渲染一次，其余组件引用它的编号或标题。

判据（机器闸同口径）：正文里两段文本在**去空白、去 `&nbsp;` 实体**后完全相同、长度 ≥20 字、且含中文标点
（。，；：、）→ 判为重复。标题、跑马头、标签不算结论（无标点或不足 20 字）。
改写（同义不同字）不判重复——这是精度限制，靠人工核。

典型违规：水印大字、正文、右侧卡、核心判断卡各渲染一次同一句话。

**强制范围**：`patterns/recipes/**`（报告页）与任何用 `--page` 显式送审的页面。目录页与演示页天然会重复标签，不强制。
免责声明（含「免责 / 示意 / 不代表 / 数据来源」）与标题、跑马头不计入。
不计入：导航目录（`<nav>`）、代码块、标题与跑马头、免责/示意类声明（含「免责 / 示意 / 不代表 / 数据来源」）。
判据会把全角统一成半角、抹掉零宽字符后比对；同一段之内重复出现也判。

### 报告正文用语：内部编码不许出现在正文（硬规则，2026-10-27）

工程的编号系统（`SC1` / `SC2` / `AD3` / `SRC-MKT-01` / 章节 id / 来源登记号）是给索引用的，不是给读者看的。

1. **正文只写中文人话**：读者读到的是「需求结构与画像」，不是「SC2·02」；来源写「2021 年 4984 户问卷」，
   不是「SRC-MKT-01」。编号留在索引抽屉里，正文不出现。
2. **索引区**：页面可留一个溯源区，承载它的容器必须显式写 `data-gary-index`（写在 `body`/`html` 上无效）
   （`<div data-gary-index>` 即可，类名叫什么都行）。这是唯一豁免方式：正文挂个 `internal-*` 类名不算，
   嵌套几层也不影响判定。代码块 `<pre>` / `<code>` 同样豁免。
3. **一处定义**：编号到人话的对照只维护一张表（放抽屉里或附录），正文各章引用中文名，不各写一套别名。
4. 机器闸：`agent/checks/invariants.py` 的 `check_internal_codes`（`--page` 与 `report_text` 都会跑）。

### 表面几何：卡片必须有圆角（硬规则，2026-10-27）

**禁止方角卡片。宁可不要衬底，也不要一块方角色块。**

1. **什么算卡片**：有背景填充、**不贴页面边缘**、独立成块的表面（判断卡、分块、提示条、徽章区）。
   这类块圆角 ≥ 8px；默认轴用 `--gary-radius-card`（`clamp(14px, 6cqi, 28px)`），
   工业轴按 8 / 12 / 16 取。控件圆角是 `--gary-radius-control`（18px），不属本条。
2. **什么不算卡片**（不参与本条）：页面与场景底（`html` / `body` / `.pattern-scene` / 带 `data-gary-scene` 的底）、
   贴边块（侧栏 rail、全宽 band、右滑抽屉、进度条与轨道、分隔线、点阵与网格）、
   表格单元与表格行（靠 1px 分隔线分区）、图表标记（柱、线、点的几何由数据决定）、图标字形、
   `.gary-*` 组件（几何由组件层提供，只有组件自己在同一条规则里把圆角压到 <8px 才算违规）。
3. **圆角值必须成立**：px / rem / em 换算后取**最小角**判；`0%` 等于 0；`50%` 以上视为胶囊/圆形；
   `var(--gary-radius-*)` 必须能在 `tokens/base.css` 解析出 ≥8px，解析不出按缺陷报；
   页面里用 `var(--gary-*)` 却没引 `tokens/base.css`（也没内联定义）同样判缺陷——变量没装载，圆角实际是 0。
4. **宁可没有底**：分不出层级时不要加底、不要加线，改用留白（24/32px）、字号或字重分节。
5. **禁止彩色左边条**：`border-left` / `border-inline-start` ≥2px 且**带色相**才算违规
   （中性发丝线可用）；状态判定行用 `box-shadow: inset 2px 0 0` 且该行不加底。
6. 机器闸：`agent/checks/page_scan.py`（`no_square_card` 与 `--page` 共用），按上表分「卡片 / 非卡片」判，
   不按类名关键词猜；`--all` 才扫历史演示页。

### 报告正文用语：内部编码不许出现在正文（硬规则，2026-10-27）

工程的编号系统（`SC1` / `SC2` / `AD3` / `SRC-MKT-01` / 章节 id / 来源登记号）是给索引用的，不是给读者看的。

1. **正文只写中文人话**：读者读到的是「需求结构与画像」，不是「SC2·02」；来源写「2021 年 4984 户问卷」，
   不是「SRC-MKT-01」。编号留在索引抽屉里，正文不出现。
2. **索引区**：页面可留一个溯源区，承载它的容器必须显式写 `data-gary-index`（写在 `body`/`html` 上无效）
   （`<div data-gary-index>` 即可，类名叫什么都行）。这是唯一豁免方式：正文挂个 `internal-*` 类名不算，
   嵌套几层也不影响判定。代码块 `<pre>` / `<code>` 同样豁免。
3. **一处定义**：编号到人话的对照只维护一张表（放抽屉里或附录），正文各章引用中文名，不各写一套别名。
4. 机器闸：`agent/checks/invariants.py` 的 `check_internal_codes`（`--page` 与 `report_text` 都会跑）。

### 外壳不加分隔线（硬规则，2026-10-26）

侧栏与主工作区之间**不画竖线**：不写 `border-right`、不加 1px 分隔、不用阴影当分隔。
两者靠**表面明度差**过渡——深色层 `#141414` 页面 → `#1c1c1c` 卡片 / 侧栏（Δ8），浅色层同理。

- 适用范围：Gary-UI 自己的版式（`patterns/application-modes`、`patterns/industrial`、`portal`、`session`）
  与 DSH 外壳是同一条规则；DSH 侧的具体坑位见 `C:\GarchOS\ArchOS\AGENTS.md`「外壳规则」。
- 侧栏内部的分组线、导航项之间的线不在禁止之列——禁的是「侧栏 ↔ 工作区」这条外框线。
- 靠线分不开时不要加线，改明度：把侧栏或工作区抬一档（`#141414 ↔ #1c1c1c`），或把内容内缩 24px。

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

分析图表与表格以[图表表达规范](docs/CHART_EXPRESSION.md)和[机器规则](spec/chart-recipes.json)为准：17 类选型、7 种标注，明确问题、数据前提、尺度、语义色、文字层次与来源。标注绑定对象与依据，推导判断随数据重算或失效；不能把行业字段、固定编号或原图颜色当作通用规则。[demo0909](demo0909.html)用跨领域输入验证五种[共享 SVG 参考配方](patterns/shared/chart-recipes.js)，不代表全部类型自动实现；其余走既有工具，正式适配器与导出契约不变。参数的自动消费与作者审查边界见规范的调用说明。图示（架构 / 流程 / 时序 / 状态）另按[图示表达规范](docs/DIAGRAM_EXPRESSION.md)与[机器规则](spec/diagram-recipes.json)：边界承载状态命题、节点只写事实身份、线型承担成立性、跨边界连接必须绕行；缺口与风险不用颜色表达。

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

所有 `patterns/recipes/*` 配方都必须带 `profile.json`（写明 3 × 4 组合、列模板、材质分工与检查入口），
示例不含项目数据。配方在 `patterns/starting-points/index.html` 的「配方」区块登记，登记只加版式入口，
不新增视觉轴、不生成 token 副本。

## 9. 扩展边界

- 图标可用 reicon-react（React 组件层）或系统图标；vanilla 静态层与 morph 仍取 Lucide 几何。无论哪层都继续消费 Gary tokens。
- 图表库保持中立；Gary-UI 规定容器和证据表达，不绑定具体库。
- Dialog 使用成熟可访问 primitive，再以 Thick/SolidPlate 呈现。
- 通用数据表使用原生 table + SolidPlate；比较任务才用 ComparisonTable。
- React 适配保持 `5/15-demand-driven`，发布边界保持 `internal`。

## 10. 验收门槛

- `python -B agent/checks/invariants.py` 通过（母库自洽：中性 token 色度为 0、页面底色深黑浅白、
  契约类存在、两个验收器同时为绿）。这一条优先于任何单页视觉检查。
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
