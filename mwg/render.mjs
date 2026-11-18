/**
 * Gary-UI MWG Renderer · 纯原生 HTML/CSS 编译器（零脚本单文件）
 *
 *   node mwg/render.mjs <content.json> -o <out.html> [--theme light|dark]
 *
 * 输入：content.json 契约（支持全部 18 类基础区块 + chart 7 类 + flow 3 类）
 * 输出：零 <script>、零外部链接、零 Astryx CSS 依赖的轻量单文件 HTML
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChartBlock } from '../viz/charts.mjs';
import { FlowBlock } from '../viz/flow.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HTML 转义
function esc(s) {
  if (s === undefined || s === null) return '';
  // 对象进 esc() 会变成 "[object Object]" 写进交付物（D13）。宁可空串 + 告警，
  // 也不许脏数据出厂；带字段位置的告警由 stringList() 负责，这里是最后一道网。
  if (typeof s === 'object' || typeof s === 'function') {
    console.warn(`[mwg] esc() 收到 ${Array.isArray(s) ? 'array' : typeof s}，已输出空串（该字段应为字符串）`);
    return '';
  }
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 解析表面材质 tone（sunken / inverse）
const SURFACE_TONES = new Set(['sunken', 'inverse']);
function surfaceToneOf(props, block) {
  const raw = String((block && block.tone) || (props && props.tone) || '').toLowerCase();
  return SURFACE_TONES.has(raw) ? raw : '';
}
function toneAttrOf(props, block) {
  const t = surfaceToneOf(props, block);
  return t ? ` data-tone="${t}"` : '';
}

// 本地图片转 base64 data URI（确保单文件离线可打开）
function toDataUri(src, basePath) {
  if (!src) return '';
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  const candidates = path.isAbsolute(src)
    ? [src]
    : [path.resolve(process.cwd(), src), path.resolve(basePath, src)];
  const fullPath = candidates.find((p) => fs.existsSync(p));
  if (!fullPath) {
    return src;
  }
  const ext = path.extname(fullPath).toLowerCase();
  const mimeMap = {
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  const mime = mimeMap[ext] || 'application/octet-stream';
  const data = fs.readFileSync(fullPath).toString('base64');
  return `data:${mime};base64,${data}`;
}

// trend 图标映射
const TREND_ICON = {
  up: '↑',
  down: '↓',
  flat: '–',
};

// callout 语义别名规范化
const CALLOUT_TONE_MAP = {
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

// 块定位串（报错与告警统一口径）："第 3 块（blocks[2]）"
const atOf = (ctx) => (ctx && ctx.at) || '区块';

/**
 * paras / body 只接受非空字符串。对象或 null 经 esc() 会变成 "[object Object]"
 * 写进交付物（D13）；这里统一过滤 + 报警，告警带块定位与字段下标。
 */
function stringList(list, where) {
  if (!Array.isArray(list)) return [];
  return list.filter((v, j) => {
    if (typeof v === 'string' && v.trim() !== '') return true;
    const kind = v === null ? 'null' : typeof v === 'string' ? '空串' : Array.isArray(v) ? 'array' : typeof v;
    console.warn(`[mwg] ${where}[${j}] 不是非空字符串（${kind}），已跳过`);
    return false;
  });
}

// badge.variant 白名单，与 agent/checks/content.mjs 一致（6 档）。其余值按 neutral
// 渲染并报警：以前任意值直出 class，白名单外的一律渲染成没颜色的白块且不报错。
const BADGE_VARIANTS = new Set(['neutral', 'accent', 'info', 'success', 'warning', 'error']);
function badgeVariant(v, where) {
  const raw = String(v || 'neutral').toLowerCase();
  if (BADGE_VARIANTS.has(raw)) return raw;
  console.warn(`[mwg] ${where} 非法 variant="${v}"，按 neutral 渲染（可用: ${[...BADGE_VARIANTS].join(', ')}）`);
  return 'neutral';
}

/**
 * trendTone：方向 ≠ 好坏（退货率上涨是坏消息，染绿是报假消息）。trend 只管箭头，
 * trendTone 管颜色：good → 绿、bad → 红；不给就只按方向出中性色（CSS 里 up/down/flat 已中性）。
 */
function trendToneClass(v, where) {
  const raw = String(v || '').toLowerCase();
  if (!raw) return '';
  if (raw === 'good' || raw === 'bad') return ` g-metric__trend--${raw}`;
  console.warn(`[mwg] ${where} 非法 trendTone="${v}"，只按方向出中性色（可用: good, bad）`);
  return '';
}

/**
 * 缺 type 的块：以前 `if (!block.type) return ''` 让它从页面上蒸发，日志仍打印
 * blocks=3，用户既看不见日志也看不见缺块（D10）。现在不抛（整页仍可交付），
 * 但 stderr 报警 + 产物里画一块可见的红色告警，占住它本该在的位置。
 */
function blockAlert(at, msg, detail) {
  return `
      <aside class="g-callout g-callout--error" data-block-alert="1">
        <div class="g-callout__title">${esc(at)}${esc(msg)}</div>
        <div class="g-callout__body">${esc(detail)}</div>
      </aside>
    `;
}

// ═══════════════════════════════════════════════════════════
// Block 渲染器映射表（18 类文本区块 + chart + flow）
// ═══════════════════════════════════════════════════════════
const BLOCK_RENDERERS = {
  heading(props, block) {
    // heading.level 口径（两轨统一，2026-11-19）：缺省 2，钳到 1–6。
    // 此前三口径打架：文档默认 1、MWG 默认 2、Astryx 恒 h1。Astryx 侧
    // agent/recipes/sections.mjs 的 headingLevel() 用同一个表达式，改这里要同步改那里。
    const level = Math.min(Math.max(Number(props.level) || 2, 1), 6);
    const tag = `h${level}`;
    const eyebrow = props.eyebrow ? `<div class="g-heading__eyebrow">${esc(props.eyebrow)}</div>` : '';
    const badge = props.badge ? `<span class="g-heading__badge">${esc(props.badge)}</span>` : '';
    const sub = props.sub ? `<p class="g-heading__sub">${esc(props.sub)}</p>` : '';
    // 无 toolbar：零脚本产物里不能有 input/button，见 selfcheck 的「零死控件」。

    return `
      <section class="g-heading" id="${esc(block.id || '')}">
        ${eyebrow}
        <div class="g-heading__title-wrap">
          <${tag} class="g-heading__title">${esc(props.title || '')}</${tag}>
          ${badge}
        </div>
        ${sub}
      </section>
    `;
  },

  header(props, block) {
    return BLOCK_RENDERERS.heading(props, block);
  },

  cover(props, block) {
    const eyebrow = props.eyebrow ? `<div class="g-cover__eyebrow">${esc(props.eyebrow)}</div>` : '';
    const badge = props.badge ? `<span class="g-heading__badge">${esc(props.badge)}</span>` : '';
    const sub = props.sub ? `<p class="g-cover__sub">${esc(props.sub)}</p>` : '';
    const metaList = Array.isArray(props.meta) && props.meta.length ? `
      <div class="g-cover__meta-grid">
        ${props.meta.map((m) => `
          <div class="g-cover__meta-item">
            <span class="g-cover__meta-k">${esc(m.k)}</span>
            <span class="g-cover__meta-v">${esc(m.v)}</span>
          </div>
        `).join('')}
      </div>
    ` : '';

    return `
      <header class="g-cover" id="${esc(block.id || '')}">
        <div class="g-heading__title-wrap">${eyebrow}${badge}</div>
        <h1 class="g-cover__title">${esc(props.title || '')}</h1>
        ${sub}
        ${metaList}
      </header>
    `;
  },

  text(props, block, ctx) {
    const toneAttr = toneAttrOf(props, block);
    const paras = stringList(props.paras, `${atOf(ctx)}.paras`).map((p) => `<p>${esc(p)}</p>`).join('');
    const note = props.note ? `<div class="g-text__note">${esc(props.note)}</div>` : '';
    return `
      <div class="g-card g-text"${toneAttr} id="${esc(block.id || '')}">
        ${paras}
        ${note}
      </div>
    `;
  },

  prose(props, block, ctx) {
    const toneAttr = toneAttrOf(props, block);
    const items = Array.isArray(props.items) ? props.items.map((item, i) => `
      <section class="g-prose__section">
        ${item.title ? `<h3 class="g-prose__section-title">${esc(item.title)}</h3>` : ''}
        ${stringList(item.paras, `${atOf(ctx)}.items[${i}].paras`).map((p) => `<p>${esc(p)}</p>`).join('')}
      </section>
    `).join('') : '';

    return `
      <div class="g-card g-prose"${toneAttr} id="${esc(block.id || '')}">
        ${items}
      </div>
    `;
  },

  metric(props, block, ctx) {
    const header = (props.title || props.note) ? `
      <div class="g-metric-header">
        ${props.title ? `<h3 class="g-metric-header__title">${esc(props.title)}</h3>` : ''}
        ${props.note ? `<span class="g-metric-header__note">${esc(props.note)}</span>` : ''}
      </div>
    ` : '';

    const items = Array.isArray(props.items) ? props.items.map((item, i) => {
      const toneClass = trendToneClass(item.trendTone, `${atOf(ctx)}.items[${i}].trendTone`);
      const trend = item.trend && TREND_ICON[item.trend] ? `
        <span class="g-metric__trend g-metric__trend--${esc(item.trend)}${toneClass}">
          ${TREND_ICON[item.trend]} ${esc(item.hint || '')}
        </span>
      ` : (item.hint ? `<span class="g-metric__hint">${esc(item.hint)}</span>` : '');

      return `
        <article class="g-metric__card">
          <div class="g-metric__label">${esc(item.label || '')}</div>
          <div class="g-metric__val-wrap">
            <span class="g-metric__value">${esc(item.value ?? '')}</span>
            ${item.unit ? `<span class="g-metric__unit">${esc(item.unit)}</span>` : ''}
          </div>
          ${trend}
        </article>
      `;
    }).join('') : '';

    return `
      <div class="g-metric-wrapper" id="${esc(block.id || '')}">
        ${header}
        <div class="g-metric-grid">
          ${items}
        </div>
      </div>
    `;
  },

  card(props, block, ctx) {
    const toneAttr = toneAttrOf(props, block);
    const eyebrow = props.eyebrow ? `<div class="g-card-block__eyebrow">${esc(props.eyebrow)}</div>` : '';
    const badge = props.badge ? `<span class="g-badge">${esc(props.badge)}</span>` : '';
    const title = props.title ? `<h3 class="g-card-block__title">${esc(props.title)}</h3>` : '';
    const sub = props.sub ? `<p class="g-card-block__sub">${esc(props.sub)}</p>` : '';
    const body = stringList(props.body, `${atOf(ctx)}.body`).map((p) => `<p>${esc(p)}</p>`).join('');
    const note = props.note ? `<div class="g-text__note">${esc(props.note)}</div>` : '';

    return `
      <div class="g-card g-card-block"${toneAttr} id="${esc(block.id || '')}">
        ${(eyebrow || badge) ? `<div class="g-heading__title-wrap" style="justify-content:space-between">${eyebrow}${badge}</div>` : ''}
        ${title}
        ${sub}
        ${body}
        ${note}
      </div>
    `;
  },

  table(props, block) {
    const toneAttr = toneAttrOf(props, block);
    const title = props.title ? `<div class="g-table-title">${esc(props.title)}</div>` : '';
    const cols = Array.isArray(props.columns) ? props.columns : [];

    const ths = cols.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`).join('');
    const trs = Array.isArray(props.rows) ? props.rows.map((row) => `
      <tr>
        ${row.map((cell, i) => `<td class="${cols[i]?.num ? 'num' : ''}">${esc(cell)}</td>`).join('')}
      </tr>
    `).join('') : '';

    const tfoot = (Array.isArray(props.foot) && props.foot.length) ? `
      <tfoot>
        <tr>
          ${props.foot.map((cell, i) => `<td class="${cols[i]?.num ? 'num' : ''}">${esc(cell)}</td>`).join('')}
        </tr>
      </tfoot>
    ` : '';

    const note = props.note ? `<div class="g-table-note">${esc(props.note)}</div>` : '';

    return `
      <div class="g-card g-table-wrap"${toneAttr} id="${esc(block.id || '')}">
        ${title}
        <div class="g-table-scroll">
          <table class="g-table">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
            ${tfoot}
          </table>
        </div>
        ${note}
      </div>
    `;
  },

  callout(props, block) {
    const surface = surfaceToneOf(props, block);
    const eyebrow = props.eyebrow ? `<div class="g-callout__eyebrow">${esc(props.eyebrow)}</div>` : '';
    const title = props.title ? `<div class="g-callout__title">${esc(props.title)}</div>` : '';
    const bodyText = props.body ?? props.text;
    const body = bodyText ? `<div class="g-callout__body">${esc(bodyText)}</div>` : '';

    if (surface) {
      return `
        <aside class="g-card g-card-block" data-tone="${surface}" id="${esc(block.id || '')}">
          ${eyebrow}
          ${title ? `<h3 class="g-card-block__title">${esc(props.title)}</h3>` : ''}
          ${bodyText ? `<p>${esc(bodyText)}</p>` : ''}
        </aside>
      `;
    }

    const rawTone = String(props.tone || 'info').toLowerCase();
    const tone = CALLOUT_TONE_MAP[rawTone] || 'info';
    return `
      <aside class="g-callout g-callout--${esc(tone)}" id="${esc(block.id || '')}">
        ${eyebrow}
        ${title}
        ${body}
      </aside>
    `;
  },

  divider(props, block) {
    if (props.label) {
      return `<div class="g-divider g-divider--label" id="${esc(block.id || '')}">${esc(props.label)}</div>`;
    }
    return `<hr class="g-divider" id="${esc(block.id || '')}">`;
  },

  badge(props, block, ctx) {
    const items = Array.isArray(props.items) ? props.items.map((b, i) => `
      <span class="g-badge g-badge--${esc(badgeVariant(b.variant, `${atOf(ctx)}.items[${i}].variant`))}">
        ${b.dot ? `<span class="g-badge__dot"></span>` : ''}
        ${esc(b.label || '')}
      </span>
    `).join('') : '';

    return `
      <div class="g-badge-row" id="${esc(block.id || '')}">
        ${items}
      </div>
    `;
  },

  timeline(props, block) {
    const toneAttr = toneAttrOf(props, block);
    const title = props.title ? `<h3 class="g-timeline__title">${esc(props.title)}</h3>` : '';
    const items = Array.isArray(props.items) ? props.items.map((item) => `
      <div class="g-timeline__item">
        <time class="g-timeline__date">${esc(item.date || '')}</time>
        <div class="g-timeline__axis">
          <div class="g-timeline__dot g-timeline__dot--${esc(item.tone || 'accent')}"></div>
          <div class="g-timeline__line"></div>
        </div>
        <div class="g-timeline__content">
          <div class="g-timeline__content-title">${esc(item.title || '')}</div>
          ${item.text ? `<p class="g-timeline__content-text">${esc(item.text)}</p>` : ''}
        </div>
      </div>
    `).join('') : '';

    return `
      <div class="g-card g-timeline"${toneAttr} id="${esc(block.id || '')}">
        ${title}
        ${items}
      </div>
    `;
  },

  matrix(props, block) {
    const toneAttr = toneAttrOf(props, block);
    const title = props.title ? `<div class="g-table-title">${esc(props.title)}</div>` : '';
    const cols = Array.isArray(props.columns) ? props.columns : [];

    const ths = [
      `<th>${esc(props.labelHeader || '项目')}</th>`,
      ...cols.map((c) => `<th class="${c.num ? 'num' : ''}">${esc(c.label)}</th>`)
    ].join('');

    const trs = Array.isArray(props.rows) ? props.rows.map((row) => {
      const tds = cols.map((c) => {
        const cell = row.cells ? row.cells[c.key] : '';
        let val = cell;
        let stateClass = '';
        if (cell && typeof cell === 'object') {
          val = cell.value ?? '';
          if (cell.state) stateClass = ` g-matrix__cell--${esc(cell.state)}`;
        }
        return `<td class="${c.num ? 'num' : ''}${stateClass}">${esc(val)}</td>`;
      }).join('');

      return `<tr><td><strong>${esc(row.label || '')}</strong></td>${tds}</tr>`;
    }).join('') : '';

    const note = props.note ? `<div class="g-table-note">${esc(props.note)}</div>` : '';

    return `
      <div class="g-card g-matrix-wrap"${toneAttr} id="${esc(block.id || '')}">
        ${title}
        <div class="g-table-scroll">
          <table class="g-table">
            <thead><tr>${ths}</tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>
        ${note}
      </div>
    `;
  },

  scorecard(props, block) {
    const toneAttr = toneAttrOf(props, block);
    const title = props.title ? `<h3 class="g-scorecard__title">${esc(props.title)}</h3>` : '';
    const items = Array.isArray(props.items) ? props.items.map((item) => {
      const max = Number(item.max) || 100;
      const score = Number(item.score) || 0;
      const pct = Math.min(Math.max(Math.round((score / max) * 100), 0), 100);
      const stateClass = item.state ? ` g-scorecard__bar--${esc(item.state)}` : '';

      return `
        <div class="g-scorecard__row">
          <span class="g-scorecard__label">${esc(item.label || '')}</span>
          <div class="g-scorecard__track">
            <div class="g-scorecard__bar${stateClass}" style="inline-size: ${pct}%;"></div>
          </div>
          <span class="g-scorecard__score">${esc(item.score ?? '')}</span>
        </div>
      `;
    }).join('') : '';
    const note = props.note ? `<div class="g-text__note">${esc(props.note)}</div>` : '';

    return `
      <div class="g-card g-scorecard"${toneAttr} id="${esc(block.id || '')}">
        ${title}
        ${items}
        ${note}
      </div>
    `;
  },

  steps(props, block) {
    const toneAttr = toneAttrOf(props, block);
    const title = props.title ? `<h3 class="g-steps__title">${esc(props.title)}</h3>` : '';
    const active = Number.isFinite(Number(props.active)) ? Number(props.active) : 1;

    const items = Array.isArray(props.items) ? props.items.map((item, i) => {
      let statusClass = '';
      if (i === active) statusClass = ' g-steps__item--active';
      else if (i < active) statusClass = ' g-steps__item--done';

      return `
        <li class="g-steps__item${statusClass}">
          <div class="g-steps__circle">${i + 1}</div>
          <div class="g-steps__item-title">${esc(item.title || '')}</div>
          ${item.text ? `<div class="g-steps__item-text">${esc(item.text)}</div>` : ''}
        </li>
      `;
    }).join('') : '';
    const note = props.note ? `<div class="g-text__note">${esc(props.note)}</div>` : '';

    return `
      <div class="g-card g-steps"${toneAttr} id="${esc(block.id || '')}">
        ${title}
        <ol class="g-steps__list">${items}</ol>
        ${note}
      </div>
    `;
  },

  quote(props, block) {
    const eyebrow = props.eyebrow ? `<div class="g-callout__eyebrow">${esc(props.eyebrow)}</div>` : '';
    const text = props.text ? `<p class="g-quote__text">“${esc(props.text)}”</p>` : '';
    const source = props.source ? `<cite class="g-quote__source">— ${esc(props.source)}</cite>` : '';

    return `
      <blockquote class="g-quote" id="${esc(block.id || '')}">
        ${eyebrow}
        ${text}
        ${source}
      </blockquote>
    `;
  },

  grid(props, block, ctx) {
    const cols = Number(props.cols) || 2;
    const children = Array.isArray(props.children) ? props.children.map((c, i) => `
      <div class="g-grid__cell">
        ${renderBlock(c, ctx, `${atOf(ctx)}.children[${i}]`)}
      </div>
    `).join('') : '';

    return `
      <div class="g-grid" data-cols="${cols}" id="${esc(block.id || '')}">
        ${children}
      </div>
    `;
  },

  image(props, block, ctx) {
    const toneAttr = toneAttrOf(props, block);
    const src = toDataUri(props.src, ctx.basePath);
    const caption = props.caption ? `<figcaption class="g-image__caption">${esc(props.caption)}</figcaption>` : '';

    return `
      <figure class="g-card g-image"${toneAttr} id="${esc(block.id || '')}">
        <img src="${src}" alt="${esc(props.alt || '')}" class="g-image__img" loading="lazy">
        ${caption}
      </figure>
    `;
  },

  device(props, block, ctx) {
    const kind = props.kind === 'laptop' ? 'laptop' : 'phone';
    const src = toDataUri(props.src, ctx.basePath);
    const caption = props.caption ? `<p class="g-device__caption">${esc(props.caption)}</p>` : '';

    return `
      <div class="g-device g-device--${kind}" id="${esc(block.id || '')}">
        <div class="g-device__screen">
          <img src="${src}" alt="${esc(props.alt || '')}">
        </div>
        ${caption}
      </div>
    `;
  },

  chart(props, block) {
    const markup = renderToStaticMarkup(h(ChartBlock, { id: block.id, ...props }));
    const cls = props.chart === 'sparkline' ? 'g-viz-wrap g-viz-wrap--tile' : 'g-viz-wrap';
    return `<div class="${cls}" id="${esc(block.id || '')}">${markup}</div>`;
  },

  flow(props, block) {
    const markup = renderToStaticMarkup(h(FlowBlock, { id: block.id, ...props }));
    return `<div class="g-viz-wrap" id="${esc(block.id || '')}">${markup}</div>`;
  },
};

/**
 * 文档落款：meta.date / author / version 三个字段。
 * 此前它们在契约里写了、示例里填了，但两轨都没渲染 —— 填了不显示比不支持更糟。
 * 副标题/眉标/徽标不做，正文里已有 heading / hero block 承担同一件事。
 */
function renderColophon(meta) {
  const items = [
    ['日期', meta.date],
    ['编制', meta.author],
    ['版本', meta.version],
  ].filter(([, v]) => typeof v === 'string' && v.trim());
  if (!items.length) return '';
  const body = items
    .map(([k, v]) => `<span class="g-colophon__item"><span class="g-colophon__k">${esc(k)}</span>${esc(v)}</span>`)
    .join('');
  return `  <footer class="g-colophon">${body}</footer>`;
}

function renderBlock(block, ctx, at = '区块', fallbackId = '') {
  // D11：以前 `{ id: b.id, ...b }` 在 null 上抛裸 TypeError，无下标无字段名。
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    const kind = block === null ? 'null' : Array.isArray(block) ? 'array' : typeof block;
    throw new Error(`${at}为 ${kind}，请删除该块或补成 {id, type, props} 对象`);
  }
  const b = { ...block, id: block.id || fallbackId };

  if (!b.type) {
    const keys = Object.keys(block);
    const detail = `该块字段: ${keys.length ? keys.join(', ') : '无'}。请补上 type（可用: ${Object.keys(BLOCK_RENDERERS).join(', ')}）。`;
    console.warn(`[mwg] ${at}缺 type，已跳过。${detail}`);
    return blockAlert(at, '缺 type，已跳过', detail);
  }
  const renderer = BLOCK_RENDERERS[b.type];
  if (!renderer) {
    throw new Error(`${at}未知区块类型 type="${b.type}"（id=${b.id || '无'}；可用: ${Object.keys(BLOCK_RENDERERS).join(', ')}）`);
  }
  try {
    return renderer(b.props || {}, b, { ...ctx, at });
  } catch (err) {
    // 下游（viz/charts、viz/flow）的报错原本不带块位置（D12）；在这里统一补上，
    // 原始 message 与 cause 保留，不改各渲染器。
    if (err && err.located) throw err;
    const wrapped = new Error(`${at}type=${b.type} id=${b.id || '无'} 渲染失败: ${err.message}`, { cause: err });
    wrapped.located = true;
    throw wrapped;
  }
}

// ═══════════════════════════════════════════════════════════
// 全量 CSS 内联
// ═══════════════════════════════════════════════════════════
function bundleCss() {
  const cssFiles = [
    path.join(__dirname, 'tokens.css'),
    path.join(__dirname, 'base.css'),
    path.join(__dirname, 'components.css'),
  ];
  const contents = cssFiles.map((f) => fs.readFileSync(f, 'utf8'));
  return contents.join('\n\n').replace(/<\/style/gi, '<\\/style');
}

// ═══════════════════════════════════════════════════════════
// 页面渲染总入口（零 <script>，静态单文件）
// ═══════════════════════════════════════════════════════════
export function renderDocument(contentJson, options = {}) {
  const meta = contentJson.meta || {};
  const blocks = Array.isArray(contentJson.blocks) ? contentJson.blocks : [];
  if (blocks.length === 0) {
    throw new Error('content.json 缺少 blocks[]，无法渲染');
  }
  const recipe = meta.recipe || 'report';
  const theme = options.theme === 'dark' || options.theme === 'light'
    ? options.theme
    : meta.theme === 'dark' ? 'dark' : 'light';
  const lang = meta.lang || 'zh-CN';
  const title = meta.title || 'Gary Document';

  const ctx = {
    basePath: options.basePath || process.cwd(),
  };

  const renderedBlocks = blocks
    .map((b, i) => renderBlock(b, ctx, `第 ${i + 1} 块（blocks[${i}]）`, `b${i}`))
    .join('\n');
  const colophon = renderColophon(meta);
  const css = bundleCss();

  return `<!DOCTYPE html>
<html lang="${esc(lang)}" data-gary-engine="mwg" data-astryx-theme="gary" data-theme="${esc(theme)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <style>
${css}
  </style>
</head>
<body class="g-page-body">
  <main class="g-page" data-recipe="${esc(recipe)}">
${renderedBlocks}
${colophon}
  </main>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// CLI 入口
// ═══════════════════════════════════════════════════════════
function main() {
  const args = process.argv.slice(2);
  let inputFile = null;
  let outputFile = null;
  let themeArg = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-o') {
      outputFile = args[++i];
    } else if (args[i] === '--theme') {
      themeArg = args[++i];
    } else if (!inputFile) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error('用法: node mwg/render.mjs <content.json> -o <out.html> [--theme light|dark]');
    process.exit(2);
  }

  const inPath = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(inPath)) {
    console.error(`错误: 输入文件不存在: ${inPath}`);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(inPath, 'utf8'));
  const html = renderDocument(content, { basePath: path.dirname(inPath), theme: themeArg });

  const outPath = outputFile
    ? path.resolve(process.cwd(), outputFile)
    : path.join(path.dirname(inPath), `${path.basename(inPath, '.json')}.html`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html, 'utf8');

  const bytes = Buffer.byteLength(html, 'utf8');
  const blocks = Array.isArray(content.blocks) ? content.blocks : [];
  const charts = blocks.filter((b) => b?.type === 'chart').length;
  const flows = blocks.filter((b) => b?.type === 'flow').length;
  const skipped = blocks.filter((b) => !b?.type).length;
  const recipe = content.meta?.recipe || 'report';

  // skipped 让「少了一块」在日志里可见，不再出现 blocks=3 却只画出 2 块（D10）。
  console.log(`WROTE ${outPath} bytes=${bytes} blocks=${blocks.length}${skipped ? ` skipped=${skipped}` : ''} recipe=${recipe} charts=${charts} flows=${flows}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
