# UI 独立复验 · 2026-09-08

本轮已记录的 UI 问题修复后复验通过。主任务实际打开 Codex 内置浏览器检查页面，另由独立审查分别验证响应式导航和复制出的 HTML。完整 Demo 继续作为视觉基线；原验收的两项业务数据 P2 仍开放，不签署整体无遗留通过。

## 修复与实际验证

| 已复现问题 | 修复后行为与证据 |
| --- | --- |
| Portal 在 701–1100px 常规导航隐藏而菜单按钮也隐藏 | 菜单显示断点与导航一致；实际展开、进入“基础 → 材质”和“组件”。见 [主任务 8 个宽度](root/report.json)、[独立 10 个宽度](agent/final/report.json)。 |
| 手机内嵌完整 Demo 小于 320px，内容被横向裁切 | 320/390px 下 iframe 与内部文档宽度分别为 320/320、390/390。见 [独立复验](agent/final/acceptance.md)。 |
| Demo 菜单形态不符，替换 SVG 后点击会立即收起；320px 滚动顶栏标题遮挡入口 | 采用圆形菜单/关闭图标，使用事件原始路径判断外部点击；限制标题可见区域。实际点击 SVG 中央、展开链接，再关闭；另检查五个滚动宽度。见 [滚动证据](agent/final/scrolled.json)。 |
| Portal 深浅主题没有传入完整 Demo iframe 和独立打开链接 | 外层切换主题同步 iframe 和本地 HTML 链接参数；Background 仍为纯文字入口，独立打开背景功能卡，Escape 关闭并返回焦点，旁边圆形按钮独立切换主题。见 [链路回归](root/report.json)。 |
| 组件演示动作被误绑定到分类筛选，操作后仅剩四张卡 | 分类监听限定实际筛选按钮；五个组件动作可反复操作，15 张卡仍显示。见 [组件行为](root/component-actions.json)。初始图标名称同步修正为返回、刷新和收藏案例。 |
| 场景示例仍展示弧线/渐变，机器契约仍描述线网；模板标题卡缺少光学挂载 | 场景示例改为点网格亮度切换，删除弧线；契约明确单一点阵与 CSS 点阵降级；补齐标题卡挂载。见 [场景截图](root/component-scene.png)、[系统一致性](../system-consistency/report.json)。 |
| 复制的模板 HTML 资源 404、中文乱码、手机使用 980px 布局 | 从当前文档解析母本资源根，补齐 UTF-8、viewport 和标题。真实点击可见选项并读取代码输出，将原样 HTML 独立打开。28 组覆盖双宽度/双主题/四材质及十二应用页面路由。见 [复制产物复验](contracts/acceptance.md)。 |
| 验证器仍强制旧“显示设置”结构，把 SVG 命名空间误判为远程资源 | 验证独立 Background 与主题入口；仅排除 SVG 命名空间元数据，实际远程请求继续被拒绝。两项专项单元测试和全量验证通过。 |

## 最终执行结果

| 命令或检查 | 本轮结果 |
| --- | --- |
| `node scripts/card_material_qa.mjs` | 100/100；1440/390px、深浅主题、Portal/组件/十二模板、单一点阵、卡片挂载及操作。证据：[report.json](../system-consistency/report.json)。 |
| `node scripts/portal_acceptance_qa.mjs` | 8/8 个宽度：320、390、701、768、900、1024、1100、1440px；实际菜单、主题、链接、内嵌宽度和 Background。证据：[report.json](root/report.json)。 |
| `node scripts/starter_generated_qa.mjs` | 28/28；主任务重新执行独立审查脚本。证据：[generated-starter-verified-report.json](contracts/generated-starter-verified-report.json)。 |
| `node scripts/demo_interaction_qa.mjs` | 12/12；六页完整 Demo 双宽度核心交互。该脚本未覆盖下述两个数据 P2。 |
| 独立浏览器复验 | 10 个宽度及 5 个滚动宽度，独立/内嵌 Demo 菜单、入口、主题传递；[最终记录](agent/final/acceptance.md)。 |
| `python -B scripts/validate_v2.py` | 通过。 |
| `python -B -m pytest scripts/tests -q -p no:cacheprovider` | 停止其他文件写入后完整重跑：176 passed、75 subtests passed，56.15s。包含两项新增离线依赖识别测试。 |
| 本轮涉及源文件的 `git diff --check` | 通过；未清理无关的既有改动。 |

## 失败记录及复验顺序

- 独立审查最初的产品失败保留在 [agent/acceptance.md](agent/acceptance.md)、[agent/report.json](agent/report.json)；第一轮修复后的剩余问题保留在 [agent/after/](agent/after/)。最终通过证据单独位于 `agent/final/`。
- 复制产物最初的故障保留在 [contracts/report.json](contracts/report.json) 和 [修复前 HTML](contracts/generated-starter-before.html)。透明 radio 被点击遮挡属于旧脚本选择器问题，修正为可见标签后重新生成最终 28 组结果，见专项验收说明。
- 主任务导航脚本初次未展开“基础”就点击隐藏链接，且空文档读取缺少保护，导致试跑失败；修正测试动作后重新执行，保留 `root/failed-*.png`。最终 `root/report.json` 是新运行结果。
- Python 第一次全量运行出现 `test_check_reports_runtime_only_as_warning_not_drift` 失败（预期退出码 0，实际 1），当次为 1 failed、175 passed、75 subtests passed。该测试复制母本后比较哈希，当时其他检查正在写证据和更新目录页；并发写入是可能原因，未取得当次具体漂移文件清单，不能断言。停止写入后同一测试独立重跑为 1 passed（9.73s），随后全部测试重跑为 176 passed、75 subtests passed。没有放宽测试或跳过该项。

## 范围与未关闭事项

- 默认背景只保留一套页面点阵，工具操作以圆形图标为主，导航/筛选保留文字。Background 与主题按钮保持分离。
- 两项业务 P2 仍开放：分析页筛选区域后详情仍固定江苏；静态图表导出不跟随当前筛选。以 [原始独立验收](../../../../docs/GARY_UI_INDEPENDENT_ACCEPTANCE_2026-09-08.md) 为准。
- 可复制 HTML 是依赖母本资源服务的起手骨架；此次验证不代表离线单文件交付。
- 本轮没有实体手机或 Safari 验证，也没有重新验证全部 SVG/PNG/PDF、官方 Skill 新会话调用或完整动画生命周期。两份制图目录页仅重建 CSS 快照，未改各图形的原生源或导出数据。
- 更新了母本实现、README、AGENTS 与验收入口；未提交、发布或同步实际 runtime。Python 临时投影测试通过不代表现有 runtime 已同步。
