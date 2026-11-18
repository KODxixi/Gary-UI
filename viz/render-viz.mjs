/**
 * viz/render-viz.mjs — content.json -> single-file HTML, for chart & flow pages.
 *
 *   node viz/render-viz.mjs examples/demo-viz.content.json -o out/viz-charts.html
 *
 * Same inlining contract as agent/render.mjs (react-dom/server +
 * reset.css + astryx.css + generated theme CSS, zero <script>, zero external
 * links), but this renderer owns only the `chart` and `flow` block types and
 * reuses agent/recipes/sections.mjs for every text/card/table block. agent/render.mjs
 * is NOT touched — it belongs to a different write zone.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme, generateThemeCSS } from '@astryxdesign/core';
import { garyTheme } from '../theme/gary.theme.mjs';
import { SECTIONS } from '../agent/recipes/sections.mjs';
import { ChartBlock } from './charts.mjs';
import { FlowBlock } from './flow.mjs';

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
  const safe = (css) => css.replace(/<\/style/gi, '<\\/style');
  return [safe(reset), safe(astryx), safe(buildThemeCss())].join('\n');
}

function parseArgs(argv) {
  const input = argv[0];
  const oi = argv.indexOf('-o');
  const output = oi >= 0 ? argv[oi + 1] : null;
  if (!input || !output) {
    console.error('用法: node viz/render-viz.mjs <content.json> -o <out.html>');
    process.exit(2);
  }
  return { input, output };
}

function blocksOf(content) {
  const raw = Array.isArray(content.blocks) ? content.blocks : [];
  return raw.map((b, i) => ({ id: b.id || `b${i}`, type: b.type, props: b.props || {} }));
}

/** Block type -> renderer. Only `chart` / `flow` are new; the rest is shared. */
function renderBlock(block) {
  if (block.type === 'chart') return h(ChartBlock, { id: block.id, ...block.props });
  if (block.type === 'flow') return h(FlowBlock, { id: block.id, ...block.props });
  const shared = SECTIONS[block.type];
  if (!shared) {
    throw new Error(
      `未知区块类型 type="${block.type}"（block ${block.id}）；可用: chart, flow, ${Object.keys(SECTIONS).join(', ')}`
    );
  }
  return h(shared, block.props);
}

function main() {
  const { input, output } = parseArgs(process.argv.slice(2));
  const content = JSON.parse(fs.readFileSync(input, 'utf8'));
  const blocks = blocksOf(content);
  if (blocks.length === 0) throw new Error('content.json 缺少 blocks[]，无法渲染');
  const missing = blocks.filter((b) => !b.type);
  if (missing.length) throw new Error(`blocks[] 缺少 type: ${missing.map((b) => b.id).join(', ')}`);

  const meta = content.meta || {};
  const mode = meta.theme === 'dark' ? 'dark' : 'light';
  const lang = meta.lang || 'zh-CN';
  const title = meta.title || 'Gary-UI · Viz';

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
      h(
        'div',
        { style: { display: 'flex', flexDirection: 'column', gap: '32px' } },
        blocks.map((b) => h('div', { key: b.id }, renderBlock(b)))
      )
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
.astryx-table td,
.astryx-table th,
.astryx-table td .astryx-text,
.astryx-table th .astryx-text {
  font-variant-numeric: tabular-nums;
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

  const charts = blocks.filter((b) => b.type === 'chart').length;
  const flows = blocks.filter((b) => b.type === 'flow').length;
  console.log(
    `WROTE ${path.resolve(output)} bytes=${Buffer.byteLength(html)} blocks=${blocks.length} charts=${charts} flows=${flows}`
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

main();
