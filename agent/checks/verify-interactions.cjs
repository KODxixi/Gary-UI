// 交互验收：对 v4 生成页逐项驱动，确认配方声明的交互真的生效
const { chromium } = require(require("node:path").resolve(__dirname, "../../adapters/visual/node_modules/playwright-core"));
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.GARY_BASE || "http://127.0.0.1:4173/agent/out";
const PAGES = ["dashboard", "report", "settings", "workbench"];

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ["--no-sandbox", "--disable-gpu"] });
  let bad = 0;
  const out = {};
  for (const n of PAGES) {
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message.slice(0, 70)));
    p.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 70)); });
    p.on("response", (r) => { if (r.status() >= 400) errs.push("http" + r.status()); });
    await p.goto(`${BASE}/${n}.html`, { waitUntil: "load" });
    await p.waitForTimeout(450);

    await p.keyboard.press("Control+KeyK");
    await p.waitForTimeout(320);
    const palette = await p.evaluate(() => document.getElementById("palette")?.classList.contains("on") || false);
    const items = await p.evaluate(() => document.querySelectorAll("#plist .pitem").length);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(220);

    const t0 = await p.evaluate(() => document.documentElement.dataset.theme);
    await p.click("#themeBtn").catch(() => {});
    await p.waitForTimeout(300);
    const t1 = await p.evaluate(() => document.documentElement.dataset.theme);

    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    const ok = palette && items > 0 && t0 !== t1 && !overflow && errs.length === 0;
    if (!ok) bad++;
    out[n] = { palette, items, theme: `${t0}→${t1}`, overflow, errs: errs.slice(0, 2), ok };
    await p.close();
  }

  // 分隔条
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/workbench.html`, { waitUntil: "load" });
  await p.waitForTimeout(400);
  const g = await p.locator(".gutter").first().boundingBox();
  const before = await p.evaluate(() => document.getElementById("sidePane").getBoundingClientRect().width);
  if (g) {
    await p.mouse.move(g.x + g.width / 2, g.y + 200);
    await p.mouse.down();
    await p.mouse.move(g.x + g.width / 2 + 80, g.y + 200, { steps: 8 });
    await p.mouse.up();
  }
  const after = await p.evaluate(() => document.getElementById("sidePane").getBoundingClientRect().width);
  out.gutter = { before: Math.round(before), after: Math.round(after), ok: Math.round(after) !== Math.round(before) };
  if (!out.gutter.ok) bad++;
  await p.close();

  await browser.close();
  console.log(JSON.stringify(out, null, 1));
  console.log(`\n不合格: ${bad}`);
  process.exit(bad ? 1 : 0);
})();
