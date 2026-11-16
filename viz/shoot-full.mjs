/**
 * viz/shoot-full.mjs — full-page capture for review (not the delivery gate).
 *
 *   node viz/shoot-full.mjs <out.html> <out.png>
 *
 * agent/checks/shoot.mjs captures the 1440×900 viewport only, which is the
 * correct delivery shot but hides everything below the first screen. This
 * helper renders the same page at the same width and captures the whole
 * document so every chart can be reviewed.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const [file, out] = process.argv.slice(2);
if (!file || !out) {
  console.error('用法: node viz/shoot-full.mjs <out.html> <out.png>');
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
await page.screenshot({ path: path.resolve(out), fullPage: true });
const box = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
await browser.close();
console.log(`WROTE ${path.resolve(out)} page=${box.w}x${box.h}`);
