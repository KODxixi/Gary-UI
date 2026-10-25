// Gate 4：短标签/说明不许折成两行（桌面宽度强制；390 允许自然折行）
// 判定：用 Range 数真实行盒，不拿元素高度猜。
// 覆盖守卫：受检元素合计 < 20 视为空跑，直接失败，避免「查不到 = 通过」。
const { chromium } = (() => {
  const path = require("node:path");
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
const VIEWS = [[1440, 900], [1024, 768]];
const MIN_CHECKED = 20;

(async () => {
  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    args: ["--no-sandbox", "--disable-gpu"],
  });

  let bad = 0;
  let checkedAll = 0;

  for (const page of PAGES) {
    for (const [w, h] of VIEWS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
      await p.waitForTimeout(400);

      const res = await p.evaluate(() => {
        const SEL = ".row__h, .eyebrow, .badge, .item__meta, .row__k, .table th, .btn, .small";
        const wraps = [];
        let checked = 0;
        for (const el of document.querySelectorAll(SEL)) {
          const text = (el.textContent || "").trim();
          if (!text) continue;
          const box = el.getBoundingClientRect();
          if (box.width < 8 || box.height < 8) continue;
          checked++;
          const range = document.createRange();
          range.selectNodeContents(el);
          const tops = new Set(
            [...range.getClientRects()]
              .filter((r) => r.width > 1 && r.height > 1)
              .map((r) => Math.round(r.top))
          );
          if (tops.size > 1) {
            wraps.push({ text: text.slice(0, 24), lines: tops.size, w: Math.round(box.width) });
          }
        }
        return { wraps, checked };
      });

      checkedAll += res.checked;
      if (res.wraps.length) {
        bad += res.wraps.length;
        console.log(`❌ ${page} @${w}  折行 ${res.wraps.length} 处（受检 ${res.checked}）`);
        res.wraps.slice(0, 4).forEach((x) => console.log(`     "${x.text}" 行数 ${x.lines} 宽 ${x.w}`));
      } else {
        console.log(`✅ ${page} @${w}（受检 ${res.checked}）`);
      }
      await ctx.close();
    }
  }

  await browser.close();
  console.log(`\n受检元素合计: ${checkedAll} · 折行合计: ${bad}`);

  if (checkedAll < MIN_CHECKED) {
    console.log(`❌ 覆盖不足：受检元素 ${checkedAll} < ${MIN_CHECKED}，结果不可信`);
    process.exit(2);
  }
  process.exit(bad ? 1 : 0);
})();