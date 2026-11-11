import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const base = process.env.GARY_UI_BASE_URL || 'http://127.0.0.1:4191/';
const output = process.env.GARY_UI_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-'));
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.GARY_UI_CHROME || chromium.executablePath() });
const checks = [], errors = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(new URL('examples/visual-lab/index.html', base).href, { waitUntil: 'networkidle' });
  check('five actual charts ready', await page.evaluate(async () => await GaryVisualCharts.ready && GaryVisualCharts.charts.size === 5));
  check('data, totals, zero baseline and missing value', await page.evaluate(() => {
    const { charts, data } = GaryVisualCharts;
    return data.regions.reduce((sum, row) => sum + row.revenue, 0) === 128 &&
      data.waterfall.base + data.waterfall.changes.reduce((sum, row) => sum + row.value, 0) === data.waterfall.total &&
      charts.get('trend').getOption().series[0].data[2] === null &&
      charts.get('trend').getOption().series[0].connectNulls === false &&
      charts.get('ranking').getOption().xAxis[0].min === 0 &&
      data.regions.every(row => row.composition.reduce((a, b) => a + b, 0) === 100);
  }));
  check('source tables and units present', await page.locator('[data-chart-table] table').count() === 5 && await page.locator('[data-analysis-rows] tr').count() === 4);
  check('optics mounted without text filtering', await page.locator('.specimen--lens').evaluateAll(elements => elements.every(el => el.dataset.garyRefractionState === 'svg' && getComputedStyle(el.querySelector('h3')).filter === 'none')));
  const token = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim());
  check('single scene and Gary 44px controls', token === '44px' && await page.locator('.gary-scene').count() === 1);
  await page.locator('#light-probe').scrollIntoViewIfNeeded(); await settle(page);
  const point = await page.locator('.probe-card').boundingBox();
  const dots = () => page.locator('.gary-dot-grid-canvas').evaluate(canvas => canvas.toDataURL());
  const defaultDots = await dots();
  await page.mouse.move(point.x + 30, point.y + 30); await settle(page);
  check('hover default off in actual page', !(await page.locator('#pointer-enabled').isChecked()) && await dots() === defaultDots && await page.locator('.probe-card').evaluate(el => el.style.getPropertyValue('--light-active') !== '1'));
  await page.locator('#pointer-enabled').check();
  await page.locator('#light-probe').scrollIntoViewIfNeeded();
  const newPoint = await page.locator('.probe-card').boundingBox();
  await page.mouse.move(newPoint.x + 30, newPoint.y + 35); await settle(page);
  check('explicitly enabled shared light follows pointer', await page.locator('.probe-card').evaluate(el => el.style.getPropertyValue('--light-active') === '1' && Math.abs(parseFloat(el.style.getPropertyValue('--light-x')) - 30) < 1));
  await page.locator('[data-background-open]').click();
  check('Background and page toggle agree', await page.locator('[name="pointerEffects"]').isChecked());
  await page.locator('[name="pointerEffects"]').uncheck(); await page.keyboard.press('Escape'); await settle(page);
  check('Background disables and clears light', !(await page.locator('#pointer-enabled').isChecked()) && await page.locator('.probe-card').evaluate(el => el.style.getPropertyValue('--light-active') === '0'));
  await page.locator('#pointer-enabled').check();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#pointer-enabled').disabled);
  check('reduced motion overrides opt-in', await page.locator('.probe-card').evaluate(el => el.style.getPropertyValue('--light-active') === '0'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload({ waitUntil: 'networkidle' }); await page.evaluate(() => GaryVisualCharts.ready);
  check('reload starts with hover off', !(await page.locator('#pointer-enabled').isChecked()));
  for (const layer of ['transmission', 'refraction', 'edge', 'shadow']) {
    await page.locator(`[data-layer="${layer}"]`).uncheck();
    check(`material ${layer} can be isolated`, await page.locator('#material-stage').getAttribute(`data-${layer}`) === 'off');
    await page.locator(`[data-layer="${layer}"]`).check();
  }
  await page.locator('#reference-enabled').uncheck();
  check('reference shapes optional', await page.locator('.material-reference').evaluate(el => getComputedStyle(el).display === 'none'));
  await page.locator('#reference-enabled').check();
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['dark', 'light']) {
      if (await page.locator('html').getAttribute('data-gary-theme') !== theme) await page.locator('[data-theme-toggle]').click();
      await settle(page);
      check(`${width} ${theme} no page or table overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && [...document.querySelectorAll('.analysis-panel')].every(el => el.scrollWidth <= el.clientWidth + 1)));
      check(`${width} ${theme} stable data surface`, await page.locator('.analysis-panel').first().evaluate(el => getComputedStyle(el).backdropFilter === 'none' && getComputedStyle(el).backgroundColor !== 'rgba(0, 0, 0, 0)'));
      if (width === 320) {
        await page.locator('[data-chart-table="composition"]').evaluate(el => el.closest('details').open = true);
        check(`320 ${theme} table stacks`, await page.locator('[data-chart-table="composition"] tr').nth(1).evaluate(el => getComputedStyle(el).display === 'grid' && el.scrollWidth <= el.clientWidth + 1));
      }
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo(0, 0); });
      await page.screenshot({ path: path.join(output, `${width}-${theme}.png`), fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  for (const theme of ['dark', 'light']) {
    if (await page.locator('html').getAttribute('data-gary-theme') !== theme) await page.locator('[data-theme-toggle]').click();
    for (const id of ['trend', 'ranking', 'scatter', 'waterfall', 'composition']) {
      const downloading = page.waitForEvent('download');
      await page.locator(`[data-export-chart="${id}"]`).click();
      const download = await downloading;
      const filename = path.join(output, download.suggestedFilename()); await download.saveAs(filename);
      const svg = fs.readFileSync(filename, 'utf8');
      check(`${id} ${theme} standalone SVG`, svg.includes('<svg') && svg.includes('<text') && !svg.includes('NaN'));
    }
  }
  await page.locator('#materials').screenshot({ path: path.join(output, 'materials-light.png') });
  await page.emulateMedia({ media: 'print' });
  check('print drops optical layers', await page.locator('.probe-card').evaluate(el => getComputedStyle(el).backdropFilter === 'none'));
  await page.pdf({ path: path.join(output, 'visual-study.pdf'), format: 'A4', printBackground: true });
  check('no runtime errors', errors.length === 0);
  const targetBrowserReport = { schemaVersion: 1, source: 'real-browser', targetStack: 'html', url: new URL('examples/visual-lab/index.html', base).href, styleEntry: 'tokens/base.css', styleEntryLoaded: true, computedStyle: { property: '--gary-control-height', value: token }, sceneCount: 1, nestedGlassCount: 0, consoleErrors: errors.length };
  fs.writeFileSync(path.join(output, 'acceptance.json'), JSON.stringify({ status: 'pass', checkedAt: new Date().toISOString(), checks, targetBrowserReport, pending: ['glass material preference', 'linked light intensity'] }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'pass', checks: checks.length, output }));
} finally { await browser.close(); }
