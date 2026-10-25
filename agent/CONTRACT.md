# Gary-UI 契约（v1）

> 位置：`agent/`。跑闸门前先装一次依赖：`cd adapters/visual && npm i`（闸门用仓库内的 playwright-core + 本机 Chrome）。校验前置：仓库根起静态服务 `python -m http.server 4173 --directory <gary-ui 根>`。
> 给 agent 的唯一入口。读完这一份就够开工，不要再去翻其它文档。
> 一句话：**只能拼，不能发明。** 页面 = 配方（recipe）+ 内容（content），产出经渲染器。

## 1. 三层结构

| 层 | 文件 | 谁写 |
|---|---|---|
| 材质原语 | `primitives.css` | 维护者；agent **只读** |
| 配方 | `recipes.json` | agent 选一个，可复制改结构 |
| 内容 | `content/<page>.json` | agent 填 |
| 渲染 | `render.mjs` | 维护者；agent 只调用 |

```
node render.mjs <recipe> <content.json> [out.html]
```

## 2. 材质（只用变量，禁写字面量）

| 用途 | 变量 | 暗 | 亮 |
|---|---|---|---|
| 页面底 | `--bg` | `#000` | `#fbfbfd` |
| 板 | `--win` | `#101012` | `#fff` |
| 抬升 | `--raised` | `#1c1c1f` | `#fff` |
| 凹槽 | `--sunken` | `#0b0b0d` | `#f0f0f3` |
| 正文 | `--ink` | `#f5f5f7` | `#1d1d1f` |
| 次文 | `--muted` | `#a1a1a9` | `#6e6e73` |
| 三文 | `--dim` | `#8a8a92` | `#6b6b70` |
| 发丝线 | `--line` `--line2` `--hair` | 白 8/4/12% | 黑 7/3/8% |
| 强调 | `--accent` | `#74a7ff` | `#0071e3` |
| 状态 | `--ok` `--warn` `--bad` | `#30d158` `#ffd60a` `#ff453a` | 同 |

**只允许一种"贵"**：板 + 1px 顶部高光（`--hair`）+ 一层投影（`--shadow`）。不许玻璃套玻璃、不许渐变文字、不许彩色光晕。

## 3. 原语（只有这些类）

`.surface` `.surface--flush` `.surface--sunken` · `.eyebrow` `.display` `.display--xl` `.h2` `.h3` `.sub` `.body` `.small` `.mono` `.num` `.metric` · `.btn` `.btn--primary` `.btn--ghost` `.iconbtn` `.seg` `.sw` `.chip` `.dot` `.field` `.send` · `.row` `.row__k` `.row__h` `.item` `.item__dot` `.item__title` `.item__meta` · `.badge` `.hr` `.sk` · `.scrim` `.palette` `.plist` `.pitem`

## 4. 硬规则（验收会逐条查）

1. **标签对齐**：面板标签（`.eyebrow`）的左边缘 = 该面板内容**文字**的左边缘（不是圆点/图标那一列）。改完跑 `node ../check-label-align.cjs` 必须 Δ=0。
2. **数字等宽**：所有数值加 `.num`，右对齐。
3. **对比度**：正文 ≥ 4.5:1，大字 ≥ 3:1；半透明文字按**实际合成底色**算。
4. **热区**：≥ 44×44（视觉可小，用 `::after` 外扩）。
5. **动效**：≤300ms；只动 `transform`/`opacity`；`prefers-reduced-motion` 关闭。**唯一例外**：单元素一次性的面板宽度变化可用宽度补间（比瞬切自然）。
6. **主题**：亮暗都是一等公民，`<html data-theme>` 在首帧前由内联脚本定好，不闪。
7. **密度**：`<html data-density="compact|roomy">`，紧凑是默认。四页共用 `--pad-row/--pad-item/--gap-sect/--pad-head`。
8. **滚动条**：无轨道，灰圆头（原语已给，别覆盖）。
9. **不许**：假数据指标、`transition: all`、emoji 当图标、外部请求、CDN。

10. **不许折行**：短标签、说明、徽标、表头、按钮一律单行；写不下就**加宽容器或改短文案**，不许让它折成两行。
    验收：`node checks/no-wrap.cjs` 必须报「折行合计: 0」（桌面 1440/1024 生效；390 允许自然折行）。典型修法——右栏 280→300px、把「预览画板宽度」改「画板宽度」、把说明移进 title 提示。

## 4.1 闸门覆盖对照（谁真的会查）

| 规则 | 闸门 |
|---|---|
| 1 标签对齐 | `checks/check-label-align.cjs`（Range 量真实文字左缘） |
| 2 数字等宽 | 静态：`.num` 定义在 primitives，渲染器统一加（无独立闸门） |
| 3 对比度 | `checks/audit.cjs`：CSS 合成法（半透明前景按合成底算；**祖先 opacity 与渐变底未覆盖**）。`checks/contrast.cjs` 是像素法实验版，**未接入闸门**，已知限制见文件头 |
| 4 热区 ≥44 | **无闸门**（audit 只打印 smallTargets，不作为失败条件） |
| 5 动效 | `checks/audit.cjs` 查 `transition: all`；时长/只动 transform 无自动闸门 |
| 6 首帧主题 | 无自动闸门（渲染器写死 dark，脚本再覆盖） |
| 7 密度 | 无自动闸门 |
| 8 滚动条 | 无自动闸门 |
| 9 禁假数据/CDN/emoji | **无闸门**（假数据、emoji、外部请求都只能靠 review） |
| 10 不许折行 | `checks/no-wrap.cjs`（Range 数行盒，覆盖下限 20） |

> 未覆盖项不要假装已验：交付说明里按上表如实标注。

## 5. 配方一览

| 配方 | 用在哪 | 结构 |
|---|---|---|
| `workbench` | 任务 / 画布 / 参数 三栏 | rail + stage + inspector，可拖拽分隔条 |
| `dashboard` | 经营看板 | header + kpis + chart + table |
| `report` | 长文报告 | cover + toc + prose + table + note，带打印样式 |
| `settings` | 设置 | nav + 分组 rows（seg/sw）+ 危险区二次确认 |

新页面优先改内容而不是改配方结构；确实需要新结构时，先在 `recipes.json` 加一条，再渲染——不要手写 HTML。

## 6. 自检清单（交付前必跑）

```
node checks/check-label-align.cjs          # 标签对齐 Δ=0
node checks/audit.cjs                   # 对比度/溢出/报错
```

## 7. 交互也是声明出来的

配方里加一行 `"interactions": [...]`，渲染器按声明注入标记与脚本，agent 不写 JS。

| 声明 | 效果 | 依赖 |
|---|---|---|
| `theme` | 顶栏出现明暗切换，`data-theme` 落盘 localStorage | 无 |
| `palette` | ⌘K / Ctrl+K 命令面板，命令由内容自动生成（跳章节/跳分组/切主题/打印） | 章节与分组自动获得 `id` |
| `gutters` | 侧栏与主面板之间出现可拖拽分隔条（1:1 跟手、键盘 ←/→、夹取范围） | 两栏外壳 |
| `print` | 打印样式：白底黑字、去浮层、章节不跨页 | 无 |

例：`"workbench": { "shell":"workbench", "interactions":["theme","palette","gutters"], ... }`

改完必须复验：`node checks/verify-interactions.cjs`（⌘K 能开、主题能切、分隔条能拖、零报错）。





