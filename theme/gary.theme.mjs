/**
 * Gary brand theme — built on Astryx `defineTheme`.
 *
 * Scope: brand layer only (accent / typography / radius / surfacing).
 * Semantic colors intentionally keep their own tokens: Gary needs semantic
 * color, not a flattened palette.
 *
 * Decisions locked by Gary:
 *   1. accent = orange, two tiers: bright #F57C00 for surfaces, deep #B85C00
 *      for text (muted #FFF1E0); brand green retired.
 *   2. element / button / card radius = 12px (frames tighten per width band).
 *   3. ONE sans stack everywhere — body, headings and cover title. The display
 *      serif family is retired: it was the only place a second family
 *      appeared, and it read as a template next to the rest of the page.
 *   4. No elevation. Depth comes from a 1px warm hairline plus three surfaces
 *      (raised / sunken / inverse). `--shadow-*` resolve to nothing, and
 *      agent/render.mjs drops the remaining elevation declarations from the
 *      inlined component CSS, so no block is ever lifted off the paper.
 *   5. The page is warm paper (light) and warm near-black (dark), never a cool
 *      grey. Cards sit one step above the paper, not one shadow above it.
 *   6. Type is a restrained ladder (34 / 28 / 20 / 16 / 15 / 13), leading 1.6
 *      for body copy. Sizes are fluid via clamp() so a narrow page does not
 *      jump from one hard step to another.
 *
 * Base is the PREBUILT neutral theme (`@astryxdesign/theme-neutral/built`), so
 * extending it does not trigger the runtime source-injection path.
 */

import { defineTheme, generateThemeCSS } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

/**
 * Latin Helvetica family first, CJK Microsoft YaHei. The ONLY stack in the
 * system: body, headings and the cover title all resolve here.
 */
export const GARY_FONT_STACK =
  '"Helvetica Neue", Helvetica, "Microsoft YaHei", "微软雅黑", Arial, sans-serif';

/** Token overrides authored by Gary. Everything else inherits from neutral. */
export const GARY_TOKEN_OVERRIDES = {
  // Accent is TWO tiers, because one orange cannot be both a surface and text.
  //   accent       = bright orange, hue 30, value 96% — fills, marks, the KPI
  //                  numeral. Reads as orange; at value 60–72% the same hue
  //                  reads as dark orange / earth = brown.
  //   text-accent  = deep orange, hue 30, value 64% — body-size orange text on
  //                  paper (#A35200). Measured on the warm paper #F5F2EC:
  //                  6.03:1, and 6.80:1 on a white card.
  //                  The previous value #B85C00 makes only 4.37:1 on a warm
  //                  near-white paper (#FAF9F6) and 4.54:1 on ours — a link on
  //                  paper can fail AA while the same link inside a card passes,
  //                  which is the silent failure this tier exists to prevent.
  //                  #B85C00 stays as a LARGE-SIZE-ONLY tier (>=24px, or
  //                  >=18.66px bold) for headings, never body copy; it is
  //                  documented here rather than declared as a token because
  //                  nothing in the current block set uses a large orange
  //                  headline (the one large orange numeral sits on the inverse
  //                  surface and needs the bright tier).
  // Contrast: accent on the inverse near-black #1C1917 = 6.4 (light) / 9.4 (dark).
  '--color-accent': ['#F57C00', '#FFA94D'],

  // Neutral pale-orange tint of the same hue, for the one or two quiet marks
  // that need an orange field without becoming a colour block.
  '--color-accent-muted': ['#FFF1E0', '#2A1A05'],

  // Near-black ink for anything sitting ON the bright orange fill. Neutral's
  // on-accent is #ffffff, which is only 2.70:1 on #F57C00 — this is 7.02:1.
  '--color-on-accent': ['#1A0E00', '#111111'],

  // Explicit: these do NOT track accent on their own (links and accent icons
  // otherwise keep the base theme's colour). #A35200, not #B85C00 — see the
  // accent comment above: the deep tier has to survive on a warm paper page.
  // ---- Measure (line length) ------------------------------------------------
  // Two widths, one shared LEFT edge. Narrative copy caps at 680px (~34 CJK
  // glyphs at 15px); data blocks (tables, KPI bands, charts) run 1080px. The
  // page column is 1056 today, so the narrative cap is the one doing work: at
  // full width body copy ran ~60 glyphs and read as a wall.
  '--measure-narrative': '680px',
  '--measure-data': '1080px',
  '--color-text-accent': ['#A35200', '#FFA94D'],
  '--color-icon-accent': ['#A35200', '#FFA94D'],

  // Semantic info returns to a neutral slate blue.
  // Contrast: 5.88 on white, 6.59 on the dark card; info text on #EDF1F6 = 6.74.
  '--color-info': ['#4A6785', '#8FAFC9'],
  '--color-info-muted': ['#EDF1F6', '#141E28'],
  '--color-on-info': ['#ffffff', '#0C1219'],
  '--color-on-info-muted': ['#2A3D4F', '#CBDCEA'],
  '--color-text-info': ['#3A5670', '#9CBCD5'],
  '--color-border-info': ['#4A678540', '#8FAFC966'],
  '--color-icon-info': ['#4A6785', '#8FAFC9'],

  '--color-warning': ['#7f6118', '#e0a93b'],
  '--color-warning-muted': ['#fbf6ea', '#251D08'],
  '--color-on-warning': ['#fff6e0', '#0a0a0a'],
  '--color-on-warning-muted': ['#4a3810', '#f3e3b5'],
  '--color-text-warning': ['#7A5C14', '#e0a93b'],
  '--color-border-warning': ['#8a6a1f40', '#e0a93b66'],
  '--color-icon-warning': ['#8a6a1f', '#e0a93b'],
  '--color-border-success': ['#22765d40', '#78c9ac66'],
  '--color-icon-success': ['#22765d', '#78c9ac'],
  '--color-border-error': ['#a33a2640', '#d58d8066'],
  '--color-icon-error': ['#a33a26', '#d58d80'],

  // ---- Paper, ink, hairline ------------------------------------------------
  // Light:  warm off-white paper (#F5F2EC) + pure white card. Separation 1.11.
  // Dark:   PURE NEUTRAL BLACK — no warm/brown hue. Gary decision 2026-11-18.
  //         #111111 body / #1C1C1C card / #161616 muted. No colour cast.
  '--color-background-body': ['#F5F2EC', '#111111'],
  '--color-background-surface': ['#FFFFFF', '#1C1C1C'],
  '--color-background-card': ['#FFFFFF', '#1C1C1C'],
  '--color-background-popover': ['#FFFDF9', '#222222'],
  '--color-background-muted': ['#EFEAE2', '#161616'],

  // Light: warm ink (#1B1713). Dark: neutral near-white (#F0F0F0, no hue).
  '--color-text-primary': ['#1B1713', '#F0F0F0'],
  '--color-text-secondary': ['#655C54', '#9A9A9A'],

  // Hairlines: warm low-alpha black (light) / neutral low-alpha white (dark).
  '--color-border': ['#3A2E241A', '#FFFFFF18'],
  '--color-border-emphasized': ['#D9D2C7', '#333333'],
  '--color-border-subtle': ['#E6DFD4', '#252525'],

  // Material ladder.
  '--color-surface-raised': ['#FFFFFF', '#1C1C1C'],
  '--color-surface-sunken': ['#EFEAE2', '#161616'],
  '--color-surface-inverse': ['#1C1917', '#050505'],
  '--color-surface-inverse-text': ['#F3EEE6', '#EFEFEF'],
  '--color-surface-inverse-muted': ['#B7AFA4', '#9A9A9A'],
  '--color-border-inverse': ['#FFFFFF2E', '#FFFFFF26'],

  // ---- No elevation --------------------------------------------------------
  // Three tiers of shadow resolve to nothing. Depth is the hairline's job.
  // agent/render.mjs also strips the elevation declarations that Astryx hard-
  // codes into component classes, so a Card cannot be lifted off the paper
  // even if a block passes `elevation: "low"`.
  '--shadow-low': '0 0 transparent',
  '--shadow-med': '0 0 transparent',
  '--shadow-high': '0 0 transparent',

  '--font-family-body': GARY_FONT_STACK,
  '--font-family-heading': GARY_FONT_STACK,

  // ---- Type ladder ---------------------------------------------------------
  // Ladder: cover 34 / page h1 26–30 / h2 20 / h3 16 / body 15 / supporting 13.
  // display-2 (cover) and display-3 (page header) are deliberately DIFFERENT
  // steps: same value on both made the two levels visually identical.
  // Sizes are fluid (clamp) so a narrow page does not jump a hard step.
  // Body copy runs 15/24 (1.6) — 14px packed 54 CJK glyphs per line and read as
  // a wall.
  //
  // WEIGHTS: 600 / 500 / 400 only. Nothing >= 700. Reason: on Windows,
  // Microsoft YaHei ships Light/Regular/Bold — 700 is already its heaviest cut,
  // and anything above is synthesised and smears the strokes. Because 500/600
  // both render as Bold in YaHei, hierarchy may NOT lean on weight alone: every
  // level difference here also carries a size step and an ink step
  // (primary / secondary), which is what actually reads in Chinese.
  '--text-display-2-size': 'clamp(1.875rem, 3.4vw, 2.125rem)',
  '--text-display-2-leading': '1.2',
  '--text-display-2-weight': '600',
  '--text-display-3-size': 'clamp(1.625rem, 2.8vw, 1.875rem)',
  '--text-display-3-leading': '1.2',
  '--text-display-3-weight': '600',
  '--text-heading-1-size': 'clamp(1.5rem, 2.6vw, 1.75rem)',
  '--text-heading-1-leading': '1.3',
  '--text-heading-1-weight': '600',
  '--text-heading-2-size': '1.25rem',
  '--text-heading-2-leading': '1.35',
  '--text-heading-2-weight': '600',
  '--text-heading-3-size': '1rem',
  '--text-heading-3-leading': '1.4',
  '--text-heading-3-weight': '600',
  '--text-body-size': '0.9375rem',
  '--text-body-leading': '1.6',
  // Large is quote / lead copy: one step up, same leading, normal weight —
  // semibold at 17px read as a second heading.
  '--text-large-size': '1.0625rem',
  '--text-large-leading': '1.6',
  '--text-large-weight': '400',
  '--text-supporting-size': '0.8125rem',
  '--text-supporting-leading': '1.55',
  // Labels / table headers / numerals use 500; body 400. The base theme's
  // heading-4..6 and any component that asks for "bold" resolve to 600 here,
  // so no rule in the inline sheet can emit 700.
  '--text-label-weight': '500',
  '--font-weight-bold': '600',

  // Radius hierarchy: element/container 12, inner 8, full stays 9999.
  '--radius-element': '12px',
  '--radius-container': '12px',
  '--radius-inner': '8px',

  // ---- Chart palette -------------------------------------------------------
  // Chart colours follow Google's set; the brand hue is not the plot primary,
  // so a single-series chart never turns the page monochrome.
  // 1–4 是 Google 品牌 logo 色（chromium ui/android/.../color_palette.xml 的
  // google_logo_blue/red/yellow/green），**不是 Material 500**。
  // 5/6/8 取 Material purple/cyan/blue-grey 500；7 取 deep orange 400，因为
  // 500 的 #FF5722 与 data-2 红太近。
  // Dark mode uses Material 200/300 so the same hue stays legible on the card.
  '--color-data-categorical-blue': ['#4285F4', '#8AB4F8'], // Google logo blue
  '--color-data-categorical-red': ['#EA4335', '#F28B82'], // Google logo red
  '--color-data-categorical-yellow': ['#FBBC05', '#FDD663'], // Google logo yellow（只填充）
  '--color-data-categorical-green': ['#34A853', '#81C995'], // Google logo green
  '--color-data-categorical-purple': ['#9C27B0', '#CE93D8'], // Material purple 500
  '--color-data-categorical-cyan': ['#00ACC1', '#4DD0E1'], // Material cyan 500
  '--color-data-categorical-orange': ['#FF7043', '#FFAB91'], // Material deep orange 400
  '--color-data-categorical-gray': ['#78909C', '#B0BEC5'], // Material blue grey 500

  // `primary` is Google blue — the UI accent (#B85C00) stays out of the plots.
  // `--color-data-neutral` 不在这里声明：底座已有，重复声明会静默覆盖底座值。
  '--color-data-primary': ['#4285F4', '#8AB4F8'],
};

export const garyTheme = defineTheme({
  name: 'gary',
  extends: neutralTheme,
  tokens: GARY_TOKEN_OVERRIDES,
});

/**
 * Returns the CSS this theme generates at runtime, as one string.
 *
 * Astryx exposes `generateThemeCSS(theme)`; it returns two scopes:
 *   - `prose`      — typography resets (h1..h6 etc.)
 *   - `component`  — the resolved token block for every component
 * Concatenated here in that order so callers can pipe it into a file or a
 * `<style>` tag without knowing the internals.
 */
export function garyThemeCSS() {
  const { prose, component } = generateThemeCSS(garyTheme);
  return [prose, component].filter(Boolean).join('\n');
}

/** Keys this theme actually overrides (for checks / docs, not selection). */
export const garyThemeTokenKeys = Object.keys(garyTheme.__inputTokens ?? GARY_TOKEN_OVERRIDES);

export default garyTheme;
