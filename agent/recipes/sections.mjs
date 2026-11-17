/**
 * Shared section renderers — content.json block -> React tree.
 *
 * Field names follow the finalized contract in `agent/content.schema.md` (v1).
 * Every component/prop below is taken from `astryx component <Name> --json`
 * (cli/core 0.7.16), not guessed.
 */
import { createElement as h } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import {
  Text,
  Heading,
  Badge,
  Banner,
  Divider,
  StatusDot,
  Table,
  VStack,
  HStack,
  Card,
  Button,
  TextInput,
  Grid,
  AspectRatio,
  proportional,
} from '@astryxdesign/core';
import { GARY_DISPLAY_SERIF_STACK } from '../../theme/gary.theme.mjs';

/** Coerce a JSON spacing step ("4") to the number Astryx expects. */
function step(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** trend -> arrow glyph. Text has no semantic colors, so direction is a mark. */
const TREND_ARROW = { up: '↑', down: '↓', flat: '–' };

// KPI delta tones: `good` / `warn` / `bad` / `neutral` → semantic text tokens.
const DELTA_TONE = {
  good: 'var(--color-text-success)',
  warn: 'var(--color-text-warning)',
  bad: 'var(--color-text-error)',
  neutral: 'var(--color-text-secondary)',
};

/**
 * Material surfaces (2026-11-17). Gary's problem was that all seven blocks were
 * the same white card with the same hairline, so nothing asked the eye to stop.
 * A block may now declare `tone`:
 *   default → raised card, today's look
 *   sunken  → page grey, borderless: supporting text the reader may skip
 *   inverse → deep ink green, at most ONE per page: the block to stop at
 * Depth, not decoration: three levels, three reading weights.
 */
const SURFACE = {
  default: 'var(--color-surface-raised)',
  sunken: 'var(--color-surface-sunken)',
  inverse: 'var(--color-surface-inverse)',
};
const SURFACE_TONES = new Set(Object.keys(SURFACE));

/** Resolve a block's surface tone; a container can pin it via `ctx.surface`. */
function surfaceToneOf(p, ctx) {
  const explicit = (ctx && ctx.surface) || (p && p.tone);
  const tone = String(explicit || '').toLowerCase();
  return SURFACE_TONES.has(tone) ? tone : 'default';
}

/**
 * On an inverse surface every base colour token must be re-pointed, otherwise
 * Astryx paints near-black ink on deep green. `--color-border` also backs table
 * rules, so remapping it here fixes headers, row dividers and hairlines at once.
 */
const INVERSE_SCOPE = {
  '--color-text-primary': 'var(--color-surface-inverse-text)',
  '--color-text-secondary': 'var(--color-surface-inverse-muted)',
  '--color-text-disabled': 'var(--color-surface-inverse-muted)',
  '--color-border': 'var(--color-border-inverse)',
  '--color-border-emphasized': 'var(--color-border-inverse)',
  '--color-background-muted': 'var(--color-surface-inverse)',
  '--color-background-card': 'var(--color-surface-inverse)',
};

/** Surface frame shared by tone-carrying blocks (radius + padding tiers apply). */
function surfaceFrame(tone, ctx) {
  return {
    width: '100%',
    ...cardFrame(tierForContext(ctx)),
    background: SURFACE[tone],
    border: 'none',
    ...(tone === 'inverse' ? INVERSE_SCOPE : {}),
  };
}

/**
 * Card shell. `default` keeps the real Astryx Card (layout.mjs still sees a
 * card there); sunken / inverse paint the same frame on a token surface, since
 * Card always resolves to `--color-background-card`.
 */
function SurfaceCard(tone, ctx, children, extra) {
  if (tone === 'default') {
    return h(
      Card,
      { width: '100%', style: cardFrame(tierForContext(ctx)), ...(extra || {}) },
      children
    );
  }
  return h('div', { style: surfaceFrame(tone, ctx) }, children);
}

/**
 * Card radius / padding tiers (width-driven, per Gary's R4 decision).
 *   small  (< 320px)  — KPI tiles            14px / 20px
 *   medium (320–700)  — body cards, callouts 16px / 24px
 *   large  (> 700)    — table shells, page blocks 20px / 28px
 * Radius and padding rise together, so a bigger radius never gets tighter
 * inner space. Card spreads `style` onto its root div, and an inline value
 * beats the StyleX class, which is why this is expressible here.
 */
const CARD_FRAMES = {
  small: { borderRadius: '14px', padding: '24px' },
  medium: { borderRadius: '16px', padding: '24px' },
  large: { borderRadius: '20px', padding: '28px' },
};

function cardFrame(tier) {
  return { ...CARD_FRAMES[tier] };
}

/**
 * Card tier for a block given where it is rendered. A card nested in a grid
 * column is narrower than the page column, so it takes the matching frame
 * instead of the page-level `large` one (that is what layout.mjs asserts).
 */
function tierForContext(ctx) {
  const cols = Number(ctx && ctx.cols) || 0;
  if (!cols) return 'large';
  return cols >= 4 ? 'small' : 'medium';
}

/** Page header: eyebrow / title / badge / sub, optional toolbar. */
export function Header(p) {
  return h(
    VStack,
    { gap: 4 },
    h(
      HStack,
      { justify: 'between', align: 'center', gap: 5, wrap: 'wrap' },
      h(
        VStack,
        { gap: 2 },
        h(
          HStack,
          { gap: 3, align: 'center' },
          p.eyebrow && h(Text, { type: 'supporting' }, p.eyebrow),
          p.badge && h(Badge, { variant: 'info', label: p.badge })
        ),
        h(Heading, {
          level: 1,
          type: 'display-3',
          style: { fontFamily: GARY_DISPLAY_SERIF_STACK },
        }, p.title),
        p.sub && h(Text, { type: 'supporting' }, p.sub)
      ),
      // Toolbar: the search field carries a label above its shell, so aligning
      // the row on the END edge is what actually puts the input shell and the
      // button on the same top/bottom line. Both controls are pinned to the
      // same size step ('md') instead of relying on their natural heights.
      p.toolbar &&
        h(
          HStack,
          { gap: 3, align: 'end', wrap: 'wrap' },
          p.toolbar.search !== undefined &&
            h(TextInput, {
              label: p.toolbar.search,
              value: '',
              placeholder: p.toolbar.search,
              size: 'md',
              onChange: () => {},
            }),
          p.toolbar.action &&
            h(Button, { variant: 'primary', size: 'md', label: p.toolbar.action })
        )
    )
  );
}

/** Cover: eyebrow / title / sub / meta[{k,v}] / badge. */
export function Cover(p) {
  return h(
    VStack,
    { gap: 5 },
    h(
      HStack,
      { gap: 3, align: 'center' },
      p.eyebrow && h(Text, { type: 'supporting' }, p.eyebrow),
      p.badge && h(Badge, { variant: 'info', label: p.badge })
    ),
    // Display-level cover title is the ONLY serif surface in Gary.
    h(Heading, {
      level: 1,
      type: 'display-2',
      style: { fontFamily: GARY_DISPLAY_SERIF_STACK },
    }, p.title),
    p.sub && h(Text, { type: 'body' }, p.sub),
    Array.isArray(p.meta) &&
      p.meta.length > 0 &&
      h(
        HStack,
        { gap: 8, wrap: 'wrap' },
        p.meta.map((m, i) =>
          h(
            VStack,
            { key: i, gap: 1 },
            h(Text, { type: 'supporting', size: 'sm' }, m.k),
            h(Text, { weight: 'medium' }, m.v)
          )
        )
      )
  );
}

/** Long-form section: items[{n, title, paras[]}]. */
export function Prose(p) {
  const items = Array.isArray(p.items) ? p.items : [];
  return h(
    VStack,
    { gap: 6 },
    items.map((it, i) =>
      h(
        VStack,
        { key: i, gap: 2 },
        it.n && h(Text, { type: 'supporting', size: 'sm' }, it.n),
        it.title && h(Heading, { level: 2 }, it.title),
        ...(it.paras || []).map((para, j) => h(Text, { key: j, type: 'body' }, para))
      )
    )
  );
}

/** Body copy: paras[] / note / size. */
export function TextBlock(p) {
  const paras = Array.isArray(p.paras) ? p.paras : [];
  const type = p.size === 'large' ? 'large' : 'body';
  return h(
    VStack,
    { gap: 3, width: '100%', maxWidth: '660px' },
    paras.map((para, i) => h(Text, { key: i, type, display: 'block' }, para)),
    p.note &&
      h(
        'div',
        { style: { paddingTop: '4px' } },
        h(Text, { type: 'supporting', size: 'sm' }, p.note)
      )
  );
}

/** Card head. A short note rides the title's baseline on the right; a long one
 * drops below at 12px. Letting a 60-char note sit beside a 22px heading makes
 * an L-shape that reads as misalignment, not as a caption. */
function CardHead(title, note) {
  if (!title && !note) return null;
  // 按视觉宽度而不是字符数判长短：24 个汉字约 24em，24 个拉丁字符只有 11–13em，
  // 中英混排时同一个阈值会把短说明判成长的（对抗审查第 4 条）。CJK 记 1，其余记 0.5。
  const visualWidth = (s) =>
    [...s].reduce((w, ch) => w + (/[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.5), 0);
  if (note && visualWidth(note) > 24) {
    return h(
      VStack,
      { gap: 2 },
      title && h(Heading, { level: 2 }, title),
      h(Text, { type: 'supporting', style: { maxWidth: '720px' } }, note)
    );
  }
  return h(
    HStack,
    { justify: 'between', align: 'baseline', gap: 4 },
    title && h(Heading, { level: 2 }, title),
    note && h(Text, { type: 'supporting' }, note)
  );
}

/** Delta line: trend arrow + tabular value, coloured by the wrapper. */
function DeltaLine(it, color) {
  const text = it.delta ?? it.hint;
  if (!text) return null;
  return h(
    'div',
    { style: { display: 'flex', alignItems: 'center', gap: '4px', color } },
    it.trend &&
      h(Text, { type: 'supporting', weight: 'medium', color: 'inherit' }, TREND_ARROW[it.trend] ?? ''),
    h(
      'span',
      { style: { fontVariantNumeric: 'tabular-nums' } },
      h(Text, { type: 'supporting', weight: 'medium', color: 'inherit' }, text)
    )
  );
}

/** KPI group: items[{label, value, unit, delta|hint, trend, tone}] / title / note. */
export function Metric(p) {
  const items = Array.isArray(p.items) ? p.items : [];
  // Position rule, not a switch: the FIRST item is the decision point. It gets
  // the inverse surface, a larger numeral ladder (5xl vs 3xl) and up to twice
  // the width of its siblings (flex 2 vs 1) — never a 4-way equal split.
  const heroStyle = {
    // 38% of the row: with three 1-unit siblings and 16px gaps this lands at
    // ~1.98× a sibling, inside the "no more than twice" bound.
    flex: '0 0 38%',
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: SURFACE.inverse,
    borderRadius: '16px',
    padding: '24px',
    boxSizing: 'border-box',
    ...INVERSE_SCOPE,
  };
  const heroTile = (it) =>
    h(
      'div',
      { style: heroStyle },
      h(
        VStack,
        { gap: 1 },
        h(Text, { type: 'supporting', size: 'sm' }, it.label),
        h(
          HStack,
          { gap: 1, vAlign: 'end' },
          h(Text, { size: '4xl', weight: 'medium', hasTabularNumbers: true }, String(it.value ?? '')),
          it.unit && h(Text, { type: 'supporting' }, it.unit)
        ),
        DeltaLine(it, 'var(--color-surface-inverse-text)')
      )
    );
  const plainTile = (it) =>
    h(
      'div',
      { style: { flex: '1 1 0', minWidth: 0, display: 'flex' } },
      h(
        Card,
        { elevation: 'low', width: '100%', style: cardFrame('small') },
        h(
          VStack,
          { gap: 1 },
          h(Text, { type: 'supporting', size: 'sm' }, it.label),
          h(
            HStack,
            { gap: 1, vAlign: 'end' },
            h(Text, { size: '2xl', weight: 'medium', hasTabularNumbers: true }, String(it.value ?? '')),
            it.unit && h(Text, { type: 'supporting' }, it.unit)
          ),
          DeltaLine(it, DELTA_TONE[it.tone] || DELTA_TONE.neutral)
        )
      )
    );

  return h(
    VStack,
    { gap: 4, width: '100%' },
    (p.title || p.note) &&
      h(
        HStack,
        { justify: 'between', align: 'baseline', gap: 4, wrap: 'wrap' },
        p.title && h(Heading, { level: 2 }, p.title),
        p.note && h(Text, { type: 'supporting' }, p.note)
      ),
    h(
      'div',
      {
        style: { display: 'flex', gap: '16px', alignItems: 'stretch', width: '100%' },
      },
      items.map((it, i) => h('div', { key: i, style: { display: 'contents' } }, i === 0 ? heroTile(it) : plainTile(it)))
    )
  );
}

/** Status strip: items[{label, variant, dot}] / align. */
export function BadgeBlock(p) {
  const items = Array.isArray(p.items) ? p.items : [];
  const justify = p.align === 'center' ? 'center' : p.align === 'end' ? 'end' : 'start';
  const dotVariant = (variant) =>
    variant === 'success' || variant === 'warning' || variant === 'error'
      ? variant
      : variant === 'info'
        ? 'accent'
        : 'neutral';

  return h(
    HStack,
    { gap: 2, wrap: 'wrap', justify },
    items.map((it, i) =>
      h(
        HStack,
        { key: i, gap: 2, vAlign: 'center' },
        it.dot && h(StatusDot, { variant: dotVariant(it.variant), label: it.label }),
        h(Badge, {
          variant: it.variant || 'neutral',
          label: it.label,
        })
      )
    )
  );
}

/** Conclusion banner: tone / title / body|text / eyebrow / action{label}. */
export function Callout(p, ctx) {
  // Contract tones are info|success|warning|error; content in the wild also
  // sends the short forms (warn / danger / ok) and `neutral`. Banner only
  // accepts four `status` values and silently drops an unknown one (no
  // background, no border), so every alias is normalised here instead.
  const TONE_TO_STATUS = {
    info: 'info',
    success: 'success',
    ok: 'success',
    good: 'success',
    warning: 'warning',
    warn: 'warning',
    caution: 'warning',
    error: 'error',
    danger: 'error',
    critical: 'error',
    bad: 'error',
  };
  const tone = String(p.tone || 'info').toLowerCase();
  const status = TONE_TO_STATUS[tone] || 'info';
  const isNeutral = !TONE_TO_STATUS[tone];
  const body = p.body ?? p.text;

  // Surface tones mean "this block steps back" or "this is the anchor". They
  // take precedence over the semantic tone: no Banner tint, plain ink on the
  // tone's own surface, so a conclusion can retire to grey without losing its
  // text (Gary: 结语 is the least important line on the page, it must not be
  // the only coloured thing).
  const surface = surfaceToneOf(p, ctx);
  if (surface !== 'default') {
    return SurfaceCard(
      surface,
      ctx,
      h(
        VStack,
        { gap: 2 },
        p.eyebrow && h(Text, { type: 'supporting', size: 'sm' }, p.eyebrow),
        p.title && h(Heading, { level: 3 }, p.title),
        body && h(Text, { type: 'body', display: 'block' }, body)
      )
    );
  }

  const description =
    (p.eyebrow || body) &&
    h(
      VStack,
      { gap: 1 },
      p.eyebrow && h(Text, { type: 'supporting', size: 'sm' }, p.eyebrow),
      body && h(Text, { type: 'body' }, body)
    );

  // Banner does not accept `style` on its root, and it owns its radius
  // (`var(--_banner-radius, var(--radius-container))`) and its padding
  // (`--spacing-3` block / `--spacing-4` inline). Scoping those three
  // variables on a wrapper is the only way to give this one block the large
  // container frame without touching the global tokens.
  const frame = {
    '--_banner-radius': CARD_FRAMES[tierForContext(ctx)].borderRadius,
    // 24px on both axes: the large frame's 28px would distort banner internals.
    '--spacing-3': '20px',
    '--spacing-4': '24px',
  };

  // Neutral tone has no Banner status of its own: reuse `info` and remap the
  // info tints to neutral surfaces/text so the block still reads as a
  // callout instead of an unstyled paragraph. Values stay token-based.
  // Banner paints only the tinted fill; its root has no border, so the outline
  // Gary asked for is drawn on the wrapper (1px, same hue as the text).
  const BORDER_TONE = {
    info: 'var(--color-border-info)',
    success: 'var(--color-border-success)',
    warning: 'var(--color-border-warning)',
    error: 'var(--color-border-error)',
  };

  const neutralScope = {
    '--color-info-muted': 'var(--color-background-muted)',
    '--color-on-info-muted': 'var(--color-text-primary)',
    '--color-text-info': 'var(--color-text-secondary)',
    '--color-icon-info': 'var(--color-text-secondary)',
    '--color-border-info': 'var(--color-border-emphasized)',
  };

  const frameStyle = isNeutral ? { ...frame, ...neutralScope } : frame;

  return h(
    'div',
    {
      style: {
        ...frameStyle,
        border: `1px solid ${isNeutral ? 'var(--color-border-emphasized)' : BORDER_TONE[status]}`,
        borderRadius: frame['--_banner-radius'],
        overflow: 'hidden',
      },
    },
    h(Banner, {
      status,
      title: p.title,
      description,
      endContent:
        p.action && p.action.label
          ? h(Button, { variant: 'primary', size: 'md', label: p.action.label })
          : undefined,
    })
  );
}

/** Divider: label / variant / spacing (vertical breathing room). */
export function DividerBlock(p) {
  return h(
    VStack,
    { width: '100%', paddingBlock: step(p.spacing, 4) },
    h(Divider, { variant: p.variant || 'subtle', label: p.label || undefined })
  );
}

/** Generic card: title / eyebrow / sub / body[] / badge / tag / note / padding / variant / elevation. */
export function CardBlock(p, ctx) {
  const body = Array.isArray(p.body) ? p.body : [];
  // Frame is tier-driven: page-width by default, one step down inside a grid.
  return SurfaceCard(
    surfaceToneOf(p, ctx),
    ctx,
    h(
      VStack,
      // 16px between inner blocks — never the 12px step.
      { gap: 4 },
      (p.eyebrow || p.badge) &&
        h(
          HStack,
          { gap: 3, align: 'center', justify: 'between' },
          h(Text, { type: 'supporting', size: 'sm' }, p.eyebrow || ''),
          p.badge && h(Badge, { variant: 'neutral', label: p.badge })
        ),
      h(Heading, { level: 3 }, p.title),
      p.sub && h(Text, { type: 'supporting' }, p.sub),
      body.length > 0 && h(VStack, { gap: 2 }, body.map((para, i) =>
        h(Text, { key: i, type: 'body', display: 'block' }, para))),
      (p.tag || p.note) &&
        h(
          HStack,
          { gap: 3, wrap: 'wrap', vAlign: 'center' },
          p.tag && h(Badge, { variant: 'neutral', label: p.tag }),
          p.note && h(Text, { type: 'supporting', size: 'sm' }, p.note)
        )
    ),
    { variant: p.variant, elevation: p.elevation }
  );
}

/** Table: title / note / columns[{label,num}] / rows[][] / foot / density / dividers. */
export function TableSection(p, ctx) {
  const cols = Array.isArray(p.columns) ? p.columns : [];
  const rows = Array.isArray(p.rows) ? p.rows : [];
  const columns = cols.map((c, j) => ({
    key: `c${j}`,
    // Astryx renders th contents in an inner element that keeps its own start
    // alignment, so the column `align` alone leaves numeric headers left-aligned
    // over right-aligned values. Wrap the label to inherit the column alignment.
    header: h(
      Text,
      { type: 'supporting', weight: 'medium', display: 'block', justify: c.num ? 'end' : 'start' },
      c.label
    ),
    align: c.num ? 'end' : 'start',
    width: proportional(c.num ? 1 : 2),
    renderCell: (row) =>
      h(
        Text,
        {
          hasTabularNumbers: !!c.num,
          justify: c.num ? 'end' : 'start',
          weight: row.__foot ? 'semibold' : undefined,
        },
        String(row[`c${j}`] ?? '')
      ),
  }));

  const data = rows.map((r, i) => {
    const row = { id: `r${i}` };
    r.forEach((v, j) => {
      row[`c${j}`] = v;
    });
    return row;
  });

  // Astryx Table has no footer slot; the contract leaves the total row to the
  // renderer. We append it as a marked data row with semibold cells.
  if (Array.isArray(p.foot) && p.foot.length === cols.length) {
    const footRow = { id: 'foot', __foot: true };
    p.foot.forEach((v, j) => {
      footRow[`c${j}`] = v;
    });
    data.push(footRow);
  }

  return SurfaceCard(
    surfaceToneOf(p, ctx),
    ctx,
    h(
      VStack,
      { gap: 4 },
      (p.title || p.note) && CardHead(p.title, p.note),
      h(Table, {
        data,
        columns,
        density: p.density || 'balanced',
        dividers: p.dividers || 'rows',
        hasHover: true,
      })
    )
  );
}

/** tone -> StatusDot variant. Semantic tones stay semantic; accent is the default. */
const TONE_DOT = { success: 'success', warning: 'warning', error: 'error', info: 'accent' };
/** tone -> token name for the quote rule. Colour always comes from a token. */
const QUOTE_TONE = {
  accent: '--color-accent',
  success: '--color-success',
  warning: '--color-warning',
  error: '--color-error',
  info: '--color-info',
};

/** matrix cell state -> Badge variant (the only semantic-coloured primitive). */
const CELL_STATE = { good: 'success', warn: 'warning', bad: 'error' };

const IMAGE_RATIO = { '16:9': 16 / 9, '4:3': 4 / 3, '3:2': 3 / 2, '1:1': 1, '21:9': 21 / 9 };

const IMAGE_MIME = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * Keep the product a SINGLE self-contained file: a local image path is read and
 * inlined as a data URI at render time. Remote/data URIs pass through untouched.
 */
function embedImage(src) {
  if (!src) return '';
  if (/^(data:|https?:)/i.test(src)) return src;
  const abs = path.resolve(process.cwd(), src);
  if (!fs.existsSync(abs)) return src;
  const mime = IMAGE_MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

/** Timeline: items[{date, title, text, tone}] / title. Date column + accent nodes. */
export function TimelineBlock(p, ctx) {
  const items = Array.isArray(p.items) ? p.items : [];
  return h(
    VStack,
    { gap: 4, width: '100%' },
    p.title && h(Heading, { level: 2 }, p.title),
    h(
      VStack,
      { gap: 4, width: '100%' },
      items.map((it, i) =>
        h(
          HStack,
          { key: i, gap: 5, align: 'start', width: '100%' },
          h(
            'div',
            { style: { flex: '0 0 96px' } },
            h(
              Text,
              { type: 'supporting', size: 'sm', hasTabularNumbers: true, display: 'block' },
              it.date || ''
            )
          ),
          h(
            VStack,
            { gap: 1, width: '100%' },
            h(
              HStack,
              { gap: 2, align: 'center' },
              h(StatusDot, { variant: TONE_DOT[it.tone] || 'accent' }),
              h(Text, { type: 'body', weight: 'semibold', display: 'block' }, it.title || '')
            ),
            it.text && h(Text, { type: 'supporting', display: 'block' }, it.text)
          )
        )
      )
    )
  );
}

/**
 * Matrix: columns[{key, label, num}] / rows[{label, cells:{key: value | {value, state}}}]
 * / labelHeader / title / note. Reuses Table; a cell with state renders a Badge
 * because Text carries no semantic colour.
 */
export function MatrixBlock(p, ctx) {
  const cols = Array.isArray(p.columns) ? p.columns : [];
  const rows = Array.isArray(p.rows) ? p.rows : [];

  const columns = [
    {
      key: 'label',
      header: h(
        Text,
        { type: 'supporting', weight: 'medium', display: 'block', justify: 'start' },
        p.labelHeader || '对比项'
      ),
      align: 'start',
      width: proportional(2),
      renderCell: (row) => h(Text, { weight: 'medium' }, String(row.label ?? '')),
    },
    ...cols.map((c, j) => ({
      key: `k${j}`,
      header: h(
        Text,
        { type: 'supporting', weight: 'medium', display: 'block', justify: c.num ? 'end' : 'start' },
        c.label
      ),
      align: c.num ? 'end' : 'start',
      width: proportional(c.num ? 1 : 2),
      renderCell: (row) => {
        const cell = (row.cells || {})[c.key];
        if (cell && typeof cell === 'object') {
          if (cell.state && CELL_STATE[cell.state]) {
            return h(Badge, { variant: CELL_STATE[cell.state], label: String(cell.value ?? '') });
          }
          return h(
            Text,
            { justify: c.num ? 'end' : 'start' },
            String(cell.value ?? '')
          );
        }
        return h(Text, { justify: c.num ? 'end' : 'start' }, String(cell ?? ''));
      },
    })),
  ];

  const data = rows.map((r, i) => ({ id: `m${i}`, label: r.label, cells: r.cells || {} }));

  return SurfaceCard(
    surfaceToneOf(p, ctx),
    ctx,
    h(
      VStack,
      { gap: 4 },
      (p.title || p.note) && CardHead(p.title, p.note),
      h(Table, {
        data,
        columns,
        density: p.density || 'balanced',
        dividers: p.dividers || 'rows',
        hasHover: true,
      })
    )
  );
}

/** Image: src / alt / caption / ratio (16:9 | 4:3 | 3:2 | 1:1 | 21:9 | auto). */
export function ImageBlock(p, ctx) {
  const ratio = IMAGE_RATIO[String(p.ratio || '16:9')];
  const img = h('img', {
    src: embedImage(p.src),
    alt: p.alt || '',
    style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  });
  const media = ratio
    ? h(AspectRatio, { ratio, fit: 'cover' }, img)
    : h('div', { style: { width: '100%' } }, img);

  return h(
    VStack,
    { gap: 2, width: '100%' },
    h(
      'div',
      {
        style: {
          width: '100%',
          overflow: 'hidden',
          borderRadius: CARD_FRAMES[tierForContext(ctx)].borderRadius,
          background: 'var(--color-background-muted)',
        },
      },
      media
    ),
    p.caption &&
      h(
        HStack,
        { justify: p.align === 'center' ? 'center' : 'start', width: '100%' },
        h(Text, { type: 'supporting', size: 'sm' }, p.caption)
      )
  );
}

/**
 * Steps: items[{title, text}] / active (zero-based, default 1) / title / note.
 *
 * R8: Astryx `Stepper` was dropped for this block. Its connector ('astryx-step-
 * connector') is a StyleX atomic class: 4px tall, `var(--color-border)` = 8%
 * black, and the indicator is a fixed 16px circle whose fill has no hook to
 * reweight per state. Gary asked for dots >= 10px with accent fill, a >= 1.5px
 * connector that is accent for the walked part and neutral ahead, and even
 * spacing that does not touch the container edge — none of that is reachable
 * through Stepper's props. The block is therefore composed from `ol/li` + token
 * colours, with the same DOM semantics the component used.
 */
export function StepsBlock(p) {
  const items = Array.isArray(p.items) ? p.items : [];
  const n = Math.max(1, items.length);
  const active = Math.min(Math.max(0, step(p.active, 1)), n - 1);
  // Dots sit at the centre of each equal-width cell, so the track starts and
  // ends half a cell in — it never runs to the container edge.
  const halfCell = (0.5 / n) * 100;
  const walked = (active / n) * 100;

  const dotStyle = (done) => ({
    width: '22px',
    height: '22px',
    borderRadius: '9999px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    // Filled in both states: accent for reached/current, a light neutral for
    // upcoming. A hollow ring read as "loading failed"; a dark solid grey read
    // as a second completed step, so upcoming gets a light neutral fill with
    // primary ink — clearly lighter than accent, still fully solid.
    background: done ? 'var(--color-accent)' : 'var(--color-border-emphasized)',
    color: done ? 'var(--color-on-accent)' : 'var(--color-text-primary)',
    border: 'none',
    boxSizing: 'border-box',
  });

  return h(
    VStack,
    { gap: 4, width: '100%' },
    p.title && h(Heading, { level: 2 }, p.title),
    h(
      'div',
      { style: { position: 'relative', width: '100%' } },
      h('div', {
        style: {
          position: 'absolute',
          top: '10px',
          height: '2px',
          left: `${halfCell}%`,
          right: `${halfCell}%`,
          background: 'var(--color-border-emphasized)',
          borderRadius: '2px',
        },
      }),
      h('div', {
        style: {
          position: 'absolute',
          top: '10px',
          height: '2px',
          left: `${halfCell}%`,
          width: `${walked}%`,
          background: 'var(--color-accent)',
          borderRadius: '2px',
        },
      }),
      h(
        'ol',
        {
          style: {
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            width: '100%',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          },
          'aria-label': p.title || '推进节奏',
        },
        items.map((it, i) =>
          h(
            'li',
            {
              key: i,
              style: {
                flex: '1 1 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                minWidth: 0,
              },
            },
            h('div', { style: dotStyle(i <= active) }, String(i + 1)),
            h(
              'div',
              { style: { textAlign: 'center', width: '100%' } },
              h(
                Text,
                {
                  type: 'body',
                  weight: i === active ? 'semibold' : 'medium',
                  display: 'block',
                },
                it.title || `第 ${i + 1} 步`
              )
            ),
            it.text &&
              h(
                'div',
                { style: { textAlign: 'center', width: '100%' } },
                h(Text, { type: 'supporting', size: 'sm', display: 'block' }, it.text)
              )
          )
        )
      )
    ),
    p.note && h(Text, { type: 'supporting' }, p.note)
  );
}

/**
 * Quote: text / source / tone (accent | success | warning | error | info).
 * Blockquote exposes no colour knob, so the rule is drawn here from a token
 * while the type stays one step above body copy.
 */
export function QuoteBlock(p) {
  const token = QUOTE_TONE[p.tone] || QUOTE_TONE.accent;
  return h(
    'div',
    {
      style: {
        width: '100%',
        borderLeft: `4px solid var(${token})`,
        paddingLeft: '20px',
      },
    },
    h(
      VStack,
      { gap: 2, width: '100%' },
      h(Text, { type: 'large', display: 'block' }, p.text || ''),
      (p.source || p.eyebrow) &&
        h(
          Text,
          { type: 'supporting', size: 'sm' },
          [p.eyebrow, p.source].filter(Boolean).join(' · ')
        )
    )
  );
}

/**
 * Grid: cols (2|3|4) / gap / children[block]. The only multi-column container;
 * children are rendered with the column count so nested cards pick the right
 * frame tier instead of the page-level one.
 */
export function GridBlock(p, ctx) {
  const cols = Math.max(1, Math.min(4, Number(p.cols) || 2));
  const children = Array.isArray(p.children) ? p.children : [];
  return h(
    Grid,
    { columns: cols, gap: step(p.gap, 4), width: '100%', align: 'stretch' },
    children.map((child, i) =>
      h('div', { key: child.id || `g${i}` }, renderBlock(child, { ...(ctx || {}), cols }))
    )
  );
}

/**
 * block.type -> renderer. Recipes pick from this table.
 * `header` is the legacy name for `heading`; both resolve to the same renderer.
 */
export const SECTIONS = {
  heading: Header,
  header: Header,
  cover: Cover,
  prose: Prose,
  text: TextBlock,
  metric: Metric,
  card: CardBlock,
  table: TableSection,
  badge: BadgeBlock,
  callout: Callout,
  divider: DividerBlock,
  timeline: TimelineBlock,
  matrix: MatrixBlock,
  image: ImageBlock,
  steps: StepsBlock,
  quote: QuoteBlock,
  grid: GridBlock,
};

/**
 * Blocks that already paint their own card (and therefore read `ctx.surface`).
 * Every other block gets wrapped only when it asks for a non-default tone.
 */
const CARD_OWNED = new Set(['table', 'matrix', 'card', 'callout']);

/**
 * Dispatch one block, applying its surface tone.
 *
 * `tone` lives on `props.tone`. A container may pin it through `ctx.surface`.
 * Card-owned blocks consume the tone themselves; bare blocks (timeline, steps,
 * quote, text, …) get a surface wrapper so `tone` works everywhere.
 */
export function renderSection(block, ctx) {
  const fn = SECTIONS[block.type];
  if (!fn) {
    throw new Error(
      `sections: 未知区块类型 type="${block.type}"（支持: ${Object.keys(SECTIONS).join(', ')}）`
    );
  }
  const props = block.props || {};
  const tone = surfaceToneOf(props, ctx);
  const node = fn(props, { ...(ctx || {}), surface: tone });
  if (tone === 'default' || CARD_OWNED.has(block.type)) return node;
  return h('div', { style: surfaceFrame(tone, ctx) }, node);
}

/** Dispatch one block (kept for containers such as grid). */
export function renderBlock(block, ctx) {
  return renderSection(block, ctx);
}
