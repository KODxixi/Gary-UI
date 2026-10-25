// 渲染器：把 recipes.json（结构）+ content.json（数据）编译成自包含 HTML。
// 只用 primitives.css 的类与变量；页面私有 CSS 只写布局。
import fs from "node:fs";
import path from "node:path";
import { INTERACTION_CSS, PRINT_CSS, PALETTE_MARKUP, INTERACTION_JS } from "./interactions.mjs";

import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const { recipes } = JSON.parse(fs.readFileSync(path.join(DIR, "recipes.json"), "utf8"));
const content = JSON.parse(fs.readFileSync(path.join(DIR, "content.json"), "utf8"));
const CSS = "../primitives.css?v=g6";

const esc = (s = "") => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ── 段落渲染器 ───────────────────────────── */
const S = {
  header: (c) => `
    <header class="sec-head">
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <div class="sec-head__row">
        <h1 class="display">${esc(c.title)}</h1>
        ${c.badge ? `<span class="badge badge--accent">${esc(c.badge)}</span>` : ""}
      </div>
      ${c.sub ? `<p class="sub">${esc(c.sub)}</p>` : ""}
    </header>`,

  kpis: (c) => `
    <div class="kpis surface">
      ${c.items.map((k) => `
        <div class="kpi">
          <p class="eyebrow">${esc(k.label)}</p>
          <p class="metric">${esc(k.value)}${k.unit ? `<small>${esc(k.unit)}</small>` : ""}</p>
          ${k.hint ? `<p class="small">${esc(k.hint)}</p>` : ""}
        </div>`).join("")}
    </div>`,

  chart: (c) => {
    const w = 1000, h = 260, pad = 8;
    const max = Math.max(...c.points), min = Math.min(...c.points);
    const xy = c.points.map((v, i) => [pad + i * ((w - pad * 2) / (c.points.length - 1)), h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)]);
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
    const area = `${line} L${w - pad} ${h} L${pad} ${h} Z`;
    return `
    <section class="surface panel">
      <div class="panel__head">
        <p class="eyebrow">${esc(c.title)}</p>
        <span class="small">${esc(c.note || "")}</span>
      </div>
      <svg class="chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(c.title)}">
        <path d="${area}" fill="var(--accent-soft)"></path>
        <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"></path>
      </svg>
      <div class="axis">${c.labels.map((l) => `<span class="small">${esc(l)}</span>`).join("")}</div>
    </section>`;
  },

  table: (c) => `
    <section class="surface panel">
      <div class="panel__head">
        <p class="eyebrow">${esc(c.title)}</p>
        <span class="small">${esc(c.note || "")}</span>
      </div>
      <table class="table">
        <thead><tr>${c.columns.map((col) => `<th class="${col.num ? "num" : ""}">${esc(col.label)}</th>`).join("")}</tr></thead>
        <tbody>${c.rows.map((r) => `<tr>${r.map((cell, i) => `<td class="${c.columns[i] && c.columns[i].num ? "num" : ""}">${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </section>`,

  groups: (c) => c.groups.map((g, gi) => `
    <section class="group" id="g${gi}">
      <p class="eyebrow">${esc(g.label)}</p>
      ${g.rows.map((r) => `
        <div class="row">
          <div><div class="row__k">${esc(r.k)}</div>${r.h ? `<div class="row__h">${esc(r.h)}</div>` : ""}</div>
          ${r.control.type === "seg"
            ? `<div class="seg">${r.control.options.map((o, i) => `<button aria-pressed="${i === r.control.value}">${esc(o)}</button>`).join("")}</div>`
            : `<button class="sw" aria-pressed="${!!r.control.on}" aria-label="${esc(r.k)}"><i></i></button>`}
        </div>`).join("")}
    </section>`).join(""),

  prose: (c) => c.items.map((s, si) => `
    <section class="chapter" id="c${si}">
      <p class="eyebrow">${esc(s.n)}</p>
      <h2 class="h2">${esc(s.title)}</h2>
      ${s.paras.map((p) => `<p class="body">${esc(p)}</p>`).join("")}
    </section>`).join(""),

  canvas: (c) => `
    <div class="canvas">
      <span class="small canvas__badge">${esc(c.badge || "预览")}</span>
      <div class="canvas__inner">
        <span class="small">${esc(c.label || "")}</span>
        <div class="pcard">
          <div class="pcard__row">
            <div><div class="pcard__t">${esc(c.title)}</div><div class="small">${esc(c.sub)}</div></div>
            ${c.tag ? `<span class="badge badge--accent">${esc(c.tag)}</span>` : ""}
          </div>
          <div class="pcard__foot"><span class="small">${esc(c.note || "")}</span><button class="btn btn--primary">应用</button></div>
        </div>
      </div>
    </div>`,

  composer: (c) => `
    <div class="composer">
      <div class="field">
        <textarea rows="1" placeholder="${esc(c.placeholder || "描述要改的地方 — 回车运行")}" aria-label="指令"></textarea>
        <button class="send" aria-label="运行">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12.5V3.5M8 3.5L4 7.5M8 3.5l4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
      <div class="composer__foot"><span class="small">${esc(c.hint || "模型 · 默认")}</span></div>
    </div>`,

  cover: (c) => `
    <header class="cover">
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <h1 class="display display--xl">${esc(c.title)}</h1>
      <p class="sub">${esc(c.sub)}</p>
      <hr class="hr">
      <dl class="meta">${c.meta.map((m) => `<div><dt class="eyebrow">${esc(m.k)}</dt><dd class="body">${esc(m.v)}</dd></div>`).join("")}</dl>
    </header>`,
};

/* ── 外壳 ─────────────────────────────────── */
const SHELL_CSS = `
  html,body{overflow:hidden}
  body{display:flex;flex-direction:column;height:100%}
  .topbar{display:flex;align-items:center;gap:12px;height:28px;flex:none;padding:6px 16px 0;border-bottom:1px solid var(--line2)}
  .brand{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600}
  .mark{width:15px;height:15px;border-radius:4px;display:grid;place-items:center;background:var(--ink);color:var(--bg);font-size:9px;font-weight:700}
  .brand small{font-weight:400;color:var(--dim);font-size:11.5px;margin-left:2px}
  .topbar__right{margin-left:auto;display:flex;gap:6px;align-items:center}\n  .topbar .chip{height:20px;padding:0 8px;font-size:11px}\n  .topbar .iconbtn{width:22px;height:22px;font-size:10px}
  .wrap{flex:1;min-height:0;overflow:auto;padding:6px 24px 24px}
  .stack{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:12px}
  .sec-head{display:flex;flex-direction:column;gap:8px;margin-bottom:4px}
  .sec-head__row{display:flex;align-items:center;gap:12px}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);padding:12px 18px 6px}
  .kpi{padding:14px 0;border-right:1px solid var(--line2)}
  .kpi:last-child{border-right:0}
  .kpi .metric{margin-top:6px}
  .panel{padding:22px 24px 18px}
  .main{display:flex;flex-direction:column}
  .canvas{flex:1;min-height:180px;margin:14px 24px 0;border-radius:var(--r-panel);background:var(--win2);
    border:1px solid var(--line2);position:relative;display:grid;place-items:center;overflow:hidden}
  .canvas__badge{position:absolute;top:10px;right:12px;color:var(--dim)}
  .canvas__inner{width:min(460px,78%)}
  .pcard{border:1px solid var(--hair);border-radius:18px;padding:16px;margin-top:8px;
    background:linear-gradient(180deg,#ffffff0f,#ffffff05);box-shadow:inset 0 1px 0 var(--hair),0 16px 40px #000000a6}
  html[data-theme="light"] .pcard{background:linear-gradient(180deg,#ffffffee,#ffffffb8);box-shadow:inset 0 1px 0 #fff,0 16px 40px #00000012}
  .pcard__row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
  .pcard__t{font-size:14px;font-weight:600;letter-spacing:-.015em;margin-bottom:3px}
  .pcard__foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
  .composer{padding:10px 24px 16px}
  .composer__foot{margin-top:6px}
  .cols > .side--right{width:300px;flex:none;overflow:auto}
  .panel__head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:10px}
  .chart{width:100%;height:180px;display:block}
  .axis{display:flex;justify-content:space-between;margin-top:8px}
  .table{width:100%;border-collapse:collapse}
  .table th{text-align:left;font-weight:500;color:var(--dim);font-size:11px;padding:6px 0;border-bottom:1px solid var(--line)}
  .table td{padding:8px 0;border-bottom:1px solid var(--line2);font-size:12.5px}
  .table th.num,.table td.num{text-align:right;font-variant-numeric:tabular-nums}
  /* report */
  .article{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:minmax(0,720px) 240px;gap:56px;align-items:start}
  .cover .display--xl{margin:14px 0 16px}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:18px 0 0}
  .meta dd{margin:4px 0 0}
  .chapter{margin:0 0 34px}
  .chapter .h2{margin:6px 0 12px}
  .chapter .body{margin:0 0 12px;max-width:70ch}
  .toc{position:sticky;top:8px}
  .toc a{display:block;padding:8px 10px;border-radius:10px;color:var(--muted);text-decoration:none;font-size:12.5px}
  .toc a:hover{background:var(--line2);color:var(--ink)}
  /* settings / workbench 两栏 */
  .cols{display:flex;gap:var(--gap);height:100%;padding:6px 16px 16px}
  .side{width:236px;flex:none;padding:22px 14px 14px}
  .main{flex:1;min-width:0;overflow:auto;padding:22px 24px 20px}
  .group{margin-bottom:12px}
  .group .row + .row{border-top:0}
  @media (max-width:900px){
    .kpis{grid-template-columns:repeat(2,1fr)}
    .article{grid-template-columns:minmax(0,1fr);gap:20px}
    .toc{display:none}
    .cols{flex-direction:column;height:auto}
    .side{width:auto}
  }`;

function page({ title, recipe, data, theme = "dark" }) {
  const acts = recipe.interactions || [];
  const body = recipe.sections.map((s) => S[s.type](data[s.id])).join("\n");
  const cmds = [
    ...(data.prose?.items || []).map((s, i) => ({ k: "跳到 · " + s.title, tag: "章节", fn: "function(){var e=document.getElementById('c" + i + "');if(e)e.scrollIntoView({behavior:'smooth'})}" })),
    ...(data.groups?.groups || []).map((g, i) => ({ k: "跳到 · " + g.label, tag: "分组", fn: "function(){var e=document.getElementById('g" + i + "');if(e)e.scrollIntoView({behavior:'smooth'})}" })),
    { k: "切换主题", tag: "视图", fn: "function(){var b=document.getElementById('themeBtn');if(b)b.click()}" },
    ...(acts.includes("print") ? [{ k: "打印 / 存为 PDF", tag: "导出", fn: "function(){window.print()}" }] : [])
  ].map((c) => ({ k: c.k, tag: c.tag, fn: `(${c.fn})()` }));
  const j = (v) => JSON.stringify(v).replace(/</g, "\\u003c");
  const cmdsJs = "[" + cmds.map((c) => `{k:${j(c.k)},tag:${j(c.tag)},fn:function(){${c.fn}}}`).join(",") + "]";

  const rightSecs = recipe.sections.filter((s) => s.pane === "right");
  const mainBody = recipe.sections.filter((s) => s.pane !== "right").map((s) => S[s.type](data[s.id])).join("\n");
  const rightBody = rightSecs.map((s) => S[s.type](data[s.id])).join("\n");

  const inner = recipe.shell === "article"
    ? `<div class="wrap"><div class="article"><div>${body}</div><nav class="toc"><p class="eyebrow">目录</p>${(data.prose?.items || []).map((s, i) => `<a href="#c${i}">${esc(s.n)} · ${esc(s.title)}</a>`).join("")}</nav></div></div>`
    : recipe.shell === "settings" || recipe.shell === "workbench"
      ? `<div class="cols"><aside class="surface side" id="sidePane"><p class="eyebrow eyebrow--indent">${esc(data.nav?.label || "导航")}</p>${(data.nav?.items || []).map((it) => `<button class="item" ${it.active ? 'aria-current="true"' : ""}><span class="item__dot"></span><span class="item__body"><span class="item__title">${esc(it.t)}</span>${it.m ? `<span class="item__meta">${esc(it.m)}</span>` : ""}</span></button>`).join("")}</aside>${acts.includes("gutters") ? '<div class="gutter" data-side="left" role="separator" aria-orientation="vertical" tabindex="0" aria-label="调整侧栏宽度"></div>' : ""}<main class="surface main" id="mainPane">${mainBody}</main>${rightSecs.length ? (acts.includes("gutters") ? '<div class="gutter" data-side="right" role="separator" aria-orientation="vertical" tabindex="0" aria-label="调整参数栏宽度"></div>' : "") + `<aside class="surface side side--right" id="rightPane">${rightBody}</aside>` : ""}</div>`
      : `<div class="wrap"><div class="stack">${body}</div></div>`;

  return `<!doctype html>
<html lang="zh-CN" data-theme="${theme}" data-density="compact">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="data:,">
<link rel="stylesheet" href="${CSS}">
<style>${SHELL_CSS}${acts.length ? INTERACTION_CSS : ""}${acts.includes("print") ? PRINT_CSS : ""}</style>
</head>
<body>
<header class="topbar"><div class="brand"><span class="mark">G</span>Gary<small>${esc(title)}</small></div>
  <div class="topbar__right"><span class="chip"><i class="dot dot--live"></i>就绪</span>
  ${acts.includes("palette") ? '<button class="topbar__btn" id="cmdBtn" aria-keyshortcuts="Control+K Meta+K">⌘K</button>' : ""}
  ${acts.includes("theme") ? '<button class="topbar__btn" id="themeBtn" aria-label="切换主题">亮</button>' : ""}</div>
</header>
${inner}
${acts.includes("palette") ? PALETTE_MARKUP : ""}
${acts.length ? `<script>window.__GARY_CMDS__ = ${cmdsJs}</script><script>${INTERACTION_JS}</script>` : ""}
</body>
</html>`;
}

/* ── 生成 ─────────────────────────────────── */
const outDir = path.join(DIR, "out");
fs.mkdirSync(outDir, { recursive: true });
for (const [name, recipe] of Object.entries(recipes)) {
  const data = content[name];
  if (!data) { console.warn("跳过（缺内容）:", name); continue; }
  const html = page({ title: data.title || name, recipe, data });
  fs.writeFileSync(path.join(outDir, `${name}.html`), html, "utf8");
  console.log("生成", name, "→", `${name}.html`, html.length, "B");
}









