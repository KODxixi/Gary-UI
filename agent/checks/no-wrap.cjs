// 全局 UI 规则检查：短标签/说明不许折成两行（会被判不合格）
// 判定：单行元素实际高度 > 单行行高 × 1.5 即视为折行
const { chromium } = require(require("node:path").resolve(__dirname, "../../adapters/visual/node_modules/playwright-core"));
const CHROME = process.env.GARY_CHROME !== undefined ? process.env.GARY_CHROME : "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.GARY_BASE || "http://127.0.0.1:4173/agent/out";
const PAGES = ["dashboard", "report", "settings", "workbench"];
const VIEWS = [[1440, 900], [1024, 768]]; // 桌面宽度才算硬规则；390 允许自然折行

(async () => {
  const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ["--no-sandbox", "--disable-gpu"] });
  let bad = 0, checkedEls = 0;
  for (const page of PAGES) {
    for (const [w, h] of VIEWS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
      await p.waitForTimeout(400);
      const wraps = await p.evaluate(() => {
        const sel = ".row__h, .eyebrow, .badge, .item__meta, .small, .row__k, .table th, .btn";
        const out = [];
        for (const el of document.querySelectorAll(sel)) { checkedEls++;
          const text = (el.textContent || "").trim();
          if (!text || text.length > 60) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 8 || box.height < 8) continue;
          if (el.closest("[style*='overflow-x']")) continue;
          // 用 Range 数真实行盒，避免把 padding 算成折行
          const range = document.createRange();
          range.selectNodeContents(el);
          const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
          const tops = [...new Set(rects.map((r) => Math.round(r.top)))];
          if (tops.length > 1) out.push({ text: text.slice(0, 22), lines: tops.length, w: Math.round(box.width) });
        }
        return out;
      });
      if (wraps.length) {
        bad += wraps.length;
        console.log(`❌ ${page} @${w}  折行 ${wraps.length} 处`);
        wraps.slice(0, 4).forEach((x) => console.log(`     "${x.text}" 高 ${x.h}/${x.lh} 宽 ${x.w}`));
      } else {
        console.log(`✅ ${page} @${w}`);
      }
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n受检元素: ${checkedEls} · 折行合计: ${bad}`);
  if (checkedEls < 20) { console.log("❌ 空跑：受检元素太少（<20），结果不可信"); process.exit(2); }
  process.exit(bad ? 1 : 0);
})();



