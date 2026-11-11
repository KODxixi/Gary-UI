import fs from 'node:fs';
import { chromium } from '../../../../../adapters/visual/node_modules/playwright-core/index.mjs';
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/patterns/starting-points/preview.html?theme=dark&material=regular');await page.waitForTimeout(300);
const proof=await page.evaluate(()=>({cards:[...document.querySelectorAll('.gary-glass')].map(e=>({class:e.className,refraction:e.dataset.garyRefractionState||null,material:e.dataset.garyMaterial||null,filter:getComputedStyle(e).backdropFilter,radius:getComputedStyle(e).borderRadius,background:getComputedStyle(e).backgroundColor})),viewport:innerWidth}));
await page.screenshot({path:new URL('./preview-unmounted-header.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1')});
const css=await context.request.get('http://127.0.0.1:4173/gary-ui/tokens/base.css');proof.generatedCssStatus=css.status();
console.log(JSON.stringify(proof,null,2));fs.writeFileSync(new URL('./preview-unmounted-header.json',import.meta.url),JSON.stringify(proof,null,2));await browser.close();
