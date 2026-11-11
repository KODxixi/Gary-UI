import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from 'playwright-core';


function browserCandidates() {
  const local = process.env.LOCALAPPDATA || '';
  const program = process.env.ProgramFiles || 'C:\\Program Files';
  const programX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  return [
    process.env.GARY_UI_CHROME,
    path.join(program, 'Google/Chrome/Application/chrome.exe'),
    path.join(programX86, 'Google/Chrome/Application/chrome.exe'),
    path.join(local, 'Google/Chrome/Application/chrome.exe'),
    path.join(program, 'Microsoft/Edge/Application/msedge.exe'),
    path.join(programX86, 'Microsoft/Edge/Application/msedge.exe'),
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
}


export function findBrowser() {
  return browserCandidates().find((candidate) => fs.existsSync(candidate)) || null;
}


function waitForVisual(page, timeout) {
  return page.waitForFunction(
    () => {
      if (window.__garyVisualReady === true || Boolean(window.__garyVisualError)) return true;
      if (document.querySelector('#chart, #markmap, #mermaid-target')) return false;
      const svg = document.querySelector('svg');
      return Boolean(svg?.firstElementChild);
    },
    null,
    { timeout },
  );
}


function artifactUrl(htmlPath, theme) {
  const url = new URL(pathToFileURL(htmlPath).href);
  if (theme === 'dark' || theme === 'light') url.searchParams.set('theme', theme);
  url.searchParams.set('embed', '1');
  return url.href;
}


async function serializeStandaloneSvg(page, theme) {
  return page.evaluate((themeName) => {
    const namespace = 'http://www.w3.org/2000/svg';
    const stage = document.querySelector('.gary-visual-stage, .diagram-container') || document.body;
    const mainDiagram = stage.matches('.diagram-container') ? stage.querySelector(':scope > svg') : null;
    const candidates = mainDiagram ? [mainDiagram] : Array.from(stage.querySelectorAll('svg')).filter((svg) => !svg.parentElement?.closest('svg'));
    if (!candidates.length) throw new Error('Rendered page does not contain an SVG');
    const presentation = [
      'color', 'fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width',
      'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity',
      'font-family', 'font-size', 'font-style', 'font-weight', 'letter-spacing',
      'text-anchor', 'dominant-baseline', 'paint-order', 'filter', 'clip-path',
      'mask', 'marker-start', 'marker-mid', 'marker-end', 'visibility', 'display',
    ];
    const inlineTree = (source, clone) => {
      const computed = getComputedStyle(source);
      for (const property of presentation) {
        const value = computed.getPropertyValue(property);
        if (value && value !== 'normal' && value !== 'auto') clone.setAttribute(property, value.trim());
      }
      Array.from(source.children).forEach((child, index) => {
        if (clone.children[index]) inlineTree(child, clone.children[index]);
      });
    };
    const cloneSvg = (source) => {
      const clone = source.cloneNode(true);
      inlineTree(source, clone);
      clone.setAttribute('xmlns', namespace);
      clone.setAttribute('data-theme', themeName);
      return clone;
    };
    const background = getComputedStyle(document.body).backgroundColor || (themeName === 'light' ? '#f6f2eb' : '#080808');

    if (candidates.length === 1) {
      const source = candidates[0];
      const clone = cloneSvg(source);
      const box = source.viewBox?.baseVal;
      if (!clone.getAttribute('viewBox')) {
        const rect = source.getBoundingClientRect();
        clone.setAttribute('viewBox', `0 0 ${Math.max(1, Math.ceil(rect.width))} ${Math.max(1, Math.ceil(rect.height))}`);
      }
      const viewBox = clone.getAttribute('viewBox')?.split(/\s+/).map(Number);
      if (viewBox?.length === 4) {
        clone.setAttribute('width', String(viewBox[2]));
        clone.setAttribute('height', String(viewBox[3]));
        const backdrop = document.createElementNS(namespace, 'rect');
        backdrop.setAttribute('x', String(viewBox[0]));
        backdrop.setAttribute('y', String(viewBox[1]));
        backdrop.setAttribute('width', String(viewBox[2]));
        backdrop.setAttribute('height', String(viewBox[3]));
        backdrop.setAttribute('fill', background);
        backdrop.setAttribute('data-gary-export-background', 'true');
        clone.insertBefore(backdrop, clone.firstChild);
      }
      clone.setAttribute('data-gary-export', 'standalone');
      return new XMLSerializer().serializeToString(clone);
    }

    const columns = Math.min(4, candidates.length);
    const tileWidth = 220;
    const tileHeight = 150;
    const rows = Math.ceil(candidates.length / columns);
    const root = document.createElementNS(namespace, 'svg');
    root.setAttribute('xmlns', namespace);
    root.setAttribute('viewBox', `0 0 ${columns * tileWidth} ${rows * tileHeight}`);
    root.setAttribute('width', String(columns * tileWidth));
    root.setAttribute('height', String(rows * tileHeight));
    root.setAttribute('data-gary-export', 'icon-board');
    root.setAttribute('data-theme', themeName);
    const backdrop = document.createElementNS(namespace, 'rect');
    backdrop.setAttribute('width', '100%');
    backdrop.setAttribute('height', '100%');
    backdrop.setAttribute('fill', background);
    root.append(backdrop);
    candidates.forEach((source, index) => {
      const x = (index % columns) * tileWidth;
      const y = Math.floor(index / columns) * tileHeight;
      const name = source.getAttribute('aria-label') || `icon-${index + 1}`;
      const group = document.createElementNS(namespace, 'g');
      group.setAttribute('transform', `translate(${x} ${y})`);
      group.setAttribute('data-gary-icon', name);
      const tile = document.createElementNS(namespace, 'rect');
      tile.setAttribute('x', '10');
      tile.setAttribute('y', '10');
      tile.setAttribute('width', String(tileWidth - 20));
      tile.setAttribute('height', String(tileHeight - 20));
      tile.setAttribute('rx', '24');
      tile.setAttribute('fill', themeName === 'light' ? '#f6f2eb' : '#111214');
      tile.setAttribute('stroke', themeName === 'light' ? '#c9c1b8' : '#32363d');
      group.append(tile);
      const icon = cloneSvg(source);
      icon.setAttribute('x', String((tileWidth - 48) / 2));
      icon.setAttribute('y', '34');
      icon.setAttribute('width', '48');
      icon.setAttribute('height', '48');
      group.append(icon);
      const label = document.createElementNS(namespace, 'text');
      label.setAttribute('x', String(tileWidth / 2));
      label.setAttribute('y', '112');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', themeName === 'light' ? '#221e1b' : '#f2f4f7');
      label.setAttribute('font-family', 'Helvetica Neue, Helvetica, Arial, Microsoft YaHei UI, Microsoft YaHei, 微软雅黑, sans-serif');
      label.setAttribute('font-size', '14');
      label.textContent = name;
      group.append(label);
      root.append(group);
    });
    return new XMLSerializer().serializeToString(root);
  }, theme);
}


export async function exportArtifact(htmlPath, targetPath, format, options = {}) {
  const executablePath = findBrowser();
  if (!executablePath) throw new Error('Chrome or Edge was not found');
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      reducedMotion: options.reducedMotion || 'reduce',
      colorScheme: options.theme || 'dark',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const timeout = options.timeout || 30000;
    await page.goto(artifactUrl(htmlPath, options.theme), { waitUntil: 'load', timeout });
    await waitForVisual(page, timeout);
    const renderError = await page.evaluate(() => window.__garyVisualError || null);
    if (renderError) throw new Error(renderError);
    if (errors.length) throw new Error(`Browser console error: ${errors.join(' | ')}`);

    if (format === 'png') {
      await page.locator('.visual-shell, body').first().screenshot({ path: targetPath });
    } else if (format === 'pdf') {
      await page.pdf({ path: targetPath, format: 'A4', landscape: true, printBackground: true });
    } else if (format === 'svg') {
      const svg = await serializeStandaloneSvg(page, options.theme || 'dark');
      fs.writeFileSync(targetPath, svg, 'utf8');
    } else {
      throw new Error(`Unsupported browser export format: ${format}`);
    }
    await context.close();
  } finally {
    await browser.close();
  }
}


export async function inspectArtifact(htmlPath, options = {}) {
  const executablePath = findBrowser();
  if (!executablePath) throw new Error('Chrome or Edge was not found');
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1440, height: 1000 },
      reducedMotion: options.reducedMotion || 'no-preference',
      colorScheme: options.theme || 'dark',
      offline: Boolean(options.offline),
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    const timeout = options.timeout || 30000;
    await page.goto(artifactUrl(htmlPath, options.theme), { waitUntil: 'load', timeout });
    await waitForVisual(page, timeout);
    const result = await page.evaluate(() => ({
      title: document.title,
      ready: window.__garyVisualReady === true || Boolean(document.querySelector('svg')?.firstElementChild),
      renderError: window.__garyVisualError || null,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      svgCount: document.querySelectorAll('svg').length,
      textLength: document.body.innerText.length,
      theme: document.documentElement.dataset.garyTheme || document.documentElement.dataset.theme || null,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    }));
    await context.close();
    return { ...result, consoleErrors };
  } finally {
    await browser.close();
  }
}
