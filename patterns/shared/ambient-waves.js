/* SPDX-License-Identifier: MIT
 * Gary-UI ambient waves: an independently authored Canvas 2D landscape of
 * three moving, gradient-filled wave sheets. No dependencies or network I/O.
 */
(() => {
  'use strict';
  if (window.GaryGradientWaves) return;
  const ranges = Object.freeze(Object.fromEntries(Object.entries({
    speed: [0, 1, .01], amplitude: [0, 5, .1], waveScale: [.25, 3, .05],
    waveRatio: [.1, 2, .05], swell: [0, 20, .1], turbulence: [0, 100, 1],
    tilt: [0, 2, .01], zoom: [.5, 2, .05], height: [0, 20, .1],
    fogDepth: [0, 50, 1], brightness: [.1, 2, .05], opacity: [0, 1, .01],
    parallaxStrength: [0, 2, .05], grainIntensity: [0, .1, .005]
  }).map(([key, value]) => [key, Object.freeze(value)])));
  const defaults = Object.freeze({
    speed: .1, amplitude: 2, waveScale: 1.35, waveRatio: .6, swell: 3,
    turbulence: 35, tilt: 1.12, zoom: 1, height: 10, fogDepth: 20,
    brightness: 1.1, opacity: .47, parallaxStrength: .85, grainIntensity: .01,
    horizonColor: '#455164', waveColor: '#8193ab', crestColor: '#dbe4ef',
    mouseInteraction: true, grain: true, detail: 'medium'
  });
  const colorKeys = ['horizonColor', 'waveColor', 'crestColor'];
  const mounted = new WeakMap();
  function normalize(patch = {}, base = defaults) {
    const result = {};
    const source = patch && typeof patch === 'object' ? patch : {};
    const previous = base && typeof base === 'object' ? base : defaults;
    for (const [key, [min, max]] of Object.entries(ranges)) {
      const fallback = typeof previous[key] === 'number' && Number.isFinite(previous[key]) ? previous[key] : defaults[key];
      const value = typeof source[key] === 'number' && Number.isFinite(source[key]) ? source[key] : fallback;
      result[key] = Math.min(max, Math.max(min, value));
    }
    for (const key of colorKeys) {
      const valid = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
      result[key] = valid(source[key]) ? source[key] : valid(previous[key]) ? previous[key] : defaults[key];
    }
    for (const key of ['mouseInteraction', 'grain']) result[key] = typeof source[key] === 'boolean' ? source[key] : typeof previous[key] === 'boolean' ? previous[key] : defaults[key];
    result.detail = ['low', 'medium', 'high'].includes(source.detail) ? source.detail : ['low', 'medium', 'high'].includes(previous.detail) ? previous.detail : defaults.detail;
    return result;
  }

  function mount(host, options = {}) {
    if (!(host instanceof Element)) throw new TypeError('GaryGradientWaves.mount requires a host element');
    if (mounted.has(host)) { const existing = mounted.get(host); existing.update(options); return existing; }
    let config = normalize(options);
    const canvas = document.createElement('canvas');
    canvas.className = 'gary-gradient-waves-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none' });
    host.prepend(canvas);
    let context;
    try { context = canvas.getContext('2d', { alpha: true }); } catch (_) { context = null; }
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const print = matchMedia('print');
    let printing = false, visible = true, paused = false, destroyed = false;
    let width = 0, height = 0, pixelRatio = 1, time = 0, frames = 0;
    let status = '', request = 0, lastFrame = 0, dirty = true;
    let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
    const cleanups = [];
    const on = (target, event, handler, settings) => {
      target.addEventListener(event, handler, settings);
      cleanups.push(() => target.removeEventListener(event, handler, settings));
    };
    const state = () => ({ status, time, frames, options: { ...config }, width, height });
    function announce() {
      // The current controller uses -status; -state is the public state event.
      for (const name of ['gary-waves-status', 'gary-waves-state']) host.dispatchEvent(new CustomEvent(name, { detail: state() }));
    }
    function currentStatus() {
      if (destroyed) return 'destroyed';
      if (!context) return 'fallback';
      if (printing || print.matches) return 'print';
      if (document.hidden || !visible || !host.isConnected || !width || !height) return 'suspended';
      if (motion.matches) return 'reduced-motion';
      if (paused) return 'paused';
      return config.speed === 0 ? 'static' : 'playing';
    }
    function color(hex, opacity = 1, factor = 1) {
      const value = Number.parseInt(hex.slice(1), 16);
      const channel = shift => Math.min(255, Math.round(((value >> shift) & 255) * config.brightness * factor));
      return `rgba(${channel(16)},${channel(8)},${channel(0)},${opacity})`;
    }
    function crest(x, layer) {
      const u = x / width;
      const phase = time * config.speed * .7;
      const frequency = config.waveScale * Math.PI * 2;
      const main = Math.sin(u * frequency + layer * 1.9 + phase * (1 + layer * .12));
      const secondary = Math.sin(u * frequency * 1.73 - phase * .64 + layer * 2.4) * config.waveRatio * .34;
      const fine = Math.sin(u * frequency * 3.2 + phase * .31 + layer) * config.turbulence * .0018;
      const swell = Math.sin(u * Math.PI + phase * .36 + layer) * config.swell * .016;
      return height * (.3 + layer * .19 - (config.height - 10) * .022 + (main + secondary + fine + swell) * config.amplitude * .033);
    }
    function traceCrest(ctx, layer, segments, offset = 0) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const x = -width + width * 3 * i / segments;
        points.push([x, crest(x, layer) + offset]);
      }
      ctx.moveTo(...points[0]);
      // Quadratic interpolation avoids faceted silhouettes at the low detail
      // setting while keeping the same deterministic wave geometry.
      for (let i = 1; i < points.length - 1; i++) {
        const [x, y] = points[i], [nextX, nextY] = points[i + 1];
        ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
      }
      const last = points[points.length - 1];
      ctx.lineTo(...last);
    }
    function paint() {
      if (!context || destroyed || !width || !height) return;
      try {
        const ctx = context;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.clearRect(0, 0, width, height);
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, color(config.horizonColor, .12));
        sky.addColorStop(1, color(config.horizonColor, .8));
        ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2 + pointerX * width * .026 * config.parallaxStrength, height / 2 + pointerY * height * .022 * config.parallaxStrength);
        ctx.rotate((config.tilt - 1) * .22); ctx.scale(config.zoom, config.zoom); ctx.translate(-width / 2, -height / 2);
        const segments = { low: 48, medium: 84, high: 128 }[config.detail];
        const left = -width, right = width * 2;
        for (let layer = 0; layer < 3; layer++) {
          const sheet = ctx.createLinearGradient(0, height * (.1 + layer * .16), width * .16, height * (1.3 + layer * .1));
          sheet.addColorStop(0, color(config.crestColor, .93, 1 + layer * .035));
          sheet.addColorStop(.24, color(config.waveColor, .9));
          sheet.addColorStop(.78, color(config.horizonColor, .98, .8));
          sheet.addColorStop(1, color(config.horizonColor, 1, .52));
          ctx.beginPath();
          traceCrest(ctx, layer, segments);
          ctx.lineTo(right, height * 3); ctx.lineTo(left, height * 3); ctx.closePath();
          ctx.fillStyle = sheet; ctx.fill();
          // Narrow specular ridge, followed by broad soft light inside the face.
          for (const [offset, alpha, lineWidth] of [[1, .48, 1.1], [5, .11, 6], [16, .055, 16]]) {
            ctx.beginPath();
            traceCrest(ctx, layer, segments, offset);
            ctx.strokeStyle = color(config.crestColor, alpha); ctx.lineWidth = lineWidth; ctx.stroke();
          }
        }
        ctx.restore();
        const fog = ctx.createLinearGradient(0, 0, 0, height);
        fog.addColorStop(0, color(config.horizonColor, config.fogDepth / 65));
        fog.addColorStop(.6, color(config.horizonColor, 0));
        fog.addColorStop(1, color(config.horizonColor, config.fogDepth / 150));
        ctx.fillStyle = fog; ctx.fillRect(0, 0, width, height);
        if (config.grain && config.grainIntensity) {
          // A deterministic sparse stipple adds texture without animated noise.
          ctx.fillStyle = color(config.crestColor, config.grainIntensity * 2);
          let seed = 7919;
          const count = Math.min(10000, Math.ceil(width * height / 130));
          for (let i = 0; i < count; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const x = seed / 4294967296 * width;
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const y = seed / 4294967296 * height;
            ctx.fillRect(x, y, .8, .8);
          }
        }
        frames++; dirty = false;
      } catch (_) {
        context = null; status = 'fallback';
        if (request) cancelAnimationFrame(request); request = 0;
        announce();
      }
    }
    function tick(now) {
      request = 0;
      if (currentStatus() !== 'playing') { refresh(false); return; }
      if (!lastFrame) lastFrame = now;
      const elapsed = now - lastFrame;
      if (elapsed >= 1000 / 30) {
        time += Math.min(.12, elapsed / 1000); lastFrame = now;
        pointerX += (targetX - pointerX) * .07; pointerY += (targetY - pointerY) * .07;
        paint();
      }
      if (context && !destroyed) request = requestAnimationFrame(tick);
    }
    function refresh(redraw = true) {
      if (destroyed) return;
      if (redraw) dirty = true;
      const next = currentStatus(), changed = status !== next;
      status = next;
      if (request) cancelAnimationFrame(request); request = 0; lastFrame = 0;
      if (motion.matches || !config.mouseInteraction) pointerX = pointerY = targetX = targetY = 0;
      canvas.style.opacity = String(config.opacity);
      if (dirty && !['suspended', 'print', 'fallback'].includes(status)) paint();
      if (status === 'playing') request = requestAnimationFrame(tick);
      if (changed || redraw) announce();
    }
    function resize() {
      if (destroyed) return;
      width = Math.max(0, host.clientWidth); height = Math.max(0, host.clientHeight);
      pixelRatio = Math.min(devicePixelRatio || 1, { low: .75, medium: 1.25, high: 2 }[config.detail]);
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      refresh();
    }
    on(document, 'visibilitychange', () => refresh(false));
    on(motion, 'change', () => refresh());
    on(print, 'change', () => refresh(false));
    on(window, 'beforeprint', () => { printing = true; refresh(false); });
    on(window, 'afterprint', () => { printing = false; refresh(); });
    on(window, 'resize', resize, { passive: true });
    on(window, 'pointermove', event => {
      if (!config.mouseInteraction || motion.matches || status !== 'playing') return;
      const rect = host.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1));
      targetY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1));
    }, { passive: true });
    on(document.documentElement, 'pointerleave', () => { targetX = targetY = 0; }, { passive: true });
    const box = host.getBoundingClientRect();
    visible = box.bottom > 0 && box.right > 0 && box.top < innerHeight && box.left < innerWidth;
    const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
      const next = entries[0].isIntersecting;
      if (visible !== next) { visible = next; refresh(false); }
    }) : null;
    intersection?.observe(host);
    const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(host);
    let connected = host.isConnected;
    const treeObserver = new MutationObserver(() => {
      if (connected !== host.isConnected) { connected = host.isConnected; refresh(false); }
    });
    treeObserver.observe(document.documentElement, { subtree: true, childList: true });
    const api = Object.freeze({
      get state() { return state(); },
      update(patch) {
        if (destroyed) return state();
        const detail = config.detail; config = normalize(patch, config);
        if (detail !== config.detail) resize(); else refresh();
        return state();
      },
      pause() { paused = true; refresh(false); },
      play() { paused = false; refresh(false); },
      replay() { if (!destroyed) { time = 0; frames = 0; paused = false; pointerX = pointerY = targetX = targetY = 0; refresh(); } },
      snapshot() {
        if (destroyed || !context) throw new Error('The wave canvas is unavailable.');
        // CSS opacity is a compositing step, so include it in exported alpha.
        const output = document.createElement('canvas');
        output.width = canvas.width; output.height = canvas.height;
        const outputContext = output.getContext('2d');
        if (!outputContext) throw new Error('PNG export is unavailable.');
        outputContext.globalAlpha = config.opacity;
        outputContext.drawImage(canvas, 0, 0);
        return output.toDataURL('image/png');
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; status = 'destroyed';
        if (request) cancelAnimationFrame(request); request = 0;
        intersection?.disconnect(); resizeObserver?.disconnect(); treeObserver.disconnect();
        cleanups.forEach(cleanup => cleanup()); canvas.remove(); mounted.delete(host); announce();
      }
    });
    mounted.set(host, api); resize();
    return api;
  }
  window.GaryGradientWaves = Object.freeze({ mount, defaults, ranges, normalize });
})();
