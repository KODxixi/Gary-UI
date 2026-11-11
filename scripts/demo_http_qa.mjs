import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),evidence=path.join(root,'examples/demos/evidence/edition-02');
const origin='http://127.0.0.1:4173',base=origin+'/examples/demos/';
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
try {
 for(const width of [1440,390])for(const theme of ['dark','light']) {
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const external=[];await context.route('**/*',route=>{const url=new URL(route.request().url());if(['http:','https:'].includes(url.protocol)&&url.origin!==origin){external.push(url.href);return route.abort()}return route.continue()});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'index.html?theme='+theme);await page.waitForFunction(()=>window.__garyDemoReady===true);
  for(const category of ['Web UI','Kanban','HTML 汇报页']){await page.locator(`[data-gallery-filter="${category}"]`).click();assert.equal(await page.locator('[data-category]:visible').count(),2);}
  await page.locator('[data-gallery-filter="all"]').click();
  assert.equal(await page.locator('[data-category]:visible').count(),6);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const urls=await page.locator('a[href]').evaluateAll(links=>[...new Set(links.map(a=>a.href).filter(url=>url.startsWith(location.origin)&&!url.includes('#')))]);
  for(const url of urls)assert.equal((await context.request.get(url)).status(),200,url);
  const entries=await page.locator('[data-demo-entry]').evaluateAll(links=>[...new Set(links.map(a=>a.href))]);
  for(const url of entries){const demo=await context.newPage();assert.equal((await demo.goto(url)).status(),200);await demo.waitForFunction(()=>window.__garyDemoReady===true);await demo.close();}
  await page.screenshot({path:path.join(evidence,`gallery-${width}-${theme}.png`)});
  assert.equal(external.length,0);assert.equal(errors.length,0);
  results.push({width,theme,pass:true,links:urls.length,entries:entries.length,external,errors});await context.close();
 }
 const page=await browser.newPage();await page.goto(origin+'/portal/#demos');
 const frame=page.frameLocator('#view-demos iframe, #demos iframe, iframe[src*="examples/demos"]').first();
 await frame.locator('.gallery-grid').waitFor();results.push({portal:true,embeddedGallery:true,pass:true});
}finally{await browser.close();}
fs.writeFileSync(path.join(evidence,'http-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),checks:results.length,passed:results.length,results},null,2)+'\n');
console.log(JSON.stringify({checks:results.length,passed:results.length}));
