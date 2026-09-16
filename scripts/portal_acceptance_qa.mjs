import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const out=path.resolve(import.meta.dirname,'../examples/demos/evidence/independent-recheck/root');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});const results=[];
const base='http://127.0.0.1:4173/';
try {for(const width of [320,390,701,768,900,1024,1100,1440]){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const row={width};
 try {
  await page.goto(base+'portal/#components');
  if(width<=1100){await page.locator('#topbar-menu-toggle').click();await page.locator('.top-nav-details > summary').click();await page.locator('[data-view-target=materials]').click();assert.equal(await page.locator('[data-view=materials]').isVisible(),true);await page.keyboard.press('Escape');row.menu='opened and navigated';}
  else {assert.equal(await page.locator('#top-navigation').isVisible(),true);row.menu='desktop navigation visible';}
  await page.goto(base+'portal/#demos');
  await page.locator('#theme-toggle').click();
  await page.waitForFunction(()=>{const f=document.querySelector('#complete-demo-frame');return f?.contentDocument?.documentElement?.dataset.garyTheme==='light'});
  assert.equal(await page.locator('html').getAttribute('data-gary-theme'),'light');
  const links=await page.locator('[data-view=demos] a[target="_blank"]').evaluateAll(els=>els.map(e=>e.href));for(const link of links)assert.equal(new URL(link).searchParams.get('theme'),'light');row.openLinks=links;
  const frame=page.frameLocator('#complete-demo-frame');await frame.locator('[data-background-open]').waitFor();
  row.preview=await page.locator('#complete-demo-frame').evaluate(e=>({width:e.getBoundingClientRect().width,innerWidth:e.contentWindow.innerWidth,scrollWidth:e.contentDocument.documentElement.scrollWidth,theme:e.contentDocument.documentElement.dataset.garyTheme}));
  assert.ok(row.preview.width>=320);assert.equal(row.preview.innerWidth,row.preview.scrollWidth);
  if(width<=390){assert.equal(row.preview.width,width);const menu=frame.locator('.gary-header-menu');assert.equal(await menu.locator('svg').count(),1);const box=await menu.boundingBox();assert.equal(box.width,box.height);await menu.click();assert.equal(await frame.locator('.demo-nav__links').isVisible(),true);await menu.click();}
  await page.locator('[data-background-open]').click();assert.equal(await page.locator('#gary-background-lab').isVisible(),true);assert.equal(await page.locator('#gary-background-lab #theme-toggle').count(),0);assert.equal(await page.locator('[data-background-open] svg').count(),0);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-background-open]').evaluate(e=>document.activeElement===e),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);row.pass=true;await page.screenshot({path:path.join(out,`portal-${width}.png`)});
 }catch(error){row.pass=false;row.error=error.message;row.errors=errors;await page.screenshot({path:path.join(out,`failed-${width}.png`)});}
 results.push(row);await context.close();
}}finally{await browser.close();}
const report={generatedAt:new Date().toISOString(),checks:results.length,passed:results.filter(r=>r.pass).length,results};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.passed!==report.checks)process.exitCode=1;
