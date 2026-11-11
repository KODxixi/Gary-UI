# 移交：flow-diagram 流程图规范与实现

> 把本文件整段复制给新会话，即可接手。所有路径都是绝对路径，命令在 `C:\AI\UI\gary-ui` 下执行。

## 0. 你接手的是什么

Gary-UI 母本（`C:\AI\UI\gary-ui`）里的一套**过程型流程图规范**：一组动作按先后穿过若干阶段（workflow / sequence / data-flow）。它逆向测量 Arize Phoenix 空状态图（620×290 手写 SVG）的真实属性得出，不是目测。

规范已定稿，机器闸和生成器都在。**接下来是打磨，不是重新设计。改之前先读懂它为什么这么定。**
**触发语**：用户说「Gary-UI流程图」时直接按本规范执行；报告页走 `--report`，不要重新选型。

## 1. 先读这四份（按顺序）

```
C:\AI\UI\gary-ui\docs\FLOW_DIAGRAM.md           规范正文（定稿，不是讨论稿）
C:\AI\UI\gary-ui\spec\flow-diagram.json          机器源，所有数值的唯一出处
C:\AI\UI\gary-ui\scripts\check_flow_diagram.py   机器闸（样式 7 项 + 几何 3 项）
C:\AI\UI\gary-ui\scripts\flow_svg.py             生成器（FlowDiagram 手写图元 + FlowGraph 自动布局）
```

读完再扫一眼母本 `C:\AI\UI\gary-ui\docs\DIAGRAM_EXPRESSION.md` 的 §3.5 / §4 / §6——本规范只改三条，其余全部继承。

现成定稿样例（直接看，不要再用 scratch 里的临时图）：

```
C:\AI\UI\gary-ui\examples\flow\hermes-session.json   16 节点 / 19 边 / 6 阶段
C:\AI\UI\gary-ui\examples\flow\hermes-session.svg
C:\AI\UI\gary-ui\examples\flow\hermes-session.html  03 定稿页，可点击节点看详情
```

```bash
cd C:/AI/UI/gary-ui
python scripts/flow_svg.py --input examples/flow/hermes-session.json --palette gary --tokens --report --html examples/flow/hermes-session.html --css ../../tokens/base.css examples/flow/hermes-session.svg
```

## 2. 三条「反母本」决定（不要改回去）

母本 `DIAGRAM_EXPRESSION.md` 是通用图示规范；本条线在三处**有意不同**。理由同时写在 `spec/flow-diagram.json` 的 `authority.overrides` / `whyOverride` 里。

1. **虚线 = 非主路径**（辅助输入 / 异步回报 / 跨相位引用），不是「未成立」。
   - 母本 §3.5：线型管成立性，虚线 = 规划 / 外部 / 待接入 / 已废弃。
   - 为什么：过程图的读者问「下一步是谁」，不问「这一侧成立吗」。把辅助输入画成虚线，读者会读成缺口，并据此做资源安排。
   - 改回去会怎样：每一条「参数送进判定」都会被读成「还没接上」，图开始撒谎。

2. **连线一律中性灰**（gray500 实 / gray400 虚），不取目标节点色。
   - 母本 §4：连线取目标节点分组色。
   - 为什么：角色色已经用在描边；边再上色，两条彩色线交叠时读者分不清哪条是主路径。中性灰把唯一带彩的判断留给节点。
   - 改回去会怎样：主路径淹没在彩色边里；四色封顶也守不住——节点一套色、边一套色，实际颜色翻倍。

3. **卡片只染描边，填充只用灰阶/玻璃**（独立图页 gray100；报告页玻璃 `--gary-card-surface-top`）。
   - 母本 §4：卡片填充 20% 角色色。
   - 为什么：填充掺色会让相邻卡片在缩略图里糊掉；描边染色在 8px 高度仍可分。
   - 改回去会怎样：缩略图 / 远看时相邻卡片糊成一片，卡片 / 子帧 / 条目三层立刻分不出来。

**配色是实测的，不是审美选的。不要重新配一版。**

## 3. 现在已经做完的（不要重做）

- **五层结构**：分块（1px 虚线）→ 子帧（1px 实线 + gray75）→ 卡片（2px 实线 + gray100；报告页玻璃 `--gary-card-surface-top` + 落影）→ 条目（无描边 + gray200 + rx4）→ 胶囊（2px 实线 + rx=h/2；报告页 h=54，名称 + 摘要两行）。
- **四角色色 + 两个深一档变体（phoenix）**：input `#e67e22` / process `#2196f3`（alt `#1976d2`）/ decision `#9c27b0`（alt `#7b1fa2`）/ result `#ffbf00`。
- **gary 四基色 token**：`--gary-category-1..4`，dark/light 同 `spec/chart-recipes.json`；alt 深一档尚未定值。
- **字号只有 14 / 12 / 11（SVG 内）**；报告页 HTML 详情卡用 13 / 14 / 16。**圆角只有 8 / 4 / h÷2（SVG 内）**；详情卡 HTML 12px。
- **端点水滴箭头**：`13×13`、`refX 11.2` / `refY 6`、路径 `M7.28 3.29 A3.3 3.3 0 1 0 7.28 8.71 L11.2 6 Z`；主路径亮白、旁支灰，实/虚/主/旁各一套 marker。圆背收线，尖头贴框边。
- **线**：实线 2px、虚线 1.5px + `dasharray 4 3`；实 / 虚各一个 marker，虚线的 fill 更灰。
- **正交折线**：直角拐点、半径 0，禁贝塞尔。
- **生成器**：`FlowGraph` 从 `stages / nodes / edges` JSON 出图，固定网格 + 正交 A*；`row` 按阶段内部从 0 起算，阶段块顶部对齐，单节点阶段自然成短块；真实样例 16 节点 / 19 边。
- **报告页呈现（03 定稿）**：`--report` 把阶段框退成中性实线、阶段标题 14/500、卡片宽度按最长标签自适应 120–260、玻璃卡填充 + 柔和落影、每个节点名称+摘要+点击详情、端点水滴 13×13、主路径用 `emphasis` 提亮、旁支 52% 不透明、删眉标/图例、页面垂直居中；窄预览窗 min-width=0.85×图宽，宁可横向滚动也不压字号。`examples/flow/compare/` 保留 01/02/03 决策历史。
- **闸**：样式 7 项 + 几何 3 项；`--self-test` 7/7；真实样例 87 个元素全过；样例 HTML 过 `agent/checks/invariants.py --page` 与 skill 的 `verify_preview_page.py`。

验收命令（必须全绿才算改完）：

```bash
cd C:/AI/UI/gary-ui
python scripts/check_flow_diagram.py --self-test          # 必须 7/7 抓红
python scripts/check_flow_diagram.py <改后的.svg|.html>   # 必须 OK
python -B agent/checks/invariants.py                      # 母本不变量
```

## 4. 五项打磨（1–3、5 已完成，4 待补）

### 4.1 生成器已从样例变成库（已完成）

`scripts/flow_svg.py` 现在有两层：

- `FlowDiagram`：基本图元，仍可手写坐标。
- `FlowGraph`：输入节点表 / 边表，固定尺寸网格 + 正交 A* 路由。节点按 `stage / row` 放入固定单元，报告页卡片宽度按整图最长标签自适应 120–260，长标签 14→12 降档，仍放不下才截断（禁止按字符数截断）；连线在节点与分块之间找通道，A* 带拐点代价和「已用线段」重叠代价。

最小 API 就是移交文档里要求的那份：`stages[]` + `nodes[{id, role, title, sub, detail, kind, stage, row}]` + `edges[{from, to, kind, emphasis, from_offset, to_offset}]`。`sub` / `detail` 在报告页是**必填**，`report_graph` 缺一个直接报错；坐标由布局器算，调用方不填。

**仍存在的边界**：A* 只避节点与分块，不做全局边交叉最小化；多条边汇入同一侧端口时，最后 10px 会重合（规范要求落点取边中点，这是固有代价）。40 节点合成图（8 阶段 × 5 行）已过闸；真实业务 40+ 未压。

验收：`examples/flow/hermes-session.json`（16 节点 / 19 边）零手写坐标生成 SVG，闸 OK，无 rect 重叠。

### 4.2 真实场景压力测试（已完成一例）

已用 Hermes 一次会话执行流压过：`examples/flow/hermes-session.json`，16 节点、19 条边，含辅助输入、重试回路、异步写回三类虚线。生成物：

```
examples/flow/hermes-session.svg
examples/flow/hermes-session.html
```

已过：`check_flow_diagram.py`（87 元素）、`invariants.py --page`、skill 的 `verify_preview_page.py`。人读结论：虚线语义成立，阶段块没有「内容只占一半」的空洞；16 个节点都有名称 + 摘要 + 点击详情。

**还没压的**：DDS 投拓流程、真实业务 40+、同一阶段 4 行以上。下一轮可以拿 DDS 再压一遍。长标签已单独压过一版（5 阶段 8 节点，`DNS 公网解析`、`archos core-flow`、`Console legacy 视图`、`PostgreSQL 主库` 全完整）。

### 4.3 gary 变体（已完成基色，alt 未定值）

`tokens/tokens.json` 已新增 `--gary-category-1..4`（dark/light 值同步 `spec/chart-recipes.json`），并跑过 `npm run tokens:generate`。`flow_svg.py` 支持：

```bash
python scripts/flow_svg.py --input <json> --palette gary --tokens --html <page.html>
```

输出 `var(--gary-*)`，预览页 0 hex / 0 host vars，过 `verify_preview_page.py`。母本闸 `invariants.py --page` 也过。

**仍未做**：`process2 / decide2` 的「深一档」没有定值。现在 gary 变体只提供 `input / process / decision / result` 四基色，代码遇到 `process2` 会明确报错，不静默取同色。要补 alt，先定两个深色值并加 token，别在代码里现算。

### 4.4 闸的边界：虚线语义仍判不了（还差回归 corpus）

`scripts/check_flow_diagram.py` 现在只判「可机检的样式与几何」。明确不判：

- **虚线语义是否成立**：一条虚线读起来对不对（辅助输入 / 异步回报 / 跨相位引用），机器判不了，必须人读。
- **连线穿过卡片/胶囊**：现在已判——2px 描边的 rect 与线段内部相交即红；起点/终点落在边缘算合法（落点取边中点）。**仍不判**穿过 1px 分块/子帧、以及穿过无描边的条目。

顺带三个实现边界，别当成已覆盖：

- marker 只检查每条 line/polyline 有一个 `marker-end`，没要求实 / 虚各一个，也没校验 `refX / refY` 关系。
- 出 viewBox 只检查 rect；text / polyline 越界抓不到。
- 颜色只按标签判，一个角色色的 `<line>` 也能过——「连线必须中性灰」目前靠人守。

改闸的前提：**先补回归 corpus**。现在有 `scripts/fixtures/flow-diagram/stress-40.svg`（40 节点正例）和 `--self-test` 的 7 类负例；Phoenix 原图仍未入仓，「30 元素全过」是历史记录，无法复现。动判据前先把 Phoenix 原图存成 fixture，再跑 stress-40 + `examples/flow/hermes-session.svg`，否则收紧一条就可能误杀合法图。

### 4.5 既有图示管线（已决定不接）

`adapters/visual/capabilities.json` 的路由保持 `workflow / sequence / data-flow / lifecycle → archify`，`simple-flow → mermaid`；flow-diagram **不塞进去**。文件末尾新增了：

```json
"standalone": {
  "flow-diagram": {
    "routed": false,
    "entry": "scripts/flow_svg.py",
    "spec": "spec/flow-diagram.json",
    "gate": "scripts/check_flow_diagram.py",
    "reason": "同角色同尺寸 + 固定基线节奏 + 正交零半径拐点；archify / mermaid 的自动布局会按文字撑框、按算法选拐点，只能视觉近似。"
  }
}
```

理由：两者都是自动布局，满足不了固定尺寸与基线节奏；强行接会得到「视觉近似」而不是合规图。若以后要接导出链，写适配器把 `flow_svg.py` 的 SVG 喂给 `adapters/visual/runtime/runner.cjs`，不要让 archify 重排坐标。

## 5. 纪律

- **改数值只改 `spec/flow-diagram.json`。** 文档与代码引用它，不要在多处各写一遍。
  - 现实是 `flow_svg.py` 顶部还有一份常量镜像（`ROLE` / 灰阶 / 尺寸），注释写着「改这里也要改那里」。更彻底的做法是运行时读 JSON；在没改之前，动数值必须两处同步，别漏。
- **改完必须跑闸，且要能证明闸会红**：`--self-test` 必须 7/7；只看到全绿不算证据。
- **不要为了过闸把图里的字号放大。** SVG 内文字是图形标记，随图缩放，不受页面 13px 下限约束；同一页里的 HTML 文案必须 ≥13px。这条边界写在 `FLOW_DIAGRAM.md` §4「字号下限的边界」。
  - Phoenix 原图 11px 副标题在 620×290 画布上是对的；改成 13px 会让副标题挤爆卡片。为了绿灯放大字号，是拿比例换合规。
- **不要重新推导配色。** 所有颜色都是实测来的。
- **分块（1px 虚）与子帧（1px 实）不能合并。** 容器里只有条目、没有子帧，内容会只占一半高度——实测样例就栽在这里。
- **不要给母本 `git init`。** `C:\AI\UI` 被 `C:\AI\.gitignore` 第 42 行 `/UI/` 排除，母本无独立 .git，这是有意的。
- **交付 HTML 用预览窗**：`desktop_preview(action="open", url=<绝对路径>)`，不要在聊天里写 `::preview`。
- **登记已经做完，不要重复加**：`spec/system.json`（authorities）、`AGENTS.md` 第 45 / 65 行两处、`library-consumption.json`（read 已含 `scripts/flow_svg.py`）、`CHANGELOG.md` 都已登记 `flowDiagram`。改规范内容只更新 `CHANGELOG.md`。

## 6. 做完什么样算完

- ✅ 生成器能从 JSON 出 ≥15 节点图，零手写坐标，闸 OK。
- ✅ 真实场景图（16 节点）过闸，且人读虚线语义通过。
- ✅ `palette='gary'` 可用；嵌进 Gary-UI 页时颜色来源走 `--gary-category-*` token。
- ✅ 闸的边界写进文档；卡/胶囊穿线已判，分块/子帧穿线仍不判。
- ✅ 每个节点有 `sub` 摘要；报告页每个节点有 `detail`，点击节点弹详情卡。
- ✅ `capabilities.json` 对「接不接管线」有明确结论：`standalone.flow-diagram.routed = false`。
