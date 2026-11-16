# Gary-UI 独立验收 · 2026-09-08

结论：主体交付基本完成，保留两项已复现的 P2 问题，暂不签署整体无遗留通过。本次审查未修改实现、同步部署或覆盖原验收证据。
入口：http://127.0.0.1:4173/examples/demos/index.html

## 必须整改

1. **P2 / 已验证：区域筛选后判断详情仍固定为江苏。** 打开交付脉冲，选择上海，指标与判断显示上海 86%，点击“查看具体事项”却打开“江苏数据口径复核 / GD-108”。`examples/demos/web-analysis/index.html:17` 写死了详情；`examples/demos/shared/demo.js:107` 的 `updateRegion` 更新了判断正文和表格，没有更新该按钮的详情。影响：当前判断与行动对象不一致。整改：由当前区域对应的事项生成详情。复验：全部、上海、江苏、浙江逐个筛选，分别检查判断按钮与表格详情，再切回全部。
2. **P2 / 已验证：筛选后的图表导出没有携带区域范围。** 选择上海后页面实际/目标终点为 86%/86%，点击页脚“图表 SVG”仍打开 `delivery-trend-light.svg`，数据对应全部区域的 78%/80%。PNG 和“数据与原生配置”也由源码确认指向固定全区域产物。`examples/demos/shared/demo.js:21` 只按主题拼接导出链接；入口见 `examples/demos/web-analysis/index.html:20`，固定数据见 `examples/demos/visuals/sources/delivery-trend.json:37`。影响：读者可能把全区域图用于上海结论。整改：导出当前筛选范围并写入区域/日期；如果此处只提供固定示例，必须明确标注“全部区域示例导出”，同时提供与当前视图一致的导出入口。复验：四种区域、双主题逐一比较图表、数据表、原生数据和 SVG/PNG 的数值及范围标签。

## 本轮实际验证

- Python：`python -B -m pytest scripts/tests -q -p no:cacheprovider`，174 passed、75 subtests passed。
- 制图适配器：`adapters/visual` 下 `npm test`，17 项通过；包含无效 Mermaid、失败不覆盖上一有效产物、主题接入和 SVG 修复回归。
- Visual doctor 通过：官方 Archify、AntV Creator/Syntax Skill、参考文件及固定运行依赖哈希匹配，主题和场景策略哈希匹配。
- Runtime projection check 通过：808 个选定文件，missing/hashMismatch/retiredPresent 均为空；允许存在的 runtime-only 文件未删除。
- 浏览器实际打开六页：分析页区域联动与详情、阅读页搜索、Kanban 阻断筛选及手机浅色布局、管理层简报视觉、报告目录与数据展开、提案播放/重播/暂停/继续及有限结束。
- 独立 Markmap 中文导图已目视检查，分阶段策略分支实际折叠成功；Archify、AntV 独立 SVG 已打开检查，未见黑块或文字消失。
- 两份 PDF 均由 Poppler 成功读取：研究报告 3 页，方案报告 6 页；重新渲染并目视抽查研究报告第 1 页、方案报告第 3 页，架构六节点与连线完整。

## 证据与边界

- 参考原交付记录 `examples/demos/evidence/edition-02/acceptance.md` 及对应 JSON；其中 36 种布局、12 项交互、20 项独立导出等属于原任务记录，未冒充本次全部重跑。
- 当前官方 Skill 可发现且文件哈希已验证；新需求调用采用保留的 `examples/visuals/evidence/skill-routing/` 与 `archify-skill/final-remediation.md` 证据。本轮没有创建新的独立 Agent 会话。
- Archify 新会话首次 GPU 沙箱失败记录保留，后续主任务修正及官方 visual-check 通过有单独记录，不能将首次失败改写成直接成功。
- AntV 离线渲染会移除需远程查询的 icon 行，保留原生源；这是已披露的能力限制，不能宣传为完整离线图标支持。
- 本轮没有实体手机/Safari 检查，PDF 为抽样视觉检查，没有逐页或打印机验收。通过结构回归不等于所有新业务页面自动达到相同视觉质量。
- 收尾条件：只修复上述两项，补上覆盖区域切换后详情及导出的行为回归，更新受影响产物，再执行相关测试并复验真实页面。


## 后续局部复验：全系统视觉一致性

根据用户后续反馈，已把完整 Demo 的卡片逻辑扩展到 Portal、组件、HTML 模板及制图目录，工具操作默认圆形图标，背景只保留一套点网格。相关实现与文档已修改，因此开头“未修改实现”仅描述首次独立审查，不代表后续维护状态。

本轮真实浏览器 100 项一致性检查、12 项完整 Demo 交互、174 项 Python 测试及 75 个子测试、17 项制图回归通过。范围与截图见 [视觉一致性复验](../examples/demos/evidence/system-consistency/acceptance.md)。上述两项 P2 未在本轮修复，原 runtime projection 校验属于首次审查历史证据；本轮未重新同步运行投影。

## 再次独立复验：导航、主题和实际复制产物

用户要求自行验收后，主任务与两项独立审查继续发现并修复了菜单断点断档、手机内嵌页裁切、菜单 SVG 点击后立即关闭、滚动顶栏遮挡、外层主题未传入完整 Demo、组件动作误触分类筛选、复制骨架资源 404/中文乱码/移动视口缺失、模板标题卡材质遗漏，以及旧场景示例和验证规则未同步的问题。

最终复验为 100/100 项系统一致性、8/8 组导航与主题链路、28/28 组独立加载的复制 HTML、12/12 项完整 Demo 交互；停止其他文件写入后，Python 全量测试为 176 passed、75 subtests passed，`validate_v2.py` 通过。另有独立浏览器检查覆盖十个宽度和五个滚动宽度。测试中的一次投影失败和中间浏览器失败均在新验收单中保留说明，不将历史失败覆盖为首次通过。

详见 [UI 独立复验及证据](../examples/demos/evidence/independent-recheck/acceptance.md)。此次通过仅适用于记录的 UI 范围；上文两项数据 P2 仍未关闭，没有重新部署或验证真实 runtime，也没有重跑官方 Skill 新会话、全部图形导出或 PDF 验收。
