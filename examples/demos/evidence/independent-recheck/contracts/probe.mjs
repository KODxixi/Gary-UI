import fs from 'node:fs';
import { chromium } from '../../../../../adapters/visual/node_modules/playwright-core/index.mjs';
const browser = await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const context = await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
const base='http://127.0.0.1:4173/';
const failedResources=[];
page.on('response',r=>{if(r.status()>=400)failedResources.push({url:r.url(),status:r.status()});});
await page.goto(base+'patterns/starting-points/index.html?theme=dark&material=regular');
const generated=await page.locator('#starter-code-output').textContent();
fs.writeFileSync(new URL('./generated-starter-before.html',import.meta.url),generated);
await page.route('**/__contract-generated.html',route=>route.fulfill({status:200,contentType:'text/html',body:generated}));
await page.goto(base+'__contract-generated.html');
await page.waitForTimeout(500);
const generatedBefore=await page.evaluate(()=>({viewport:document.querySelector('meta[name=viewport]')?.content||null,innerWidth,charset:document.characterSet,controlHeight:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height'),sceneCanvas:document.querySelectorAll('.gary-dot-grid-canvas').length,card:document.querySelector('.gary-glass-card')?.outerHTML,sceneCount:document.querySelectorAll('[data-gary-scene-engine]').length,bodyFont:getComputedStyle(document.body).fontFamily}));
const results=[];
for(const material of ['solid-plate','regular'])for(const target of ['patterns/starting-points/index.html','patterns/starting-points/preview.html','patterns/application-modes/board.html']){
 await page.goto(base+target+'?theme=dark&material='+material);
 await page.waitForTimeout(250);
 results.push({target,material,proof:await page.evaluate(()=>({rootMaterial:document.documentElement.dataset.garyMaterial,cards:[...document.querySelectorAll('[data-gary-material=glass],.gary-solid-plate')].filter(e=>e.getClientRects().length).map(e=>({class:e.className,material:e.dataset.garyMaterial,filter:getComputedStyle(e).backdropFilter,background:getComputedStyle(e).backgroundColor,refraction:e.dataset.garyRefractionState})),overflow:document.documentElement.scrollWidth>innerWidth}))});
}
const report={generatedAt:new Date().toISOString(),generatedBefore,failedResources,results};
fs.writeFileSync(new URL('./report.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
await browser.close();
