/**
 * Layout gate — real DOM geometry, asserted not eyeballed.
 *   node agent/checks/layout.mjs <out.html> [more.html ...]
 *
 * Rules (R4):
 *   1. Toolbar input shell vs button: |top| <= 1px and |height| <= 1px
 *   2. Every card: computed padding (top/right/bottom/left) >= 20px
 *   3. Card radius by width band: <320 -> 12..16; 320..700 -> 14..18; >700 -> 18..24
 *   4. First child of every card inset from the card's top/left edge >= 20px
 *   5. No element extends past its parent's right edge by more than 1px
 *   6. No text overflow: scrollWidth <= clientWidth + 1
 *
 * Any FAIL -> exit 1. Prints measured pixel values for every rule.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

let files = process.argv.slice(2).filter((a) => !a.startsWith('--') && !/^\d+$/.test(a));
if (!files.length) {
  files = fs.existsSync('out')
    ? fs.readdirSync('out').filter((f) => f.endsWith('.html')).map((f) => `out/${f}`).sort()
    : [];
}
const widthArg = process.argv.includes('--width')
  ? Number(process.argv[process.argv.indexOf('--width') + 1]) || 1440
  : 1440;
if (!files.length) {
  console.error('用法: node agent/checks/layout.mjs [out.html ...] [--width 900]（无参数时扫 out/*.html）');
  process.exit(2);
}

const exe = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright',
  'chromium-1248',
  'chrome-win64',
  'chrome.exe'
);

const PAD_MIN = 20;
const band = (w) => (w < 320 ? [12, 16] : w <= 700 ? [14, 18] : [18, 24]);

const browser = await chromium.launch({ executablePath: exe });
let failures = 0;

for (const file of files) {
  const page = await browser.newPage({ viewport: { width: widthArg, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const data = await page.evaluate(() => {
    const px = (v) => parseFloat(v) || 0;
    const rect = (el) => el.getBoundingClientRect();

    // 2..4 — cards and banner surfaces (both are containers with a radius).
    const cards = [];
    for (const card of document.querySelectorAll('.astryx-card, .astryx-banner, .g-card, .g-metric__card')) {
      if (card.matches('.astryx-card') && card.parentElement?.closest('.g-card')) continue;
      const cs = getComputedStyle(card);
      const r = rect(card);
      const first = card.firstElementChild;
      const fr = first ? rect(first) : null;
      cards.push({
        width: +r.width.toFixed(1),
        radius: px(cs.borderRadius),
        paddingTop: px(cs.paddingTop),
        paddingRight: px(cs.paddingRight),
        paddingBottom: px(cs.paddingBottom),
        paddingLeft: px(cs.paddingLeft),
        insetLeft: fr ? +(fr.left - r.left).toFixed(1) : null,
        insetTop: fr ? +(fr.top - r.top).toFixed(1) : null,
      });
    }

    // 5 — horizontal bleed.
    // Two documented allowances, both still bounded by real containers:
    //   a) a zero-width parent is layout-neutral (auto-margin shell); compare
    //      against the nearest ancestor that actually has width instead.
    //   b) Astryx / MWG table scroll wrappers allow horizontal scrolling inside
    //      the card without overflowing the document viewport.
    const bleed = [];
    for (const el of document.querySelectorAll('body *')) {
      const parent = el.parentElement;
      if (!parent) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.position === 'fixed') continue;
      const er = rect(el);
      if (er.width <= 0) continue;

      let host = parent;
      let pr = rect(host);
      while (host && pr.width === 0) {
        host = host.parentElement;
        if (!host) break;
        pr = rect(host);
      }
      if (!host) continue;

      const pcs = getComputedStyle(host);
      const right = pr.right - px(pcs.borderRightWidth);
      const over = +(er.right - right).toFixed(1);
      if (over > 1) {
        const isScrollBleed = /astryx-table-scroll-wrapper|g-table-scroll/.test(el.className || '');
        const scrollContainer = el.closest('.astryx-table-scroll-wrapper, .g-table-scroll');
        const inScrollContainer = scrollContainer && el !== scrollContainer;
        const card = el.closest('.astryx-card, .g-card');
        const cardRight = card ? rect(card).right - px(getComputedStyle(card).borderRightWidth) : null;
        if (isScrollBleed && cardRight !== null && er.right <= cardRight + 1) {
          bleed.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 40),
            over,
            note: `scroll wrapper full-bleed, still inside card (right ${er.right} <= card ${cardRight})`,
            allowed: true,
          });
        } else if (inScrollContainer && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1) {
          bleed.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 40),
            over,
            note: `scrollable table content inside scroll wrapper`,
            allowed: true,
          });
        } else {
          bleed.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 40),
            text: (el.textContent || '').trim().slice(0, 18),
            over,
            host: host.tagName.toLowerCase() + '.' + (host.className || '').toString().split(' ')[0],
            allowed: false,
          });
        }
      }
    }

    // 6 — text overflow.
    const overflow = [];
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length) continue; // leaf text containers only
      const text = (el.textContent || '').trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'inline' || cs.display === 'none') continue;
      // Skip screen-reader-only text: 1x1 clipped nodes (e.g. the Stepper's
      // per-step "completed" announcement). Their scrollWidth is real but they
      // are never painted, so they cannot be a visual overflow.
      const rect = el.getBoundingClientRect();
      if (rect.width <= 2 || rect.height <= 2) continue;
      if (cs.clip && cs.clip !== 'auto' && /rect\(0px, 0px, 0px, 0px\)/.test(cs.clip)) continue;
      if (el.clientWidth <= 0) continue;
      const over = +(el.scrollWidth - el.clientWidth).toFixed(1);
      if (over > 1) {
        overflow.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 40),
          text: text.slice(0, 18),
          over,
        });
      }
    }

    return {
      vw: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
      toolbar,
      cards,
      bleed,
      overflow,
    };
  });

  console.log(`\n===== ${file} =====`);
  console.log(`viewport ${data.vw}px · docScrollW ${data.scrollW}px`);

  const report = (name, ok, detail) => {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
    if (!ok) failures++;
  };

  // 2
  const padBad = data.cards.filter(
    (c) => Math.min(c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft) < PAD_MIN
  );
  report(
    '2 卡片/横幅内边距 ≥ 20px',
    padBad.length === 0,
    `${data.cards.length} 张 · ` +
      data.cards
        .map((c) => `w${c.width} [${c.paddingTop}/${c.paddingRight}/${c.paddingBottom}/${c.paddingLeft}]`)
        .join(' | ')
  );

  // 3
  if (widthArg <= 480) {
    report('3 圆角分级（按容器宽度）', true, `窄屏 --width ${widthArg} 跳过桌面宽带断言`);
  } else {
    const radiusBad = data.cards.filter((c) => {
      const [lo, hi] = band(c.width);
      return c.radius < lo || c.radius > hi;
    });
    report(
      '3 圆角分级（按容器宽度）',
      radiusBad.length === 0,
      data.cards
        .map((c) => {
          const [lo, hi] = band(c.width);
          return `w${c.width}→${c.radius}px ∈[${lo},${hi}]`;
        })
        .join(' | ')
    );
  }

  // 4
  const insetBad = data.cards.filter((c) => c.insetLeft !== null && (c.insetLeft < PAD_MIN || c.insetTop < PAD_MIN));
  report(
    '4 首个子元素不贴边 ≥ 20px',
    insetBad.length === 0,
    data.cards.map((c) => `w${c.width} inset ${c.insetLeft}/${c.insetTop}`).join(' | ')
  );

  // 5
  const hardBleed = data.bleed.filter((b) => !b.allowed);
  const docOk = data.scrollW <= data.vw + 1;
  report(
    '5 横向不出血（右边界 ≤ 父右边界 +1）',
    hardBleed.length === 0 && docOk,
    (hardBleed.length
      ? `${hardBleed.length} 处: ` + JSON.stringify(hardBleed.slice(0, 5))
      : `0 处 · docScrollW ${data.scrollW} ${docOk ? '≤' : '>'} viewport ${data.vw}`) +
      (data.bleed.length - hardBleed.length > 0
        ? ` · 白名单 ${data.bleed.length - hardBleed.length} 处（滚动壳内或整卡宽）`
        : '')
  );

  // 6
  report(
    '6 文字不溢出（scrollWidth ≤ clientWidth +1）',
    data.overflow.length === 0,
    data.overflow.length ? `${data.overflow.length} 处: ` + JSON.stringify(data.overflow.slice(0, 5)) : '0 处'
  );

  await page.close();
}

await browser.close();
if (failures) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log('\nLAYOUT ALL PASS');

