/**
 * Renderer · content.json -> single-file HTML
 *
 *   node agent/render.mjs <content.json> -o <out.html>
 *
 * Flow: meta.recipe selects a recipe -> blocks[] -> React tree ->
 * renderToStaticMarkup -> inline reset.css + astryx.css + generated theme CSS.
 * Output has zero <script> and zero external links; double-click to open.
 *
 * Contract: `agent/content.schema.md` (v1) — { meta: { recipe, title, ... }, blocks: [{ id, type, props }] }
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme, generateThemeCSS } from '@astryxdesign/core';
import { garyTheme } from '../theme/gary.theme.mjs';
import * as reportRecipe from './recipes/report.recipe.mjs';
import * as tableRecipe from './recipes/table.recipe.mjs';
import * as dashboardRecipe from './recipes/dashboard.recipe.mjs';
import * as landingRecipe from './recipes/landing.recipe.mjs';
console.warn('[deprecated] agent/render.mjs 已弃用：产物 5–6 倍大、不进 build 不进闸。出新页用 node mwg/render.mjs（见 agent/CONTRACT.md）。');

const RECIPES = {
  [reportRecipe.id]: reportRecipe,
  [tableRecipe.id]: tableRecipe,
  [dashboardRecipe.id]: dashboardRecipe,
  [landingRecipe.id]: landingRecipe,
};

const LAYER_ORDER = '@layer reset, astryx-base, astryx-theme;';

function resolveCss(pkgExport) {
  return fileURLToPath(import.meta.resolve(pkgExport));
}

function buildThemeCss() {
  const { component, prose } = generateThemeCSS(garyTheme);
  const parts = [LAYER_ORDER];
  // The theme's own component adaptations also carry a `box-shadow: none`
  // (segmented-control selected state); it goes through the same flattener so
  // the file is uniformly shadow-free.
  if (component) parts.push(`@layer astryx-theme {\n${flattenElevation(component)}\n}`);
  if (prose) parts.push(`@layer reset {\n${prose}\n}`);
  return parts.join('\n');
}

/**
 * Flatten the component CSS: no block may be lifted off the paper.
 *
 * Astryx hard-codes elevation into component classes (`box-shadow:var(--shadow-low)`
 * on Card, the composite `--_card-ring/--_card-elevation` pair, hover lifts on
 * buttons, press paint, travel paint). Overriding the `--shadow-*` tokens is not
 * enough — the declaration is still there, and a component that passes
 * `elevation: "low"` re-points its own local variable. So the declarations are
 * removed from the inlined sheet itself.
 *
 * Two exceptions are re-expressed rather than dropped:
 *   - `inset 0 0 0 <n>px <color>` is a hairline ring (input focus, selected
 *     state), not elevation. It becomes `outline` + negative offset: same 1–2px
 *     line in the same place, and it survives an `overflow:hidden` ancestor.
 *   - everything else (elevation, press/travel paint, segmented separators) is
 *     a painted shadow and is dropped. Keyboard focus stays visible through the
 *     global `:focus-visible` rule below.
 */
function flattenElevation(css) {
  return (
    css
      // 1. uniform inset ring -> outline (hairline, kept)
      .replace(
        /box-shadow\s*:\s*inset 0 0 0 (\d+(?:\.\d+)?px)\s+([^;}]+)(?=[;}])/g,
        (_m, w, color) => `outline:${w} solid ${color};outline-offset:-${w}`
      )
      // 2. every remaining box-shadow is elevation or paint -> remove the
      //    declaration, leaving the rest of the rule untouched
      .replace(/box-shadow\s*:[^;}]*/g, '')
      // 3. `transition-property:…,box-shadow,…` now names a property that no
      //    longer exists on this page
      .replace(/transition-property:([^;}]+)/g, (_m, list) => {
        const kept = list
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && s !== 'box-shadow');
        return `transition-property:${kept.length ? kept.join(',') : 'none'}`;
      })
  );
}

function inlineCss() {
  const files = [
    resolveCss('@astryxdesign/core/reset.css'),
    resolveCss('@astryxdesign/core/astryx.css'),
  ];
  const reset = fs.readFileSync(files[0], 'utf8');
  const astryx = flattenElevation(fs.readFileSync(files[1], 'utf8'));
  // Defensive: break early if the CSS itself contains </style
  const safe = (css) => css.replace(/<\/style/gi, '<\\/style');
  // ponytail: Astryx 给表格滚动容器设的是 overflow-x: clip —— clip 谁都滑不动，
  // 窄屏下右侧列直接不可达（实测 375px 时 client=285 / 内容=720，永久丢失）。
  // 换成 auto 即恢复滑动。覆盖一行胜过 fork 整个组件。
  const overrides = [
    '.astryx-table-scroll-wrapper{overflow-x:auto}',
    // KPI 栅格是行内 1.35fr+repeat(n,1fr)，行内样式无法写媒体查询，
    // 375 下每列被挤到 60px 并裁字。这里用 !important 覆盖成会塌的栅格。
    '@media (max-width:720px){[data-gary="kpi"]{grid-template-columns:repeat(2,minmax(0,1fr))!important}',
    '[data-gary="kpi"]>*:first-child{grid-column:1/-1}}',
    '@media (max-width:480px){[data-gary="kpi"]{grid-template-columns:1fr!important}}',
  ].join('\n');
  return [safe(reset), safe(astryx), overrides, safe(buildThemeCss())].join('\n');
}

function parseArgs(argv) {
  const input = argv[0];
  const oi = argv.indexOf('-o');
  const output = oi >= 0 ? argv[oi + 1] : null;
  const ti = argv.indexOf('--theme');
  const theme = ti >= 0 ? argv[ti + 1] : null;
  if (!input || !output) {
    console.error('用法: node agent/render.mjs <content.json> -o <out.html> [--theme light|dark]');
    process.exit(2);
  }
  return { input, output, theme };
}

/** contract key is meta.recipe; content.type kept as a one-line compat fallback. */
function recipeIdOf(content) {
  return content.meta?.recipe ?? content.type;
}

/** contract key is blocks; content.sections kept as a compat fallback. */
function blocksOf(content) {
  const raw = Array.isArray(content.blocks)
    ? content.blocks
    : Array.isArray(content.sections)
      ? content.sections
      : [];
  return raw.map((b, i) => ({
    id: b.id || `b${i}`,
    type: b.type,
    // 块级 tone 以前在这里被整块丢掉：MWG 轨读 block.tone 生效，Astryx 轨读 props.tone
    // 永远读不到，同一份内容两轨出两种材质。落进 props，props 里写的再覆盖它。
    props: { ...(b.tone ? { tone: b.tone } : {}), ...(b.props || {}) },
  }));
}

function main() {
  const { input, output, theme: themeArg } = parseArgs(process.argv.slice(2));
  const content = JSON.parse(fs.readFileSync(input, 'utf8'));

  const recipeId = recipeIdOf(content);
  const recipe = RECIPES[recipeId];
  if (!recipe) {
    throw new Error(
      `未知配方 recipe="${recipeId}"，可用: ${Object.keys(RECIPES).join(', ')}` +
        (content.meta?.recipe === undefined && content.type === undefined
          ? '（content.json 缺少 meta.recipe）'
          : '')
    );
  }

  const blocks = blocksOf(content);
  if (blocks.length === 0) {
    throw new Error('content.json 缺少 blocks[]，无法渲染');
  }
  const missingTypes = blocks.filter((b) => !b.type);
  if (missingTypes.length > 0) {
    throw new Error(
      `blocks[] 中存在缺少 type 的区块: ${missingTypes.map((b) => b.id).join(', ')}`
    );
  }

  const meta = content.meta || {};
  const mode = themeArg === 'dark' || themeArg === 'light' ? themeArg : meta.theme === 'dark' ? 'dark' : 'light';
  const lang = meta.lang || 'zh-CN';
  const title = meta.title || content.title || 'Gary-UI';

  const normalized = { ...content, meta: { ...meta, recipe: recipeId }, blocks };

  const page = h(
    Theme,
    { theme: garyTheme, mode },
    h(
      'div',
      {
        style: {
          maxWidth: 1120,
          margin: '0 auto',
          padding: '48px 32px 72px',
        },
      },
      recipe.render(normalized)
    )
  );
  const body = renderToStaticMarkup(page);

  const html = `<!doctype html>
<html lang="${escapeHtml(lang)}" data-astryx-theme="gary" data-theme="${mode}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
/* ---- MWG visual base (2026-11-18) -----------------------------------------
   Renderer-level rules, never content-level: warm paper page (token), one
   sans stack (token), zero elevation (token + stripped component CSS),
   tabular figures everywhere a number can appear, and modern wrapping.
   Nothing here invents a colour or a size — those stay in
   theme/gary.theme.mjs. */
body {
  margin: 0;
  background: var(--color-background-body);
  color: var(--color-text-primary);
  line-height: 1.6;
  /* tabular-nums is DELIBERATELY not set here. Page-wide tabular figures make
     narrative numbers ("2024 年增长 11%") look loose: the "1" carries a full
     digit slot on both sides. Figures are tabular where they must line up —
     table numeric columns, KPI bands, timeline dates, deltas — and those carry
     it per cell (hasTabularNumbers in sections.mjs). */
  /* text-wrap is inherited: body-level pretty reaches every Text span/div
     the components emit (they are not <p>), and headings override it with
     balance below. Without this the rule only covered <p>, and Astryx renders
     body copy as spans — measured text-wrap: wrap on every paragraph. */
  text-wrap: pretty;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
*, *::before, *::after { box-sizing: border-box; }
h1, h2, h3, h4 { text-wrap: balance; }
p, li, figcaption, blockquote { text-wrap: pretty; }

/* Keyboard focus is an outline, not an inset shadow: the component sheet no
   longer paints focus rings as shadows (see flattenElevation), so this is what
   keeps focus visible on every control, including the converted rings. */
:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

/* ---- Cross-card row alignment (subgrid) ----------------------------------
   KPI row and two-card rows share the parent's row tracks, so label / value /
   delta lines sit on one line across the row. The row count is exact (3 for
   the KPI band, N slots for a card pair), so a subgrid card never drops content
   into an implicit track.
   FALLBACK: browsers without subgrid drop this declaration and keep the grid
   from the renderer, where each card still stacks its own auto rows — the
   page stays usable, only cross-card alignment is lost. */
@supports (grid-template-rows: subgrid) {
  [data-gary="kpi-card"],
  [data-gary="duo-card"] { grid-template-rows: subgrid; }
}

/* ---- Width-driven blocks (container query, never media query) ------------
   A block adapts to the width of ITS OWN box, not the viewport: the same step
   row is ~250px at four steps and ~500px at two, and the label column has to
   tighten before the dots start colliding.
   RULE: container-type and subgrid never sit on the same element — inline-size
   containment silently disables subgrid. Steps never uses subgrid, so it is a
   safe container. The KPI / duo rows DO use subgrid on their cards, so their
   wrapper is deliberately NOT a query container: that combination is the trap
   this rule guards against.
   FALLBACK: a browser without container queries ignores @container and keeps
   the renderer's default 12px gaps — the page is still usable, only the
   tightening is lost. */
[data-gary="steps"] { container-type: inline-size; }

@supports (container-type: inline-size) {
  @container (width < 520px) {
    [data-gary="steps"] > ol { gap: 8px; }
    [data-gary="steps"] > ol > li { gap: 6px; }
  }
}
${inlineCss()}
/* P2: 表格数字等宽对齐（放在 inlineCss 之后以覆盖 layer 内的 StyleX 原子类） */
.astryx-table td,
.astryx-table th,
.astryx-table td .astryx-text,
.astryx-table th .astryx-text {
  font-variant-numeric: tabular-nums;
}
/* 375px 窄屏响应式单列折叠 */
@media (max-width: 520px) {
  [data-gary="kpi"] { grid-template-columns: 1fr !important; row-gap: 12px; }
  [data-gary="kpi-card"] { grid-row: auto !important; }
  .astryx-grid { grid-template-columns: 1fr !important; --x-gridTemplateColumns: 1fr !important; }
  [data-gary="steps"] > ol { grid-template-columns: 1fr !important; flex-direction: column !important; }
}
</style>
</head>
<body>
${body}
</body>
</html>
`;

  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(output, html, 'utf8');

  const componentCount = (body.match(/class="[^"]*\bastryx-/g) || []).length;
  console.log(
    `WROTE ${path.resolve(output)} bytes=${Buffer.byteLength(html)} recipe=${recipeId} blocks=${blocks.length} components=${componentCount}`
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

main();
