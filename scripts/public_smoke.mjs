// Exercise the actual public site, including a GitHub Pages-style /Gary-UI/ prefix.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const base = (process.env.GARY_UI_BASE_URL || 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const output = process.env.GARY_UI_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'gary-ui-public-smoke-'));
fs.mkdirSync(output, { recursive: true });
const executablePath = process.env.GARY_UI_CHROME || chromium.executablePath();
const browser = await chromium.launch({ executablePath, headless: true });
const results = [];
const pages = ['web-analysis', 'web-reading', 'project-kanban', 'executive-board', 'research-report', 'proposal-presentation'];
async function open(page, relative) {
  for (let attempt = 0; attempt < 15; attempt++) {
    try { await page.goto(new URL(relative, base).href, { waitUntil: 'networkidle' }); return; }
    catch (error) { if (attempt === 14) throw error; await new Promise(resolve => setTimeout(resolve, 500)); }
  }
}

try {
  const ready = await fetch(base, { signal: AbortSignal.timeout(10000) });
  assert.ok(ready.ok, `Preview unavailable: ${ready.status}`);
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    let errors = [];
    const externalRequests = [];
    const localOrigin = new URL(base).origin;
    await context.route(/^https?:\/\//, route => {
      if (new URL(route.request().url()).origin === localOrigin) route.continue();
      else { externalRequests.push(route.request().url()); route.abort(); }
    });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400 && !response.url().endsWith('/favicon.ico')) errors.push(`${response.status()} ${response.url()}`);
    });
    for (const slug of ['index', ...pages]) {
      errors = [];
      const relative = slug === 'index' ? 'examples/demos/index.html' : `examples/demos/${slug}/index.html`;
      try {
        await open(page, `${relative}?theme=dark`);
        await page.waitForFunction(() => document.querySelector('.demo-global-scene canvas'));
        if (slug === 'index') await page.waitForFunction(() => window.GaryGlassSurface);
        const proof = await page.evaluate(() => ({
          title: document.title,
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          dots: document.querySelectorAll('.demo-global-scene canvas').length,
          backgroundText: document.querySelector('[data-background-open]')?.textContent.trim(),
          backgroundIcons: document.querySelectorAll('[data-background-open] svg').length,
          restrictedScript: [...document.scripts].some(s => /\/(glass-surface|gradient-waves|light-rays)\.js/.test(s.src)),
          hoverDefaults: [...document.querySelectorAll('[data-gary-pointer-effects]')].every(el => el.dataset.garyPointerEffects !== 'on'),
        }));
        assert.ok(proof.title && proof.scrollWidth <= width + 1, `horizontal overflow: ${JSON.stringify(proof)}`);
        assert.equal(proof.dots, 1);
        assert.equal(proof.restrictedScript, false);
        assert.equal(proof.hoverDefaults, true);
        if (slug === 'index') {
          assert.equal(proof.backgroundText, 'Background');
          assert.equal(proof.backgroundIcons, 0);
          const background = page.locator('[data-background-open]');
          await background.click();
          assert.ok(await page.locator('#gary-background-lab').isVisible());
          assert.equal(await page.locator('html').getAttribute('data-gary-theme'), 'dark');
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#gary-background-lab').isVisible(), false);
          await page.locator('.gallery-hero h1').click();
          await page.screenshot({ path: path.join(output, `demo-home-${width}-dark.png`) });
          await page.locator('[data-theme-toggle]').click();
          assert.equal(await page.locator('html').getAttribute('data-gary-theme'), 'light');
          await background.click();
          await page.locator('#gary-background-lab [name="background"]').selectOption('aurora-bloom');
          await page.waitForFunction(() => document.querySelector('[data-waves-status]')?.textContent.includes('极光'));
          assert.equal(await page.locator('.gary-gradient-waves-canvas').count(), 0);
          await page.locator('#gary-background-lab [name="background"]').selectOption('dot-grid');
          assert.equal(await page.locator('.gary-gradient-waves-canvas').count(), 0);
          await page.keyboard.press('Escape');
          if (width < 700) {
            await page.locator('.gary-header-menu').click();
            assert.equal(await page.locator('.gary-header-menu').getAttribute('aria-expanded'), 'true');
            await page.locator('.gary-header-menu').click();
          }
          await page.screenshot({ path: path.join(output, `demo-home-${width}-light.png`) });
        } else {
          await page.locator('[data-theme-toggle]').click();
          assert.equal(await page.locator('html').getAttribute('data-gary-theme'), 'light');
          await page.waitForTimeout(100);
        }
        assert.deepEqual(errors, [], 'failed assets or browser errors');
        assert.deepEqual(externalRequests, [], 'public smoke must make no external requests');
        results.push({ width, page: slug, pass: true, proof });
      } catch (error) { results.push({ width, page: slug, pass: false, error: error.message, errors }); }
    }
    errors = [];
    try {
      await open(page, 'portal/?theme=dark#components');
      await page.waitForFunction(() => window.GaryGlassSurface && document.querySelector('.component-item'));
      assert.ok(await page.locator('[data-background-open]').isVisible());
      await page.locator('.demo-action').click();
      assert.equal(await page.locator('.component-item:visible').count(), 15);
      await page.locator('[data-background-open]').click();
      await page.keyboard.press('Escape');
      if (width <= 1100) {
        await page.locator('#topbar-menu-toggle').click();
        assert.equal(await page.locator('#topbar-menu-toggle').getAttribute('aria-expanded'), 'true');
        await page.locator('#topbar-menu-toggle').click();
      }
      assert.deepEqual(errors, []);
      results.push({ width, page: 'portal-components', pass: true });
    } catch (error) { results.push({ width, page: 'portal-components', pass: false, error: error.message, errors }); }
    await context.close();
  }
} finally { await browser.close(); }
const report = { generatedAt: new Date().toISOString(), base, checks: results.length, passed: results.filter(r => r.pass).length, results };
fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ checks: report.checks, passed: report.passed, failures: results.filter(r => !r.pass), evidence: output }, null, 2));
if (report.passed !== report.checks) process.exitCode = 1;
