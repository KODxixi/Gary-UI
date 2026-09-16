(() => {
  'use strict';
  const base=new URL('.',document.currentScript.src),scene=document.querySelector('[data-gary-background-host],.demo-global-scene');
  if(!scene)return;
  const root=document.documentElement;
  const CSS_BACKGROUNDS=new Set(['aurora-bloom','prism-veil','mercury-orbit']);
  const BACKGROUND_LABELS=Object.freeze({'aurora-bloom':'极光薄雾','prism-veil':'棱镜幕帘','mercury-orbit':'银色轨道'});
  const open=document.querySelector('[data-background-open]')||document.createElement('button');
  if(!open.isConnected){open.className='button gary-background-launcher';open.dataset.backgroundOpen='';open.textContent='背景实验室';document.body.append(open);}
  open.setAttribute('aria-controls','gary-background-lab');open.setAttribute('aria-expanded','false');
  const panel=document.createElement('dialog');panel.id='gary-background-lab';panel.className='gary-background-lab';panel.setAttribute('aria-labelledby','background-lab-title');
  panel.innerHTML=`<header><div><p class="eyebrow">SCENE STUDIO</p><h2 id="background-lab-title">让背景有呼吸</h2></div><button class="button" data-background-close aria-label="关闭背景实验室">关闭</button></header>
    <p class="gary-background-intro">在真实页面上调节 不改变全局默认</p>
    <div class="gary-wave-switches"><label><input type="checkbox" name="pointerEffects"> 鼠标光影（默认关闭）</label></div>
    <div class="gary-background-choice"><label>背景<select name="background"><option value="dot-grid">点状网格 默认</option><option value="gradient-waves">动态海浪（原版引擎）</option><option value="aurora-bloom">极光薄雾</option><option value="prism-veil">棱镜幕帘</option><option value="mercury-orbit">银色轨道</option></select></label><label>配色<select name="preset"><option value="gary">Gary 柔光</option><option value="silver" selected>银色三浪</option><option value="original">原版紫粉</option><option value="custom" disabled>自定义</option></select></label></div>
    <p data-waves-status role="status" aria-live="polite">当前使用默认点状网格</p>
    <section class="gary-local-media" aria-label="自定义背景素材">
      <label class="gary-media-file">本地照片或视频<input data-media-file type="file" accept="image/png,image/jpeg,image/webp,image/avif,video/mp4,video/webm,video/ogg"></label>
      <p class="gary-wave-help">仅本机预览 不上传 刷新后重新选择<br>照片最多 40 MB 视频最多 300 MB 支持格式取决于浏览器</p>
      <p data-media-status role="status" aria-live="polite">未选择素材</p>
      <div data-media-settings hidden>
        <label class="gary-wave-range">素材不透明度<output>0.35</output><input name="mediaOpacity" aria-label="素材不透明度" type="range" min="0.05" max="1" step="0.05" value="0.35"></label>
        <label>画面适配<select name="mediaFit"><option value="cover">铺满并裁切</option><option value="contain">完整显示</option></select></label>
        <div class="gary-wave-actions"><button class="button" data-media-pause hidden>暂停视频</button><button class="button" data-media-clear>清除素材</button></div>
      </div>
    </section>
    <label class="gary-wave-range">玻璃折射强度<output>180</output><input name="refractionStrength" aria-label="玻璃折射强度" type="range" min="0" max="300" step="10" value="180"></label>
    <div data-waves-settings hidden><div class="gary-wave-colors"></div><div class="gary-wave-primary"></div>
    <details><summary>更多参数</summary><div class="gary-wave-advanced"></div></details>
    <div class="gary-wave-switches"><label><input type="checkbox" name="grain"> 细腻颗粒</label><label>细节<select name="detail"><option value="low">低</option><option value="medium">中</option><option value="high">高</option></select></label></div>
    <div class="gary-wave-actions"><button class="button" data-waves-pause>暂停</button><button class="button" data-waves-replay>重播</button><button class="button" data-waves-reset>恢复配方</button></div>
    <div class="gary-wave-actions"><button class="button" data-waves-export>导出配置</button><button class="button" data-waves-png>保存背景 PNG</button><button class="button" data-waves-retry hidden>重新加载</button></div>
    <p class="gary-wave-help">默认持续播放 可随时暂停 页面不可见时暂停渲染<br>适合封面与展示 阅读和分析保留网格</p></div>
    <footer><a href="${new URL('../../LICENSE',base)}">MIT 许可</a><a href="${new URL('SURFACES.md',base)}">来源与本地接入</a></footer>`;
  document.body.append(panel);
  const q=s=>panel.querySelector(s);
  q('[name="background"]').add(new Option('自定义素材','custom-media'));
  let media=null,mediaTicket=0,userPaused=false,mediaVisible=true,mediaPrinting=false;
  const reducedMedia=matchMedia('(prefers-reduced-motion: reduce)');
  const mediaMessage=text=>{q('[data-media-status]').textContent=text;};
  const syncAmbientMotion=()=>{scene.dataset.garyBackgroundMotion=CSS_BACKGROUNDS.has(scene.dataset.garyBackground)&&!reducedMedia.matches&&!document.hidden&&mediaVisible?'playing':'static';};
  function disposeMedia(item){if(!item)return;if(item.node.tagName==='VIDEO'){item.node.pause();item.node.removeAttribute('src');item.node.load();}item.node.remove();if(item.url)URL.revokeObjectURL(item.url);}
  function mediaPlayback(){
    if(!media)return;const video=media.node.tagName==='VIDEO',active=scene.dataset.garyBackground==='custom-media';
    media.node.hidden=!active;q('[data-media-pause]').hidden=!video;
    if(!video)return;
    const blocked=reducedMedia.matches||document.hidden||!mediaVisible||mediaPrinting||!active;
    q('[data-media-pause]').disabled=reducedMedia.matches;
    q('[data-media-pause]').textContent=userPaused?'播放视频':'暂停视频';
    if(blocked||userPaused)media.node.pause();
    else {const current=media;current.node.play().catch(()=>{if(current!==media||current.node.paused&&(document.hidden||reducedMedia.matches||!mediaVisible||mediaPrinting||!active||userPaused))return;userPaused=true;q('[data-media-pause]').textContent='播放视频';mediaMessage('浏览器阻止自动播放 请点击播放视频');});}
    mediaMessage(media.name+(reducedMedia.matches?' · 减弱动态 静态画面':blocked?' · 暂停渲染':userPaused?' · 已暂停':' · 静音循环播放'));
  }
  async function chooseMedia(file){
    if(!file)return;
    const ticket=++mediaTicket,isImage=['image/png','image/jpeg','image/webp','image/avif'].includes(file.type),isVideo=['video/mp4','video/webm','video/ogg'].includes(file.type);
    if(!isImage&&!isVideo){mediaMessage('不支持此格式 请选择 PNG JPEG WebP AVIF 或 MP4 WebM Ogg');return;}
    if(file.size>(isImage?40:300)*1024*1024){mediaMessage('素材超过大小限制 当前背景保持不变');return;}
    const candidate={node:document.createElement(isVideo?'video':'img'),url:URL.createObjectURL(file),name:file.name};
    const node=candidate.node;node.className='gary-custom-media';node.setAttribute('aria-hidden','true');
    if(isVideo){node.muted=true;node.loop=true;node.playsInline=true;node.preload='auto';}else node.alt='';
    mediaMessage('正在验证本地素材');
    try{
      await new Promise((resolve,reject)=>{const timer=setTimeout(()=>finish(Error('读取超时')),15000);const finish=error=>{clearTimeout(timer);node.onload=node.onloadeddata=node.onerror=null;error?reject(error):resolve();};node.onload=()=>finish();node.onloadeddata=()=>finish();node.onerror=()=>finish(Error('无法解码'));node.src=candidate.url;});
      if(ticket!==mediaTicket){disposeMedia(candidate);return;}
      const old=media;media=candidate;userPaused=false;scene.append(node);disposeMedia(old);
      q('[data-media-settings]').hidden=false;mediaMessage(file.name+' · 本地素材');await select('custom-media',true);
    }catch(error){disposeMedia(candidate);if(ticket===mediaTicket)mediaMessage('加载失败 '+error.message+' 当前背景保持不变');}
  }
  q('[data-media-file]').addEventListener('change',e=>{chooseMedia(e.target.files[0]);e.target.value='';});
  q('[data-media-clear]').addEventListener('click',()=>{mediaTicket++;disposeMedia(media);media=null;q('[data-media-settings]').hidden=true;mediaMessage('素材已清除');select('dot-grid');});
  q('[data-media-pause]').addEventListener('click',()=>{userPaused=!userPaused;mediaPlayback();});
  q('[name="mediaFit"]').addEventListener('change',e=>scene.style.setProperty('--gary-media-fit',e.target.value));
  q('[name="mediaOpacity"]').addEventListener('input',e=>{scene.style.setProperty('--gary-media-opacity',e.target.value);e.target.parentElement.querySelector('output').textContent=e.target.value;});
  q('[name="refractionStrength"]').addEventListener('input',e=>{window.GaryGlassSurface?.setStrength(e.target.value);e.target.parentElement.querySelector('output').textContent=e.target.value;});
  reducedMedia.addEventListener('change',()=>{mediaPlayback();syncPointerEffects();syncAmbientMotion();});document.addEventListener('visibilitychange',()=>{mediaPlayback();syncAmbientMotion();});
  new IntersectionObserver(([entry])=>{mediaVisible=entry.isIntersecting;mediaPlayback();syncAmbientMotion();}).observe(scene);
  addEventListener('beforeprint',()=>{mediaPrinting=true;mediaPlayback();});addEventListener('afterprint',()=>{mediaPrinting=false;mediaPlayback();});
  let engine=null,loading=null,request=0,preset='silver',options=null;
  const pointerEnabled=()=>root.dataset.garyPointerEffects==='on'&&!reducedMedia.matches;
  function syncPointerEffects(){
    q('[name="pointerEffects"]').checked=root.dataset.garyPointerEffects==='on';
    const enabled=pointerEnabled();
    if(options)options={...options,mouseInteraction:enabled};
    if(engine&&engine.state.options.mouseInteraction!==enabled)engine.update({mouseInteraction:enabled});
  }
  q('[name="pointerEffects"]').addEventListener('change',event=>{
    root.dataset.garyPointerEffects=event.target.checked?'on':'off';
    dispatchEvent(new CustomEvent('gary:pointer-effects-change',{detail:{enabled:event.target.checked}}));
  });
  addEventListener('gary:pointer-effects-change',syncPointerEffects);
  new MutationObserver(syncPointerEffects).observe(root,{attributes:true,attributeFilter:['data-gary-pointer-effects']});
  const colorNames={horizonColor:'地平线',waveColor:'波面',crestColor:'浪尖'};
  const labels={speed:'速度',amplitude:'波幅',waveScale:'波纹尺度',waveRatio:'波纹比例',swell:'涌动',turbulence:'扰动',tilt:'倾角',zoom:'缩放',height:'地平线高度',fogDepth:'雾深',brightness:'亮度',opacity:'不透明度',parallaxStrength:'视差强度',grainIntensity:'颗粒强度'};
  const statusLabels={playing:'持续播放中 可随时暂停',paused:'已暂停 保留当前画面',complete:'播放完成 已停留于静帧',static:'速度为零 静态预览','reduced-motion':'减弱动态已开启 静态波面 无鼠标视差',suspended:'页面不可见 已暂停',print:'打印使用纯色底',fallback:'背景渲染不可用 已保留网格 可重新加载'};
  function syncStatus(){
    if(!engine)return;const state=engine.state;
    scene.dataset.garyBackground=state.status==='fallback'?'dot-grid':'gradient-waves';
    q('[data-waves-status]').textContent=statusLabels[state.status]||state.status;
    q('[data-waves-pause]').textContent=state.status==='paused'||state.status==='complete'?'播放':'暂停';
    const unavailable=['reduced-motion','fallback','static'].includes(state.status);
    q('[data-waves-pause]').disabled=unavailable;q('[data-waves-replay]').disabled=unavailable;
    q('[data-waves-png]').disabled=state.status==='fallback';q('[data-waves-retry]').hidden=state.status!=='fallback';
  }
  function syncCssStatus(background){
    scene.dataset.garyBackground=background;syncAmbientMotion();
    q('[data-waves-status]').textContent=`${BACKGROUND_LABELS[background]} · ${reducedMedia.matches?'静态预览':'低速动态'} · 玻璃友好`;
  }
  scene.addEventListener('gary-waves-status',syncStatus);
  function recipe(name){
    const light=root.dataset.garyTheme==='light';
    const calm={...GaryGradientWaves.defaults,mouseInteraction:pointerEnabled(),speed:.15,amplitude:2.5,grain:false,opacity:light?.32:.42,parallaxStrength:.2,detail:innerWidth<600?'low':'medium'};
    if(name==='original')return {...GaryGradientWaves.defaults,mouseInteraction:pointerEnabled(),opacity:light?.35:.6,detail:calm.detail};
    if(name==='silver')return {...recipe('gary'),speed:.1,amplitude:2,waveScale:1.35,waveRatio:.6,tilt:1.12,zoom:1,height:10,fogDepth:20,brightness:1.1,opacity:light?.32:.47,parallaxStrength:.85,grain:true,grainIntensity:.01,horizonColor:light?'#b8c1cb':'#455164',waveColor:light?'#627389':'#8193ab',crestColor:light?'#c1cad6':'#dbe4ef'};
    return {...calm,amplitude:2.6,waveRatio:1,swell:0,turbulence:50,tilt:1.23,zoom:1.4,height:11,detail:'medium',opacity:light?.32:.6,parallaxStrength:0,grain:true,grainIntensity:.02,horizonColor:light?'#bec6ef':'#282d60',waveColor:light?'#8799d8':'#6976ad',crestColor:light?'#d1daf5':'#c1cce6'};
  }
  function fields(){
    if(q('[name="speed"]'))return;
    for(const [key,label] of Object.entries(colorNames)){
      const wrap=document.createElement('label');wrap.innerHTML=`<span>${label}</span><input type="color" name="${key}" aria-label="${label}颜色"><output></output>`;q('.gary-wave-colors').append(wrap);
    }
    for(const [key,[min,max,step]] of Object.entries(GaryGradientWaves.ranges)){
      const wrap=document.createElement('label');wrap.className='gary-wave-range';wrap.htmlFor='waves-'+key;wrap.innerHTML=`<span>${labels[key]}</span><output for="waves-${key}" aria-hidden="true"></output><input id="waves-${key}" type="range" name="${key}" min="${min}" max="${max}" step="${step}" aria-label="${labels[key]}">`;
      q(['speed','amplitude','opacity','waveScale'].includes(key)?'.gary-wave-primary':'.gary-wave-advanced').append(wrap);
    }
    panel.querySelectorAll('[data-waves-settings] input,[data-waves-settings] select').forEach(input=>input.addEventListener('input',()=>{
      const value=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;
      options=GaryGradientWaves.normalize({[input.name]:value},options);preset='custom';q('[name="preset"]').value=preset;paintFields();engine?.update(options);syncStatus();
    }));
  }
  function paintFields(){
    for(const [key,value] of Object.entries(options||{})){
      const input=q('[name="'+key+'"]');if(!input)continue;
      if(input.type==='checkbox')input.checked=value;else input.value=value;
      const output=input.parentElement.querySelector('output');if(output)output.textContent=String(value);
    }
  }
  function ensureEngine(){
    if(window.GaryGradientWaves)return Promise.resolve();
    if(!loading)loading=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src=new URL('gradient-waves.js',base);
      script.onload=resolve;script.onerror=()=>{loading=null;script.remove();reject(Error('本地波浪脚本加载失败 当前网格保持不变'));};document.head.append(script);
    });return loading;
  }
  async function select(background,fromMedia=false){
    if(!fromMedia)mediaTicket++;
    const supported=['dot-grid','gradient-waves','custom-media',...CSS_BACKGROUNDS];
    if(!supported.includes(background))background='dot-grid';
    const token=++request;engine?.destroy();engine=null;
    scene.dataset.garyBackground='dot-grid';syncAmbientMotion();q('[name="background"]').value=background;
    q('[data-waves-settings]').hidden=background!=='gradient-waves';q('[name="preset"]').disabled=background!=='gradient-waves';
    if(background==='custom-media'){
      scene.dataset.garyBackground=media?'custom-media':'dot-grid';mediaPlayback();syncAmbientMotion();
      q('[data-waves-status]').textContent=media?'当前使用自定义素材':'选择本地照片或视频后生效 当前保留网格';return;
    }
    mediaPlayback();
    if(CSS_BACKGROUNDS.has(background)){syncCssStatus(background);return;}
    if(background!=='gradient-waves'){q('[data-waves-status]').textContent='当前使用默认点状网格';return;}
    q('[data-waves-status]').textContent='正在加载原版动态海浪';
    try{
      await ensureEngine();if(token!==request)return;fields();options||=recipe(preset);
      syncPointerEffects();paintFields();engine=GaryGradientWaves.mount(scene,options,{durationSeconds:null});syncStatus();
    }catch(error){
      q('[data-waves-status]').textContent=error.message+' 请切回网格后重试';
      q('[data-waves-settings]').hidden=true;q('[name="preset"]').disabled=true;
    }
  }
  function close(){panel.close();open.setAttribute('aria-expanded','false');open.focus();}
  open.addEventListener('click',()=>{syncPointerEffects();paintFields();panel.show();open.setAttribute('aria-expanded','true');q('[name="background"]').focus();});
  q('[data-background-close]').addEventListener('click',close);
  panel.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();close();}
    if(e.key==='Tab'){
      const items=[...panel.querySelectorAll('button,input,select,a,summary')].filter(el=>!el.disabled&&el.getClientRects().length);
      if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}
      else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
    }
  });
  q('[name="background"]').addEventListener('change',e=>select(e.target.value));
  q('[name="preset"]').addEventListener('change',e=>{preset=e.target.value;options=recipe(preset);paintFields();engine?.update(options);});
  q('[data-waves-pause]').addEventListener('click',()=>{if(['paused','complete'].includes(engine?.state.status))engine.play();else engine?.pause();syncStatus();});
  q('[data-waves-replay]').addEventListener('click',()=>engine?.replay());
  q('[data-waves-reset]').addEventListener('click',()=>{preset='silver';q('[name="preset"]').value=preset;options=recipe(preset);paintFields();engine?.update(options);});
  q('[data-waves-retry]').addEventListener('click',()=>select('gradient-waves'));
  function download(url,name){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
  q('[data-waves-export]').addEventListener('click',()=>{
    const config={schemaVersion:1,engine:'gradient-waves',implementation:'gary-webgl-gradient-waves-1',theme:root.dataset.garyTheme,preset,options,playback:{mode:'continuous',durationSeconds:null,reducedMotion:'static'},globalDefaultChanged:false};
    const url=URL.createObjectURL(new Blob([JSON.stringify(config,null,2)],{type:'application/json'}));download(url,'gary-gradient-waves.json');setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  q('[data-waves-png]').addEventListener('click',()=>{try{download(engine.snapshot(),'gary-gradient-waves.png');}catch(error){q('[data-waves-status]').textContent=error.message;}});
  addEventListener('gary-theme-change',()=>{if(engine&&preset!=='custom'){options=recipe(preset);paintFields();engine.update(options);}});
  addEventListener('pagehide',()=>{engine?.destroy();mediaPrinting=true;mediaPlayback();});
  addEventListener('pageshow',event=>{if(event.persisted){mediaPrinting=false;select(q('[name="background"]').value);}});
  window.GaryBackgroundLab={get engine(){return engine;},select};
  syncPointerEffects();
  const requestedBackground=new URLSearchParams(location.search).get('background');
  select(['gradient-waves',...CSS_BACKGROUNDS].includes(requestedBackground)?requestedBackground:'dot-grid');
  if(new URLSearchParams(location.search).get('customize')==='1')open.click();
})();
