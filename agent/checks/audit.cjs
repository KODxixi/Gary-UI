// 四页客观验收：对比度（按实际合成底色）、横向溢出、console/404
const { chromium } = require(require("node:path").resolve(__dirname, "../../adapters/visual/node_modules/playwright-core"));
const CHROME = process.env.GARY_CHROME !== undefined ? process.env.GARY_CHROME : "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.GARY_BASE || "http://127.0.0.1:4173/agent/out";
const PAGES = ["workbench", "dashboard", "report", "settings"];
const VIEWS = [[1440, 900], [390, 844]];
const THEMES = ["dark", "light"];

(async () => {
  const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ["--no-sandbox", "--disable-gpu"] });
  const rows = [];
  for (const page of PAGES) {
    for (const [w, h] of VIEWS) {
      for (const theme of THEMES) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const p = await ctx.newPage();
        const errs = [];
        p.on("pageerror", (e) => errs.push("js:" + e.message.slice(0, 60)));
        p.on("console", (m) => { if (m.type() === "error") errs.push("c:" + m.text().slice(0, 60)); });
        p.on("response", (r) => { if (r.status() >= 400) errs.push("http" + r.status()); });
        await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
        await p.evaluate((t) => {
          document.documentElement.dataset.theme = t;
          document.documentElement.setAttribute("data-theme", t);
        }, theme);
        await p.waitForTimeout(500);
        const m = await p.evaluate(() => {
          const mix = (s, d) => {
            const a = s.a + d.a * (1 - s.a);
            if (!a) return { r: 0, g: 0, b: 0, a: 0 };
            return { r: (s.r * s.a + d.r * d.a * (1 - s.a)) / a, g: (s.g * s.a + d.g * d.a * (1 - s.a)) / a, b: (s.b * s.a + d.b * d.a * (1 - s.a)) / a, a };
          };
          const parse = (s) => { const x = String(s).match(/rgba?\(([^)]+)\)/); if (!x) return null; const p = x[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
          const lum = (c) => { const f = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
          const ratio = (a, b) => { const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b)); return (l1 + 0.05) / (l2 + 0.05); };
          const bgOf = (el) => { const layers = []; let n = el; while (n && n.nodeType === 1) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) layers.push(c); if (c && c.a >= 1) break; n = n.parentElement; } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base); return base; };
          const out = [];
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walk.nextNode())) {
            const t = (n.textContent || "").trim();
            if (t.length < 2) continue;
            const el = n.parentElement; if (!el) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.1) continue;
            const r = el.getBoundingClientRect();
            if (r.width < 6 || r.height < 6) continue;
            const fg = parse(cs.color); if (!fg) continue;
            const bg = bgOf(el);
            const eff = fg.a < 1 ? mix(fg, bg) : fg;
            const rr = ratio(eff, bg);
            const size = parseFloat(cs.fontSize);
            const need = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700) ? 3 : 4.5;
            if (rr < need) out.push({ t: t.slice(0, 18), r: Math.round(rr * 100) / 100, need });
          }
          return { fails: out.length, worst: out.slice(0, 3), overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
        });
        rows.push({ page, vp: w, theme, errs: errs.slice(0, 2), ...m });
        await ctx.close();
      }
    }
  }
  await browser.close();
  const bad = rows.filter((r) => r.fails || r.overflow || r.errs.length);
  rows.forEach((r) => console.log(`${r.page.padEnd(10)} ${String(r.vp).padEnd(5)} ${r.theme.padEnd(6)} contrastFails=${r.fails} overflow=${r.overflow} errs=${r.errs.length}${r.worst.length ? " " + JSON.stringify(r.worst[0]) : ""}`));
  console.log("---- 不合格组合:", bad.length);
  if (rows.length < 8) { console.log("❌ 空跑：只跑到 " + rows.length + " 个组合（应 ≥8），结果不可信"); process.exit(2); }
})();

