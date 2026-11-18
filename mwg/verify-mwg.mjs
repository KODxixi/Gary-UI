/**
 * 校验 MWG 产物的渲染几何与 computedStyle
 */
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
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

  console.log('=== 1. 验证 mwg-demo-report.html ===');
  const reportUrl = 'file:///' + path.resolve(__dirname, '../out/mwg-demo-report.html').replace(/\\/g, '/');
  await page.goto(reportUrl);

  // 1. 检查正文段落行长 (max-inline-size)
  const pWidth = await page.evaluate(() => {
    const p = document.querySelector('.g-prose p') || document.querySelector('p');
    return p ? window.getComputedStyle(p).maxWidth : null;
  });
  console.log(`[P0 行长] 段落 max-width: ${pWidth}`);

  // 2. 检查 KPI 字体等宽性 (tabular-nums)
  const kpiFontVariant = await page.evaluate(() => {
    const kpi = document.querySelector('.g-metric__value');
    return kpi ? window.getComputedStyle(kpi).fontVariantNumeric : null;
  });
  console.log(`[P2 KPI] font-variant-numeric: ${kpiFontVariant}`);

  // 截图亮色
  await page.screenshot({ path: path.resolve(__dirname, '../out/mwg-demo-report-light.png'), fullPage: true });
  console.log('已保存亮色截图: out/mwg-demo-report-light.png');

  // 3. 切换暗色模式并检查背景色
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.waitForTimeout(350); // 等待 transition 0.2s 彻底结束

  const darkBodyBg = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  const darkCardBg = await page.evaluate(() => {
    const card = document.querySelector('.g-card');
    return card ? window.getComputedStyle(card).backgroundColor : null;
  });
  console.log(`[暗色模式] body background: ${darkBodyBg}`);
  console.log(`[暗色模式] card background: ${darkCardBg}`);

  // 截图暗色
  await page.screenshot({ path: path.resolve(__dirname, '../out/mwg-demo-report-dark.png'), fullPage: true });
  console.log('已保存暗色截图: out/mwg-demo-report-dark.png');

  console.log('\n=== 2. 验证 mwg-demo-table.html ===');
  const tableUrl = 'file:///' + path.resolve(__dirname, '../out/mwg-demo-table.html').replace(/\\/g, '/');
  await page.goto(tableUrl);

  // 4. 重点验证 P2：表格 .num 是否为 tabular-nums，且对齐方式是否为 right
  const tableNumCheck = await page.evaluate(() => {
    const numTd = document.querySelector('td.num');
    if (!numTd) return { found: false };
    const style = window.getComputedStyle(numTd);
    return {
      found: true,
      textAlign: style.textAlign,
      fontVariantNumeric: style.fontVariantNumeric,
    };
  });
  console.log(`[P2 表格数字列] 找到: ${tableNumCheck.found}, 对齐: ${tableNumCheck.textAlign}, font-variant-numeric: ${tableNumCheck.fontVariantNumeric}`);

  // 截图表格
  await page.screenshot({ path: path.resolve(__dirname, '../out/mwg-demo-table.png'), fullPage: true });
  console.log('已保存表格截图: out/mwg-demo-table.png');

  await browser.close();
  console.log('\n✅ MWG 自动化实测完成！');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
