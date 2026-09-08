import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'examples/demos/evidence/gradient-waves');
const upstream=fs.readFileSync(path.join(root,'provenance/react-bits/GradientWaves.jsx'),'utf8');
const adapter=fs.readFileSync(path.join(root,'patterns/shared/gradient-waves.js'),'utf8');
assert.equal(createHash('sha256').update(upstream).digest('hex'),'92cf6aa408e3b7fe98474c6465441ecea7a7810250bbcc4a92b905e6848ae24f');
for(const name of ['vertex','fragment']){
  const original=upstream.match(new RegExp('const '+name+' = `([\\s\\S]*?)`;'))[1];
  const local=JSON.parse(adapter.match(new RegExp('const '+name+' = (".*");'))[1]);
  assert.equal(local,original,'upstream shader must stay exact');
}
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
async function check(name,run){
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
  try{await run(page,context);results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.stack});}
  finally{await context.close();}
}
const url='http://127.0.0.1:4173/examples/demos/index.html?background=gradient-waves&theme=dark';
const ready=page=>page.waitForFunction(()=>window.GaryBackgroundLab?.engine?.state.status==='playing');
await check('gary-palette-with-user-wave-parameters',async(page)=>{
  await page.goto(url);await ready(page);
  await page.locator('[data-background-open]').click();await page.locator('[name="preset"]').selectOption('gary');await page.locator('[data-background-close]').click();
  const options=await page.evaluate(()=>GaryBackgroundLab.engine.state.options);
  assert.deepEqual(options,{horizonColor:'#282d60',waveColor:'#6976ad',crestColor:'#c1cce6',speed:.15,amplitude:2.6,waveScale:.6,waveRatio:1,swell:0,turbulence:50,tilt:1.23,zoom:1.4,height:11,fogDepth:15,detail:'medium',brightness:1,opacity:.6,mouseInteraction:false,parallaxStrength:0,grain:true,grainIntensity:.02});
  await page.mouse.move(50,50);await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(()=>GaryBackgroundLab.engine.state.mouse),[.5,.5]);
});
await check('silver-three-waves-exact-options',async(page)=>{
  await page.goto(url);await ready(page);
  const expected={horizonColor:'#455164',waveColor:'#8193ab',crestColor:'#dbe4ef',speed:.1,amplitude:2,waveScale:1.35,waveRatio:.6,swell:0,turbulence:50,tilt:1.12,zoom:1,height:10,fogDepth:20,detail:'medium',brightness:1.1,opacity:.47,mouseInteraction:false,parallaxStrength:.85,grain:true,grainIntensity:.01};
  assert.deepEqual(await page.evaluate(()=>GaryBackgroundLab.engine.state.options),expected);
  await page.locator('[data-background-open]').click();
  await page.locator('[name="amplitude"]').fill('5');await page.locator('[name="amplitude"]').dispatchEvent('input');
  await page.locator('[data-waves-reset]').click();
  assert.deepEqual(await page.evaluate(()=>GaryBackgroundLab.engine.state.options),expected,'reset restores approved default');
  const download=page.waitForEvent('download');await page.locator('[data-waves-export]').click();
  const config=path.join(out,'approved-default.json');await (await download).saveAs(config);
  assert.deepEqual(JSON.parse(fs.readFileSync(config,'utf8')).options,expected,'export matches actual default');
});
await check('continuous-play-pause-theme-export',async(page)=>{
  await page.goto(url);await ready(page);
  const before=await page.evaluate(()=>GaryBackgroundLab.engine.state);
  await page.mouse.move(50,50);await page.waitForTimeout(250);
  assert.deepEqual((await page.evaluate(()=>GaryBackgroundLab.engine.state)).mouse,before.mouse,'Gary preset disables parallax');
  await page.waitForTimeout(21500);
  const continuing=await page.evaluate(()=>GaryBackgroundLab.engine.state);
  assert.equal(continuing.status,'playing','must not stop at the old 20-second boundary');
  assert.ok(continuing.time>20);
  await page.waitForTimeout(250);assert.ok((await page.evaluate(()=>GaryBackgroundLab.engine.state)).time>continuing.time);
  await page.locator('[data-background-open]').click();
  await page.locator('[data-waves-replay]').click();await page.waitForTimeout(200);
  assert.ok((await page.evaluate(()=>GaryBackgroundLab.engine.state)).time<1);
  await page.locator('[data-waves-pause]').click();
  const paused=await page.evaluate(()=>GaryBackgroundLab.engine.state.time);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>GaryBackgroundLab.engine.state.time),paused);
  const configPromise=page.waitForEvent('download');await page.locator('[data-waves-export]').click();
  const configPath=path.join(out,'silver-three-waves.json');await (await configPromise).saveAs(configPath);
  assert.deepEqual(JSON.parse(fs.readFileSync(configPath,'utf8')).playback,{mode:'continuous',durationSeconds:null,reducedMotion:'static'});
  await page.locator('[data-background-close]').click();await page.locator('[data-theme-toggle]').click();
  assert.equal((await page.evaluate(()=>GaryBackgroundLab.engine.state)).options.horizonColor,'#b8c1cb');
  await page.locator('[data-background-open]').click();
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-waves-png]').click();
  await (await downloadPromise).saveAs(path.join(out,'standalone-background.png'));
  const imagePage=await page.context().newPage();
  await imagePage.goto(pathToFileURL(path.join(out,'standalone-background.png')).href);
  const pixels=await imagePage.evaluate(async()=>{
    const img=document.querySelector('img');await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
    const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,c.width,c.height).data;
    let alpha=0;for(let i=3;i<p.length;i+=4)if(p[i]>0)alpha++;
    return {width:c.width,height:c.height,alpha};
  });
  assert.ok(pixels.width>1000&&pixels.height>600&&pixels.alpha>10000);
  await imagePage.screenshot({path:path.join(out,'standalone-background-open.png')});
});
await check('context-loss-fallback-retry-grid-return',async(page)=>{
  await page.goto(url);await ready(page);
  await page.evaluate(()=>document.querySelector('.gary-gradient-waves-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.waitForFunction(()=>GaryBackgroundLab.engine.state.status==='fallback');
  assert.equal(await page.locator('.gary-dot-grid-canvas').isVisible(),true);
  await page.locator('[data-background-open]').click();await page.locator('[data-waves-retry]').click();await ready(page);
  assert.equal(await page.locator('.gary-gradient-waves-canvas').count(),1);
  await page.locator('[name="background"]').selectOption('dot-grid');
  assert.equal(await page.locator('.gary-gradient-waves-canvas').count(),0);
  assert.equal(await page.locator('.gary-dot-grid-canvas').isVisible(),true);
  await page.locator('[name="background"]').selectOption('gradient-waves');await ready(page);
  assert.equal(await page.locator('.gary-gradient-waves-canvas').count(),1);
});
await check('unsupported-webgl-and-invalid-options',async(page)=>{
  await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:get.call(this,type,...args);};});
  await page.goto(url);await page.waitForFunction(()=>GaryBackgroundLab?.engine?.state.status==='fallback');
  assert.equal(await page.locator('.gary-dot-grid-canvas').isVisible(),true);
  const normalized=await page.evaluate(()=>GaryGradientWaves.normalize({speed:Infinity,opacity:99,horizonColor:'url(evil)',detail:'ultra',mouseInteraction:'true',__proto__:{test:1}}));
  assert.equal(normalized.speed,.4);assert.equal(normalized.opacity,1);assert.equal(normalized.horizonColor,'#5227ff');assert.equal(normalized.detail,'medium');assert.equal(normalized.test,undefined);
});
await check('missing-local-script-keeps-grid-and-recovers',async(page,context)=>{
  await context.route('**/patterns/shared/gradient-waves.js',r=>r.abort());
  await page.goto(url);await page.locator('[data-background-open]').click();
  await page.waitForFunction(()=>document.querySelector('[data-waves-status]').textContent.includes('加载失败'));
  assert.equal(await page.locator('.gary-dot-grid-canvas').isVisible(),true);
  assert.equal(await page.locator('[data-waves-settings]').isVisible(),false);
  await context.unroute('**/patterns/shared/gradient-waves.js');
  await page.locator('[name="background"]').selectOption('dot-grid');
  await page.locator('[name="background"]').selectOption('gradient-waves');await ready(page);
});
await check('file-offline-reduced-and-offscreen',async(page,context)=>{
  await context.setOffline(true);const external=[];
  page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
  await page.goto(pathToFileURL(path.join(root,'examples/demos/index.html')).href+'?background=gradient-waves');await ready(page);
  await page.evaluate(()=>document.querySelector('.demo-global-scene').style.display='none');
  await page.waitForFunction(()=>GaryBackgroundLab.engine.state.status==='suspended');
  const stopped=await page.evaluate(()=>GaryBackgroundLab.engine.state.time);await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>GaryBackgroundLab.engine.state.time),stopped);
  await page.evaluate(()=>document.querySelector('.demo-global-scene').style.display='');await ready(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>GaryBackgroundLab.engine.state.status==='reduced-motion');
  const time=await page.evaluate(()=>GaryBackgroundLab.engine.state.time);
  await page.mouse.move(40,80);await page.waitForTimeout(200);
  assert.equal(await page.evaluate(()=>GaryBackgroundLab.engine.state.time),time);
  assert.deepEqual(await page.evaluate(()=>GaryBackgroundLab.engine.state.mouse),[.5,.5]);assert.deepEqual(external,[]);
  await page.screenshot({path:path.join(out,'offline-reduced.png')});
});
await browser.close();
fs.writeFileSync(path.join(out,'lifecycle-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify(results));if(results.some(r=>!r.pass))process.exitCode=1;
