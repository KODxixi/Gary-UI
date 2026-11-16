/**
 * 截图 · playwright-core + 本机 chromium 缓存
 *   node agent/checks/shoot.mjs <out.html> <out.png>
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const [file, out] = process.argv.slice(2);
if (!file || !out) {
  console.error('用法: node agent/checks/shoot.mjs <out.html> <out.png>');
  process.exit(2);
}

const exe = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright',
  'chromium-1248',
  'chrome-win64',
  'chrome.exe'
);

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: path.resolve(out), fullPage: false });
const title = await page.title();
await browser.close();
console.log(`WROTE ${path.resolve(out)} title="${title}"`);