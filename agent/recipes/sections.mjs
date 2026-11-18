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
  Grid,
  AspectRatio,
  proportional,
} from '@astryxdesign/core';

/** Coerce a JSON spacing step ("4") to the number Astryx expects. */
function step(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * paras / body 只接受非空字符串。对象或 null 直传 React 会抛
 * "Objects are not valid as a React child"（D13，无 block id 无字段名）；
 * 这里统一过滤 + 带定位告警，与 MWG 轨 stringList() 同一口径。
 */
function stringList(list, where) {
  if (!Array.isArray(list)) return [];
  return list.filter((v, j) => {
    if (typeof v === 'string' && v.trim() !== '') return true;
    const kind = v === null ? 'null' : typeof v === 'string' ? '空串' : Array.isArray(v) ? 'array' : typeof v;
    console.warn(`[sections] ${where}[${j}] 不是非空字符串（${kind}），已跳过`);
    return false;
  });
}

/** 块定位串，由 renderSection 写进 ctx.at（"type=text id=n2"）。 */
const atOf = (ctx) => (ctx && ctx.at) || '区块';

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
 *   inverse → warm near-black, at most ONE per page: the block to stop at
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
  // Text.accent resolves to text-accent (the deep tier). On a dark surface the
  // deep tier is too dark to read as orange (3.93:1), so accent text flips to
  // the bright tier here (6.67:1 on the warm near-black inverse surface) — the
  // KPI hero numeral is the case.
  '--color-text-accent': 'var(--color-accent)',
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
 *   small  (< 320px)  — KPI tiles            12px / 20px
 *   medium (320–700)  — body cards, callouts 14px / 20px
 *   large  (> 700)    — table shells, page blocks 18px / 24px
 * Radius and padding rise together, so a bigger radius never gets tighter
 * inner space. 20px is the measured floor in layout.mjs (rule 2/4) and also the
 * MWG reference's card inset: a hairline needs air around it or the card reads
 * as a table cell, not as a surface.
 */
const CARD_FRAMES = {
  small: { borderRadius: '12px', padding: '20px' },
  medium: { borderRadius: '14px', padding: '20px' },
  large: { borderRadius: '18px', padding: '24px' },
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

/**
 * Measure (line length), from theme tokens so the two widths stay one decision.
 *   narrative  680px — body / prose / quote / cover sub. ~34 CJK glyphs at 15px.
 *   data       1080px — tables, KPI bands, charts (the page column is 1056, so
 *                      the cap only binds on a wider shell).
 * Both share the LEFT edge: a report is one column with a wider exception, not
 * a stack of centred islands.
 */
const MEASURE_NARRATIVE = 'var(--measure-narrative)';
const MEASURE_DATA = 'var(--measure-data)';

/**
 * heading.level 口径（两轨统一，2026-11-19）：缺省 2，钳到 1–6。
 * 此前三口径打架：content.schema.md 默认 1、MWG 默认 2、本文件恒 level 1（level:2 也出 h1）。
 * mwg/render.mjs 的 heading() 用同一个表达式，改这里要同步改那里。
 */
function headingLevel(p) {
  return Math.min(Math.max(Number(p && p.level) || 2, 1), 6);
}

/** Page header: eyebrow / title / badge / sub. No toolbar — see the note below. */
export function Header(p) {
  return h(
    VStack,
    {
      gap: 4,
      // Heading rhythm is asymmetric on purpose: the gap ABOVE a section title
      // must read as "this title belongs to what follows", not as the tail of
      // the previous block. Measured against the recipe gaps (report 40px,
      // table 24px): above = 24+gap -> 64 / 48, below = gap-12 -> 28 / 12.
      // Equal top/bottom is the single most common default-stylesheet mistake.
      style: { marginTop: '24px', marginBottom: '-12px' },
    },
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
        // 视觉恒 display-3（页面主标题），level 只决定 h1–h6 语义标签。
        h(Heading, {
          level: headingLevel(p),
          type: 'display-3',
        }, p.title),
        p.sub && h(Text, { type: 'supporting' }, p.sub)
      ),
      // No toolbar here on purpose. A zero-script single-file artifact cannot
      // search or export, so rendering <input>/<button> would ship dead
      // controls that look operable. `selfcheck` now fails any product that
      // contains form controls without a <script>. A host app that supplies
      // behaviour renders its own chrome; this system emits content only.

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
    // Cover title: same sans stack as every other heading (MWG W1 retired the
    // display serif).
    h(Heading, {
      level: 1,
      type: 'display-2',
    }, p.title),
    p.sub &&
      h(
        Text,
        { type: 'body', display: 'block', style: { maxWidth: MEASURE_NARRATIVE } },
        p.sub
      ),
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
export function Prose(p, ctx) {
  const items = Array.isArray(p.items) ? p.items : [];
  return h(
    VStack,
    { gap: 6, width: '100%', maxWidth: MEASURE_NARRATIVE },
    items.map((it, i) =>
      h(
        VStack,
        { key: i, gap: 2, width: '100%', maxWidth: MEASURE_NARRATIVE },
        it.n && h(Text, { type: 'supporting', size: 'sm' }, it.n),
        it.title && h(Heading, { level: 2 }, it.title),
        ...stringList(it.paras, `${atOf(ctx)}.items[${i}].paras`).map((para, j) =>
          h(Text, { key: j, type: 'body' }, para)
        )
      )
    )
  );
}

/** Body copy: paras[] / note / size. */
export function TextBlock(p, ctx) {
  const paras = stringList(p.paras, `${atOf(ctx)}.paras`);
  const type = p.size === 'large' ? 'large' : 'body';
  return h(
    VStack,
    { gap: 3, width: '100%', maxWidth: MEASURE_NARRATIVE },
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

/**
 * Section title that sits OUTSIDE a card (metric band, timeline, steps).
 *
 * The block rhythm alone gives every section an equal gap above and below, so a
 * title looks like it is closing the previous block. This pushes it 12px further
 * down: on the report shell (40px block gap) the gap above reads 52px while the
 * gap below stays at the 16px inner stack gap — the title unmistakably belongs
 * to what follows. Titles INSIDE a card (CardHead / scorecard / table) keep the
 * tuned card gaps and must not use this.
 */
const sectionTitle = (text) => h(Heading, { level: 2, style: { marginTop: '12px' } }, text);

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
  const siblings = Math.max(1, items.length - 1);
  // Position rule, not a switch: the FIRST item is the decision point. It gets
  // the inverse surface and a wider column (1.35fr vs 1fr) — never a 4-way
  // equal split. Row alignment comes from subgrid (see render.mjs global CSS):
  // every tile is a 3-row grid and shares the parent's tracks, so label /
  // numeral / delta line up across the row even when one tile has no delta.
  const heroStyle = {
    gridRow: 'span 3',
    display: 'grid',
    rowGap: '4px',
    minWidth: 0,
    background: SURFACE.inverse,
    ...cardFrame('small'),
    boxSizing: 'border-box',
    ...INVERSE_SCOPE,
  };
  const heroTile = (it, i) =>
    h(
      'div',
      { key: `kpi${i}`, 'data-gary': 'kpi-card', style: heroStyle },
      h(Text, { type: 'supporting', size: 'sm' }, it.label),
      h(
        HStack,
        { gap: 1, vAlign: 'end' },
        h(Text, { size: '4xl', weight: 'medium', color: 'accent', hasTabularNumbers: true }, String(it.value ?? '')),
        it.unit && h(Text, { type: 'supporting' }, it.unit)
      ),
      DeltaLine(it, 'var(--color-surface-inverse-text)')
    );
  const plainTile = (it, i) =>
    h(
      Card,
      {
        key: `kpi${i}`,
        // No elevation: the card is a hairline on paper, never a lifted tile.
        width: '100%',
        'data-gary': 'kpi-card',
        style: {
          ...cardFrame('small'),
          gridRow: 'span 3',
          display: 'grid',
          rowGap: '4px',
        },
      },
      h(Text, { type: 'supporting', size: 'sm' }, it.label),
      h(
        HStack,
        { gap: 1, vAlign: 'end' },
        h(Text, { size: '2xl', weight: 'medium', hasTabularNumbers: true }, String(it.value ?? '')),
        it.unit && h(Text, { type: 'supporting' }, it.unit)
      ),
      DeltaLine(it, DELTA_TONE[it.tone] || DELTA_TONE.neutral)
    );

  return h(
    VStack,
    { gap: 4, width: '100%' },
    (p.title || p.note) &&
      h(
        HStack,
        { justify: 'between', align: 'baseline', gap: 4, wrap: 'wrap' },
        p.title && sectionTitle(p.title),
        p.note && h(Text, { type: 'supporting' }, p.note)
      ),
    h(
      'div',
      {
        'data-gary': 'kpi',
        style: {
          display: 'grid',
          gridTemplateColumns: `1.35fr repeat(${siblings}, 1fr)`,
          columnGap: '16px',
          width: '100%',
          maxWidth: MEASURE_DATA,
          alignItems: 'stretch',
        },
      },
      items.map((it, i) => (i === 0 ? heroTile(it, i) : plainTile(it, i)))
    )
  );
}

/**
 * badge.variant 白名单，与 agent/checks/content.mjs 一致（6 档）。其余值按 neutral
 * 渲染并报警：Astryx Badge 收到不认识的枚举只会出一片没颜色的白块，不报错。
 */
const BADGE_VARIANTS = new Set(['neutral', 'accent', 'info', 'success', 'warning', 'error']);
// Astryx Badge 没有 accent（枚举只有 neutral/info/success/warning/error + tinted 色组），
// 契约里的 accent 落到 orange（品牌橙），否则 Badge 收不到枚举就静默出一片白。
const ASTRYX_BADGE = { accent: 'orange' };
function badgeVariant(v, where) {
  const raw = String(v || 'neutral').toLowerCase();
  if (BADGE_VARIANTS.has(raw)) return ASTRYX_BADGE[raw] || raw;
  console.warn(`[sections] ${where} 非法 variant="${v}"，按 neutral 渲染（可用: ${[...BADGE_VARIANTS].join(', ')}）`);
  return 'neutral';
}

/** Status strip: items[{label, variant, dot}] / align. */
export function BadgeBlock(p, ctx) {
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
          variant: badgeVariant(it.variant, `${atOf(ctx)}.items[${i}].variant`),
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
  const tone = surfaceToneOf(p, ctx);
  const inner = [
    (p.eyebrow || p.badge) &&
      h(
        HStack,
        { gap: 3, align: 'center', justify: 'between' },
        h(Text, { type: 'supporting', size: 'sm' }, p.eyebrow || ''),
        p.badge && h(Badge, { variant: 'neutral', label: p.badge })
      ),
    h(Heading, { level: 3 }, p.title),
    p.sub && h(Text, { type: 'supporting' }, p.sub),
    body.length > 0 &&
      h(VStack, { gap: 2 }, body.map((para, i) => h(Text, { key: i, type: 'body', display: 'block' }, para))),
    (p.tag || p.note) &&
      h(
        HStack,
        { gap: 3, wrap: 'wrap', vAlign: 'center' },
        p.tag && h(Badge, { variant: 'neutral', label: p.tag }),
        p.note && h(Text, { type: 'supporting', size: 'sm' }, p.note)
      ),
  ].filter(Boolean);
  // Slots are passed as a variadic child list, so each needs its own key.
  const slots = inner.map((el, i) => h(el.type, { ...el.props, key: `s${i}` }));

  // In a two-card row (see GridBlock) the card IS the grid, so its slots become
  // direct children sharing the parent's row tracks — that is what makes the
  // title/body rows of the two cards sit on the same line. Row count is pinned
  // by GridBlock, hence the fixed span.
  if (ctx && ctx.duoRows && tone === 'default') {
    return SurfaceCard(tone, ctx, slots, {
      variant: p.variant,
      'data-gary': 'duo-card',
      style: {
        ...cardFrame(tierForContext(ctx)),
        gridRow: `span ${ctx.duoRows}`,
        display: 'grid',
        rowGap: '16px',
      },
    });
  }

  // Frame is tier-driven: page-width by default, one step down inside a grid.
  return SurfaceCard(
    tone,
    ctx,
    h(
      VStack,
      // 16px between inner blocks — never the 12px step.
      { gap: 4 },
      ...slots
    ),
    { variant: p.variant }
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
  if (!fs.existsSync(abs)) {
    throw new Error(`image: src 指向的文件不存在: ${src}（相对路径按当前工作目录解析）`);
  }
  const mime = IMAGE_MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  return `data:${mime};base64,${fs.readFileSync(abs).toString('base64')}`;
}

/** Timeline: items[{date, title, text, tone}] / title. Date column + accent nodes. */
export function TimelineBlock(p, ctx) {
  const items = Array.isArray(p.items) ? p.items : [];
  return h(
    VStack,
    { gap: 4, width: '100%' },
    p.title && sectionTitle(p.title),
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
    p.title && sectionTitle(p.title),
    h(
      'div',
      { 'data-gary': 'steps', style: { position: 'relative', width: '100%' } },
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
        maxWidth: MEASURE_NARRATIVE,
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
 * How many direct children CardBlock will emit for a given props object.
 * Mirrors the `inner` array above — subgrid needs an exact row count up front,
 * and guessing it wrong drops a card's last row into an implicit track.
 */
function cardSlotCount(props) {
  const body = Array.isArray(props.body) ? props.body.length : 0;
  return (
    (props.eyebrow || props.badge ? 1 : 0) +
    1 +
    (props.sub ? 1 : 0) +
    (body > 0 ? 1 : 0) +
    (props.tag || props.note ? 1 : 0)
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
  const gapPx = step(p.gap, 4) * 4;

  // Two cards side by side ("双卡"): share the parent's row tracks through
  // subgrid, so eyebrow / title / body / foot lines sit on the same line across
  // both cards instead of drifting apart with different content lengths.
  // Only when both cards emit the same number of slots and both sit on the
  // default surface — otherwise fall through to the normal Grid below.
  if (cols === 2 && children.length === 2 && children.every((c) => c && c.type === 'card')) {
    const rows = cardSlotCount(children[0].props || {});
    const twins = rows === cardSlotCount(children[1].props || {});
    const plainTone = children.every((c) => surfaceToneOf(c.props || {}, ctx) === 'default');
    if (twins && rows >= 2 && plainTone) {
      return h(
        'div',
        {
          'data-gary': 'duo',
          style: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            columnGap: `${gapPx}px`,
            gridTemplateRows: `repeat(${rows}, auto)`,
            width: '100%',
            alignItems: 'stretch',
          },
        },
        children.map((child, i) => {
          const el = renderBlock(child, { ...(ctx || {}), cols, duoRows: rows });
          // The card must stay a DIRECT child of the row grid (a wrapper div
          // would break the subgrid link), so the React key is re-attached
          // onto the rendered element instead of a wrapper.
          return el ? h(el.type, { ...el.props, key: child.id || `g${i}` }) : null;
        })
      );
    }
  }

  return h(
    Grid,
    { columns: cols, gap: step(p.gap, 4), width: '100%', align: 'stretch' },
    children.map((child, i) =>
      h('div', { key: child.id || `g${i}` }, renderBlock(child, { ...(ctx || {}), cols }))
    )
  );
}

/**
 * Device: kind (phone|laptop) / src / alt / caption.
 * A CSS-only device shell — no iframe, no external asset, no script. The screen
 * carries a static image embedded through the same data-URI path as `image`,
 * so the product stays a single self-contained file.
 */
const DEVICE = {
  phone: { width: '300px', radius: '38px', padding: '10px', screenRadius: '28px', ratio: '0.462' },
  laptop: { width: '720px', radius: '16px', padding: '10px', screenRadius: '8px', ratio: '1.6' },
};

export function DeviceBlock(p, ctx) {
  const kind = String(p.kind || 'phone').toLowerCase() === 'laptop' ? 'laptop' : 'phone';
  const spec = DEVICE[kind];
  const tone = surfaceToneOf(p, ctx);
  const screen = h(
    'div',
    {
      style: {
        width: '100%',
        aspectRatio: spec.ratio,
        borderRadius: spec.screenRadius,
        overflow: 'hidden',
        background: 'var(--color-surface-raised)',
      },
    },
    h('img', {
      src: embedImage(p.src),
      alt: p.alt || '',
      style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    })
  );
  const shell = h(
    'div',
    {
      style: {
        width: '100%',
        maxWidth: spec.width,
        margin: '0 auto',
        padding: spec.padding,
        borderRadius: spec.radius,
        background: 'var(--color-surface-inverse)',
        border: '1px solid var(--color-border-inverse)',
        boxSizing: 'border-box',
      },
    },
    screen
  );

  return SurfaceCard(
    tone,
    ctx,
    h(
      VStack,
      { gap: 2, width: '100%' },
      shell,
      (p.caption || p.alt) &&
        h(
          HStack,
          { justify: p.align === 'start' ? 'start' : 'center', width: '100%' },
          h(Text, { type: 'supporting', size: 'sm' }, p.caption || p.alt)
        )
    ),
    { /* hairline, no elevation */ }
  );
}

/** scorecard state -> semantic fill. Unknown / missing falls back to accent. */
const SCORE_TONE = {
  good: 'var(--color-success)',
  warn: 'var(--color-warning)',
  bad: 'var(--color-error)',
};

/**
 * Scorecard: items[{label, score, max, state}] / title / note / density.
 * Horizontal bars, not a radar: a static single-file page has no tooltip and a
 * four-to-six axis radar is unreadable at print size.
 */
export function ScorecardBlock(p, ctx) {
  const items = Array.isArray(p.items) ? p.items : [];
  const tone = surfaceToneOf(p, ctx);
  const gap = String(p.density || '') === 'compact' ? 2 : 3;
  const rows = items.map((it, i) => {
    const max = Number(it.max) || 100;
    const score = Number(it.score) || 0;
    const pct = Math.max(0, Math.min(100, max > 0 ? (score / max) * 100 : 0));
    const fill = SCORE_TONE[String(it.state || '').toLowerCase()] || 'var(--color-accent)';
    return h(
      VStack,
      { key: it.label || i, gap: 1, width: '100%' },
      h(
        HStack,
        { justify: 'between', width: '100%', gap: 2 },
        h(Text, { size: 'sm' }, it.label),
        h(Text, { size: 'sm', hasTabularNumbers: true }, `${score} / ${max}`)
      ),
      h(
        'div',
        {
          style: {
            width: '100%',
            height: '8px',
            borderRadius: '9999px',
            overflow: 'hidden',
            background: 'var(--color-border-subtle)',
          },
        },
        h('div', {
          style: {
            width: `${pct}%`,
            height: '100%',
            borderRadius: '9999px',
            background: fill,
          },
        })
      )
    );
  });

  return SurfaceCard(
    tone,
    ctx,
    h(
      VStack,
      { gap: 3, width: '100%' },
      p.title && h(Heading, { level: 2 }, p.title),
      p.note && h(Text, { type: 'supporting', size: 'sm' }, p.note),
      h(VStack, { gap, width: '100%' }, rows)
    ),
    { /* hairline, no elevation */ }
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
  device: DeviceBlock,
  scorecard: ScorecardBlock,
};

/**
 * Blocks that already paint their own card (and therefore read `ctx.surface`).
 * Every other block gets wrapped only when it asks for a non-default tone.
 */
const CARD_OWNED = new Set(['table', 'matrix', 'card', 'callout', 'device', 'scorecard']);

/**
 * Dispatch one block, applying its surface tone.
 *
 * `tone` lives on `props.tone`. A container may pin it through `ctx.surface`.
 * Card-owned blocks consume the tone themselves; bare blocks (timeline, steps,
 * quote, text, …) get a surface wrapper so `tone` works everywhere.
 */
export function renderSection(block, ctx) {
  // blocks[] 里的 null 以前会变成 `block.type` 上的裸 TypeError（D11），无下标无字段名。
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    const kind = block === null ? 'null' : Array.isArray(block) ? 'array' : typeof block;
    throw new Error(`sections: 收到 ${kind} 而不是区块对象，请删除该块或补成 {id, type, props}`);
  }
  const fn = SECTIONS[block.type];
  const at = `type=${block.type} id=${block.id || '无'}`;
  if (!fn) {
    throw new Error(
      `sections: ${at} 未知区块类型（支持: ${Object.keys(SECTIONS).join(', ')}）`
    );
  }
  const props = block.props || {};
  // tone 取 props.tone。块级 tone（blocks[].tone）由 agent/render.mjs 的 blocksOf()
  // 落进 props 一并传下来（2026-11-19 前那一步会把它整块剥掉，两轨出两种材质）。
  const tone = surfaceToneOf(props, ctx);
  const node = fn(props, { ...(ctx || {}), surface: tone, at });
  if (tone === 'default' || CARD_OWNED.has(block.type)) return node;
  return h('div', { style: surfaceFrame(tone, ctx) }, node);
}

/** Dispatch one block (kept for containers such as grid). */
export function renderBlock(block, ctx) {
  return renderSection(block, ctx);
}
