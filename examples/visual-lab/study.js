(() => {
  'use strict';
  const q = s => document.querySelector(s), all = s => [...document.querySelectorAll(s)];
  const root = document.documentElement, scene = q('.demo-global-scene');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const cards = all('.specimen--lens'), stages = [q('#material-stage'), q('#light-probe')];
  let mode = 'linked', frame = 0, lastPointer = null, printing = false;
  let savedTheme;
  try { savedTheme = localStorage.getItem('gary-demo-theme'); } catch {}
  function theme(value) {
    const next = value === 'light' ? 'light' : 'dark';
    root.dataset.garyTheme = next; root.dataset.theme = next;
    try { localStorage.setItem('gary-demo-theme', next); } catch {}
    GaryIcons.set(q('[data-theme-toggle]'), next === 'light' ? 'moon' : 'sun', next === 'light' ? '切换深色主题' : '切换浅色主题');
    q('[data-theme-toggle]').setAttribute('aria-pressed', String(next === 'light'));
    dispatchEvent(new CustomEvent('gary-theme-change', { detail: { theme: next } }));
  }
  theme(new URLSearchParams(location.search).get('theme') || savedTheme);
  q('[data-theme-toggle]').addEventListener('click', () => theme(root.dataset.garyTheme === 'dark' ? 'light' : 'dark'));
  GaryIcons.render();
  q('#reference-enabled').addEventListener('change', e => { q('#material-stage').dataset.reference = e.target.checked ? 'on' : 'off'; });
  all('[data-layer]').forEach(input => input.addEventListener('change', () => { q('#material-stage').dataset[input.dataset.layer] = input.checked ? 'on' : 'off'; }));

  const enabled = () => root.dataset.garyPointerEffects === 'on' && !reduced.matches && fine.matches && !document.hidden && !printing;
  function clearLight() {
    cancelAnimationFrame(frame); frame = 0; lastPointer = null;
    scene.style.setProperty('--scene-light-active', '0');
    cards.forEach(card => card.style.setProperty('--light-active', '0'));
  }
  function syncPointerControl() {
    clearLight();
    q('#pointer-enabled').checked = root.dataset.garyPointerEffects === 'on';
    q('#pointer-enabled').disabled = reduced.matches || !fine.matches;
    q('#light-status').textContent = reduced.matches ? '减弱动态已启用，保留完整静态材质。' : !fine.matches ? '当前使用触摸浏览，保留静态材质。' : root.dataset.garyPointerEffects !== 'on' ? '鼠标光影已关闭，当前为静态质感。' : mode === 'linked' ? '鼠标光影已开启：移动指针观察背景与卡片的同向响应。' : '当前仅体验原有点阵响应；新增的联动光影已关闭。';
  }
  q('#pointer-enabled').addEventListener('change', e => {
    root.dataset.garyPointerEffects = e.target.checked ? 'on' : 'off';
    dispatchEvent(new CustomEvent('gary:pointer-effects-change', { detail: { enabled: e.target.checked } }));
  });
  const pointerObserver = new MutationObserver(syncPointerControl);
  pointerObserver.observe(root, { attributes: true, attributeFilter: ['data-gary-pointer-effects'] });
  addEventListener('gary:pointer-effects-change', syncPointerControl);
  reduced.addEventListener('change', syncPointerControl); fine.addEventListener('change', syncPointerControl);
  all('[data-light-mode]').forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.lightMode;
    all('[data-light-mode]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    syncPointerControl();
  }));
  function paintLight() {
    frame = 0;
    if (!lastPointer || !enabled() || mode !== 'linked') { clearLight(); return; }
    const { x, y } = lastPointer;
    const within = stages.some(stage => { const r = stage.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    if (!within) { clearLight(); return; }
    const sceneBox = scene.getBoundingClientRect();
    scene.style.setProperty('--scene-light-x', `${x - sceneBox.left}px`); scene.style.setProperty('--scene-light-y', `${y - sceneBox.top}px`); scene.style.setProperty('--scene-light-active', '1');
    cards.forEach(card => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--light-x', `${x - box.left}px`); card.style.setProperty('--light-y', `${y - box.top}px`);
      const distance = Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom));
      card.style.setProperty('--light-active', String(Math.max(0, 1 - distance / 240)));
    });
  }
  addEventListener('pointermove', event => { if (event.pointerType !== 'mouse' || !enabled() || mode !== 'linked') return; lastPointer = { x: event.clientX, y: event.clientY }; if (!frame) frame = requestAnimationFrame(paintLight); }, { passive: true });
  addEventListener('pointerout', event => { if (!event.relatedTarget) clearLight(); });
  addEventListener('scroll', clearLight, { passive: true });
  addEventListener('resize', clearLight); addEventListener('pagehide', clearLight);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearLight(); });
  addEventListener('beforeprint', () => { printing = true; clearLight(); });
  addEventListener('afterprint', () => { printing = false; });
  syncPointerControl();
  const opticsObserver = new MutationObserver(() => {
    q('#optical-support').textContent = cards.every(card => card.dataset.garyRefractionState === 'svg') ? '当前浏览器使用背景折射；图形、文字本身不加滤镜。' : '当前浏览器采用磨砂回退；不宣称与折射效果相同。';
  });
  cards.forEach(card => opticsObserver.observe(card, { attributes: true, attributeFilter: ['data-gary-refraction-state'] }));
  q('#optical-support').textContent = cards.every(card => card.dataset.garyRefractionState === 'svg') ? '当前浏览器使用背景折射；图形、文字本身不加滤镜。' : '当前浏览器采用磨砂回退；不宣称与折射效果相同。';

  q('#copy-direction').addEventListener('click', async () => {
    const material = q('#material-choice'), light = q('#light-choice');
    const text = `Gary-UI 视觉方向\n图表采用统一尺度、直接标注与稳定数据底板。\n材质：${material.selectedOptions[0].textContent}\n背景：${light.selectedOptions[0].textContent}\n鼠标 hover 默认关闭。\n候选只在确认适用场景后推广。`;
    const fallback = q('#choice-fallback');
    try { await navigator.clipboard.writeText(text); fallback.hidden = true; q('#choice-status').textContent = '已复制视觉方向，发给我继续细化。'; }
    catch { fallback.value = text; fallback.hidden = false; fallback.focus(); fallback.select(); q('#choice-status').textContent = '请手动复制下方文字。'; }
  });
})();
