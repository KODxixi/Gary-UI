import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const outputRoot = path.join(ROOT, 'examples', 'visuals', 'outputs');
const evidenceRoot = path.join(ROOT, 'examples', 'demos', 'evidence', 'export-integrity');
const executablePath = process.env.GARY_UI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu'] });
const results = [];
try {
  for (const file of fs.readdirSync(outputRoot).filter(name => name.endsWith('.svg')).sort()) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(pathToFileURL(path.join(outputRoot, file)).href, { waitUntil: 'load', timeout: 30000 });
    const metrics = await page.evaluate(() => {
      const svg = document.querySelector('svg');
      const box = svg?.getBoundingClientRect();
      const graphics = svg?.querySelectorAll('path,rect,circle,line,polyline,polygon,text,g').length || 0;
      const background = svg?.querySelector('[data-gary-export-background]')?.getAttribute('fill') || null;
      return { width: Math.round(box?.width || 0), height: Math.round(box?.height || 0), graphics, textLength: svg?.textContent?.trim().length || 0, iconCount: svg?.querySelectorAll('[data-gary-icon]').length || 0, background };
    });
    const ok = metrics.width >= 200 && metrics.height >= 120 && metrics.graphics >= 3 && errors.length === 0;
    const row = { file, ok, metrics, errors };
    results.push(row);
    if (['architecture.svg', 'icons.svg'].includes(file)) await page.screenshot({ path: path.join(evidenceRoot, `standalone-${path.basename(file, '.svg')}.png`), fullPage: false, timeout: 15000 });
    await context.close();
  }
} finally {
  await browser.close();
}
const failed = results.filter(result => !result.ok);
const report = { schemaVersion: 1, generatedAt: new Date().toISOString(), browser: executablePath, summary: { checks: results.length, passed: results.length - failed.length, failed: failed.length }, results };
const target = path.join(evidenceRoot, 'standalone-svg-report.json');
fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report.summary, evidence: target }));
if (failed.length) process.exitCode = 1;
