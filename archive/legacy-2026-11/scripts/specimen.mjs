/**
 * Specimen pages · component specimen + variant comparison
 *
 *   node scripts/specimen.mjs
 *
 * Produces (all in out/specimen/):
 *   specimen-A|B|C|D.html  same specimen, accent swapped
 *   radius.html            accent fixed, --radius-element 6 / 10 / 14
 *   type.html              accent fixed, three font stacks
 *
 * Same rendering path as agent/render.mjs: React SSR (renderToStaticMarkup)
 * plus inlined reset.css / astryx.css / generated theme CSS. No <script>,
 * no external links, double-click to open.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Theme, generateThemeCSS } from '@astryxdesign/core';
import {
  Badge,
  Button,
  Card,
  CheckboxInput,
  Divider,
  Heading,
  HStack,
  Link,
  ProgressBar,
  RadioList,
  RadioListItem,
  SegmentedControl,
  SegmentedControlItem,
  Slider,
  Switch,
  Table,
  Text,
  TextInput,
  VStack,
  proportional,
} from '@astryxdesign/core';
import { defineTheme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { garyTheme, GARY_TOKEN_OVERRIDES } from '../theme/gary.theme.mjs';

const LAYER_ORDER = '@layer reset, astryx-base, astryx-theme;';
const OUT_DIR = path.resolve('out/specimen');

/* ------------------------------------------------------------------ themes */

/** Theme with Gary's tokens, optionally overriding a few. */
function makeTheme(name, overrides = {}) {
  return defineTheme({
    name,
    extends: neutralTheme,
    tokens: { ...GARY_TOKEN_OVERRIDES, ...overrides },
  });
}

const ACCENTS = [
  { key: 'A', name: '近黑', accent: '#1b1b1b', muted: '#e5e5e5' },
  { key: 'B', name: '墨绿', accent: '#24514a', muted: '#dde8e4' },
  { key: 'C', name: '砖赭', accent: '#8a4a30', muted: '#efe2db' },
  { key: 'D', name: '石板蓝', accent: '#35485c', muted: '#dde4ec' },
];

const FONT_1 = '"Helvetica Neue", Helvetica, "Microsoft YaHei", Arial, sans-serif';
const FONT_2 = 'system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif';
const FONT_3_HEADING = 'Georgia, "Songti SC", "SimSun", serif';

/* --------------------------------------------------------------------- css */

function resolveCss(pkgExport) {
  return fileURLToPath(import.meta.resolve(pkgExport));
}

function safeCss(css) {
  return css.replace(/<\/style/gi, '<\\/style');
}

function themeBlock(theme) {
  const { component, prose } = generateThemeCSS(theme);
  const parts = [];
  if (component) parts.push(`@layer astryx-theme {\n${component}\n}`);
  if (prose) parts.push(`@layer reset {\n${prose}\n}`);
  return parts.join('\n');
}

function inlineCss(themes) {
  const reset = fs.readFileSync(resolveCss('@astryxdesign/core/reset.css'), 'utf8');
  const astryx = fs.readFileSync(resolveCss('@astryxdesign/core/astryx.css'), 'utf8');
  return [
    LAYER_ORDER,
    safeCss(reset),
    safeCss(astryx),
    ...themes.map((t) => safeCss(themeBlock(t))),
    LAYOUT_CSS,
  ].join('\n');
}

const LAYOUT_CSS = `
body { margin: 0; background: var(--color-background-body); color: var(--color-text-primary); }
*, *::before, *::after { box-sizing: border-box; }
.spec-shell { max-width: 1240px; margin: 0 auto; padding: 24px 30px 36px; }
.spec-kicker { display: inline-flex; align-items: center; gap: 8px; padding: 3px 10px 3px 4px;
  border-radius: var(--radius-full); background: var(--color-accent-muted); color: var(--color-text-primary);
  font: 600 12px/1.4 var(--font-family-body); letter-spacing: 0.02em; }
.spec-chip { width: 14px; height: 14px; border-radius: var(--radius-full); background: var(--color-accent);
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 12%); }
.spec-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; align-items: start; }
.spec-panel { min-width: 0; }
.spec-note { font: 400 11px/1.5 var(--font-family-body); color: var(--color-text-secondary); }
.spec-swatch { display: inline-flex; align-items: center; gap: 6px; font: 500 11px/1 var(--font-family-body); }
.spec-swatch i { display: inline-block; width: 26px; height: 12px; border-radius: 3px;
  box-shadow: inset 0 0 0 1px oklch(0 0 0 / 14%); }
.spec-col { min-width: 0; }
.spec-col-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
`;

/* ------------------------------------------------------------------- atoms */

function Panel({ title, sub, note, children }) {
  return h(
    Card,
    { padding: 4, width: '100%' },
    h(
      VStack,
      { gap: 3 },
      h(
        VStack,
        { gap: 1 },
        h(Heading, { level: 3 }, title),
        sub && h(Text, { type: 'supporting', size: 'sm' }, sub)
      ),
      children,
      note && h('div', { className: 'spec-note' }, note)
    )
  );
}

function Swatches({ accent, muted }) {
  return h(
    HStack,
    { gap: 4, wrap: 'wrap' },
    h(
      'span',
      { className: 'spec-swatch' },
      h('i', { style: { background: accent } }),
      `accent ${accent}`
    ),
    h(
      'span',
      { className: 'spec-swatch' },
      h('i', { style: { background: muted } }),
      `muted ${muted}`
    )
  );
}

/** The accent-critical control set. Every control here consumes accent. */
function SpecimenBody() {
  return h(
    'div',
    { className: 'spec-grid' },
    // 1 · buttons
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        {
          title: '按钮',
          sub: 'primary / secondary / ghost / destructive',
          note: 'hover：primary、secondary 叠 15% 深色 tint，ghost 落到 accent-muted；键盘 focus 环取 accent。destructive 固定语义红，不随 accent 变。',
        },
        h(
          HStack,
          { gap: 2, wrap: 'wrap' },
          h(Button, { label: '主要操作', variant: 'primary' }),
          h(Button, { label: '次要操作', variant: 'secondary' }),
          h(Button, { label: '幽灵按钮', variant: 'ghost' }),
          h(Button, { label: '删除', variant: 'destructive' })
        ),
        h(
          HStack,
          { gap: 2, wrap: 'wrap' },
          h(Button, { label: '小', variant: 'primary', size: 'sm' }),
          h(Button, { label: '中', variant: 'primary', size: 'md' }),
          h(Button, { label: '大', variant: 'primary', size: 'lg' })
        )
      )
    ),
    // 2 · selection controls
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        { title: '选中态控件', sub: '开关 / 复选框 / 单选组' },
        h(
          HStack,
          { gap: 4, wrap: 'wrap', align: 'start' },
          h(Switch, { label: '启用（开）', value: true, onChange: () => {} }),
          h(Switch, { label: '停用（关）', value: false, onChange: () => {} })
        ),
        h(
          HStack,
          { gap: 4, wrap: 'wrap', align: 'start' },
          h(CheckboxInput, { label: '已选', value: true, onChange: () => {} }),
          h(CheckboxInput, { label: '未选', value: false, onChange: () => {} })
        ),
        h(
          RadioList,
          { label: '计费周期', value: 'month', onChange: () => {}, orientation: 'horizontal' },
          h(RadioListItem, { label: '按月', value: 'month' }),
          h(RadioListItem, { label: '按季', value: 'quarter' }),
          h(RadioListItem, { label: '按年', value: 'year' })
        )
      )
    ),
    // 3 · inputs
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        { title: '输入框', sub: '默认态 / 聚焦环（第二行自动聚焦）', note: '聚焦环 = accent 边框 + accent-muted 内阴影；光标色也是 accent。' },
        h(TextInput, {
          label: '项目名称',
          value: 'Gary-UI 重建',
          onChange: () => {},
        }),
        h(TextInput, {
          label: '聚焦态（自动聚焦）',
          value: '正在编辑…',
          onChange: () => {},
          hasAutoFocus: true,
        })
      )
    ),
    // 4 · badges
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        { title: '徽标四语义', sub: 'info / success / warning / error', note: '语义色取自主题的 status 色，刻意不跟 accent 走。' },
        h(
          HStack,
          { gap: 2, wrap: 'wrap' },
          h(Badge, { variant: 'info', label: '信息' }),
          h(Badge, { variant: 'success', label: '成功' }),
          h(Badge, { variant: 'warning', label: '警告' }),
          h(Badge, { variant: 'error', label: '错误' }),
          h(Badge, { variant: 'neutral', label: '中性' })
        ),
        h(Divider, { variant: 'subtle' }),
        h(
          HStack,
          { gap: 2, wrap: 'wrap' },
          h(Badge, { variant: 'neutral', label: 'accent 底' }),
          h(Text, { type: 'supporting', size: 'sm' }, '↑ 徽标不参与 accent')
        )
      )
    ),
    // 5 · selected bar / progress / slider
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        { title: '选中态与进度', sub: '分段控件 / 进度条 / 滑杆' },
        h(
          SegmentedControl,
          { value: 'overview', onChange: () => {}, label: '视图' },
          h(SegmentedControlItem, { value: 'overview', label: '概览' }),
          h(SegmentedControlItem, { value: 'detail', label: '明细' }),
          h(SegmentedControlItem, { value: 'chart', label: '图表' })
        ),
        h(
          'div',
          { className: 'spec-note' },
          '实测：分段控件的选中块是中性色（白底 + 文字），不吃 accent；选中态的主色证据看左边的单选组与复选框。'
        ),
        h(ProgressBar, { label: '迁移进度', value: 62, hasValueLabel: true, variant: 'accent' }),
        h(Slider, { label: '圆角强度', value: 42, onChange: () => {} })
      )
    ),
    // 6 · link + KPI
    h(
      'div',
      { className: 'spec-panel' },
      h(
        Panel,
        { title: '链接与 KPI', sub: '行内链接 / 报告页 KPI 卡复现' },
        h(
          HStack,
          { gap: 3, wrap: 'wrap', vAlign: 'center' },
          h(Link, { href: '#', children: '默认链接' }),
          h(Link, { href: '#', hasUnderline: true, children: '带下划线' }),
          h(Link, { href: '#', color: 'accent', children: 'accent 链接' })
        ),
        h(
          'div',
          { className: 'spec-note' },
          '实测（这是要拍板前知道的一件事）：--color-accent 不带动派生 token。三档文字链接在四份里全是 #1b1b1b，因为 --color-text-accent / --color-icon-accent / --color-on-accent 取自主题基底，不跟 accent 覆盖走。'
        ),
        h(
          Card,
          { padding: 4, elevation: 'low', width: '232px' },
          h(
            VStack,
            { gap: 1 },
            h(Text, { type: 'supporting', size: 'sm' }, '全国住宅样本'),
            h(
              HStack,
              { gap: 1, vAlign: 'end' },
              h(Text, { size: '2xl', weight: 'medium', hasTabularNumbers: true }, '12,480'),
              h(Text, { type: 'supporting' }, '套')
            ),
            h(
              HStack,
              { gap: 1, vAlign: 'center' },
              h(Text, { type: 'supporting', size: 'sm', weight: 'medium' }, '↑'),
              h(Text, { type: 'supporting', size: 'sm' }, '较上月 +8.2%')
            )
          )
        )
      )
    )
  );
}

function PageHeader({ kicker, title, sub, accent, muted }) {
  return h(
    VStack,
    { gap: 2 },
    h('span', { className: 'spec-kicker' }, h('i', { className: 'spec-chip' }), kicker),
    h(Heading, { level: 1 }, title),
    h(Text, { type: 'supporting' }, sub),
    accent && h(Swatches, { accent, muted })
  );
}

/* -------------------------------------------------------------- html shell */

function renderPage({ htmlTheme, title, themes, body }) {
  const bodyHtml = renderToStaticMarkup(body);
  const html = `<!doctype html>
<html lang="zh-CN" data-astryx-theme="${htmlTheme}" data-theme="light">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
${inlineCss(themes)}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>
`;
  return html;
}

/* --------------------------------------------------------------- specimen */

function buildSpecimen(variant) {
  // One theme per page, so the theme keeps the canonical name `gary` — the
  // selfcheck asserts data-astryx-theme="gary" exactly.
  const themeName = 'gary';
  const theme = makeTheme(themeName, {
    '--color-accent': [variant.accent, '#f1f1f1'],
    '--color-accent-muted': [variant.muted, '#333333'],
  });

  const body = h(
    Theme,
    { theme, mode: 'light' },
    h(
      'div',
      { className: 'spec-shell' },
      h(PageHeader, {
        kicker: `${variant.key} · ${variant.name} ${variant.accent}`,
        title: 'Gary-UI 组件标本 · 主色四选一',
        sub: '同一份控件标本，只换 --color-accent / --color-accent-muted。看主按钮、选中态、聚焦环、链接、进度与 KPI 的差别。',
        accent: variant.accent,
        muted: variant.muted,
      }),
      h('div', { style: { height: '18px' } }),
      h(SpecimenBody)
    )
  );

  return {
    file: `specimen-${variant.key}.html`,
    html: renderPage({ htmlTheme: themeName, title: `组件标本 ${variant.key} · ${variant.name}`, themes: [theme], body }),
  };
}

/* ----------------------------------------------------------------- radius */

function radiusColumn(value) {
  const name = `gary-r${value}`;
  const theme = makeTheme(name, {
    '--radius-element': `${value}px`,
    '--radius-container': `${value + 2}px`,
  });
  const body = h(
    Theme,
    { theme, mode: 'light' },
    h(
      VStack,
      { gap: 3 },
      h(
        'div',
        { className: 'spec-col-head' },
        h(Text, { weight: 'semibold' }, `--radius-element: ${value}px`)
      ),
      h(Text, { type: 'supporting', size: 'sm' }, `卡片 --radius-container: ${value + 2}px`),
      h(
        HStack,
        { gap: 2, wrap: 'wrap' },
        h(Button, { label: '主要操作', variant: 'primary' }),
        h(Button, { label: '次要', variant: 'secondary' }),
        h(Button, { label: '幽灵', variant: 'ghost' })
      ),
      h(
        Card,
        { padding: 4, width: '100%' },
        h(
          VStack,
          { gap: 2 },
          h(Heading, { level: 3 }, '卡片圆角'),
          h(Text, { type: 'supporting', size: 'sm' }, '卡片用 --radius-container，按钮用 --radius-element。两档同时调，才能看出差别。'),
          h(TextInput, { label: '输入框', value: '示例值', onChange: () => {} })
        )
      ),
      h(
        SegmentedControl,
        { value: 'b', onChange: () => {}, label: '分段控件' },
        h(SegmentedControlItem, { value: 'a', label: '甲' }),
        h(SegmentedControlItem, { value: 'b', label: '乙' }),
        h(SegmentedControlItem, { value: 'c', label: '丙' })
      )
    )
  );
  return { theme, body };
}

function buildRadius() {
  const cols = [6, 10, 14].map(radiusColumn);
  const baseThemeName = 'gary';
  const body = h(
    Theme,
    { theme: garyTheme, mode: 'light' },
    h(
      'div',
      { className: 'spec-shell' },
      h(PageHeader, {
        kicker: 'R · 圆角三档',
        title: '圆角：6 / 10 / 14',
        sub: '同一份控件，三列并排；--radius-element 为按钮/输入框/分段控件，--radius-container 同步 +2px 给卡片。',
      }),
      h('div', { style: { height: '16px' } }),
      h(
        'div',
        { className: 'spec-grid' },
        cols.map((c, i) => h('div', { key: i, className: 'spec-col' }, c.body))
      )
    )
  );
  return {
    file: 'radius.html',
    html: renderPage({
      htmlTheme: baseThemeName,
      title: '圆角三档 · 6 / 10 / 14',
      themes: [garyTheme, ...cols.map((c) => c.theme)],
      body,
    }),
  };
}

/* ------------------------------------------------------------------- type */

const NUM_ROWS = [
  { id: 'r1', city: '上海', n: '3,412' },
  { id: 'r2', city: '杭州', n: '2,058' },
  { id: 'r3', city: '南京', n: '1,764' },
];

function typeColumn({ name, headingFont, bodyFont }) {
  const theme = makeTheme(name, {
    '--font-family-heading': headingFont,
    '--font-family-body': bodyFont,
  });
  const body = h(
    Theme,
    { theme, mode: 'light' },
    h(
      VStack,
      { gap: 3 },
      h(Text, { type: 'supporting', size: 'sm' }, name.toUpperCase()),
      h(Heading, { level: 2 }, '全国住宅数据底座'),
      h(
        Text,
        { type: 'body', display: 'block' },
        '上海 2026 年三批次住宅公示已入库，字段补齐率 96.4%。总平面图筛查覆盖 7 城，缺失项集中在外环新城的配套公建。'
      ),
      // Latin/digit line: the only place 1 vs 2 actually differ (CJK falls back
      // to YaHei in both stacks).
      h(Text, { type: 'body', hasTabularNumbers: true }, 'ArchPOP 2026 · Aa Gg Qq 0123456789'),
      h(Table, {
        data: NUM_ROWS,
        columns: [
          { key: 'city', header: '城市', width: proportional(2) },
          {
            key: 'n',
            header: '样本套数',
            align: 'end',
            width: proportional(2),
            renderCell: (r) => h(Text, { hasTabularNumbers: true, justify: 'end' }, r.n),
          },
        ],
        idKey: 'id',
        density: 'compact',
        dividers: 'rows',
      })
    )
  );
  return { theme, body };
}

function buildType() {
  const cols = [
    typeColumn({ name: '1 · 当前 Helvetica', headingFont: FONT_1, bodyFont: FONT_1 }),
    typeColumn({ name: '2 · 系统栈', headingFont: FONT_2, bodyFont: FONT_2 }),
    typeColumn({ name: '3 · 标题衬线', headingFont: FONT_3_HEADING, bodyFont: FONT_2 }),
  ];
  const body = h(
    Theme,
    { theme: garyTheme, mode: 'light' },
    h(
      'div',
      { className: 'spec-shell' },
      h(PageHeader, {
        kicker: 'T · 字体三档',
        title: '字体：Helvetica / 系统栈 / 标题衬线',
        sub: '同一段中文正文 + 同一张数字表，三列并排比较字重、字面与数字对齐。',
      }),
      h('div', { style: { height: '16px' } }),
      h(
        'div',
        { className: 'spec-grid' },
        cols.map((c, i) => h('div', { key: i, className: 'spec-col' }, c.body))
      )
    )
  );
  return {
    file: 'type.html',
    html: renderPage({
      htmlTheme: 'gary',
      title: '字体三档',
      themes: [garyTheme, ...cols.map((c) => c.theme)],
      body,
    }),
  };
}

/* ------------------------------------------------------------------- main */

fs.mkdirSync(OUT_DIR, { recursive: true });

const outputs = [
  ...ACCENTS.map(buildSpecimen),
  buildRadius(),
  buildType(),
];

for (const o of outputs) {
  const file = path.join(OUT_DIR, o.file);
  fs.writeFileSync(file, o.html, 'utf8');
  console.log(`WROTE ${file} bytes=${Buffer.byteLength(o.html)}`);
}
console.log(`\n${outputs.length} pages in ${OUT_DIR}`);
