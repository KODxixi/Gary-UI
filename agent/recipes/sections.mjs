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
export function Callout(p, ctx) {
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
    '--_banner-radius': CARD_FRAMES[tierForContext(ctx)].borderRadius,
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
export function CardBlock(p, ctx) {
  const body = Array.isArray(p.body) ? p.body : [];
  // Frame is tier-driven: page-width by default, one step down inside a grid.
  const cardProps = { width: '100%', style: cardFrame(tierForContext(ctx)) };
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
    { width: '100%', style: cardFrame(tierForContext(ctx)) },
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
      header: h(Text, { display: 'block' }, p.labelHeader || '对比项'),
      align: 'start',
      width: proportional(2),
      renderCell: (row) => h(Text, { weight: 'medium' }, String(row.label ?? '')),
    },
    ...cols.map((c, j) => ({
      key: `k${j}`,
      header: h(Text, { display: 'block', justify: c.num ? 'end' : 'start' }, c.label),
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

  return h(
    Card,
    { width: '100%', style: cardFrame(tierForContext(ctx)) },
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
    background: done ? 'var(--color-accent)' : 'transparent',
    color: done ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
    border: done ? 'none' : '2px solid var(--color-border-emphasized)',
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

/** Dispatch one block (used by containers such as grid). */
export function renderBlock(block, ctx) {
  const fn = SECTIONS[block.type];
  if (!fn) {
    throw new Error(
      `sections: 未知区块类型 type="${block.type}"（支持: ${Object.keys(SECTIONS).join(', ')}）`
    );
  }
  return fn(block.props || {}, ctx || {});
}
