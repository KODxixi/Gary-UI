import fs from 'node:fs';
import path from 'node:path';
import {chromium} from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'examples/demos/evidence/header-brand');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];const quick=process.argv.includes('--quick');
const entries=quick?['examples/demos/index.html']:['examples/demos/index.html',...['web-analysis','web-reading','project-kanban','executive-board','research-report','proposal-presentation'].map(id=>'examples/demos/'+id+'/index.html'),'portal/#demos'];
for(const entry of entries)for(const width of (quick?[1440]:[1440,1600,768,390]))for(const theme of (quick?['dark']:['dark','light'])){
 const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await context.route(/^https?:\/\//,r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
 let row={entry,width,theme};try{
 await page.goto('http://127.0.0.1:4173/'+entry);await page.waitForTimeout(600);
 if(await page.locator('html').getAttribute('data-gary-theme')!==theme){
  if(entry.includes('portal')){await page.locator('.display-summary').click();await page.locator('#theme-toggle').click();await page.locator('.display-summary').click();}
  else await page.locator('[data-theme-toggle]').click();
  await page.waitForTimeout(250);
 }
 const measure=()=>page.locator('.demo-nav,.portal-topbar').first().evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,background:s.backgroundColor,scrolled:e.classList.contains('is-scrolled'),logo:!!e.querySelector('.gary-brand-icon'),legacyG:!![...e.querySelectorAll('.brand-mark')].find(x=>x.textContent.trim()==='G'),position:s.position,overflow:document.documentElement.scrollWidth>innerWidth,token:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim()}});
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);row.top=await measure();await page.screenshot({path:path.join(out,entry.includes('portal')?'portal-'+width+'-'+theme+'-top.png':entry.split('/').at(-2)+'-'+width+'-'+theme+'-top.png')});
 await page.evaluate(()=>scrollTo(0,500));await page.waitForTimeout(100);row.floating=await measure();await page.screenshot({path:path.join(out,entry.includes('portal')?'portal-'+width+'-'+theme+'-floating.png':entry.split('/').at(-2)+'-'+width+'-'+theme+'-floating.png')});
 row.contentFit=await page.locator('.demo-nav,.portal-topbar').first().evaluate(e=>{
  const brand=e.querySelector('.demo-nav__brand,.topbar-leading'),links=e.querySelector('.demo-nav__links,.top-navigation'),actions=e.querySelector('.demo-actions,.topbar-actions'),h=e.querySelector('.topbar-leading h1'),img=e.querySelector('.gary-brand-icon img');
  return {logoLoaded:!!img?.complete&&img.naturalWidth>0,titleSingle:!h||h.offsetHeight<=parseFloat(getComputedStyle(h).lineHeight)+1,separated:getComputedStyle(links).display==='none'||(brand.getBoundingClientRect().right<=links.getBoundingClientRect().left+2&&links.getBoundingClientRect().right<=actions.getBoundingClientRect().left+2)};
 });
 if(width<=1100&&!entry.includes('portal')){const menu=page.locator('.gary-header-menu');await menu.click();row.menuOpen=await page.locator('.demo-nav__links').isVisible();await page.keyboard.press('Escape');row.menuClosed=!(await page.locator('.demo-nav__links').isVisible())&&await menu.evaluate(e=>document.activeElement===e);}
 const expectTop=width>=1560?Math.min(width-160,1280):width>=768?Math.min(width-144,1140):width-48;
 const expectFloat=Math.min(expectTop,width>=1560?1180:980);
 row.pass=Math.abs(row.top.width-expectTop)<2&&Math.abs(row.floating.width-expectFloat)<2&&row.top.height===(width<768?54:46)&&row.floating.height===(width<768?54:46)&&row.top.top===8&&row.floating.top===8&&row.top.background==='rgba(0, 0, 0, 0)'&&!row.top.scrolled&&row.floating.scrolled&&row.top.logo&&!row.top.legacyG&&!row.top.overflow&&!row.floating.overflow&&row.top.token==='44px'&&!errors.length;
 row.pass=row.pass&&Object.values(row.contentFit).every(Boolean)&&row.menuOpen!==false&&row.menuClosed!==false;
 }catch(e){row.error=e.message;row.pass=false}row.errors=errors;results.push(row);await context.close();
}
await browser.close();const report={generatedAt:new Date().toISOString(),checks:results.length,passed:results.filter(x=>x.pass).length,results};fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:results.filter(x=>!x.pass)}));if(report.passed!==report.checks)process.exitCode=1;
