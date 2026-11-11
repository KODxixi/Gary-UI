/* Original Gary-UI number updates. Dedicated text slots only; MIT. */
(() => {
  const states = new WeakMap();
  const active = new Set();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const print = matchMedia('print');
  let printing = false;

  function finish(state) {
    cancelAnimationFrame(state.frame);
    active.delete(state);
    state.current = state.target;
    state.real.style.opacity = '';
    state.visual?.remove();
    state.visual = null;
  }

  function finishAll() {
    active.forEach(finish);
  }

  reduced.addEventListener('change', () => { if (reduced.matches) finishAll(); });
  print.addEventListener('change', () => { if (print.matches) finishAll(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishAll(); });
  window.addEventListener('beforeprint', () => { printing = true; finishAll(); });
  window.addEventListener('afterprint', () => { printing = false; });
  window.addEventListener('pagehide', finishAll);

  window.GaryNumberTransition = {
    set(element, number, { format = value => String(value) } = {}) {
      if (!(element instanceof HTMLElement) || !Number.isFinite(number) || typeof format !== 'function') {
        throw new TypeError('Use an HTML text slot, a finite number, and a format function.');
      }
      // Validate before touching the previous valid value or its in-flight update.
      const text = String(format(number));
      let state = states.get(element);
      if (!state) {
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'position:relative;display:inline-block;font-variant-numeric:tabular-nums';
        const real = document.createElement('span');
        real.textContent = text;
        wrapper.append(real);
        element.replaceChildren(wrapper);
        state = { target: number, current: number, wrapper, real, visual: null, frame: 0 };
        states.set(element, state);
        return;
      }
      if (number === state.target) {
        if (text !== state.real.textContent) {
          finish(state);
          state.real.textContent = text;
        }
        return;
      }

      const from = state.current;
      finish(state);
      state.target = number;
      state.real.textContent = text;
      if (reduced.matches || document.hidden || print.matches || printing || !element.getClientRects().length) {
        finish(state);
        return;
      }

      const visual = document.createElement('span');
      visual.setAttribute('aria-hidden', 'true');
      visual.style.cssText = 'position:absolute;inset-block-start:0;inset-inline-start:0;white-space:nowrap;pointer-events:none';
      try { visual.textContent = String(format(from)); }
      catch { finish(state); return; }
      state.current = from;
      state.visual = visual;
      state.real.style.opacity = '0';
      state.wrapper.append(visual);
      active.add(state);
      const start = performance.now();

      function frame(now) {
        if (reduced.matches || document.hidden || print.matches || printing || !element.getClientRects().length) {
          finish(state);
          return;
        }
        const progress = Math.min(1, Math.max(0, (now - start) / 350));
        if (progress === 1) { finish(state); return; }
        const eased = 1 - (1 - progress) ** 3;
        state.current = from * (1 - eased) + number * eased;
        try { visual.textContent = String(format(state.current)); }
        catch { finish(state); return; }
        state.frame = requestAnimationFrame(frame);
      }
      state.frame = requestAnimationFrame(frame);
    }
  };
})();
