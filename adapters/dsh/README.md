# Gary-UI DSH 插件（gary-ui-dsh）

把 Gary-UI 设计系统以 DSH 原生能力交付：**preset（装配声明）+ 插件（工具代码）**，
遵循 `local-vision` preset 的既有范式。插件代码母库在本目录，运行时通过 junction
投影到 DSH harness，单一真相源。

## 提供的能力

| 工具 | 作用 |
|---|---|
| `gary_ui_serve` | 启动（或复用）本机只读静态服务，serve 设计树 `tokens/ components/ patterns/ assets/`。默认 `127.0.0.1:17888`，被占用自动顺延端口。幂等。 |
| `gary_ui_emit` | 生成**完全自包含**的 HTML：把 `<link rel="stylesheet">` 引用的样式递归内联（含 `@import`），把所有 `url()` 资源改写为 base64 data URI。产物不引用自身以外的任何东西——拷到 UNC/file:///任意静态托管都不会 404。 |

`gary_ui_emit` 是对审计 critical 族（产物 root-absolute 路径拷出即白屏）的根治：
交付物自包含，serve 只负责开发期预览。

## 结构

```
C:\AI\UI\gary-ui\adapters\dsh\
├── plugin\                  # 插件代码母库（npm 包，零依赖）
│   ├── package.json
│   ├── lib\core.js          # 内联/emit 纯逻辑（可单测）
│   ├── lib\server.js        # 只读静态服务（穿越防护 + 端口回退）
│   ├── lib\index.js         # cordis 插件：注册 gary_ui_serve / gary_ui_emit
│   ├── test\                # node:test 单测（node --test，11 项）
│   └── scripts\smoke.mjs    # 对真实设计树端到端冒烟
└── README.md                # 本文件
```

preset 母库：`C:\AI\agents\dsh-presets\gary-ui\`（preset.yml + agent.cordis.yml，
工具行为纯消费行，平铺无需 isolate realm）。

## 安装 / 更新（幂等）

```powershell
# 1) 插件 junction：harness node_modules\gary-ui-dsh → 本目录 plugin\
$target = "$env:APPDATA\npm\node_modules\@deepseek-ai\dsh\node_modules\gary-ui-dsh"
if (-not (Test-Path $target)) {
  New-Item -ItemType Junction -Path $target -Target 'C:\AI\UI\gary-ui\adapters\dsh\plugin'
}
# 2) peer 依赖 junction：@deepseek-ai/dsh-tools（Node 会 realpath 穿透 junction，
#    插件的裸导入必须在真实路径下可解析——镜像 harness 内同版本实例）
$depTarget = "$env:APPDATA\npm\node_modules\@deepseek-ai\dsh\node_modules\@deepseek-ai\dsh-tools"
$depLink = 'C:\AI\UI\gary-ui\adapters\dsh\plugin\node_modules\@deepseek-ai\dsh-tools'
if (-not (Test-Path $depLink)) {
  New-Item -ItemType Directory -Force -Path (Split-Path $depLink) | Out-Null
  New-Item -ItemType Junction -Path $depLink -Target $depTarget
}
# 3) preset 发现：C:\AI\dsh\.dsh\.agent-presets 是到 C:\AI\agents\dsh-presets 的
#    junction，新增 gary-ui 目录即被发现，无需重启（discovery 每次重读）。
```

> DSH 升级（npm update -g @deepseek-ai/dsh）会清掉 harness node_modules 里的
> junction；升级后重跑第 1、2 步即可（local-vision 插件同为拷贝部署，同样受影响）。

## 验证

```powershell
cd C:\AI\UI\gary-ui\adapters\dsh\plugin
node --test                 # 单元测试（内联器 + 静态服务）
node scripts/smoke.mjs      # 对真实设计树端到端冒烟
node -e "require.resolve('gary-ui-dsh', { paths: ['<dsh安装目录>'] })"
```

## 使用

- 在 WebUI 新建会话选择 preset **「Gary-UI 设计系统」**。
- Agent 生成页面：`gary_ui_emit`（html + target_path）→ 返回自包含文件路径。
- 开发期预览：`gary_ui_serve` → 用返回的 baseUrl 拼预览链接。
- 页面规范（类名/data-gary-* 属性/组件）仍以 `gary-liquidglass-ui` skill 为权威。

## 回滚

- 删 preset：`Remove-Item -Recurse C:\AI\agents\dsh-presets\gary-ui`
- 删插件：删 harness 里的 `gary-ui-dsh` junction（插件代码仍在母库，可随时重装）。
