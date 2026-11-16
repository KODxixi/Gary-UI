/**
 * viz/charts.mjs — native SVG charts, written as React elements so
 * renderToStaticMarkup can emit them with zero runtime. No chart library.
 *
 * Six families (in the order they appear on the demo page):
 *   bar          柱状图（单系列）
 *   grouped-bar  柱状图（分组）
 *   line         折线/趋势（数据点 + 参考线 + 极值标注）
 *   stacked      百分比堆叠（构成）
 *   donut        环形（占比）
 *   progress     进度条组（多指标完成率）
 *   sparkline    KPI 迷你趋势
 *
 * Rules honoured from viz/_src/chart-recipes.json:
 *   - bars/stacks share one zero baseline; sort order is the caller's, never
 *     re-sorted silently
 *   - guides are 1px and dashed, the zero line is solid
 *   - data strokes 2.4, reference 1.2 (dashed), markers >= 2
 *   - area fill .16, band .06
 *   - every value label is placed, never truncated
 *   - an annotation must carry target/text/kind/basis, and the caption repeats
 *     all four so the page stays checkable after export
 * Colours come only from viz/palette.mjs (theme tokens).
 */
import { createElement as h } from 'react';
import { Card, Heading, Text, HStack, VStack } from '@astryxdesign/core';
import { PALETTE, FONT, seriesStyle, seriesColor, seriesOpacity } from './palette.mjs';
import { CHART } from './spec.mjs';

const W = 1040;
const STROKE = CHART.strokes; // data 2.4 / reference 1.2 / guide 1 / marker 2
const FILLS = CHART.fills; // area .16 / band .06
const GAP = CHART.spacing.labelOffsetPx; // 10

/* ---------------------------------------------------------------- helpers */

/** Nice axis ticks covering [min,max]; returns every tick value. */
export function niceTicks(min, max, count = CHART.ticks) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    min = Math.min(0, min);
    max = max === 0 ? 1 : max;
  }
  const span = max - min || 1;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

/** 1234 -> "1,234"; 32.25 -> "32.3". Precision is declared by the caller. */
export function fmt(v, digits = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const n = Number(v);
  const s = n.toFixed(digits);
  const [i, d] = s.split('.');
  const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return d === undefined ? grouped : `${grouped}.${d}`;
}

/** Rough advance width at a numeric px size; only used to right-align a legend. */
function textWidth(str, sizePx = 12) {
  let w = 0;
  for (const ch of String(str)) w += ch.charCodeAt(0) < 128 ? sizePx * 0.56 : sizePx;
  return w;
}

function Svg({ height, ariaLabel, prefix, children }) {
  return h(
    'svg',
    {
      viewBox: `0 0 ${W} ${height}`,
      role: 'img',
      'aria-label': ariaLabel,
      style: {
        width: '100%',
        height: 'auto',
        display: 'block',
        overflow: 'visible',
        fontFamily: FONT.family,
      },
    },
    h('title', null, ariaLabel),
    children
  );
}

function Grid({ ticks, sy, x0, x1 }) {
  return h(
    'g',
    null,
    ticks.map((v, i) => {
      const zero = v === 0;
      return h('line', {
        key: `g${i}`,
        x1: x0,
        x2: x1,
        y1: sy(v),
        y2: sy(v),
        style: { stroke: zero ? PALETTE.axis : PALETTE.grid },
        strokeWidth: zero ? 1.2 : STROKE.guide,
        strokeDasharray: zero ? undefined : '3 5',
      });
    })
  );
}

function YAxis({ ticks, sy, x0, digits }) {
  return h(
    'g',
    null,
    ticks.map((v, i) =>
      h(
        'text',
        {
          key: `y${i}`,
          x: x0 - 10,
          y: sy(v) + 4,
          textAnchor: 'end',
          style: { fill: PALETTE.textSecondary, fontSize: FONT.small, fontVariantNumeric: FONT.numeric },
        },
        fmt(v, digits)
      )
    )
  );
}

function UnitLabel({ x, y, unit }) {
  if (!unit) return null;
  return h(
    'text',
    { x, y, style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
    `单位：${unit}`
  );
}

/** Right-aligned legend, one row per series, measured so nothing overlaps. */
function Legend({ series, xRight, y, kind = 'pair' }) {
  if (!series || series.length < 2) return null;
  return h(
    'g',
    null,
    series.map((s, i) => {
      const name = s.name || `系列${i + 1}`;
      const w = textWidth(name, 12) + 18;
      const x = xRight - w;
      const rowY = y + i * 20;
      return h(
        'g',
        { key: `lg${i}` },
        h('rect', {
          x,
          y: rowY - 9,
          width: 10,
          height: 10,
          rx: 2,
          style: s.color ? { fill: s.color } : seriesStyle(i, kind),
        }),
        h(
          'text',
          { x: x + 16, y: rowY, style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
          name
        )
      );
    })
  );
}

/* ------------------------------------------------------------------ bar */

export function BarChart({
  categories = [],
  series = [],
  unit = '',
  digits = 0,
  height = 400,
  ariaLabel = '柱状图',
  annotations = [],
}) {
  const padL = 64;
  const padR = 32;
  const padT = 52;
  const padB = 62;
  const plotW = W - padL - padR;
  const plotH = height - padT - padB;
  // 单系列柱图的每根柱是一个独立实体（渠道 / 月份 / 户型），按**类别下标**取色。
  // 旧行为是整张图一个蓝：一页七张图里柱、进度条、迷你趋势全同色，Gary 说的
  // 「颜色太单一」根子在这。多系列仍按系列下标，保证「同一对象跨图同色」。
  const paintFor = (si, ci) =>
    series[si].color
      ? { fill: series[si].color }
      : seriesStyle(series.length > 1 ? si : ci, 'pair');

  const all = series.flatMap((s) => s.values.map((v) => (Number.isFinite(v) ? v : 0)));
  const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all), CHART.ticks);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const sy = (v) => padT + ((yMax - v) / (yMax - yMin || 1)) * plotH;
  const zeroY = sy(0);

  const band = plotW / categories.length;
  const groupPad = band * 0.26;
  const groupW = band - groupPad;
  const slot = groupW / series.length;
  // 54px max left a 249px band 78% empty — the bars read as hairlines.
  // 110 was 72: four categories left a 249px slot holding a 69px bar, so the
  // gaps (111px) were wider than the bars themselves. Google Charts keeps the
  // bar in the 50–65% of slot range; this lands 4 categories at 110px.
  const barW = Math.min(110, slot * 0.78);

  const anchor = annotations.find((a) => a.type === 'anchor');

  return h(
    Svg,
    { height, ariaLabel },
    h(Grid, { ticks, sy, x0: padL, x1: W - padR }),
    h(YAxis, { ticks, sy, x0: padL, digits: digits === 1 ? 0 : digits }),
    h(UnitLabel, { x: padL, y: 26, unit }),
    h(Legend, { series, xRight: W - padR, y: 20, kind: 'pair' }),
    categories.map((cat, ci) => {
      const groupStart = padL + ci * band + groupPad / 2;
      return h(
        'g',
        { key: `c${ci}` },
        series.map((s, si) => {
          const v = s.values[ci];
          if (!Number.isFinite(v)) {
            return h(
              'text',
              {
                key: `na${si}`,
                x: groupStart + si * slot + slot / 2,
                y: zeroY - 8,
                textAnchor: 'middle',
                style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
              },
              '缺测'
            );
          }
          const x = groupStart + si * slot + (slot - barW) / 2;
          const top = Math.min(sy(v), zeroY);
          const hgt = Math.max(2, Math.abs(sy(v) - zeroY));
          const labelY = v >= 0 ? top - GAP : top + hgt + GAP + 4;
          return h(
            'g',
            { key: `b${si}` },
            h('rect', {
              x,
              y: top,
              width: barW,
              height: hgt,
              rx: 4,
              style: { ...paintFor(si, ci) },
            }),
            h(
              'text',
              {
                x: x + barW / 2,
                y: labelY,
                textAnchor: 'middle',
                style: {
                  fill: PALETTE.textPrimary,
                  fontSize: FONT.label,
                  fontVariantNumeric: FONT.numeric,
                  fontWeight: 500,
                },
              },
              fmt(v, digits)
            )
          );
        }),
        h(
          'text',
          {
            x: padL + ci * band + band / 2,
            y: padT + plotH + 26,
            textAnchor: 'middle',
            style: { fill: PALETTE.textPrimary, fontSize: FONT.small },
          },
          cat
        )
      );
    }),
    anchor &&
      (() => {
        const ci = categories.indexOf(anchor.target);
        if (ci < 0) return null;
        const si = 0;
        const v = series[si]?.values[ci];
        if (!Number.isFinite(v)) return null;
        const cx = padL + ci * band + band / 2;
        const top = Math.min(sy(v), zeroY);
        /* The value label owns the spot straight above the bar, so the anchor
           annotation hangs off a dashed leader to the RIGHT of the bar. */
        const leaderX = cx + barW / 2 + 10;
        const calloutY = Math.max(padT + 12, top - 18);
        return h(
          'g',
          null,
          h('line', {
            x1: leaderX,
            x2: leaderX,
            y1: top - 2,
            y2: calloutY + 6,
            style: { stroke: PALETTE.primary },
            strokeWidth: 1,
            strokeDasharray: '3 3',
          }),
          h(
            'text',
            {
              x: leaderX + 6,
              y: calloutY + 4,
              style: { fill: PALETTE.primary, fontSize: FONT.small, fontWeight: 600 },
            },
            anchor.text
          )
        );
      })(),
    h(
      'text',
      {
        x: W - padR,
        y: height - 8,
        textAnchor: 'end',
        style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
      },
      '基线 0 · 长度即量值'
    )
  );
}

/* ----------------------------------------------------------------- line */

export function LineChart({
  categories = [],
  series = [],
  unit = '',
  digits = 0,
  height = 410,
  ariaLabel = '折线图',
  annotations = [],
}) {
  const padL = 64;
  const padR = 196;
  const padT = 50;
  const padB = 62;
  const plotW = W - padL - padR;
  const plotH = height - padT - padB;

  const all = series.flatMap((s) => s.values.filter(Number.isFinite));
  /* A line chart may narrow its range when the question is "how did it move"
     (a 26–38 swing is unreadable on a 0–40 axis). Bars never do this. */
  const lo0 = Math.min(...all);
  const hi0 = Math.max(...all);
  const span = hi0 - lo0 || Math.abs(hi0) * 0.1 || 1;
  const ticks = niceTicks(lo0 - span * 0.2, hi0 + span * 0.2, CHART.ticks);
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const sy = (v) => padT + ((yMax - v) / (yMax - yMin || 1)) * plotH;
  const sx = (i) => padL + (categories.length > 1 ? (i * plotW) / (categories.length - 1) : plotW / 2);

  const ref = annotations.find((a) => a.type === 'reference');
  const band = annotations.find((a) => a.type === 'band');
  const anchors = annotations.filter((a) => a.type === 'anchor');

  return h(
    Svg,
    { height, ariaLabel },
    h(Grid, { ticks, sy, x0: padL, x1: W - padR }),
    h(YAxis, { ticks, sy, x0: padL, digits: digits === 1 ? 0 : digits }),
    h(UnitLabel, { x: padL, y: 24, unit }),
    h(Legend, { series, xRight: W - padR, y: 18, kind: 'pair' }),

    band &&
      (() => {
        const i0 = categories.indexOf(band.start);
        const i1 = categories.indexOf(band.end);
        if (i0 < 0 || i1 < 0) return null;
        const x = Math.min(sx(i0), sx(i1)) - 18;
        const w = Math.abs(sx(i1) - sx(i0)) + 36;
        return h(
          'g',
          null,
          h('rect', {
            x,
            y: padT,
            width: w,
            height: plotH,
            style: { fill: PALETTE.primary },
            fillOpacity: FILLS.band,
          }),
          h(
            'text',
            { x: x + 6, y: padT + 14, style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
            band.text
          )
        );
      })(),

    ref &&
      (() => {
        const y = sy(ref.value);
        return h(
          'g',
          null,
          h('line', {
            x1: padL,
            x2: W - padR,
            y1: y,
            y2: y,
            style: { stroke: PALETTE.textSecondary },
            strokeWidth: STROKE.reference,
            strokeDasharray: '5 4',
          }),
          h(
            'text',
            {
              x: W - padR - 4,
              y: y - 7,
              textAnchor: 'end',
              style: {
                fill: PALETTE.textSecondary,
                fontSize: FONT.small,
                // halo so the label survives sitting on top of a data stroke
                paintOrder: 'stroke',
                stroke: 'var(--color-background-card)',
                strokeWidth: 3,
                strokeLinejoin: 'round',
              },
            },
            `${ref.text}（${fmt(ref.value, 1)} ${unit}）`
          )
        );
      })(),

    categories.map((cat, i) =>
      h(
        'text',
        {
          key: `x${i}`,
          x: sx(i),
          y: padT + plotH + 26,
          textAnchor: 'middle',
          style: { fill: PALETTE.textPrimary, fontSize: FONT.small },
        },
        cat
      )
    ),

    series.map((s, si) => {
      const color = s.color || seriesColor(si, series.length > 1 ? 'pair' : 'line');
      const inkOp = s.color ? 1 : seriesOpacity(si, series.length > 1 ? 'pair' : 'line');
      const pts = s.values.map((v, i) => (Number.isFinite(v) ? [sx(i), sy(v)] : null));
      // one path per unbroken run: a null breaks the line, it never bridges
      const runs = [];
      let run = [];
      for (const p of pts) {
        if (p) run.push(p);
        else if (run.length) {
          runs.push(run);
          run = [];
        }
      }
      if (run.length) runs.push(run);
      return h(
        'g',
        { key: `s${si}` },
        runs.map((r, ri) =>
          h('polyline', {
            key: `p${ri}`,
            points: r.map((p) => p.join(',')).join(' '),
            style: { fill: 'none', stroke: color, strokeOpacity: inkOp },
            strokeWidth: STROKE.data,
            strokeLinejoin: 'round',
            strokeLinecap: 'round',
          })
        ),
        pts.map((p, i) =>
          p
            ? h(
                'g',
                { key: `d${i}` },
                h('circle', {
                  cx: p[0],
                  cy: p[1],
                  r: 4.5,
                  style: { fill: color, stroke: PALETTE.surface },
                  strokeWidth: STROKE.marker,
                }),
                anchors.some((a) => a.target === categories[i]) &&
                  h('circle', {
                    cx: p[0],
                    cy: p[1],
                    r: 10,
                    style: { fill: 'none', stroke: PALETTE.primary },
                    strokeWidth: 1.5,
                  }),
                h(
                  'text',
                  {
                    x: p[0],
                    y: p[1] - 12,
                    textAnchor: 'middle',
                    style: {
                      fill: PALETTE.textPrimary,
                      fontSize: FONT.label,
                      fontVariantNumeric: FONT.numeric,
                      // same halo as the reference label — point labels sit
                      // close enough to the stroke to need it
                      paintOrder: 'stroke',
                      stroke: 'var(--color-background-card)',
                      strokeWidth: 3,
                      strokeLinejoin: 'round',
                    },
                  },
                  fmt(s.values[i], digits)
                )
              )
            : h(
                'text',
                {
                  key: `m${i}`,
                  x: sx(i),
                  y: padT + plotH - 6,
                  textAnchor: 'middle',
                  style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
                },
                '缺测'
              )
        ),
        // direct end label: the series is named where it actually ends;
        // the value is already labeled on the point, so it is not repeated.
        // Single-series lines are named by the card title — an end label here
        // lands on top of the value label attached to the last point.
        (() => {
          if (series.length < 2) return null;
          const last = pts.filter(Boolean).slice(-1)[0];
          if (!last) return null;
          return h(
            'text',
            {
              x: last[0] + 18,
              y: last[1] + 4,
              style: { fill: PALETTE.textPrimary, fontSize: FONT.small, fontWeight: 600 },
            },
            s.name || `系列${si + 1}`
          );
        })()
      );
    }),

    h(
      'text',
      {
        x: W - padR,
        y: height - 8,
        textAnchor: 'end',
        style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
      },
      yMin > 0 ? `纵轴 ${fmt(yMin, digits)}–${fmt(yMax, digits)} · 非零基线（范围可见）` : '纵轴自 0 起 · 缺测断线不补'
    )
  );
}

/* -------------------------------------------------------------- stacked */

export function StackedBar({
  rows = [],
  unit = '',
  digits = 0,
  height = 0,
  ariaLabel = '百分比堆叠条',
  annotations = [],
}) {
  const padTop = 64;
  const rowH = 96;
  const barH = 44;
  const x0 = 176;
  const barW = W - x0 - 96;
  const total = rows.length;
  const chartH = height || padTop + total * rowH + 108;

  const legY = padTop + total * rowH + 8;

  return h(
    Svg,
    { height: chartH, ariaLabel },
    rows.map((row, ri) => {
      const sum = row.parts.reduce((a, p) => a + (Number.isFinite(p.value) ? p.value : 0), 0);
      const y = padTop + ri * rowH;
      let acc = 0;
      return h(
        'g',
        { key: `r${ri}` },
        h(
          'text',
          {
            x: x0 - 20,
            y: y + 22,
            textAnchor: 'end',
            style: { fill: PALETTE.textPrimary, fontSize: FONT.label, fontWeight: 600 },
          },
          row.label
        ),
        h(
          'text',
          {
            x: x0 - 20,
            y: y + 42,
            textAnchor: 'end',
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
          },
          sum > 0 ? `合计 ${fmt(sum, digits)} ${unit}` : '分母为 0（空状态）'
        ),
        // only an empty state shows the track: a filled row is a full 100% bar,
        // and translucent steps must blend with the card, not with grey
        sum === 0 &&
          h('rect', {
            x: x0,
            y: y,
            width: barW,
            height: barH,
            rx: 6,
            style: { fill: PALETTE.track },
          }),
        sum > 0 &&
          row.parts.map((p, pi) => {
            const pct = p.value / sum;
            const segX = x0 + acc * barW;
            const segW = Math.max(0, pct * barW - 2);
            acc += pct;
            return h('rect', {
              key: `s${pi}`,
              x: segX + 1,
              y,
              width: segW,
              height: barH,
              rx: 5,
              style: { ...seriesStyle(pi, 'ramp') },
            });
          }),
        h(
          'text',
          {
            x: x0 + barW + 12,
            y: y + barH / 2 + 5,
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small, fontVariantNumeric: FONT.numeric },
          },
          '100%'
        )
      );
    }),
    // legend carries the name, the count and the share — no in-bar text, so
    // no on-fill contrast gamble
    rows.length > 0 &&
      h(
        'g',
        null,
        rows[0].parts.map((p, pi) => {
          const sum = rows[0].parts.reduce((a, q) => a + q.value, 0);
          const pct = sum > 0 ? (p.value / sum) * 100 : 0;
          return h(
            'g',
            { key: `l${pi}` },
            h('rect', {
              x: x0 + pi * 214,
              y: legY,
              width: 10,
              height: 10,
              rx: 2,
              style: { ...seriesStyle(pi, 'ramp') },
            }),
            h(
              'text',
              { x: x0 + pi * 214 + 16, y: legY + 10, style: { fill: PALETTE.textPrimary, fontSize: FONT.small } },
              `${p.name} ${fmt(p.value, digits)} ${unit} · ${pct.toFixed(1)}%`
            )
          );
        })
      ),
    h(
      'text',
      { x: W - 20, y: chartH - 6, textAnchor: 'end', style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
      '每条统一表示整体 · 分母见合计'
    )
  );
}

/* ---------------------------------------------------------------- donut */

function arcPath(cx, cy, rOuter, rInner, a0, a1) {
  const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(rOuter, a0);
  const [x1, y1] = p(rOuter, a1);
  const [x2, y2] = p(rInner, a1);
  const [x3, y3] = p(rInner, a0);
  return `M${x0} ${y0} A${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${rInner} ${rInner} 0 ${large} 0 ${x3} ${y3} Z`;
}

export function DonutChart({
  items = [],
  unit = '',
  digits = 0,
  height = 380,
  centerLabel = '',
  ariaLabel = '环形构成图',
}) {
  const cx = 300;
  const cy = height / 2 + 8;
  const rOuter = 118;
  const rInner = 72;
  const sum = items.reduce((a, p) => a + (Number.isFinite(p.value) ? p.value : 0), 0);
  const gapRad = 0.028;

  let a = -Math.PI / 2;
  const arcs = items.map((p, i) => {
    const sweep = sum > 0 ? (p.value / sum) * Math.PI * 2 : 0;
    const mid = a + sweep / 2;
    const d = sweep > gapRad * 2 ? arcPath(cx, cy, rOuter, rInner, a + gapRad, a + sweep - gapRad) : null;
    a += sweep;
    return { p, i, d, mid, pct: sum > 0 ? (p.value / sum) * 100 : 0 };
  });

  const legendX = 520;

  return h(
    Svg,
    { height, ariaLabel },
    arcs.map(({ p, i, d, mid, pct }) => {
      return h(
        'g',
        { key: `a${i}` },
        d
          ? h('path', { d, style: { ...seriesStyle(i, 'ramp') } })
          : h('rect', {
              x: cx - 2,
              y: cy - rOuter,
              width: 4,
              height: rOuter - rInner,
              style: { ...seriesStyle(i, 'ramp') },
            })
      );
    }),

    h(
      'text',
      {
        x: cx,
        y: cy - 4,
        textAnchor: 'middle',
        style: {
          fill: PALETTE.textPrimary,
          fontSize: FONT.metric,
          fontWeight: 600,
          fontVariantNumeric: FONT.numeric,
        },
      },
      fmt(sum, digits)
    ),
    h(
      'text',
      {
        x: cx,
        y: cy + 22,
        textAnchor: 'middle',
        style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
      },
      `${centerLabel}${unit ? ' · ' + unit : ''}`
    ),

    items.map((p, i) => {
      const pct = sum > 0 ? (p.value / sum) * 100 : 0;
      const rowY = 92 + i * 46;
      return h(
        'g',
        { key: `lg${i}` },
        h('rect', {
          x: legendX,
          y: rowY - 11,
          width: 12,
          height: 12,
          rx: 3,
          style: { ...seriesStyle(i, 'ramp') },
        }),
        h(
          'text',
          { x: legendX + 22, y: rowY, style: { fill: PALETTE.textPrimary, fontSize: FONT.label } },
          p.name
        ),
        h(
          'text',
          {
            x: legendX + 250,
            y: rowY,
            textAnchor: 'end',
            style: { fill: PALETTE.textPrimary, fontSize: FONT.small, fontVariantNumeric: FONT.numeric },
          },
          `${fmt(p.value, digits)} ${unit}`
        ),
        h(
          'text',
          {
            x: legendX + 330,
            y: rowY,
            textAnchor: 'end',
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small, fontVariantNumeric: FONT.numeric },
          },
          `${pct.toFixed(1)}%`
        )
      );
    }),

    h(
      'text',
      { x: W - 24, y: height - 8, textAnchor: 'end', style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
      '互斥 · 合计可校验'
    )
  );
}

/* ------------------------------------------------------------- progress */

export function ProgressBars({
  rows = [],
  height = 0,
  ariaLabel = '进度条组',
  annotations = [],
}) {
  const rowH = 62;
  const chartH = height || 72 + rows.length * rowH;
  const trackX = 300;
  const trackW = W - trackX - 120;

  return h(
    Svg,
    { height: chartH, ariaLabel },
    rows.map((r, i) => {
      const y = 36 + i * rowH;
      const max = Number.isFinite(r.max) && r.max > 0 ? r.max : 1;
      const pct = Math.min(1, Math.max(0, r.value / max));
      return h(
        'g',
        { key: `p${i}` },
        h(
          'text',
          { x: 24, y: y + 12, style: { fill: PALETTE.textPrimary, fontSize: FONT.label } },
          r.label
        ),
        r.hint &&
          h(
            'text',
            { x: 24, y: y + 30, style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
            r.hint
          ),
        h('rect', {
          x: trackX,
          y: y + 2,
          width: trackW,
          height: 12,
          rx: 6,
          style: { fill: PALETTE.track },
        }),
        h('rect', {
          x: trackX,
          y: y + 2,
          width: Math.max(2, trackW * pct),
          height: 12,
          rx: 6,
          style: { fill: r.color || PALETTE.primary },
        }),
        h(
          'text',
          {
            x: W - 24,
            y: y + 13,
            textAnchor: 'end',
            style: {
              fill: PALETTE.textPrimary,
              fontSize: FONT.small,
              fontWeight: 600,
              fontVariantNumeric: FONT.numeric,
            },
          },
          `${(pct * 100).toFixed(1)}%`
        )
      );
    }),
    h(
      'text',
      { x: W - 24, y: chartH - 8, textAnchor: 'end', style: { fill: PALETTE.textSecondary, fontSize: FONT.small } },
      '完成率 = 分子/分母（分母写在每行提示里）'
    )
  );
}

/* ------------------------------------------------------------ sparkline */

export function Sparkline({ categories = [], values = [], unit = '', width = 300, height = 96 }) {
  /* R7: the trend has to be readable at card width. The plot band is 50px in a
     96px viewBox (not a CSS height trick — the viewBox itself is taller), the
     line is 2.4, the area carries an accent wash, and both ends are labelled. */
  const padL = 12;
  const padR = 12;
  const padT = 22;
  const padB = 26;
  const plotTop = padT;
  const plotH = height - padT - padB;
  const baseY = plotTop + plotH;
  const valid = values.filter(Number.isFinite);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const sx = (i) =>
    padL + (categories.length > 1 ? (i * (width - padL - padR)) / (categories.length - 1) : 0);
  const sy = (v) => plotTop + ((max - v) / (max - min || 1)) * plotH;
  const pts = values.map((v, i) => (Number.isFinite(v) ? [sx(i), sy(v)] : null));
  const solid = pts.filter(Boolean);
  const first = solid[0];
  const last = solid[solid.length - 1];
  const fmtEnd = (v) => (Number.isFinite(v) ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : '');

  return h(
    'svg',
    {
      viewBox: `0 0 ${width} ${height}`,
      role: 'img',
      'aria-label': `${categories.join('→')}：${values.join('、')} ${unit}`,
      style: { width: '100%', height: 'auto', display: 'block', fontFamily: FONT.family },
    },
    // accent wash under the line — gives the eye a body, not just a hairline
    solid.length > 1 &&
      h('polygon', {
        points: [
          ...solid.map((p) => p.join(',')),
          `${last[0]},${baseY}`,
          `${first[0]},${baseY}`,
        ].join(' '),
        style: { fill: PALETTE.primary },
        fillOpacity: 0.2,
      }),
    // faint baseline: the trend is measured against it, not floating
    h('line', {
      x1: padL,
      x2: width - padR,
      y1: baseY,
      y2: baseY,
      style: { stroke: PALETTE.track },
      strokeWidth: 1,
    }),
    h('polyline', {
      points: solid.map((p) => p.join(',')).join(' '),
      style: { fill: 'none', stroke: PALETTE.primary },
      strokeWidth: 2.4,
      strokeLinejoin: 'round',
      strokeLinecap: 'round',
    }),
    solid.map((p, i) =>
      h('circle', {
        key: `p${i}`,
        cx: p[0],
        cy: p[1],
        r: 2.4,
        style: { fill: PALETTE.primary },
      })
    ),
    last &&
      h('circle', {
        cx: last[0],
        cy: last[1],
        r: 4,
        style: { fill: PALETTE.primary, stroke: PALETTE.surface },
        strokeWidth: 2,
      }),
    // start / end read off the line itself, so the trend has numbers at its ends
    first &&
      h(
        'text',
        {
          x: first[0],
          y: first[1] - 10,
          textAnchor: 'start',
          style: { fill: PALETTE.textSecondary, fontSize: FONT.small, fontVariantNumeric: FONT.numeric },
        },
        fmtEnd(values.find(Number.isFinite))
      ),
    last &&
      h(
        'text',
        {
          x: last[0],
          y: last[1] - 12,
          textAnchor: 'end',
          style: { fill: PALETTE.textPrimary, fontSize: FONT.small, fontWeight: 600, fontVariantNumeric: FONT.numeric },
        },
        `${fmtEnd(values.filter(Number.isFinite).slice(-1)[0])}${unit ? ' ' + unit : ''}`
      ),
    categories.map((c, i) =>
      h(
        'text',
        {
          key: `x${i}`,
          x: sx(i),
          y: height - 8,
          textAnchor: i === 0 ? 'start' : i === categories.length - 1 ? 'end' : 'middle',
          style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
        },
        c
      )
    )
  );
}

/* ----------------------------------------------------------- block frame */

/** Strip local artefact paths (examples/x.html, out/y.html) from a source line. */
function sourceName(source) {
  return String(source)
    .replace(/(?:[\w.-]+\/)+[\w.-]+\.(?:html?|png|jpe?g|svg|pdf|csv)\s*·?\s*/gi, '')
    .replace(/^[\s·]+|[\s·]+$/g, '')
    .trim();
}

function ChartBody(props) {
  switch (props.chart) {
    case 'bar':
    case 'grouped-bar':
      return h(BarChart, props);
    case 'line':
      return h(LineChart, props);
    case 'stacked':
      return h(StackedBar, props);
    case 'donut':
      return h(DonutChart, props);
    case 'progress':
      return h(ProgressBars, props);
    default:
      throw new Error(`viz/charts: 未知图表类型 chart="${props.chart}"`);
  }
}

export function KpiTile({ label, value, unit, delta, categories, values, note, source }) {
  return h(
    Card,
    { elevation: 'low', width: '420px', style: { borderRadius: '16px', padding: '24px' } },
    h(
      VStack,
      { gap: 2 },
      h(Text, { type: 'supporting', size: 'sm' }, label),
      h(
        HStack,
        { gap: 1, vAlign: 'end' },
        h(Text, { size: '2xl', weight: 'medium', hasTabularNumbers: true }, String(value)),
        unit && h(Text, { type: 'supporting' }, unit),
        delta && h(Text, { type: 'supporting', size: 'sm', weight: 'medium' }, delta)
      ),
      h(Sparkline, { categories, values, unit }),
      note && h(Text, { type: 'supporting', size: 'sm' }, note),
      source && h(Text, { type: 'supporting', size: 'sm' }, source)
    )
  );
}

/**
 * ChartBlock — one chart inside a Card, with the seven-layer reading order:
 * title → question → plot → annotations → source/status.
 */
export function ChartBlock(props) {
  const { title, question, chart, source, note, annotations, kpi } = props;

  if (chart === 'sparkline') {
    return h(KpiTile, { ...props, ...(kpi || {}) });
  }

  const footer = [note, source && `来源：${sourceName(source)}`].filter(Boolean).join(' · ');

  return h(
    Card,
    { width: '100%', elevation: 'low', style: { borderRadius: '20px', padding: '28px' } },
    h(
      VStack,
      { gap: 4 },
      h(
        VStack,
        { gap: 1 },
        h(Heading, { level: 2 }, title),
        question && h(Text, { type: 'supporting' }, question)
      ),
      h(ChartBody, props),
      // Annotations already carry their label inside the plot (anchor text sits
      // next to the bar, the reference-line label sits on the line). Rendering
      // AnnotationCaption here printed every label a second time under the card.
      footer && h(Text, { type: 'supporting', size: 'sm' }, footer)
    )
  );
}
