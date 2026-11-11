# Gary-UI 验收整改与完整页面 Demo 交付报告

日期：2026-09-07  
项目：`C:\AI\UI\gary-ui`  
交付状态：**必交实现、最终版自动化证据、独立导出检查与受管同步均已完成；视觉结论仍交由原会话独立验收。**

## 直接验收

```powershell
cd C:\AI\UI\gary-ui
python -B scripts\serve_portal.py --surface portal --port 4173
```

- Portal：`http://127.0.0.1:4173/portal/#demos`
- 六个 Demo：首页 `http://127.0.0.1:4173/examples/demos/index.html`
- 十类制图样例：`http://127.0.0.1:4173/examples/visuals/outputs/index.html`
- Product Design 字体/字重验证：`http://127.0.0.1:4173/portal/#product-design`

服务只绑定 `127.0.0.1`。Demo、字体、引擎和导出均使用本地资源；运行时不从公共 CDN 下载，也不会自动安装或升级依赖。

## 六个完整页面 Demo

六页共用固定的“华东服务交付计划”验收数据，均明确标注为人工编制示例，不代表真实公司或经营结论。

| 类别 | 场景 | 页面 | 入口 | 可操作内容 |
| --- | --- | --- | --- | --- |
| Web UI | 分析 | 交付脉冲业务分析工作台 | `/examples/demos/web-analysis/index.html` | 地区筛选更新指标、ECharts 趋势和明细；加载、空、错误、恢复；详情面板 |
| Web UI | 阅读 | 项目知识与资源工作台 | `/examples/demos/web-reading/index.html` | 中文检索、列表/长文详情、来源抽屉、Markmap 提纲 |
| Kanban | 分析 | 项目运行看板 | `/examples/demos/project-kanban/index.html` | 状态筛选、风险与待办、不同卡片结构、阻断详情 |
| Kanban | 展示 | 管理层交付大屏 | `/examples/demos/executive-board/index.html` | 结论与异常、指标和趋势、Archify 关系图、播放/暂停/重播 |
| HTML 汇报 | 阅读 | 交付模式决策报告 | `/examples/demos/research-report/index.html` | 封面、目录、长正文、证据、长表、来源、结论和打印 PDF |
| HTML 汇报 | 展示 | 华东交付方案汇报 | `/examples/demos/proposal-presentation/index.html` | 章节节奏、媒体、方案对比、Archify 流程、AntV 信息图、静态阅读和打印 PDF |

全部页面支持明暗主题、键盘焦点和本地源/导出入口。窄屏复杂图提供独立查看，不靠缩小正文通过验收。

## 规范与复用实现

- 保留旧版 `8px` 间距和 `30px` 主卡圆角；阅读、分析、展示采用独立密度配方。
- `spec/scene-recipes.json` 定义三类场景、六种文本角色和四种卡片结构，覆盖字号、字重、行高、间距、行宽、中文换行、数字对齐、长内容和使用/禁用条件。
- `tokens/base.css` 提供可执行 HTML/CSS；`adapters/react-shadcn/src/recipes.ts` 从同一规范导出 React 接入，避免两套常量漂移。
- 阅读采用稳定正文与独立导航玻璃；分析采用图表、判断、证据；展示允许更强背景、玻璃和有限动效。
- 全局拉丁字符字体栈为 `"Helvetica Neue", Helvetica, Arial, sans-serif`；中文回退为 `"Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑", sans-serif`。富文本提供 `100/300/400/500/600/700/800/900` 八档字重；HTML 使用 `data-gary-font-weight`，React 使用 `garyWeight()`，Portal 实验室可实时调节并生成提案。
- `theme-map.json` 与 `scene-recipes.json` 是主题和场景权威源；渲染构建记录两者哈希，避免文档与实现各自硬编码漂移。

## 制图链路与版本

| 工具 | 版本 | 负责范围 | 原生源 |
| --- | --- | --- | --- |
| Archify | `2.17.0-dev.1`，commit `c6519401f7b91b9d43011657880893b0a8955548` | 架构、工作流、时序、数据流、生命周期 | JSON |
| ECharts | `6.1.0` | 定量比较、趋势、数据表 | JSON option + table |
| Markmap | `0.18.12` | 中文研究提纲、知识层级 | Markdown |
| AntV Infographic | `0.2.20` | 步骤、定性比较、摘要 | syntax/JSON |
| Mermaid | `11.17.2` | 简单流程、既有源 | `.mmd` |
| Lucide | `1.41.0` | 操作与节点图标 | 命名图标清单 |
| Playwright Core | `1.63.0` | 真实渲染、导出、浏览器验收 | 固定本地包 |

```powershell
.\gary-ui.cmd visual doctor
.\gary-ui.cmd visual validate --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual render --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual export --manifest examples\visuals\visuals.json
```

十类样例由 `examples/visuals/visuals.json` 管理；每项保留源、交互 HTML、SVG/PNG，支持项同时生成 PDF。状态见 `examples/visuals/outputs/generation-status.json`。

## 上轮六项整改

1. **失败保护**：先在候选区生成并真实渲染验证，整批成功才提升。失败保留候选与原因，不替换正式 HTML、源、回执或导出；上一有效快照和状态分离。事务测试完成“合法 → 非法 → 恢复”，失败后正式 HTML hash 不变。证据：`examples/visuals/evidence/transaction/transaction-report.json`。
2. **SVG**：Archify SVG 内联样式、字体、背景、尺寸和 `viewBox`；Lucide 为 10 枚命名图标板。Chromium 独立打开 10/10 通过，证据见 `examples/demos/evidence/export-integrity/`。
3. **规范落地**：六种文本角色、四种卡片结构已进入 JSON、共享 CSS 和 React recipes，含中文、数值、长内容与禁用规则。
4. **主题**：manifest 决定 Archify 初始主题；切换、iframe、HTML 与导出共用主题映射。回归覆盖初始主题，浏览器矩阵覆盖六页明暗主题。
5. **动效**：展示场景使用有限时长 Web Animations；播放、暂停、重播真实改变状态。静态场景无无效控件；减弱动态直接完整显示。嵌入动画有确定性完成边界。
6. **验证**：除加载和控制台外，还检查重排、裁切、横向溢出、正文大小、焦点、交互、iframe 内容与断网。200% 使用 `html { font-size: 32px }`，不是页面缩放；关键截图和 PDF 首尾页已人工回看。

## 官方 Skill 与旧 Skill 冲突治理

### Archify

- 官方来源：`https://github.com/tt-a1i/archify`。
- Skill 版本 `2.17`，与引擎 commit `c6519401f7b91b9d43011657880893b0a8955548` 一致；`SKILL.md` SHA-256 为 `10094272d6d1b4ad0f2c2e0880cb646fe4991454a2dc3d854aecb27e7407ee1f`。
- 权威母本为 `C:\AI\skills\archify\SKILL.md`，已通过受管技能部署。Gary-UI 不再保留第二份 vendor Skill，只保留锁定引擎、许可和来源记录。
- 架构、复杂工作流、时序、数据流或生命周期需求由 Gary 路由到官方 Skill；Agent 先完整读取 `SKILL.md`，再按其路由加载所需 schema、reference 和 example。

独立新 Codex 会话实际发现并调用该 Skill，从全新自然语言“华东交付异常处理流程”生成 `fresh-session-delivery/` 下的原生 JSON、交互 HTML、独立 SVG/PNG。官方 `visual-check` 在 1440×900、1600×1000、1920×1080、2048×1320 的明暗主题下通过并保留截图与 JSON 回执。

### AntV Infographic

- 官方来源：`https://github.com/antvis/Infographic`，commit `2ea1894255e4002c7735586778be86d13ec30346`，对应包版本 `0.2.20`。
- 已接入官方 `infographic-creator` 和 `infographic-syntax-creator`；后者按 Skill 指引加载 `references/prompt.md`。三份文件 SHA-256 由 `toolchain.lock.json` 固定，`visual doctor` 逐一核验。
- 官方 Skills 负责“理解内容、选择模板、组织数据、生成语法”；Gary 本地适配器负责主题、离线浏览器渲染、嵌入和导出，避免复制官方模板选择逻辑或重复维护引擎。
- 两个全新 Codex 会话分别验证 syntax-only 与完整交付路由。完整交付会话从“离线地图发布质量门”自然语言生成新源、HTML、SVG、PNG 和状态回执，位于 `examples/visuals/fresh-session-antv-gate/`。

### 其他路由和旧 Skill

- 新会话实测 ECharts、Markmap、Mermaid、Lucide 由 `gary-liquidglass-ui` 按能力清单直接路由；复杂异常流程继续调用 `archify`。
- 旧 `kanban` Skill 已改为仅在明确看板请求时触发，不再覆盖普通 HTML 报告；布局按内容选择 1–5 列，允许 2/4 列，390px 回流为单列。
- 旧 `architecture-diagram` Skill 只在用户明确要求旧手写 SVG 风格时使用；普通/Gary 架构任务路由 Archify，并移除 Google Fonts、公共 CDN 和 7–12px 小字要求。

## 最终验证

| 检查 | 结果 |
| --- | --- |
| Visual adapter 单元/回归 | 16/16 通过 |
| Python 项目测试 | 173 tests + 75 subtests 通过 |
| React 与 Visual runtime build | 通过 |
| `visual doctor` | 通过，版本、浏览器、官方 Skill SHA 匹配 |
| `visual validate` | 10/10 源通过 |
| `validate_v2.py` | 0 issues / 0 warnings |
| 六页浏览器矩阵、字体及默认点阵 | 44/44 通过 |
| 默认 Scene | 深色 `rgb(0,0,0)` / 浅色 `rgb(255,255,255)`；各 1 个 Canvas；无默认图片 |
| 点阵交互 | 普通动效下鼠标前后 Canvas 像素不同；reduced-motion 下不变 |
| 独立 SVG | 10/10 通过 |
| 导出解析与重开 | 10 SVG、10 PNG、6 PDF 通过 |
| 事务失败保护 | 通过 |
| 新会话 Archify visual-check | 通过 |
| 新会话 AntV syntax / 完整交付 | 通过 |
| 新会话其余工具路由 | ECharts、Markmap、Mermaid、Lucide 路由通过 |
| Gary 运行投影 | 446 个受管文件；0 missing / 0 hash mismatch / 0 retired present |

矩阵覆盖 1440、768、390px，light/dark、两项真实 200% 字体、两项 reduced-motion，并阻断 HTTP(S)。交互覆盖键盘焦点、筛选、详情、加载/空/错误/恢复、来源和动效控制。Portal 额外验证中英文字体栈与 700 字重，以及纯黑/纯白背景、鼠标点阵反馈和 reduced-motion 静态点阵。全部页面同时检查大字展示标题为单行、无标点、无强制换行且不溢出；章节与内容标题不受该限制。

## 路径

- Demo：`examples/demos/`
- 原生源：`examples/visuals/sources/`
- HTML/SVG/PNG/PDF 与状态：`examples/visuals/outputs/`
- 新会话产物：`examples/visuals/fresh-session-delivery/`
- AntV 新会话产物：`examples/visuals/fresh-session-antv-gate/`
- Skill 路由回执：`examples/visuals/evidence/skill-routing/`
- 浏览器证据：`examples/demos/evidence/browser/`
- 独立导出证据：`examples/demos/evidence/export-integrity/`
- 事务证据：`examples/visuals/evidence/transaction/`
- 新会话证据：`examples/visuals/evidence/archify-skill/`
- 阅读报告 PDF：`examples/demos/research-report/research-report.pdf`，4 页。
- 展示汇报 PDF：`examples/demos/proposal-presentation/proposal-presentation.pdf`，7 页。
- 版本、来源与文件哈希：`adapters/visual/toolchain.lock.json`
- AntV Skill 治理说明：`adapters/visual/ANTV_SKILLS.md`

## 受管同步、精确清理与限制

Gary 运行投影已按当次生成的完整 SHA-256 显式确认并同步；共复制 446 个 manifest 选中文件，复查为 0 missing、0 hash mismatch。最终哈希以 `runtime_projection.py check` 的机器回执为准，避免报告内容自引用造成哈希变化。

任务指定的五个 `.candidates/*.archify.json` 和重复的 `adapters/visual/vendor/archify/SKILL.md` 均已进入精确退役清单，最终为 `alreadyAbsent`。没有运行全量 prune，也没有处理其他 runtime-only 文件。`deploy.py verify --only skills` 仅报告 6 项与本任务无关的既有 Claude runtime-only 差异，本轮未改动。

- AntV 官方浏览器包默认会请求字体和语义图标。离线适配器已清空远程字体注册，并只在渲染副本中移除 `icon` 行；原生官方 syntax 完整保留。当前文本、关系和主题可完整离线导出，但官方语义图标不会出现在离线导出中。
- Chromium 全页截图可能把离屏 iframe 栅格化为空白，因此另存滚动到视口后的两个 iframe 截图，并用子 frame 文本/SVG 检查交叉验证。
- 未录视频；播放、暂停、重播和 reduced-motion 的复现步骤与状态保存在 QA JSON。
- 自动化及独立打开检查证明技术完整性，不替代原会话对视觉取舍的独立验收。
- 未提交、推送、发布、全局部署服务或调整系统配置。
