import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { exportArtifact } from '../lib/exporter.mjs';
import {
  buildEchartsHtml,
  buildInfographicHtml,
  buildLucideHtml,
  buildMarkmapHtml,
  buildMermaidHtml,
  escapeInlineJson,
  inspectPackages,
  promoteCandidate,
  validateTextSource,
} from '../runner.mjs';


test('inline JSON cannot terminate its script element', () => {
  const encoded = escapeInlineJson({ label: '</script><script>alert(1)</script>' });
  assert.equal(encoded.includes('</script>'), false);
  assert.match(encoded, /\\u003c\/script/);
});


test('text sources reject executable markup and Mermaid click directives', () => {
  assert.throws(() => validateTextSource('<script>alert(1)</script>', 'markmap'));
  assert.throws(() => validateTextSource('click A "javascript:alert(1)"', 'mermaid'));
  assert.doesNotThrow(() => validateTextSource('# 中文研究提纲\n- 证据', 'markmap'));
});


test('ECharts output is self-contained and retains a data table', () => {
  const html = buildEchartsHtml(
    {
      title: '趋势',
      sourceNote: '示例数据',
      option: {
        xAxis: { type: 'category', data: ['一月', '二月'] },
        yAxis: { type: 'value', name: '项' },
        series: [{ type: 'line', data: [1, 2] }],
      },
      table: [['月份', '值'], ['一月', '1'], ['二月', '2']],
    },
    { id: 'trend', scene: 'analysis', theme: 'dark', citation: { label: '示例' } },
  );
  assert.match(html, /echarts\.init/);
  assert.match(html, /<table/);
  assert.doesNotMatch(html, /<script[^>]+src=/);
  assert.doesNotMatch(html, /https?:\/\/[^"']+\.js/);
});


test('Markmap and Mermaid outputs preserve their native source in the page', async () => {
  const visual = {
    id: 'outline',
    scene: 'reading',
    theme: 'light',
    citation: { label: '示例' },
  };
  const markmap = buildMarkmapHtml('# 研究提纲\n## 事实\n- 证据', visual);
  const mermaid = buildMermaidHtml('flowchart LR\nA[输入] --> B[输出]', {
    ...visual,
    id: 'flow',
  });
  assert.match(markmap, /markmap\.Markmap\.create/);
  assert.match(markmap, /研究提纲/);
  assert.match(mermaid, /mermaid\.render/);
  assert.match(mermaid, /flowchart LR/);
});


test('AntV Infographic uses the pinned local browser runtime and Lucide icon sheet contains real SVG', async () => {
  const visual = {
    id: 'summary',
    scene: 'showcase',
    theme: 'dark',
    citation: { label: '示例' },
  };
  const infographic = await buildInfographicHtml(
    {
      title: '研究步骤',
      syntax: 'infographic list-row-simple-horizontal-arrow\ndata\n  lists\n    - label 定义\n      desc 明确目标\n    - label 验证\n      desc 检查证据',
    },
    visual,
  );
  const icons = buildLucideHtml(
    { title: '图标', icons: ['FileText', 'Workflow', 'Download'] },
    { ...visual, id: 'icons' },
  );
  assert.match(infographic, /AntVInfographic\.Infographic/);
  assert.match(infographic, /明确目标/);
  assert.doesNotMatch(infographic, /<script[^>]+src=/);
  assert.doesNotMatch(infographic, /https?:\/\/[^"']+\.js/);
  assert.match(icons, /lucide-file-text/);
  assert.match(icons, /aria-label="FileText"/);
});


test('candidate promotion preserves last-good output on failure', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-test-'));
  const target = path.join(root, 'diagram.html');
  fs.writeFileSync(target, 'last-good');
  assert.throws(() => promoteCandidate(path.join(root, 'missing.html'), target));
  assert.equal(fs.readFileSync(target, 'utf8'), 'last-good');
});


test('doctor inventory reports a missing dependency instead of installing it', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-doctor-'));
  const inventory = inspectPackages({ packages: { echarts: '6.1.0' } }, root);
  assert.deepEqual(inventory.echarts, { expected: '6.1.0', actual: null, ok: false });
});


test('failed export leaves an existing target unchanged', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-export-'));
  const html = path.join(root, 'visual.html');
  const target = path.join(root, 'visual.out');
  fs.writeFileSync(html, '<!doctype html><svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>');
  fs.writeFileSync(target, 'last-good');
  await assert.rejects(
    exportArtifact(html, target, 'unsupported', { timeout: 2000 }),
    /Unsupported browser export format/,
  );
  assert.equal(fs.readFileSync(target, 'utf8'), 'last-good');
});


test('browser export accepts a self-contained SVG page without a Gary ready flag', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-svg-'));
  const html = path.join(root, 'archify-like.html');
  const target = path.join(root, 'diagram.svg');
  fs.writeFileSync(
    html,
    '<!doctype html><html><body><svg viewBox="0 0 100 60"><rect width="100" height="60"/></svg></body></html>',
  );

  await exportArtifact(html, target, 'svg', { timeout: 2000 });

  assert.match(fs.readFileSync(target, 'utf8'), /<svg/);
});


test('SVG export inlines computed presentation styles', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-styled-svg-'));
  const html = path.join(root, 'styled.html');
  const target = path.join(root, 'styled.svg');
  fs.writeFileSync(
    html,
    '<!doctype html><html><head><style>.node{fill:rgb(18, 52, 86);stroke:rgb(240, 200, 80);stroke-width:3px}</style></head><body><main class="gary-visual-stage"><svg viewBox="0 0 120 80"><rect class="node" x="10" y="10" width="100" height="60"/></svg></main></body></html>',
  );

  await exportArtifact(html, target, 'svg', { timeout: 2000, theme: 'dark' });

  const exported = fs.readFileSync(target, 'utf8');
  assert.match(exported, /fill="rgb\(18, 52, 86\)"/);
  assert.match(exported, /stroke="rgb\(240, 200, 80\)"/);
  assert.match(exported, /viewBox="0 0 120 80"/);
});


test('Lucide SVG export contains the complete named icon board', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-icon-board-'));
  const html = path.join(root, 'icons.html');
  const target = path.join(root, 'icons.svg');
  fs.writeFileSync(
    html,
    buildLucideHtml(
      { title: '图标板', icons: ['FileText', 'Workflow', 'Download'] },
      { id: 'icons', tool: 'lucide', scene: 'analysis', theme: 'dark', citation: { label: 'fixture' } },
    ),
  );

  await exportArtifact(html, target, 'svg', { timeout: 4000, theme: 'dark' });

  const exported = fs.readFileSync(target, 'utf8');
  assert.equal((exported.match(/data-gary-icon=/g) || []).length, 3);
  assert.match(exported, />FileText</);
  assert.match(exported, />Workflow</);
  assert.match(exported, />Download</);
});

test('Archify export selects the main diagram and preserves CSS fill none', async () => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'gary-main-svg-'));
  const html=path.join(root,'diagram.html'), target=path.join(root,'diagram.svg');
  fs.writeFileSync(html,'<!doctype html><style>.wire{fill:none;stroke:red}</style><div class="diagram-container"><svg viewBox="0 0 870 516"><path class="wire" d="M 10 10 L 80 10 L 80 60"/><text>主关系图</text></svg><aside hidden><svg viewBox="0 0 50 50"><rect width="30" height="30"/></svg></aside></div>');
  await exportArtifact(html,target,'svg',{timeout:2000,theme:'light'});
  const svg=fs.readFileSync(target,'utf8');
  assert.match(svg,/data-gary-export="standalone"/);
  assert.match(svg,/viewBox="0 0 870 516"/);
  assert.match(svg,/<path[^>]*fill="none"/);
  assert.doesNotMatch(svg,/data-gary-icon/);
});


test('showcase controls drive a finite motion timeline and reduced motion exposes full content', () => {
  const html = buildEchartsHtml(
    {
      title: '演示趋势',
      option: { xAxis: { data: ['一', '二'] }, yAxis: {}, series: [{ type: 'line', data: [1, 2] }] },
      table: [['阶段', '值'], ['一', '1'], ['二', '2']],
    },
    { id: 'motion', tool: 'echarts', scene: 'showcase', theme: 'dark', citation: { label: 'fixture' } },
  );
  assert.match(html, /data-motion-action="play"/);
  assert.match(html, /data-motion-state/);
  assert.match(html, /\.animate\(/);
  assert.match(html, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(html, /motion-controls\{display:none/);
});
