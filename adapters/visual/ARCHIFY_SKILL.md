# Archify 官方 Skill 接入

Gary-UI 在自然语言任务属于技术架构、工作流、时序、数据流或生命周期时调用 `archify` Skill。简单 Markdown 流程仍保留 Mermaid；定量图表仍使用 ECharts。

## 权威与解析顺序

- 官方来源：[tt-a1i/archify](https://github.com/tt-a1i/archify)
- 锁定提交：`c6519401f7b91b9d43011657880893b0a8955548`
- 引擎版本：`2.17.0-dev.1`；官方 Skill 元数据版本：`2.17`
- 本文件中的项目路径均相对于 Gary-UI checkout 根目录；`adapters/visual/vendor/archify` 是
  同提交、同哈希的离线回退包，不是第二维护源。
- Agent 先检查当前技能目录中已安装的 `archify`，完整读取其 `SKILL.md` 并解析该目录内的引用；
  没有注册的专项 Skill 时，可明确使用仓库锁定离线包，不能宣称它已自动安装到 Agent。
- 如果需要安装到自己的 Agent，使用该 Agent 支持的安装方式，从
  [锁定上游提交](https://github.com/tt-a1i/archify/tree/c6519401f7b91b9d43011657880893b0a8955548)
  获取完整 Skill 目录及其引用文件；不要只下载 `SKILL.md`，不要在任务运行期自动升级。

当前 `adapters/visual/runner.mjs` 的引擎路径解析依次为：

1. 环境变量 `GARY_UI_ARCHIFY_ROOT` 指向的完整 Archify 目录。
2. 从 Gary-UI 根目录解析 `../../skills/archify`（维护者的可选母技能布局）。
3. 从 Gary-UI 根目录解析 `../archify`（相邻 Agent Skill 布局）。
4. 本仓库 `adapters/visual/vendor/archify`。

候选目录必须包含 `bin/archify.mjs`；只设置一个 Markdown 路径无效。需要强制使用当前仓库的
离线引擎时，把 `GARY_UI_ARCHIFY_ROOT` 设置为该 vendor 目录的实际绝对路径。
`python scripts/gary_ui.py visual doctor` 会核对实际选中的 Skill 路径与锁文件中的 SHA-256。
哈希不一致时失败，不会自动下载、更新或安装。Agent 实际读取的 Skill 也必须与锁定提交一致。

维护者自己的受管部署可能把母技能投影到运行技能目录；这是可选的安装环境治理，公开用户无需
建立维护者的盘符或目录。独立运行副本只读，修改仍回到安装时选择的源码目录。

## 引用加载

新会话先完整读取官方 `SKILL.md`。普通制图只再读取 `schemas/common.schema.json`、一个匹配的类型 schema 和一个匹配的 JSON 示例；只有用户请求演示控制、仓库证据、品牌、质量修复或其他进阶能力时，才读取 Skill 明确指向的对应 reference。不要为了生成一张图遍历所有参考资料或渲染器源码。

生成顺序遵循官方 Skill：自然语言选型 → 写原生候选 JSON → 每次修改后 validate → deliver 生成交互 HTML → Gary-UI 在隔离候选目录真实打开验证 → 同批导出 SVG/PNG → 整批成功后替换正式版本。任何环节失败都保留上一有效版本，并把失败候选单独标记。
