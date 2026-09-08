import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..');
const outputs=path.join(root,'examples/demos/visuals/outputs');
const evidence=path.join(root,'examples/demos/evidence/edition-02');
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
try {
  for(const file of fs.readdirSync(outputs).filter(f=>/\.(svg|png)$/.test(f)).sort()) {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    await context.route(/^https?:\/\//,route=>route.abort());
    const page=await context.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(outputs,file)).href);
    const metrics=await page.evaluate(()=>{
      const svg=document.querySelector('svg'),img=document.querySelector('img');
      if(img)return {width:img.naturalWidth,height:img.naturalHeight,complete:img.complete};
      const box=svg.getBoundingClientRect();
      return {width:box.width,height:box.height,kind:svg.getAttribute('data-gary-export'),viewBox:svg.getAttribute('viewBox'),text:svg.textContent,graphics:svg.querySelectorAll('path,rect,text,foreignObject').length};
    });
    assert(metrics.width>=200&&metrics.height>=120,file+' dimensions');
    assert.equal(errors.length,0,file+' browser errors');
    if(file.endsWith('.png'))assert(metrics.complete,file+' decoded');
    else {
      assert(metrics.graphics>5,file+' graphics');
      if(file.startsWith('delivery-architecture')){assert.equal(metrics.kind,'standalone');assert.equal(metrics.viewBox,'0 0 870 516');}
      if(file.startsWith('delivery-architecture'))for(const text of ['区域团队','交付台账','证据复核','管理层报告','版本归档','上一有效版本'])assert(metrics.text.includes(text),file+' missing '+text);
      await page.evaluate(()=>{const svg=document.querySelector('svg');svg.style.cssText='width:1400px!important;height:950px!important;max-width:none!important;min-width:0!important';});
      await page.screenshot({path:path.join(evidence,'standalone-'+file.replace('.svg','.png'))});
    }
    results.push({file,pass:true,metrics:{...metrics,text:metrics.text?.slice(0,180)}});
    await context.close();
  }
} finally {await browser.close();}
assert.equal(results.length,20,'ten SVGs and ten PNGs');
fs.writeFileSync(path.join(evidence,'standalone-export-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),checks:results.length,passed:results.length,results},null,2)+'\n');
console.log(JSON.stringify({checks:results.length,passed:results.length}));
