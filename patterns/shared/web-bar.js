(() => {
  'use strict';
  const current=document.currentScript;
  const logo=new URL('./gary-architecture.svg',current.src).href;
  const bars=[...document.querySelectorAll('.demo-nav,.portal-topbar')];
  for(const bar of bars){
    bar.dataset.garyHeader='true';
    const mark=bar.querySelector('.brand-mark,.topbar-mark');
    if(mark){mark.textContent='';mark.classList.add('gary-brand-icon');mark.setAttribute('aria-hidden','true');const image=document.createElement('img');image.src=logo;image.alt='';image.width=30;image.height=30;mark.append(image);}
    if(bar.matches('.demo-nav')){
      const links=bar.querySelector('.demo-nav__links');
      if(links){
        links.id='demo-header-links';
        const toggle=document.createElement('button');toggle.type='button';toggle.className='gary-header-menu icon-button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls',links.id);
        bar.querySelector('.demo-actions').append(toggle);
        const paint=open=>{toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'关闭菜单':'菜单');toggle.title=open?'关闭菜单':'菜单';toggle.innerHTML='<span data-icon=\"'+(open?'x':'menu')+'\"></span>';window.GaryDemoIcons?.(toggle);};
        paint(false);
        const close=()=>{links.classList.remove('is-open');paint(false)};
        toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';links.classList.toggle('is-open',open);paint(open)});
        links.addEventListener('click',e=>{if(e.target.closest('a'))close()});
        bar.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus()}});
        document.addEventListener('click',e=>{if(!e.composedPath().includes(bar))close()});
      }
    }
  }
  let scheduled=false;
  const update=()=>{scheduled=false;for(const bar of bars)bar.classList.toggle('is-scrolled',scrollY>80)};
  addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}},{passive:true});
  addEventListener('pageshow',update);update();
})();
