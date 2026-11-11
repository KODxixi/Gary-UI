# Gary 参考提炼与视觉整改

日期：2026-09-07。范围为 DeepSeek 导航/卡片/网格、COSMOS 风格提炼、字体、按钮与 G × 建筑标志。
这是一轮局部设计与实现验收，不替代六工具的全部语义、事务和新会话验收。

## 入口

运行中的首页：http://127.0.0.1:4173/examples/demos/index.html

如服务未运行，在 `C:\AI\UI\gary-ui` 执行：

```powershell
python -B scripts\serve_portal.py --surface portal --port 4173
```

本轮未重启或替换已有 4173 服务，没有修改 COSMOS 镜像文件，没有提交、推送或发布。
为本地阅读临时启动了镜像自带的 8784 预览，无系统服务注册。

## 提炼与实现

| 参考重点 | Gary 实际处理 | 边界 |
|---|---|---|
| COSMOS 中心留白与轻标题 | 首页、管理层简报、方案展示的标题使用 400 字重，保持单行与章节间距 | 中文不套用英文负字距；不复制照片和字体 |
| DeepSeek 嵌入/浮动导航 | 80px 阈值；桌面 46px 高、top 8px；1140→980、超宽1280→1180 | 手机 54px 高保证 44px 热区 |
| 卡片分层与反馈 | blur 12px 中性底板、局部追光、独立 2px 边缘、6s 单次旋转、键盘焦点、按压 | 保留 Gary 30px 主卡；密集正文和图表保持实底 |
| 背面网格 | 28px 点阵加 90px 稀疏网格，指针局部形变与亮度 | 纯黑/纯白底，无默认图片，无待机动画 |
| 展示卡片纹理 | 原创本地 Canvas 轮廓场，hover/focus 600ms 放大至 1.06 | 不复制 shader，不从公网加载 |
| 字体统一 | 英文 Helvetica，中文 Microsoft YaHei；读取安装字体实际 glyph | 富文本100–900是静态字重匹配，不承诺每档都是独立真实字形 |
| 品牌与按钮 | 原创围合体块 G 矢量标志；图标与短按钮内容居中 | 未做商标查重，长文档条目保留左对齐阅读 |

此前发现的真实问题与修复：

- 当前服务 `/assets/scenes/dot-grid.js` 返回404。将唯一引擎置于已服务的 `patterns/shared/dot-grid.js`；旧入口只转发，Demo、Portal 和起手模板均引用新入口。
- 外链 SVG CSS mask 在 file 模式被浏览器 CORS 拒绝。改为普通本地 SVG image 与主题滤镜，独立文件保留；没有放宽浏览器安全策略。
- Portal 浮动导航曾将品牌名称挤成两行。固定品牌不收缩并收紧导航项间隔，增加实际区域不重叠检查。
- 原暂停测试把导航的瞬时 CSS transition 误算为演示动画。按实际 `[data-motion-item]` 检验时间冻结与完成；独立卡片/导航反馈分别测试。

## 当前证据

最终结果：导航64/64、卡片4/4、六页布局36/36、关键交互12/12、HTTP入口5/5；既有 unittest 134/134。
`validate.py`、`validate_v2.py` 通过；React production build 与 typecheck 通过。独立导出结构检查覆盖10 SVG、10 PNG、6 PDF。
下列 JSON 均含实际运行时间，以 JSON 的最终状态为准；检查数量不是视觉质量评分。

本轮实际使用 Gary-UI / interface-design / browse / test-driven-development / verification-before-completion。
Gary 约束使实现保留30px圆角、8px历史基线和阅读实底；interface-design 的类型与节奏检查促成展示标题减重。
Visual Route：HTML + shared Gary tokens/components，三情境共用底层，局部参考配方按内容目的启用。

- `report.json`：首页、六页与 Portal；1440/1600/768/390；明暗主题；顶部/浮动几何、图片加载、区域不重叠、手机菜单与 Escape。
- `cards-report.json`：明暗 × 动态/减弱动态，真实 Canvas 像素变化、轮廓非空、边缘反馈、焦点与 CDP 实际字体名。
- `../edition-02/layout-report.json`：六页 × 1440/768/390 × 明暗，离线 file 页面与最终截图。
- `../edition-02/interaction-report.json`：六页桌面/手机筛选、详情、来源、演示暂停/完成、32px 根字号的文字200%检查、减弱动态。
- `../edition-02/http-report.json`：实际本地HTTP入口、链接、分类和 Portal 嵌入。
- `../export-integrity/integrity-report.json`：独立 SVG/PNG/PDF 结构与非空检查；两个报告PDF已重新生成。

关键截图：`cards-dark.png`、`cards-light.png`、`demos-390-light-top.png`、`portal-1440-dark-floating.png`。
截图证明最终外观的具体状态，不将“有 SVG / token / 无报错”当作视觉质量评级。

## 复现命令

```powershell
node scripts\header_brand_qa.mjs
node scripts\card_material_qa.mjs
node scripts\demo_edition_qa.mjs
node scripts\demo_interaction_qa.mjs
node scripts\demo_http_qa.mjs
node scripts\export_demo_reports.mjs
python -B scripts\export_integrity_qa.py
python -B -m unittest discover -s scripts\tests -q
```

不要在生成截图/导出时同时运行 runtime copy/check 测试，源文件变化会造成真实哈希漂移。

## 限制

- 本轮没有重新执行所有六引擎的失败事务、新会话 Skill 路由或跨浏览器验收，不能据此宣称整个早期大计划重新通过。
- 200%检查放大正文的根字号，不是浏览器页面缩放；固定尺寸导航、图形内部文字未作为全局操作系统字形放大验收。
- Chrome 为已验证环境；其它系统需安装或合法提供 Helvetica/微软雅黑，否则会回退。未联网分发字体。
- React 已通过生产构建/类型检查、共用生成CSS；SPA反复挂载/卸载的专用生命周期 Hook 未验证。
- COSMOS 镜像部分媒体未加载，本轮仅研究可见布局及源码；没有复制其媒体或声称镜像完整通过。
- 短录屏未提供。动效用上述步骤与 JSON 像素/动画状态检查复现；视觉品味仍交用户验收。
