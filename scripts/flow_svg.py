#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""按 spec/flow-diagram.json 画过程型流程图。

两种用法：

1. 手写坐标（原始样例）——`FlowDiagram` 的基本图元：
       d = FlowDiagram()
       d.card(250, 80, 'process', '处理', sub='模型调用')
       d.arrow((180, 115), (248, 115))

2. 图数据（推荐）——`FlowGraph` 自动网格布局 + 正交 A* 路由：
       g = FlowGraph(palette='gary', tokens=True)
       g.stage('输入', 'input')
       g.node('user', 'input', '用户消息', kind='capsule', stage=0, row=0)
       g.node('intent', 'process', '意图路由', stage=1, row=0)
       g.edge('user', 'intent')
       open('out.svg', 'w').write(g.render())

为什么不用 Mermaid / Graphviz：规范的三个硬指标——同角色同尺寸、固定基线节奏、
正交零半径拐点——通用布局引擎做不到（它们按文字撑框、按算法选拐点）。这里用
固定尺寸网格 + 正交可见性图，尺寸由规范决定，坐标由布局器算。
"""
from __future__ import annotations

import argparse
import hashlib
import heapq
import json
import re
import sys
import unicodedata
from dataclasses import dataclass
from xml.sax.saxutils import escape

# ---- 规范常量（与 spec/flow-diagram.json 同步）----
CARD_W, CARD_H = 120, 70
CAPSULE_H = 36
RX_CARD, RX_INNER = 8, 4
TITLE_DY, SUB_DY = 28, 48

PHOENIX_ROLES = {
    'input': '#e67e22',
    'process': '#2196f3',
    'process2': '#1976d2',
    'decision': '#9c27b0',
    'decide2': '#7b1fa2',
    'result': '#ffbf00',
}

PHOENIX = {
    'roles': PHOENIX_ROLES,
    'surface': {
        'page': '#0e0e0e',
        'card': '#1d1d1d',
        'subframe': '#0e0e0e',
        'item': '#303030',
        'capsule': '#1d1d1d',
    },
    'text': {
        '900': 'rgba(255,255,255,.9)',
        '700': 'rgba(255,255,255,.7)',
        '500': 'rgba(255,255,255,.5)',
    },
    'edge': {'solid': '#8d8d8d', 'dashed': '#6a6a6a'},
}

# gary 变体的 category 值来自 spec/chart-recipes.json → themes.dark/light.category1..4。
GARY_LITERAL = {
    'roles': {
        'input': '#d5af59',       # category2
        'process': '#82acec',     # category1
        'decision': '#be9bda',    # category4
        'result': '#78c9ac',      # category3
    },
    'surface': PHOENIX['surface'],
    'text': PHOENIX['text'],
    'edge': PHOENIX['edge'],
}

GARY_TOKENS = {
    'roles': {
        'input': 'var(--gary-category-2)',
        'process': 'var(--gary-category-1)',
        'decision': 'var(--gary-category-4)',
        'result': 'var(--gary-category-3)',
    },
    'surface': {
        'page': 'var(--gary-surface-page)',
        'card': 'var(--gary-solid-plate)',
        'subframe': 'var(--gary-surface-sunken)',
        'item': 'var(--gary-surface-sunken)',
        'capsule': 'var(--gary-solid-plate)',
    },
    'text': {
        '900': 'var(--gary-text-primary)',
        '700': 'var(--gary-text-secondary)',
        '500': 'var(--gary-text-tertiary)',
    },
    'edge': {'solid': 'var(--gary-text-secondary)', 'dashed': 'var(--gary-text-tertiary)'},
}

# 兼容旧代码里 `ROLE['process']` 的写法。
ROLE = PHOENIX_ROLES


def theme(palette: str = 'phoenix', tokens: bool = False) -> dict:
    if palette == 'phoenix':
        if tokens:
            raise ValueError("phoenix 变体不是 Gary token；tokens=True 只用于 palette='gary'")
        return PHOENIX
    if palette == 'gary':
        return GARY_TOKENS if tokens else GARY_LITERAL
    raise ValueError("palette 只能是 phoenix 或 gary，收到 %r" % (palette,))


def fit(text: str, max_chars: int) -> str:
    """长标签截断，不撑宽框——规范要求同角色同尺寸。"""
    s = str(text)
    return s if len(s) <= max_chars else s[: max_chars - 1] + '…'


def _char_w(ch: str, size: float) -> float:
    """粗略估算单字宽度：CJK 走全角，西文按比例；取偏保守值，宁可放宽卡片。"""
    if unicodedata.east_asian_width(ch) in ('W', 'F'):
        return size
    if ch == ' ':
        return size * 0.32
    if ch in 'ilI.,:;|!\'"`':
        return size * 0.32
    if ch in 'mwMW@%&':
        return size * 0.96
    if ch.isdigit():
        return size * 0.62
    if ch.isupper():
        return size * 0.70
    return size * 0.64


def text_width(s: str, size: float) -> float:
    return sum(_char_w(ch, size) for ch in str(s))


def fit_px(text: str, max_px: float, size: float) -> str:
    """按像素宽截断；中文 14px 不再被「7 个字」这种字符数规则误伤。"""
    s = str(text)
    if text_width(s, size) <= max_px:
        return s
    out = ''
    for ch in s:
        if text_width(out + ch + '…', size) > max_px:
            break
        out += ch
    return (out.rstrip() + '…') if out else '…'


class FlowDiagram:
    def __init__(self, width=620, height=290, palette='phoenix', tokens=False, id_prefix=''):
        self.w, self.h = width, height
        self.T = theme(palette, tokens)
        self.tokens = tokens
        self.id_prefix = id_prefix
        self.parts: list[str] = []

    def _id(self, name: str) -> str:
        return (self.id_prefix or '') + name

    # ---- 基本图元 ----
    def _rect(self, x, y, w, h, rx, fill, stroke=None, sw=2, dash=False, opacity=None, filter_id=None):
        a = ['x="%g"' % x, 'y="%g"' % y, 'width="%g"' % w, 'height="%g"' % h,
             'rx="%g"' % rx, 'fill="%s"' % fill]
        if filter_id:
            a.append('filter="url(#%s)"' % self._id(filter_id))
        if stroke:
            a += ['stroke="%s"' % stroke, 'stroke-width="%g"' % sw]
            if opacity is not None:
                a.append('stroke-opacity="%g"' % opacity)
            if dash:
                a.append('stroke-dasharray="4 3"')
        self.parts.append('<rect %s/>' % ' '.join(a))

    def _text(self, x, y, s, size=11, weight=400, fill=None, anchor='middle', ls=None):
        extra = ' letter-spacing="%s"' % ls if ls else ''
        self.parts.append(
            '<text x="%g" y="%g" text-anchor="%s" fill="%s" font-size="%g" '
            'font-weight="%g"%s>%s</text>'
            % (x, y, anchor, fill or self.T['text']['900'], size, weight, extra, escape(str(s))))

    def role(self, name: str) -> str:
        try:
            return self.T['roles'][name]
        except KeyError:
            raise ValueError(
                "角色 %r 在当前色板里没有定义；gary 变体目前只有 input/process/decision/result，"
                "process2/decide2 的深一档尚未定值" % (name,)
            ) from None

    # ---- 五层结构 ----
    def container(self, x, y, w, h, role, title='', stroke=None, dash=True, opacity=0.5,
                  label_size=14, label_weight=600, label_fill=None, label_tracking=None):
        """分块：默认 1px 虚线、角色色半透明、不填充；可切换成中性实线。"""
        self._rect(x, y, w, h, RX_CARD, 'none', stroke or self.role(role),
                   sw=1, dash=dash, opacity=opacity)
        if title:
            size = label_size if text_width(title, label_size) <= w - 24 else 12
            self._text(x + w / 2, y + TITLE_DY, fit_px(title, w - 24, size),
                       size, label_weight, label_fill, ls=label_tracking)

    def subframe(self, x, y, w, h, role, label=''):
        """子帧：1px 实线、角色色半透明、gray75 填充。"""
        self._rect(x, y, w, h, RX_INNER, self.T['surface']['subframe'],
                   self.role(role), sw=1, opacity=0.5)
        if label:
            self._text(x + w / 2, y + 20, label, 11, 400, self.T['text']['700'])

    def card(self, x, y, role, title, sub='', w: float = CARD_W, h: float = CARD_H,
             fill=None, filter_id=None):
        """卡片：2px 实线角色色 + 灰/玻璃填充 + rx8，标题+副标题固定节奏。"""
        self._rect(x, y, w, h, RX_CARD, fill or self.T['surface']['card'],
                   self.role(role), sw=2, filter_id=filter_id)
        size = 14 if text_width(title, 14) <= w - 20 else 12
        self._text(x + w / 2, y + TITLE_DY, fit_px(title, w - 20, size), size, 600)
        if sub:
            self._text(x + w / 2, y + SUB_DY, fit_px(sub, w - 20, 11), 11, 400,
                       self.T['text']['700'])

    def capsule(self, x, y, w, role, label, h: float = CAPSULE_H, fill=None,
                filter_id=None, text_size=12, sub=''):
        """胶囊：rx = h/2，端点不推进流程；报告页 h=54 时放两行（名称 + 摘要）。"""
        self._rect(x, y, w, h, h / 2, fill or self.T['surface']['capsule'],
                   self.role(role), sw=2, filter_id=filter_id)
        size = text_size if text_width(label, text_size) <= w - 20 else 12
        if sub:
            self._text(x + w / 2, y + h * 0.40, fit_px(label, w - 20, size), size, 500)
            self._text(x + w / 2, y + h * 0.68, fit_px(sub, w - 20, 11),
                       11, 400, self.T['text']['700'])
        else:
            self._text(x + w / 2, y + h * 0.64, fit_px(label, w - 20, size),
                       size, 500)

    def item(self, x, y, w, label, h=28):
        """条目：无描边 + gray200 填充 + rx4。"""
        self._rect(x, y, w, h, RX_INNER, self.T['surface']['item'])
        self._text(x + w / 2, y + h * 0.68, fit_px(label, w - 8, 11), 11, 400)

    # ---- 交互：节点分组 + 详情卡 ----
    def node_open(self, node_id: str, title: str, summary: str):
        label = escape(title + ('：' + summary if summary else ''))
        self.parts.append(
            f'<g class="node" data-node="{escape(node_id)}" tabindex="0" '
            f'role="button" aria-label="{label}">')

    def node_close(self):
        self.parts.append('</g>')

    def detail(self, node_id, x, y, w, h, role, title, summary, body):
        role_label = {'input': '输入', 'process': '处理',
                      'decision': '判定', 'result': '结果'}.get(role, role)
        cw, ch = 260, 190
        fx = max(8, min(self.w - cw - 8, x + w / 2 - cw / 2))
        fy = y - ch - 14
        if fy < 8:
            fy = y + h + 14
        fy = max(8, min(self.h - ch - 8, fy))
        self.parts.append(
            f'<g class="node-detail" data-detail="{escape(node_id)}" style="display:none">'
            f'<foreignObject x="{fx:g}" y="{fy:g}" width="{cw}" height="{ch}">'
            f'<div xmlns="http://www.w3.org/1999/xhtml" class="flow-detail" data-role="{role}">'
            f'<button type="button" class="flow-detail-close" aria-label="关闭">×</button>'
            f'<div class="flow-detail-kicker">{escape(role_label)}</div>'
            f'<div class="flow-detail-title">{escape(title)}</div>'
            f'<div class="flow-detail-sum">{escape(summary)}</div>'
            f'<p class="flow-detail-body">{escape(body)}</p>'
            '</div></foreignObject></g>')

    # ---- 连线：正交折线、直角拐点 ----
    def arrow(self, *pts, dashed=False, stroke=None, opacity=None, marker=None):
        stroke = stroke or self.T['edge']['dashed' if dashed else 'solid']
        sw = 1.5 if dashed else 2
        mk = self._id(marker or ('endpoint-dashed' if dashed else 'endpoint'))
        op = ' stroke-opacity="%g"' % opacity if opacity is not None else ''
        if len(pts) == 2:
            (x1, y1), (x2, y2) = pts
            dash = ' stroke-dasharray="4 3"' if dashed else ''
            self.parts.append(
                '<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="%g"%s%s '
                'marker-end="url(#%s)"/>' % (x1, y1, x2, y2, stroke, sw, dash, op, mk))
        else:
            p = ' '.join('%g,%g' % (x, y) for x, y in pts)
            dash = ' stroke-dasharray="4 3"' if dashed else ''
            self.parts.append(
                '<polyline points="%s" stroke="%s" stroke-width="%g" fill="none"%s%s '
                'marker-end="url(#%s)"/>' % (p, stroke, sw, dash, op, mk))

    # ---- 输出 ----
    def render(self) -> str:
        solid, dashed = self.T['edge']['solid'], self.T['edge']['dashed']
        dot_solid = self.T['text']['900'] if self.tokens else solid
        dot_side = self.T['text']['500'] if self.tokens else dashed
        drop = 'M7.28 3.29 A3.3 3.3 0 1 0 7.28 8.71 L11.2 6 Z'
        shadow_id = self._id('card-shadow')

        def marker(name, fill):
            return (f'<marker id="{self._id(name)}" markerWidth="13" markerHeight="13" '
                    f'markerUnits="userSpaceOnUse" refX="11.2" refY="6" orient="auto">'
                    f'<path d="{drop}" fill="{fill}"/></marker>')

        defs = (
            '<defs>'
            + marker('endpoint', solid)
            + marker('endpoint-main', dot_solid)
            + marker('endpoint-side', dot_side)
            + marker('endpoint-dashed', dashed)
            + f'<filter id="{shadow_id}" x="-20%" y="-20%" width="140%" height="150%">'
            '<feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="black" '
            'flood-opacity="0.35"/></filter>'
            '</defs>')
        return ('<svg width="%g" height="%g" viewBox="0 0 %g %g" fill="none" '
                'xmlns="http://www.w3.org/2000/svg">%s%s</svg>'
                % (self.w, self.h, self.w, self.h, defs, ''.join(self.parts)))


@dataclass
class Node:
    id: str
    role: str
    title: str
    sub: str = ''
    detail: str = ''
    kind: str = 'card'          # card | capsule
    stage: int = 0
    row: int = 0
    x: float = 0
    y: float = 0
    w: float = CARD_W
    h: float = CARD_H


class FlowGraph:
    """固定尺寸网格 + 正交 A* 路由器。

    每个节点占一个 (stage, row) 单元；stage = 一列（分块），row = 行。
    行高、列宽、间距固定，节点不按文字撑开；长标签截断。
    """

    def __init__(self, palette='phoenix', tokens=False,
                 margin=20, stage_gap=40, col_w=CARD_W, row_h=CARD_H,
                 row_gap=44, stage_pad=20, title_h=44, stage_bottom=20,
                 stage_neutral=False, stage_dash=True, stage_opacity=0.5,
                 stage_label_size=14, stage_label_weight=600,
                 stage_label_fill=None, stage_label_tracking=None,
                 glass=False, glass_fill=None, capsule_text_size=12,
                 id_prefix=None, auto_width=False, capsule_h=CAPSULE_H):
        self.palette = palette
        self.tokens = tokens
        self.d = FlowDiagram(palette=palette, tokens=tokens)
        self.stages: list[dict] = []
        self.nodes: dict[str, Node] = {}
        self.edges: list[dict] = []
        self.warnings: list[str] = []
        self.margin = margin
        self.stage_gap = stage_gap
        self.col_w = col_w
        self.row_h = row_h
        self.row_gap = row_gap
        self.stage_pad = stage_pad
        self.title_h = title_h
        self.stage_bottom = stage_bottom
        self.stage_neutral = stage_neutral
        self.stage_dash = stage_dash
        self.stage_opacity = stage_opacity
        self.stage_label_size = stage_label_size
        self.stage_label_weight = stage_label_weight
        self.stage_label_fill = stage_label_fill
        self.stage_label_tracking = stage_label_tracking
        self.glass = glass
        self.glass_fill = glass_fill or ('var(--gary-card-surface-top)' if tokens else None)
        self.capsule_text_size = capsule_text_size
        self.id_prefix = id_prefix
        self.auto_width = auto_width
        self.capsule_h = capsule_h
        self.w = self.h = 0
        self._used: list[tuple[float, float, float, float]] = []

    # ---- 图数据 ----
    def stage(self, title, role, id=None):
        sid = id or 's%d' % len(self.stages)
        self.stages.append({'id': sid, 'title': title, 'role': role,
                            'x': 0, 'y': 0, 'w': 0, 'h': 0})
        return len(self.stages) - 1

    def node(self, id, role, title, sub='', detail='', kind='card', stage=0, row=0):
        if id in self.nodes:
            raise ValueError('节点 id 重复：%s' % id)
        if kind not in ('card', 'capsule'):
            raise ValueError("kind 只能是 card 或 capsule，收到 %r" % (kind,))
        if kind == 'capsule':
            w, h = max(50, min(self.col_w, text_width(title, 14) + 28)), self.capsule_h
        else:
            w, h = CARD_W, CARD_H
        self.nodes[id] = Node(id=id, role=role, title=title, sub=sub, detail=detail,
                              kind=kind, stage=stage, row=row, w=w, h=h)
        return id

    def edge(self, src, dst, kind='solid', emphasis='normal', from_offset=0, to_offset=0):
        if kind not in ('solid', 'dashed'):
            raise ValueError("edge kind 只能是 solid 或 dashed，收到 %r" % (kind,))
        self.edges.append({'from': src, 'to': dst, 'kind': kind,
                           'emphasis': emphasis,
                           'from_offset': from_offset, 'to_offset': to_offset})

    # ---- 布局 ----
    def _layout(self):
        if not self.nodes:
            self.w, self.h = 620, 290
            return
        if not self.stages:
            raise ValueError('FlowGraph 至少需要一个 stage；节点不能没有列')
        for nd in self.nodes.values():
            if not 0 <= nd.stage < len(self.stages):
                raise ValueError('节点 %s 的 stage=%d 超出范围（共 %d 个 stage）'
                                 % (nd.id, nd.stage, len(self.stages)))
        if self.auto_width:
            widths = []
            for nd in self.nodes.values():
                if nd.kind == 'capsule':
                    widths.append(text_width(nd.title, 14) + 28)
                    if nd.sub:
                        widths.append(text_width(nd.sub, 11) + 28)
                else:
                    widths.append(text_width(nd.title, 14) + 24)
                    if nd.sub:
                        widths.append(text_width(nd.sub, 11) + 24)
            self.col_w = max(CARD_W, min(260, max(widths or [CARD_W])))
            for nd in self.nodes.values():
                if nd.kind == 'capsule':
                    need = max(text_width(nd.title, 14), text_width(nd.sub, 11)) + 28
                    nd.w = max(50, min(self.col_w, need))
                else:
                    nd.w = self.col_w
        stage_w = self.col_w + 2 * self.stage_pad
        n = len(self.stages)
        self.w = 2 * self.margin + n * stage_w + max(0, n - 1) * self.stage_gap

        for i, st in enumerate(self.stages):
            rows = [nd.row for nd in self.nodes.values() if nd.stage == i]
            st['x'] = self.margin + i * (stage_w + self.stage_gap)
            st['w'] = stage_w
            if not rows:
                st['y'], st['h'] = self.margin, self.title_h + self.stage_bottom
                continue
            r0, r1 = min(rows), max(rows)
            span = r1 - r0 + 1
            # 每个阶段是一条列；行号按阶段内部从 0 起算，所以所有阶段块顶部对齐。
            st['y'] = self.margin
            st['h'] = self.title_h + span * self.row_h + (span - 1) * self.row_gap + self.stage_bottom

            for nd in self.nodes.values():
                if nd.stage != i:
                    continue
                nd.x = st['x'] + self.stage_pad + (self.col_w - nd.w) / 2
                nd.y = (st['y'] + self.title_h
                        + (nd.row - r0) * (self.row_h + self.row_gap)
                        + (self.row_h - nd.h) / 2)

        self.h = max(st['y'] + st['h'] for st in self.stages) + self.margin

    # ---- 路由 ----
    @staticmethod
    def _port(n: Node, side: str, offset: float = 0):
        if side == 'left':
            return (n.x, n.y + n.h / 2 + offset)
        if side == 'right':
            return (n.x + n.w, n.y + n.h / 2 + offset)
        if side == 'top':
            return (n.x + n.w / 2 + offset, n.y)
        return (n.x + n.w / 2 + offset, n.y + n.h)

    @staticmethod
    def _offset(p, side, d=10):
        x, y = p
        if side == 'left':
            return (x - d, y)
        if side == 'right':
            return (x + d, y)
        if side == 'top':
            return (x, y - d)
        return (x, y + d)

    def _sides(self, a: Node, b: Node):
        if a.stage == b.stage:
            if b.row > a.row:
                return 'bottom', 'top'
            if b.row < a.row:
                return 'top', 'bottom'
        if b.stage > a.stage:
            return 'right', 'left'
        if b.stage < a.stage:
            return 'left', 'right'
        return 'right', 'left'

    def _obstacles(self, a: Node, b: Node):
        obs = []
        for nd in self.nodes.values():
            if nd.id in (a.id, b.id):
                continue
            obs.append((nd.x - 6, nd.y - 6, nd.w + 12, nd.h + 12))
        for st in self.stages:
            if st['id'] in (self.stages[a.stage]['id'], self.stages[b.stage]['id']):
                continue
            obs.append((st['x'] - 6, st['y'] - 6, st['w'] + 12, st['h'] + 12))
        return obs

    @staticmethod
    def _blocked_h(obs, y, x1, x2):
        lo, hi = (x1, x2) if x1 <= x2 else (x2, x1)
        for ox, oy, ow, oh in obs:
            if oy + 0.01 < y < oy + oh - 0.01 and hi > ox + 0.01 and lo < ox + ow - 0.01:
                return True
        return False

    @staticmethod
    def _blocked_v(obs, x, y1, y2):
        lo, hi = (y1, y2) if y1 <= y2 else (y2, y1)
        for ox, oy, ow, oh in obs:
            if ox + 0.01 < x < ox + ow - 0.01 and hi > oy + 0.01 and lo < oy + oh - 0.01:
                return True
        return False

    def _overlap_penalty(self, x1, y1, x2, y2):
        """已走过的线段附近再走同一条，加代价——避免两条线长距离叠成一根。"""
        p = 0
        for ux1, uy1, ux2, uy2 in self._used:
            if abs(y1 - y2) < 1e-6 and abs(uy1 - uy2) < 1e-6:
                if abs(y1 - uy1) < 7:
                    lo, hi = (x1, x2) if x1 <= x2 else (x2, x1)
                    ulo, uhi = (ux1, ux2) if ux1 <= ux2 else (ux2, ux1)
                    if hi > ulo + 1 and lo < uhi - 1:
                        p += 18
            elif abs(x1 - x2) < 1e-6 and abs(ux1 - ux2) < 1e-6:
                if abs(x1 - ux1) < 7:
                    lo, hi = (y1, y2) if y1 <= y2 else (y2, y1)
                    ulo, uhi = (uy1, uy2) if uy1 <= uy2 else (uy2, uy1)
                    if hi > ulo + 1 and lo < uhi - 1:
                        p += 18
        return p

    def _frame_penalty(self, x1, y1, x2, y2):
        """别沿着 1px 分块边框走——贴边会把虚线框读成实线。"""
        p = 0
        for st in self.stages:
            if abs(x1 - x2) < 1e-6:
                if min(y1, y2) < st['y'] + st['h'] - 1 and max(y1, y2) > st['y'] + 1:
                    if (abs(x1 - st['x']) < 2.5
                            or abs(x1 - (st['x'] + st['w'])) < 2.5):
                        p += 24
            elif abs(y1 - y2) < 1e-6:
                if min(x1, x2) < st['x'] + st['w'] - 1 and max(x1, x2) > st['x'] + 1:
                    if (abs(y1 - st['y']) < 2.5
                            or abs(y1 - (st['y'] + st['h'])) < 2.5):
                        p += 24
        return p

    @staticmethod
    def _segments(points):
        return [(a[0], a[1], b[0], b[1]) for a, b in zip(points, points[1:])
                if abs(a[0] - b[0]) > 1e-6 or abs(a[1] - b[1]) > 1e-6]

    def _finish(self, path):
        path = self._simplify(path)
        self._used.extend(self._segments(path))
        return path

    @staticmethod
    def _simplify(points):
        out = []
        for p in points:
            if out and abs(p[0] - out[-1][0]) < 1e-6 and abs(p[1] - out[-1][1]) < 1e-6:
                continue
            out.append(p)
        i = 1
        while i < len(out) - 1:
            a, b, c = out[i - 1], out[i], out[i + 1]
            col_x = abs(a[0] - b[0]) < 1e-6 and abs(b[0] - c[0]) < 1e-6
            col_y = abs(a[1] - b[1]) < 1e-6 and abs(b[1] - c[1]) < 1e-6
            if col_x or col_y:
                out.pop(i)
            else:
                i += 1
        return out

    def _fallback(self, p1, p2, side):
        (x1, y1), (x2, y2) = p1, p2
        if side in ('left', 'right'):
            mx = (x1 + x2) / 2
            return [(x1, y1), (mx, y1), (mx, y2), (x2, y2)]
        my = (y1 + y2) / 2
        return [(x1, y1), (x1, my), (x2, my), (x2, y2)]

    def _route(self, a: Node, b: Node, from_offset: float = 0, to_offset: float = 0):
        start_side, end_side = self._sides(a, b)
        p1 = self._port(a, start_side, from_offset)
        p2 = self._port(b, end_side, to_offset)
        s = tuple(round(v, 2) for v in self._offset(p1, start_side))
        e = tuple(round(v, 2) for v in self._offset(p2, end_side))
        obs = self._obstacles(a, b)

        xs = {8.0, self.w - 8.0, s[0], e[0], p1[0], p2[0]}
        ys = {8.0, self.h - 8.0, s[1], e[1], p1[1], p2[1]}
        for nd in self.nodes.values():
            xs.update((nd.x, nd.x + nd.w, nd.x + nd.w / 2, nd.x - 10, nd.x + nd.w + 10))
            ys.update((nd.y, nd.y + nd.h, nd.y + nd.h / 2, nd.y - 10, nd.y + nd.h + 10))
        for st in self.stages:
            xs.update((st['x'], st['x'] + st['w'], st['x'] + st['w'] / 2,
                       st['x'] - 10, st['x'] + st['w'] + 10))
            ys.update((st['y'], st['y'] + st['h'], st['y'] + st['h'] / 2,
                       st['y'] - 10, st['y'] + st['h'] + 10))
        xs = sorted({round(v, 2) for v in xs if 4 <= v <= self.w - 4})
        ys = sorted({round(v, 2) for v in ys if 4 <= v <= self.h - 4})
        xi = {v: i for i, v in enumerate(xs)}
        yi = {v: i for i, v in enumerate(ys)}
        if s[0] not in xi or s[1] not in yi or e[0] not in xi or e[1] not in yi:
            self.warnings.append('路由点不在候选网格：%s → %s' % (a.id, b.id))
            return self._finish(self._fallback(p1, p2, start_side))

        si, sj = xi[s[0]], yi[s[1]]
        ti, tj = xi[e[0]], yi[e[1]]
        start: tuple[int, int, int] = (si, sj, -1)
        goal_ij = (ti, tj)

        def h(i, j):
            return abs(xs[i] - xs[ti]) + abs(ys[j] - ys[tj])

        gscore: dict[tuple[int, int, int], float] = {start: 0.0}
        came: dict[tuple[int, int, int], tuple[int, int, int]] = {}
        pq: list[tuple[float, float, tuple[int, int, int]]] = [(h(si, sj), 0.0, start)]
        closed = set()
        goal = None
        while pq:
            _, g, state = heapq.heappop(pq)
            if state in closed:
                continue
            closed.add(state)
            i, j, d = state
            if (i, j) == goal_ij:
                goal = state
                break
            moves = []
            if i > 0:
                moves.append((i - 1, j, 0))
            if i + 1 < len(xs):
                moves.append((i + 1, j, 0))
            if j > 0:
                moves.append((i, j - 1, 1))
            if j + 1 < len(ys):
                moves.append((i, j + 1, 1))
            for ni, nj, nd in moves:
                if nd == 0:
                    if self._blocked_h(obs, ys[j], xs[i], xs[ni]):
                        continue
                    step = abs(xs[ni] - xs[i])
                else:
                    if self._blocked_v(obs, xs[i], ys[j], ys[nj]):
                        continue
                    step = abs(ys[nj] - ys[j])
                ns = (ni, nj, nd)
                ng = (g + step + (0 if d in (-1, nd) else 12)
                      + self._overlap_penalty(xs[i], ys[j], xs[ni], ys[nj])
                      + self._frame_penalty(xs[i], ys[j], xs[ni], ys[nj]))
                if ng < gscore.get(ns, 1e18):
                    gscore[ns] = ng
                    came[ns] = state
                    heapq.heappush(pq, (ng + h(ni, nj), ng, ns))

        if goal is None:
            self.warnings.append('A* 找不到路径：%s → %s' % (a.id, b.id))
            return self._finish(self._fallback(p1, p2, start_side))

        pts = []
        cur = goal
        while cur in came:
            i, j, _ = cur
            pts.append((xs[i], ys[j]))
            cur = came[cur]
        pts.append((xs[si], ys[sj]))
        pts.reverse()
        path = [p1] + pts + [p2]
        return self._finish(path)

    # ---- 输出 ----
    def render(self) -> str:
        self._layout()
        self._used.clear()
        if self.id_prefix:
            self.d.id_prefix = self.id_prefix
        elif not self.d.id_prefix:
            key = json.dumps({
                'stages': [(s['id'], s['title'], s['role']) for s in self.stages],
                'nodes': [(n.id, n.role, n.title, n.sub, n.kind, n.stage, n.row)
                          for n in self.nodes.values()],
                'edges': [(e['from'], e['to'], e['kind'], e.get('emphasis', 'normal'),
                           e.get('from_offset', 0), e.get('to_offset', 0))
                          for e in self.edges],
            }, sort_keys=True, ensure_ascii=False)
            self.d.id_prefix = 'fd-' + hashlib.sha1(key.encode('utf-8')).hexdigest()[:6] + '-'
        self.d.w, self.d.h = self.w, self.h
        stage_stroke = self.d.T['text']['500'] if self.stage_neutral else None
        stage_label_fill = self.stage_label_fill
        if stage_label_fill is None and self.stage_neutral:
            stage_label_fill = self.d.T['text']['500']
        for st in self.stages:
            self.d.container(st['x'], st['y'], st['w'], st['h'], st['role'],
                             st['title'], stroke=stage_stroke,
                             dash=self.stage_dash, opacity=self.stage_opacity,
                             label_size=self.stage_label_size,
                             label_weight=self.stage_label_weight,
                             label_fill=stage_label_fill,
                             label_tracking=self.stage_label_tracking)
        for nd in self.nodes.values():
            fill = self.glass_fill if self.glass else None
            filter_id = 'card-shadow' if self.glass else None
            self.d.node_open(nd.id, nd.title, nd.sub)
            if nd.kind == 'capsule':
                self.d.capsule(nd.x, nd.y, nd.w, nd.role, nd.title, h=nd.h,
                               fill=fill, filter_id=filter_id,
                               text_size=self.capsule_text_size, sub=nd.sub)
            else:
                self.d.card(nd.x, nd.y, nd.role, nd.title, nd.sub,
                            w=nd.w, h=nd.h, fill=fill, filter_id=filter_id)
            self.d.node_close()
        for e in self.edges:
            a, b = self.nodes[e['from']], self.nodes[e['to']]
            pts = self._route(a, b, e.get('from_offset', 0), e.get('to_offset', 0))
            emphasis = e.get('emphasis', 'normal')
            stroke = None
            opacity = None
            if emphasis == 'main':
                stroke = self.d.T['text']['900'] if self.tokens else self.d.T['edge']['solid']
            elif emphasis == 'side':
                opacity = 0.52
            if e['kind'] == 'dashed':
                marker = 'endpoint-dashed'
            elif emphasis == 'main':
                marker = 'endpoint-main'
            elif emphasis == 'side':
                marker = 'endpoint-side'
            else:
                marker = 'endpoint'
            self.d.arrow(*pts, dashed=e['kind'] == 'dashed', stroke=stroke,
                         opacity=opacity, marker=marker)
        for nd in self.nodes.values():
            if nd.detail.strip():
                self.d.detail(nd.id, nd.x, nd.y, nd.w, nd.h, nd.role,
                              nd.title, nd.sub, nd.detail)
        return self.d.render()


def graph_from_dict(data: dict, palette='phoenix', tokens=False, **graph_kwargs) -> FlowGraph:
    g = FlowGraph(palette=palette, tokens=tokens, **graph_kwargs)
    for st in data.get('stages', []):
        g.stage(st['title'], st['role'], id=st.get('id'))
    for nd in data.get('nodes', []):
        g.node(nd['id'], nd['role'], nd['title'], sub=nd.get('sub', ''),
               detail=nd.get('detail', ''),
               kind=nd.get('kind', 'card'), stage=nd.get('stage', 0), row=nd.get('row', 0))
    for e in data.get('edges', []):
        g.edge(e['from'], e['to'], e.get('kind', 'solid'),
               emphasis=e.get('emphasis', 'normal'),
               from_offset=e.get('from_offset', 0),
               to_offset=e.get('to_offset', 0))
    return g


def html_page(svg: str, title: str, subtitle: str, css: str,
              eyebrow='Gary-UI · flow-diagram', legend=True,
              footer='实线 = 主路径；虚线 = 非主路径（辅助输入 / 异步回报 / 跨相位引用）。',
              center=False, min_diagram_scale: float = 0) -> str:
    legends = [
        ('--gary-category-2', '输入'),
        ('--gary-category-1', '处理'),
        ('--gary-category-4', '判定'),
        ('--gary-category-3', '结果'),
    ]
    chips = '\n'.join(
        '<span><i style="background:var(%s)"></i>%s</span>' % (name, label)
        for name, label in legends)
    eyebrow_html = ('  <p class="eyebrow">%s</p>\n' % escape(eyebrow)) if eyebrow else ''
    legend_html = ('  <div class="legend">%s</div>\n' % chips) if legend else ''
    footer_html = ('  <p class="foot">%s</p>\n' % escape(footer)) if footer else ''
    center_css = ('.page{min-height:100vh;display:flex;flex-direction:column;'
                  'justify-content:center}') if center else ''
    if min_diagram_scale:
        m = re.search(r'<svg\b[^>]*\bwidth="([\d.]+)"', svg)
        if m:
            min_w = float(m.group(1)) * min_diagram_scale
            svg = re.sub(r'<svg\b', '<svg style="min-width:%gpx" ' % min_w, svg, count=1)
    interaction_js = """<script>
(() => {
  const svg = document.querySelector('.diagram svg');
  if (!svg) return;
  const closeAll = () => svg.querySelectorAll('.node-detail').forEach(g => {
    g.style.display = 'none';
  });
  const open = (id) => {
    closeAll();
    const card = svg.querySelector(`.node-detail[data-detail="${id}"]`);
    if (card) card.style.display = '';
  };
  svg.querySelectorAll('.node').forEach(node => {
    const id = node.getAttribute('data-node');
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      open(id);
    });
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(id);
      }
    });
  });
  svg.querySelectorAll('.flow-detail-close').forEach(button => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      closeAll();
    });
  });
  svg.addEventListener('click', (event) => {
    if (!event.target.closest('.node') && !event.target.closest('.node-detail')) closeAll();
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.diagram')) closeAll();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
</script>"""
    return f"""<!doctype html>
<html lang="zh-CN" data-gary-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{escape(title)}</title>
<link rel="stylesheet" href="{escape(css)}">
<style>
*{{box-sizing:border-box}}
html{{background:var(--gary-surface-page);color:var(--gary-text-primary)}}
body{{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}}
.page{{max-width:1240px;margin:0 auto;padding:48px 40px 56px}}
{center_css}
.eyebrow{{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--gary-text-tertiary);margin:0 0 12px}}
h1{{font-size:30px;line-height:1.2;font-weight:600;margin:0 0 10px}}
.lede{{font-size:14px;line-height:1.7;color:var(--gary-text-secondary);margin:0 0 28px;max-width:780px}}
.legend{{display:flex;gap:20px;flex-wrap:wrap;font-size:13px;color:var(--gary-text-secondary);margin:0 0 18px}}
.legend i{{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:7px;vertical-align:middle}}
.diagram{{width:100%;overflow:auto}}
.diagram svg{{display:block;width:100%;height:auto}}
.node{{cursor:pointer}}
.node:hover{{filter:brightness(1.12)}}
.flow-detail{{box-sizing:border-box;width:100%;height:100%;padding:14px 16px;border-radius:12px;
  background:var(--gary-card-surface-top);border:1px solid var(--gary-text-tertiary);
  box-shadow:0 18px 40px rgba(0,0,0,.5);color:var(--gary-text-primary);
  font-family:inherit;font-size:14px;line-height:1.55;overflow:hidden;position:relative}}
.flow-detail[data-role="input"]{{border-color:var(--gary-category-2)}}
.flow-detail[data-role="process"]{{border-color:var(--gary-category-1)}}
.flow-detail[data-role="decision"]{{border-color:var(--gary-category-4)}}
.flow-detail[data-role="result"]{{border-color:var(--gary-category-3)}}
.flow-detail-kicker{{font-size:13px;letter-spacing:.1em;color:var(--gary-text-tertiary)}}
.flow-detail-title{{font-size:16px;font-weight:600;margin:4px 0 2px}}
.flow-detail-sum{{font-size:13px;color:var(--gary-text-secondary)}}
.flow-detail-body{{font-size:14px;color:var(--gary-text-primary);margin:10px 0 0}}
.flow-detail-close{{position:absolute;top:8px;right:10px;border:0;background:transparent;
  color:var(--gary-text-tertiary);font-size:18px;line-height:1;cursor:pointer;padding:4px}}
.foot{{font-size:13px;color:var(--gary-text-tertiary);margin:18px 0 0}}
@media(max-width:760px){{.page{{padding:28px 20px 40px}}h1{{font-size:24px}}}}
</style>
</head>
<body>
<main class="page">
{eyebrow_html}  <h1>{escape(title)}</h1>
  <p class="lede">{escape(subtitle)}</p>
{legend_html}  <div class="diagram">{svg}</div>
{footer_html}</main>
{interaction_js}
</body>
</html>
"""


def report_graph(data: dict, palette='gary', tokens=True, id_prefix=None) -> FlowGraph:
    """报告页呈现（03 定稿）：中性阶段框、阶段标题降级、主路径由数据里的 emphasis 承担。"""
    g = graph_from_dict(
        data, palette=palette, tokens=tokens, id_prefix=id_prefix,
        stage_neutral=True, stage_dash=False, stage_opacity=0.24,
        stage_label_size=14, stage_label_weight=500,
        stage_label_tracking='.12em',
        glass=True, capsule_text_size=14, auto_width=True, capsule_h=54)
    missing_sub = [n.id for n in g.nodes.values() if not n.sub.strip()]
    if missing_sub:
        raise ValueError('报告页节点必须有摘要 sub：' + ', '.join(missing_sub))
    missing_detail = [n.id for n in g.nodes.values() if not n.detail.strip()]
    if missing_detail:
        raise ValueError('报告页节点必须有详情 detail：' + ', '.join(missing_detail))
    return g


def report_html(svg: str, title: str, subtitle: str, css: str) -> str:
    return html_page(
        svg, title, subtitle, css,
        eyebrow='', legend=False,
        footer='实线 = 主路径 · 虚线 = 辅助 / 异步 · 描边色 = 角色 · 点击节点看详情',
        center=True, min_diagram_scale=0.85)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description='按 flow-diagram 规范出 SVG')
    ap.add_argument('out', nargs='?', default='flow-sample.svg')
    ap.add_argument('--input', '-i', help='图数据 JSON（stages / nodes / edges）')
    ap.add_argument('--palette', choices=('phoenix', 'gary'), default='phoenix')
    ap.add_argument('--tokens', action='store_true', help='gary 变体输出 var(--gary-*)，用于嵌页')
    ap.add_argument('--report', action='store_true', help='报告页呈现：中性阶段框、无图例、主路径强调')
    ap.add_argument('--html', help='同时写一个 HTML 预览页（只支持 gary + tokens）')
    ap.add_argument('--css', default='../../tokens/base.css', help='HTML 里 link 的 token CSS 相对路径')
    args = ap.parse_args(argv)

    if args.html and not (args.palette == 'gary' and args.tokens):
        ap.error('--html 只支持 --palette gary --tokens（页面必须走 token）')
    if args.report and not (args.palette == 'gary' and args.tokens):
        ap.error('--report 只支持 --palette gary --tokens（报告页必须走 token）')

    if args.input:
        data = json.load(open(args.input, encoding='utf-8'))
        g = report_graph(data, palette=args.palette, tokens=args.tokens) if args.report \
            else graph_from_dict(data, palette=args.palette, tokens=args.tokens)
        svg = g.render()
        for w in g.warnings:
            print('warn:', w, file=sys.stderr)
        title = data.get('title', '过程型流程图')
        subtitle = data.get('subtitle', '')
    else:
        if args.palette == 'gary':
            ap.error('gary 样例需要 --input；内置样例用了 process2/decide2，gary 尚未定义深一档')
        d = FlowDiagram(width=648, height=290, palette=args.palette, tokens=args.tokens)
        d.container(20, 40, 160, 200, 'input', '输入源')
        d.subframe(35, 85, 130, 140, 'input', '本轮请求')
        for i, s in enumerate(('请求', '参数', '上下文')):
            d.item(45, 115 + i * 35, 110, s)
        d.card(250, 80, 'process', '处理', '模型调用')
        d.capsule(265, 180, 90, 'process2', '中间产物')
        d.card(430, 120, 'decision', '判定', '规则或模型')
        d.capsule(570, 137, 50, 'decide2', '结论')
        d.arrow((180, 115), (248, 115))
        d.arrow((310, 150), (310, 178))
        d.arrow((355, 198), (390, 198), (390, 155), (428, 155))
        d.arrow((550, 155), (568, 155))
        d.arrow((155, 164), (208, 164), (208, 55), (490, 55), (490, 118), dashed=True)
        svg = d.render()
        title, subtitle = '过程型流程图 · 样例', '四层结构 + 四色描边 + 正交折线'

    open(args.out, 'w', encoding='utf-8').write(svg)
    print('已写出', args.out)

    if args.html:
        page = report_html(svg, title, subtitle, args.css) if args.report \
            else html_page(svg, title, subtitle, args.css)
        open(args.html, 'w', encoding='utf-8').write(page)
        print('已写出', args.html)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
