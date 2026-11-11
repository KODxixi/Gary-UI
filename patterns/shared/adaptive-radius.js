/*
 * Gary-UI adaptive radius — patterns/shared/adaptive-radius.js
 *
 * 圆角跟随元素自身 inline 尺寸，且恒为方形角。
 *
 * 为什么需要 JS：
 *   - border-radius: 百分比 沿两轴各自解析（x 相对宽、y 相对高），宽扁元素得到椭圆角；
 *   - cqi 相对最近祖先容器，不是元素自身，窄卡会继承大圆角；
 *   - CSS 没有"自身宽度的单值单位"。因此用 ResizeObserver 把
 *     clamp(min, ratio × width, max) 算成 px，写入 --gary-radius。
 *
 * 用法：元素加 data-gary-radius="card | panel"，引入本文件；
 *   元素 CSS 用 border-radius: var(--gary-radius, var(--gary-radius-card))。
 *   无 JS 时回退到 tokens 的 cqi 圆角（跟随容器，仍是方形角）。
 */
(function () {
  'use strict';

  var PRESETS = {
    card: { min: 14, ratio: 0.06, max: 32 },
    panel: { min: 18, ratio: 0.05, max: 44 }
  };

  var observed = new WeakSet();
  var ro = (typeof ResizeObserver !== 'undefined')
    ? new ResizeObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) compute(entries[i].target);
      })
    : null;

  function compute(el) {
    var p = PRESETS[el.getAttribute('data-gary-radius')];
    if (!p) return;
    var w = el.getBoundingClientRect().width;
    if (!w) return;
    var r = Math.min(p.max, Math.max(p.min, w * p.ratio));
    el.style.setProperty('--gary-radius', r.toFixed(2) + 'px');
  }

  function adopt(el) {
    if (!el || el.nodeType !== 1) return;
    if (el.hasAttribute && el.hasAttribute('data-gary-radius')) {
      if (!observed.has(el)) {
        observed.add(el);
        if (ro) ro.observe(el);
      }
      compute(el);
    }
    if (el.querySelectorAll) {
      var inner = el.querySelectorAll('[data-gary-radius]');
      for (var i = 0; i < inner.length; i++) {
        if (!observed.has(inner[i])) {
          observed.add(inner[i]);
          if (ro) ro.observe(inner[i]);
        }
        compute(inner[i]);
      }
    }
  }

  function scan(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var els = scope.querySelectorAll('[data-gary-radius]');
    for (var i = 0; i < els.length; i++) {
      if (!observed.has(els[i])) {
        observed.add(els[i]);
        if (ro) ro.observe(els[i]);
      }
      compute(els[i]);
    }
  }

  // DOM 自愈：初始渲染 + 后续插入的卡片
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(document); });
  } else {
    scan(document);
  }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        var added = muts[i].addedNodes;
        for (var j = 0; j < added.length; j++) adopt(added[j]);
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.GaryRadius = { compute: compute, scan: scan };
})();
