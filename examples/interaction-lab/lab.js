(() => {
  'use strict';
  const q = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const storageKey = 'gary-interaction-lab-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  let savedTheme;
  try { savedTheme = localStorage.getItem('gary-demo-theme'); } catch {}

  function theme(next) {
    root.dataset.garyTheme = next === 'light' ? 'light' : 'dark';
    root.dataset.theme = root.dataset.garyTheme;
    try { localStorage.setItem('gary-demo-theme', root.dataset.garyTheme); } catch {}
    const light = root.dataset.garyTheme === 'light';
    GaryIcons.set(q('[data-theme-toggle]'), light ? 'moon' : 'sun', light ? '切换深色主题' : '切换浅色主题');
    q('[data-theme-toggle]').setAttribute('aria-pressed', String(light));
    all('[data-preview]').forEach(img => { img.src = `../demos/evidence/edition-02/${img.dataset.preview}-${root.dataset.garyTheme}.png`; });
    all('a[href*="../demos/"]').forEach(link => { const target = new URL(link.href); target.searchParams.set('theme', root.dataset.garyTheme); link.href = target.href; });
    dispatchEvent(new CustomEvent('gary-theme-change', { detail: { theme: root.dataset.garyTheme } }));
  }
  theme(new URLSearchParams(location.search).get('theme') || savedTheme);
  q('[data-theme-toggle]').addEventListener('click', () => theme(root.dataset.garyTheme === 'dark' ? 'light' : 'dark'));
  GaryIcons.render();

  const number = q('#metric-value');
  const numberFormat = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const format = value => `${numberFormat.format(value)}%`;
  GaryNumberTransition.set(number, 72.4, { format });
  all('[data-period]').forEach(button => button.addEventListener('click', () => {
    const current = button.dataset.period === 'current';
    const value = current ? 72.4 : 68.1;
    GaryNumberTransition.set(number, value, { format });
    q('#period-label').textContent = current ? '本周' : '上周';
    q('#metric-progress').style.width = `${value}%`;
    q('#metric-comparison').textContent = current ? '较上周增加 4.3 个百分点' : '与本周对比，相差 4.3 个百分点';
    q('#metric-status').textContent = `${current ? '本周' : '上周'}交付完成率 ${format(value)}`;
    all('[data-period]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  }));

  // Same bounded WAAPI recipe as the approved Demo, scoped to these two phrases.
  const motionButtons = all('[data-motion-action]');
  let animations = [], run = 0;
  const motionStatus = q('[data-motion-status]');
  function controls(state) {
    motionStatus.textContent = { playing: '播放中', paused: '已暂停', complete: '完整呈现' }[state];
    q('[data-motion-action="pause"]').disabled = state !== 'playing';
    q('[data-motion-action="play"]').disabled = reduced.matches || state === 'playing';
    q('[data-motion-action="replay"]').disabled = reduced.matches;
  }
  function stop() { run++; animations.forEach(animation => animation.cancel()); animations = []; controls('complete'); }
  function play(replay) {
    if (reduced.matches || document.hidden) return;
    if (!replay && animations.some(animation => animation.playState === 'paused')) {
      animations.forEach(animation => animation.play()); controls('playing'); return;
    }
    stop(); const token = ++run;
    animations = all('[data-motion-item]').map((element, index) => element.animate(
      [{ opacity: .15, transform: 'translateY(16px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 350, delay: index * 350, fill: 'backwards', easing: 'cubic-bezier(.22,.68,0,1)' }
    ));
    controls('playing');
    Promise.all(animations.map(animation => animation.finished.catch(() => null))).then(() => { if (token === run) stop(); });
  }
  motionButtons.forEach(button => button.addEventListener('click', () => {
    if (button.dataset.motionAction === 'pause') { animations.forEach(animation => animation.pause()); controls('paused'); }
    else play(button.dataset.motionAction === 'replay');
  }));

  const tilt = q('#tilt-media'), tiltStage = q('#tilt-stage'), tiltEnabled = q('#tilt-enabled');
  const resetTilt = () => { tilt.style.transform = ''; };
  const tiltObserver = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) resetTilt(); });
  tiltObserver.observe(tiltStage);
  tiltStage.addEventListener('pointermove', event => {
    if (!tiltEnabled.checked || reduced.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    const box = tiltStage.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
    tilt.style.transform = `rotateX(${-y * 3}deg) rotateY(${x * 3}deg)`;
  });
  ['pointerleave', 'pointercancel'].forEach(event => tiltStage.addEventListener(event, resetTilt));
  tiltEnabled.addEventListener('change', resetTilt);
  function motionPreference() {
    stop(); resetTilt();
    tiltEnabled.disabled = reduced.matches || !finePointer.matches;
    q('#tilt-help').textContent = reduced.matches ? '已启用减弱动态，媒体保持静态。' : !finePointer.matches ? '当前使用触摸浏览，媒体保持静态。可在桌面鼠标下体验倾斜。' : '开启后移动鼠标，最大倾斜 3°。适合案例封面，是否打扰阅读由你判断。';
  }
  reduced.addEventListener('change', motionPreference);
  finePointer.addEventListener('change', motionPreference);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); resetTilt(); } });
  addEventListener('pagehide', () => { stop(); resetTilt(); });
  addEventListener('beforeprint', () => { stop(); resetTilt(); });
  motionPreference();

  const verdicts = { pending: '待判断', keep: '保留', refine: '调整后再看', skip: '不用' };
  all('[data-verdict]').forEach(select => {
    if (Object.hasOwn(verdicts, saved[select.dataset.verdict])) select.value = saved[select.dataset.verdict];
    select.addEventListener('change', save);
  });
  q('#choice-note').value = typeof saved.note === 'string' ? saved.note.slice(0, 1000) : '';
  q('#choice-note').addEventListener('input', save);
  function choices() { return { tilt: q('[data-verdict="tilt"]').value, reveal: q('[data-verdict="reveal"]').value, note: q('#choice-note').value }; }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(choices())); q('#choice-status').textContent = '选择已保存在当前浏览器，复制后发给我。'; }
    catch { q('#choice-status').textContent = '浏览器未允许保存，请复制选择后发给我。'; }
  }
  q('#copy-choices').addEventListener('click', async () => {
    const value = choices();
    const text = `Gary-UI 细节实验室\nA 媒体轻倾斜：${verdicts[value.tilt]}\nB 标题分段呈现：${verdicts[value.reveal]}\n补充：${value.note || '无'}\n这些是本轮偏好，尚未推广为全局默认。`;
    const fallback = q('#copy-fallback');
    try { await navigator.clipboard.writeText(text); fallback.hidden = true; q('#choice-status').textContent = '已复制，可以发给我继续调整。'; }
    catch { fallback.hidden = false; fallback.value = text; fallback.focus(); fallback.select(); q('#choice-status').textContent = '请手动复制下方文字。'; }
  });
})();
