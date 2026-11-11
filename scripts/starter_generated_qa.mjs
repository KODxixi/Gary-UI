// Exercise the actual copyable HTML, independently of the composition preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const base = new URL(process.env.GARY_UI_BASE_URL || 'http://127.0.0.1:4173/');
const output = path.resolve(import.meta.dirname, '../examples/demos/evidence/independent-recheck/contracts');
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.GARY_UI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true
});
const results = [];
const cases = [];
for (const width of [1440, 390]) for (const theme of ['dark', 'light']) {
  for (const material of ['ultrathin', 'regular', 'thick', 'solid-plate']) {
    cases.push({ width, theme, material, application: 'board', page: 'report-cover' });
  }
}
for (const application of ['board', 'scroll-report', 'web-ui']) {
  for (const page of ['report-cover', 'image-page', 'data-page', 'manual-toc']) {
    cases.push({ width: 390, theme: 'light', material: 'regular', application, page });
  }
}

try {
  for (const scenario of cases) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: 844 },
      isMobile: scenario.width === 390,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce'
    });
    const row = { ...scenario };
    try {
      context.setDefaultTimeout(5000);
      const editor = await context.newPage();
      const source = new URL('patterns/starting-points/index.html', base);
      source.searchParams.set('theme', scenario.theme);
      source.searchParams.set('material', scenario.material);
      await editor.goto(source.href);
      await editor.locator(`label:has([name="starter-application"][value="${scenario.application}"])`).click();
      await editor.locator(`label:has([name="starter-page"][value="${scenario.page}"])`).click();
      const html = await editor.locator('#starter-code-output').textContent();
      const generated = await context.newPage();
      const errors = [];
      const failedResources = [];
      generated.on('pageerror', error => errors.push(error.message));
      generated.on('response', response => {
        if (response.status() >= 400) failedResources.push({ url: response.url(), status: response.status() });
      });
      const independentUrl = new URL('__gary-generated-qa.html', base).href;
      // Deliberately omit a transport charset: the generated document must declare it.
      await generated.route(independentUrl, route => route.fulfill({ status: 200, contentType: 'text/html', body: html }));
      await generated.goto(independentUrl);
      await generated.waitForFunction(() => document.querySelector('.gary-dot-grid-canvas'));
      await generated.waitForTimeout(120);
      row.proof = await generated.evaluate(() => {
        const card = document.querySelector('.gary-glass-card');
        return {
          charset: document.characterSet,
          viewportMeta: document.querySelector('meta[name="viewport"]')?.content,
          viewport: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          title: document.title,
          brand: document.querySelector('.gary-web-bar__brand').textContent,
          pageLabel: document.querySelector('[aria-current="page"]').textContent,
          application: document.documentElement.dataset.garyApplicationMode,
          page: document.documentElement.dataset.garyPageMode,
          theme: document.documentElement.dataset.garyTheme,
          material: document.documentElement.dataset.garyMaterial,
          controlHeight: getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim(),
          scenes: document.querySelectorAll('[data-gary-scene-engine="dot-grid"]').length,
          canvases: document.querySelectorAll('.gary-dot-grid-canvas').length,
          sceneBackground: getComputedStyle(document.querySelector('[data-gary-scene-engine="dot-grid"]')).backgroundImage,
          filter: getComputedStyle(card).backdropFilter,
          solid: card.classList.contains('gary-solid-plate'),
          refraction: card.dataset.garyRefractionState || null,
          assets: [...document.querySelectorAll('link[rel="stylesheet"],script[src]')].map(node => node.href || node.src)
        };
      });
      const p = row.proof;
      assert.deepEqual(errors, []);
      assert.deepEqual(failedResources, []);
      assert.equal(p.charset, 'UTF-8');
      assert.equal(p.viewportMeta, 'width=device-width, initial-scale=1');
      assert.equal(p.viewport, scenario.width);
      assert.equal(p.overflow, false);
      assert.equal(p.controlHeight, '44px');
      assert.equal(p.application, scenario.application);
      assert.equal(p.page, scenario.page);
      assert.equal(p.theme, scenario.theme);
      assert.equal(p.material, scenario.material);
      assert.equal(p.brand, { board: '看板', 'scroll-report': '滚动演示汇报', 'web-ui': 'Web UI' }[scenario.application]);
      assert.equal(p.pageLabel, { 'report-cover': '报告封面', 'image-page': '图像页', 'data-page': '数据页', 'manual-toc': '手册目录' }[scenario.page]);
      assert.equal(p.scenes, 1);
      assert.equal(p.canvases, 1);
      assert.equal(p.sceneBackground, 'none');
      if (scenario.material === 'solid-plate') {
        assert.equal(p.solid, true);
        assert.equal(p.filter, 'none');
        assert.equal(p.refraction, null);
      } else {
        assert.equal(p.solid, false);
        assert.equal(p.refraction, 'svg');
        assert.ok(p.filter.startsWith('url('));
      }
      if (scenario.width === 390 && scenario.application === 'board' && scenario.page === 'report-cover' && ['regular', 'solid-plate'].includes(scenario.material)) {
        fs.writeFileSync(path.join(output, `generated-starter-after-${scenario.theme}-${scenario.material}.html`), html);
        await generated.screenshot({ path: path.join(output, `generated-starter-after-${scenario.theme}-${scenario.material}.png`) });
      }
      row.pass = true;
    } catch (error) {
      row.pass = false;
      row.error = error.message;
    } finally {
      await context.close();
    }
    results.push(row);
  }
} finally {
  await browser.close();
}
const report = {
  generatedAt: new Date().toISOString(),
  method: 'Real Chromium loads the actual copyable code as an independent HTML document; desktop and mobile viewport; all material and theme choices; all 12 application/page combinations.',
  checks: results.length,
  passed: results.filter(row => row.pass).length,
  results
};
const reportPath = path.join(output, 'generated-starter-verified-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ checks: report.checks, passed: report.passed, failures: results.filter(row => !row.pass).map(({ proof, ...row }) => row), report: reportPath }));
if (report.passed !== report.checks) process.exitCode = 1;
