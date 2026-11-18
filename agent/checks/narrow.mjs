/**
 * 窄屏闸 · 375px 下不许有「被裁且滑不动」的内容。
 *   node agent/checks/narrow.mjs [out.html ...]（无参数时扫 out/*.html）
 *
 * 判据：元素内容比自身宽（scrollWidth > clientWidth），而 overflow-x 是
 * clip / hidden —— 这两种值用户和脚本都滑不动，右侧内容等于永久丢失。
 * auto / scroll 是合格的横向滚动容器，放行。
 */
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = args.length
  ? args
  : fs.existsSync('out')
    ? fs.readdirSync('out').filter((f) => f.endsWith('.html')).map((f) => `out/${f}`).sort()
    : [];
if (!files.length) {
  console.error('用法: node agent/checks/narrow.mjs [out.html ...]');
  process.exit(2);
}

const exe = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright',
  'chromium-1248',
  'chrome-win64',
  'chrome.exe'
);
const browser = await chromium.launch({ executablePath: exe, headless: true });
let failed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`file: ${file}\nFAIL  文件不存在`);
    failed++;
    continue;
  }
  const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
  await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
  await page.waitForTimeout(120);
  const bad = await page.evaluate(() => {
    const out = [];
    // 页面级横向滚动：无空格超长串 / 写死宽度的卡片会把 375px 顶破，
    // 内容能滑到但整页在手机上不该横向滚动。
    const de = document.documentElement;
    if (de.scrollWidth - de.clientWidth > 2) {
      out.push({
        el: 'html（整页横向滚动）',
        overflowX: 'page',
        clientW: de.clientWidth,
        scrollW: de.scrollWidth,
        lost: de.scrollWidth - de.clientWidth,
      });
    }
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.overflowX !== 'clip' && cs.overflowX !== 'hidden') continue;
      const hidden = el.scrollWidth - el.clientWidth;
      if (hidden <= 4) continue;
      out.push({
        el: `${el.tagName}.${String(el.className).slice(0, 40)}`,
        overflowX: cs.overflowX,
        clientW: el.clientWidth,
        scrollW: el.scrollWidth,
        lost: hidden,
      });
    }
    return out;
  });
  await page.close();

  console.log(`file: ${file}`);
  if (bad.length) {
    failed++;
    for (const x of bad.slice(0, 5)) {
      console.log(`  FAIL ${x.el} overflow-x=${x.overflowX} client=${x.clientW} 内容=${x.scrollW} 丢 ${x.lost}px`);
    }
    console.log(`  共 ${bad.length} 处内容被裁且不可滑动`);
  } else {
    console.log('  PASS 无不可达的横向溢出');
  }
}

await browser.close();
if (failed) {
  console.error(`\n${failed} 个页面不通过`);
  process.exit(1);
}
console.log('\nNARROW ALL PASS');
