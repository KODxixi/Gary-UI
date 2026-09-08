import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const out=path.resolve(import.meta.dirname,'../examples/demos/evidence/glass-surface');
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
for(const width of [1440,768,390])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));await context.route(/^https?:\/\//,r=>{if(new URL(r.request().url()).hostname==='127.0.0.1')return r.continue();external.push(r.request().url());return r.abort();});
 const row={width,theme};try{
  const url='http://127.0.0.1:4173/examples/demos/index.html?theme='+theme+'&background=gradient-waves';
  await page.goto(url+'&glass=frosted');await page.waitForFunction(()=>window.GaryBackgroundLab?.engine);
  await page.screenshot({path:path.join(out,width+'-'+theme+'-before.png')});
  const baseline=await page.locator('.scene-entry').evaluateAll(els=>els.map(el=>({text:[...el.querySelectorAll('.eyebrow,.scene-entry__title,.scene-entry__body')].map(n=>n.textContent),box:el.getBoundingClientRect().toJSON()})));
  await page.goto(url);await page.waitForFunction(()=>window.GaryBackgroundLab?.engine);
  assert.equal(await page.locator('[data-gary-refraction-state="svg"]').count(),3,'three real refractive surfaces');
  const options=await page.evaluate(()=>GaryBackgroundLab.engine.state.options);
  assert.equal(options.horizonColor,theme==='dark'?'#455164':'#b8c1cb');assert.equal(options.amplitude,2);assert.equal(options.mouseInteraction,false);
  const current=await page.locator('.scene-entry').evaluateAll(els=>els.map(el=>({text:[...el.querySelectorAll('.eyebrow,.scene-entry__title,.scene-entry__body')].map(n=>n.textContent),box:el.getBoundingClientRect().toJSON()})));
  assert.deepEqual(current,baseline,'approved-baseline-drift: content and geometry');
  await page.screenshot({path:path.join(out,width+'-'+theme+'-after.png')});
  if(width===1440){
    const surface=page.locator('.scene-entry').first();
    await surface.evaluate(el=>el.style.transition='none');
    const refracted=await surface.screenshot({path:path.join(out,theme+'-refraction-on.png')});
    const scales=await surface.locator('feDisplacementMap').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('scale')));
    await surface.locator('feDisplacementMap').evaluateAll(nodes=>nodes.forEach(n=>n.setAttribute('scale','0')));
    const flat=await surface.screenshot({path:path.join(out,theme+'-refraction-zero.png')});
    assert.notDeepEqual(refracted,flat,'actual pixels must respond to displacement, same shadow and content');
    await surface.locator('feDisplacementMap').evaluateAll((nodes,values)=>nodes.forEach((n,i)=>n.setAttribute('scale',values[i])),scales);
    row.displacementPixelsChanged=true;
  }
  const card=page.locator('.scene-entry').first();await card.focus();
  assert.equal(await card.evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  assert.equal(await card.evaluate(el=>getComputedStyle(el).borderRadius),'30px');
  assert.equal(await card.evaluate(el=>getComputedStyle(el.querySelector('.scene-entry__title')).filter),'none','text must not be distorted');
  row.gate=await page.evaluate(errorCount=>({schemaVersion:1,source:'real-browser',targetStack:'html',url:location.href,styleEntry:'tokens/base.css',styleEntryLoaded:[...document.styleSheets].some(s=>s.href?.endsWith('/shared/demo.css')&&[...s.cssRules].some(r=>r.href?.endsWith('/tokens/base.css'))),computedStyle:{property:'--gary-control-height',value:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim()},sceneCount:document.querySelectorAll('.gary-scene').length,nestedGlassCount:document.querySelectorAll('[data-gary-material="glass"] [data-gary-material="glass"]').length,consoleErrors:errorCount}),errors.length);
  if(width===1440&&theme==='dark')fs.writeFileSync(path.join(out,'target-browser-report.json'),JSON.stringify(row.gate,null,2));
  await page.addStyleTag({content:'html{font-size:200%!important}'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:path.join(out,width+'-'+theme+'-text200.png')});
  await page.keyboard.press('Enter');await page.waitForURL('**/web-analysis/index.html?theme='+theme);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);row.pass=true;
 }catch(e){row.pass=false;row.error=e.stack;}results.push(row);await context.close();
 if(!row.pass)break;
}
await browser.close();fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results));
if(results.length!==6||results.some(r=>!r.pass))process.exitCode=1;
