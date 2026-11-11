// Real-browser checks for the optional shared recipes and their actual review page.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const base = process.env.GARY_UI_BASE_URL || 'http://127.0.0.1:4191/';
const output = process.env.GARY_UI_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'gary-interaction-'));
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.GARY_UI_CHROME || chromium.executablePath(), headless: true });
const checks = [], errors = [];
let targetBrowserReport;
const check = (name, condition) => { assert.ok(condition, name); checks.push(name); };
const url = new URL('examples/interaction-lab/index.html', base).href;

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.GaryContentRail && window.GaryNumberTransition && document.querySelector('.demo-global-scene canvas'));
  const proof = await page.evaluate(() => ({
    token: getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim(),
    sceneCount: document.querySelectorAll('.gary-scene').length,
    nestedGlassCount: document.querySelectorAll('[data-gary-material="glass"] [data-gary-material="glass"]').length,
    loaded: performance.getEntriesByType('resource').some(entry => entry.name.endsWith('/tokens/base.css')),
  }));
  check('tokens / one scene / no nested glass', proof.token === '44px' && proof.loaded && proof.sceneCount === 1 && proof.nestedGlassCount === 0);
  targetBrowserReport = { schemaVersion: 1, source: 'real-browser', targetStack: 'html', url, styleEntry: 'tokens/base.css', styleEntryLoaded: true, computedStyle: { property: '--gary-control-height', value: proof.token }, sceneCount: proof.sceneCount, nestedGlassCount: proof.nestedGlassCount, consoleErrors: 0 };
  check('first metric complete without animation', await page.locator('#metric-value').innerText() === '72.4%' && await page.locator('#metric-value [aria-hidden]').count() === 0);
  await page.locator('[data-period="previous"]').click();
  check('accessible number is final during transition', (await page.locator('#metric-value').ariaSnapshot()).includes('68.1%'));
  await page.waitForFunction(() => !document.querySelector('#metric-value [aria-hidden]'));
  check('finite metric transition ends', await page.locator('#metric-value').innerText() === '68.1%');
  const numberChecks = await page.evaluate(async () => {
    const node = document.querySelector('#metric-value'), api = GaryNumberTransition;
    const format = value => value.toFixed(1) + '%';
    api.set(node, 90, { format });
    await new Promise(resolve => requestAnimationFrame(resolve));
    const visible = node.querySelector('[aria-hidden]');
    api.set(node, 90, { format });
    const same = visible === node.querySelector('[aria-hidden]');
    api.set(node, 80, { format });
    api.set(node, 72.4, { format });
    const oneOverlay = node.querySelectorAll('[aria-hidden]').length === 1;
    const before = node.innerHTML;
    let rejected = 0;
    for (const value of [NaN, Infinity, '12']) { try { api.set(node, value, { format }); } catch { rejected++; } }
    try { api.set(node, 8, { format: () => { throw Error('format'); } }); } catch { rejected++; }
    const preserved = node.innerHTML === before;
    dispatchEvent(new Event('beforeprint'));
    const printed = node.innerText === '72.4%' && !node.querySelector('[aria-hidden]');
    dispatchEvent(new Event('afterprint'));
    return { same, oneOverlay, rejected, preserved, printed };
  });
  check('same value / rapid updates / invalid value / print preserve real result', numberChecks.same && numberChecks.oneOverlay && numberChecks.rejected === 4 && numberChecks.preserved && numberChecks.printed);

  const rail = page.locator('.gary-content-rail');
  await rail.scrollIntoViewIfNeeded();
  check('rail start boundary', await page.locator('[data-rail-prev]').isDisabled());
  await page.locator('[data-rail-next]').click();
  await page.waitForFunction(() => document.querySelector('[data-rail-status]').textContent === '2 / 3');
  await rail.focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('[data-rail-next]').disabled);
  check('rail end and keyboard', await page.locator('[data-rail-status]').innerText() === '3 / 3');
  await page.keyboard.press('Home');
  await page.waitForFunction(() => document.querySelector('[data-rail-prev]').disabled);
  await rail.hover(); await page.mouse.wheel(500, 0);
  await page.waitForFunction(() => document.querySelector('.gary-content-rail').scrollLeft > 100);
  check('horizontal wheel scroll', true);
  await rail.focus(); await page.keyboard.press('Home');
  await page.waitForFunction(() => document.querySelector('[data-rail-prev]').disabled);

  await page.locator('[data-motion-action="play"]').click();
  await page.locator('[data-motion-action="pause"]').click();
  check('title pauses', await page.locator('[data-motion-status]').innerText() === '已暂停');
  await page.locator('[data-motion-action="play"]').click();
  await page.waitForFunction(() => document.querySelector('[data-motion-status]').textContent === '完整呈现');
  await page.locator('[data-motion-action="replay"]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('[data-motion-status]').textContent === '完整呈现' && document.querySelector('#tilt-enabled').disabled);
  check('runtime reduced-motion completes title', await page.locator('[data-motion-status]').innerText() === '完整呈现' && await page.locator('[data-motion-action="play"]').isDisabled());
  check('complete title exists in accessibility tree', (await page.locator('.lab-statement').ariaSnapshot()).includes('看清当下，从容向前'));
  await page.locator('[data-period="current"]').click();
  check('reduced-motion number immediate', await page.locator('#metric-value [aria-hidden]').count() === 0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !document.querySelector('#tilt-enabled').disabled);
  await page.locator('#tilt-enabled').check();
  const tiltBox = await page.locator('#tilt-media').boundingBox();
  await page.mouse.move(tiltBox.x + tiltBox.width * .85, tiltBox.y + tiltBox.height * .2);
  check('tilt is opt-in and media-only', await page.locator('#tilt-media').evaluate(el => el.style.transform.includes('rotate')) && await page.locator('#tilt-stage figcaption').evaluate(el => getComputedStyle(el).transform === 'none'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => document.querySelector('#tilt-enabled').disabled);
  check('reduced-motion cancels tilt', await page.locator('#tilt-media').evaluate(el => getComputedStyle(el).transform === 'none'));

  await page.locator('[data-verdict="tilt"]').selectOption('refine');
  await page.locator('[data-verdict="reveal"]').selectOption('keep');
  await page.locator('#choice-note').fill('倾斜减半');
  await page.reload({ waitUntil: 'networkidle' });
  check('judgment survives reload', await page.locator('[data-verdict="tilt"]').inputValue() === 'refine' && await page.locator('#choice-note').inputValue() === '倾斜减半');
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw Error('blocked'); } } }));
  await page.locator('#copy-choices').click();
  check('clipboard denial provides copyable fallback', await page.locator('#copy-fallback').isVisible() && (await page.locator('#copy-fallback').inputValue()).includes('调整后再看'));
  // Keep the delivered screenshots free of QA choices.
  await page.evaluate(() => localStorage.removeItem('gary-interaction-lab-v1'));
  await page.reload({ waitUntil: 'networkidle' });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const mode of ['dark', 'light']) {
      if (await page.locator('html').getAttribute('data-gary-theme') !== mode) await page.locator('[data-theme-toggle]').click();
      await page.locator('#tilt-media').scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.querySelectorAll('img[data-preview]')].every(image => image.complete && image.naturalWidth > 0));
      check(`${width} ${mode} reflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const peek = await rail.evaluate(el => el.firstElementChild.getBoundingClientRect().width < el.clientWidth && el.scrollWidth > el.clientWidth);
      check(`${width} ${mode} rail peek`, peek);
      await page.evaluate(() => { document.activeElement?.blur(); scrollTo({ top: 0, behavior: 'instant' }); });
      await page.screenshot({ path: path.join(output, `${width}-${mode}.png`), fullPage: true });
    }
  }
  await page.locator('[data-background-open]').click();
  check('Background stays separate from theme', await page.locator('#gary-background-lab').isVisible() && await page.locator('html').getAttribute('data-gary-theme') === 'light');
  await page.keyboard.press('Escape');
  check('Background Escape restores trigger', await page.locator('[data-background-open]').evaluate(el => el === document.activeElement));
  await page.emulateMedia({ media: 'print' });
  check('print expands all media', await rail.evaluate(el => getComputedStyle(el).display === 'block' && getComputedStyle(el).overflowX === 'visible'));
  await page.pdf({ path: path.join(output, 'interaction-lab.pdf'), format: 'A4', printBackground: true });
  check('no page or resource errors', errors.length === 0);

  const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noScript.goto(url);
  check('without JavaScript text and media remain readable', (await noScript.locator('#metric-value').innerText()) === '72.4%' && await noScript.locator('.gary-content-rail > li').count() === 3 && await noScript.locator('.lab-statement').isVisible());
  await noScript.close();
  fs.writeFileSync(path.join(output, 'target-browser-report.json'), JSON.stringify(targetBrowserReport, null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'acceptance.json'), JSON.stringify({ status: 'pass', checkedAt: new Date().toISOString(), url, checks, errors, targetBrowserReport, pendingUserJudgment: ['media-tilt', 'phrase-reveal'] }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'pass', checks: checks.length, output }));
} finally { await browser.close(); }
