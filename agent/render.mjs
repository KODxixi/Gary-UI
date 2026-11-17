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
  if (component) parts.push(`@layer astryx-theme {\n${component}\n}`);
  if (prose) parts.push(`@layer reset {\n${prose}\n}`);
  return parts.join('\n');
}

function inlineCss() {
  const files = [
    resolveCss('@astryxdesign/core/reset.css'),
    resolveCss('@astryxdesign/core/astryx.css'),
  ];
  const reset = fs.readFileSync(files[0], 'utf8');
  const astryx = fs.readFileSync(files[1], 'utf8');
  // Defensive: break early if the CSS itself contains </style
  const safe = (css) => css.replace(/<\/style/gi, '<\\/style');
  return [safe(reset), safe(astryx), safe(buildThemeCss())].join('\n');
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
    props: b.props || {},
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
/* ---- MWG visual base (2026-11-17) -----------------------------------------
   Renderer-level rules, never content-level: warm paper page (token), one
   sans stack (token), zero elevation (token), tabular figures everywhere a
   number can appear, and modern wrapping. Nothing here overrides a token —
   colours and type sizes stay in theme/gary.theme.mjs. */
body {
  margin: 0;
  background: var(--color-background-body);
  color: var(--color-text-primary);
  line-height: 1.6;
  /* every numeral in the product — KPI, tables, dates, scores — is tabular,
     so columns of figures line up without per-component overrides. */
  font-variant-numeric: tabular-nums;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
*, *::before, *::after { box-sizing: border-box; }
h1, h2, h3, h4 { text-wrap: balance; }
p, li, figcaption, blockquote { text-wrap: pretty; }

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

/* ---- Width-driven cards (container query, not media query) ---------------
   A step card has to adapt to the width of the card itself: the same block is
   ~250px wide at four steps and ~500px at two. A media query can only guess
   from the viewport; a container query measures the box. Steps never use
   subgrid, so container-type cannot collide with it (the two are mutually
   exclusive on one element). */
[data-gary="steps"] { container-type: inline-size; }
@container (width < 520px) {
  [data-gary="steps"] > ol { gap: 8px; }
  [data-gary="steps"] > ol > li { gap: 6px; }
}
${inlineCss()}
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
