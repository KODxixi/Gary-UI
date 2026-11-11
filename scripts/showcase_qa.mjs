// showcase QA：验证完整产品页的自适应圆角机制与图标渲染。
// 断言：
//   1. 每个 [data-gary-icon] 都注入了 svg（无遗漏/无缺图标）
//   2. 每个 [data-gary-radius] 都由 JS 算出 --gary-radius
//   3. 卡片四角半径相等（方形角，非椭圆）
//   4. 圆角跟随卡片自身宽度：bento 大格 > 小格
//   5. 视口收缩：桌面圆角 > 移动圆角
//   6. 无横向溢出 / 无 pageerror
// 用法：先起静态服务器（python -m http.server 4173 --directory <gary-ui 根>），
//       node scripts/showcase_qa.mjs
import { chromium } from 'file:///C:/AI/UI/gary-ui/adapters/visual/node_modules/playwright-core/index.mjs';

const URL = process.env.SHOWCASE_URL || 'http://127.0.0.1:4173/examples/showcase/index.html';
const CHROME = process.env.GARY_UI_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  · ' + detail : ''}`);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// 1. 图标全部注入
const icons = await page.evaluate(() => {
  const hosts = [...document.querySelectorAll('[data-gary-icon]')];
  const missing = hosts.filter((h) => !h.querySelector('svg')).map((h) => h.getAttribute('data-gary-icon'));
  return { total: hosts.length, missing };
});
check('morph 图标全部注入', icons.total > 30 && icons.missing.length === 0, `${icons.total} icons` + (icons.missing.length ? ` · 缺失: ${icons.missing.join(',')}` : ''));

// 2. 自适应圆角全部计算
const radii = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-gary-radius]')];
  const missing = els.filter((e) => !e.style.getPropertyValue('--gary-radius'));
  return {
    total: els.length,
    missingCount: missing.length,
    sample: els.slice(0, 3).map((e) => e.style.getPropertyValue('--gary-radius').trim())
  };
});
check('自适应圆角 JS 全部生效', radii.total >= 17 && radii.missingCount === 0, `${radii.total} 卡 · ${radii.sample.join(' / ')}`);

// 3. 四角半径相等（方形角）
const square = await page.evaluate(() => {
  const els = [...document.querySelectorAll('[data-gary-radius]')];
  const bad = els.map((e) => {
    const cs = getComputedStyle(e);
    const vals = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomLeftRadius, cs.borderBottomRightRadius].map((v) => parseFloat(v));
    const spread = Math.max(...vals) - Math.min(...vals);
    return { key: e.getAttribute('data-gary-radius'), spread, min: Math.min(...vals) };
  }).filter((x) => x.spread > 2);
  return { badCount: bad.length, bad: bad.slice(0, 3) };
});
check('所有卡片为方形角（四角相等）', square.badCount === 0, square.badCount ? `偏差: ${JSON.stringify(square.bad)}` : 'spread ≤ 2px');

// 4. 圆角跟随自身宽度：bento 大格 vs 小格
const follow = await page.evaluate(() => {
  const big = document.querySelector('.feature.span-2');
  const small = document.querySelector('.feature:not(.span-2)');
  const r = (e) => parseFloat(e.style.getPropertyValue('--gary-radius'));
  return { big: r(big), small: r(small), bigW: big.getBoundingClientRect().width, smallW: small.getBoundingClientRect().width };
});
check('圆角跟随卡片自身宽度（大格>小格）', follow.big > follow.small, `大 ${follow.bigW.toFixed(0)}px→${follow.big}px · 小 ${follow.smallW.toFixed(0)}px→${follow.small}px`);

// 5. 视口收缩：桌面 vs 移动
const deskR = follow.big;
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobR = await page.evaluate(() => {
  const f = document.querySelector('.feature.span-2') || document.querySelector('.feature');
  return parseFloat(f.style.getPropertyValue('--gary-radius'));
});
check('窄屏圆角收缩', mobR < deskR, `desktop=${deskR}px mobile=${mobR}px`);

// 6. 无横向溢出 + 无错误
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('移动端无横向溢出', overflow <= 0, `overflow=${overflow}px`);
check('无 pageerror / console error', errors.length === 0, errors.join(' | ') || 'clean');

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
process.exit(failed.length ? 1 : 0);
