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
  // brand accent — UI only (borders, links). Chart marks use `primary` below:
  // the legacy system deliberately kept chart ink off the UI accent.
  accent,
  accentMuted: 'var(--color-accent-muted)',

  // chart roles — legacy Gary-UI chart system, copied verbatim
  // (archive/legacy-2026-11/spec/chart-recipes.json themes.light/dark)
  primary: 'var(--color-data-primary)',
  secondary: 'var(--color-data-secondary)',
  reference: 'var(--color-data-reference)',
  negative: 'var(--color-data-negative)',
  chartNeutral: 'var(--color-data-neutral)',

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

  // Categorical series — EIGHT hues, bound to the Astryx categorical token family
  // `--color-data-categorical-*` (values overridden in theme/gary.theme.mjs).
  // Reusing the base family instead of inventing `--color-data-1..8` keeps one
  // naming scheme; the base values are too dark and don't vary by light/dark.
  // Series colour is bound by *entity index*, so the same town / 户型 / 付款方式
  // keeps the same colour across every chart on the page.
  // `mono` stays available for encodings where the value IS the colour
  // (single-hue progress bars, heat ramps) — never for category separation.
  series: [
    'var(--color-data-categorical-blue)',
    'var(--color-data-categorical-red)',
    'var(--color-data-categorical-yellow)',
    'var(--color-data-categorical-green)',
    'var(--color-data-categorical-purple)',
    'var(--color-data-categorical-cyan)',
    'var(--color-data-categorical-orange)',
    'var(--color-data-categorical-gray)',
  ],
  mono: [1, 0.78, 0.58, 0.38],

  // flow diagram roles (one role = one hue, max four hues per diagram).
  // Bound to the same data palette so a diagram never invents a colour the
  // charts don't already use.
  role: {
    input: 'var(--color-data-categorical-gray)', // 黄 1.71 对白底，当描边几乎看不见
    process: 'var(--color-data-categorical-blue)',
    decision: 'var(--color-data-categorical-purple)',
    result: 'var(--color-data-categorical-green)', // 原是红：把「写出 HTML」这种成功出口画成红框
  },
};

// Yellow (#FBBC05, index 2) is a fill colour, not a line colour — on white it
// reads as a ghost stroke. Lines take green, histograms purple.
const SINGLE_HUE = { bar: 0, line: 3, area: 5, histogram: 4 };

/**
 * Paint for a series index. Mirrors the legacy family mapping:
 *   kind='single' (default for bar/line/area/histogram) — one role: chart primary.
 *   kind='single','bar','line','area','histogram' — a single series still gets its
 *     own hue per chart type. Six single-series charts sharing one ink-green reads
 *     as a monochrome page, not as a palette.
 *   kind='series'/'pair'/'ramp' — categorical: a distinct hue per index (category1..8).
 *   kind='mono' — primary hue stepped by opacity, for value-is-colour encodings.
 */
export function seriesStyle(index, kind = 'single') {
  if (kind === 'mono') {
    const op = PALETTE.mono[index];
    return op === undefined
      ? { fill: PALETTE.track, fillOpacity: 1 }
      : { fill: PALETTE.primary, fillOpacity: op };
  }
  if (kind === 'single' || SINGLE_HUE[kind] !== undefined) {
    const hue = SINGLE_HUE[kind];
    if (hue === undefined) return { fill: PALETTE.primary, fillOpacity: 1 };
    return { fill: PALETTE.series[hue] ?? PALETTE.primary, fillOpacity: 1 };
  }
  const hues = PALETTE.series;
  const hue = hues[index % hues.length];
  return { fill: hue === undefined ? PALETTE.track : hue, fillOpacity: 1 };
}

/** Stroke/fill colour on its own (a line uses stroke + strokeOpacity). */
export function seriesColor(index, kind = 'ramp') {
  return seriesStyle(index, kind).fill;
}

export function seriesOpacity(index, kind = 'ramp') {
  return seriesStyle(index, kind).fillOpacity;
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
