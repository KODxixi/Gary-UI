// 硬规则检查：面板标签名必须与其内容的左边缘对齐
const { chromium } = require(require("node:path").resolve(__dirname, "../../adapters/visual/node_modules/playwright-core"));
const CHROME = process.env.GARY_CHROME !== undefined ? process.env.GARY_CHROME : "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.GARY_BASE || "http://127.0.0.1:4173/agent/out";

const probe = () => {
  const out = [];
  const labels = [...document.querySelectorAll(".eyebrow")];
  for (const label of labels) {
    const lr = label.getBoundingClientRect();
    // 面板 = 最近的 .surface / .pane / aside
    let panel = label.closest(".surface, .pane, aside, section");
    if (!panel) continue;
    // 候选内容：面板内、在标签下方的行/项/正文块
    const cands = [...panel.querySelectorAll(".row__k, .item__title, .body, .h2, .card__t, td, .kpi__v, .row")]
      .filter((el) => {
        if (el.contains(label) || label.contains(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 20 && r.top > lr.bottom - 4 && r.top < lr.bottom + 320;
      });
    if (!cands.length) continue;
    const c = cands[0];
    const cr = c.getBoundingClientRect();
      const cs0 = getComputedStyle(c);
    // 内容真正的文字左边缘：取元素自身 padding 之后
    const cs = getComputedStyle(c);
    const textX = cr.left + parseFloat(cs.paddingLeft || 0);
    out.push({
      label: (label.textContent || "").trim().slice(0, 10),
      panel: (panel.className || panel.tagName).toString().split(" ")[0],
      labelX: Math.round(lr.left * 10) / 10,
      textX: Math.round(textX * 10) / 10,
      delta: Math.round((textX - lr.left) * 10) / 10,
      sample: (c.textContent || "").trim().slice(0, 12),
    });
  }
  return out;
};

(async () => {
  const browser = await chromium.launch({ ...(CHROME ? { executablePath: CHROME } : {}), args: ["--no-sandbox", "--disable-gpu"] });
  let bad = 0, checkedPairs = 0;
  for (const page of ["workbench", "settings", "dashboard", "report"]) {
    for (const [w, h] of [[1440, 900], [1024, 700]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } });
      const p = await ctx.newPage();
      await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
      await p.waitForTimeout(450);
      const rows = await p.evaluate(probe);
      console.log(`\n== ${page} @${w}`);
      rows.forEach((r) => { checkedPairs++;
        const ok = Math.abs(r.delta) <= 0.5;
        if (!ok) bad++;
        console.log(`  ${ok ? "✅" : "❌"} [${r.panel}] "${r.label}" 标签x=${r.labelX} 文字x=${r.textX} Δ=${r.delta} · 内容"${r.sample}"`);
      });
      await ctx.close();
    }
  }
  console.log(`\n受检标签: ${checkedPairs} · 错位总数: ${bad}`);
  if (checkedPairs < 20) { console.log('❌ 覆盖不足：受检标签 ${checkedPairs} < 20（页面可能被清空）'); process.exit(2); }
  process.exit(bad ? 1 : 0);
  await browser.close();
})();


