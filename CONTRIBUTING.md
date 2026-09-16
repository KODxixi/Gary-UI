# 参与 Gary-UI

欢迎通过 Issue、Pull Request 和完整场景示例一起深化 Gary-UI。安装与启动见 [README](README.md)，可讨论的优先方向见 [路线图](docs/ROADMAP.md)。本文约定贡献如何落到可运行、可复核的页面。

## 从一个具体问题开始

1. 先看 [完整 Demo 首页](examples/demos/index.html)、[设计规范](DESIGN.md) 和相关现有实现。修复已有问题时，在 Issue 中给出页面、操作、预期与实际结果；涉及样式时附宽度、主题和截图。
2. 小范围修复可以直接提交 PR。涉及视觉基线、公共接口或引擎替换时，先用 Issue 说明目标、受影响页面和可运行的候选方案，让讨论围绕实际效果展开。
3. 在自己的分支修改相关源码，复用共享 Token、组件和交互。不要只修截图所见的一页，也不要顺手重做无关页面。
4. 运行与改动相关的检查，真实打开页面操作，然后提交 PR。文档拼写修改不需要完整浏览器矩阵；修改共享样式或脚本时，需要验证受影响的 Portal、模板和完整 Demo。

## 共同维护的视觉基线

[完整 Demo](examples/demos/index.html) 是 Portal、组件、模板和制图目录的视觉基线。新增场景应解释它如何使用这套设计，而不是另起一套默认风格。

- 工具操作以 44px 圆形 Lucide 图标为主，配可访问名称；导航和筛选保留有意义的文字。
- 顶栏 `Background` 是纯文字入口，只打开共享背景功能卡；旁边的圆形深浅按钮独立切换主题。不要把二者合并为“显示设置”，或恢复右下角浮动入口。
- 默认页面只保留一套点网格，不叠加线网、装饰等高线或重复背景层。用户主动选择的背景实验保持显式可控。
- 卡片、排版和材质优先使用共享实现。阅读页保证正文稳定，分析页让数据与判断可核对，展示页的动效有暂停、重播及结束状态。
- 同时照顾深浅主题、键盘操作和 `prefers-reduced-motion`；不要依靠透明度、模糊或动画掩盖内容问题。

实现入口见 [Token](tokens/tokens.json)、[组件样式](components/components.css)、[共享脚本](patterns/shared/) 与 [场景配方](spec/scene-recipes.json)。

## 验证改动

先按照 [README](README.md) 准备 Python、Node.js、项目依赖与本机 Chromium 浏览器。以下命令从仓库根目录运行；需要浏览器的脚本通过 `GARY_UI_CHROME` 指定本机浏览器可执行文件，不应依赖其他贡献者的安装路径。

在一个终端启动本地服务，并在执行浏览器回归时保持运行：

```shell
python -B scripts/preview.py --port 4173
```

公开克隆首先运行以下检查：

```shell
python -B -m unittest discover -s scripts/tests -p test_preview.py -v
python scripts/check_public.py
node scripts/public_smoke.mjs
```

浏览器检查需先 `npm --prefix adapters/visual ci` 并指定 `GARY_UI_CHROME`，或用 Playwright 安装 Chromium。

以下是维护者完整环境内的其他专项检查。涉及外部 Skill、C:\AI 治理工具和运行投影的测试不属于普通克隆预览前提；不要把缺失本机环境视为已验证通过：

| 改动范围 | 已有检查入口 |
| --- | --- |
| 共享卡片、图标、点阵与 Portal/模板一致性 | `node scripts/card_material_qa.mjs` |
| 导航、手机布局、主题传递与 Background | `node scripts/portal_acceptance_qa.mjs` |
| 可复制模板及其实际生成的 HTML | `node scripts/starter_generated_qa.mjs` |
| 六个完整 Demo 的核心交互 | `node scripts/demo_interaction_qa.mjs` |
| 规范、结构和契约 | `python -B scripts/validate_v2.py` |
| Python 行为与投影回归 | `python -B -m pytest scripts/tests -q -p no:cacheprovider` |
| 制图适配器行为 | `npm --prefix adapters/visual test` |

部分浏览器脚本固定使用 `http://127.0.0.1:4173/`；不要仅修改服务端口。脚本会写验收证据，必须等这些写入和其他构建全部结束，再运行 Python 投影测试，避免在哈希比较过程中修改被测文件。

自动通过不能替代目视和交互验收。UI 改动至少实际检查 320px、390px 和桌面宽度下的深浅主题：展开菜单、切换筛选、滚动顶栏、打开/关闭背景功能卡、独立切换主题，并检查溢出、焦点和图标可访问名称。复制功能必须把复制出的 HTML 独立打开，不能仅看编辑器预览。未运行的浏览器、设备或状态明确写“未验证”。

涉及数据时，逐个核对筛选范围、指标、图表、表格、判断和详情。涉及导出时，独立打开实际 SVG、PNG、PDF 或原生数据，确认内容、范围、主题及标签与当前视图一致。现有 Demo 使用 [固定示例数据](examples/demos/data/project-data.js)，不得描述成真实业务结果；[两项已知数据问题](docs/PUBLIC_RELEASE.md) 仍需专项复验，现有通用交互脚本通过不代表它们已解决。

## 贡献图表与专项 Skill

引擎接入与 Agent Skill 接入是两件事。成功渲染一个样例，只证明这条渲染路径可用。引擎清单、格式与原生源要求见 [Visual Adapter](adapters/visual/README.md)；官方专项入口见 [Archify](adapters/visual/ARCHIFY_SKILL.md) 和 [AntV](adapters/visual/ANTV_SKILLS.md)。

- 引擎贡献应保留原生源、锁定依赖及许可证信息，并提供最小有效样例、失败样例和独立导出证据。生成失败不得覆盖上一有效产物。
- Skill 贡献应记录来源、发现/加载方式及实际调用证据，用一个新任务验证从需求到图形的完整路径。不要把引擎存在、文件复制或旧截图当作新会话调用通过。
- 更新生成物时，一并说明对应源文件和生成命令。不要只修改打包文件、导出的图片或运行投影来制造表面一致。

## PR 应让审查者能复现

PR 描述保持简洁，包含以下信息：

- **问题与行为**：具体触发条件，修改前后分别会发生什么。
- **可运行例子**：页面路径、复现步骤；新模式至少提供一个完整情境中的使用例子。
- **验证证据**：实际执行的命令、结果、主题/宽度、必要截图或导出文件；历史记录与本次复验分开。
- **边界**：尚未解决的问题、未验证平台、兼容性影响及相关 Issue。

证据只保留解释结果所需的内容，避免提交个人路径、访问凭据或真实客户数据。保留有助于理解修复的失败记录，不把首次失败改写成首次通过。参考现有 [公开版验收](docs/PUBLIC_RELEASE.md) 的问题、修复和证据组织方式。
