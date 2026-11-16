# Gary-UI 来源与裁决

本目录记录来源，不保存并行真相源。`C:\AI\UI\gary-ui` 是唯一可编辑母本。

## 来源优先级

1. 用户本轮明确决策与云端进度记录。
2. 本包 `DESIGN.md` 与 `tokens/tokens.json`。
3. 本机现行 Gary 工作包。
4. Trae v27、v9、test 历史实现。
5. Nice-report 归档仅吸收信息组织原则，不复制实现。
6. shadcn-app 仅作为 React 适配接口参考。

## 已核对来源

| 来源 | 文件数 | 树 SHA-256 | 用途 |
|---|---:|---|---|
| React Bits Light Rays | 1 | `b2be0dd25ba903c1a0897cc5ddac82634f599c99984df465cf5f632a265a4150` | Portal 默认动态 Scene；固定 commit `1ba7ecd4e570d20392fb62c923efb00f5b440642` |
| DeepSeek Harness 首页 | 1 | URL 参考 | 顶栏排版和胶囊按钮交互参考；未复制资产 |
| 用户确认的建筑场景图 | 1 | `476d559ad52be6c801cda1954b602153e205dcb7b6a834622aca51bfc9683812` | reduced-motion / WebGL2 降级 Scene；母本副本为 `assets/backgrounds/gary-default-scene.png` |
| 本机现行 Apple-UI/Gary skill | 153 | `bc70788ed6000ae7f8d7a2c896cd9f0e782e9d8e28ef2d8bb2e76546b5eadf34` | 规范骨架、Agent 行为、现行 demo |
| Nice-report archive | 126 | `a31092113df690da00b5963c32abaaed5cdd3d0f1d5b481969147285233318e0` | 吸收信息层级、场景连续性、报告导航与卡片留白原则；不复制实现 |
| Trae Gary-UI v27 | 81 | `5c9922e5573a3cce87bb96fd427039dc72ffa065245e8e45595d4ecdde7a107b` | tokens、6 组件契约、历史预览 |
| Trae Gary-UI v9 | 33 | `55fb17ee3c8996d11f44f322f4f243e4c9dad20a9feed9c455f8e8a6b21c1459` | 5 个增量组件的设计输入；禁止整包覆盖 |
| Trae Gary-UI test | 9 | `6d874b4480ad5d02edd538ca33f128db6a4a67c873246a7839cb29b4971fb285` | 交付清单、Web 动效配方、测试预览 |
| shadcn-app | 50 | `236b0260122a8eb030803c0c69a9f607fc137b3122a59739acdd143cf5a171c4` | React/Tailwind/shadcn 适配接口 |
| Claude Design 交付清单 | 1 | `68d928cdce7742f7262eb32b030c7f8051dcd109a9bab163a63e70532bfc099f` | 云端完成状态与缺项的文字证据 |
| VibeCamp dashboard | 1 | `8efec660dcc2b64ee98d00ce6b35b2269cd5b909484ecddb304d1b4c42081d35` | 浅色暖灰、低阴影与柔和几何参考 |
| liquid-glass-scrolling-v5 | 1 | `00773e85f989e5121238d824aae8d5c1aa65f3e42017188f4c4cf6b2cee12a8f` | 深色玻璃、边缘光与浮动顶部导航参考 |
| DDS Liquid Glass v4 报告基线 | 5 | `5ae75f40d52f6d82aa6a124c41a16dd67e89fba17fb7558f6173405341c6ca39` | 吸收左图右判、结论条、来源抽屉、连续阅读与 16:9 演示/打印；不复制项目数据与业务运行时 |

目录型来源的文件统计排除了 `.git/`、`node_modules/` 与 `dist/`。Nice-report 的稳定树哈希按
相对 POSIX 路径排序，并对每项串联“路径、NUL、小写十六进制文件 SHA-256、LF”后计算 SHA-256。

## 云端不可恢复边界

Claude Design 已无法登录，本机也未找到 `base.css` 或 `*.dc.html` 缓存。云端记录中的
13 组件、4 基础页、4 页面模式、Chip 与 Evidence Bar 按已确认行为重建，不声称是原文件导出。

## 设计方法引用

- `emilkowalski/skills` 的 `apple-design`（MIT，提交
  `0b85d4b36ad772ed2c46a66522ede1c8a26f9929`，本地 `SKILL.md` SHA-256
  `9a0f5b70d405a715c27031331c9bb0ff643940936821d07fffc8d4d6f2dc6b00`）作为还原 Apple 设计逻辑的首要 Web 方法入口。Gary 吸收原则并保持独立实现；该 Skill 不是公开 Demo 的运行时依赖。
- Apple 官方 [Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles)、
  [Motion](https://developer.apple.com/design/human-interface-guidelines/motion)、
  [Typography](https://developer.apple.com/design/human-interface-guidelines/typography) 与
  [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
  用于校验目的、用户控制、动效、动态排版、功能材质和辅助功能边界；仅作规范引用，不复制 Apple 资产或原生组件。

## 合并裁决

- `react-bits-light-rays`：absorbed。保留官方着色器与动效模型，React/OGL 外壳改写为
  Portal 可离线运行的原生 WebGL2；许可文本随母本保留。
- `user-default-background`：absorbed。用户确认的 Scene 素材继续作为静态降级背景，消费项目
  只通过 `--gary-scene-image` 覆盖。
- `active-local`：absorbed。legacy Apple-UI/Gary 的规范骨架、Agent 行为与 demo 已归一到
  Gary 母本，归档不再参与运行或生效。
- 不保留 `spec/`、`vendor/`、根目录三套并行 token。
- 不收入 reports、视觉回归截图、临时质量报告、CDN-only demo、未引用大图或生成物。
- v9 的旧 token 与同名文件不覆盖新母本；只吸收可证明有价值的组件语义。
- Nice-report 只吸收信息层级、场景连续性、报告导航与卡片留白原则；不复制其中的 HTML、
  CSS、JavaScript、素材或页面实现。
- VibeCamp 与 liquid-glass-v5 只作视觉比较，不成为并行 token 或 CSS 真相源。
- DDS Liquid Glass v4 只吸收已由用户要求复用的报告构图与交互；DDS 的项目字段、证据准入、
  数据渲染、冻结包与 QA 运行时继续留在 DDS。
- React 适配层消费 Gary tokens，不反向定义视觉规范。
- 默认动态背景由用户明确指定；静态降级背景仍只覆盖 `--gary-scene-image`，不复制或分叉组件。

`source-manifest.json` 中的每个来源都必须在 `coverage.json` 中至少有一项 coverage
裁决。每项裁决必须标为 absorbed、replaced、reference-only、rejected 或 reconstructed，
并指向母本中的证据文件；这样可以证明“已审阅但不复制”与“尚未检查”不是同一件事。
