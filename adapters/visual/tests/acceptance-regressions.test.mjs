import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import { chromium } from '../node_modules/playwright-core/index.mjs';

import { buildEchartsHtml } from '../lib/renderers.mjs';


const adapterRoot = path.resolve(import.meta.dirname, '..');
const runner = path.join(adapterRoot, 'runner.mjs');


function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}


function run(root, action, extra = []) {
  return spawnSync(process.execPath, [runner, action, '--manifest', path.join(root, 'visuals.json'), '--json', ...extra], {
    cwd: adapterRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
}


function mermaidFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-transaction-'));
  fs.mkdirSync(path.join(root, 'sources'));
  fs.writeFileSync(path.join(root, 'sources', 'flow.mmd'), 'flowchart LR\nA[输入] --> B[输出]');
  fs.writeFileSync(path.join(root, 'visuals.json'), JSON.stringify({
    schemaVersion: 1,
    project: 'transaction-fixture',
    outputRoot: 'outputs',
    visuals: [{
      id: 'flow', title: '流程', purpose: 'simple-flow', tool: 'mermaid', source: 'sources/flow.mmd',
      scene: 'reading', theme: 'light', formats: ['html', 'svg', 'png'],
      citation: { label: 'fixture', url: null, note: 'test only' },
    }],
  }));
  return root;
}


test('invalid Mermaid fails validate after an initially valid source', () => {
  const root = mermaidFixture();
  assert.equal(run(root, 'validate').status, 0);
  fs.writeFileSync(path.join(root, 'sources', 'flow.mmd'), 'flowchart LR\nA --');
  const invalid = run(root, 'validate');
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stdout, /fail/i);
});


test('failed regeneration preserves one coherent last-good version', () => {
  const root = mermaidFixture();
  assert.equal(run(root, 'export').status, 0);
  const output = path.join(root, 'outputs');
  const protectedFiles = ['flow.html', 'flow.svg', 'flow.png', 'sources/flow.mmd', 'generation-receipt.json', 'visual-manifest.json'];
  const before = Object.fromEntries(protectedFiles.map((file) => [file, sha(path.join(output, file))]));

  fs.writeFileSync(path.join(root, 'sources', 'flow.mmd'), 'flowchart LR\nA --');
  const failed = run(root, 'export');

  assert.notEqual(failed.status, 0);
  assert.deepEqual(Object.fromEntries(protectedFiles.map((file) => [file, sha(path.join(output, file))])), before);
  const status = JSON.parse(fs.readFileSync(path.join(output, 'generation-status.json'), 'utf8'));
  assert.equal(status.state, 'failed');
  assert.ok(status.currentValidVersion);
  assert.match(status.failure.message, /mermaid|parse|syntax/i);
});


test('Archify manifest theme survives toolbar initialization without a URL override', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-archify-theme-'));
  fs.mkdirSync(path.join(root, 'sources'));
  fs.copyFileSync(
    path.resolve(adapterRoot, '..', '..', 'examples', 'visuals', 'sources', 'sequence.json'),
    path.join(root, 'sources', 'sequence.json'),
  );
  fs.writeFileSync(path.join(root, 'visuals.json'), JSON.stringify({
    schemaVersion: 1,
    project: 'archify-theme-fixture',
    outputRoot: 'outputs',
    visuals: [{
      id: 'sequence', title: '时序', purpose: 'sequence', tool: 'archify', source: 'sources/sequence.json',
      scene: 'analysis', theme: 'light', quality: 'showcase', formats: ['html'],
      citation: { label: 'fixture', url: null, note: 'test only' },
    }],
  }));

  const result = run(root, 'render');
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const html = fs.readFileSync(path.join(root, 'outputs', 'sequence.html'), 'utf8');
  assert.match(html, /<html[^>]+data-theme="light"[^>]+data-gary-theme="light"/);
  assert.match(html, /var theme = 'light';/);
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/);
  const browser = await chromium.launch({ executablePath: process.env.GARY_UI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ colorScheme: 'dark' });
    await context.addInitScript(() => { localStorage.setItem('archify-theme', 'dark'); });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.join(root, 'outputs', 'sequence.html')).href);
    await page.waitForFunction(() => window.Archify?.theme);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.locator('#btn-theme').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.reload();
    await page.waitForFunction(() => window.Archify?.theme);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  } finally { await browser.close(); }
});


test('renderer consumes theme-map and scene recipes as runtime policy', () => {
  const themeMap = JSON.parse(fs.readFileSync(path.join(adapterRoot, 'theme-map.json'), 'utf8'));
  const recipes = JSON.parse(fs.readFileSync(path.resolve(adapterRoot, '..', '..', 'spec', 'scene-recipes.json'), 'utf8'));
  const html = buildEchartsHtml({
    title: '主题策略检查',
    option: { xAxis: { type: 'category', data: ['A'] }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [1] }] },
    table: [['类别', '值'], ['A', 1]],
  }, {
    id: 'policy-check', tool: 'echarts', scene: 'analysis', theme: 'dark',
    citation: { label: 'test', url: null, note: '' },
  });

  assert.match(html, /data-gary-theme-source="theme-map\.json"/);
  assert.match(html, new RegExp(themeMap.themes.dark.background.replace('#', '\\#')));
  assert.match(html, new RegExp(`--content-gap:${recipes.scenes.analysis.density.contentGap}`));
  assert.match(html, new RegExp(recipes.colors.chartCategory.dark[0].replace('#', '\\#')));

  const rendererSource = fs.readFileSync(path.join(adapterRoot, 'lib', 'renderers.mjs'), 'utf8');
  assert.doesNotMatch(rendererSource, /const\s+themes\s*=\s*\{/);
  assert.doesNotMatch(rendererSource, /const\s+palettes\s*=\s*\{/);
  assert.doesNotMatch(rendererSource, /const\s+sceneRules\s*=\s*\{/);
});
