/* Gary-UI 验收固定示例数据：华东服务交付计划，快照日 2026-08-31。禁止用于真实经营决策。 */
window.GARY_PROJECT_DATA = Object.freeze({
  meta: { title: "华东服务交付计划", snapshot: "2026-08-31", provenance: "Gary-UI 验收固定示例数据（人工编制、非真实业务）", currency: "万元" },
  regions: {
    all: { label: "全部区域", revenue: 1280, completion: 78, risks: 4, trend: [56, 62, 69, 71, 74, 78], target: [60, 64, 68, 72, 76, 80] },
    shanghai: { label: "上海", revenue: 520, completion: 86, risks: 1, trend: [62, 68, 72, 75, 80, 86], target: [66, 70, 74, 78, 82, 86] },
    jiangsu: { label: "江苏", revenue: 430, completion: 76, risks: 2, trend: [53, 59, 66, 70, 72, 76], target: [58, 62, 67, 72, 76, 81] },
    zhejiang: { label: "浙江", revenue: 330, completion: 68, risks: 1, trend: [48, 55, 62, 65, 67, 68], target: [55, 60, 65, 70, 75, 80] }
  },
  workItems: [
    { id:"GD-104", title:"验收证据自动归档", owner:"林岚", status:"doing", risk:"medium", region:"shanghai", due:"09-09", detail:"把浏览器截图、导出校验与生成回执关联到同一版本。" },
    { id:"GD-108", title:"江苏数据口径复核", owner:"周野", status:"blocked", risk:"high", region:"jiangsu", due:"09-06", detail:"缺少合作方对退款口径的书面确认，阻断管理层数据发布。" },
    { id:"GD-112", title:"浙江培训材料定稿", owner:"许澄", status:"todo", risk:"low", region:"zhejiang", due:"09-12", detail:"补充长中文流程说明与无障碍键盘操作章节。" },
    { id:"GD-097", title:"离线制图链路验收", owner:"顾言", status:"done", risk:"low", region:"shanghai", due:"08-29", detail:"ECharts、Markmap、Mermaid、Archify、Infographic 与 Lucide 均从本地加载。" },
    { id:"GD-101", title:"导出一致性修复", owner:"顾言", status:"doing", risk:"medium", region:"jiangsu", due:"09-08", detail:"候选版本通过真实渲染后再整体替换 HTML、源文件、SVG、PNG 与回执。" },
    { id:"GD-114", title:"客户知识库迁移", owner:"沈桥", status:"todo", risk:"medium", region:"zhejiang", due:"09-15", detail:"迁移 42 篇操作说明，并保持原始来源和章节锚点。" }
  ],
  articles: [
    { id:"decision", title:"为什么采用分阶段交付，而不是一次性切换全部区域", type:"决策", source:"项目决策记录 DR-07（验收示例）", body:"华东三地的人员熟悉度与数据口径并不一致。一次性切换会让培训、数据核验和异常响应同时进入峰值，任何一个环节的延迟都可能遮蔽真实问题。因此计划先以上海作为稳定样板，再将经过复核的模板复制到江苏和浙江。这里的“复制”不是照搬界面，而是复用可验证的输入、明确的责任边界和一致的验收记录。" },
    { id:"evidence", title:"证据链与上一有效版本保护", type:"规范", source:"Gary-UI Visual Contract v1（本地）", body:"每次生成先写入隔离候选目录。源文件、交互 HTML、SVG、PNG、PDF 与回执必须作为同一批次验证；只有全部成功才切换正式版本。失败候选保留错误原因，页面继续指向上一有效版本，并明确标记导出是否陈旧。" },
    { id:"accessibility", title:"长中文、键盘与减弱动态的验收说明", type:"验收", source:"项目验收清单 AC-12（验收示例）", body:"正文保持十六像素和一点六八行高，连续阅读行宽控制在六十五到七十五个汉字附近。键盘焦点必须可见；当用户偏好减弱动态时，内容直接呈现最终状态，播放控件不再造成误导。二百百分比文字大小通过浏览器根字号验证，不以页面整体缩放替代。" }
  ]
});
