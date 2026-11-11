import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const executablePath = process.env.GARY_UI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const reports = [
  ['research-report', 'research-report.pdf'],
  ['proposal-presentation', 'proposal-presentation.pdf'],
];

const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu'] });
const results = [];
try {
  for (const [directory, filename] of reports) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light', reducedMotion: 'reduce' });
    const blocked = [];
    await context.route(/^https?:\/\//, route => { blocked.push(route.request().url()); route.abort(); });
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    const source = path.join(ROOT, 'examples', 'demos', directory, 'index.html');
    const output = path.join(ROOT, 'examples', 'demos', directory, filename);
    const url = new URL(pathToFileURL(source));
    url.searchParams.set('theme', 'light');
    await page.goto(url.href, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(800);
    await page.emulateMedia({ media: 'print', colorScheme: 'light', reducedMotion: 'reduce' });
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font:9px Segoe UI,sans-serif;color:#666;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      margin: { top: '12mm', right: '11mm', bottom: '14mm', left: '11mm' },
    });
    const size = fs.statSync(output).size;
    if (errors.length || size < 10000) throw new Error(`${directory}: ${errors.join(' | ') || `PDF too small (${size})`}`);
    results.push({ source, output, size, blockedExternalRequests: blocked });
    await context.close();
  }
} finally {
  await browser.close();
}

const evidence = path.join(ROOT, 'examples', 'demos', 'evidence', 'pdf-export.json');
fs.writeFileSync(evidence, `${JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), browser: executablePath, status: 'pass', results }, null, 2)}\n`);
console.log(JSON.stringify({ status: 'pass', reports: results.length, evidence }));
