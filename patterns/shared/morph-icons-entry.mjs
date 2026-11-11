// Gary-UI × morphicons — 默认图标机制。
// 向后兼容 icons-entry.mjs 的契约（data-gary-icon / GaryIcons.set / GaryIcons.render），
// 底层升级为 morphicons 的 morph 引擎：任意描边图标 morph 到任意描边图标，
// 旋转由数学涌现（Procrustes + polar interpolation），零运行时依赖，全离线。
//
// 三种模式（与 morphicons 生命周期契约一致）：
//   1. 无控（默认）：GaryIcons.set(el, name) 或 el.morphTo(name) —— 切图标即 spring morph
//   2. 命令式：el.morphTo(name, spring) 动画 / el.set(name) 直接跳变
//   3. 受控：GaryIcons.seek(el, name, progress) —— 滚动/手势 scrub
//
// 声明式用法（copyable HTML）：
//   <button data-gary-icon="menu" data-gary-icon-to="x" data-gary-icon-toggle aria-label="菜单"></button>
//   data-gary-icon-toggle   点击在 name ↔ data-gary-icon-to 之间 morph
//   data-gary-icon-spring   "smooth" | "snappy" | "bouncy" | {stiffness,damping}
//   data-gary-icon-reduced-motion  "never" | "user" | "always"（默认 user：跟随系统减弱动态）
//
// 契约保持不变：44px 点击区（.gary-icon-button）、1.6px 描边（--gary-icon-stroke）、
// 可访问名称（aria-label + title + .gary-visually-hidden）。
// 首次渲染用 canonicalD 输出精确 d（纯 core，无 DOM），后续切换由驱动写 d。

import { canonicalD, createMorph } from './vendor/morphicons/dom.js';
import {
  Sun, Moon, Play, Pause, RotateCcw, ArrowUpRight, ArrowLeft, ArrowUp, ArrowDown, ArrowRight,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Copy, Check, X, Menu, SlidersHorizontal,
  Heart, UserPlus, UserCheck, Ellipsis, Save, FilterX, ListFilter, Monitor, Minimize, Minimize2,
  Maximize, Download, Image, Code, Plus, Minus, Volume2, VolumeX, Search, Settings, Star,
  Bell, Calendar, ExternalLink, RefreshCw, Camera, MessageSquare, Send, Filter,
} from '../../adapters/visual/node_modules/lucide/dist/esm/lucide.mjs';

const icons = {
  sun: Sun, moon: Moon, play: Play, pause: Pause, 'rotate-ccw': RotateCcw,
  'arrow-up-right': ArrowUpRight, 'arrow-left': ArrowLeft, 'arrow-up': ArrowUp,
  'arrow-down': ArrowDown, 'arrow-right': ArrowRight,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  copy: Copy, check: Check, x: X, menu: Menu, sliders: SlidersHorizontal,
  heart: Heart, 'user-plus': UserPlus, 'user-check': UserCheck, ellipsis: Ellipsis,
  save: Save, 'filter-x': FilterX, filter: Filter, listFilter: ListFilter,
  monitor: Monitor, minimize: Minimize, 'minimize-2': Minimize2, maximize: Maximize,
  download: Download, image: Image, code: Code,
  plus: Plus, minus: Minus, 'volume-2': Volume2, 'volume-x': VolumeX, search: Search,
  settings: Settings, star: Star, bell: Bell, calendar: Calendar,
  'external-link': ExternalLink, 'refresh-cw': RefreshCw, camera: Camera,
  'message-square': MessageSquare, send: Send,
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULTS = Object.freeze({ spring: 'snappy', reducedMotion: 'user', strokeWidth: 1.6 });
const morphs = new WeakMap(); // element -> handle

function resolveOptions(element) {
  const opts = { ...DEFAULTS };
  if (element.dataset.garyIconSpring) opts.spring = element.dataset.garyIconSpring;
  if (element.dataset.garyIconReducedMotion) opts.reducedMotion = element.dataset.garyIconReducedMotion;
  return opts;
}

function createSvg(icon, strokeWidth) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'gary-icon');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', String(strokeWidth));
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', canonicalD(icon)); // 首帧精确静态 SVG，SSR/静默一致
  svg.appendChild(path);
  return { svg, path };
}

function ensureHandle(element, name, label, options) {
  const existing = morphs.get(element);
  // DOM 被外部改动（replaceChildren/清空）时自愈重建，driver 与真实 path 保持绑定。
  if (existing && !existing.dead && element.querySelector('path')) {
    if (existing.name === name && label !== undefined) {
      element.setAttribute('aria-label', label);
      element.title = label;
      const hidden = element.querySelector('.gary-visually-hidden');
      if (hidden) hidden.textContent = label;
    }
    return existing;
  }
  if (existing?.driver) existing.driver.destroy();
  element.classList.add('gary-icon-button');
  const text = label || element.getAttribute('aria-label') || element.textContent.trim();
  element.setAttribute('aria-label', text);
  element.title = text;
  const { svg, path } = createSvg(icons[name], options.strokeWidth);
  const hidden = document.createElement('span');
  hidden.className = 'gary-visually-hidden';
  hidden.textContent = text;
  element.replaceChildren(svg, hidden);
  const driver = createMorph(path, icons[name], {
    reducedMotion: options.reducedMotion,
    spring: options.spring,
  });
  const handle = {
    driver,
    name,
    dead: false,
    get reducedMotion() { return driver.reducedMotion; },
    set reducedMotion(v) { driver.reducedMotion = v; }, // 活策略：下一次 morph 生效
    morphTo(next, spring) {
      if (!icons[next] || handle.dead) return;
      if (handle.name === next && driver.progress === 1) return;
      handle.name = next;
      driver.morphTo(icons[next], spring ?? options.spring);
    },
    set(next) {
      if (!icons[next] || handle.dead) return;
      handle.name = next;
      driver.set(icons[next]);
    },
    destroy() {
      handle.dead = true;
      driver.destroy();
      if (morphs.get(element) === handle) morphs.delete(element);
    },
  };
  morphs.set(element, handle);
  element.morphTo = handle.morphTo; // 命令式：元素即句柄
  element.set = handle.set;
  return handle;
}

/** 静态或切换渲染（向后兼容）：首次渲染精确图标，后续同元素换名自动 spring morph。 */
function set(element, name, label) {
  if (!element || !icons[name]) return null;
  element.dataset.garyIcon = name;
  const handle = ensureHandle(element, name, label, resolveOptions(element));
  if (handle.name !== name) handle.morphTo(name);
  return handle;
}

/** 命令式 morph：任意两图标（无需预注册对）。 */
function morphTo(element, name, spring) {
  const handle = element instanceof Element ? morphs.get(element) : null;
  if (handle) handle.morphTo(name, spring);
}

/** 受控 scrub：冻结在 progress ∈ [0,1]，不启动调度器。 */
function seek(element, name, progress) {
  const handle = morphs.get(element);
  if (!handle) return;
  handle.name = name;
  handle.driver.seek(icons[name], progress);
}

function bindToggle(element, handle) {
  if (element.dataset.garyToggleBound) return;
  element.dataset.garyToggleBound = '1';
  element.addEventListener('click', () => {
    const a = element.dataset.garyIcon;
    const b = element.dataset.garyIconTo;
    if (!b || !icons[b]) return;
    const next = handle.name === b ? a : b;
    handle.morphTo(next);
  });
}

function render(scope = document) {
  scope.querySelectorAll('[data-gary-icon]').forEach((element) => {
    const handle = set(element, element.dataset.garyIcon);
    if (element.dataset.garyIconTo) bindToggle(element, handle);
  });
}

/** 减弱动态策略（活）：读取或设置实例的 reducedMotion，下一次 morph 生效。 */
function policy(element, value) {
  const handle = morphs.get(element);
  if (!handle) return undefined;
  if (value === undefined) return handle.reducedMotion;
  handle.reducedMotion = value;
  if (element.dataset) element.dataset.garyIconReducedMotion = value;
  return value;
}

window.GaryIcons = { icons, set, morphTo, seek, policy, render };
render();
