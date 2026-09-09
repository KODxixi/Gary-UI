import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';
const base=(process.env.GARY_UI_BASE_URL||'http://127.0.0.1:4191').replace(/\/+$/, '');
const out=process.env.GARY_UI_CAPTURE_DIR||fs.mkdtempSync(path.join(os.tmpdir(),'gary-surface-light-'));
fs.mkdirSync(out,{recursive:true});
const repoRoot=fileURLToPath(new URL('..',import.meta.url));
const gitPrefix=execFileSync('git',['rev-parse','--show-prefix'],{cwd:repoRoot,encoding:'utf8'}).trim();
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||chromium.executablePath(),headless:true});
const checks=[],errors=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name);};
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const html=`<!doctype html><html data-gary-theme="dark"><head><meta charset="utf-8"><link rel="stylesheet" href="/tokens/base.css"><style>body{margin:0;background:var(--gary-surface-page);min-height:1100px}#scope{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:40px;margin:32px;min-height:360px}article,a{display:block;padding:30px;min-height:250px}p{font-size:16px}strong{font-size:54px;font-weight:400}#scope2{margin:32px;padding:28px;width:400px;min-height:250px}#plain{position:relative;width:300px;margin:32px}#reference{position:absolute;inset:100px 10px 150px;background:linear-gradient(100deg,#527594,#97a6a5);z-index:-1}</style></head><body><section id="scope" data-gary-light-scope><div id="reference" aria-hidden="true"></div><article id="solid" class="gary-glass-card" data-gary-surface="solid"><p>分析底板</p><strong>128</strong><p>同一组内容</p></article><article id="frost" class="gary-metric-card" data-gary-surface="frosted"><p>中性磨砂</p><strong>128</strong><p>同一组内容</p></article><a id="optical" href="#clicked" class="gary-glass-card" data-gary-surface="optical"><p>清透折射</p><strong>128</strong><p>同一组内容</p></a></section><section id="scope2" data-gary-light-scope><article data-gary-surface="optical"><p>另一空间</p><strong>128</strong></article></section><a id="plain" href="#plain" data-gary-material="glass" data-gary-refraction>旧卡片</a><script src="/patterns/shared/material.js"></script><script src="/patterns/shared/optical-glass.js"></script></body></html>`;
async function fixture(options={}){
 const page=await browser.newPage({viewport:{width:1200,height:950},...options});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/__surface-fixture.html*',route=>route.fulfill({contentType:'text/html',body:html}));
 await page.goto(base+'/__surface-fixture.html'+(options.query||''),{waitUntil:'networkidle'});await frame(page);return page;
}
const surfaces=page=>page.evaluate(()=>Object.fromEntries(['solid','frost','optical'].map(id=>{const el=document.getElementById(id),css=getComputedStyle(el);return[id,{marker:el.dataset.garyMaterial,refraction:el.hasAttribute('data-gary-refraction'),state:el.dataset.garyRefractionState,background:css.backgroundColor,filter:css.backdropFilter,shadow:css.boxShadow,after:getComputedStyle(el,'::after').opacity,before:getComputedStyle(el,'::before').content}];})));
try{
 const page=await fixture();let state=await surfaces(page);
 check('Explicit solid beats automatic GlassCard routing',state.solid.marker==='solid-plate'&&!state.solid.refraction&&state.solid.filter==='none');
 check('Explicit frosted beats automatic MetricCard routing',state.frost.marker==='regular'&&!state.frost.refraction&&state.frost.filter==='blur(18px) saturate(0.75)');
 check('Explicit optical uses existing SVG background refraction',state.optical.marker==='glass'&&state.optical.refraction&&state.optical.state==='svg'&&state.optical.filter.includes('url('));
 check('Approved dark surface strength retained',state.solid.background==='rgb(16, 16, 18)'&&state.frost.background==='rgba(18, 20, 24, 0.56)'&&state.optical.background==='rgba(10, 14, 20, 0.38)');
 check('One injected light per scope',await page.locator('.gary-surface-light').count()===2);
 const box=await page.locator('#optical').boundingBox();await page.mouse.move(box.x+100,box.y+100);await frame(page);
 check('New light remains off by default',await page.locator('#scope').evaluate(el=>getComputedStyle(el.querySelector('.gary-surface-light')).opacity==='0')&&(await surfaces(page)).optical.after==='0');
 await page.screenshot({path:out+'/dark-static.png',fullPage:true});
 await page.evaluate(()=>document.documentElement.dataset.garyPointerEffects='on');await frame(page);await page.mouse.move(box.x+110,box.y+110);await frame(page);
 const light=await page.locator('#optical').evaluate(el=>{const scope=el.closest('[data-gary-light-scope]'),box=el.getBoundingClientRect(),outer=scope.getBoundingClientRect();return{scopeX:parseFloat(scope.style.getPropertyValue('--gary-scene-light-x'))+outer.left,cardX:parseFloat(el.style.getPropertyValue('--gary-light-x'))+box.left,scopeY:parseFloat(scope.style.getPropertyValue('--gary-scene-light-y'))+outer.top,cardY:parseFloat(el.style.getPropertyValue('--gary-light-y'))+box.top,active:getComputedStyle(el,'::after').opacity,animation:getComputedStyle(el,'::after').animationName,before:getComputedStyle(el,'::before').content,transform:getComputedStyle(el).transform,frontFilter:getComputedStyle(el.querySelector('strong')).filter,frontShadow:getComputedStyle(el.querySelector('strong')).textShadow};});
 check('Background and card use exactly one screen-space light position',light.scopeX===light.cardX&&light.scopeY===light.cardY&&light.active==='1');
 check('Light stays on the rim: no foreground glow, filter, tilt, orbit',light.before==='none'&&light.animation==='none'&&light.transform==='none'&&light.frontFilter==='none'&&light.frontShadow==='none');
 check('Other scope stays unlit',await page.locator('#scope2 .gary-surface-light').evaluate(el=>getComputedStyle(el).opacity==='0'));
 check('Solid/frosted data surfaces do not receive linked edge glow',await page.locator('#solid').evaluate(el=>!el.style.getPropertyValue('--gary-light-active'))&&await page.locator('#frost').evaluate(el=>!el.style.getPropertyValue('--gary-light-active')));
 await page.screenshot({path:out+'/dark-linked.png',fullPage:true});
 const lightValue=await page.locator('#optical').getAttribute('style');await page.waitForTimeout(100);check('No idle autonomous light animation',await page.locator('#optical').getAttribute('style')===lightValue);
 await page.evaluate(()=>document.documentElement.dataset.garyPointerEffects='off');await frame(page);check('Off clears scope and card coordinates without residual light',await page.locator('#optical').evaluate(el=>!el.style.getPropertyValue('--gary-light-x')&&getComputedStyle(el,'::after').opacity==='0')&&await page.locator('#scope').evaluate(el=>!el.style.getPropertyValue('--gary-scene-light-x')));
 await page.evaluate(()=>document.documentElement.dataset.garyTheme='light');state=await surfaces(page);check('Approved light surface strength retained',state.solid.background==='rgb(245, 245, 247)'&&state.frost.background==='rgba(255, 255, 255, 0.65)'&&state.optical.background==='rgba(255, 255, 255, 0.54)');
 await page.screenshot({path:out+'/light-static.png',fullPage:true});
 await page.evaluate(()=>document.documentElement.dataset.garyPointerEffects='on');await frame(page);await page.mouse.move(box.x+115,box.y+115);await frame(page);await page.emulateMedia({reducedMotion:'reduce'});await frame(page);
 check('Reduced motion resets linked light with static material intact',(await surfaces(page)).optical.after==='0'&&(await surfaces(page)).optical.state==='svg');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(box.x+118,box.y+118);await frame(page);await page.emulateMedia({media:'print'});await frame(page);
 state=await surfaces(page);check('Print resets light and removes material filters',Object.values(state).every(s=>s.filter==='none'&&s.background==='rgb(255, 255, 255)')&&await page.locator('.gary-surface-light').first().evaluate(el=>getComputedStyle(el).display==='none'));
 await page.emulateMedia({media:'screen'});await page.mouse.move(box.x+120,box.y+120);await frame(page);await page.evaluate(()=>dispatchEvent(new Event('scroll')));await frame(page);check('Scrolling clears viewport-derived light positions',await page.locator('#optical').evaluate(el=>!el.style.getPropertyValue('--gary-light-x')));
 await page.evaluate(()=>{const card=document.querySelector('#optical');card.dataset.garySurface='frosted';});await frame(page);state=await surfaces(page);check('Runtime optical to frosted releases owned SVG and stays frosted',!state.optical.refraction&&state.optical.filter==='blur(18px) saturate(0.75)'&&await page.locator('#optical .gary-refraction-filter').count()===0);
 await page.evaluate(()=>document.querySelector('#optical').dataset.garySurface='solid');await frame(page);check('Runtime solid removes all background filtering',(await surfaces(page)).optical.filter==='none');
 await page.evaluate(()=>document.querySelector('#optical').dataset.garySurface='optical');await frame(page);check('Runtime optical remounts existing renderer once',(await surfaces(page)).optical.state==='svg'&&await page.locator('#optical .gary-refraction-filter').count()===1);
 await page.locator('#optical').focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');check('New action keeps keyboard focus outline',await page.locator('#optical').evaluate(el=>el.matches(':focus-visible')&&getComputedStyle(el).outlineStyle!=='none'));
 await page.keyboard.press('Enter');check('New optical action still navigates',page.url().endsWith('#clicked'));
 await page.evaluate(()=>document.querySelector('#scope2').removeAttribute('data-gary-light-scope'));await frame(page);check('Removing scope removes its owned background light',await page.locator('#scope2 .gary-surface-light').count()===0);
 await page.evaluate(()=>document.querySelector('#scope2').setAttribute('data-gary-light-scope',''));await frame(page);check('Re-adding scope mounts exactly once',await page.locator('#scope2 .gary-surface-light').count()===1);
 await page.close();
 const fallback=await fixture({query:'?glass=fallback'});state=await surfaces(fallback);check('Forced optical fallback remains frosted and legible',state.optical.state==='fallback'&&state.optical.filter==='blur(12px)'&&state.optical.background==='rgba(10, 14, 20, 0.38)');await fallback.close();
 const touch=await fixture({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});await touch.evaluate(()=>{document.documentElement.dataset.garyPointerEffects='on';dispatchEvent(new PointerEvent('pointermove',{pointerType:'mouse',clientX:150,clientY:160}));});await frame(touch);check('Coarse touch input keeps linked effects disabled',await touch.locator('#scope .gary-surface-light').evaluate(el=>getComputedStyle(el).opacity==='0'));await touch.close();
 const legacy=[];
 for(const original of [true,false]){
  const old=await browser.newPage({viewport:{width:1440,height:1000}});
  if(original)for(const relative of ['components/components.css','patterns/shared/material.js']){
   const body=execFileSync('git',['show','HEAD:'+gitPrefix+relative],{cwd:repoRoot,encoding:'utf8'});
   await old.route('**/'+relative,route=>route.fulfill({contentType:relative.endsWith('.css')?'text/css':'text/javascript',body}));
  }
  await old.goto(base+'/examples/demos/index.html',{waitUntil:'networkidle'});await old.mouse.move(0,0);await old.waitForTimeout(300);legacy.push(await old.screenshot({path:out+`/legacy-${original?'baseline':'current'}.png`}));await old.close();
 }
 check('Approved complete Demo without new attributes is pixel-identical at rest',legacy[0].equals(legacy[1]));
 check('No browser errors',errors.length===0);
 fs.writeFileSync(out+'/acceptance.json',JSON.stringify({status:'pass',checkedAt:new Date().toISOString(),checks,errors},null,2));console.log(JSON.stringify({status:'pass',checks:checks.length,out}));
}finally{await browser.close();}
