# Gary-UI 公开版验收

本次验收针对 2026-09-08 的独立公开源码候选。在线部署结果由 GitHub Pages 内建发布与发布后记录确认；以下只列实际完成的检查。

## 已通过的检查

| 范围 | 实际结果 |
| --- | --- |
| 本机独立静态预览 | Python 标准库预览服务测试 4 项通过；不依赖维护者 Session 服务。 |
| 公开源码导出边界 | 2 项测试通过：只导出指定目录，拒绝覆盖非空目录和越界输出，保留 `.git` 与私有文件隔离。 |
| 实际页面与移动布局 | Chrome 152，1440 / 390 / 320px，首页、六 Demo 与 Portal 共 24 项通过；主题、单一点阵、Background 独立入口、菜单、资源请求和横向溢出检查通过。 |
| Pages 子路径 | 实际构建后在 `/Gary-UI/` 下运行同一组 24 项检查，全部通过。 |
| 核心业务交互 | 六个 Demo × 桌面/手机 12/12 通过。已知两项数据问题不计入关闭。 |
| 模板复制与加载 | 12 个模板组合、深浅主题、4 种材质及桌面/手机共 28/28 通过；实际读取复制按钮写入的剪贴板，保存独立 HTML 并打开。共享资源仍来自预览服务。初轮仅因 Windows 剪贴板换行变化导致比较失败，规范化断言后复验通过，产物内容未改。 |
| 原创光学与动态背景 | 31 项通过；折射强度 0→180 实际改变 32,535 / 124,700 像素，卡片尺寸与正文保持稳定。验证播放、暂停、减弱动态、离屏、打印、清理、降级与 PNG 输出。 |
| 第三方许可 | 292 个锁定包，308 份许可、NOTICE 或包声明随源码保存并核验哈希。其中 2 个上游包只提供 MIT 声明，未补造缺失许可文本，详见适配器许可清单。 |
| 独立公开审查 | 检查入门链接、机器路径边界和受限实现；已修复旧效果引用、不可用场景契约与历史证据断链。公开代码未发现实际凭据或私钥。 |

可复核的页面结果见 [public-pages.json](../examples/demos/evidence/public-release/public-pages.json)，光学与动态背景结果见 [original-surfaces.json](../examples/demos/evidence/public-release/original-surfaces.json)。子路径见 [pages-subpath.json](../examples/demos/evidence/public-release/pages-subpath.json)，交互见 [demo-interactions.json](../examples/demos/evidence/public-release/demo-interactions.json)，模板见 [copied-templates.json](../examples/demos/evidence/public-release/copied-templates.json)。命令与后续发布流程见 [PUBLISHING.md](PUBLISHING.md)。

## 已知问题

- 分析页切换到上海等区域后，判断卡“查看具体事项”仍固定打开江苏事项。
- 分析页静态 SVG/PNG 导出仍对应全部区域，不随当前筛选变化。

这些是已复现的数据一致性问题。设计页面可以体验与复用，真实业务使用前需要接入自己的数据并验证详情、图表与导出范围。通用交互检查不作为这两项问题的关闭证据。

## 公开与本地边界

- 原创代码采用 MIT；第三方许可证单独随仓库保留。
- 公开库使用原创光学与波浪模块。旧的受限 React Bits 移植、原始快照、机器部署回执和重复历史生成物保留在维护者本地；对应的历史 Light Rays 测试也不属于公开实现。
- 普通 Python 预览不依赖 `C:\AI`。高级 Session、外部专项 Skill 自动发现和受管部署需各自配置；公开克隆不自动安装这些 Skill。
- 普通静态预览和 Pages 不提供写回维护者母本的接口；Portal 保留本地导出，写回操作会明确提示需要维护服务。
- 真实 SVG 背景折射仅在 Chromium 验证，其他浏览器采用基础磨砂降级。实体手机、Safari 与全部导出内容尚未逐项复验。
