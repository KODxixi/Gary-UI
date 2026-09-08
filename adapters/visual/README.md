# Gary-UI Visual Adapter

这是 Gary-UI 的本地确定性制图适配层。它按内容目的路由到固定引擎，保留原生源文件，生成
自包含 HTML，并通过本机 Chrome/Edge 导出 SVG、PNG 或打印版 PDF。运行期间不访问 CDN、
不自动升级，也不在线安装依赖。

## 命令

```powershell
cd C:\AI\UI\gary-ui
.\gary-ui.cmd visual doctor
.\gary-ui.cmd visual validate --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual render --manifest examples\visuals\visuals.json
.\gary-ui.cmd visual export --manifest examples\visuals\visuals.json
```

可用 `--id <visual-id>` 只处理一项；`visual export` 可再用 `--format html|svg|png|pdf`
覆盖该项清单中的导出格式。错误格式会明确失败，不生成无效按钮。
上面的样例命令只在可写母本中运行；只读 runtime 消费者应把清单和原生源放到任务目标目录，
并让 `outputRoot` 指向该目录内的可写产物位置。

## 确定性路由

| purpose | engine | native source |
|---|---|---|
| architecture / workflow / sequence / data-flow / lifecycle | Archify | JSON |
| quantitative | Apache ECharts | JSON data + option |
| outline | Markmap | Markdown |
| infographic | AntV Infographic | JSON |
| simple-flow | Mermaid | Mermaid text |
| icons | Lucide | JSON icon list |

工具选择规则与原生源要求也写入 `capabilities.json`。AntV 信息图的官方 Skill 负责内容理解、模板
选择和语法生成；Gary 的固定本地适配器负责渲染与导出，具体治理边界见 `ANTV_SKILLS.md`。ECharts、
Markmap、Mermaid 和 Lucide 不机械复制独立 Skill，而由能力清单中的 guide 提供确定性使用规则。

输入以 `contracts/visual-manifest.schema.json` 为准。`outputRoot` 和 `source` 必须是清单目录内的
相对路径；文本源拒绝脚本、事件属性和 Mermaid click 指令。输出先写候选文件，通过校验后才
替换正式结果；失败记录写入 `.failed`，已有有效结果保留为 `.last-good`。

## 维护

- 精确依赖：`package-lock.json` 与 `toolchain.lock.json`。
- 引擎能力/格式：`capabilities.json`。
- Gary 主题映射：`theme-map.json`。
- 场景配方：`../../spec/scene-recipes.json`。渲染器从这两份 JSON 直接导入策略，runtime build 记录哈希。
- AntV 官方 Skills：受管母本位于 `C:\AI\skills`，来源与精确哈希见 `ANTV_SKILLS.md` 和锁文件。
- 许可证：`LICENSES.md`。
- Archify 固定副本：`vendor/archify`；不得在运行阶段更新。
- 浏览器运行库：`vendor/browser`；由锁定依赖生成并在 `toolchain.lock.json` 校验哈希，不依赖公共 CDN。AntV 使用本地浏览器运行时生成可独立导出的完整文字 SVG，规避 0.2.20 SSR 对部分模板丢失 `foreignObject` 文本的问题。
- 浏览器导出控制库：`vendor/node/playwright-core`；只使用已安装的本机 Chrome/Edge。
- runtime 入口：`runtime/runner.cjs`；运行 `npm run build` 重建，母本测试仍使用源码入口。

这是一条生成、嵌入、保留源文件和导出的管线，不提供拖拽编辑器。
