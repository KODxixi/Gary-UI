/**
 * Gary brand theme — built on Astryx `defineTheme`.
 *
 * Scope: brand layer only (accent / typography / radius).
 * Semantic colors (success / warning / error / info) intentionally keep the
 * Astryx neutral defaults — Gary needs semantic color, not a flattened palette.
 *
 * Decisions locked by Gary (2026-11-16):
 *   1. accent = ink green B  #24514a  (muted #dde8e4)
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
  // Ink green B. Dark mode lifts the same hue so it still reads on dark surfaces.
  '--color-accent': ['#24514a', '#5d9c8f'],

  // Coordinated muted tint of the same hue.
  '--color-accent-muted': ['#dde8e4', '#22403a'],

  // Explicit: these do NOT track accent on their own (links and accent icons
  // otherwise keep the base theme's color).
  '--color-text-accent': ['#24514a', '#5d9c8f'],
  '--color-icon-accent': ['#24514a', '#5d9c8f'],

  // Semantic: info / warning are re-hued onto the ink-green family (R8).
  // Astryx neutral ships a bright blue info (#0074e2 / muted #b9d7ff) that reads
  // as a foreign accent next to #24514a, and a glare-yellow warning #ffce2f.
  // The Banner (callout) paints with `-muted` + `on-*-muted`; Badge paints with
  // the solid token + `on-*`, so both layers are pinned here.
  //   info    : #3d6b62  solid | #e8f0ee muted | #2f6157 text
  //   warning : #7f6118  solid | #fbf3e0 muted | #8a6a1f text (deep amber)
  '--color-info': ['#3d6b62', '#7fb3a8'],
  '--color-info-muted': ['#e8f0ee', '#223a33'],
  '--color-on-info': ['#ffffff', '#0f201c'],
  '--color-on-info-muted': ['#1f4038', '#cfe6e0'],
  '--color-text-info': ['#2f6157', '#8fc6bb'],

  '--color-warning': ['#7f6118', '#e0a93b'],
  '--color-warning-muted': ['#fbf3e0', '#3a2f14'],
  '--color-on-warning': ['#fff6e0', '#0a1317'],
  '--color-on-warning-muted': ['#4a3810', '#f3e3b5'],
  '--color-text-warning': ['#8a6a1f', '#e0a93b'],

  '--font-family-body': GARY_FONT_STACK,
  '--font-family-heading': GARY_FONT_STACK,

  // Dark-mode surfaces (R6). Neutral ships `--color-background-card` equal to
  // `--color-background-body` in dark (#1b1b1b), so cards and the page were the
  // same colour and the card only survived as a 10%-white hairline. Lifting the
  // card surface makes a card read as a card again while keeping the page dark.
  // `--color-border` also backs table row rules and the divider; 10% white is
  // invisible on #1b1b1b, so the dark value is raised to 18% white.
  '--color-background-card': ['#ffffff', '#262626'],
  '--color-border': ['#00000014', '#ffffff2E'],

  // Radius hierarchy: element/container 12, inner 8, full stays 9999.
  '--radius-element': '12px',
  '--radius-container': '12px',
  '--radius-inner': '8px',
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
