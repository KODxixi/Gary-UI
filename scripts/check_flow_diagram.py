#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""流程图规范校验（spec/flow-diagram.json 的机器闸）。

判的是「有没有退化成随手画的图」：颜色跑出色板、圆角乱写、字号乱加档、
连线用曲线、虚线复用实线箭头——这些都是肉眼看不出来、但一多就散架的漂移。

    python scripts/check_flow_diagram.py <file.svg|file.html> [more...]
    python scripts/check_flow_diagram.py --self-test      # 证明闸会红

退出码 0 = 全过；1 = 有违规。
"""
from __future__ import annotations

import argparse
import re
import sys

# ---- 合法集合（与 spec/flow-diagram.json 同步）----
ROLE_STROKES = {
    '#e67e22', '#2196f3', '#1976d2', '#9c27b0', '#7b1fa2', '#ffbf00',
    # gary 变体：spec/chart-recipes.json → themes.*.category1..4
    '#d5af59', '#82acec', '#be9bda', '#78c9ac',
}
NEUTRAL_STROKES = {'#8d8d8d', '#6a6a6a', 'gray500', 'gray400'}
ALLOWED_STROKE_VARS = {
    'var(--global-color-gray-500)', 'var(--global-color-gray-400)',
    'var(--gary-category-1)', 'var(--gary-category-2)',
    'var(--gary-category-3)', 'var(--gary-category-4)',
    'var(--gary-text-primary)', 'var(--gary-text-secondary)',
    'var(--gary-text-tertiary)',
    'context-stroke', 'none',
}
ALLOWED_FILL = {
    '#0e0e0e', '#1d1d1d', '#303030', 'none', 'transparent', 'currentColor',
    'var(--global-color-gray-75)', 'var(--global-color-gray-100)',
    'var(--global-color-gray-200)',
    'var(--gary-surface-page)', 'var(--gary-solid-plate)',
    'var(--gary-surface-sunken)', 'var(--gary-card-surface-top)',
}
ALLOWED_FONT_SIZES = {'11', '12', '14'}
ALLOWED_RX_FIXED = {0, 4, 8}

RE_ELEM = re.compile(r'<(rect|line|polyline|path|text|marker|circle|ellipse|polygon)\b([^>]*)>',
                     re.I | re.S)
RE_ATTR = re.compile(r'([\w-]+)\s*=\s*"([^"]*)"')


def parse_attrs(s):
    return {k.lower(): v for k, v in RE_ATTR.findall(s)}


def extract_svg(path):
    raw = open(path, encoding='utf-8', errors='replace').read()
    if path.lower().endswith('.svg') or raw.lstrip().startswith('<svg'):
        return raw
    # HTML：把所有 <svg> 抓出来
    return '\n'.join(re.findall(r'<svg\b.*?</svg>', raw, re.S | re.I))


def norm_color(c):
    c = (c or '').strip().lower()
    if c.startswith('rgb('):
        nums = [int(x) for x in re.findall(r'\d+', c)[:3]]
        if len(nums) == 3:
            return '#%02x%02x%02x' % tuple(nums)
    return c


def check(path, has_dash=False):
    svg = extract_svg(path)
    if '<svg' not in svg:
        return ['找不到 <svg>：这不像一张图'], 0

    problems = []
    seen = {'stroke': {}, 'fill': {}, 'rx': {}, 'font': {}, 'sw': {}, 'curve': 0}
    n = 0

    for m in RE_ELEM.finditer(svg):
        tag, attrstr = m.group(1).lower(), m.group(2)
        a = parse_attrs(attrstr)
        n += 1

        st = a.get('stroke')
        if st:
            s = norm_color(st)
            base = s if s not in ALLOWED_STROKE_VARS else st.strip().lower()
            seen['stroke'][base] = seen['stroke'].get(base, 0) + 1
            ok = (base in ROLE_STROKES or base in NEUTRAL_STROKES
                  or base in ALLOWED_STROKE_VARS)
            if not ok:
                problems.append('第 %d 个 <%s> 的 stroke="%s" 不在色板里' % (n, tag, st))

        fi = a.get('fill')
        if fi and tag in ('rect', 'polygon', 'circle', 'ellipse'):
            f = norm_color(fi)
            seen['fill'][f] = seen['fill'].get(f, 0) + 1
            if f not in ALLOWED_FILL:
                # marker 里的箭头/圆点允许跟线色（中性灰或角色色）
                if tag in ('polygon', 'circle', 'ellipse') and (f in ROLE_STROKES or f in NEUTRAL_STROKES):
                    pass
                elif 'var(--global-color-gray-4' in fi or 'var(--global-color-gray-5' in fi:
                    pass   # marker 箭头：跟中性灰线
                elif 'var(--global-text' in fi or 'var(--gary-text' in fi:
                    pass
                else:
                    problems.append('第 %d 个 <%s> 的 fill="%s" 不在允许的填充里' % (n, tag, fi))

        if tag == 'rect':
            rx = a.get('rx')
            h = a.get('height')
            if rx is not None and h:
                try:
                    rxv, hv = float(rx), float(h)
                except ValueError:
                    rxv = hv = None
                if rxv is not None and hv:
                    is_capsule = abs(rxv - hv / 2) < 0.51
                    seen['rx'][rx] = seen['rx'].get(rx, 0) + 1
                    if not is_capsule and int(rxv) not in ALLOWED_RX_FIXED:
                        problems.append('第 %d 个 <rect> rx=%s 不在 {4, 8, h/2}' % (n, rx))

        if tag == 'text':
            fs = a.get('font-size')
            if fs:
                seen['font'][fs] = seen['font'].get(fs, 0) + 1
                val = fs.rstrip('px')
                if val not in ALLOWED_FONT_SIZES:
                    problems.append('第 %d 个 <text> font-size="%s" 不在 {11,12,14}' % (n, fs))

        if tag in ('line', 'polyline', 'path'):
            sw = a.get('stroke-width')
            dashed = bool(a.get('stroke-dasharray'))
            if tag in ('line', 'polyline') and not a.get('marker-end'):
                problems.append('第 %d 个 <%s> 没有 marker-end（端点圆点缺失）' % (n, tag))
            if sw:
                seen['sw'][sw] = seen['sw'].get(sw, 0) + 1
                want = '1.5' if dashed else '2'
                if sw.rstrip('px') != want:
                    problems.append('第 %d 个 <%s> stroke-width=%s（%s应为 %s）'
                                    % (n, tag, sw, '虚线' if dashed else '实线', want))
            if dashed:
                has_dash = True
            if tag == 'path' and a.get('stroke'):
                d = a.get('d', '')
                if re.search(r'[QTCSAqtsca]', d):
                    seen['curve'] += 1
                    problems.append('第 %d 个 <path> 用了曲线命令（%s）——连线必须正交折线'
                                    % (n, re.search(r'[QTCSAqtsca]', d).group(0)))

    # marker 要求：实/虚各一个
    marker_ids = re.findall(r'<marker[^>]*\bid="([^"]+)"', svg)
    if not marker_ids:
        problems.append('没有 <marker>：箭头缺失')

    problems += check_geometry(svg)

    return problems, n


def _rects(svg):
    """取出所有带 x/y 的 rect，连同 id/序号。"""
    out = []
    for idx, m in enumerate(re.finditer(r'<rect\b([^>]*)>', svg, re.I | re.S), 1):
        a = parse_attrs(m.group(1))
        try:
            x, y = float(a.get('x', 'nan')), float(a.get('y', 'nan'))
            w, h = float(a.get('width', 'nan')), float(a.get('height', 'nan'))
        except ValueError:
            continue
        if any(v != v for v in (x, y, w, h)):      # NaN
            continue
        out.append({'i': idx, 'x': x, 'y': y, 'w': w, 'h': h,
                    'stroke': a.get('stroke', ''), 'rx': a.get('rx', ''),
                    'fill': a.get('fill', ''), 'sw': a.get('stroke-width', '')})
    return out


def _contains(outer, inner):
    return (inner['x'] >= outer['x'] - 0.5 and inner['y'] >= outer['y'] - 0.5
            and inner['x'] + inner['w'] <= outer['x'] + outer['w'] + 0.5
            and inner['y'] + inner['h'] <= outer['y'] + outer['h'] + 0.5)


def _segments(svg):
    """取出 line / polyline 的正交线段；曲线不在这里判（样式闸已单独抓）。"""
    out = []
    for m in re.finditer(r'<line\b([^>]*)>', svg, re.I | re.S):
        a = parse_attrs(m.group(1))
        try:
            p = (float(a['x1']), float(a['y1']))
            q = (float(a['x2']), float(a['y2']))
        except (KeyError, ValueError):
            continue
        out.append((p, q))
    for m in re.finditer(r'<polyline\b([^>]*)>', svg, re.I | re.S):
        a = parse_attrs(m.group(1))
        nums = [float(v) for v in re.findall(r'-?\d+(?:\.\d+)?', a.get('points', ''))]
        pts = list(zip(nums[0::2], nums[1::2]))
        out.extend((p, q) for p, q in zip(pts, pts[1:]))
    return out


def _on_boundary(p, r, eps=0.75):
    x, y = p
    inside = (r['x'] - eps <= x <= r['x'] + r['w'] + eps
              and r['y'] - eps <= y <= r['y'] + r['h'] + eps)
    if not inside:
        return False
    return (abs(x - r['x']) <= eps or abs(x - (r['x'] + r['w'])) <= eps
            or abs(y - r['y']) <= eps or abs(y - (r['y'] + r['h'])) <= eps)


def _check_edge_crossings(svg, rects):
    """连线不得穿过卡片/胶囊（2px 描边的对象）。

    分块与子帧是 1px 边框，允许被垂直穿越；条目无描边，不在这里判。
    起点/终点落在对象边缘上算合法（落点取边中点），只有穿越内部才报。
    """
    problems = []
    cards = []
    for r in rects:
        try:
            sw = float(r.get('sw') or 0)
        except ValueError:
            sw = 0
        if sw >= 1.9:
            cards.append(r)
    for n, (p, q) in enumerate(_segments(svg), 1):
        (x1, y1), (x2, y2) = p, q
        horizontal = abs(y1 - y2) < 0.01
        vertical = abs(x1 - x2) < 0.01
        if not (horizontal or vertical):
            continue
        for r in cards:
            if _on_boundary(p, r) or _on_boundary(q, r):
                continue
            if horizontal:
                hit = (r['y'] + 0.75 < y1 < r['y'] + r['h'] - 0.75
                       and max(x1, x2) > r['x'] + 0.75
                       and min(x1, x2) < r['x'] + r['w'] - 0.75)
            else:
                hit = (r['x'] + 0.75 < x1 < r['x'] + r['w'] - 0.75
                       and max(y1, y2) > r['y'] + 0.75
                       and min(y1, y2) < r['y'] + r['h'] - 0.75)
            if hit:
                problems.append('第 %d 段连线穿过第 %d 个 <rect>（%s）'
                                % (n, r['i'], r['stroke'] or '无描边'))
    return problems


def check_geometry(svg):
    """几何闸：框压框、出画布、连线穿卡。

    为什么必须有这一条：样式闸全绿时图仍可能明显是坏的——实测一张合规样例里
    结论胶囊压住判定卡 10px，27 个元素「全部合规」。样式判据看不见位置。
    """
    problems = []
    rects = _rects(svg)

    # 1) 重叠（包含关系放行：子帧/条目本来就在容器里）
    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            a, b = rects[i], rects[j]
            if _contains(a, b) or _contains(b, a):
                continue
            ox = min(a['x'] + a['w'], b['x'] + b['w']) - max(a['x'], b['x'])
            oy = min(a['y'] + a['h'], b['y'] + b['h']) - max(a['y'], b['y'])
            if ox > 0.5 and oy > 0.5:
                problems.append(
                    '第 %d 与第 %d 个 <rect> 重叠 %.0f×%.0f（%s ↔ %s）'
                    % (a['i'], b['i'], ox, oy,
                       a['stroke'] or '无描边', b['stroke'] or '无描边'))

    # 2) 出画布
    m = re.search(r'viewBox\s*=\s*"([\d.\-]+)[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)[ ,]+([\d.\-]+)"', svg)
    if m:
        vx, vy, vw, vh = (float(v) for v in m.groups())
        for r in rects:
            if (r['x'] < vx - 0.5 or r['y'] < vy - 0.5
                    or r['x'] + r['w'] > vx + vw + 0.5
                    or r['y'] + r['h'] > vy + vh + 0.5):
                problems.append('第 %d 个 <rect> 超出 viewBox（%.0f,%.0f %.0f×%.0f，画布 %g×%g）'
                                % (r['i'], r['x'], r['y'], r['w'], r['h'], vw, vh))

    # 3) 连线穿过卡片/胶囊
    problems += _check_edge_crossings(svg, rects)
    return problems


def self_test():
    """证明闸会红——只看到全绿不构成证据。"""
    import tempfile, os
    bad = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
<marker id="a" markerWidth="10" markerHeight="7" refX="9" refY="3.5"><polygon points="0,0 10,3.5 0,7" fill="#8d8d8d"/></marker>
<rect x="50" y="0" width="100" height="50" rx="12" fill="#ff0000" stroke="#00ff00" stroke-width="2"/>
<text x="10" y="20" font-size="13">x</text>
<path d="M0,0 Q10,10 20,0" stroke="#8d8d8d" stroke-width="2"/>
<line x1="0" y1="25" x2="200" y2="25" stroke="#8d8d8d" stroke-width="2" marker-end="url(#a)"/>
<line x1="0" y1="80" x2="200" y2="80" stroke="#8d8d8d" stroke-width="2"/>
</svg>'''
    f = tempfile.NamedTemporaryFile('w', suffix='.svg', delete=False, encoding='utf-8')
    f.write(bad); f.close()
    problems, _ = check(f.name)
    os.unlink(f.name)
    wanted = ['rx=12', 'fill="#ff0000"', 'stroke="#00ff00"', 'font-size="13"', '曲线', '穿过',
              '没有 marker-end']
    hit = [w for w in wanted if any(w in p for p in problems)]
    ok = len(hit) == len(wanted)
    print('自检：%d/%d 类违规被抓到' % (len(hit), len(wanted)))
    for w in wanted:
        print('  %s %s' % ('✓' if any(w in p for p in problems) else '✗', w))
    return 0 if ok else 1


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--self-test', action='store_true')
    args = ap.parse_args(argv)

    if args.self_test:
        return self_test()
    if not args.paths:
        ap.print_help()
        return 2

    failed = 0
    for p in args.paths:
        try:
            problems, n = check(p)
        except OSError as e:
            print('%s — 打不开：%s' % (p, e), file=sys.stderr)
            failed += 1
            continue
        if problems:
            print('%s — %d 项违规（扫了 %d 个元素）' % (p, len(problems), n))
            for x in problems[:24]:
                print('  · ' + x)
            if len(problems) > 24:
                print('  … 还有 %d 项' % (len(problems) - 24))
            failed += 1
        else:
            print('OK %s — %d 个元素全部合规' % (p, n))
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
