# 可复制骨架专项复验

最终证据为 `generated-starter-verified-report.json`，由 `node scripts/starter_generated_qa.mjs` 实际生成，28/28 通过。

本轮先在浏览器读取起手模板的 `#starter-code-output`，再把这段原样 HTML 作为独立文档打开；未将组合预览 iframe 的加载成功当作复制产物成功。

已复现并修复：

- 生成路径固定为 `/gary-ui/`，在当前官方本地服务中 CSS 和四个共享脚本返回 404。现按 `document.baseURI` 解析真实资源根。
- 生成文档缺少 UTF-8 声明，在未由响应头指定编码的浏览器环境中被解析为 GBK，中文乱码。现补充 charset。
- 生成文档缺少 viewport，390px 移动浏览器使用 980px 布局。现补充 viewport。

回归覆盖 1440px 与真实移动 390px、深浅主题、四种材质、十二种应用/页面路由；读取中文、计算后的 Gary 控件高度、点阵数量和 SolidPlate 的实际 backdrop-filter。生成物仍是空内容骨架，不能代替完整页面视觉验收，也依赖该母本资源服务持续可访问。

`report.json`、`generated-starter-before.html` 保留修复前证据；`preview-unmounted-header.json/png` 是移交主任务处理的组合预览标题卡材质遗漏证据。`generated-starter-after-report.json` 若存在，是旧测试选择器点击透明 radio 发生遮挡的中间试跑，不作为产品验收结论；最终回归已改为点击用户可见的标签。
