(() => {
  'use strict';
  const root = document.documentElement, q = s => document.querySelector(s);
  const status = q('#page-status'), reduced = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  let savedTheme;
  try { savedTheme = localStorage.getItem('gary-demo-theme'); } catch {}
  function theme(value) {
    const next = value === 'light' ? 'light' : 'dark';
    root.dataset.garyTheme = next; root.dataset.theme = next;
    try { localStorage.setItem('gary-demo-theme', next); } catch {}
    GaryIcons.set(q('[data-theme-toggle]'), next === 'dark' ? 'sun' : 'moon', next === 'dark' ? '切换浅色主题' : '切换深色主题');
    q('[data-theme-toggle]').setAttribute('aria-pressed', String(next === 'light'));
    dispatchEvent(new CustomEvent('gary-theme-change', { detail: { theme: next } }));
  }
  theme(new URLSearchParams(location.search).get('theme') || savedTheme);
  q('[data-theme-toggle]').addEventListener('click', () => theme(root.dataset.garyTheme === 'dark' ? 'light' : 'dark'));
  q('#reference-enabled').addEventListener('change', e => { q('.material-stage').dataset.reference = e.target.checked ? 'on' : 'off'; });
  function lightStatus() {
    q('#light-status').textContent = reduced.matches ? '减弱动态已启用 · 保留静态材质' : !fine.matches ? '触摸浏览 · 保留静态材质' : root.dataset.garyPointerEffects === 'on' ? '联动光影已开启 · 移动指针观察背景与清透卡边缘' : '联动光影已关闭 · 可在右上角 Background 开启';
  }
  new MutationObserver(lightStatus).observe(root, { attributes: true, attributeFilter: ['data-gary-pointer-effects'] });
  reduced.addEventListener('change', lightStatus); fine.addEventListener('change', lightStatus); lightStatus();
  Gary0909Charts.mount().then(() => {
    status.textContent = '17 类表达规范 · 5 类图形各两组内容验证 · 全部数据为人工演示';
  }).catch(error => { status.textContent = `图形未能载入：${error.message}`; console.error(error); });
  document.querySelectorAll('[data-export-chart]').forEach(button => button.addEventListener('click', () => {
    try { Gary0909Charts.exportSvg(button.dataset.exportChart); status.textContent = '已导出当前主题 SVG · 保留坐标、标注与演示数据说明'; }
    catch (error) { status.textContent = '导出失败，请重试。'; console.error(error); }
  }));
  q('[data-copy-recipe]').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(q('#recipe-code').textContent); q('#copy-status').textContent = '已复制调用方式。'; }
    catch { const selection = getSelection(), range = document.createRange(); range.selectNodeContents(q('#recipe-code')); selection.removeAllRanges(); selection.addRange(range); q('#copy-status').textContent = '已选中代码，请手动复制。'; }
  });
})();
