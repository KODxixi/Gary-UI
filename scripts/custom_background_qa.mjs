import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const out=path.resolve(import.meta.dirname,'../examples/demos/evidence/custom-background');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
const url=(process.env.GARY_QA_ORIGIN||'http://127.0.0.1:4173')+'/examples/demos/index.html?background=gradient-waves';
for(const width of [1440,768,390])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));await context.route(/^https?:\/\//,r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():(external.push(r.request().url()),r.abort()));
 try{
  await page.goto(url+'&theme='+theme);await page.locator('[data-background-open]').click();
  assert.equal(await page.locator('[data-media-file]').count(),1,'local media chooser must exist');
  assert.equal(await page.locator('.scene-entry feDisplacementMap').first().getAttribute('scale'),'-180','higher default refraction');
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=1200;c.height=800;const x=c.getContext('2d');x.fillStyle='#35445d';x.fillRect(0,0,1200,800);x.fillStyle='#c5d3e2';for(let i=0;i<12;i++)x.fillRect(i*120,0,30,800);return c.toDataURL().split(',')[1];});
  const upload=page.locator('[data-media-file]');
  await upload.setInputFiles({name:'local-test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.waitForFunction(()=>document.querySelector('.demo-global-scene').dataset.garyBackground==='custom-media');
  const oldSrc=await page.locator('.gary-custom-media').getAttribute('src');
  assert.equal(await page.locator('.gary-gradient-waves-canvas').count(),0);
  assert.equal(await page.locator('.gary-custom-media').evaluate(n=>n.naturalWidth),1200);
  if(width===1440&&theme==='dark'){
   const gate=await page.evaluate(()=>({schemaVersion:1,source:'real-browser',targetStack:'html',url:location.href,styleEntry:'tokens/base.css',styleEntryLoaded:[...document.styleSheets].some(s=>s.href?.includes('demo.css')),computedStyle:{property:'--gary-control-height',value:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim()},sceneCount:document.querySelectorAll('.gary-scene').length,nestedGlassCount:document.querySelectorAll('[data-gary-material="glass"] [data-gary-material="glass"]').length,consoleErrors:0}));
   fs.writeFileSync(path.join(out,'target-browser-report.json'),JSON.stringify(gate,null,2));
  }
  await page.locator('[data-background-close]').click();await page.screenshot({path:path.join(out,`${width}-${theme}.png`)});
  const card=page.locator('.scene-entry').first(),strong=await card.screenshot();
  await page.locator('[data-background-open]').click();
  await page.locator('[name="refractionStrength"]').fill('100');await page.locator('[name="refractionStrength"]').dispatchEvent('input');
  await page.locator('[data-background-close]').click();assert.notDeepEqual(await card.screenshot(),strong,'slider must alter real pixels');
  await page.locator('[data-background-open]').click();
  await upload.setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await page.waitForFunction(()=>document.querySelector('[data-media-status]').textContent.includes('失败'));
  assert.equal(await page.locator('.gary-custom-media').getAttribute('src'),oldSrc,'bad candidate preserves valid image');
  await upload.setInputFiles({name:'unsafe.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')});
  assert.ok((await page.locator('[data-media-status]').textContent()).includes('不支持'));
  assert.equal(await page.locator('.gary-custom-media').getAttribute('src'),oldSrc);
  await page.locator('[name="mediaFit"]').selectOption('contain');assert.equal(await page.locator('.gary-custom-media').evaluate(n=>getComputedStyle(n).objectFit),'contain');
  await page.addStyleTag({content:'html{font-size:200%!important}'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:path.join(out,`${width}-${theme}-controls200.png`)});
  await page.locator('[data-media-clear]').click();assert.equal(await page.locator('.gary-custom-media').count(),0);
  assert.equal(await page.locator('.demo-global-scene').getAttribute('data-gary-background'),'dot-grid');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({width,theme,pass:true});
 }catch(e){results.push({width,theme,pass:false,error:e.stack});}await context.close();
}
// Browser-created local video fixture, no third-party media or network.
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
try{
 await page.goto(url);assert.equal(await page.locator('[data-media-file]').count(),1);
 const video=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=640;c.height=360;const x=c.getContext('2d'),stream=c.captureStream(10),rec=new MediaRecorder(stream,{mimeType:'video/webm'}),chunks=[];rec.ondataavailable=e=>chunks.push(e.data);const done=new Promise(resolve=>rec.onstop=resolve);rec.start();for(let i=0;i<12;i++){x.fillStyle=i%2?'#7e94ab':'#303c55';x.fillRect(0,0,640,360);await new Promise(r=>setTimeout(r,100));}rec.stop();await done;stream.getTracks().forEach(t=>t.stop());return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];});
 fs.writeFileSync(path.join(out,'qa-generated.webm'),Buffer.from(video));
 await page.locator('[data-background-open]').click();await page.locator('[data-media-file]').setInputFiles({name:'qa-generated.webm',mimeType:'video/webm',buffer:Buffer.from(video)});
 await page.waitForFunction(()=>document.querySelector('video.gary-custom-media')?.currentTime>0.15);
 const v=page.locator('video.gary-custom-media');assert.ok(await v.evaluate(n=>n.muted&&n.loop));
 await page.locator('[data-media-pause]').click();const time=await v.evaluate(n=>n.currentTime);await page.waitForTimeout(300);assert.equal(await v.evaluate(n=>n.currentTime),time);
 await page.locator('[data-media-pause]').click();await page.waitForFunction(()=>!document.querySelector('video.gary-custom-media').paused);
 await page.evaluate(()=>document.querySelector('.demo-global-scene').style.display='none');await page.waitForFunction(()=>document.querySelector('video.gary-custom-media').paused);
 await page.evaluate(()=>document.querySelector('.demo-global-scene').style.display='');await page.waitForFunction(()=>!document.querySelector('video.gary-custom-media').paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('video.gary-custom-media').paused);assert.ok(await page.locator('[data-media-pause]').isDisabled());
 await context.setOffline(true);await page.screenshot({path:path.join(out,'video-offline-reduced.png')});
 await page.emulateMedia({media:'print'});assert.equal(await v.evaluate(n=>getComputedStyle(n).display),'none');await page.emulateMedia({media:'screen'});
 await page.locator('[name="background"]').selectOption('dot-grid');assert.ok(await v.evaluate(n=>n.paused));
 await page.locator('[name="background"]').selectOption('custom-media');assert.ok(await v.evaluate(n=>n.paused));
 await page.locator('[data-media-clear]').click();assert.equal(await v.count(),0);results.push({case:'video',pass:true});
}catch(e){results.push({case:'video',pass:false,error:e.stack,diagnostics:await page.evaluate(()=>({status:document.querySelector('[data-media-status]')?.textContent,background:document.querySelector('.demo-global-scene')?.dataset.garyBackground,video:[...document.querySelectorAll('video')].map(n=>({ready:n.readyState,time:n.currentTime,paused:n.paused,error:n.error?.message}))}))});}await context.close();await browser.close();
fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
