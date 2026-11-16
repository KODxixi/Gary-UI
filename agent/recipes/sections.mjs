/**
 * Shared section renderers — content.json block -> React tree.
 *
 * Field names follow the finalized contract in `agent/content.schema.md` (v1).
 * Every component/prop below is taken from `astryx component <Name> --json`
 * (cli/core 0.7.16), not guessed.
 */
import { createElement as h } from 'react';
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
  small: { borderRadius: '14px', padding: '20px' },
  medium: { borderRadius: '16px', padding: '24px' },
  large: { borderRadius: '20px', padding: '28px' },
};

function cardFrame(tier) {
  return { ...CARD_FRAMES[tier] };
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
        h(Heading, { level: 1 }, p.title),
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
    p.sub && h(Text, { type: 'large' }, p.sub),
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
    { gap: 2, width: '100%', maxWidth: '760px' },
    paras.map((para, i) => h(Text, { key: i, type, display: 'block' }, para)),
    p.note && h(Text, { type: 'supporting', size: 'sm' }, p.note)
  );
}

/** KPI group: items[{label, value, unit, hint, trend}] / title / note. */
export function Metric(p) {
  const items = Array.isArray(p.items) ? p.items : [];
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
      HStack,
      { gap: 4, wrap: 'wrap', vAlign: 'stretch' },
      items.map((it, i) =>
        h(
          Card,
          { key: i, elevation: 'low', width: '232px', style: cardFrame('small') },
          h(
            VStack,
            { gap: 1 },
            h(Text, { type: 'supporting', size: 'sm' }, it.label),
            h(
              HStack,
              { gap: 1, vAlign: 'end' },
              h(
                Text,
                { size: '2xl', weight: 'medium', hasTabularNumbers: true },
                String(it.value ?? '')
              ),
              it.unit && h(Text, { type: 'supporting' }, it.unit)
            ),
            it.hint &&
              h(
                HStack,
                { gap: 1, vAlign: 'center' },
                it.trend &&
                  h(
                    Text,
                    { type: 'supporting', size: 'sm', weight: 'medium' },
                    TREND_ARROW[it.trend] ?? ''
                  ),
                h(Text, { type: 'supporting', size: 'sm' }, it.hint)
              )
          )
        )
      )
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

/** Conclusion banner: tone / title / body / eyebrow / action{label}. */
export function Callout(p) {
  const description =
    (p.eyebrow || p.body) &&
    h(
      VStack,
      { gap: 1 },
      p.eyebrow && h(Text, { type: 'supporting', size: 'sm' }, p.eyebrow),
      p.body && h(Text, { type: 'body' }, p.body)
    );

  // Banner does not accept `style` on its root, and it owns its radius
  // (`var(--_banner-radius, var(--radius-container))`) and its padding
  // (`--spacing-3` block / `--spacing-4` inline). Scoping those three
  // variables on a wrapper is the only way to give this one block the large
  // container frame without touching the global tokens.
  const frame = {
    '--_banner-radius': CARD_FRAMES.large.borderRadius,
    // 24px on both axes: the large frame's 28px would distort banner internals.
    '--spacing-3': '24px',
    '--spacing-4': '24px',
  };

  return h(
    'div',
    { style: frame },
    h(Banner, {
      status: p.tone || 'info',
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
export function CardBlock(p) {
  const body = Array.isArray(p.body) ? p.body : [];
  // Frame is tier-driven (large: full-width body card). A caller-supplied
  // padding step can no longer drop below the tier minimum.
  const cardProps = { width: '100%', style: cardFrame('large') };
  if (p.variant) cardProps.variant = p.variant;
  if (p.elevation) cardProps.elevation = p.elevation;

  return h(
    Card,
    cardProps,
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
    )
  );
}

/** Table: title / note / columns[{label,num}] / rows[][] / foot / density / dividers. */
export function TableSection(p) {
  const cols = Array.isArray(p.columns) ? p.columns : [];
  const rows = Array.isArray(p.rows) ? p.rows : [];

  const columns = cols.map((c, j) => ({
    key: `c${j}`,
    // Astryx renders th contents in an inner element that keeps its own start
    // alignment, so the column `align` alone leaves numeric headers left-aligned
    // over right-aligned values. Wrap the label to inherit the column alignment.
    header: h(
      Text,
      { display: 'block', justify: c.num ? 'end' : 'start', hasTabularNumbers: !!c.num },
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

  return h(
    Card,
    { width: '100%', style: cardFrame('large') },
    h(
      VStack,
      { gap: 4 },
      (p.title || p.note) &&
        h(
          HStack,
          { justify: 'between', align: 'baseline', gap: 4 },
          p.title && h(Heading, { level: 2 }, p.title),
          p.note && h(Text, { type: 'supporting' }, p.note)
        ),
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
};
