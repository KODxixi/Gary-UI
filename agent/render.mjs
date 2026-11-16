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

const RECIPES = {
  [reportRecipe.id]: reportRecipe,
  [tableRecipe.id]: tableRecipe,
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
body { margin: 0; background: var(--color-background-body); color: var(--color-text-primary); }
*, *::before, *::after { box-sizing: border-box; }
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
