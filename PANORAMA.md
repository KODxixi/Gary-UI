# Gary-UI 全景提示词

> 一份自足的交接书：读完即可对这个仓库做优化、审计、验收，**不需要本会话的前情**。
> 仓根 `C:/AI/UI/gary-ui`，分支 `master`。生成于 2026-11-18，对应 HEAD `ac122e6`。
>
> **风格决策（2026-11-18 Gary 确认）**
> 浅色：S1 · Paper（暖白纸 #F5F2EC，零阴影，橙色品牌，圆角 8/12/14/18）
> 深色：S3 · Carbon（纯中性黑 #111111，零阴影，橙色品牌，圆角 8/12/14/18）
> 参考文件：`out/specimen/style-pick.html`（10 种风格选型页）

---

## 0. 先定性：这是什么，不是什么

**是**：一座「内容 → 页面」的编译器 + 一套确定性验收闸门。
输入一份 `content.json`，输出一个**零脚本单文件 HTML**，视觉符合 Gary 品牌，且必然过四道机器闸。
架构已升级为双轨：**MWG 现代原生 CSS 底座为默认渲染器**（`mwg/render.mjs`，~45–80 KB）；**Astryx 174 组件库为可选组件库**（`agent/render.mjs` + `viz/render-viz.mjs`，~360–400 KB）。

一句话判据：**任何视觉改动都必须落在 token 或渲染配方里，不许落在内容里。**

---

## 1. 技术栈与目录

```
默认底座  纯原生 HTML + CSS (@layer / custom properties / container queries)，零框架 CSS
可选组件  @astryxdesign/core 0.7.16 + @astryxdesign/theme-neutral 0.7.16 + React 19.3.1
闸门验证  playwright-core 1.65.1（真实 Chromium，chromium-1248）
```

| 路径 | 是什么 |
|---|---|
| `mwg/tokens.css` · `base.css` · `components.css` | **默认底座样式层**（与 `theme/gary.theme.mjs` 同源） |
| `mwg/render.mjs` | **默认主渲染器**（支持全 18 类 block + `chart` + `flow`，零 `<script>`） |
| `theme/gary.theme.mjs` | **品牌真源**（Astryx 轨与文档真源） |
| `agent/render.mjs` | 可选 Astryx 渲染器。React SSR → 内联 reset + astryx + 主题 CSS |
| `agent/recipes/report.recipe.mjs` / `table.recipe.mjs` / `dashboard.recipe.mjs` / `landing.recipe.mjs` | 页面骨架（竖向节奏） |
| `agent/recipes/sections.mjs` | **block type → 渲染函数** 的唯一映射表（`SECTIONS`），19 个类型 |
| `agent/checks/content.mjs` | 闸 1：内容契约（吃 JSON，0.2s 出字段级错） |
| `agent/checks/selfcheck.mjs` | 闸 2：单文件约束（双轨支持：MWG / Astryx） |
| `agent/checks/layout.mjs` | 闸 3：真实 DOM 几何断言（含 375px） |
| `agent/checks/contrast.mjs` | 闸 4：WCAG AA 对比度（真实 computed style，四语义全测） |
| `agent/checks/verify-all.mjs` | **唯一总闸**：10 份内容 × 闸1 + 16 页 × 闸2/3/4 + flow 几何闸 + 375px + 20 份反例 |
| `viz/render-viz.mjs` | 可选 Astryx 轨的图表/流程图入口 |
| `viz/charts.mjs` / `viz/flow.mjs` / `viz/palette.mjs` | 图表配色与实现（双轨共用）；**色板一个字不许动** |
| `scripts/build-all.mjs` | 一键编译全仓 16 页产物（Astryx 11 页 + MWG 5 页） |
| `examples/*.content.json` | 10 份示例内容（输入侧） |
| `out/*.html` | 16 页产物（**生成物，永不手改**；选型页在 `out/specimen/`） |
| `tests/negatives/` | 20 份反例，必须**全部报红**，否则总闸算失败 |
| `archive/legacy-2026-11/` | 退役的旧 65 组件系统，只读，别从里面抄任何数值 |

---

## 2. 生产管线

```bash
cd C:/AI/UI/gary-ui

# 默认主线（MWG 原生底座，全包文本 + 图表 + 流程图）
node mwg/render.mjs <in.content.json> -o out/<page>.html [--theme light|dark]

# 可选 Astryx 组件库
node agent/render.mjs <in.content.json> -o out/<page>.html
node viz/render-viz.mjs <in.content.json> -o out/<page>.html
```

**注意**：Astryx 轨 `chart` / `flow` 不在 `SECTIONS` 表里，喂给 `agent/render.mjs` 会抛「未知区块类型」；MWG 轨 `mwg/render.mjs` 已全包 `chart` 与 `flow`。

---

## 3. 内容契约

字段级真源：`agent/content.schema.md`（19 个 block type 一节一类，含必填与字数上限）。
调用契约：`agent/CONTRACT.md`。

**19 个 block type**：
`heading` `header` `cover` `prose` `text` `metric` `card` `table` `badge` `callout` `divider` `timeline` `matrix` `image` `steps` `quote` `grid` `device` `scorecard`

**图表类型（6 类，`viz/charts.mjs` 的 `switch (props.chart)`）**：
`bar` · `grouped-bar` · `line` · `stacked` · `donut` · `progress`

**流程类型（3 类，`viz/flow.mjs` 的 `FlowBlock` 分派）**：
`linear` · `branch` · `swimlane` —— 几何闸是 `viz/check-flow.mjs`（读产物 HTML，校验折线严格正交、每条边带 `marker-end`、节点框互不相交）

### 内容层的硬红线
1. **零字面量**：`content.json` 与 props 里不许出现 `#hex`、`rgb()`、`px`。要改观感去改 `theme/`。
2. **不许写 HTML/CSS/JS**，不加 `<script>`，不引外链/CDN。
3. **不手写 class**，类名全部由 Astryx 生成。
4. **图表数值必须是 `number`**，写成字符串会**静默画成 0**（已进闸）。
5. `table.foot` **不算** rows；`grid` 可嵌套但最多两层，内层 `cols` ≤ 外层。

---

## 4. 品牌 token 真值（当前实测，不是设计意图）

格式一律 `['亮色', '暗色']`。

### 面
| token | 亮 | 暗 |
|---|---|---|
| `background-body` | `#F5F2EC` 暖白纸 | `#111111` 纯中性黑 |
| `background-card` / `surface` | `#FFFFFF` | `#1C1C1C` |
| `background-muted` / `surface-sunken` | `#EFEAE2` | `#161616` |
| `background-popover` | `#FFFDF9` | `#222222` |

> **暗色方案 A（2026-11-18 Gary 确认）**：纯中性黑，无色相/棕调。
> 旧值（暖棕 #171412 / #241F1B）已替换，不再有效。

### 字
| token | 亮 | 暗 | 用途 |
|---|---|---|---|
| `text-primary` | `#1B1713` | `#F0F0F0` | 15.95:1 |
| `text-secondary` | `#655C54` | `#9A9A9A` | 5.85:1 |
| `text-accent` | `#A35200` | `#FFA94D` | 正文尺寸橙色文字 / 链接 |
| `text-info` | `#3A5670` | `#9CBCD5` | |
| `text-warning` | `#7A5C14` | `#e0a93b` | |

### 品牌橙（有严格角色分工，别混用）
| token | 亮 | 暗 | 允许的用途 |
|---|---|---|---|
| `accent` | `#F57C00` | `#FFA94D` | **只做面**：填充、色块、图表标记。**永不作文字色** |
| `text-accent` | `#A35200` | `#FFA94D` | **正文尺寸**的橙色文字 |
| `on-accent` | `#1A0E00` | `#111111` | 橙底上的字 |

**为什么有两个橙**：`#F57C00` 在暖白纸面上只有 2.42:1（纯白卡面 2.70:1）；`#B85C00`（品牌深橙原值）在纸面 4.11、muted 面 3.84，都不达 4.5。所以正文级橙色降到 `#A35200`（纸 4.99 / 卡 5.58 / muted 4.66）。
**`#F57C00` 上写白字 = 2.70:1，写进契约的禁忌。**

### 字体
`GARY_FONT_STACK` —— 无衬线，**拉丁在前、CJK 在后**。衬线已全站退役（`GARY_DISPLAY_SERIF_STACK` 只剩文档里一行）。
`--font-weight-bold` 覆写为 **600**（不是 700，Windows 雅黑 700 是合成粗体）。

### 字阶
| 档 | 尺寸 | 行高 | 字重 |
|---|---|---|---|
| display-2 | `clamp(1.875rem, 3.4vw, 2.125rem)` | 1.2 | 600 |
| display-3 | `clamp(1.625rem, 2.8vw, 1.875rem)` | 1.2 | 600 |
| heading-1 | `clamp(1.5rem, 2.6vw, 1.75rem)` | 1.3 | 600 |
| heading-2 | `1.25rem` | 1.35 | 600 |
| heading-3 | `1rem` | 1.4 | 600 |
| large | `1.0625rem` | 1.6 | 400 |
| body | `0.9375rem` (**15px**) | **1.6** | 400 |
| supporting | `0.8125rem` | 1.55 | — |
| label 字重 | — | — | 500 |

### 行长（measure，已实现，别重做）
| token | 值 | 用在哪 |
|---|---|---|
| `--measure-narrative` | **680px** | 正文 / prose / quote / cover 副题（15px 下约 34 个汉字） |
| `--measure-data` | **1080px** | 表格 / KPI 带 / 图表 |

页面外壳 `maxWidth: 1120`（`agent/render.mjs:173`，**JSX 驼峰 prop**）。
两者共用同一条左边线，左对齐不居中。

> **grep 陷阱**：按 CSS 写法 `max-width` 去搜会**零命中**——实现是驼峰 prop `maxWidth:` 加 token 名 `--measure-*`。
> 实测正文宽度就是 680px（Chromium computed 量得）。**不要因为 grep 不到就判定它缺失。**

### 阴影与圆角
- `--shadow-low/med/high` **全部 `0 0 transparent`** —— 文档流内零高程阴影
- 分层靠 **1px hairline 边框 + 留白 + 面差**，不靠投影
- 原「内阴影画细环」的做法**已转为 `outline`**（见 `agent/render.mjs:69-72`）
- 键盘焦点：`outline: 2px solid var(--color-accent); outline-offset: 2px`（`render.mjs:221`）
- 圆角：`element` 12px、`container` 12px、`inner` 8px

---

## 5. 四道闸：判定口径（**阈值一个字不许动**）

| 闸 | 判什么 | 关键口径 |
|---|---|---|
| `content.mjs` | 内容契约 | 吃 JSON，字段级报错，0.2s。**图表数值必须是 number** |
| `selfcheck.mjs` | 单文件约束 | 五项：零 `<script>`、零外链、零 CDN、CSS 全内联、无外部资源引用 |
| `layout.mjs` | 真实 DOM 几何 | 六条断言，报**实测 px**。改内容改到过闸，不许绕 |
| `contrast.mjs` | WCAG AA | 读真实 computed style。**每个文字 token × 每个面（body/card/muted）都按 4.5 测**；语义色只作填充按 1.3；数据八色按 3:1 标记 |

`contrast.mjs` 的这段是 2026-11-18 补的，此前**橙色文字只按 3:1 色块阈值、且只对卡片面测**，导致 4.11:1 的违规全绿放行：

```js
const surfaces = [['body', bodyBg], ['card', card], ['muted', parseColor(p.mutedBg) ?? bodyBg]];
for (const [tname, tcss] of Object.entries(p.textTokenRgb || {})) { … add(`${tname} / ${sname}`, fg, sbg, 4.5, 'body-size text'); }
```

**当前闸状态（对现有 out/ 产物实测）**：`selfcheck` exit 0 · `layout` exit 0 · `contrast` exit 0。

---

## 6. 缺陷台账（2026-11-18 已全量清零）

### ~~P0~~ · 行长 —— **已完成**
`--measure-narrative: 680px` / `--measure-data: 1080px` 已落 `theme/gary.theme.mjs` 与 `mwg/tokens.css`，双轨实测正文宽度 = 680px。

### ~~P1~~ · 语义色收拢与补全 —— **已完成**
`warning` 收拢为单套基础值；`success` / `error` 补齐 `text-success`（`#1E6B54` / `#78C9AC`）与 `text-error`（`#9E3623` / `#D58D80`），已全部并入 `contrast.mjs` 接受 body/card/muted 三面 ≥ 4.5:1 实测。

### ~~P2~~ · `tabular-nums` 表格生效 —— **已完成**
MWG 轨（`.g-table th.num, td.num`）与 Astryx 轨（`.astryx-table td, th, .astryx-text`）均已强制 `font-variant-numeric: tabular-nums`，经 `mwg/verify-mwg.mjs` 实测 `getComputedStyle(td).fontVariantNumeric === 'tabular-nums'`。

### ~~P3~~ · 标题上下间距 —— **已完成**
`mwg/components.css`（`.g-heading` / `.g-prose__section-title`）与 `sections.mjs` 保持上距明显大于下距（标题属于下文）。

### ~~P4~~ · 圆角四档分级 —— **已完成**
补齐 4 档分级（inner `8px` / small `12px` / md `14px` / container `18–20px`）。

### ~~P5~~ · 组件级容器查询 —— **已完成**
MWG 在 `.g-metric-grid`、`.g-timeline`、`.g-scorecard`、`.g-steps` 上均启用 `container-type: inline-size` 与 `@container` 自适应规则，且避开与 `subgrid` 同元素混用。

### ~~P6~~ · 闸门覆盖补全 —— **已完成**
- `verify-all.mjs` 已自动并入 `viz/check-flow.mjs`（所有含流程图的产物）；
- `verify-all.mjs` 已并入 `--width 375` 移动端不溢出闸（同时覆盖 MWG 与 Astryx 报告页）；
- `contrast.mjs` 已并入 `text-success` 与 `text-error` 三面 AA 校验。

### P7 · 治理：日快照会把在途改动提交进去
cron 日快照已两次把工作区的半成品提交成 commit（`b75570f`、`ac122e6`），回滚时必须 `git checkout <sha> -- <file>` 而不是 `git checkout -- <file>`。
当前工作区仍有 4 个未提交改动：`theme/gary.theme.mjs`、`agent/recipes/sections.mjs`、`agent/render.mjs`、`agent/checks/contrast.mjs`。

---

## 7. 硬约束（违一条即返工）

1. **只拼不造**：页面 = `meta` + `blocks`。不写 HTML/CSS/JS。
2. **零字面量**：内容层不出现颜色/字号/圆角。
3. **产物零脚本**：`out/*.html` 里不许有 `<script>`，不许外链。
4. **闸阈值不许动**：过不了就改内容/改 token，不许改判定口径。反例必须继续报红。
5. **`viz/` 色板八色一个字不许动**；图表不许写死 hex，必须取 theme token。
6. **`out/` 与 `archive/` 不手改**，改源文件重跑。
7. **写区互斥**：同一文件同一时刻只一个写入者。全量 `npm run verify` 归调度方串行跑。
8. **不新造平行概念**：不用 MWG / 任何外部指南去替换内容契约或四道闸。

---

## 8. 验收手册（这是「验收」的唯一口径）

```bash
cd C:/AI/UI/gary-ui

# 唯一总闸：10 份内容 + 11 页 × 三闸 + 20 份反例必须全红
npm run verify
echo $?    # 必须 0

# 单页三段
node agent/checks/content.mjs examples/demo-report.content.json
node agent/render.mjs examples/demo-report.content.json -o out/demo-report.html
node agent/checks/selfcheck.mjs out/demo-report.html
node agent/checks/layout.mjs out/demo-report.html out/demo-table.html
node agent/checks/contrast.mjs out/demo-report.html

# 看图（人眼验收，闸门测不了美）
node agent/checks/shoot.mjs out/demo-report.html out/rebase-report.png
```

**三条不可省略的验收判据**
1. `npm run verify` **exit 0**，且日志里 `FAIL` 零命中（不是「闸没跑起来」，是跑起来且全过）
2. 20 份反例**全部报红** —— 反例全绿说明闸被绕过了，等于没闸
3. **必须出截图并有人看过**。闸门只能证明「不违规」，证明不了「好看」

---

## 9. 要你做的三件事

### 优化
按 §6 的 P2→P7 顺序做。**P0 已完成，别碰**；P1（语义色近值）和 P2（表格 tabular-nums）是当前最值得做的两项。
每一项改完立刻跑 `npm run verify`，**红了就说明你碰了不该碰的**。

### 审计
针对以下五问给结论，**每问都必须引 `文件:行号`**：
1. `theme/gary.theme.mjs` 里有没有**同一个语义占多个近值**的 token（§6 P1 是已知的一处，还有没有别的）？
2. `agent/recipes/sections.mjs` 的 19 个渲染函数里，有没有**写死颜色/字号/圆角**、绕过 token 的？
3. `agent/render.mjs` 注入的全局 CSS 里，有没有和 Astryx 组件自带样式**互相覆盖打架**的选择器？
4. 四道闸有没有**能通过但结果仍错误**的组合（假绿）？举具体输入。
5. `content.schema.md` 文档写的和 `content.mjs` 实际校验的，有哪些字段**对不上**？

### 验收
交一份回执，含：
- `npm run verify` 原始 exit code + 完整日志路径
- 四闸各自的 PASS/FAIL 行（不要只给汇总）
- 改动前后的 `git diff --stat`
- **至少 3 张截图**（亮色报告页 / 暗色 / 密集表格），1440 宽
- 明确写出「未验证」的部分是哪些

### 回执格式
首行 `GARY-UI-AUDIT-<日期>`，然后三段：`优化`（每条：文件:行号 + 改了什么 + 闸结果）/ `审计`（五问逐条）/ `验收`（上列五项）。

---

## 10. 忌口清单

| 别做 | 为什么 |
|---|---|
| 把 `#F57C00` 当文字色 | 纸面 2.42:1 |
| 把 `#F57C00` 上写白字 | 2.70:1，契约明令禁止 |
| 用阴影做分层 | 已全站归零，分层靠 hairline + 留白 + 面差 |
| 用衬线做标题 | 已全站退役 |
| 用 700 及以上字重 | Windows 雅黑 700 是合成粗体，会糊 |
| 用 0.5px 边框 | Windows 缩放不稳定 |
| 正文用 `vw`/`cqi` 流体 | 无视浏览器字号设置，属无障碍问题；流体只给 display 级 |
| 在 Astryx 组件根节点上设 `container-type` | 开启布局包含，会把 fixed 浮层困住、新建层叠上下文 |
| 改 `agent/checks/` 的阈值 | 反例会失效，等于拆闸 |
| 从 `archive/` 抄数值 | 旧系统已退役，数值真源只有 `theme/gary.theme.mjs` 与 `sections.mjs` |
| 加新依赖 | 现有 7 个依赖已够用 |
