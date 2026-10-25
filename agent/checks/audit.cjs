// Gate 3：一道闸门覆盖 CRITICAL 的其余硬规则（less is more：不按规则拆脚本）
//   规则 3 对比度（CSS 合成 + 祖先 opacity + 渐变取平均色）
//   规则 4 热区 ≥44×44（用 elementFromPoint 实测命中区，而不是量盒子）
//   规则 5 动效：禁 transition:all；交互元素时长 ≤300ms
//   规则 7 密度：html[data-density] 合法 + 四个间距变量存在
//   规则 8 滚动条：无轨道（track 透明）
//   规则 9 禁外部请求 / 禁 emoji 当图标
//   + 横向溢出、console 报错、HTTP≥400
// 覆盖守卫：受检文本 < 40 或 组合数 < 8 判为不可信，直接失败。
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
const PAGES = ["workbench", "dashboard", "report", "settings"];
const VIEWS = [[1440, 900], [390, 844]];
const THEMES = ["dark", "light"];
const MIN_TEXTS = 40;
const MIN_COMBOS = 8;

(async () => {
  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const rows = [];
  let textsChecked = 0;

  for (const page of PAGES) {
    for (const [w, h] of VIEWS) {
      for (const theme of THEMES) {
        const ctx = await browser.newContext({ viewport: { width: w, height: h } });
        const p = await ctx.newPage();
        const errs = [];
        p.on("pageerror", (e) => errs.push("js:" + e.message.slice(0, 50)));
        p.on("console", (m) => { if (m.type() === "error") errs.push("c:" + m.text().slice(0, 50)); });
        p.on("response", (r) => { if (r.status() >= 400) errs.push("http" + r.status()); });
        const ORIGIN = new URL(BASE).origin;
        p.on("request", (r) => {
          const u = r.url();
          if (/^https?:/i.test(u) && new URL(u).origin !== ORIGIN) errs.push("external:" + u.slice(0, 40));
        });

        await p.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
        await p.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
        await p.waitForTimeout(400);

        // 单次 evaluate 内完成所有测量，避免跨作用域变量（此前踩过两次）
        const m = await p.evaluate(() => {
          const mix = (s, d) => {
            const a = s.a + d.a * (1 - s.a);
            if (!a) return { r: 0, g: 0, b: 0, a: 0 };
            return {
              r: (s.r * s.a + d.r * d.a * (1 - s.a)) / a,
              g: (s.g * s.a + d.g * d.a * (1 - s.a)) / a,
              b: (s.b * s.a + d.b * d.a * (1 - s.a)) / a,
              a,
            };
          };
          const parse = (s) => {
            const x = String(s).match(/rgba?\(([^)]+)\)/);
            if (!x) return null;
            const q = x[1].split(/[,\s\/]+/).filter(Boolean).map(Number);
            return { r: q[0], g: q[1], b: q[2], a: q.length > 3 ? q[3] : 1 };
          };
          const lum = (c) => {
            const f = (v) => { const t = v / 255; return t <= 0.04045 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4); };
            return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
          };
          const ratio = (a, b) => {
            const l1 = Math.max(lum(a), lum(b)), l2 = Math.min(lum(a), lum(b));
            return (l1 + 0.05) / (l2 + 0.05);
          };
          // 渐变底：取所有色标的平均色（无解析器，够用且不假装精确）
          const gradientAvg = (bgImage, fallback) => {
            const stops = [...String(bgImage).matchAll(/rgba?\([^)]+\)/g)].map((x) => parse(x[0])).filter(Boolean);
            if (!stops.length) return fallback;
            const n = stops.length;
            return { r: stops.reduce((s, c) => s + c.r, 0) / n, g: stops.reduce((s, c) => s + c.g, 0) / n, b: stops.reduce((s, c) => s + c.b, 0) / n, a: 1 };
          };
          const backdrop = (el) => {
            const layers = [];
            let up = el, op = 1;
            while (up && up.nodeType === 1) {
              const cs = getComputedStyle(up);
              op *= Number(cs.opacity || 1);
              const c = parse(cs.backgroundColor);
              if (c && c.a > 0) layers.push(c);
              const gi = cs.backgroundImage;
              if (gi && gi !== "none") layers.push(gradientAvg(gi, { r: 255, g: 255, b: 255, a: 1 }));
              if (c && c.a >= 1 && gi === "none") break;
              up = up.parentElement;
            }
            let base = { r: 255, g: 255, b: 255, a: 1 };
            for (let i = layers.length - 1; i >= 0; i--) base = mix(layers[i], base);
            return { bg: base, opacity: op };
          };

          let texts = 0;
          const fails = [];
          const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = walk.nextNode())) {
            const t = (n.textContent || "").trim();
            if (t.length < 2) continue;
            const el = n.parentElement;
            if (!el) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            const r0 = el.getBoundingClientRect();
            if (r0.width < 6 || r0.height < 6) continue;
            const fgRaw = parse(cs.color);
            if (!fgRaw) continue;
            const { bg, opacity } = backdrop(el);
            if (opacity < 0.05) continue;
            texts++;
            let fg = fgRaw.a < 1 ? mix(fgRaw, bg) : fgRaw;
            if (opacity < 1) fg = mix({ ...fg, a: opacity }, bg);
            const cr = ratio(fg, bg);
            const size = parseFloat(cs.fontSize);
            const large = size >= 24 || (size >= 18.66 && Number(cs.fontWeight) >= 700);
            const need = large ? 3 : 4.5;
            if (cr < need) fails.push({ t: t.slice(0, 16), cr: Math.round(cr * 100) / 100, need });
          }

          // 规则 4：热区实测——在元素中心 ±21px 取点，命中同一元素（或其子/父）即视为有效热区
          const smallHit = [];
          const interactive = [...document.querySelectorAll("button,a,[role=button],[role=tab],[role=switch]")].slice(0, 24);
          const vw0 = window.innerWidth, vh0 = window.innerHeight;
          for (const el of interactive) {
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) continue;
            const needX = Math.max(0, (44 - r.width) / 2);
            const needY = Math.max(0, (44 - r.height) / 2);
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const probes = [[0, 0], [needX, 0], [-needX, 0], [0, needY], [0, -needY]];
            let ok = 0, valid = 0;
            for (const [dx, dy] of probes) {
              const x = cx + dx, y = cy + dy;
              if (x < 0 || y < 0 || x > vw0 - 1 || y > vh0 - 1) continue; // 视口外的点不算
              valid++;
              const hit = document.elementFromPoint(x, y);
              if (hit && (hit === el || el.contains(hit) || hit.contains(el))) ok++;
            }
            if (valid && ok < valid) {
              smallHit.push({ t: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 12), w: Math.round(r.width), h: Math.round(r.height), miss: valid - ok });
            }
          }

          // 规则 5：transition:all + 时长
          let transitionAll = 0, tooSlow = 0;
          for (const el of document.querySelectorAll("body *")) {
            const cs = getComputedStyle(el);
            const durAll = String(cs.transitionDuration || "0s").split(",").map((x) => parseFloat(x) || 0);
            if (cs.transitionProperty === "all" && Math.max(...durAll) > 0) transitionAll++;
            const durs = String(cs.transitionDuration || "0s").split(",").map((s) => parseFloat(s) || 0);
            const isInteractive = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName) || el.getAttribute("role");
            if (isInteractive && Math.max(...durs) > 0.3) tooSlow++;
          }

          // 规则 7：密度
          const root = document.documentElement;
          const density = root.dataset.density;
          const densityVars = ["--pad-row", "--pad-item", "--gap-sect", "--pad-head"]
            .filter((v) => getComputedStyle(root).getPropertyValue(v).trim()).length;

          // 规则 8：滚动条无轨道
          const sbColor = getComputedStyle(root).scrollbarColor || "";

          // 规则 9：emoji 当图标
          const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(document.body.innerText || "") ? 1 : 0;

          // 横向溢出：逐元素越界（body 可能 overflow:hidden）
          const vw = window.innerWidth;
          let overflow = false;
          for (const el of document.querySelectorAll("body *")) {
            const r = el.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            if (getComputedStyle(el).position === "fixed") continue;
            if (r.right > vw + 2 || r.left < -2) { overflow = true; break; }
          }

          return {
            texts,
            contrast: fails.length,
            worst: fails.slice(0, 2),
            smallHit: smallHit.length,
            smallHitSample: smallHit.slice(0, 2),
            transitionAll,
            tooSlow,
            density: density || "missing",
            densityVars,
            scrollbarTrackless: /rgba\(0, 0, 0, 0\)/.test(sbColor),
            emoji,
            overflow,
          };
        });

        textsChecked += m.texts;
        rows.push({ page, vp: w, theme, errs: errs.slice(0, 2), ...m });
        await ctx.close();
      }
    }
  }
  // ── 规则 5：reduced-motion 下动效必须几乎为零 ──
  const motionGate = [];
  // ── 规则 6：首帧主题必须在 head 内联脚本里定好（预置 light 后首帧即 light）──
  const themeGate = [];
  // ── 规则 9：出现数值指标时必须有「示意/示例」标注 ──
  const fakeGate = [];

  for (const page of PAGES) {
    // 规则 5
    {
      const ctx0 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
      const p0 = await ctx0.newPage();
      await p0.goto(`${BASE}/${page}.html`, { waitUntil: "load" });
      await p0.waitForTimeout(200);
      const maxDur = await p0.evaluate(() => {
        let max = 0;
        for (const el of document.querySelectorAll("button,a,input,select,textarea,[role=button]")) {
          const d = String(getComputedStyle(el).transitionDuration || "0s").split(",").map((x) => parseFloat(x) || 0);
          max = Math.max(max, ...d);
        }
        return max;
      });
      if (maxDur > 0.02) motionGate.push(`${page}: reduced-motion 下仍有 ${maxDur}s 过渡`);
      await ctx0.close();
    }
    // 规则 6 + 9
    {
      const ctx1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await ctx1.addInitScript(() => { try { localStorage.setItem("gary.theme", "light"); } catch (e) {} });
      const p1 = await ctx1.newPage();
      await p1.goto(`${BASE}/${page}.html`, { waitUntil: "domcontentloaded" });
      const first = await p1.evaluate(() => document.documentElement.dataset.theme);
      if (first !== "light") themeGate.push(`${page}: 预置 light 但首帧是 ${first}`);

      await p1.waitForTimeout(200);
      const hasMetric = await p1.evaluate(() => document.querySelectorAll(".metric").length);
      const marked = await p1.evaluate(() => /示意|示例/.test(document.body.innerText || ""));
      if (hasMetric && !marked) fakeGate.push(`${page}: 有 ${hasMetric} 个指标但正文没有「示意/示例」标注`);
      await ctx1.close();
    }
  }

  await browser.close();

  const bad = rows.filter((r) =>
    r.contrast || r.overflow || r.errs.length || r.smallHit ||
    r.transitionAll || r.tooSlow || r.emoji ||
    !["compact", "roomy"].includes(r.density) || r.densityVars < 4 || !r.scrollbarTrackless
  );

  for (const r of rows) {
    const flags = [];
    if (r.contrast) flags.push(`contrast=${r.contrast}`);
    if (r.overflow) flags.push("overflow");
    if (r.errs.length) flags.push(`err=${r.errs.length}(${r.errs[0]})`);
    if (r.smallHit) flags.push(`hit<44=${r.smallHit}`);
    if (r.transitionAll) flags.push(`transitionAll=${r.transitionAll}`);
    if (r.tooSlow) flags.push(`slow=${r.tooSlow}`);
    if (!["compact", "roomy"].includes(r.density)) flags.push(`density=${r.density}`);
    if (r.densityVars < 4) flags.push(`vars=${r.densityVars}`);
    if (!r.scrollbarTrackless) flags.push("scrollbar");
    if (r.emoji) flags.push("emoji");
    console.log(`${r.page.padEnd(10)} ${String(r.vp).padEnd(5)} ${r.theme.padEnd(6)} texts=${String(r.texts).padEnd(3)} ${flags.length ? "❌ " + flags.join(" ") : "✅"}`);
    if (r.worst && r.worst.length) r.worst.forEach((w) => console.log(`      ↳ 「${w.t}」 ${w.cr} < ${w.need}`));
    if (r.smallHitSample && r.smallHitSample.length) r.smallHitSample.forEach((s) => console.log(`      ↳ 热区「${s.t}」 ${s.w}×${s.h}`));
  }

  motionGate.forEach((m) => console.log("❌ 规则5 " + m));
  themeGate.forEach((m) => console.log("❌ 规则6 " + m));
  fakeGate.forEach((m) => console.log("❌ 规则9 " + m));
  const extra = motionGate.length + themeGate.length + fakeGate.length;
  console.log(`\n组合数: ${rows.length} · 受检文本: ${textsChecked} · 不合格: ${bad.length + extra}（其中规则5/6/9: ${extra}）`);
  if (rows.length < MIN_COMBOS || textsChecked < MIN_TEXTS) {
    console.log(`❌ 覆盖不足（组合 ${rows.length}/${MIN_COMBOS}，文本 ${textsChecked}/${MIN_TEXTS}），结果不可信`);
    process.exit(2);
  }
  process.exit(bad.length + extra ? 1 : 0);
})();
