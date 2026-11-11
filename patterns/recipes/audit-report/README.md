# audit-report · 三栏审计配方

给「母库 / 项目 / 系统体检」这类判断型报告用的版式。规则不是审美偏好，是密度约束：

- **一条判定一行**，行高 40–48px，靠分隔线切分，不用卡片。
- **三栏按状态分区**：风险（左，带竖线，数字用 caution 色）/ 已修（中，8 条压紧，整体降一级）/ 待办（右，加本轮改动清单）。
- **扫描过程信息压成一行事实条**（micro 12px，`key value` 平铺），不占首屏、不做成大卡片。
- **关键度靠三件事**：列的位置、标题字重、状态色小标记。不靠字号放大。
- 参考密度：15 条判定 + 3 条验收线 + 8 项改动 ≈ 470px 面板高（三栏等高）；<880px 塌成单列。
- 只用 `--gary-*` token；全页黑白灰，状态色只出现在数字与标记上。

## 硬规则

- **三栏是默认，两栏禁止**（DESIGN §7「密度与栏数」）。`.board` 必须是三轨，
  允许不等分（本配方 `1fr 1.34fr .94fr`，宽度按信息量分配），但不得写成两轨。
  窄屏 <880px 塌成单列是唯一例外。
  这条已经进 `agent/checks/invariants.py`：解析 `grid-template-columns` 的真实轨道数并展开 `repeat(n, …)`，
  两轨直接红；行内样式同样在射程内。
- **富文本走 `.gary-prose`**（DESIGN §6.1）：主判断 18/500、正文 16/400、注脚 13/400。
  富文本里不许临时写字号、字重、颜色；每段 ≤72 中文字符。
- **字号下限 micro 12px**（`--gary-font-size-micro`）：栏头与次级数字用它，正文 13 / 标签 14 / 正文段 16。
  低于 12px 的字面量会让 `font_floor` 变红。

## 结构约束（踩过的坑）

1. **页根材质别写 `solid-plate`**：母库有一条兼容规则会把 `[data-gary-material="solid-plate"]` 下所有
   `data-gary-material="glass"` 子元素强制改回实底板。要玻璃就把根设为 `regular`，子面板单独标 `glass`。
2. **body 不能写底色**：`.pattern-scene` 是 `z-index: -2` 的固定层，body 画一层不透明底色会把它整块盖掉，
   点阵只剩公式没有像素。底色由 `html` 与 Scene 负责，`scene_visible` 会红。
3. **几何交给组件**：面板用 `.gary-glass-card`，圆角、内边距、分层描边都从组件来，页面不写
   `border` / `box-shadow` / `border-radius`。手写会压掉共享材质的四边描边。
4. **内边距 ≥ 圆角的一半**：加载 `radius.js` 后本配方三栏圆角 14 / 19 / 14px，内边距 18px；
   若不用脚本，token 的 6cqi 在 360px 宽的栏里仍是 22px，18px 内边距刚好够。
5. **改成面板后要清掉旧的栏线规则**：`.col { padding: 0 16px }`、`.col:first-child { padding-left: 0 }`
   这类为裸排写的样式会覆盖面板内边距，第一列尤其明显（标题贴到边上）。

## 分块对齐

1. **三栏等高**：`.board` 用 `align-items: stretch`，面板 `display: flex; flex-direction: column`；
   行数少的栏把富余摊成均匀行距（`justify-content: space-between`），不要在面板底部堆一块空白。
   允许 `space-between` 本身，禁止的是同一栏里混用两三种间距。
2. **底部区块复用同一套列轨道**：富文本带用与看板相同的 `1fr 1.34fr .94fr` 与同一 `gap`，
   口径卡自然落在第三栏的左右边缘上；正文左内边距取 `calc(面内边距 + 1px)`，与栏头同一条竖线。
3. **页脚对齐到同一行**：各栏末尾的说明行统一 13px、落在同一 y 上。
4. **一个栏一个节奏**：同一栏内行距恒定；跨栏允许不同（8 条与 4 条的信息量不同）。
5. **扫描过程信息不要放大**：事实条与口径卡用 micro，主判断才用 lead。

## 机器参数

见同目录 `profile.json`（3 × 4 组合为 `scroll-report × data-page`，dark / regular / compact）。
