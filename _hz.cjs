const { chromium } = require("./adapters/visual/node_modules/playwright-core");
(async () => {
  const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--no-sandbox"] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto("http://127.0.0.1:4399/agent/out/settings.html", { waitUntil: "load" });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const sel = [".btn", ".iconbtn", ".topbar__btn", ".seg button", ".sw", ".pitem", ".row"];
    const o = {};
    for (const s of sel) {
      const els = [...document.querySelectorAll(s)];
      o[s] = els.length ? els.slice(0,2).map((e) => { const x = e.getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; }) : "absent";
    }
    return o;
  });
  console.log(JSON.stringify(r));
  const w = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await w.goto("http://127.0.0.1:4399/agent/out/workbench.html", { waitUntil: "load" });
  console.log("gutter", JSON.stringify(await w.evaluate(() => { const x = document.querySelector(".gutter").getBoundingClientRect(); return [Math.round(x.width), Math.round(x.height)]; })));
  await b.close();
})();
