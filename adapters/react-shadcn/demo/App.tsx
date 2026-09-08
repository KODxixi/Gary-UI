import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Chip,
  EvidenceBar,
  SolidPlate,
  SolidPlateLabel,
  SolidPlateValue,
} from "../src"
import "../src/styles/gary-ui.css"

function App() {
  return (
    <main data-gary-ui-root className="gary-demo dark">
      <div className="gary-demo__scene" aria-hidden="true" />
      <div className="gary-demo__mask" aria-hidden="true" />

      <div className="gary-demo__content">
        <header className="gary-demo__header">
          <Chip variant="solid">Gary UI · React 19</Chip>
          <p className="gary-demo__eyebrow">证据驱动的组件适配层</p>
          <h1 className="gary-demo__title">
            让 shadcn 保留组合能力，让 Gary tokens 决定视觉。
          </h1>
          <p className="gary-demo__lead">
            Nova 只提供结构契约。按钮、卡片、数据板与状态反馈都映射到中性
            Liquid Glass、SolidPlate 和中文排版规则。
          </p>
        </header>

        <section className="gary-demo__grid" aria-label="组件示例">
          <Card material="thick">
            <CardHeader>
              <Chip tone="success">可复现</Chip>
              <CardAction>
                <Chip size="sm">Tailwind 4</Chip>
              </CardAction>
              <CardTitle>适配包完整度</CardTitle>
              <CardDescription>
                组件保留 data-slot、CVA variants 与 asChild；密集信息落在实体板，
                不制造玻璃套玻璃。
              </CardDescription>
            </CardHeader>

            <CardContent>
              <EvidenceBar
                label="组件契约"
                value={100}
                tone="success"
                detail="Button / Card / SolidPlate / Chip / EvidenceBar"
              />
              <EvidenceBar
                label="视觉 token 映射"
                value={92}
                detail="玻璃材质保持 K-only，交互色仅用于功能状态。"
              />
              <SolidPlate>
                <SolidPlateLabel>固定依赖基线</SolidPlateLabel>
                <SolidPlateValue>
                  React 19.2.7 · Tailwind 4.3.2
                </SolidPlateValue>
              </SolidPlate>
            </CardContent>

            <CardFooter>
              <Button>查看证据</Button>
              <Button variant="ghost">导出摘要</Button>
            </CardFooter>
          </Card>

          <aside className="gary-demo__stack" aria-label="实现边界">
            <SolidPlate tone="inverse" density="spacious">
              <SolidPlateLabel>视觉真相源</SolidPlateLabel>
              <SolidPlateValue>Gary Liquid Glass tokens</SolidPlateValue>
            </SolidPlate>
            <SolidPlate tone="inverse">
              <SolidPlateLabel>结构兼容</SolidPlateLabel>
              <SolidPlateValue>shadcn data-slot + CVA + Slot</SolidPlateValue>
            </SolidPlate>
            <Button variant="secondary" asChild>
              <a href="#license">查看许可说明</a>
            </Button>
          </aside>
        </section>
      </div>
    </main>
  )
}

export default App
