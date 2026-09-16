# Gary-UI React/shadcn Adapter

这是 Gary-UI 对 React 19、Tailwind CSS 4 与 shadcn 的薄适配层，不是第二套视觉真相源。
所有值仍来自根目录 `tokens/tokens.json`；`src/styles/gary-ui.css` 只导入核心 CSS 并映射
shadcn/Tailwind 语义变量。

## 当前吸纳范围

- `Button`
- `Card`
- `SolidPlate`
- `Chip`
- `EvidenceBar`

其余 10 个组件继续直接使用核心 HTML/CSS 契约；只有真实项目出现重复需求后才增加 React
包装，避免为“组件数量对齐”制造无使用价值的重复实现。

## 本地使用

```tsx
import "@gary-ui/react-shadcn/styles.css"
import { Button, Card, CardContent } from "@gary-ui/react-shadcn"

export function Example() {
  return (
    <main data-gary-ui-root data-gary-theme="dark">
      <Card><CardContent>唯一 token，薄适配。</CardContent></Card>
      <Button>确认</Button>
    </main>
  )
}
```

React 页面的默认场景仍复用核心层，不重写 Canvas 实现：渲染
`<div className="gary-scene" data-gary-scene-engine="dot-grid" aria-hidden />`，并在应用壳按本地固定路径加载
`assets/scenes/dot-grid.js`。运行层会监视后续挂载的 React 节点，每个 Scene 只初始化一次。

## 验证

```powershell
npm install
npm run typecheck
npm run build
```

### 最终稿证据

示例中的 import、Adapter 自身 typecheck/build 或功能可运行，都不证明消费项目已经加载样式。
实际 React 目标必须同时满足：

1. 应用真实入口 import `@gary-ui/react-shadcn/styles.css`。
2. 本轮在实际目标运行生产构建，`target-production-build` 为 pass；构建报告固定使用
   label=`target-production-build-report`、kind=`build-report`，并满足
   `contracts/build-report.schema.json`。
3. 用真实浏览器打开实际目标，读取 computed style `--gary-control-height: 44px`；
   `gary-css-loaded` 与 `gary-browser-computed-style` 均为 pass，报告固定使用
   label=`target-browser-report`、kind=`browser-report`，并满足
   `contracts/final-ui-report.schema.json`。

缺少任一项时交付状态只能写“功能骨架，未验证”，不得写最终稿、完成或 verified。
静态 HTML Proposal、截图、typecheck 和 Adapter 自身 build 不能替代实际目标生产构建与浏览器证据。

依赖版本固定在 `package.json`。禁止使用 `shadcn@latest`，禁止把 Nova 生成主题覆盖
`src/styles/gary-ui.css`。

