// typography-demo QA：验证 tokens 1.4 排版与审美升级。
// 断言：Space Grotesk 加载 / tinted neutrals(oklch) / display 字族 / fluid 刻度随视口缩放 /
//       sidebar 桌面并排+移动堆叠 / 无横向溢出 / 无页面错误。
// 用法：先起静态服务器（python -m http.server 4173 --directory <gary-ui 根>），
//       再 node scripts/typography_qa.mjs。
import { chromium } from 'file:///C:/AI/UI/gary-ui/adapters/visual/node_modules/playwright-core/index.mjs';

const URL = process.env.TYPO_URL || 'http://127.0.0.1:4173/examples/typography-demo/index.html';
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
await page.waitForTimeout(900);

const fonts = await page.evaluate(() => {
  const checks = ['700 48px "Space Grotesk"', '500 24px "Space Grotesk"'].map((f) => document.fonts.check(f));
  return { allLoaded: checks.every(Boolean) };
});
check('Space Grotesk 字体已加载', fonts.allLoaded);

const tinted = await page.evaluate(() => {
  const s = getComputedStyle(document.documentElement);
  return {
    page: s.getPropertyValue('--gary-surface-page').trim(),
    text: s.getPropertyValue('--gary-text-primary').trim(),
  };
});
check('中性色带 accent 色相（oklch 255）', /oklch\(0\.145 0\.012 255\)/.test(tinted.page), tinted.page);
check('text-primary 为 tinted 白', tinted.text.startsWith('oklch(0.97'), tinted.text);

const heroFont = await page.evaluate(() => getComputedStyle(document.querySelector('.hero h1')).fontFamily);
check('hero 标题用 Space Grotesk', /Space Grotesk/.test(heroFont));

const h1Desktop = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize));
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const h1Mobile = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.hero h1')).fontSize));
check('流体字号随视口缩放（桌面≠移动）', h1Mobile < h1Desktop, `desktop=${h1Desktop}px mobile=${h1Mobile}px`);

await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);
const sidebarDesktop = await page.evaluate(() => {
  const c = document.querySelector('.gary-l-sidebar');
  return Math.abs(c.children[0].getBoundingClientRect().top - c.children[1].getBoundingClientRect().top) < 2;
});
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const sidebarMobile = await page.evaluate(() => {
  const c = document.querySelector('.gary-l-sidebar');
  return c.children[1].getBoundingClientRect().top > c.children[0].getBoundingClientRect().bottom - 2;
});
check('sidebar 桌面两栏并排', sidebarDesktop);
check('sidebar 移动自动堆叠', sidebarMobile);

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('移动端无横向溢出', overflow <= 0, `overflow=${overflow}px`);
check('无 pageerror / console error', errors.length === 0, errors.join(' | ') || 'clean');

// 8. 圆角 = 6cqi × 所在布局列宽（方形角，随列宽缩放）——像素级验证：
//    a) 方形角：宽扁表格卡（578×208）的 x/y 轴圆角命中距离应接近（% 圆角会 x=32/y=14 明显分离）
//    b) 随列宽：移动端 sidebar 卡圆角 < 桌面（桌面命中 clamp 32px 上限）
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(300);
const tableCorner = await page.evaluate(() => {
  const el = document.querySelectorAll('.card')[2]; // 表格卡（padding:0）
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  const xHit = (() => { for (let d = 2; d <= 64; d++) { const p = document.elementFromPoint(r.left + d, r.top + 2); if (p && (p === el || el.contains(p))) return d; } return null; })();
  const yHit = (() => { for (let d = 2; d <= 64; d++) { const p = document.elementFromPoint(r.left + 2, r.top + d); if (p && (p === el || el.contains(p))) return d; } return null; })();
  return { w: r.width, h: r.height, xHit, yHit };
});
check('宽扁卡片圆角为方形角（x≈y，非椭圆）', tableCorner.xHit !== null && tableCorner.yHit !== null && Math.abs(tableCorner.xHit - tableCorner.yHit) <= 4, `x=${tableCorner.xHit}px y=${tableCorner.yHit}px`);

const deskRadius = await page.evaluate(() => {
  const el = document.querySelector('.gary-l-sidebar .card');
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  let hit = null;
  for (let d = 2; d <= 64; d++) { const p = document.elementFromPoint(r.left + d * 0.7071, r.top + d * 0.7071); if (p && (p === el || el.contains(p))) { hit = d; break; } }
  return hit === null ? NaN : 2.414 * hit;
});
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const mobRadius = await page.evaluate(() => {
  const el = document.querySelector('.gary-l-sidebar .card');
  el.scrollIntoView({ block: 'center', inline: 'nearest' });
  const r = el.getBoundingClientRect();
  let hit = null;
  for (let d = 2; d <= 64; d++) { const p = document.elementFromPoint(r.left + d * 0.7071, r.top + d * 0.7071); if (p && (p === el || el.contains(p))) { hit = d; break; } }
  return hit === null ? NaN : 2.414 * hit;
});
check('圆角随列宽缩放（移动列窄 → 圆角小）', mobRadius < deskRadius, `desktop=${deskRadius.toFixed(1)}px mobile=${mobRadius.toFixed(1)}px`);

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
process.exit(failed.length ? 1 : 0);
