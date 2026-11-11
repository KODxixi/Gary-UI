# ArchOS 企业面板 · Gary-UI Token 规范 v1.5（灰阶收敛版）

> 18 个色值（其中灰阶 11 个）· 6 字号 · 4 圆角 · 6 间距 · 2 时长 · 6 组件态 + 3 页面态
> **范围**：ArchOS / GarchOS 企业面板（工作台、管理台、抽屉、列表）。不含 DSH 原生聊天 chrome。
> **状态**：design-system-only：只定义 token 与规则，不改运行时 CSS、不部署。
> **存档**：v1.1 `ARCHOS-ENTERPRISE-TOKENS.v1.1.md`，v1.0 `…v1.0.md`

## 0. 这版收敛了什么

上一版还有 20 个灰阶值，相邻档只差 1–3 级（`#191919` / `#1a1a1a` / `#1c1c1c` 几乎同色）。这版按「相邻差 < 8 就合并」重排成三条阶梯：

**表面阶梯（4 档，Δ 8 / 10 / 13）**

| 档 | 值 | 用途 | 与上一档 Δ |
|---|---|---|---|
| L0 | `#141414` | 页面底 | — |
| L1 | `#1c1c1c` | 卡片 / 列表 / 面板 / 抽屉 | +8 |
| L2 | `#262626` | 悬停 / 按下 | +10 |
| L3 | `#333333` | 1px 分隔线 | +13 |

**选中与强调阶梯（3 档）**：`#2a2a2a` 选中底 → `#6a6b70` 选中边 / 控件边界 → `#cfd0d3` 强调与焦点。

**文字阶梯（4 档，Δ 34 / 38 / 51）**：`#7c7d81` 占位 → `#9d9ea2` 说明 → `#c3c4c7` 正文 → `#f7f7f7` 标题。

总计 **11 个灰阶 + 7 个状态色 = 18 个色值**（v1.1 是 27 个 token / 20 个灰阶）。

## 1. 怎么用

1. `--gary-*` 是规范源，`--archos-*` 是语义别名；面板 CSS 只允许用 `--archos-*`，不允许出现 hex。
2. 加 token 前先回答「哪个组件状态会用到它」，答不出就不加。
3. 想再加一档灰，先证明它跟相邻档能看出差别（Δ ≥ 8）。

## 2. 颜色

### 2.1 表面（3）

| token | 值 | 用途 | `--archos-*` |
|---|---|---|---|
| `--gary-surface-page` | `#141414` | 页面底 / 导航底（用 1px 线分隔，不再给导航单独底色） | `--archos-bg` |
| `--gary-surface-card` | `#1c1c1c` | 卡片 / 列表 / 面板 / 抽屉（一档表面） | `--archos-surface` |
| `--gary-surface-hover` | `#262626` | 悬停 / 按下（唯一抬升档） | `--archos-surface-raised` |

### 2.2 分隔线（1）

| token | 值 | 用途 | `--archos-*` | 对比度 |
|---|---|---|---|---|
| `--gary-line` | `#333333` | 1px 分隔线（装饰，不承担控件边界） | `--archos-border` | 1.35:1（装饰性，不承担控件边界） |

控件边界用 `--gary-accent-edge` `#6a6b70`（在卡片上 3.21:1，满足 1.4.11 的 3:1）。

外壳例外：**侧栏与工作区之间不加分隔线**，靠 `#141414 → #1c1c1c` 的明度差过渡；
DSH 在侧栏最外层 wrapper 画的 `0.5px` `--dsw-alias-border-l3` 要清零（做法与反面清单见 `ArchOS/AGENTS.md`「外壳规则」）。

### 2.3 文字（4，底 `#1c1c1c`）

| token | 值 | 用途 | 对比度 |
|---|---|---|---|
| `--gary-text-strong` | `#f7f7f7` | 标题 / 姓名 / 选中项 | 15.91:1 |
| `--gary-text-body` | `#c3c4c7` | 正文（默认文字色） | 9.77:1 |
| `--gary-text-meta` | `#9d9ea2` | 说明 / 时间戳 | 6.37:1 |
| `--gary-text-faint` | `#7c7d81` | 占位 / 禁用 | 4.14:1 |

> `faint` 4.14:1 低于 AA，只给占位与禁用；正文一律 ≥ `text-body`。

### 2.4 强调与选中（3 + 2 别名）

| token | 值 | 语义 |
|---|---|---|
| `--gary-accent` | `#cfd0d3` | 唯一强调色；同时是键盘焦点环 |
| `--gary-accent-edge` | `#6a6b70` | 选中描边 / 控件边界 / 强调边 |
| `--gary-wash` | `#2a2a2a` | 选中底 / 头像底 |
| `--gary-on-accent`（别名） | `#141414` | 亮灰填充上的文字 = 页面底 |
| `--gary-focus`（别名） | `#cfd0d3` | 焦点环 = 强调色 |

头像用 `--gary-wash` 底 + `--gary-text-strong` 字；chip 用 `--gary-surface-hover` 底；抽屉头用 `--gary-surface-hover` 平底 + `--gary-line` 边——不再有封面渐变，也不再给头像单独取色。

### 2.5 状态（7，一套语义）

| token | 值 | 语义 | `--archos-*` |
|---|---|---|---|
| `--gary-state-idle` | `#5aa87f` | 空闲 | `--archos-status-idle` |
| `--gary-state-idle-text` | `#a8d8c2` | 空闲文字 | `--archos-status-idle-text` |
| `--gary-state-scheduled` | `#d9a04b` | 已排挡 | `--archos-status-scheduled` |
| `--gary-state-scheduled-text` | `#e8c992` | 已排挡文字 | `--archos-status-scheduled-text` |
| `--gary-state-inactive` | `#c05a6a` | 停用 | `--archos-status-inactive` |
| `--gary-state-inactive-text` | `#e5aeb8` | 停用文字 | `--archos-status-inactive-text` |
| `--gary-state-running` | `#f59e0b` | 运行中 | `--archos-status-running` |

在卡片 `#1c1c1c` 上：空闲 5.96:1 · 已排挡 7.37:1 · 停用 3.99:1（色块/边，非正文）· 运行中 7.94:1。

## 3. 被删掉的 9 个 token

| 删掉 | 原值 | 替代 | 理由 |
|---|---|---|---|
| `--gary-surface-rail` | `#1a1a1a` | `--gary-surface-page` | 导航与页面只差 6 级明度，肉眼不分；用 1px 线分隔即可 |
| `--gary-surface-card` | `#191919` | #1c1c1c（同名替换） | 卡片与浮层原本分两档，差 3 级；合并成一档表面 |
| `--gary-line` | `#232323` | `--gary-line #333333` | 与 #333 差 16 级但都在低端；只留一档可见分隔线 |
| `--gary-text-primary` | `#ececec` | `--gary-text-strong / --gary-text-body` | #f7f7f7 与 #ececec 只差 11 级，四级文字足够 |
| `--gary-chip` | `#303030` | `--gary-surface-hover` | chip 底用抬升档，不再单独取色 |
| `--gary-avatar` | `#4d5563` | `--gary-wash` | slate 带冷调，头像底改用中性选中底 |
| `--gary-avatar-text` | `#f2f3f5` | `--gary-text-strong` | 与 #f7f7f7 只差 5 级 |
| `--gary-cover-top` | `#333230` | `--gary-surface-hover` | 抽屉封面渐变是全系统唯一的色相底，直接删掉 |
| `--gary-cover-bottom` | `#1d1d1d` | `--gary-surface-card` | 与卡片差 1 级，无信息 |

## 4. 字号（6）

| 角色 | 字号 | 行高 | 字重 | 用途 | `--archos-*` |
|---|---|---|---|---|---|
| h1 | 26px | 1.25 | 500 | 视图标题 | `--archos-font-title` |
| h2 | 17px | 1.35 | 500 | 区块 / 面板标题 | `--archos-font-xl` |
| body | 14px | 1.5 | 400 | 正文；强调用同字号 600 | `--archos-font-lg` |
| dense | 13px | 1.5 | 400 | 表格正文 / 密集列表 | `--archos-font-md` |
| meta | 12px | 1.45 | 400 | meta 值 / 时间戳 | `--archos-font-sm` |
| micro | 11px | 1.4 | 400 | 说明 / 页脚 / 图注 | `--archos-font-xs` |

## 5. 圆角（4）与间距（6）

| 圆角 token | 值 | 用途 | `--archos-*` |
|---|---|---|---|
| `--gary-radius-control` | 8px | 按钮、输入、分段控件 | `--archos-radius-sm` |
| `--gary-radius-card` | 12px | 卡片、列表、成员卡 | `--archos-radius-md` |
| `--gary-radius-panel` | 16px | 面板、抽屉、浮层 | `--archos-radius-lg` |
| `--gary-radius-pill` | 999px | 胶囊 / 头像 | `--archos-radius-pill` |

| 间距 | 用途 | `--archos-*` |
|---|---|---|
| 4px | 图标与文字 | `--archos-space-1` |
| 8px | 组件内节奏 | `--archos-space-2` |
| 12px | 卡片内边距 | `--archos-space-3` |
| 16px | 区块间距 | `--archos-space-4` |
| 24px | 面板内边距 | `--archos-space-6` |
| 32px | 页面与章节间距 | `--archos-space-8` |

8px 栅格（容忍 4 / 6 / 36 历史值）；侧栏 232、内容上限 1440；数据网格 gap 6、`auto-fill minmax(150px,1fr)`。

## 6. 动效（2）

| token | 值 | 用途 | `--archos-*` |
|---|---|---|---|
| `--gary-duration-press` | 120ms | 按下 / 激活 | `--archos-motion-press` |
| `--gary-duration-ui` | 160ms | 悬停、展开、抽屉、toast | `--archos-motion-ui` |

缓动 `--gary-ease-out` = `cubic-bezier(0.23, 1, 0.32, 1)`；`prefers-reduced-motion: reduce` → 0ms，全部瞬切。

## 7. 状态

| 组件态 | 规格 | 备注 |
|---|---|---|
| 悬停 | 底 #1c1c1c → #262626，边 #333333 → #6a6b70 | 只换底色与边，不位移不缩放 |
| 按下 | 底 #262626，边 #6a6b70，120ms | 立即响应，不做回弹 |
| 键盘焦点 | 2px #cfd0d3 描边 + 2px 偏移 | 仅 :focus-visible；#cfd0d3 在 #1c1c1c 上 11.05:1 |
| 选中 | 底 #2a2a2a，边 #6a6b70，字 #f7f7f7 | 选中与焦点叠加：内选中、外焦点 |
| 禁用 | 底 #1c1c1c，字 #7c7d81，opacity .55 | 保留 aria-disabled，不再有 hover |
| 空行 | 1px dashed #333333 + 17/500 一句人话 + 主操作 | 表体为空时占位，不留白屏 |

| 页面态 | 规格 | 备注 |
|---|---|---|
| 空态 | 一句人话 + 一个主操作 | 不画插画、不用大图标 |
| 加载 | 骨架条 #262626，1.2s 静态呼吸 | 超 400ms 才出现 |
| 错误 | 中性底 + 1px #c05a6a 边 + #c05a6a 字 + 重试 | 贴在出错位置，不用全局 toast 代替 |

## 8. 红线（8）

- 一个表面只有一个强调色 #cfd0d3；不引入第二个品牌色
- 全系统零渐变（原抽屉封面渐变已删除）
- 不用毛玻璃、不用发光、不叠阴影（浮层一处柔阴影除外）
- 状态色只落在边框、圆点、小标签与数字上，不铺底
- 状态色语义固定：空闲 #5aa87f / 已排挡 #d9a04b / 停用 #c05a6a / 运行中 #f59e0b
- 选中不用暖棕也不用冷蓝：只用地板色 #2a2a2a + #6a6b70
- 灰阶只有 11 个值；再加一档前先证明它和相邻档能看出差别
- 圆角只用 8/12/16/999；动效 ≤160ms 且尊重 reduced-motion

## 9. 别名映射

| `--archos-*` | 指向 | 值 |
|---|---|---|
| `--archos-bg` | `--gary-surface-page` | #141414 |
| `--archos-surface` | `--gary-surface-card` | #1c1c1c |
| `--archos-overlay` | `--gary-surface-card` | #1c1c1c |
| `--archos-surface-raised` | `--gary-surface-hover` | #262626 |
| `--archos-border` | `--gary-line` | #333333 |
| `--archos-border-strong` | `--gary-accent-edge` | #6a6b70 |
| `--archos-text-primary` | `--gary-text-body` | #c3c4c7 |
| `--archos-text-secondary` | `--gary-text-meta` | #9d9ea2 |
| `--archos-text-tertiary` | `--gary-text-faint` | #7c7d81 |
| `--archos-accent` | `--gary-accent` | #cfd0d3 |
| `--archos-accent-edge` | `--gary-accent-edge` | #6a6b70 |
| `--archos-wash` | `--gary-wash` | #2a2a2a |
| `--archos-focus` | `--gary-accent` | #cfd0d3 |
| `--archos-status-idle` | `--gary-state-idle` | #5aa87f |
| `--archos-status-scheduled` | `--gary-state-scheduled` | #d9a04b |
| `--archos-status-inactive` | `--gary-state-inactive` | #c05a6a |
| `--archos-status-running` | `--gary-state-running` | #f59e0b |
| `--archos-radius-sm` | `--gary-radius-control` | 8px |
| `--archos-radius-md` | `--gary-radius-card` | 12px |
| `--archos-radius-lg` | `--gary-radius-panel` | 16px |
| `--archos-radius-pill` | `--gary-radius-pill` | 999px |
| `--archos-font-xs` | `新增` | 11px |
| `--archos-font-sm` | `新增` | 12px |
| `--archos-font-md` | `新增` | 13px |
| `--archos-font-lg` | `新增` | 14px |
| `--archos-font-xl` | `新增` | 17px |
| `--archos-font-title` | `新增` | 26px |
| `--archos-motion-press` | `--gary-duration-press` | 120ms |
| `--archos-motion-ui` | `--gary-duration-ui` | 160ms |

## 10. 落地缺口（六处）

| 文件:行 | 现在 | 应该 |
|---|---|---|
| `apps/archos-dsh/ui/shell/src/client/tokens.css:288` | --archos-accent: var(--gary-focus-ring)（冷蓝） | --archos-accent: var(--gary-accent) |
| `apps/archos-dsh/ui/shell/src/client/tokens.css:280` | --archos-focus: var(--gary-focus-ring) | --archos-focus: var(--gary-accent) |
| `apps/archos-dsh/ui/shell/src/client/panels/admin-panels.css:26` | --archos-accent: #cfd0d3（字面量） | 删除，由 token 层供值 |
| `apps/archos-dsh/ui/shell/src/client/panels/admin-panels.css:2378` | border-color: #6a6b70 | var(--archos-accent-edge) |
| `apps/archos-dsh/ui/shell/src/client/panels/admin-panels.css:2379` | background: #2a2a2a | var(--archos-wash) |
| `apps/archos-console/src/tokens.css:276` | --admin-accent: #d8b98e 等旧值仍在 | 按 §2.4 与 §3 迁移 |

## 11. 与旧 console 规范的差异

| 项 | 旧值 | 新值 | 原因 |
|---|---|---|---|
| 强调色 | #d8b98e 暖 tan | #cfd0d3 亮灰 | owner 指定 |
| 选中态 | 冷蓝 #3b4b6e/#5c7ab8/#eaf0ff | #2a2a2a + #6a6b70 + #f7f7f7 | 冷蓝与暖棕都被否 |
| 表面档位 | 7 档（#141414…#333） | 3 档（#141414 / #1c1c1c / #262626） | 相邻档只差 1–3 级，看不出区别 |
| 文字等级 | 5 级 | 4 级 | #f7f7f7 与 #ececec 视觉重复 |
| 分隔线 | 2 档（#232323 / #333333） | 1 档 #333333 + 控件边用 #6a6b70 | 低端两档灰无意义 |
| 身份色 | 头像 slate / chip / 封面渐变 6 值 | 复用选中底、抬升底、分隔线 | 去掉唯一的色相底与装饰渐变 |
| 字号 / 圆角 / 间距 / 时长 | 8 / 6 / 8 / 4 | 6 / 4 / 6 / 2 | 只留会被用到的档 |

## 12. 自检

- [ ] 面板 CSS 里没有 hex / rgba() / 裸字号 / 裸圆角
- [ ] 每个可点元素都有 hover / active / focus，focus 只在键盘出现
- [ ] 四级文字对得上用途，正文 ≥13px
- [ ] 空态、加载、错误都有文案
- [ ] 动效 ≤160ms、无回弹、reduced-motion 全瞬切
- [ ] 状态色只出现在边/点/标签/数字上
- [ ] 全页零渐变、零毛玻璃、零发光
- [ ] 390px 宽不横向溢出

## 13. 溯源

| 文件 | sha256（前 16） |
|---|---|
| `C:\GarchOS\apps\archos-console\src\tokens.css` | `2e60175369d7d893` |
| `C:\GarchOS\apps\archos-dsh\ui\shell\src\client\tokens.css` | `b9bd28f1ba7e69b4` |
| `C:\GarchOS\ArchOS\三风格对比.html` | `d5e8365bd1db8044` |
| `C:\GarchOS\ArchOS\老版console设计规范.md` | `877220e98084aebd` |
| `C:\GarchOS\ArchOS\Gary-UI工业UI品味准则.md` | `404cde137658c419` |

## 14. 版本历史（只此一条线，不再留分叉文件）

| 版本 | 变化 |
|---|---|
| v1.0 | 初版：46 色值 / 8 字号 / 6 圆角 / 8 间距 / 4 时长 / 9 态。强调色从暖 tan `#d8b98e` 改为亮灰 `#cfd0d3`，选中改中性 `#2a2a2d` + `#6a6b70`。 |
| v1.1 | 去重：46 → 27 色值。good/warn/danger 与 idle/scheduled/inactive 合成一套状态；状态不铺底；字号 8 → 6；圆角 6 → 4；间距 8 → 6；时长 4 → 2；红线 12 → 8。 |
| v1.2 | 灰阶收敛：20 → 11 个灰阶。表面 7 → 3 档、分隔线 2 → 1 档、文字 5 → 4 级；头像 / chip / 抽屉封面并入现有 token，去掉全系统唯一的渐变。18 个色值。 |
| v1.3 | 选中底 `#2a2a2d` → `#2a2a2a`：去掉最后 3 个单位的蓝偏，底层值 100% R=G=B；墨与强调保留 theme A 既有的 ≤6 偏色（前景，不作底）。 |
| v1.4 | 选中底 `#2a2a2a` → `#2a2a2d`：与运行时 `tokens.css`（`--gary-wash`）和 `ArchOS/AGENTS.md` 登记处对齐，三处统一成一个值（Gary 2026-10-26 拍板）。 |
| v1.5 | 选中底回到 `#2a2a2a`：v1.4 的 `#2a2a2d` 蓝通道 +3，违反「底必须纯 K」硬规则、被 `enterprise_k_only` 闸拦红。方向是**规范纠正运行时与登记处**，不是反向。 |

> 规则：只维护这一份。旧版本不再单独存文件，改动以新增行的方式并进本表。
