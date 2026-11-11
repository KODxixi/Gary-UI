# Gary-UI 组件选择指南

> 真相源：外部 agent 决定"用哪个组件"时读这个文件。
> 设计规范（variant/size/state）在 `components/*.json`，本文件只回答**什么时候用、什么时候不用、和谁像、怎么选**。

## 决策树：我要做什么？

```
我要做一个操作入口
├── 单个动作 → Button
├── 一组相关动作聚簇 → ButtonGroup
├── 展开选项 → DropdownMenu（按钮触发）/ Command（⌘K 全局搜索）
└── 拖拽手柄 → Resizable

我要做一个浮层
├── 确认/破坏性操作 → AlertDialog（必须取消）
├── 表单/内容展示 → Dialog（居中模态）
├── 侧边滑入面板 → Sheet（右）/ Drawer（移动端底部）
├── 从锚点弹出小内容 → Popover（任意锚点）
├── 悬停提示 → Tooltip（纯文字）/ HoverCard（富内容）
├── 右键菜单 → ContextMenu
├── 底部全局通知 → Sonner
└── 命令面板 → Command（⌘K，搜索+跳转）

我要做表单
├── 单行文本 → Input
├── 多行文本 → Textarea
├── 开关 → Switch
├── 是/否/多选 → Checkbox
├── 单选 → RadioGroup
├── 下拉选择 → Select（原生可控替换）
├── 数值范围 → Slider
├── OTP/验证码 → InputOTP
├── 带 addon 的输入 → InputGroup
└── 完整表单（含 label/错误态）→ Form + Field

我要展示数据
├── 表格 → Table（静态）/ DataTable（排序/过滤/分页）
├── 图表 → Chart（基于 recharts）
├── 日期选择 → DatePicker（单/范围）+ Calendar
├── 时间线/步骤 → Stepper（暂无，用 Tabs 或自定义）
└── 空数据 → EmptyState

我要做布局
├── 卡片 → Card（内容容器）/ SolidPlate（实底证据板）
├── 侧边导航 → Sidebar
├── 选项卡 → Tabs
├── 手风琴 → Accordion / Collapsible
├── 轮播 → Carousel
├── 滚动区 → ScrollArea
├── 分栏可拖拽 → Resizable
├── 占位加载 → Skeleton / Spinner
└── 提示条 → Alert（内联）/ Sonner（浮层）

我要做导航
├── 面包屑 → Breadcrumb
├── 顶部菜单 → NavigationMenu / Menubar
├── 分页 → Pagination
└── 返回顶部 → ScrollArea + 自定义
```

## 相似组件对比

| 场景 | 选 A | 选 B | 区别 |
|---|---|---|---|
| 模态 | **Dialog** | **AlertDialog** | Dialog 可含任意内容（表单/图片）；AlertDialog 只用于确认/危险操作，必须有取消按钮 |
| 侧边面板 | **Sheet** | **Drawer** | Sheet 是桌面端右侧滑入；Drawer 是移动端底部抽屉，支持手势拖拽 |
| 弹出层 | **Popover** | **DropdownMenu** | Popover 内容任意（表单/卡片）；DropdownMenu 只做菜单项列表 |
| 提示 | **Tooltip** | **HoverCard** | Tooltip 是纯文字短提示（1-2 秒消失）；HoverCard 是富内容悬停预览（卡片/链接） |
| 折叠 | **Accordion** | **Collapsible** | Accordion 一次只开一个（手风琴）；Collapsible 可独立开关任意多个 |
| 表格 | **Table** | **DataTable** | Table 是静态展示；DataTable 带排序/过滤/分页（@tanstack/react-table） |
| 输入 | **Input** | **InputGroup** | Input 是裸输入框；InputGroup 带左右 addon（前缀图标/后缀按钮） |
| 按钮组 | **ButtonGroup** | **ToggleGroup** | ButtonGroup 是动作按钮聚簇；ToggleGroup 是多选/单选切换（开关状态） |
| 文本提示 | **Alert** | **Sonner** | Alert 是页面内联提示条（常驻）；Sonner 是浮层自动消失通知 |

## 组件速查（58 个）

### 基础（11）

| 组件 | 什么时候用 | 什么时候不用 | import |
|---|---|---|---|
| Button | 任何可点击的操作入口 | 导航链接（用 `<a>`）；纯展示 | `Button` |
| ButtonGroup | 一组相关按钮需要视觉聚簇（如对齐/字号切换） | 单个按钮；不相关的按钮 | `ButtonGroup` |
| Card | 内容容器，带玻璃材质和圆角 | 全页面容器（用主布局）；纯文字段落 | `Card, CardContent` |
| Chip | 小型标签/状态/筛选标记 | 长文本；主要操作 | `Chip` |
| SolidPlate | 实底证据板/数据表格底板（不折射） | 需要玻璃质感的内容卡 | `SolidPlate` |
| EvidenceBar | 证据强度可视化条 | 普通进度条（用 Slider） | `EvidenceBar` |
| Separator | 内容分组分隔线 | 边框；布局间距 | `Separator` |
| Skeleton | 加载中占位（骨架屏） | 已知内容为空（用 EmptyState） | `Skeleton` |
| Spinner | 小型加载指示器（按钮内/行内） | 全屏加载；骨架屏 | `Spinner` |
| Switch | 开/关二元设置 | 多选（用 Checkbox）；单选（用 RadioGroup） | `Switch` |
| Kbd | 键盘快捷键展示（⌘K） | 普通文字 | `Kbd` |

### 表单（11）

| 组件 | 什么时候用 | 什么时候不用 | import |
|---|---|---|---|
| Input | 单行文本输入 | 多行（用 Textarea）；下拉（用 Select） | `Input` |
| Textarea | 多行文本输入 | 单行 | `Textarea` |
| InputGroup | 需要前后缀（$ 前缀 / @ 后缀按钮） | 裸输入 | `InputGroup` |
| InputOTP | 验证码/一次性密码输入（6 格） | 普通密码（用 Input type=password） | `InputOTP` |
| Label | 表单字段标签 | 普通文字标题 | `Label` |
| Form | 完整表单（含 context/错误态/resolver） | 单个输入框 | `Form, FormField` |
| Field | 表单字段容器（label + input + error + description） | 独立表单外的输入 | `Field` |
| Checkbox | 多选/同意条款 | 单选（用 RadioGroup）；开关（用 Switch） | `Checkbox` |
| RadioGroup | 单选列表（3-7 个选项） | 下拉（用 Select）；开关 | `RadioGroup` |
| Select | 下拉选择（替代原生 `<select>`） | 可搜索（用 Command）；级联选择 | `Select` |
| Slider | 数值范围选择（音量/亮度） | 精确数值输入（用 Input） | `Slider` |

### 浮层与导航（13）

| 组件 | 什么时候用 | 什么时候不用 | import |
|---|---|---|---|
| Dialog | 居中模态框（表单/详情/设置） | 确认操作（用 AlertDialog）；侧边面板 | `Dialog, DialogContent` |
| AlertDialog | 危险/破坏性操作确认（删除/提交） | 非破坏性模态（用 Dialog） | `AlertDialog` |
| Sheet | 桌面端右侧滑入面板（详情/设置） | 移动端（用 Drawer）；居中模态 | `Sheet, SheetContent` |
| Drawer | 移动端底部抽屉（手势拖拽） | 桌面端（用 Sheet） | `Drawer, DrawerContent` |
| Popover | 从锚点弹出任意内容（颜色选择器/日期预览） | 菜单项列表（用 DropdownMenu） | `Popover, PopoverContent` |
| Tooltip | 悬停纯文字短提示（图标按钮说明） | 富内容预览（用 HoverCard） | `Tooltip, TooltipContent` |
| HoverCard | 悬停富内容预览（用户名片/链接预览） | 纯文字提示（用 Tooltip） | `HoverCard, HoverCardContent` |
| DropdownMenu | 按钮触发下拉菜单（操作列表） | 任意内容弹层（用 Popover）；全局搜索 | `DropdownMenu` |
| ContextMenu | 右键菜单 | 左键触发（用 DropdownMenu） | `ContextMenu` |
| Menubar | 顶部菜单栏（File/Edit/View） | 移动端导航（用 NavigationMenu） | `Menubar` |
| NavigationMenu | 顶部导航菜单（产品分类） | 菜单栏风格 | `NavigationMenu` |
| Command | ⌘K 命令面板（搜索/跳转/操作） | 普通下拉（用 Select） | `Command, CommandDialog` |
| Sonner | 底部全局通知（成功/失败/动作按钮/进度） | 内联常驻提示（用 Alert） | `Sonner` |

### 布局与数据（12）

| 组件 | 什么时候用 | 什么时候不用 | import |
|---|---|---|---|
| Table | 静态表格展示 | 需要排序/过滤（用 DataTable） | `Table` |
| DataTable | 动态表格（排序/过滤/分页） | 静态展示（用 Table） | `DataTable` |
| Tabs | 选项卡切换内容 | 手风琴折叠（用 Accordion） | `Tabs` |
| Accordion | 手风琴折叠（FAQ，一次一个） | 独立折叠多个（用 Collapsible） | `Accordion` |
| Collapsible | 独立可折叠区块 | 一次只开一个（用 Accordion） | `Collapsible` |
| Carousel | 轮播图/卡片 | 单图展示 | `Carousel` |
| Resizable | 可拖拽分栏面板 | 固定布局 | `ResizablePanelGroup` |
| ScrollArea | 自定义滚动区（带滚动条样式） | 页面级滚动 | `ScrollArea` |
| Sidebar | 侧边导航栏（桌面+移动） | 顶部导航（用 NavigationMenu） | `Sidebar` |
| Pagination | 分页控件 | 无限滚动 | `Pagination` |
| AspectRatio | 固定宽高比容器（图片/视频） | 自适应容器 | `AspectRatio` |
| EmptyState | 空数据/空搜索结果提示 | 加载中（用 Skeleton） | `EmptyState` |

### 展示（7）

| 组件 | 什么时候用 | 什么时候不用 | import |
|---|---|---|---|
| Alert | 页面内联提示条（常驻，如"无法保存"） | 浮层自动消失通知（用 Sonner） | `Alert` |
| Avatar | 用户头像 | 品牌 Logo | `Avatar` |
| Breadcrumb | 面包屑导航（层级路径） | 顶部菜单 | `Breadcrumb` |
| Chart | 数据可视化（基于 recharts） | 非数据图表 | `ChartContainer` |
| Calendar | 日历选择器 | 日期范围选择（用 DatePicker） | `Calendar` |
| DatePicker | 日期/日期范围选择 | 纯日历展示 | `DatePicker` |
| Typography | 排版组件（H1-H4/Lead/Body/Muted） | 自定义字号 | `H1, H2, Body, Muted` |

## Spring 动效选择

浮层组件入场用 `useSpringStyle`，不用 CSS transition：

| 组件 | response | damping | 说明 |
|---|---|---|---|
| DropdownMenu / Popover / Tooltip | 0.2s | 1.0 | Fast：快速弹出 |
| Dialog overlay / Sonner | 0.3s | 1.0 | Medium：标准浮层 |
| Dialog content | 0.35s | 1.0 | Slow：materialize（scale + blur + opacity） |
| Sheet / Drawer slide | 0.3s | 0.8 | Momentum：带过冲的惯性滑入 |

## 外部 Agent 调用规则

1. **选组件先读这个文件**，不要凭组件名猜
2. **设计规范查 `components/<slug>.json`**，本文件不重复
3. **token 查 `tokens/tokens.json`**，本文件不重复
4. **浮层入场一律用 `useSpringStyle`**，不用 CSS transition
5. **修改 token 先改 JSON 再跑 `tokens:generate`**，不直接改 CSS
