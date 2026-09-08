import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'examples/demos/evidence/glass-surface');
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
for(const mode of ['fallback','unsupported','offline','motion']){
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:mode==='motion'?'no-preference':'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  if(mode==='unsupported')await page.addInitScript(()=>{const supports=CSS.supports.bind(CSS);CSS.supports=(...args)=>args.join('').includes('url(')?false:supports(...args);});
  if(mode==='offline')await context.setOffline(true);
  const url=mode==='offline'?pathToFileURL(path.join(root,'examples/demos/index.html')).href:'http://127.0.0.1:4173/examples/demos/index.html';
  await page.goto(url+'?background=gradient-waves&theme=dark'+(mode==='fallback'?'&glass=fallback':''));
  await page.waitForFunction(()=>window.GaryBackgroundLab?.engine);
  const expected=['fallback','unsupported'].includes(mode)?'fallback':'svg';
  assert.equal(await page.locator('[data-gary-refraction-state="'+expected+'"]').count(),3);
  assert.equal(await page.locator('.scene-entry').first().evaluate(el=>getComputedStyle(el).backdropFilter.includes('url(')),expected==='svg');
  if(expected==='fallback')assert.equal(await page.locator('.scene-entry').first().evaluate(el=>getComputedStyle(el).backdropFilter),'blur(12px)');
  if(mode==='motion'){
    const before=await page.locator('.scene-entry').first().screenshot();
    await page.waitForTimeout(400);
    const after=await page.locator('.scene-entry').first().screenshot();
    assert.notDeepEqual(before,after,'glass follows actual animated backdrop');
    await page.locator('.scene-entry').first().hover();
    assert.equal(await page.locator('.scene-entry').first().evaluate(el=>getComputedStyle(el,'::after').animationName),'none','no competing orbit');
  }
  await page.screenshot({path:path.join(out,mode+'.png')});
  if(expected==='svg'){
    const beforeMap=await page.locator('.scene-entry feImage').first().getAttribute('href');
    await page.setViewportSize({width:390,height:1000});
    await page.waitForFunction(old=>document.querySelector('.scene-entry feImage').getAttribute('href')!==old,beforeMap);
    assert.equal(await page.locator('filter[id^="gary-optics"]').count(),3,'one filter per card after resize');
  }
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.scene-entry').first().evaluate(el=>getComputedStyle(el).backdropFilter),'none');
  assert.deepEqual(errors,[]);results.push({mode,pass:true});
 }catch(e){results.push({mode,pass:false,error:e.stack});}await context.close();
}
await browser.close();fs.writeFileSync(path.join(out,'fallback-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
