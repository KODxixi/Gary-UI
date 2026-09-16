import { chromium } from '../../../../../adapters/visual/node_modules/playwright-core/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL('.', import.meta.url));
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const results=[];
const probe=()=>{
 const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,display:s.display,visibility:s.visibility,overflowX:s.overflowX,text:e.innerText,aria:e.getAttribute('aria-label'),radius:s.borderRadius,background:s.backgroundColor,backgroundImage:s.backgroundImage};};
 const shown=e=>e&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
 const h=document.querySelector('[data-gary-header],.portal-topbar,.demo-nav');
 const children=h?[...h.children].filter(shown):[];
 const overlap=[];for(let i=0;i<children.length;i++)for(let j=i+1;j<children.length;j++){const a=children[i].getBoundingClientRect(),b=children[j].getBoundingClientRect(),w=Math.min(a.right,b.right)-Math.max(a.left,b.left),v=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(w>1&&v>1)overlap.push({a:children[i].className,b:children[j].className,w,h:v});}
 const controls=h?[...h.querySelectorAll('button,a,summary')].filter(shown).map(e=>{const r=e.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;const hit=document.elementFromPoint(x,y);return {tag:e.tagName,class:e.className,...rect(e),centerHit:!!hit&&(e===hit||e.contains(hit)),outside:r.left<0||r.right>innerWidth,svg:e.querySelectorAll('svg').length};}):[];
 return {url:location.href,viewport:{w:innerWidth,h:innerHeight},docWidth:document.documentElement.scrollWidth,header:rect(h),children:children.map(e=>({class:e.className,...rect(e)})),overlap,controls,scene:[...document.querySelectorAll('[data-gary-scene-engine="dot-grid"]')].map(e=>({class:e.className,...rect(e),status:e.dataset.sceneStatus,canvas:e.querySelectorAll('.gary-dot-grid-canvas').length,before:getComputedStyle(e,'::before').backgroundImage,after:getComputedStyle(e,'::after').backgroundImage})),theme:document.documentElement.dataset.garyTheme,backgroundOpen:!!document.querySelector('.gary-background-lab[open]')};
};
try{
 for(const target of ['portal','demo'])for(const width of target==='portal'?[320,390,560,700,701,768,900,1024,1280,1600]:[320,390,768]){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme:'dark',reducedMotion:'reduce'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:4173/'+(target==='portal'?'portal/#demos':'examples/demos/index.html'));await page.waitForTimeout(600);
  const r={target,width,errors,top:await page.evaluate(probe)};
  await page.screenshot({path:out+`${target}-${width}.png`});
  if(target==='portal'&&[320,390,768].includes(width)){
   const frameEl=page.locator('iframe').filter({visible:true});
   const frames=page.frames().filter(f=>f.url().includes('/examples/demos/index.html'));
   if(frames[0]){const frame=frames[0];r.frame=await frame.evaluate(probe);const el=await frame.frameElement();await el.scrollIntoViewIfNeeded();await page.screenshot({path:out+`portal-${width}-embedded.png`});r.frameAfterScroll=await frame.evaluate(probe);}
  }
  const background=page.locator('.gary-background-nav').first();await background.click();r.backgroundClick={theme:(await page.evaluate(probe)).theme,open:await page.locator('.gary-background-lab').evaluate(e=>e.open)};
  await page.keyboard.press('Escape');const theme=page.locator(target==='portal'?'#theme-toggle':'[data-theme-toggle]').first();await theme.click();r.themeClick={theme:(await page.evaluate(probe)).theme,open:await page.locator('.gary-background-lab').evaluate(e=>e.open)};
  if(target==='portal'&&width<=700){await page.locator('#topbar-menu-toggle').click();r.openMenu=await page.evaluate(probe);await page.screenshot({path:out+`portal-${width}-menu.png`});}
  results.push(r);await context.close();
 }
}finally{await browser.close();await writeFile(out+'report.json',JSON.stringify({createdAt:new Date().toISOString(),results},null,2));}
console.log(JSON.stringify(results.map(r=>({target:r.target,width:r.width,overlap:r.top.overlap,outside:r.top.controls.filter(c=>c.outside).map(c=>c.text),obstructed:r.top.controls.filter(c=>!c.centerHit).map(c=>c.text),backgroundClick:r.backgroundClick,themeClick:r.themeClick,frame:r.frame?{width:r.frame.viewport.w,doc:r.frame.docWidth,overlap:r.frame.overlap,controls:r.frame.controls.filter(c=>c.outside||!c.centerHit).map(c=>({text:c.text,rect:c,outside:c.outside}))}:null})),null,2));
