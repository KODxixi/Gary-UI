# flow-diagram fixtures

- `stress-40.svg`：8 阶段 × 5 行、40 节点的合成网格，用 `FlowGraph` 生成；183 个元素全过闸。用途是压 A* 路由与几何闸，不是业务样例。
- 负例由 `python scripts/check_flow_diagram.py --self-test` 内联生成，当前覆盖 7 类：rx=12、彩色 fill、彩色 stroke、13px、贝塞尔曲线、连线穿卡、缺 marker-end。
- Phoenix 原图没有入仓（当时是从本地 Phoenix 页面抓的 outerHTML），「30 元素全过」是历史记录。要收紧判据，先把原图存成 fixture，再跑本目录的 stress-40 和 `examples/flow/hermes-session.svg`，避免误杀。
