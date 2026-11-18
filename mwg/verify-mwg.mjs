/**
 * 校验 MWG 与 Astryx 产物的渲染几何与 computedStyle（P0 / P2 / Carbon 暗色）
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECIMEN_DIR = path.resolve(__dirname, '../out/specimen');

async function main() {
  fs.mkdirSync(SPECIMEN_DIR, { recursive: true });
  const exe = path.join(
    process.env.LOCALAPPDATA,
    'ms-playwright',
    'chromium-1248',
    'chrome-win64',
    'chrome.exe'
  );
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  let failures = 0;
  const assert = (label, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}: ${detail}`);
    if (!ok) failures++;
  };

  console.log('=== 1. 验证 mwg-demo-report.html (亮色 Paper) ===');
  const reportUrl = 'file:///' + path.resolve(__dirname, '../out/mwg-demo-report.html').replace(/\\/g, '/');
  await page.goto(reportUrl);

  const pWidth = await page.evaluate(() => {
    const p = document.querySelector('.g-text p, .g-prose p') || document.querySelector('p');
    return p ? window.getComputedStyle(p).maxWidth : null;
  });
  assert('[P0 行长] 段落 max-width', pWidth === '680px', pWidth);

  const kpiFontVariant = await page.evaluate(() => {
    const kpi = document.querySelector('.g-metric__value');
    return kpi ? window.getComputedStyle(kpi).fontVariantNumeric : null;
  });
  assert('[P2 KPI] font-variant-numeric', kpiFontVariant === 'tabular-nums', kpiFontVariant);

  await page.screenshot({ path: path.join(SPECIMEN_DIR, 'mwg-demo-report-light.png'), fullPage: true });
  console.log('已保存亮色截图: out/specimen/mwg-demo-report-light.png');

  console.log('\n=== 2. 验证 mwg-demo-report-dark.html (暗色 Carbon) ===');
  const darkUrl = 'file:///' + path.resolve(__dirname, '../out/mwg-demo-report-dark.html').replace(/\\/g, '/');
  await page.goto(darkUrl);

  const darkColors = await page.evaluate(() => {
    const card = document.querySelector('.g-card');
    return {
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      cardBg: card ? window.getComputedStyle(card).backgroundColor : null,
    };
  });
  assert('[Carbon 暗色] body background', darkColors.bodyBg === 'rgb(17, 17, 17)', darkColors.bodyBg);
  assert('[Carbon 暗色] card background', darkColors.cardBg === 'rgb(28, 28, 28)', darkColors.cardBg);

  await page.screenshot({ path: path.join(SPECIMEN_DIR, 'mwg-demo-report-dark.png'), fullPage: true });
  console.log('已保存暗色截图: out/specimen/mwg-demo-report-dark.png');

  console.log('\n=== 3. 验证 MWG 与 Astryx 表格 tabular-nums (P2) ===');
  const mwgTableUrl = 'file:///' + path.resolve(__dirname, '../out/mwg-demo-table.html').replace(/\\/g, '/');
  await page.goto(mwgTableUrl);
  const mwgTbl = await page.evaluate(() => {
    const numTd = document.querySelector('td.num');
    if (!numTd) return null;
    const style = window.getComputedStyle(numTd);
    return { textAlign: style.textAlign, fontVariantNumeric: style.fontVariantNumeric };
  });
  assert('[P2 MWG 表格] td.num right + tabular-nums', mwgTbl?.textAlign === 'right' && mwgTbl?.fontVariantNumeric === 'tabular-nums', JSON.stringify(mwgTbl));

  await page.screenshot({ path: path.join(SPECIMEN_DIR, 'mwg-demo-table.png'), fullPage: true });
  console.log('已保存表格截图: out/specimen/mwg-demo-table.png');

  const astryxTableUrl = 'file:///' + path.resolve(__dirname, '../out/demo-table.html').replace(/\\/g, '/');
  await page.goto(astryxTableUrl);
  const astryxTbl = await page.evaluate(() => {
    const td = document.querySelector('.astryx-table td:nth-child(2)');
    const span = td?.querySelector('.astryx-text');
    return {
      tdNumeric: td ? window.getComputedStyle(td).fontVariantNumeric : null,
      spanNumeric: span ? window.getComputedStyle(span).fontVariantNumeric : null,
    };
  });
  assert('[P2 Astryx 表格] td & span tabular-nums', astryxTbl.tdNumeric === 'tabular-nums' && astryxTbl.spanNumeric === 'tabular-nums', JSON.stringify(astryxTbl));

  await browser.close();
  if (failures) {
    console.error(`\n❌ ${failures} 项校验失败`);
    process.exit(1);
  }
  console.log('\n✅ MWG 自动化实测全部通过！');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
