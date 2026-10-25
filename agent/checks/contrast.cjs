// ⚠️ 实验性脚本，未接入闸门（workflow 不调用）——已知限制：
//   ① 取样点可能落在装饰子元素上（如品牌字旁的白色 logo），导致底色误判；
//   ② 中文小字受抗锯齿影响，纯像素法会系统性低估对比度。
//   在解决这两点之前，G3 的对比度仍由 CSS 合成法（audit.cjs）负责，属于弱闸门。
//
// 原始目的：Gate 3b：按「真实渲染像素」算对比度（不读 CSS 值猜）
// 做法：同一页截两张——文字可见 / 文字透明（只留背景），逐像素比对，
// 文字像素取 A 图的颜色、对应位置取 B 图的底色，算 WCAG 比值，取整块最低值。
const zlib = require("node:zlib");
const path = require("node:path");

const { chromium } = (() => {
  for (const c of [
    path.resolve(__dirname, "../../adapters/visual/node_modules/playwright-core"),
    "playwright-core",
  ]) {
    try { return require(c); } catch (e) {}
  }
  console.error("找不到 playwright-core：请先 cd adapters/visual && npm i");
  process.exit(2);
})();

const CHROME = process.env.GARY_CHROME !== undefined
  ? process.env.GARY_CHROME
  : "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.GARY_BASE || "http://127.0.0.1:4173/agent/out";
const PAGES = ["dashboard", "report", "settings", "workbench"];
const W = 1440, H = 900;

/* ── 最小 PNG 解码（8bit，非隔行，RGB/RGBA） ── */
function decodePNG(buf) {
  let pos = 8, w = 0, h = 0, colorType = 6;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); colorType = data[9]; }
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride); p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}
const px = (img, x, y) => {
  const i = (y * img.w + x) * img.bpp;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
};
const lum = ([r, g, b]) => {
  const f = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b));
  return (l1 + 0.05) / (l2 + 0.05);
};

(async () => {
  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    args: ["--no-sandbox", "--disable-gpu"],
  });
  const fails = [];
  let checked = 0;
  let worst = { r: 99 };

  for (const page of PAGES) {
    for (const theme of ["dark", "light"]) {
      const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
      await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
      await p.waitForTimeout(500);

      const items = await p.evaluate(() => {
        const out = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walk.nextNode())) {
          const txt = (n.textContent || "").trim();
          if (txt.length < 2) continue;
          const el = n.parentElement;
          if (!el) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || Number(cs.opacity) < 0.15) continue;
          const r = document.createRange();
          r.selectNodeContents(el);
          const rects = [...r.getClientRects()].filter((x) => x.width > 2 && x.height > 2);
          if (!rects.length) continue;
          const box = rects[0];
          if (box.width < 6 || box.height < 6) continue;
          const size = parseFloat(cs.fontSize);
          const m = cs.color.match(/rgba?\(([^)]+)\)/);
          let op = 1, up = el;
          while (up && up.nodeType === 1) { op *= Number(getComputedStyle(up).opacity || 1); up = up.parentElement; }
          const c = m ? m[1].split(/[,\s\/]+/).filter(Boolean).map(Number) : [0, 0, 0, 1];
          out.push({
            fg: [c[0], c[1], c[2], (c.length > 3 ? c[3] : 1) * op],
            text: txt.slice(0, 16),
            x: Math.round(box.left), y: Math.round(box.top),
            w: Math.round(box.width), h: Math.round(Math.min(box.height, 60)),
            large: size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700),
          });
        }
        return out.slice(0, 80);
      });

      const shotA = decodePNG(await p.screenshot({ type: "png" }));
      await p.addStyleTag({ content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;text-decoration-color:transparent!important}" });
      await p.waitForTimeout(200);
      const shotB = decodePNG(await p.screenshot({ type: "png" }));

      for (const it of items) {
        let min = 99, bestD = 0, bestRatio = 0;
        const x0 = Math.max(0, it.x), y0 = Math.max(0, it.y);
        const x1 = Math.min(shotA.w - 1, it.x + it.w), y1 = Math.min(shotA.h - 1, it.y + it.h);
        if (x1 - x0 < 2 || y1 - y0 < 2) continue;
        checked++;
        for (let y = y0; y <= y1; y += 1) {
          for (let x = x0; x <= x1; x += 1) {
            const a = px(shotA, x, y), b = px(shotB, x, y);
            const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
            if (d < 40) continue; // 非笔画像素
            const cr = ratio(a, b);
            // 取「与背景差异最大」的笔画核心像素，而不是抗锯齿过渡像素
            if (d > bestD) { bestD = d; bestRatio = cr; }
            if (cr < min) min = cr;
          }
        }
        // 背景取元素中心点的真实渲染像素（覆盖渐变、半透明底）
        const cx = Math.min(shotB.w - 1, Math.round((it.x + it.x + it.w) / 2));
        const cy = Math.min(shotB.h - 1, Math.round((it.y + it.y + it.h) / 2));
        const bg = px(shotB, cx, cy);
        const a2 = it.fg[3];
        const fg = [Math.round(it.fg[0] * a2 + bg[0] * (1 - a2)), Math.round(it.fg[1] * a2 + bg[1] * (1 - a2)), Math.round(it.fg[2] * a2 + bg[2] * (1 - a2))];
        min = ratio(fg, bg);
        const need = it.large ? 3 : 4.5;
        if (min < worst.r) worst = { r: Math.round(min * 100) / 100, page, theme, text: it.text };
        if (min < need) fails.push({ page, theme, text: it.text, ratio: Math.round(min * 100) / 100, need });
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`受检文本块: ${checked} · 最低对比度: ${worst.r}（${worst.page}/${worst.theme}「${worst.text}」）`);
  if (!checked) { console.log("❌ 空跑：没有采样到任何文本块"); process.exit(2); }
  if (fails.length) {
    console.log(`❌ 像素级不合格 ${fails.length} 处：`);
    fails.slice(0, 8).forEach((f) => console.log(`   ${f.page}/${f.theme}「${f.text}」 ${f.ratio} < ${f.need}`));
    process.exit(1);
  }
  console.log("✅ 全部文本块达到 AA（按真实渲染像素）");
  process.exit(0);
})();


