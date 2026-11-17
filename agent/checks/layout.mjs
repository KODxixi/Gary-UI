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

    // 1 — toolbar: an input shell paired with the first button in an ancestor row.
    const toolbar = [];
    for (const shell of document.querySelectorAll('.astryx-text-input')) {
      let host = shell.parentElement;
      for (let i = 0; i < 4 && host; i++) {
        const btns = host.querySelectorAll('button');
        if (btns.length) {
          const s = rect(shell);
          const b = rect(btns[0]);
          toolbar.push({
            inputTop: +s.top.toFixed(1),
            inputHeight: +s.height.toFixed(1),
            buttonTop: +b.top.toFixed(1),
            buttonHeight: +b.height.toFixed(1),
            topDelta: +Math.abs(s.top - b.top).toFixed(1),
            heightDelta: +Math.abs(s.height - b.height).toFixed(1),
          });
          break;
        }
        host = host.parentElement;
      }
    }

    // 2..4 — cards and banner surfaces (both are containers with a radius).
    const cards = [];
    for (const card of document.querySelectorAll('.astryx-card, .astryx-banner')) {
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
    //   b) Astryx's table scroll wrapper uses negative inline margins to bleed
    //      its scroll area across the card padding; it must stay inside the card.
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
        const isScrollBleed = /astryx-table-scroll-wrapper/.test(el.className || '');
        const card = el.closest('.astryx-card');
        const cardRight = card ? rect(card).right - px(getComputedStyle(card).borderRightWidth) : null;
        if (isScrollBleed && cardRight !== null && er.right <= cardRight + 1) {
          bleed.push({
            tag: el.tagName.toLowerCase(),
            cls: (el.className || '').toString().slice(0, 40),
            over,
            note: `scroll wrapper full-bleed, still inside card (right ${er.right} <= card ${cardRight})`,
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

  // 1
  if (!data.toolbar.length) {
    report('1 控件对齐（输入框 vs 按钮）', true, '本页无工具行，跳过（0 组）');
  } else {
    const rows = data.toolbar.map(
      (t) => `top ${t.inputTop}/${t.buttonTop} (Δ${t.topDelta}) · h ${t.inputHeight}/${t.buttonHeight} (Δ${t.heightDelta})`
    );
    const ok = data.toolbar.every((t) => t.topDelta <= 1 && t.heightDelta <= 1);
    report('1 控件对齐（输入框 vs 按钮）', ok, `${data.toolbar.length} 组 · ` + rows.join(' | '));
  }

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

  // 4
  const insetBad = data.cards.filter((c) => c.insetLeft !== null && (c.insetLeft < PAD_MIN || c.insetTop < PAD_MIN));
  report(
    '4 首个子元素不贴边 ≥ 20px',
    insetBad.length === 0,
    data.cards.map((c) => `w${c.width} inset ${c.insetLeft}/${c.insetTop}`).join(' | ')
  );

  // 5
  const hardBleed = data.bleed.filter((b) => !b.allowed);
  report(
    '5 横向不出血（右边界 ≤ 父右边界 +1）',
    hardBleed.length === 0,
    (hardBleed.length
      ? `${hardBleed.length} 处: ` + JSON.stringify(hardBleed.slice(0, 5))
      : `0 处 · docScrollW ${data.scrollW} ≤ viewport ${data.vw}`) +
      (data.bleed.length - hardBleed.length > 0
        ? ` · 白名单 ${data.bleed.length - hardBleed.length} 处（滚动壳整卡宽，仍在卡片内）`
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

