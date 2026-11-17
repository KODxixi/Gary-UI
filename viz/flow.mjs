/**
 * viz/flow.mjs — process diagrams (linear / branch / swimlane), native SVG.
 *
 * Follows viz/_src/flow-diagram.json:
 *   - orthogonal polylines, square corners, radius 0 — no bezier, ever
 *   - four role hues maximum, colour lives on the stroke only; fills stay
 *     neutral (card / muted / track), so adjacent cards never muddy together
 *   - radius 8 on cards, h/2 on capsules, 4 on lane bands
 *   - type 14 / 12 / 11, fixed baselines (title +28, sub +48)
 *   - one waterdrop marker per kind (main / side), never reused across kinds
 *   - every polyline carries marker-end
 * Geometry is computed from a fixed grid (col / row), not from label length:
 * same role, same size.
 */
import { createElement as h } from 'react';
import { Card, Heading, Text, Badge, HStack, VStack } from '@astryxdesign/core';
import { PALETTE, FONT } from './palette.mjs';
import { FLOW } from './spec.mjs';

const W = 1040;
const EDGE = FLOW.stroke; // edge 2 / edgeDashed 1.5
const RADIUS = FLOW.corners.card; // 8 (theme --radius-inner)
const WATERDROP = 'M7.28 3.29 A3.3 3.3 0 1 0 7.28 8.71 L11.2 6 Z';

/** role -> token hue. Anything unknown falls back to the neutral chart primary. */
function roleColor(role) {
  return PALETTE.role[role] || PALETTE.primary;
}

function MarkerDefs({ prefix }) {
  return h(
    'defs',
    null,
    ['main', 'side'].map((kind) =>
      h(
        'marker',
        {
          key: kind,
          id: `${prefix}-${kind}`,
          markerWidth: 13,
          markerHeight: 13,
          refX: 11.2,
          refY: 6,
          viewBox: '0 0 13 13',
          markerUnits: 'userSpaceOnUse',
          orient: 'auto',
        },
        h('path', {
          d: WATERDROP,
          style: {
            fill: kind === 'main' ? PALETTE.textPrimary : PALETTE.textSecondary,
          },
        })
      )
    )
  );
}

/** Orthogonal route between two boxes. Returns the polyline points.
 *  Axis is chosen by the larger delta, so each edge exits the side it is
 *  actually heading towards: neighbours in a row connect through left/right
 *  edges, stacked neighbours through top/bottom. That keeps two edges into
 *  the same box from landing on the same point. */
function route(a, b, fromPoint) {
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;

  /* An explicit start point (used by decision fan-out) keeps both out-edges
     visible from their first pixel: each one leaves the diamond at a different
     point, so no segment hides under the other. */
  if (fromPoint) {
    const [sx, sy] = fromPoint;
    const ex = bcx >= sx ? b.x : b.x + b.w;
    if (Math.abs(sy - bcy) < 2) return [[sx, sy], [ex, sy]];
    const mx = (sx + ex) / 2;
    return [[sx, sy], [mx, sy], [mx, bcy], [ex, bcy]];
  }

  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;

  if (Math.abs(dx) >= Math.abs(dy)) {
    const toRight = dx >= 0;
    const sx = toRight ? a.x + a.w : a.x;
    const ex = toRight ? b.x : b.x + b.w;
    if (Math.abs(acy - bcy) < 2) return [[sx, acy], [ex, acy]];
    const mx = (sx + ex) / 2;
    return [[sx, acy], [mx, acy], [mx, bcy], [ex, bcy]];
  }

  const downward = dy >= 0;
  const sy = downward ? a.y + a.h : a.y;
  const ey = downward ? b.y : b.y + b.h;
  if (Math.abs(acx - bcx) < 2) return [[acx, sy], [acx, ey]];
  const my = (sy + ey) / 2;
  return [[acx, sy], [acx, my], [bcx, my], [bcx, ey]];
}

function Edge({ from, to, kind = 'solid', prefix, label, fromPoint }) {
  const pts = route(from, to, fromPoint);
  const isDashed = kind === 'dashed';
  const marker = kind === 'main' ? 'main' : 'side';
  const line = h('polyline', {
    points: pts.map((p) => p.join(',')).join(' '),
    style: {
      fill: 'none',
      stroke: kind === 'main' ? PALETTE.textPrimary : PALETTE.textSecondary,
    },
    strokeWidth: isDashed ? EDGE.edgeDashed : EDGE.edge,
    strokeDasharray: isDashed ? FLOW.edges.dashed.dasharray || '4 3' : undefined,
    strokeLinejoin: 'miter',
    markerEnd: `url(#${prefix}-${marker})`,
  });

  /* Label sits beside the LONGEST segment, offset perpendicular to it: above a
     horizontal run, right of a vertical one. Never on the line, never inside a
     node box. */
  let labelEl = null;
  if (label) {
    let best = [pts[0], pts[1] || pts[0]];
    let bestLen = -1;
    for (let i = 1; i < pts.length; i++) {
      const len = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]);
      if (len > bestLen) {
        bestLen = len;
        best = [pts[i - 1], pts[i]];
      }
    }
    const [p0, p1] = best;
    const horizontal = Math.abs(p1[0] - p0[0]) >= Math.abs(p1[1] - p0[1]);
    const mx = (p0[0] + p1[0]) / 2;
    const my = (p0[1] + p1[1]) / 2;
    labelEl = horizontal
      ? h(
          'text',
          {
            x: mx,
            y: my - 8,
            textAnchor: 'middle',
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
          },
          label
        )
      : h(
          'text',
          {
            x: mx + 8,
            y: my + 4,
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small },
          },
          label
        );
  }

  return h('g', null, line, labelEl);
}

function NodeCard({ box, node }) {
  const color = roleColor(node.role);
  return h(
    'g',
    null,
    h('rect', {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: RADIUS,
      style: { fill: PALETTE.surface, stroke: color },
      strokeWidth: FLOW.stroke.primary,
    }),
    h(
      'text',
      {
        x: box.x + 16,
        y: box.y + 28,
        style: { fill: PALETTE.textPrimary, fontSize: FONT.label, fontWeight: 600 },
      },
      node.title
    ),
    node.sub &&
      h(
        'text',
        {
          x: box.x + 16,
          y: box.y + 48,
          style: { fill: PALETTE.textSecondary, fontSize: FONT.tiny },
        },
        node.sub
      )
  );
}

function NodeCapsule({ box, node }) {
  const color = roleColor(node.role);
  return h(
    'g',
    null,
    h('rect', {
      x: box.x,
      y: box.y,
      width: box.w,
      height: box.h,
      rx: box.h / 2,
      style: { fill: PALETTE.surface, stroke: color },
      strokeWidth: FLOW.stroke.primary,
    }),
    h(
      'text',
      {
        x: box.x + box.w / 2,
        y: box.y + (node.sub ? 24 : box.h / 2 + 5),
        textAnchor: 'middle',
        style: { fill: PALETTE.textPrimary, fontSize: FONT.small, fontWeight: 500 },
      },
      node.title
    ),
    node.sub &&
      h(
        'text',
        {
          x: box.x + box.w / 2,
          y: box.y + 42,
          textAnchor: 'middle',
          style: { fill: PALETTE.textSecondary, fontSize: FONT.tiny },
        },
        node.sub
      )
  );
}

function NodeDiamond({ box, node }) {
  const color = roleColor(node.role);
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const hw = box.w / 2;
  const hh = box.h / 2;
  return h(
    'g',
    null,
    h('polygon', {
      points: `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`,
      style: { fill: PALETTE.surface, stroke: color },
      strokeWidth: FLOW.stroke.primary,
    }),
    h(
      'text',
      {
        x: cx,
        y: cy - 2,
        textAnchor: 'middle',
        style: { fill: PALETTE.textPrimary, fontSize: FONT.small, fontWeight: 600 },
      },
      node.title
    ),
    node.sub &&
      h(
        'text',
        {
          x: cx,
          y: cy + 16,
          textAnchor: 'middle',
          style: { fill: PALETTE.textSecondary, fontSize: FONT.tiny },
        },
        node.sub
      )
  );
}

function Node({ box, node }) {
  const kind = node.kind || 'card';
  if (kind === 'capsule') return h(NodeCapsule, { box, node });
  if (kind === 'decision') return h(NodeDiamond, { box, node });
  return h(NodeCard, { box, node });
}

function Svg({ height, prefix, ariaLabel, children }) {
  return h(
    'svg',
    {
      viewBox: `0 0 ${W} ${height}`,
      role: 'img',
      'aria-label': ariaLabel,
      style: { width: '100%', height: 'auto', display: 'block', fontFamily: FONT.family },
    },
    h('title', null, ariaLabel),
    h(MarkerDefs, { prefix }),
    children
  );
}

function positionsOf(nodes, grid) {
  const map = new Map();
  nodes.forEach((n, i) => {
    const col = Number.isFinite(n.col) ? n.col : i;
    const row = Number.isFinite(n.row) ? n.row : 0;
    map.set(n.id, {
      x: grid.x0 + col * grid.colW,
      y: grid.y0 + row * grid.rowH,
      w: n.kind === 'capsule' ? grid.capsuleW : n.kind === 'decision' ? grid.decisionW : grid.nodeW,
      h: n.kind === 'capsule' ? grid.capsuleH : n.kind === 'decision' ? grid.decisionH : grid.nodeH,
      node: n,
    });
  });
  return map;
}

/* --------------------------------------------------------------- linear */

export function LinearFlow({ nodes = [], edges = [], idPrefix = 'lf', ariaLabel = '线性流程' }) {
  const n = nodes.length;
  const nodeW = 200;
  const nodeH = 96;
  const gap = n > 1 ? (W - 80 - n * nodeW) / (n - 1) : 0;
  const boxes = nodes.map((node, i) => {
    const hgt = node.kind === 'capsule' ? 56 : nodeH;
    /* every node in the run shares one centre line, so a same-row edge is a
       straight horizontal segment instead of a 20px jog */
    const cy = 100 + nodeH / 2;
    return {
      x: 40 + i * (nodeW + gap),
      y: cy - hgt / 2,
      w: nodeW,
      h: hgt,
      node,
    };
  });
  const height = 260;

  return h(
    Svg,
    { height, prefix: idPrefix, ariaLabel },
    boxes.map((b, i) => h(Node, { key: `n${i}`, box: b, node: b.node })),
    edges.map((e, i) => {
      const a = boxes.find((b) => b.node.id === e.from);
      const b = boxes.find((b) => b.node.id === e.to);
      if (!a || !b) return null;
      return h(Edge, {
        key: `e${i}`,
        from: a,
        to: b,
        kind: e.kind || 'solid',
        prefix: idPrefix,
        label: e.label,
      });
    })
  );
}

/* --------------------------------------------------------------- branch */

export function BranchFlow({ nodes = [], edges = [], idPrefix = 'bf', ariaLabel = '分支流程' }) {
  const grid = {
    x0: 30,
    y0: 24,
    colW: 250,
    rowH: 150,
    nodeW: 190,
    nodeH: 96,
    capsuleW: 190,
    capsuleH: 56,
    decisionW: 152,
    decisionH: 96,
  };
  const map = positionsOf(nodes, grid);
  const rows = Math.max(...nodes.map((nd) => (Number.isFinite(nd.row) ? nd.row : 0)));
  const height = grid.y0 + (rows + 1) * grid.rowH - (grid.rowH - grid.nodeH) + 40;

  return h(
    Svg,
    { height, prefix: idPrefix, ariaLabel },
    nodes.map((n) => {
      const box = map.get(n.id);
      if (!box) return null;
      if (n.kind === 'decision') {
        // diamond sits centred inside its cell
        const cell = {
          x: box.x + (grid.nodeW - grid.decisionW) / 2,
          y: box.y + (grid.nodeH - grid.decisionH) / 2,
          w: grid.decisionW,
          h: grid.decisionH,
        };
        return h(NodeDiamond, { key: n.id, box: cell, node: n });
      }
      return h(Node, { key: n.id, box, node: n });
    }),
    edges.map((e, i) => {
      const a = map.get(e.from);
      const b = map.get(e.to);
      if (!a || !b) return null;
      const aBox =
        a.node.kind === 'decision'
          ? {
              x: a.x + (grid.nodeW - grid.decisionW) / 2,
              y: a.y + (grid.nodeH - grid.decisionH) / 2,
              w: grid.decisionW,
              h: grid.decisionH,
            }
          : a;
      const bBox =
        b.node.kind === 'decision'
          ? {
              x: b.x + (grid.nodeW - grid.decisionW) / 2,
              y: b.y + (grid.nodeH - grid.decisionH) / 2,
              w: grid.decisionW,
              h: grid.decisionH,
            }
          : b;
      /* decision fan-out: the k-th out-edge leaves the diamond at cy ± 14,
         far enough apart that neither segment is hidden by the other */
      const outCount = edges.filter((x) => x.from === e.from).length;
      const outIdx = edges.filter((x) => x.from === e.from).indexOf(e);
      let fromPoint;
      if (a.node.kind === 'decision' && outCount > 1) {
        const hw = aBox.w / 2;
        const hh = aBox.h / 2;
        const dy = outCount === 2 ? (outIdx === 0 ? -14 : 14) : 0;
        // stay on the diamond's upper-right / lower-right edge, not the vertex
        const x = aBox.x + hw + hw * (1 - Math.abs(dy) / hh);
        fromPoint = [x, aBox.y + hh + dy];
      }
      return h(Edge, {
        key: `e${i}`,
        from: aBox,
        to: bBox,
        kind: e.kind || 'solid',
        prefix: idPrefix,
        label: e.label,
        fromPoint,
      });
    })
  );
}

/* ------------------------------------------------------------- swimlane */

export function SwimLaneFlow({
  lanes = [],
  nodes = [],
  edges = [],
  idPrefix = 'sf',
  ariaLabel = '泳道流程',
}) {
  const laneTop = 44;
  const laneH = 156;
  const grid = { x0: 190, y0: 0, colW: 258, rowH: laneH, nodeW: 196, nodeH: 80, capsuleW: 196, capsuleH: 56, decisionW: 150, decisionH: 80 };

  const height = laneTop + lanes.length * laneH + 24;

  const boxes = nodes.map((n) => {
    const col = Number.isFinite(n.col) ? n.col : 0;
    const row = Number.isFinite(n.row) ? n.row : 0;
    const hgt = n.kind === 'capsule' ? 56 : 80;
    const y = laneTop + row * laneH + (laneH - hgt) / 2;
    return {
      x: grid.x0 + col * grid.colW,
      y,
      w: grid.nodeW,
      h: hgt,
      node: n,
    };
  });

  return h(
    Svg,
    { height, prefix: idPrefix, ariaLabel },
    lanes.map((lane, i) =>
      h(
        'g',
        { key: `lane${i}` },
        h('rect', {
          x: 20,
          y: laneTop + i * laneH,
          width: W - 40,
          height: laneH - 12,
          rx: 4,
          style: { fill: PALETTE.surfaceMuted },
        }),
        h(
          'text',
          {
            x: 36,
            y: laneTop + i * laneH + 30,
            style: { fill: PALETTE.textSecondary, fontSize: FONT.small, fontWeight: 500 },
          },
          lane.title
        ),
        lane.sub &&
          h(
            'text',
            {
              x: 36,
              y: laneTop + i * laneH + laneH / 2,
              style: { fill: PALETTE.textSecondary, fontSize: FONT.tiny },
            },
            lane.sub
          )
      )
    ),
    boxes.map((b, i) => h(Node, { key: `n${i}`, box: b, node: b.node })),
    edges.map((e, i) => {
      const a = boxes.find((b) => b.node.id === e.from);
      const b = boxes.find((b) => b.node.id === e.to);
      if (!a || !b) return null;
      return h(Edge, {
        key: `e${i}`,
        from: a,
        to: b,
        kind: e.kind || 'solid',
        prefix: idPrefix,
        label: e.label,
      });
    })
  );
}

/* ----------------------------------------------------------- block frame */

const FLOW_LABEL = {
  linear: '线性流程',
  branch: '分支流程',
  swimlane: '泳道流程',
};

export function FlowBlock(props) {
  const { flow, title, question, source, status, note, edges = [], nodes = [], lanes = [], id } = props;
  const prefix = `flow-${id || flow}`;

  const body =
    flow === 'linear'
      ? h(LinearFlow, { nodes, edges, idPrefix: prefix, ariaLabel: title })
      : flow === 'branch'
        ? h(BranchFlow, { nodes, edges, idPrefix: prefix, ariaLabel: title })
        : flow === 'swimlane'
          ? h(SwimLaneFlow, { lanes, nodes, edges, idPrefix: prefix, ariaLabel: title })
          : (() => {
              throw new Error(`viz/flow: 未知流程类型 flow="${flow}"`);
            })();

  return h(
    Card,
    { width: '100%', elevation: 'low', style: { borderRadius: '20px', padding: '28px' } },
    h(
      VStack,
      { gap: 4 },
      h(
        HStack,
        { justify: 'between', align: 'baseline', gap: 4, wrap: 'wrap' },
        h(
          VStack,
          { gap: 1 },
          h(Heading, { level: 2 }, title),
          question && h(Text, { type: 'supporting' }, question)
        ),
        h(Badge, { variant: 'neutral', label: FLOW_LABEL[flow] || flow })
      ),
      body,
      note && h(Text, { type: 'supporting', size: 'sm' }, note),
      h(
        HStack,
        { gap: 3, wrap: 'wrap', vAlign: 'center' },
        h(Text, { type: 'supporting', size: 'sm' }, `来源：${source}`),
        status && h(Badge, { variant: 'neutral', label: status })
      )
    )
  );
}
