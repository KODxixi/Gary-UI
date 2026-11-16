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

  '--font-family-body': GARY_FONT_STACK,
  '--font-family-heading': GARY_FONT_STACK,

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
