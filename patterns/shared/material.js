(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  if(document.body.classList.contains('gary-ui')){
    if(['dark','light'].includes(params.get('theme')))document.documentElement.dataset.garyTheme=params.get('theme');
    if(['ultrathin','regular','thick','solid-plate'].includes(params.get('material')))document.documentElement.dataset.garyMaterial=params.get('material');
  }
  // Cards use the shared optical material; the page owns the only dot field.
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const mounted=new WeakSet();
  const systemCards='.starter-shell-context.gary-glass,.material-sample.gary-glass,.portal-surface:not(.gallery-toolbar),.review-form,.review-summary,.review-coverage,.review-surface,.pd-live-preview,.mode-card.gary-glass,.pattern-card.gary-glass,.toc-nav.gary-glass,.starter-controls,.starter-preview,.starter-conclusion.gary-glass,.starter-toc-nav.gary-glass,.gary-glass-card:not([data-card-style="custom"]):not(.gary-solid-plate),.gary-metric-card:not(.gary-solid-plate),.gary-media-card:not(.gary-solid-plate),.gary-profile-card:not(.gary-solid-plate)';
  const mount=card=>{
    if(mounted.has(card))return; mounted.add(card);
    card.dataset.garyMaterial='glass';
    if(card.matches(systemCards))card.setAttribute('data-gary-refraction','');
    if(card.matches('a[href],button')&&!card.hasAttribute('aria-disabled')){
      card.dataset.garyCard='action';
      card.addEventListener('pointermove',event=>{
        if(reduced.matches||!fine.matches)return;
        const r=card.getBoundingClientRect();
        card.style.setProperty('--gary-card-x',`${event.clientX-r.left}px`);
        card.style.setProperty('--gary-card-y',`${event.clientY-r.top}px`);
      },{passive:true});
    }

  };
  const scan=(scope=document)=>{
    const selectors='[data-gary-material="glass"],.demo-preview,.glass,.region-tile,'+systemCards;
    if(scope.matches?.(selectors))mount(scope);scope.querySelectorAll?.(selectors).forEach(mount);
  };
  scan();new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n)}))).observe(document.documentElement,{subtree:true,childList:true});
})();
