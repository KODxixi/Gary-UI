/**
 * Gate · legibility: measured contrast on the rendered page (light or dark).
 *
 * Reads real computed colours from the DOM, then checks the pairs a reader
 * actually lives with: body copy, secondary copy, accent text, card-vs-page
 * separation, hairline visibility, and the four semantic colours.
 *
 * Usage: node agent/checks/contrast.mjs out/demo-report.html [more.html ...]
 * Exit 1 on any FAIL. Thresholds follow WCAG AA (4.5 body / 3.0 large-UI),
 * plus a low floor for non-text separation (card vs page, hairlines).
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

const CHROME = path.join(
  process.env.LOCALAPPDATA,
  'ms-playwright',
  'chromium-1248',
  'chrome-win64',
  'chrome.exe'
);

/** r,g,b in 0-255 (+ optional alpha) -> WCAG relative luminance. */
function luminance({ r, g, b }) {
  const f = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Composite a translucent sRGB colour over an opaque backdrop. */
function flatten(fg, bg) {
  if (fg.a === undefined || fg.a >= 0.999) return fg;
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function ratio(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function parseColor(css) {
  const m = String(css).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
  return { r, g, b, a };
}

async function probe(page) {
  return page.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    // getComputedStyle 原样返回 oklch()/lab()/color() 这类 CSS Color 4 格式，node 侧只认 rgb。
    // 用 1px canvas 让浏览器自己转，闸才能测现代配色（MWG 推荐的 oklch 就是这种）。
    const cv = document.createElement('canvas').getContext('2d');
    const rgb = (c) => {
      if (!c) return null;
      cv.fillStyle = '#000';
      cv.fillStyle = c;
      if (cv.fillStyle === '#000000' && !/^(#000|black|rgb\(0, 0, 0)/.test(String(c))) return String(c);
      cv.clearRect(0, 0, 1, 1);
      cv.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = cv.getImageData(0, 0, 1, 1).data;
      return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
    };
    const opaqueBg = (el) => {
      let e = el;
      while (e) {
        const c = cs(e).backgroundColor;
        const m = c.match(/rgba?\(([^)]+)\)/);
        if (m) {
          const a = m[1].split(',')[3];
          if (a === undefined || parseFloat(a) >= 0.9) return c;
        }
        e = e.parentElement;
      }
      return cs(document.body).backgroundColor;
    };
    const card = document.querySelector('.astryx-card, .g-card');
    const heading = document.querySelector('h2') || document.querySelector('h1');
    const secondary = [...document.querySelectorAll('.astryx-card span, .astryx-card p, .g-card span, .g-card p, .g-heading__sub, .g-cover__sub')].find(
      (e) => e.textContent.trim().length > 3
    );
    const accentEl = [...document.querySelectorAll('a, .astryx-button, .g-heading__btn')].find(
      (e) => e.textContent.trim().length > 0
    );
    const divider = document.querySelector('.astryx-divider, .g-divider');
    const dividerLine = divider ? divider.lastElementChild || divider : null;
    let dividerColor = null;
    if (dividerLine) {
      const dcs = cs(dividerLine);
      const dbg = rgb(dcs.backgroundColor);
      dividerColor = dbg && !dbg.endsWith(', 0.000)') ? dbg : rgb(dcs.borderTopColor);
    }
    const root = cs(document.documentElement);
    return {
      theme: document.documentElement.dataset.theme || 'light',
      bodyBg: rgb(cs(document.body).backgroundColor),
      cardBg: card ? rgb(cs(card).backgroundColor) : null,
      cardBorder: card ? rgb(cs(card).borderTopColor) : null,
      headingColor: heading ? rgb(cs(heading).color) : null,
      secondaryColor: secondary ? rgb(cs(secondary).color) : null,
      accentColor: accentEl ? rgb(accentEl.matches('.astryx-button, .g-heading__btn') ? cs(accentEl).backgroundColor : cs(accentEl).color) : null,
      dividerColor,
      vars: {
        textAccent: rgb(root.getPropertyValue('--color-text-accent').trim()),
        success: rgb(root.getPropertyValue('--color-success').trim()),
        warning: rgb(root.getPropertyValue('--color-warning').trim()),
        error: rgb(root.getPropertyValue('--color-error').trim()),
        info: rgb(root.getPropertyValue('--color-info').trim()),
      },
      cardBgRaw: root.getPropertyValue('--color-background-card').trim(),
    };
  });
}

const CHECKS = (p) => {
  const bodyBg = parseColor(p.bodyBg);
  // 崩得含糊等于没闸：页面用了 CSS Color 4 格式又没转成 rgb 时，说清楚是哪一步
  if (!bodyBg) {
    return [
      {
        name: 'body 背景色',
        status: 'FAIL',
        value: '-',
        min: 1,
        note: `读不到可解析的背景色（收到 ${JSON.stringify(p.bodyBg)}）；本闸只认 rgb/rgba`,
      },
    ];
  }
  const cardBg = parseColor(p.cardBg ?? p.bodyBg) ?? bodyBg;
  const card = cardBg.a < 0.999 ? flatten(cardBg, bodyBg) : cardBg;
  const out = [];
  const add = (name, fg, bg, min, note, waived) => {
    if (!fg) {
      out.push({ name, status: 'SKIP', value: '-', min, note });
      return;
    }
    const flat = flatten(fg, bg);
    const r = ratio(flat, bg);
    const pass = r >= min;
    out.push({
      name,
      // A waiver is printed, not folded into PASS: lowering `min` to the measured
      // value is the gate lying to itself. Anything not explicitly waived still fails.
      status: pass ? 'PASS' : waived ? 'WAIVED' : 'FAIL',
      value: r.toFixed(2),
      min,
      note: !pass && waived ? `${note} — WAIVED: ${waived}` : note,
    });
  };

  add('text-primary / body', parseColor(p.headingColor), bodyBg, 7, 'heading text');
  add('text-secondary / card', parseColor(p.secondaryColor), card, 4.5, 'supporting copy');
  add('card vs page', card, bodyBg, 1.08, 'surface separation');
  // Hairlines are non-text separators: enough that an edge is perceptible, not AA.
  add('card border / card', parseColor(p.cardBorder), card, 1.15, 'card edge');
  add('divider / card', parseColor(p.dividerColor), card, 1.15, 'hairline visibility');

  // Semantic tokens are used as FILLS here (badge background, status dot), not as
  // small text, so the floor is "a mark you can see", not AA text contrast.
  const semantic = p.semanticRgb || {};
  for (const key of ['success', 'warning', 'error', 'info']) {
    add(`${key} / card`, parseColor(semantic[key]), card, 1.3, 'semantic fill');
  }
  // Text tokens are contracts: every one must be readable on every surface it can
  // actually land on. `text-accent` used to be checked only at the 3:1 mark floor and
  // only against the card — so #B85C00 printed PASS at 4.60 while sitting at 4.11 on
  // the page and 3.84 on muted. The gate was green because it never measured them.
  // One row per (token, surface) pair, floor = AA body text.
  const surfaces = [
    ['body', bodyBg],
    ['card', card],
    ['muted', parseColor(p.mutedBg) ?? bodyBg],
  ];
  for (const [tname, tcss] of Object.entries(p.textTokenRgb || {})) {
    const fg = parseColor(tcss);
    if (!fg) continue;
    for (const [sname, sbg] of surfaces) {
      add(`${tname} / ${sname}`, fg, sbg, 4.5, 'body-size text');
    }
  }
  add('accent / card', parseColor(p.accentRgb), card, 3, 'accent mark');

  // Chart data colours. Untested before this — a palette change could ship
  // #FBBC05 at 1.71 against white and still print a green sheet.
  // One floor for every hue: 3:1, the WCAG 1.4.11 non-text-mark minimum. The three
  // light Google hues can't reach it without darkening into the range Gary rejected
  // twice as 「太深」, so they are WAIVED by name with a reason, not given a lower
  // `min`. A waiver shows up in the output; a lowered threshold hides.
  const DATA_MIN = 3;
  const DATA_WAIVER = {
    yellow: '只做填充不做线条；压深到 3:1 就不再是 Google 黄',
    cyan: '大面积填充，色相可辨；压深到 3:1 就不再是 Material cyan',
    orange: '大面积填充，色相可辨；压深到 3:1 会与 data-red 撞色',
  };
  for (const [name, css] of Object.entries(p.dataRgb || {})) {
    add(`data-${name} / card`, parseColor(css), card, DATA_MIN, 'chart mark', DATA_WAIVER[name]);
  }
  return out;
};

async function run(files) {
  const browser = await chromium.launch({ executablePath: CHROME });
  let failed = 0;
  try {
    for (const file of files) {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      });
      await page.goto(pathToFileURL(path.resolve(file)).href, { waitUntil: 'load' });
      await page.waitForTimeout(120);
      const p = await probe(page);
      // Resolve light-dark() token values into real rgb by painting a probe node.
      const rgb = await page.evaluate(() => {
        const names = [
          'success', 'warning', 'error', 'info', 'text-accent',
          'text-primary', 'text-secondary', 'text-warning', 'text-info',
          'text-success', 'text-error',
          'background-body', 'background-card', 'background-muted',
          'data-categorical-blue', 'data-categorical-red', 'data-categorical-yellow',
          'data-categorical-green', 'data-categorical-purple', 'data-categorical-cyan',
          'data-categorical-orange', 'data-categorical-gray',
        ];
        const box = document.createElement('div');
        document.body.appendChild(box);
        const out = {};
        for (const n of names) {
          box.style.color = `var(--color-${n})`;
          out[n] = getComputedStyle(box).color;
        }
        box.remove();
        return out;
      });
      p.semanticRgb = {
        success: rgb.success,
        warning: rgb.warning,
        error: rgb.error,
        info: rgb.info,
      };
      p.accentRgb = rgb['text-accent'];
      p.mutedBg = rgb['background-muted'];
      p.textTokenRgb = {
        'text-accent': rgb['text-accent'],
        'text-warning': rgb['text-warning'],
        'text-info': rgb['text-info'],
        'text-success': rgb['text-success'],
        'text-error': rgb['text-error'],
      };
      p.dataRgb = {};
      for (const n of Object.keys(rgb)) {
        if (n.startsWith('data-categorical-')) p.dataRgb[n.slice(17)] = rgb[n];
      }

      const rows = CHECKS(p);
      console.log(`\n${file}  [theme=${p.theme}]  body=${p.bodyBg} card=${p.cardBg}`);
      for (const r of rows) {
        const mark = r.status === 'PASS' ? 'PASS' : r.status;
        console.log(`  ${mark.padEnd(4)} ${r.name.padEnd(24)} ${String(r.value).padStart(6)}  (min ${r.min}, ${r.note})`);
        if (r.status === 'FAIL') failed += 1;
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`\nCONTRAST_EXIT=${failed === 0 ? 0 : 1}`);
  process.exit(failed === 0 ? 0 : 1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('用法: node agent/checks/contrast.mjs <page.html> [more.html ...]');
  process.exit(2);
}
run(files);
