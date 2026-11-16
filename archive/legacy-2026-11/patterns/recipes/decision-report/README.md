# Gary-UI 决策报告配方

这是已确认的 Liquid Glass 决策报告展示逻辑的通用化版本，只沉淀版式、材质和交互，
不包含任何具体项目数据。

## 视觉路由

```json
{
  "schemaVersion": 1,
  "skill": "gary-liquidglass-ui",
  "application": "scroll-report",
  "page": "data-page",
  "theme": "dark",
  "material": "regular",
  "density": "balanced"
}
```

每个实际报告单元仍按内容选择 `report-cover`、`image-page`、`data-page` 或 `manual-toc`；
本配方不增加第五种页面模式。

## 固定结构

1. 顶部居中 UltraThin 导航，提供章节、来源、阅读和演示切换。
2. 阅读模式连续滚动；演示模式使用同一内容源和 16:9 画布，不生成两套正文。
3. 每页左侧为主要图、表或分析图，右侧为 Thick 判断卡，底部为 SolidPlate 结论条。
4. 每页必须同时包含具体问题、真实结论、主要证据、决策影响或行动。
5. 普通缺口不占正文页；来源与程序字段进入来源抽屉或证据工作包。

## 材质规则

- 主要分析卡、流程节点和判断卡使用 Gary 玻璃材质，不使用不透明黑色实体卡。
- 表格、参数行、字幕、来源行和结论条使用 SolidPlate。
- 页面只有一个 `gary-scene` 和一个全局遮罩；不要给整段内容再套一层 backdrop blur。
- 图表与分析图可以自行实现，但必须消费 Gary tokens，不能引入第二套色板和圆角。

## 决策报告纹理

深色 `scroll-report` 使用静态 `b-ridge-current` 磁性流线纹理作为 Scene 的背景层，
不新增第二个 Scene 或全局遮罩。批准参数为：强度 `10%`、密度 `200 条/1000px`、
扰动 `10%`、曲率 `105%`、线宽 `0.55px`。纹理是一张连续长 SVG，禁止动画、
禁止 CSS 重复平铺；消费端可覆盖 `--decision-report-texture-image`，但不得把该纹理提升为
全局玻璃材质 token。

## 复用步骤

1. 从 `index.html` 复制页面骨架，保留 `data-gary-*` 路由属性和稳定节点 ID。
2. 用真实项目的图、表、分析图替换示例区；删除所有配方说明文字。
3. 把来源条目接到项目的可追溯来源登记，不把来源 ID 直接铺进客户正文。
4. 保留 `decision-report.js` 的阅读、演示、章节和来源抽屉行为；业务数据渲染可另行接入。
5. 在真实浏览器检查目标入口已加载 `tokens/base.css`，并验证桌面、390px、键盘与打印。

示例中的条形长度和说明文字只用于展示排版，不得作为项目数据复用。

## 离线分发契约

- `shell.html`：不含项目数据的语义骨架，由消费项目填充品牌、章节、页面与来源。
- `decision-report.bundle.css`：包含该配方所需的 Gary token 回退值、材质与布局，不使用
  `@import`、图片地址或网络资源。
- `decision-report.bundle.js`：只提供 `GaryDecisionReport.mount(root, options)` 通用控制器，
  不读取或渲染业务数据。
- `profile.json`：固定三个分发文件的 SHA-256 与组合 hash；消费端应在内联前校验。

示例入口 `index.html` 继续用于浏览 canonical 视觉基线；分发文件是面向消费端的稳定、
可内联边界，两者不得携带消费项目的字段枚举、判定规则或数据模型。

使用 `approved-template-origin` 集成的消费项目，以配方获批时的原始自包含模板作为
渲染入口，并用 `origin.templateSha256` 逐字节锁定；这不是运行时拼装三个分发文件。
