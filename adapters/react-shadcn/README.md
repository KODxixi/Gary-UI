# Gary-UI React/shadcn Adapter

Gary-UI 对 React 19、Tailwind CSS 4 与 shadcn/ui 的执行层。设计系统真源在根目录 `tokens/tokens.json`；本适配器只做薄映射——所有值通过 `src/styles/gary-ui.css` 的 `@theme inline` + `:root` 双份声明指向 Gary token，不另立视觉真相。

## 快速上手

```tsx
import "@gary-ui/react-shadcn/styles.css"
import { Button, Card, CardContent, Dialog, DialogContent } from "@gary-ui/react-shadcn"
import { useSpringStyle } from "@gary-ui/react-shadcn/lib"

export function Example() {
  return (
    <main data-gary-ui-root data-gary-theme="dark">
      <Card>
        <CardContent>唯一 token，薄适配。</CardContent>
      </Card>
      <Button>确认</Button>
    </main>
  )
}
```

### Dialog + Spring（Gary-UI 的灵魂）

浮层入场不用 CSS transition，用 `useSpringStyle`——弹簧物理驱动，可中断，从当前值续跑：

```tsx
import { useRef, useState } from "react"
import { Dialog, DialogContent, Button, useSpringStyle } from "@gary-ui/react-shadcn"

export function Example() {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Slow 层级：Dialog content materialize
  useSpringStyle(contentRef, open, {
    response: 0.35,
    damping: 1.0,
    openValue: 1,
    closedValue: 0.96,
    styleProp: "transform",
    format: (v) => `scale(${v})`,
    initialStyle: { opacity: 0.96, transform: "scale(0.96)" },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button>打开对话框</Button>
      <DialogContent ref={contentRef}>
        玻璃面板从 0.96 弹到 1，带过冲，停稳。
      </DialogContent>
    </Dialog>
  )
}
```

### shadcn CLI 拉组件

```bash
# 用 registry.json 拉单个组件到你的项目
npx shadcn@latest add https://raw.githubusercontent.com/KODxixi/Gary-UI/main/adapters/react-shadcn/registry.json --override
```

## 组件清单（59 个）

### 基础
`button` · `button-group` · `card` · `chip` · `solid-plate` · `evidence-bar` · `separator` · `skeleton` · `spinner` · `switch` · `kbd`

### 表单
`input` · `input-group` · `input-otp` · `label` · `form` · `field` · `checkbox` · `radio-group` · `select` · `slider` · `textarea`

### 浮层与导航
`dialog` · `alert-dialog` · `drawer` · `sheet` · `popover` · `tooltip` · `hover-card` · `dropdown-menu` · `context-menu` · `menubar` · `navigation-menu` · `command` · `toast` · `sonner`

### 布局与数据
`table` · `data-table` · `tabs` · `accordion` · `collapsible` · `carousel` · `resizable` · `scroll-area` · `sidebar` · `pagination` · `aspect-ratio` · `empty-state`

### 展示
`alert` · `avatar` · `breadcrumb` · `chart` · `calendar` · `date-picker` · `typography`

## Spring 物理动效层

三个 hook，半隐式欧拉积分，rAF 驱动，直接写 DOM style，无 React re-render，可中断（target 切换时从当前值+速度续跑，不跳帧）：

| Hook | 用途 |
|---|---|
| `useSpring(target, { response, damping })` | 返回 ref，弹簧数值动画 |
| `useGestureValue(elRef, callbacks)` | Pointer Events + velocity history + momentum projection |
| `useSpringStyle(elRef, open, config)` | 弹簧驱动 CSS 属性（opacity/transform），浮层入场 |

Spring 参数按层级推导：

| 层级 | response | damping | 用途 |
|---|---|---|---|
| Fast | 0.2s | 1.0 | Dropdown / Popover / Tooltip |
| Medium | 0.3s | 1.0 | Dialog / Drawer overlay / Toast |
| Slow | 0.35s | 1.0 | Dialog content materialize |
| Momentum | 0.3s | 0.8 | Sheet / Drawer slide（带过冲） |

## 设计 Token

161 个 `--gary-*` 变量，由 `tokens/tokens.json` 自动生成：

- **颜色**：`--gary-bg` · `--gary-text` · `--gary-accent` · `--gary-critical` 等
- **材质**：`--gary-glass` · `--gary-glass-light` · `--gary-edge` · `--gary-blur`
- **字阶**：`--gary-text-display` (48px) → `--gary-text-caption` (12px)，9 级
- **间距**：`--gary-space-1..9` = 4/8/12/16/20/24/32/48/64px
- **圆角**：`--gary-radius` = 30px · `--gary-radius-sm` = 18px
- **Elevation**：`--gary-elevation-0..5`，box-shadow 组合
- **Z-Index**：`--gary-z-base/nav/dropdown/modal/toast` = 0/100/200/300/400
- **断点**：sm 390 / md 768 / lg 1100 / xl 1440px

修改 token：改 `tokens/tokens.json` → `npm run tokens:generate`。

## 本地开发

```powershell
cd adapters/react-shadcn
npm install
npm run typecheck      # tsc --noEmit
npm run build          # tsc -p tsconfig.build.json
npm run tokens:generate # 从 tokens.json 投影 CSS
npm run audit:ui       # 审计伪元素/token 映射/契约一致性
npm run audit:contrast # 对比度审计
```

## 最终稿证据

示例中的 import、adapter 自身 typecheck/build 不证明消费项目已加载样式。实际 React 目标必须同时满足：

1. 应用真实入口 import `@gary-ui/react-shadcn/styles.css`
2. 本轮在实际目标运行生产构建，`target-production-build` 为 pass
3. 用真实浏览器打开实际目标，读取 computed style `--gary-control-height: 44px`

缺少任一项时交付状态只能写"功能骨架，未验证"。

## 约束

- 依赖版本固定在 `package.json`，禁止 `shadcn@latest`
- 禁止用 Nova 生成主题覆盖 `src/styles/gary-ui.css`
- 修改 token 必须先改 `tokens/tokens.json`，再跑 `tokens:generate`
- 新组件必须登记 `components/index.json`
