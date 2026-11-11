// morph-icons QA：真实 Chrome + playwright-core 驱动 morph-icons 演示页。
// 验证产物：patterns/shared/morph-icons.js（默认图标机制，Gary-UI × morphicons）。
// 断言：静态渲染 / morph 动画中间帧 / settle=canonical / 命令式 morphTo / 受控 seek /
//       reduced-motion 活策略（always 直切）/ 无页面错误。
// 用法：先起静态服务器（python -m http.server 4173 --directory <gary-ui 根>），
//       再 node scripts/morph_icons_qa.mjs。
// 环境变量：MORPH_URL（默认 http://127.0.0.1:4173/examples/morph-icons/index.html）、
//          GARY_UI_CHROME（默认 C:/Program Files/Google/Chrome/Application/chrome.exe）。
import { chromium } from 'file:///C:/AI/UI/gary-ui/adapters/visual/node_modules/playwright-core/index.mjs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const URL = process.env.MORPH_URL || 'http://127.0.0.1:4173/examples/morph-icons/index.html';
const CHROME = process.env.GARY_UI_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
const httpBad = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('response', (r) => { if (r.status() >= 400) httpBad.push(`${r.status()} ${r.url()}`); });
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const canon = await page.evaluate(() => {
  const d = (name) => {
    const t = document.createElement('div');
    GaryIcons.set(t, name);
    return t.querySelector('path').getAttribute('d');
  };
  return { x: d('x'), menu: d('menu') };
});

const first = await page.evaluate(() => {
  const btn = document.querySelector('[data-gary-icon="menu"]');
  const svg = btn?.querySelector('svg.gary-icon');
  const path = svg?.querySelector('path');
  return { hasSvg: !!svg, d: path?.getAttribute('d') || '', hasAria: btn?.getAttribute('aria-label') || '', hasHidden: !!btn?.querySelector('.gary-visually-hidden') };
});
check('静态渲染：svg+path+d 非空', first.hasSvg && first.d.length > 0);
check('a11y：aria-label + visually-hidden', !!first.hasAria && first.hasHidden);

const menuBtn = page.locator('[data-gary-icon="menu"][data-gary-icon-to="x"]').first();
await menuBtn.click();
await page.waitForTimeout(70);
const mid = await page.evaluate(() => document.querySelector('[data-gary-icon="menu"][data-gary-icon-to="x"]')?.querySelector('path')?.getAttribute('d') || '');
check('morph 动画：飞行中为中间帧', mid !== canon.menu && mid !== canon.x);
await page.waitForTimeout(700);
const settled = await page.evaluate(() => document.querySelector('[data-gary-icon="menu"][data-gary-icon-to="x"]')?.querySelector('path')?.getAttribute('d') || '');
check('settle：最终 d = 目标 canonical d', settled === canon.x);
await menuBtn.click();
await page.waitForTimeout(700);

await page.evaluate(() => GaryIcons.morphTo(document.getElementById('wander'), 'bell'));
await page.waitForTimeout(600);
const wanderD = await page.evaluate(() => document.getElementById('wander')?.querySelector('path')?.getAttribute('d') || '');
const bellCanon = await page.evaluate(() => {
  const t = document.createElement('div'); GaryIcons.set(t, 'bell'); return t.querySelector('path').getAttribute('d');
});
check('命令式：morphTo(wander, bell) settle = bell canonical', wanderD === bellCanon);

const scrubState = await page.evaluate(() => {
  const icon = document.getElementById('scrub-icon');
  GaryIcons.seek(icon, 'arrow-down', 0.5);
  const d = icon.querySelector('path').getAttribute('d');
  return { d, stable: d === icon.querySelector('path').getAttribute('d') };
});
const arrowCanon = await page.evaluate(() => {
  const ta = document.createElement('div'); GaryIcons.set(ta, 'arrow-right'); const a = ta.querySelector('path').getAttribute('d');
  const tb = document.createElement('div'); GaryIcons.set(tb, 'arrow-down'); const b = tb.querySelector('path').getAttribute('d');
  return { a, b };
});
check('受控 scrub：冻结中间帧且稳定', scrubState.stable && scrubState.d !== arrowCanon.a && scrubState.d !== arrowCanon.b);

await page.evaluate(() => GaryIcons.policy(document.getElementById('policy-icon'), 'always'));
const policyIcon = page.locator('#policy-icon');
await policyIcon.click();
const instantD = await page.evaluate(() => document.getElementById('policy-icon')?.querySelector('path')?.getAttribute('d') || '');
const xCanon2 = await page.evaluate(() => { const t = document.createElement('div'); GaryIcons.set(t, 'x'); return t.querySelector('path').getAttribute('d'); });
check('reduced-motion=always：点击直切（无中间帧）', instantD === xCanon2);
await page.waitForTimeout(400);
const afterWait = await page.evaluate(() => document.getElementById('policy-icon')?.querySelector('path')?.getAttribute('d') || '');
check('always 策略无动画残留', afterWait === xCanon2);

const realErrors = errors.filter((e) => !/404|favicon/i.test(e));
const realHttpBad = httpBad.filter((u) => !/favicon/i.test(u));
check('无 pageerror / console error / 资源 404', realErrors.length === 0 && realHttpBad.length === 0, [...realErrors, ...realHttpBad].join(' | ') || 'clean');

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
process.exit(failed.length ? 1 : 0);
