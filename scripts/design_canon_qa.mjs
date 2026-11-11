// design-canon QA：验证对标规范页渲染。
// 断言：
//   1. 10 个维度区块全部渲染
//   2. Apple / Google 源卡各 10 张
//   3. 共识横幅 10 条、落地块 10 条
//   4. 无横向溢出（桌面/移动）
//   5. 无 pageerror / console error
// 同时输出桌面全页与移动首屏截图。
import { chromium } from 'file:///C:/AI/UI/gary-ui/adapters/visual/node_modules/playwright-core/index.mjs';
import { mkdirSync } from 'node:fs';

const PATH = 'file:///C:/AI/UI/gary-ui/examples/design-canon/index.html';
const CHROME = process.env.GARY_UI_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = 'C:/tmp/canon';
mkdirSync(OUT, { recursive: true });

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

await page.goto(PATH, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

const counts = await page.evaluate(() => ({
  dims: document.querySelectorAll('.dim').length,
  apple: document.querySelectorAll('.src.apple').length,
  google: document.querySelectorAll('.src.google').length,
  consensus: document.querySelectorAll('.consensus').length,
  landing: document.querySelectorAll('.landing').length,
  samples: document.querySelectorAll('.sample').length,
}));
check('10 个维度区块渲染', counts.dims === 10, `${counts.dims}`);
check('Apple / Google 源卡各 10', counts.apple === 10 && counts.google === 10, `A${counts.apple}/G${counts.google}`);
check('共识横幅 10 条', counts.consensus === 10, `${counts.consensus}`);
check('落地块 10 条', counts.landing === 10, `${counts.landing}`);
check('可视化示例存在', counts.samples >= 3, `${counts.samples}`);

const deskOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('桌面无横向溢出', deskOverflow <= 0, `overflow=${deskOverflow}`);

await page.screenshot({ path: `${OUT}/desktop-full.png`, fullPage: true });
await page.screenshot({ path: `${OUT}/desktop-hero.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
const mobOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('移动端无横向溢出', mobOverflow <= 0, `overflow=${mobOverflow}`);
await page.screenshot({ path: `${OUT}/mobile-hero.png` });

check('无 pageerror / console error', errors.length === 0, errors.join(' | ') || 'clean');

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
process.exit(failed.length ? 1 : 0);
