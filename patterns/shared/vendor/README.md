# vendor/morphicons

[morphicons](https://github.com/guillermolg00/morphicons) 1.7.1（MIT © Guillermo）的官方构建产物，本机离线 vender，作为 Gary-UI 默认图标机制（`patterns/shared/morph-icons-entry.mjs`）的 morph 引擎。

本目录只 vender morph 引擎；morph 的几何数据由 Gary-UI 侧的打包入口决定，当前 vanilla 静态层与 morph 仍取 Lucide 几何。React 组件层的图标来源为 reicon-react，由适配层按依赖引入，不经过本目录。

## 内容

- `index.js` + `normalize-*.js` + `spring-*.js`：纯函数 core（parse → normalize → resample → Procrustes 匹配/对齐 → polar 插值 → serialize）
- `dom.js`：`createMorph(el, icon, options)` 驱动（PathEl 仅需 `setAttribute`）+ `canonicalD`
- `element.js` + `controller-*.js`：`<morph-icon>` 自定义元素（第五绑定，可选；`defineMorphIcon()`）
- `adapters.js`：格式适配器（`svgToIcon` / `maskTarget` / `canvasTarget`，可选）
- `react.js` / `vue.js` / `svelte.js` / `react-native.js` / `MorphIcon.svelte` / `MorphIcon.astro`：框架绑定（Gary-UI 当前不使用，保留完整性）
- `*.d.ts`、`LICENSE`、`README.upstream.md`：类型、许可与上游文档

## 更新

上游发布新版本时：`npm pack morphicons@<version>` 解包后整体替换本目录 `dist/*`，核对 `morph-icons-entry.mjs` 的导入名（core/dom 导出是否变化），重跑 `node scripts/morph_icons_qa.mjs` 与 `node scripts/build_demo_assets.mjs`。

## 许可

本目录内容遵循上游 MIT 许可（见 `LICENSE`）；Gary-UI 整体第三方声明见根目录 `THIRD_PARTY_NOTICES.md`。
