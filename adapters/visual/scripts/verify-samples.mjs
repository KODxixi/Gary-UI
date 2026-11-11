import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';

import { findBrowser } from '../lib/exporter.mjs';


const adapterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(adapterRoot, '..', '..');
const outputRoot = path.join(projectRoot, 'examples', 'visuals', 'outputs');
const evidenceRoot = path.join(projectRoot, 'examples', 'visuals', 'evidence');
const baseUrl = process.argv[2] || 'http://127.0.0.1:8878';
fs.mkdirSync(evidenceRoot, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'examples', 'visuals', 'visuals.json'), 'utf8'));
const executablePath = findBrowser();
if (!executablePath) throw new Error('Chrome or Edge was not found');

const browser = await chromium.launch({ executablePath, headless: true });
const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  browser: executablePath,
  baseUrl,
  portal: [],
  servedArtifacts: [],
  offlineArtifacts: [],
};

async function capturePortal(name, viewport, options = {}) {
  const context = await browser.newContext({
    viewport,
    colorScheme: options.theme || 'dark',
    reducedMotion: options.reducedMotion || 'no-preference',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  const response = await page.goto(`${baseUrl}/portal/#visuals`, { waitUntil: 'networkidle' });
  await page.locator('[data-view="visuals"]:not([hidden])').waitFor();
  if (options.theme === 'light') {
    await page.locator('.display-summary').click();
    await page.locator('#theme-toggle').click();
  }
  if (options.pageScale) {
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: options.pageScale });
  }
  const frame = page.frames().find((candidate) => candidate.url().includes('/examples/visuals/outputs/index.html'));
  if (!frame) throw new Error('Visual sample iframe did not attach');
  await frame.locator('body').waitFor();
  const screenshot = path.join(evidenceRoot, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  const state = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    cssLoaded: getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim(),
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  report.portal.push({
    name,
    viewport,
    pageScale: options.pageScale || 1,
    status: response?.status() || null,
    iframeLoaded: (await frame.locator('body').innerText()).length > 100,
    sampleCards: await frame.locator('article').count(),
    screenshot,
    consoleErrors,
    ...state,
  });
  await context.close();
}

await capturePortal('portal-desktop-dark', { width: 1440, height: 1000 });
await capturePortal('portal-tablet-light', { width: 768, height: 900 }, { theme: 'light' });
await capturePortal('portal-mobile-dark', { width: 390, height: 844 });
await capturePortal('portal-reduced-motion', { width: 1440, height: 1000 }, { reducedMotion: 'reduce' });
await capturePortal('portal-200-percent', { width: 768, height: 900 }, { pageScale: 2 });

for (const visual of manifest.visuals) {
  const servedContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: visual.theme,
    reducedMotion: 'reduce',
  });
  const servedPage = await servedContext.newPage();
  const servedErrors = [];
  servedPage.on('console', (message) => {
    if (message.type() === 'error') servedErrors.push(message.text());
  });
  servedPage.on('pageerror', (error) => servedErrors.push(error.message));
  const servedResponse = await servedPage.goto(
    `${baseUrl}/examples/visuals/outputs/${encodeURIComponent(visual.id)}.html`,
    { waitUntil: 'load' },
  );
  await servedPage.waitForFunction(() => {
    if (window.__garyVisualReady === true || window.__garyVisualError) return true;
    const svg = document.querySelector('svg');
    return Boolean(svg?.firstElementChild);
  });
  report.servedArtifacts.push({
    id: visual.id,
    status: servedResponse?.status() || null,
    ready: await servedPage.evaluate(() => (
      window.__garyVisualReady === true || Boolean(document.querySelector('svg')?.firstElementChild)
    )),
    renderError: await servedPage.evaluate(() => window.__garyVisualError || null),
    consoleErrors: servedErrors,
  });
  await servedContext.close();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    colorScheme: visual.theme,
    reducedMotion: 'reduce',
    offline: true,
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  await page.goto(pathToFileURL(path.join(outputRoot, `${visual.id}.html`)).href, { waitUntil: 'load' });
  await page.waitForFunction(() => {
    if (window.__garyVisualReady === true || window.__garyVisualError) return true;
    const svg = document.querySelector('svg');
    return Boolean(svg?.firstElementChild);
  });
  const state = await page.evaluate(() => ({
    ready: window.__garyVisualReady === true || Boolean(document.querySelector('svg')?.firstElementChild),
    renderError: window.__garyVisualError || null,
    svgCount: document.querySelectorAll('svg').length,
    textLength: document.body.innerText.length,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    externalResources: Array.from(document.querySelectorAll('script[src], link[rel="stylesheet"][href], img[src]'))
      .map((node) => node.getAttribute('src') || node.getAttribute('href'))
      .filter((value) => /^https?:/i.test(value || '')),
  }));
  report.offlineArtifacts.push({ id: visual.id, tool: visual.tool, consoleErrors, ...state });
  await context.close();
}

await browser.close();
report.status = report.portal.every((item) => (
  item.status === 200
  && item.iframeLoaded
  && item.sampleCards === manifest.visuals.length
  && item.consoleErrors.length === 0
  && item.cssLoaded === '44px'
)) && report.offlineArtifacts.every((item) => (
  item.ready
  && !item.renderError
  && item.svgCount > 0
  && item.textLength > 50
  && item.reducedMotion
  && item.externalResources.length === 0
  && item.consoleErrors.length === 0
)) && report.servedArtifacts.every((item) => (
  item.status === 200
  && item.ready
  && !item.renderError
  && item.consoleErrors.length === 0
)) ? 'pass' : 'fail';

const reportPath = path.join(evidenceRoot, 'browser-report.json');
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
process.stdout.write(`${JSON.stringify({ status: report.status, report: reportPath }, null, 2)}\n`);
process.exitCode = report.status === 'pass' ? 0 : 1;
