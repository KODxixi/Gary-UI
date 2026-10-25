// 交互层：配方里声明 ["theme","palette","gutters","print"]，这里按声明注入 CSS/JS/标记。
// 原则：交互也只组合原语，不引入新材质。

export const INTERACTION_CSS = `
  .topbar__btn, .topbar .iconbtn{position:relative}
  .topbar__btn::after, .topbar .iconbtn::after{content:"";position:absolute;inset:-11px -8px;border-radius:8px}
  .topbar__btn{appearance:none;border:1px solid var(--line);background:transparent;color:var(--muted);
    height:22px;padding:0 8px;border-radius:6px;font:inherit;font-size:11px;cursor:pointer}
  .topbar__btn:hover{background:var(--line2);color:var(--ink)}
  .cols:has(> .gutter){gap:0}
  .gutter{flex:0 0 var(--gap);position:relative;cursor:col-resize;touch-action:none;border:0;background:transparent;padding:0}
  .gutter::before{content:"";position:absolute;top:50%;left:50%;width:4px;height:72px;border-radius:99px;
    background:var(--ink);opacity:0;transform:translate(-50%,-50%) scaleY(.4);
    transition:opacity .16s ease,transform .26s var(--ease, cubic-bezier(.22,.61,.36,1))}
  .gutter:hover::before,.gutter:focus-visible::before{opacity:.42;transform:translate(-50%,-50%) scaleY(1)}
  .gutter[data-drag="1"]::before{opacity:.85;background:var(--accent)}
  body[data-resizing],body[data-resizing] *{cursor:col-resize!important;user-select:none!important}
  @media (max-width:900px){.gutter{display:none}}
`;

export const PRINT_CSS = `
  @media print{
    .topbar,.gutter,.scrim,.palette{display:none!important}
    html,body{background:#fff!important;color:#000!important}
    .wrap{overflow:visible;padding:0}
    .article{display:block}
    .toc{display:none}
    .chapter,.panel,.cover{break-inside:avoid}
    .body,.chapter p{color:#000!important}
  }
`;

export const PALETTE_MARKUP = `
<div class="scrim" id="scrim"></div>
<div class="palette" id="palette" role="dialog" aria-modal="true" aria-label="命令">
  <input id="palInput" type="text" placeholder="搜索…" role="combobox" aria-expanded="true" aria-controls="plist" autocomplete="off">
  <div class="plist" id="plist" role="listbox"></div>
</div>`;

export const INTERACTION_JS = `
(function(){
  var cmds = window.__GARY_CMDS__ || [];
  var i;
  function syncThemeBtn(){ var b = document.getElementById('themeBtn'); if (b) b.textContent = document.documentElement.dataset.theme === 'dark' ? '亮' : '暗'; }
  syncThemeBtn();

  /* 主题 */
  var themeBtn = document.getElementById('themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function(){
    var root = document.documentElement;
    var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    themeBtn.textContent = next === 'dark' ? '亮' : '暗';
    try { localStorage.setItem('gary.theme', next); } catch(e){}
  });
  try { var saved = localStorage.getItem('gary.theme'); if (saved === 'light') { document.documentElement.dataset.theme = 'light'; if (themeBtn) themeBtn.textContent = '暗'; } } catch(e){}

  /* 命令面板 */
  var pal = document.getElementById('palette'), scrim = document.getElementById('scrim');
  if (pal) {
    var input = document.getElementById('palInput'), list = document.getElementById('plist'), idx = 0, items = [];
    function paint(q){
      items = cmds.filter(function(c){ return c.k.toLowerCase().indexOf(q.toLowerCase()) > -1; });
      idx = 0; list.innerHTML = '';
      if (!items.length) { list.innerHTML = '<div class="pitem" style="color:var(--dim)">没有匹配</div>'; return; }
      items.forEach(function(c, n){
        var d = document.createElement('div');
        d.className = 'pitem'; d.setAttribute('role','option');
        d.setAttribute('aria-selected', String(n === idx));
        var s = document.createElement('span'); s.textContent = c.k;
        var t = document.createElement('span'); t.className = 'tag'; t.textContent = c.tag || '';
        d.appendChild(s); d.appendChild(t);
        d.addEventListener('click', function(){ close(); c.fn(); });
        list.appendChild(d);
      });
    }
    function open(){ pal.classList.add('on'); scrim.classList.add('on'); input.value=''; paint(''); setTimeout(function(){input.focus();},20); }
    function close(){ pal.classList.remove('on'); scrim.classList.remove('on'); }
    window.__garyOpenPalette = open;
    input.addEventListener('input', function(e){ paint(e.target.value); });
    scrim.addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); return; }
      if (!pal.classList.contains('on')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); if (!items.length) return;
        idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        [].forEach.call(list.children, function(el, n){ el.setAttribute('aria-selected', String(n === idx)); });
        return;
      }
      if (e.key === 'Enter' && items[idx]) { e.preventDefault(); var c = items[idx]; close(); c.fn(); }
    });
    var openBtn = document.getElementById('cmdBtn');
    if (openBtn) openBtn.addEventListener('click', open);
  }

  /* 拖拽分隔条 */
  var gutters = document.querySelectorAll('.gutter');
  [].forEach.call(gutters, function(g){
    var side = g.dataset.side;
    var target = side === 'left' ? document.getElementById('sidePane')
               : side === 'right' ? document.getElementById('mainPane') : null;
    if (!target) return;
    var min = side === 'left' ? 180 : 320, max = side === 'left' ? 380 : 1100;
    var startX = 0, startW = 0, live = false;
    g.addEventListener('pointerdown', function(e){
      e.preventDefault(); g.setPointerCapture(e.pointerId);
      g.dataset.drag = '1'; document.body.dataset.resizing = '1';
      startX = e.clientX; startW = target.getBoundingClientRect().width; live = true;
    });
    g.addEventListener('pointermove', function(e){
      if (!live) return;
      var d = side === 'left' ? e.clientX - startX : startX - e.clientX;
      target.style.width = Math.max(min, Math.min(max, Math.round(startW + d))) + 'px';
      target.style.flex = 'none';
    });
    function end(e){ if (!live) return; live = false; g.dataset.drag='0'; delete document.body.dataset.resizing;
      try { g.releasePointerCapture(e.pointerId); } catch(err){} }
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('keydown', function(e){
      var dir = e.key === 'ArrowLeft' ? -16 : e.key === 'ArrowRight' ? 16 : 0;
      if (!dir) return; e.preventDefault();
      var cur = target.getBoundingClientRect().width;
      target.style.width = Math.max(min, Math.min(max, cur + (side === 'left' ? dir : -dir))) + 'px';
      target.style.flex = 'none';
    });
  });
})();
`;

