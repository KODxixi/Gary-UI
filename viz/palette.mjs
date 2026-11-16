/**
 * viz/palette.mjs — the ONLY place a chart or flow diagram is allowed to get
 * a colour from. Every value below is a CSS custom property defined by the
 * theme (theme/gary.theme.mjs over Astryx's neutral theme), so the page
 * re-colours itself when the theme or mode changes. No hex literal exists in
 * this module, and none is allowed in viz/*.mjs.
 *
 * Token sources actually used:
 *   --color-accent              Gary ink green B (theme/gary.theme.mjs)
 *   --color-* / -muted          Astryx semantic roles (success/warning/error/info)
 *   --color-data-categorical-*  Astryx data roles (categorical series)
 *   --color-text-primary/-secondary, --color-border, --color-track,
 *   --color-background-card/-muted   neutral ladder
 *
 * Series order is a *stable* order: entity -> role is bound once, never
 * re-derived from the current array index inside a chart.
 */

const accent = 'var(--color-accent)';

export const PALETTE = {
  // brand accent — the only hue Gary authored
  accent,
  accentMuted: 'var(--color-accent-muted)',

  // semantic roles kept from the neutral theme (Gary deliberately does not flatten them)
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
  info: 'var(--color-info)',

  // neutral ladder
  textPrimary: 'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  grid: 'var(--color-border)',
  axis: 'var(--color-border-emphasized)',
  track: 'var(--color-track)',
  surface: 'var(--color-background-card)',
  surfaceMuted: 'var(--color-background-muted)',
  surfaceSunken: 'var(--color-background-surface)',

  // categorical series — theme-defined data roles, fixed order
  series: [
    accent,
    'var(--color-data-categorical-blue)',
    'var(--color-data-categorical-orange)',
    'var(--color-data-categorical-purple)',
    'var(--color-data-categorical-brown)',
    'var(--color-data-categorical-teal)',
  ],

  // flow diagram roles (one role = one hue, max four hues per diagram)
  role: {
    input: 'var(--color-data-categorical-orange)',
    process: 'var(--color-data-categorical-blue)',
    decision: 'var(--color-data-categorical-purple)',
    result: 'var(--color-data-categorical-teal)',
  },
};

/** Stable series colour: pass the series index, not the slide of a filter. */
export function seriesColor(index) {
  return PALETTE.series[index % PALETTE.series.length];
}

/**
 * Type steps are theme fonts, not chart-local numbers. chart-recipes.json asks
 * for a 16px label; the theme's step for that role is 14px (--font-size-base).
 * The spec says "字体和颜色应与 Gary Token 对齐", so token wins and the mapping
 * is recorded here once.
 */
export const FONT = {
  label: 'var(--font-size-base)', // 14px — axis + data labels
  small: 'var(--font-size-sm)', // 12px — ticks, legends, annotations
  tiny: 'calc(var(--font-size-sm) - 1px)', // 11px — flow sub labels (spec: 11/12/14 only)
  metric: 'var(--font-size-2xl)', // 24px — centre metric in a ring
  family: 'var(--font-family-body)',
  numeric: 'tabular-nums',
};
