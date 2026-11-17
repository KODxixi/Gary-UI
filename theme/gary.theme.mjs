/**
 * Gary brand theme — built on Astryx `defineTheme`.
 *
 * Scope: brand layer only (accent / typography / radius).
 * Semantic colors (success / warning / error / info) intentionally keep the
 * Astryx neutral defaults — Gary needs semantic color, not a flattened palette.
 *
 * Decisions locked by Gary (2026-11-16, accent revised 2026-11-17):
 *   1. accent = orange, two tiers: bright #F57C00 for surfaces, deep #B85C00
 *      for text (muted #FFF1E0); brand green retired
 *   2. element / button / card radius = 12px
 *   3. body + headings stay Helvetica; only display-level titles use serif
 *
 * Base is the PREBUILT neutral theme (`@astryxdesign/theme-neutral/built`), so
 * extending it does not trigger the runtime source-injection path.
 */

import { defineTheme, generateThemeCSS } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

/**
 * Latin Helvetica family first, CJK Microsoft YaHei. Used for body and for all
 * heading levels except the display-level cover title.
 */
export const GARY_FONT_STACK =
  '"Helvetica Neue", Helvetica, "Microsoft YaHei", "微软雅黑", Arial, sans-serif';

/**
 * Display-only serif stack. Astryx ships no display font token
 * (`--font-family-body` / `-heading` / `-code` only), so this stack is applied
 * at the Cover block on the display-2 heading, never through a global token.
 */
export const GARY_DISPLAY_SERIF_STACK =
  'Georgia, "Songti SC", "SimSun", "Times New Roman", serif';

/** Token overrides authored by Gary. Everything else inherits from neutral. */
export const GARY_TOKEN_OVERRIDES = {
  // Accent is TWO tiers, because one orange cannot be both a surface and text.
  //   accent       = bright orange, hue 30, value 96% — fills, buttons, marks,
  //                  the KPI numeral. Reads as orange; at value 60–72% the same
  //                  hue reads as dark orange / earth = brown.
  //   text-accent  = deep orange, hue 30, value 72% — body-size text on white,
  //                  where the bright tier only makes 2.70:1.
  // Contrast: accent on the inverse near-black #181614 = 6.67 (light) /
  // 9.48 (dark); text-accent on the white card = 4.60.
  '--color-accent': ['#F57C00', '#FFA94D'],

  // Neutral pale-orange tint of the same hue. Deep accent text on it = 4.14.
  '--color-accent-muted': ['#FFF1E0', '#3A2213'],

  // Near-black ink for anything sitting ON the bright orange fill. Neutral's
  // on-accent is #ffffff, which is only 2.70:1 on #F57C00 — this is 7.02:1.
  '--color-on-accent': ['#1A0E00', '#111111'],

  // Explicit: these do NOT track accent on their own (links and accent icons
  // otherwise keep the base theme's color).
  '--color-text-accent': ['#B85C00', '#FFA94D'],
  '--color-icon-accent': ['#B85C00', '#FFA94D'],

  // Semantic info returns to a neutral slate blue. History: R8 re-hued info
  // onto the brand-green family so a green callout would not read as a second
  // brand colour. With an orange accent that rationale is gone — green has no
  // brand role left and would become a second accent, so info goes back to a
  // cool neutral that cannot compete with the orange. The old dark info tone
  // was also nearly invisible on the #262626 card.
  // Contrast: 5.88 on white, 6.59 on the dark card; info text on #EDF1F6 = 6.74.
  // The Banner (callout) paints with `-muted` + `on-*-muted`; Badge paints with
  // the solid token + `on-*`, so both layers are pinned here.
  '--color-info': ['#4A6785', '#8FAFC9'],
  '--color-info-muted': ['#EDF1F6', '#1E2A35'],
  '--color-on-info': ['#ffffff', '#0C1219'],
  '--color-on-info-muted': ['#2A3D4F', '#CBDCEA'],
  '--color-text-info': ['#3A5670', '#9CBCD5'],
  '--color-border-info': ['#4A678540', '#8FAFC966'],
  '--color-icon-info': ['#4A6785', '#8FAFC9'],

  '--color-warning': ['#7f6118', '#e0a93b'],
  // #fbf3e0 read as white on the page — Gary's callout looked like a plain
  // paragraph. Deepened one step so the tint is visible without competing
  // with the orange accent.
  '--color-warning-muted': ['#fbf6ea', '#3a2f14'],
  '--color-on-warning': ['#fff6e0', '#0a1317'],
  '--color-on-warning-muted': ['#4a3810', '#f3e3b5'],
  '--color-text-warning': ['#8a6a1f', '#e0a93b'],
  '--color-border-warning': ['#8a6a1f40', '#e0a93b66'],
  '--color-icon-warning': ['#8a6a1f', '#e0a93b'],
  '--color-border-success': ['#22765d40', '#78c9ac66'],
  '--color-icon-success': ['#22765d', '#78c9ac'],
  '--color-border-error': ['#a33a2640', '#d58d8066'],
  '--color-icon-error': ['#a33a26', '#d58d80'],

  '--font-family-body': GARY_FONT_STACK,
  '--font-family-heading': GARY_FONT_STACK,

  // A3 · type ladder: h2 sits above body without catching the page title.
  '--text-heading-2-size': '1.375rem',
  '--text-heading-2-leading': '1.3',
  // A6 · body copy at 15/26 — 14px runs 54 CJK glyphs per line.
  '--text-body-size': '0.9375rem',
  '--text-body-leading': '1.7333',

  // Dark-mode surfaces (R6). Neutral ships `--color-background-card` equal to
  // `--color-background-body` in dark (#1b1b1b), so cards and the page were the
  // same colour and the card only survived as a 10%-white hairline. Lifting the
  // card surface makes a card read as a card again while keeping the page dark.
  // `--color-border` also backs table row rules and the divider; 10% white is
  // invisible on #1b1b1b, so the dark value is raised to 18% white.
  '--color-background-card': ['#ffffff', '#262626'],
  '--color-border': ['#00000014', '#ffffff2E'],

  // Material ladder (2026-11-17). Gary's diagnosis: every block was the same
  // white card with the same hairline, so a 7-section page had one rhythm.
  // Three depths give the eye a hierarchy: raised (read normally), sunken
  // (supporting / skippable), inverse (the one block you must stop for).
  //   raised  = today's card surface, unchanged
  //   sunken  = page-level grey, no border
  //   inverse = warm near-black (hue 30, sat 17%), the deepest step, one per
  //             page; NOT the chart primary. Orange stays on the content
  //             (figures, links, emphasis), never as a large background: a
  //             big saturated orange field reads as a food-delivery app, and
  //             a low-lightness high-saturation orange reads as brown.
  '--color-surface-raised': ['#ffffff', '#262626'],
  '--color-surface-sunken': ['#F4F4F1', '#161616'],
  '--color-surface-inverse': ['#181614', '#131211'],
  '--color-surface-inverse-text': ['#F2F5F4', '#E8EDEB'],
  '--color-surface-inverse-muted': ['#B8B0A8', '#A69E96'],
  '--color-border-subtle': ['#EAEAE7', '#242424'],
  // Rules inside an inverse block. Inverse is dark in BOTH modes, so this
  // single translucent white works on both (border-subtle's #242424 would
  // vanish on #181614).
  '--color-border-inverse': ['#FFFFFF2E', '#FFFFFF2E'],

  // Radius hierarchy: element/container 12, inner 8, full stays 9999.
  '--radius-element': '12px',
  '--radius-container': '12px',
  '--radius-inner': '8px',

  // Categorical data palette (R10/R11). Astryx ships NO data/categorical token,
  // so these are authored here. HUES are the legacy Gary-UI chart categories
  // verbatim (archive/legacy-2026-11/spec/chart-recipes.json
  // themes.{light,dark}.category1..8). LIGHTNESS is the midpoint between the
  // legacy light and dark values, because the legacy light set was tuned to
  // punch off a #f5f5f7 chart panel and reads too heavy on Gary's white page —
  // Gary's words: "这些太深". Hue is untouched; only L moves.
  //   legacy light: #386aa9 #89600a #22765d #795098 #a85548 #367989 #965579 #70665a
  //   legacy dark : #82acec #d5af59 #78c9ac #be9bda #d58d80 #82b4bf #dda2c4 #aba69e
  // ---- Chart palette: Google 品牌四色 + Material 扩展 ---------------------
  // Gary 2026-11-17: chart colours follow Google's set; the brand hue is not
  // the plot primary (the UI accent stays out of the charts).
  // 1–4 是 Google 品牌 logo 色（chromium ui/android/.../color_palette.xml 的
  // google_logo_blue/red/yellow/green），**不是 Material 500** —— Material 500
  // 是 #2196F3/#F44336/#FFEB3B/#4CAF50，更灰，也不是 Google Charts 那套。
  // 5/6/8 取 Material purple/cyan/blue-grey 500；7 取 deep orange 400，因为
  // 500 的 #FF5722 与 data-2 红太近。
  // Dark mode uses Material 200/300 so the same hue stays legible on #262626.
  // 复用 Astryx 底座已声明的分类色 token 名 --color-data-categorical-*，只换值。
  // 底座给的是 #0171E3/#F5394F/#0B991F 这类深色、且 light-dark 两侧同值（暗页上
  // 不可用），Gary 明确否决过「太深」。底座没有 yellow / gray 两个 categorical，
  // 按同一命名规范补齐 —— 自造新的数据色名会和底座各演进一套。
  '--color-data-categorical-blue': ['#4285F4', '#8AB4F8'], // Google logo blue
  '--color-data-categorical-red': ['#EA4335', '#F28B82'], // Google logo red
  '--color-data-categorical-yellow': ['#FBBC05', '#FDD663'], // Google logo yellow（只填充）
  '--color-data-categorical-green': ['#34A853', '#81C995'], // Google logo green
  '--color-data-categorical-purple': ['#9C27B0', '#CE93D8'], // Material purple 500
  '--color-data-categorical-cyan': ['#00ACC1', '#4DD0E1'], // Material cyan 500
  '--color-data-categorical-orange': ['#FF7043', '#FFAB91'], // Material deep orange 400
  '--color-data-categorical-gray': ['#78909C', '#B0BEC5'], // Material blue grey 500

  // Chart role colours. `primary` is Google blue — the UI accent (#B85C00) is
  // the brand colour and stays out of the plots, otherwise every single-series
  // chart turns the page monochrome.
  // `--color-data-neutral` 不在这里声明：底座已有（light-dark(#8494A3,#8C939B)），
  // 重复声明会静默覆盖底座值，产出里同一 token 出现两次。
  '--color-data-primary': ['#4285F4', '#8AB4F8'],
  // secondary / reference / negative 三个曾在这里声明，全仓 0 消费者（grep PALETTE.*
  // 只用 primary / track / series），已删 —— 无人读取的 token 只会误导后来改色的人。
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
 *
 * NOTE: this is the same CSS the unbuilt `Theme` provider injects. When a
 * prebuilt CSS file exists (`astryx theme build`), prefer that instead.
 */
export function garyThemeCSS() {
  const { prose, component } = generateThemeCSS(garyTheme);
  return [prose, component].filter(Boolean).join('\n');
}

/** Keys this theme actually overrides (for checks / docs, not selection). */
export const garyThemeTokenKeys = Object.keys(garyTheme.__inputTokens ?? GARY_TOKEN_OVERRIDES);

export default garyTheme;
