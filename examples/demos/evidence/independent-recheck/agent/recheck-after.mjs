import { chromium } from '../../../../../adapters/visual/node_modules/playwright-core/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL(process.env.GARY_AUDIT_EVIDENCE || './after/',import.meta.url));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const rows=[];
const measure=()=>{
 const rr=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
 const visible=e=>e.checkVisibility({checkVisibilityCSS:true})&&e.getBoundingClientRect().width>0;
 const bar=document.querySelector('[data-gary-header]');
 const brand=bar.querySelector('.demo-nav__brand,.topbar-leading');
 const bg=bar.querySelector('.gary-background-nav');
 let br=rr(brand),paint=[];
 for(const node of brand.childNodes){if(node.nodeType===3&&node.textContent.trim()){const range=document.createRange();range.selectNode(node);paint.push({...range.getBoundingClientRect().toJSON(),text:node.textContent});}}
 const controls=[...bar.querySelectorAll('a,button,summary')].filter(visible).map(e=>{const r=rr(e),target=document.elementFromPoint(r.x+r.w/2,r.y+r.h/2);return {text:e.textContent.trim(),label:e.getAttribute('aria-label'),class:e.className,...r,svg:e.querySelectorAll('svg').length,hit:target===e||e.contains(target),radius:getComputedStyle(e).borderRadius};});
 return {w:innerWidth,docWidth:document.documentElement.scrollWidth,brand:br,brandPaint:paint,background:rr(bg),overlapPaint:paint.some(p=>p.right>bg.getBoundingClientRect().left),controls,theme:document.documentElement.dataset.garyTheme,bgOpen:!!document.querySelector('.gary-background-lab[open]'),scene:[...document.querySelectorAll('[data-gary-scene-engine="dot-grid"]')].map(e=>({canvas:e.querySelectorAll('.gary-dot-grid-canvas').length,background:getComputedStyle(e).backgroundImage,before:getComputedStyle(e,'::before').backgroundImage,after:getComputedStyle(e,'::after').backgroundImage}))};
};
try{
for(const target of ['portal','demo'])for(const width of target==='portal'?[320,390,700,701,768,900,1024,1100,1101,1280]:[320,390,768]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/'+(target==='portal'?'portal/#demos':'examples/demos/index.html'));await page.waitForTimeout(400);
 const r={target,width,top:await page.evaluate(measure)};await page.screenshot({path:out+`${target}-${width}.png`});
 if(target==='portal'&&[320,390].includes(width)){
  const frame=page.frames().find(f=>f.url().includes('/examples/demos/index.html'));await frame.locator('.gary-background-nav').waitFor();r.frame=await frame.evaluate(measure);await (await frame.frameElement()).scrollIntoViewIfNeeded();await page.screenshot({path:out+`portal-${width}-embedded.png`});
  await frame.locator('.gary-background-nav').click();r.frameBackground=await frame.evaluate(measure);await page.keyboard.press('Escape');await frame.locator('[data-theme-toggle]').click();r.frameTheme=await frame.evaluate(measure);
  await frame.locator('.gary-header-menu').click();r.frameMenu={expanded:await frame.locator('.gary-header-menu').getAttribute('aria-expanded'),svg:await frame.locator('.gary-header-menu svg').count(),links:await frame.locator('.demo-nav__links a:visible').count()};await frame.locator('.gary-header-menu').click();
 }
 if(target==='demo'){
  await page.locator('.gary-header-menu').click();r.demoMenu={expanded:await page.locator('.gary-header-menu').getAttribute('aria-expanded'),svg:await page.locator('.gary-header-menu svg').count(),links:await page.locator('.demo-nav__links a:visible').count()};await page.screenshot({path:out+`demo-${width}-menu.png`});await page.keyboard.press('Escape');
 }
 if(target==='portal'&&width<=1100){
  await page.locator('#topbar-menu-toggle').click();r.portalMenu={expanded:await page.locator('#topbar-menu-toggle').getAttribute('aria-expanded'),navVisible:await page.locator('#top-navigation').isVisible(),icon:await page.locator('#topbar-menu-toggle').getAttribute('data-gary-icon')};await page.screenshot({path:out+`portal-${width}-menu.png`});
  await page.locator('#top-navigation [data-view-target="components"]').click();r.portalNavigation={hash:await page.evaluate(()=>location.hash),componentVisible:await page.locator('[data-view="components"]').isVisible(),expanded:await page.locator('#topbar-menu-toggle').getAttribute('aria-expanded')};
 }
 await page.locator('.gary-background-nav').first().click();r.background={theme:await page.evaluate(()=>document.documentElement.dataset.garyTheme),open:await page.locator('.gary-background-lab').evaluate(e=>e.open)};await page.keyboard.press('Escape');await page.locator(target==='portal'?'#theme-toggle':'[data-theme-toggle]').first().click();r.theme={theme:await page.evaluate(()=>document.documentElement.dataset.garyTheme),open:await page.locator('.gary-background-lab').evaluate(e=>e.open)};
 if(target==='portal'){
  await page.waitForFunction(()=>document.querySelector('#complete-demo-frame').contentDocument?.documentElement.dataset.garyTheme===document.documentElement.dataset.garyTheme,{timeout:5000});
  r.propagatedTheme=await page.evaluate(()=>({outer:document.documentElement.dataset.garyTheme,inner:document.querySelector('#complete-demo-frame').contentDocument.documentElement.dataset.garyTheme,src:document.querySelector('#complete-demo-frame').src}));
 }
 rows.push(r);await context.close();
}
}finally{await browser.close();await writeFile(out+'report.json',JSON.stringify(rows,null,2));}
console.log(JSON.stringify(rows.map(r=>({target:r.target,width:r.width,overflow:r.top.docWidth>r.top.w,paintOverlap:r.top.overlapPaint,obstructed:r.top.controls.filter(c=>!c.hit),frame:r.frame?{width:r.frame.w,doc:r.frame.docWidth,paintOverlap:r.frame.overlapPaint,controls:r.frame.controls.filter(c=>!c.hit),menu:r.frameMenu}:null,menu:r.portalMenu||r.demoMenu,navigation:r.portalNavigation,background:r.background,theme:r.theme})),null,2));
