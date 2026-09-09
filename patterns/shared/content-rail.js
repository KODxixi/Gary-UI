/* Original Gary-UI content rail. MIT. No autoplay or dependency. */
(() => {
  'use strict';
  if (window.GaryContentRail) return;
  const mounted = new WeakMap();

  function mount(host) {
    if (!(host instanceof Element)) throw new TypeError('GaryContentRail.mount requires an element');
    if (mounted.has(host)) return mounted.get(host);
    const rail = host.querySelector('.gary-content-rail');
    if (!rail?.matches('ol, ul')) throw new TypeError('GaryContentRail requires an ol or ul.gary-content-rail');
    // ponytail: static item collection; destroy and remount when items are added or removed.
    const items = [...rail.children].filter(item => item.tagName === 'LI');
    const previous = host.querySelector('[data-rail-prev]');
    const next = host.querySelector('[data-rail-next]');
    const status = host.querySelector('[data-rail-status]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const addedTabindex = !rail.hasAttribute('tabindex');
    const previousLive = status?.getAttribute('aria-live');
    if (addedTabindex) rail.tabIndex = 0;
    if (status) status.setAttribute('aria-live', 'polite');
    let index = 0, destination = null, timer = 0, destroyed = false;
    const listeners = [];
    const on = (target, event, handler, options) => {
      if (!target) return;
      target.addEventListener(event, handler, options);
      listeners.push(() => target.removeEventListener(event, handler, options));
    };
    const clamp = value => Math.max(0, Math.min(items.length - 1, value));
    const position = value => Math.min(rail.scrollWidth - rail.clientWidth,
      items[value].getBoundingClientRect().left - items[0].getBoundingClientRect().left);

    function update() {
      let distance = Infinity;
      items.forEach((item, candidate) => {
        const difference = Math.abs(position(candidate) - rail.scrollLeft);
        if (difference < distance) { distance = difference; index = candidate; }
      });
      if (previous) previous.disabled = !items.length || index === 0;
      if (next) next.disabled = !items.length || index === items.length - 1;
      const label = `${items.length ? index + 1 : 0} / ${items.length}`;
      if (status && status.textContent !== label) status.textContent = label;
      items.forEach((item, candidate) => item.toggleAttribute('data-rail-current', candidate === index));
    }
    function go(value, smooth = true) {
      if (destroyed || !items.length) return;
      destination = clamp(value);
      rail.scrollTo({ left: position(destination), behavior: smooth && !reduced.matches ? 'smooth' : 'auto' });
      update();
    }
    on(previous, 'click', () => go((destination ?? index) - 1));
    on(next, 'click', () => go((destination ?? index) + 1));
    on(rail, 'keydown', event => {
      if (event.target !== rail || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const keys = { ArrowLeft: (destination ?? index) - 1, ArrowRight: (destination ?? index) + 1, Home: 0, End: items.length - 1 };
      if (!(event.key in keys)) return;
      event.preventDefault();
      go(keys[event.key]);
    });
    on(rail, 'scroll', () => {
      update();
      clearTimeout(timer);
      timer = setTimeout(() => { destination = null; }, 160);
    }, { passive: true });
    for (const event of ['pointerdown', 'wheel', 'touchstart']) on(rail, event, () => { destination = null; }, { passive: true });
    on(reduced, 'change', () => { if (reduced.matches) go(destination ?? index, false); });
    const resize = new ResizeObserver(() => {
      if (!matchMedia('print').matches) go(destination ?? index, false);
    });
    resize.observe(rail);
    const api = Object.freeze({ destroy() {
      if (destroyed) return;
      destroyed = true;
      clearTimeout(timer);
      resize.disconnect();
      listeners.forEach(remove => remove());
      if (addedTabindex) rail.removeAttribute('tabindex');
      if (status) {
        if (previousLive === null) status.removeAttribute('aria-live');
        else status.setAttribute('aria-live', previousLive);
      }
      items.forEach(item => item.removeAttribute('data-rail-current'));
      mounted.delete(host);
    } });
    mounted.set(host, api);
    update();
    return api;
  }
  window.GaryContentRail = Object.freeze({ mount });
  const start = () => document.querySelectorAll('[data-gary-rail]').forEach(mount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
