/*
 * Gary-UI WCAG contrast audit.
 *
 * Reads ../../tokens/tokens.json and measures every --gary-text-* color token
 * against every listed surface/glass background token, for BOTH dark and light
 * modes. Translucent tokens are alpha-composited over the page backdrop
 * (--gary-surface-page) before measuring, so the reported ratio reflects the
 * color a user actually sees.
 *
 * Output: scripts/contrast-audit-report.md
 * Usage:  node scripts/contrast-audit.mjs   (npm run audit:contrast)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ADAPTER_ROOT = resolve(SCRIPT_DIR, "..");
const REPO_ROOT = resolve(ADAPTER_ROOT, "..", "..");
const TOKENS_JSON = join(REPO_ROOT, "tokens", "tokens.json");
const REPORT = join(SCRIPT_DIR, "contrast-audit-report.md");

const TEXT_TOKENS = /^--gary-text-/;
// Formats parseColor() can read. Keep in sync with parseColor(): a colour token
// whose format is missing here silently drops out of the audit instead of failing
// it, which would turn a regression into a green report.
const COLOR_VALUE_RE = /^(#|rgba?\(|oklch\()/i;
const BACKGROUND_TOKENS = [
  "--gary-surface-page",
  "--gary-solid-plate",
  "--gary-surface-sunken",
  "--gary-glass-ultrathin",
  "--gary-glass-regular",
  "--gary-glass-thick",
];
const PAGE_TOKEN = "--gary-surface-page";

const MODES = ["dark", "light"];
const THRESHOLDS = {
  "AA normal": 4.5,
  "AA large": 3.0,
  "AAA normal": 7.0,
  "AAA large": 4.5,
};

/* ---------- color parsing ---------- */

/**
 * oklch() -> sRGB, per CSS Color 4: oklch -> oklab (§12.3), oklab -> linear sRGB
 * (§12.2 cone-response matrices), linear -> gamma-encoded sRGB (§10.3 transfer
 * function). Spec constants only — no approximation. Out-of-gamut results are
 * clamped to the [0,1] display range, which is what a browser paints.
 */
function oklchToSrgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // oklab -> LMS' (the cube roots of the cone response)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS -> linear sRGB
  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const encode = (x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
    return Math.min(1, Math.max(0, v));
  };
  return { r: encode(lr) * 255, g: encode(lg) * 255, b: encode(lb) * 255 };
}

/** Number, or a percentage of `full` (CSS Color 4: L 100% = 1, C 100% = 0.4). */
function numOrPct(token, full) {
  const t = String(token).trim();
  return t.endsWith("%") ? (parseFloat(t) / 100) * full : parseFloat(t);
}

/** Angle in degrees; accepts deg (default), rad, grad and turn. */
function angleDeg(token) {
  const t = String(token).trim();
  // "grad" must be tested before "rad": "grad".endsWith("rad") is true.
  if (t.endsWith("grad")) return parseFloat(t) * 0.9;
  if (t.endsWith("rad")) return (parseFloat(t) * 180) / Math.PI;
  if (t.endsWith("turn")) return parseFloat(t) * 360;
  return parseFloat(t);
}

/** Parse a CSS color (#hex / rgb() / rgba() / oklch()) into {r,g,b,a} (0-255 / 0-1). */
function parseColor(str) {
  const s = String(str).trim();
  let m;
  if ((m = s.match(/^#([0-9a-f]+)$/i))) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 4) hex = hex.split("").map((c) => c + c).join("");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  if ((m = s.match(/^rgba?\(([^)]+)\)$/i))) {
    const parts = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    const [r, g, b, a = 1] = parts;
    return { r, g, b, a };
  }
  if ((m = s.match(/^oklch\(([^)]+)\)$/i))) {
    const [components, alphaPart] = m[1].split("/");
    const comps = components.trim().split(/\s+/).filter(Boolean);
    if (comps.length !== 3) throw new Error(`contrast-audit: malformed oklch() "${str}"`);
    const L = numOrPct(comps[0], 1);
    const C = numOrPct(comps[1], 0.4);
    const H = angleDeg(comps[2]);
    const a = alphaPart === undefined ? 1 : numOrPct(alphaPart, 1);
    if (![L, C, H, a].every(Number.isFinite)) {
      throw new Error(`contrast-audit: malformed oklch() "${str}"`);
    }
    const { r, g, b } = oklchToSrgb(L, C, H);
    return { r, g, b, a };
  }
  throw new Error(`contrast-audit: unrecognized color "${str}" (supported: #hex, rgb()/rgba(), oklch())`);
}

/** src over dst; both {r,g,b,a}. Returns opaque-ish {r,g,b}. */
function over(src, dst) {
  const a = src.a + dst.a * (1 - src.a);
  if (a === 0) return { ...dst, a: 0 };
  const r = (src.r * src.a + dst.r * dst.a * (1 - src.a)) / a;
  const g = (src.g * src.a + dst.g * dst.a * (1 - src.a)) / a;
  const b = (src.b * src.a + dst.b * dst.a * (1 - src.a)) / a;
  return { r, g, b, a };
}

/** WCAG relative luminance (0..1). */
function luminance({ r, g, b }) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio between two opaque colors (1..21). */
function contrast(c1, c2) {
  const l1 = luminance(c1);
  const l2 = luminance(c2);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------- audit ---------- */

function valueFor(tokens, name, mode) {
  const entry = tokens[name];
  if (!entry) throw new Error(`contrast-audit: token ${name} not found`);
  return entry[mode];
}

function auditMode(tokens, mode) {
  const page = parseColor(valueFor(tokens, PAGE_TOKEN, mode));
  // Only audit color tokens (skip type ramp size/leading/weight/tracking)
  const textNames = Object.keys(tokens).filter((n) => {
    if (!TEXT_TOKENS.test(n)) return false;
    const e = tokens[n];
    const v = e && e[mode];
    return typeof v === "string" && COLOR_VALUE_RE.test(v.trim());
  });
  if (textNames.length === 0) {
    throw new Error(
      `contrast-audit: no --gary-text-* color tokens matched for mode "${mode}" — refusing to report a vacuous pass`
    );
  }
  const rows = [];
  for (const textName of textNames) {
    const textRaw = parseColor(valueFor(tokens, textName, mode));
    for (const bgName of BACKGROUND_TOKENS) {
      const bgRaw = parseColor(valueFor(tokens, bgName, mode));
      // Effective background = surface token composited over the page.
      const effBg = over(bgRaw, page);
      // Effective foreground = text composited over effective background.
      const effText = over(textRaw, { ...effBg, a: 1 });
      const ratio = contrast(effText, { ...effBg, a: 1 });
      const cells = {};
      for (const [label, threshold] of Object.entries(THRESHOLDS)) {
        cells[label] = ratio >= threshold ? "Pass" : "Fail";
      }
      rows.push({ textName, bgName, ratio, cells });
    }
  }
  return rows;
}

function passFail(v) {
  return v === "Pass" ? "✅ Pass" : "❌ Fail";
}

function main() {
  const data = JSON.parse(readFileSync(TOKENS_JSON, "utf8"));
  const tokens = data.tokens;

  const lines = [];
  lines.append = (...a) => lines.push(...a);
  lines.append("# Gary-UI 对比度审计报告（WCAG 2.x）\n");
  lines.append(
    `源：\`tokens/tokens.json\` ｜ 文本 token：\`--gary-text-*\` ｜ 背景：surface-page / solid-plate / surface-sunken / glass-ultrathin·regular·thick。`,
    "半透明 token 先在 `--gary-surface-page` 上做 alpha 合成再测亮度，比值为用户实际看到的颜色。\n",
    "阈值：AA 正文 ≥ 4.5，AA 大字 ≥ 3.0，AAA 正文 ≥ 7.0，AAA 大字 ≥ 4.5。\n"
  );

  const failures = [];

  for (const mode of MODES) {
    const rows = auditMode(tokens, mode);
    lines.append(`## ${mode.toUpperCase()} 模式\n`);
    lines.append("| 文本 | 背景 | 比值 | AA 正文 | AA 大字 | AAA 正文 | AAA 大字 |");
    lines.append("| --- | --- | ---: | :---: | :---: | :---: | :---: |");
    for (const r of rows) {
      lines.append(
        `| \`${r.textName}\` | \`${r.bgName}\` | ${r.ratio.toFixed(2)} | ${passFail(r.cells["AA normal"])} | ${passFail(r.cells["AA large"])} | ${passFail(r.cells["AAA normal"])} | ${passFail(r.cells["AAA large"])} |`
      );
      if (r.cells["AA normal"] === "Fail") {
        failures.push({ mode, ...r });
      }
    }
    lines.append("");
  }

  lines.append("## 不达标项（未过 AA 正文 4.5:1）\n");
  if (failures.length === 0) {
    lines.append("无 — 所有组合均通过 AA 正文门槛。\n");
  } else {
    lines.append("| 模式 | 文本 | 背景 | 比值 |");
    lines.append("| --- | --- | --- | ---: |");
    for (const f of failures) {
      lines.append(`| ${f.mode} | \`${f.textName}\` | \`${f.bgName}\` | ${f.ratio.toFixed(2)} |`);
    }
    lines.append("");
  }

  writeFileSync(REPORT, lines.join("\n"), "utf8");
  console.log(`contrast-audit: wrote ${REPORT} (${failures.length} AA-normal failures)`);
}

main();

