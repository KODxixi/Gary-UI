import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const base = process.env.GARY_UI_BASE_URL || 'http://127.0.0.1:4191/';
const output = process.env.GARY_UI_CAPTURE_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'gary-transfer-'));
const policy = JSON.parse(fs.readFileSync(new URL('../spec/chart-recipes.json', import.meta.url), 'utf8'));
const cases = JSON.parse(fs.readFileSync(new URL('../examples/demo0909/cases.json', import.meta.url), 'utf8')).types;
const types = ['combo', 'waterfall', 'donut', 'radar', 'rose'];
const widths = [1440, 390, 320], themes = ['dark', 'light'];
const checks = [], failures = [], errors = [], artifacts = [], labelMeasurements = [];
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.GARY_UI_CHROME || chromium.executablePath() });
let page, report;
const check = (name, ok, detail) => ok ? checks.push(name) : failures.push({ name, detail });
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const settle = page => page.evaluate(async () => { await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
const artifact = file => { artifacts.push(file); return path.join(output, file); };
async function theme(value) {
  if (await page.locator('html').getAttribute('data-gary-theme') !== value) await page.locator('[data-theme-toggle]').click();
  await settle(page);
}
const browserReport = () => page.evaluate(() => ({ schemaVersion: 1, source: 'real-browser', targetStack: 'html', url: location.href, styleEntry: 'tokens/base.css', styleEntryLoaded: performance.getEntriesByType('resource').some(r => new URL(r.name).pathname.endsWith('/tokens/base.css')), computedStyle: { property: '--gary-control-height', value: getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim() }, sceneCount: document.querySelectorAll('.gary-scene').length, nestedGlassCount: document.querySelectorAll('[data-gary-material="glass"] [data-gary-material="glass"]').length, consoleErrors: 0 }));

// Compare mounted/downloaded SVG trees, ignoring only unique IDs and root sizing CSS.
function svgSnapshot({ selector, type, config, theme }) {
  const svg = selector ? document.querySelector(selector) : GaryChartRecipes.render(type, config, { policy: Gary0909Charts.policy, theme });
  if (!svg) throw new Error(`Missing SVG: ${selector || type}`);
  const normalize = value => value.replace(/gary-chart-recipe-\d+/g, 'gary-chart-recipe-ID');
  const nodes = [svg, ...svg.querySelectorAll('*')].map(node => ({
    tag: node.localName,
    attrs: [...node.attributes].filter(a => !(node === svg && ['style', 'xmlns'].includes(a.name))).map(a => [a.name, normalize(a.value)]).sort((a, b) => a[0].localeCompare(b[0])),
    text: ['text', 'title', 'desc'].includes(node.localName) ? node.textContent : ''
  }));
  const text = [...svg.querySelectorAll('text')].map(node => node.textContent), clipped = [], sizes = [];
  if (svg.isConnected) {
    const canvas = svg.getBoundingClientRect();
    for (const node of svg.querySelectorAll('text')) {
      const b = node.getBoundingClientRect(), m = node.getScreenCTM();
      sizes.push(parseFloat(getComputedStyle(node).fontSize) * Math.min(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)));
      if (b.left < canvas.left - 1 || b.top < canvas.top - 1 || b.right > canvas.right + 1 || b.bottom > canvas.bottom + 1) clipped.push({ text: node.textContent, x: b.x, y: b.y, width: b.width, height: b.height });
    }
  }
  return { nodes, text, title: svg.querySelector('title')?.textContent, background: svg.querySelector('rect')?.getAttribute('fill'), minFont: sizes.length ? Math.min(...sizes) : null, clipped, sourceWidth: svg.viewBox.baseVal.width, hasScript: !!svg.querySelector('script, foreignObject') };
}

// Independent values verify page wiring; renderer geometry is covered by its separate suite.
function expectedRows(type, c) {
  if (type === 'combo') return c.categories.map((label, i) => [label, c.bar.values[i], c.line.values[i] === null ? '缺测' : c.line.values[i]]);
  if (type === 'waterfall') {
    const totalAt = i => c.items.slice(0, i + 1).reduce((sum, item) => sum + item.value, 0);
    return [...c.items.map((item, i) => [item.label, item.value, totalAt(i)]), [c.totalLabel, '总计', totalAt(c.items.length - 1)], ...(c.scenarios || []).map(item => [item.label, '独立情景', item.value])];
  }
  if (type === 'donut') {
    const total = c.items.reduce((sum, item) => sum + item.value, 0);
    return c.items.map(item => { const value = item.value / total * 100; return [item.label, item.value, value > 0 && value < .1 ? '<0.1%' : `${Number(value.toFixed(1))}%`]; });
  }
  if (type === 'radar') return c.dimensions.map((d, i) => [d.label, d.unit, d.min, d.max, c.values[i], ...(c.reference ? [c.reference[i]] : [])]);
  return c.items.map(item => [item.label, item.value, c.max]);
}
async function inspectCase(type, item, label) {
  const actual = await page.evaluate(type => {
    const table = document.querySelector(`[data-study-table="${type}"] table`);
    return {
      selected: Gary0909Charts.selected.get(type)?.id,
      config: JSON.parse(document.querySelector(`[data-case-source="${type}"]`).textContent),
      question: document.querySelector(`[data-case-question="${type}"]`).textContent,
      rationale: document.querySelector(`[data-case-rationale="${type}"]`).textContent,
      takeaway: document.querySelector(`[data-case-takeaway="${type}"]`)?.textContent,
      caption: table.caption.textContent,
      rows: [...table.tBodies[0].rows].map(row => [...row.cells].map(cell => cell.hasAttribute('data-raw-value') ? Number(cell.dataset.rawValue) : cell.textContent)),
      semantics: [...table.tHead.rows[0].cells].every(cell => cell.tagName === 'TH' && cell.scope === 'col') && [...table.tBodies[0].rows].every(row => row.cells[0].tagName === 'TH' && row.cells[0].scope === 'row')
    };
  }, type);
  check(`${label} input and narrative synchronized`, actual.selected === item.id && same(actual.config, item.config) && actual.question === item.question && actual.rationale === item.rationale && (actual.takeaway === undefined || actual.takeaway === item.takeaway), actual);
  check(`${label} table matches complete source values`, same(actual.rows, expectedRows(type, item.config)) && actual.semantics && actual.caption.includes(item.config.meta.source), { actual: actual.rows, expected: expectedRows(type, item.config) });
  const observed = await page.evaluate(svgSnapshot, { selector: `[data-study-chart="${type}"] svg` });
  const rendered = await page.evaluate(svgSnapshot, { type, config: item.config, theme: await page.locator('html').getAttribute('data-gary-theme') });
  check(`${label} mounted SVG matches current config and policy`, same(observed.nodes, rendered.nodes), { title: observed.title });
  check(`${label} visible metadata retained`, [item.config.meta.title, item.config.meta.unit, item.config.meta.source].every(value => observed.text.join('').replace(/\s/g, '').includes(value.replace(/\s/g, ''))), observed.text);
  check(`${label} rendered labels meet minimum and fit canvas`, observed.minFont >= policy.typography.minRenderedPx && observed.clipped.length === 0, { minFont: observed.minFont, clipped: observed.clipped });
  labelMeasurements.push({ label, minRenderedPx: observed.minFont, sourceWidth: observed.sourceWidth });
  return observed;
}
const channels = color => color.startsWith('#') ? color.slice(1).match(/../g).map(n => parseInt(n, 16)) : color.match(/[\d.]+/g).slice(0, 3).map(Number);
const luminance = color => channels(color).map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
async function inspectColors(label, value) {
  const actual = await page.evaluate(() => ({
    palettes: [...document.querySelectorAll('[data-palette]')].map(card => ({ id: card.dataset.palette, roles: [...card.querySelectorAll('[data-color-role]')].map(mark => ({ role: mark.dataset.colorRole, fill: getComputedStyle(mark).backgroundColor, foreground: getComputedStyle(mark).color, code: mark.parentElement.querySelector('code').textContent, text: mark.textContent })) })),
    states: [...document.querySelector('[data-state-palette]').children].map(node => ({ text: node.textContent, glyph: node.querySelector('.status-sign')?.textContent, color: getComputedStyle(node).color })),
    catalog: [...document.querySelectorAll('[data-recipe-catalog] tbody tr')].map(row => [...row.cells].map(cell => cell.textContent))
  }));
  const rgb = hex => `rgb(${channels(hex).join(', ')})`, c = policy.themes[value], expected = Object.entries(policy.colorSystem.palettes);
  check(`${label} four palettes use current policy role colors`, expected.length === 4 && same(actual.palettes.map(p => p.id), expected.map(([id]) => id)) && actual.palettes.every(p => same(p.roles.map(mark => mark.role), policy.colorSystem.palettes[p.id].roles) && p.roles.every(mark => mark.fill === rgb(c[mark.role]) && mark.code === c[mark.role] && mark.text)), actual.palettes);
  check(`${label} filled labels have required contrast`, actual.palettes.every(p => p.roles.every(mark => contrast(mark.foreground, mark.fill) >= policy.contrast.normalTextMin)), actual.palettes.flatMap(p => p.roles.map(mark => ({ role: mark.role, ratio: contrast(mark.foreground, mark.fill) }))));
  const states = Object.values(policy.colorSystem.semanticStates);
  check(`${label} five states retain names glyphs and colors`, actual.states.length === 5 && states.every((state, i) => actual.states[i].text.includes(state.label) && actual.states[i].glyph && actual.states[i].color === rgb(c[state.role])), actual.states);
  check(`${label} primary and category marks meet contrast`, ['primary', 'secondary', 'reference', 'negative', 'neutral', ...policy.colorSystem.palettes.categorical8.roles].every(role => contrast(c[role], c.background) >= policy.contrast.essentialMarksMin));
  const levels = policy.colorSystem.palettes.sequential7.roles.map(role => luminance(c[role]));
  check(`${label} sequential seven levels have declared luminance order`, levels.length === 7 && levels.slice(1).every((n, i) => value === 'dark' ? n > levels[i] : n < levels[i]), levels);
  const rows = policy.families.map(f => [f.label, f.question, policy.colorSystem.familyMapping[f.id]?.rule, f.engine.startsWith('svg-reference:') ? '本页 SVG 参考' : f.id === 'table' ? '原生 HTML 表格' : '既有图表工具']);
  const colorReferenceExists = name => name === 'single' || !!policy.colorSystem.palettes[name] || !!name.split('.').reduce((value, key) => value?.[key], policy.colorSystem);
  const validMappings = Object.values(policy.colorSystem.familyMapping).every(mapping => mapping.rule && c[mapping.defaultRole] && (mapping.palette === 'conditional' ? mapping.choices?.length && mapping.choices.every(colorReferenceExists) : colorReferenceExists(mapping.palette)));
  check(`${label} catalog and color mapping cover 17 families`, rows.length === 17 && same(actual.catalog, rows) && same(Object.keys(policy.colorSystem.familyMapping).sort(), policy.families.map(f => f.id).sort()) && validMappings, actual.catalog);
}
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(new URL('demo0909.html?theme=dark', base).href, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Gary0909Charts?.selected.size === 5); await settle(page);
  report = await browserReport();
  check('five mounted types and ten selectable domain cases', same(await page.locator('[data-study-chart]').evaluateAll(nodes => nodes.map(n => n.dataset.studyChart)), types) && types.every(type => cases[type].length === 2) && await page.locator('[data-case-select] option').count() === 10);
  check('page policy and cases match checked local inputs', await page.evaluate(({ policy, cases }) => JSON.stringify(Gary0909Charts.policy) === JSON.stringify(policy) && JSON.stringify(Gary0909Charts.cases) === JSON.stringify(cases), { policy, cases }));
  const core = await page.evaluate(() => {
    const { policy, cases } = Gary0909Charts, options = { policy, theme: 'dark' };
    const throws = action => { try { action(); return false; } catch { return true; } };
    const invalid = structuredClone(cases.combo[0].config); invalid.bar.values[0] = NaN;
    const zero = structuredClone(cases.donut[0].config); zero.items.forEach(item => item.value = 0);
    const zeroTable = GaryChartRecipes.table('donut', zero);
    const missing = cases.combo[1].config, svg = GaryChartRecipes.render('combo', missing, options);
    const runs = []; let count = 0;
    for (const value of missing.line.values) { if (value === null) { if (count) runs.push(count); count = 0; } else count++; }
    if (count) runs.push(count);
    const segments = [...svg.querySelectorAll('polyline')].filter(line => line.getAttribute('stroke') === policy.themes.dark[missing.line.role || 'reference']).map(line => line.points.numberOfItems);
    const negative = cases.waterfall[1].config, total = negative.items.reduce((sum, item) => sum + item.value, 0);
    const waterfall = GaryChartRecipes.render('waterfall', negative, options), table = GaryChartRecipes.table('waterfall', negative);
    const first = GaryChartRecipes.render('combo', cases.combo[0].config, options), second = GaryChartRecipes.render('combo', cases.combo[0].config, options);
    const firstIDs = new Set([...first.querySelectorAll('[id]')].map(node => node.id)), secondIDs = [...second.querySelectorAll('[id]')].map(node => node.id);
    return {
      nanRejected: throws(() => GaryChartRecipes.validate('combo', invalid)),
      zeroRenderRejectedTableAvailable: throws(() => GaryChartRecipes.render('donut', zero, options)) && zeroTable.tBodies[0].rows.length === zero.items.length && zeroTable.textContent.includes('无分母（总量为零）'),
      missingRemainsDisconnected: runs.length > 1 && JSON.stringify(segments) === JSON.stringify(runs) && svg.querySelectorAll('circle').length === missing.line.values.filter(value => value !== null).length,
      negativeTotalMatches: total < 0 && Number(table.tBodies[0].rows[negative.items.length].cells[2].dataset.rawValue) === total && [...waterfall.querySelectorAll('text')].some(text => text.textContent === `−${Math.abs(total)}`),
      instanceIDsDoNotCollide: firstIDs.size > 0 && secondIDs.length > 0 && secondIDs.every(id => !firstIDs.has(id))
    };
  });
  Object.entries(core).forEach(([name, passed]) => check(`core regression ${name}`, passed));
  check('three material roles and optical refraction', await page.locator('.material-card').evaluateAll(cards => cards.map(card => card.dataset.garyMaterial).join() === 'solid-plate,regular,glass' && cards[2].dataset.garyRefractionState === 'svg'));
  check('single dot grid without nested glass', await page.evaluate(() => document.querySelectorAll('.gary-scene').length === 1 && document.querySelectorAll('.gary-dot-grid-canvas').length === 1 && !document.querySelector('[data-gary-material="glass"] [data-gary-material="glass"]')));
  check('Background text and separate round theme control', (await page.locator('[data-background-open]').textContent()).trim() === 'Background' && await page.locator('[data-theme-toggle]').evaluate(el => el.offsetWidth === 44 && el.offsetHeight === 44 && getComputedStyle(el).borderRadius === '50%') && await page.locator('.gary-background-launcher').count() === 0);
  check('no data foreground filter', await page.locator('[data-study-chart] svg, .material-card h3, .material-number').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).filter === 'none')));
  const optical = page.locator('.material-card[data-gary-surface="optical"]');
  await optical.scrollIntoViewIfNeeded();
  let box = await optical.boundingBox(); await page.mouse.move(box.x + 70, box.y + 90); await settle(page);
  check('actual page hover default off', await page.locator('html').getAttribute('data-gary-pointer-effects') === 'off' && await optical.evaluate(el => getComputedStyle(el, '::after').opacity === '0'));
  await page.locator('[data-background-open]').click();
  check('Background opens without changing theme', await page.locator('#gary-background-lab').evaluate(el => el.open) && await page.locator('html').getAttribute('data-gary-theme') === 'dark');
  await page.locator('[name="pointerEffects"]').check(); await page.keyboard.press('Escape');
  await optical.scrollIntoViewIfNeeded(); box = await optical.boundingBox(); await page.mouse.move(box.x + 80, box.y + 100); await settle(page);
  check('Background opt-in links one light position', await optical.evaluate(el => { const scope = el.closest('[data-gary-light-scope]'), a = el.getBoundingClientRect(), b = scope.getBoundingClientRect(); return getComputedStyle(el, '::after').opacity === '1' && Math.abs(parseFloat(el.style.getPropertyValue('--gary-light-x')) + a.x - parseFloat(scope.style.getPropertyValue('--gary-scene-light-x')) - b.x) < 1; }));
  await page.locator('.material-stage').screenshot({ path: artifact('materials-linked.png') });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await settle(page);
  check('reduced motion overrides opt-in', await optical.evaluate(el => getComputedStyle(el, '::after').opacity === '0'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.locator('[data-background-open]').click(); await page.locator('[name="pointerEffects"]').uncheck(); await page.keyboard.press('Escape'); await settle(page);
  check('turning off clears background and rim', await optical.evaluate(el => getComputedStyle(el, '::after').opacity === '0') && await page.locator('.gary-surface-light').evaluate(el => getComputedStyle(el).opacity === '0'));
  await page.locator('[data-background-open]').click(); await page.locator('[name="pointerEffects"]').check(); await page.keyboard.press('Escape');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForFunction(() => window.Gary0909Charts?.selected.size === 5);
  check('reload defaults off', await page.locator('html').getAttribute('data-gary-pointer-effects') === 'off');
  await page.locator('#reference-enabled').uncheck();
  check('material reference can be hidden', await page.locator('.material-reference').evaluate(el => getComputedStyle(el).display === 'none'));
  await page.locator('#reference-enabled').check();
  const exported = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 1000 });
    for (const value of themes) {
      await theme(value);
      for (const index of [0, 1]) {
        for (const type of types) await page.locator(`[data-case-select="${type}"]`).selectOption(cases[type][index].id);
        await page.evaluate(() => document.querySelectorAll('.source-table').forEach(el => el.open = true)); await settle(page);
        const group = `${width} ${value} case ${index + 1}`;
        check(`${group} no page overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), await page.evaluate(() => ({ viewport: innerWidth, pageWidth: document.documentElement.scrollWidth })));
        await inspectColors(group, value);
        for (const type of types) {
          const item = cases[type][index], label = `${width} ${value} ${type}/${item.id}`;
          const observed = await inspectCase(type, item, label);
          check(`${label} opaque unfiltered data plate`, await page.locator(`#${type}`).evaluate(el => getComputedStyle(el).backdropFilter === 'none' && getComputedStyle(el).backgroundColor === (document.documentElement.dataset.garyTheme === 'dark' ? 'rgb(16, 16, 18)' : 'rgb(245, 245, 247)')));
          if (width !== 1440) continue;
          const pending = page.waitForEvent('download'); await page.locator(`[data-export-chart="${type}"]`).click();
          const download = await pending, filename = `gary-${type}-${item.id}-${value}.svg`;
          check(`${label} export filename identifies selected case`, download.suggestedFilename() === filename, download.suggestedFilename());
          const file = artifact(filename); await download.saveAs(file);
          await exported.goto(pathToFileURL(file).href, { waitUntil: 'load' }); await settle(exported);
          const copy = await exported.evaluate(svgSnapshot, { selector: 'svg' });
          check(`${label} downloaded SVG opens and matches displayed graphic`, !copy.hasScript && same(copy.nodes, observed.nodes), { title: copy.title });
          check(`${label} standalone title unit source and labels retained`, copy.title === item.config.meta.title && [item.config.meta.unit, item.config.meta.source].every(text => copy.text.join('').replace(/\s/g, '').includes(text.replace(/\s/g, ''))) && copy.clipped.length === 0, { title: copy.title, clipped: copy.clipped });
          await exported.locator('svg').screenshot({ path: artifact(filename.replace('.svg', '.png')) });
        }
        if (width < 760) {
          check(`${group} wide plots scroll locally and compact plots fit`, await page.evaluate(({ wide, compact, source }) => [...document.querySelectorAll('.chart-scroll')].every(el => el.scrollWidth > el.clientWidth && el.tabIndex === 0 && el.querySelector('svg').getBoundingClientRect().width >= wide - 1) && [...document.querySelectorAll('.signal-card [data-study-chart]')].every(el => el.scrollWidth <= el.clientWidth + 1 && el.querySelector('svg').getBoundingClientRect().width >= compact - 1 && el.querySelector('svg').viewBox.baseVal.width === source), { wide: policy.geometry.minWideWidth, compact: policy.geometry.minCompactWidth, source: policy.geometry.compactWidth }));
          check(`${group} data tables reflow with field names`, await page.locator('[data-study-table] tbody tr').evaluateAll(rows => rows.every(row => getComputedStyle(row).display === 'grid' && row.scrollWidth <= row.clientWidth + 1 && [...row.querySelectorAll('td')].every(cell => cell.dataset.label && getComputedStyle(cell, '::before').content !== 'none'))));
          const scroll = page.locator('.chart-scroll').first(); await scroll.focus(); await page.keyboard.press('End');
          await scroll.evaluate(el => el.scrollLeft = el.scrollWidth);
          check(`${group} final wide plot labels reachable`, await scroll.evaluate(el => el.scrollLeft + el.clientWidth >= el.scrollWidth - 1));
          await scroll.evaluate(el => el.scrollLeft = 0);
        }
        await page.evaluate(() => { document.querySelectorAll('.source-table').forEach(el => el.open = false); document.activeElement?.blur(); scrollTo(0, 0); });
        await page.screenshot({ path: artifact(`${width}-${value}-case${index + 1}.png`), fullPage: true });
      }
    }
  }
  await exported.close();
  await page.setViewportSize({ width: 390, height: 844 }); await page.locator('.gary-header-menu').click();
  check('mobile menu opens', await page.locator('.demo-nav__links').isVisible());
  await page.locator('.demo-nav__links a[href="#materials"]').click(); await settle(page);
  check('mobile anchor closes menu and reaches section', !(await page.locator('.demo-nav__links').isVisible()) && page.url().endsWith('#materials'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.reuse-example summary').click(); await page.locator('[data-copy-recipe]').click();
  await page.waitForFunction(() => /已复制|已选中/.test(document.querySelector('#copy-status').textContent));
  check('copy recipe has success or selectable fallback', /已复制|已选中/.test(await page.locator('#copy-status').textContent()));
  await theme('dark');
  const beforePrint = await page.evaluate(() => Object.fromEntries([...Gary0909Charts.selected].map(([type, item]) => [type, item.id])));
  await page.emulateMedia({ media: 'print' }); await settle(page);
  check('print removes refraction and interactive lighting', await optical.evaluate(el => getComputedStyle(el).backdropFilter === 'none') && await page.locator('.gary-surface-light').evaluate(el => getComputedStyle(el).display === 'none'));
  for (const type of types) {
    const actual = await page.evaluate(svgSnapshot, { selector: `[data-study-chart="${type}"] svg` });
    const expected = await page.evaluate(svgSnapshot, { type, config: cases[type].find(item => item.id === beforePrint[type]).config, theme: 'light' });
    check(`print ${type} renders selected case in light theme`, same(actual.nodes, expected.nodes));
  }
  check('print wide charts release minimum width', await page.locator('.chart-scroll svg').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).minWidth === '0px')));
  await page.pdf({ path: artifact('demo0909.pdf'), format: 'A4', printBackground: true });
  await page.emulateMedia({ media: 'screen' }); await settle(page);
  check('print restores dark page and selected cases', await page.locator('html').getAttribute('data-gary-theme') === 'dark' && same(beforePrint, await page.evaluate(() => Object.fromEntries([...Gary0909Charts.selected].map(([type, item]) => [type, item.id])))));
  for (const type of types) {
    const actual = await page.evaluate(svgSnapshot, { selector: `[data-study-chart="${type}"] svg` });
    const expected = await page.evaluate(svgSnapshot, { type, config: cases[type].find(item => item.id === beforePrint[type]).config, theme: 'dark' });
    check(`print restores ${type} dark graphic`, same(actual.nodes, expected.nodes));
  }
  check('no script or network errors', errors.length === 0, errors);
  report = await browserReport();
  report.consoleErrors = errors.length;
  check('Gary CSS loaded and computed token', report.styleEntryLoaded && report.computedStyle.value === '44px');
} catch (error) {
  failures.push({ name: 'acceptance run completed', detail: error.stack });
  if (page && !page.isClosed()) await page.screenshot({ path: artifact('failure.png'), fullPage: true }).catch(() => {});
} finally {
  if (page && !page.isClosed()) report = await browserReport().catch(() => report);
  if (report) { report.consoleErrors = errors.length; fs.writeFileSync(path.join(output, 'target-browser-report.json'), JSON.stringify(report, null, 2)); }
  fs.writeFileSync(path.join(output, 'acceptance.json'), JSON.stringify({ status: failures.length || errors.length ? 'fail' : 'pass', checkedAt: new Date().toISOString(), targetArtifact: 'demo0909.html', scope: 'Cross-domain page integration; five reference recipes, not all 17 families or seven annotation implementations.', passed: checks.length, failed: failures.length, checks, failures, errors, coverage: { widths, themes, cases: Object.fromEntries(types.map(type => [type, cases[type].map(item => item.id)])), browser: browser.version() }, labelMeasurements, artifacts, limitations: ['Chromium only. Color-vision simulation is supporting visual evidence, not a claim that all adjacent hues are distinguishable.', 'Rendered SVG downloads are inspected; the generated PDF is not a substitute for a separate publication-layout audit.'] }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ passed: checks.length, failed: failures.length, errors, failures, output }, null, 2));
if (failures.length || errors.length) process.exitCode = 1;
