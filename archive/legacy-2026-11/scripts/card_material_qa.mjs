// Regression coverage for the approved Demo material, circular actions and one dot scene.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';
const out=path.resolve(import.meta.dirname,'../examples/demos/evidence/system-consistency');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
const base='http://127.0.0.1:4173/';
const views=['overview','colors','typography','materials','geometry','components','patterns','demos','visuals','starting-points','product-design','review'];
const templates=['patterns/application-modes/board.html','patterns/application-modes/scroll-report.html','patterns/application-modes/web-ui.html','patterns/report-cover.html','patterns/image-page.html','patterns/data-page.html','patterns/manual-toc.html','patterns/starting-points/index.html','patterns/starting-points/preview.html','examples/visuals/outputs/index.html','examples/demos/visuals/outputs/index.html','examples/demos/index.html'];
try {
 for(const width of [1440,390]) for(const theme of ['dark','light']) {
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(theme=>{
   localStorage.setItem('gary-portal-theme',theme);
   window.__dotDraw={strokes:0,dots:0};
   for(const [method,key] of [['stroke','strokes'],['fill','dots']]) {
    const original=CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method]=function(...args){if(this.canvas.classList.contains('gary-dot-grid-canvas'))window.__dotDraw[key]++;return original.apply(this,args);};
   }
  },theme);
  await context.route(/^https?:\/\//,route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  async function check(url,label) {
   const row={width,theme,page:label};
   try {
    await page.goto(base+url);
    await page.waitForTimeout(220);
    row.proof=await page.evaluate(()=>{
     const visible=e=>e.getClientRects().length>0;
     const actions=[...document.querySelectorAll('[data-gary-icon]')].filter(visible);
     const cards=[...document.querySelectorAll('[data-gary-refraction]')].filter(visible);
     return {theme:document.documentElement.dataset.garyTheme,overflow:document.documentElement.scrollWidth>innerWidth,scenes:[...document.querySelectorAll('[data-gary-scene-engine="dot-grid"]')].filter(visible).map(e=>({canvases:e.querySelectorAll('.gary-dot-grid-canvas').length,background:getComputedStyle(e).backgroundImage,status:e.dataset.sceneStatus})),draw:window.__dotDraw,actions:actions.map(e=>{const s=getComputedStyle(e);return {label:e.ariaLabel,icon:!!e.querySelector('svg'),width:s.width,height:s.height,radius:s.borderRadius};}),cards:cards.map(e=>({state:e.dataset.garyRefractionState,radius:getComputedStyle(e).borderRadius,filter:getComputedStyle(e.querySelector('h2,h3,p,span')||e).filter})),unmounted:[...document.querySelectorAll('.portal-surface:not(.gallery-toolbar),.material-sample.gary-glass,.visual-recipe,.starter-shell-context.gary-glass,.mode-card.gary-glass,.pattern-card.gary-glass,.gary-glass-card:not(.gary-solid-plate):not([data-card-style=custom])')].filter(visible).filter(e=>!e.hasAttribute('data-gary-refraction')).map(e=>e.className),nested:document.querySelectorAll('[data-gary-material="glass"] [data-gary-material="glass"]').length,contours:document.querySelectorAll('[data-card-flow-canvas]').length};
    });
    const p=row.proof;
    assert.equal(p.theme,theme);assert.equal(p.overflow,false);assert.equal(p.nested,0);assert.equal(p.contours,0);assert.deepEqual(p.unmounted,[]);
    assert.equal(p.scenes.length,1);assert.equal(p.draw.strokes,0);assert.ok(p.draw.dots>0);
    for(const s of p.scenes){assert.equal(s.canvases,1);assert.equal(s.background,'none');}
    for(const a of p.actions){assert.ok(a.label&&a.icon);assert.equal(a.width,'44px');assert.equal(a.height,'44px');assert.equal(a.radius,'50%');}
    for(const c of p.cards){assert.equal(c.state,'svg');assert.equal(c.filter,'none');}
    assert.deepEqual(errors,[]);
    row.pass=true;
    if(['components','visuals'].includes(label))await page.screenshot({path:path.join(out,`${label}-${width}-${theme}.png`)});
   } catch(error){row.pass=false;row.error=error.message;}
   results.push(row);
  }
  for(const view of views)await check('portal/#'+view,view);
  // Exercise the actual controls after hydration; state changes must keep the SVG.
  try {
   await page.goto(base+'portal/#components');
   await page.locator('.demo-action').click();assert.equal(await page.locator('.demo-action').getAttribute('data-gary-icon'),'check');assert.equal(await page.locator('.component-item:visible').count(),15);
   await page.locator('#theme-toggle').click();
   assert.equal(await page.locator('html').getAttribute('data-gary-theme'),theme==='light'?'dark':'light');
   assert.equal(await page.locator('#theme-toggle svg').count(),1);
   await page.locator('#theme-toggle').click();
   await page.goto(base+'portal/#materials');await page.locator('#scene-motion-toggle').click();assert.equal(await page.locator('#scene-motion-toggle').getAttribute('aria-pressed'),'true');await page.locator('#scene-motion-toggle').click();
   await page.keyboard.press('Escape');
   const themeBefore=await page.locator('html').getAttribute('data-gary-theme');
   await page.locator('[data-background-open]').click();
   assert.equal(await page.locator('#gary-background-lab').isVisible(),true);
   assert.equal(await page.locator('#gary-background-lab #theme-toggle').count(),0);
   assert.equal(await page.locator('.display-summary').count(),0);
   assert.equal(await page.locator('[data-background-open] svg').count(),0);
   assert.equal(await page.locator('html').getAttribute('data-gary-theme'),themeBefore);
   assert.equal(await page.locator('#gary-background-lab [name=background]').inputValue(),'dot-grid');
   await page.screenshot({path:path.join(out,`background-card-${width}-${theme}.png`)});
   await page.keyboard.press('Escape');
   assert.equal(await page.locator('#gary-background-lab').isVisible(),false);
   assert.equal(await page.locator('[data-background-open]').evaluate(e=>document.activeElement===e),true);
   if(width===390){await page.locator('#topbar-menu-toggle').click();assert.equal(await page.locator('#topbar-menu-toggle').getAttribute('data-gary-icon'),'x');await page.locator('#topbar-menu-toggle').click();}
   results.push({width,theme,page:'action-state-transitions',pass:true});
  }catch(error){results.push({width,theme,page:'action-state-transitions',pass:false,error:error.message});}
  for(const url of templates)await check(url+'?theme='+theme,url);
  await context.close();
 }
}finally{await browser.close();}
const report={generatedAt:new Date().toISOString(),method:'Real Chromium on the running Portal; 1440 and 390 CSS px; dark/light; reduced motion; Canvas draw instrumentation; external requests blocked',checks:results.length,passed:results.filter(r=>r.pass).length,results};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({checks:report.checks,passed:report.passed,failures:results.filter(r=>!r.pass).map(({proof,...r})=>r),report:path.join(out,'report.json')}));
if(report.passed!==report.checks)process.exitCode=1;
