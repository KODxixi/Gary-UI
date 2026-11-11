import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'), demos=path.join(root,'examples/demos');
const evidence=path.join(demos,'evidence/edition-02');fs.mkdirSync(evidence,{recursive:true});
const ids=['web-analysis','web-reading','project-kanban','executive-board','research-report','proposal-presentation'];
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];const quick=process.argv.includes('--quick');
for(const id of ids)for(const theme of ['dark','light'])for(const width of (quick?[1440]:[1440,768,390])){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},reducedMotion:'reduce'});
  const blocked=[];await context.route(/^https?:\/\//,route=>{blocked.push(route.request().url());route.abort()});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  let result={id,theme,width};
  try{
    await page.goto(pathToFileURL(path.join(demos,id,'index.html')).href+'?theme='+theme,{waitUntil:'load'});await page.waitForFunction(()=>window.__garyDemoReady===true);await page.waitForTimeout(300);
    for(const frame of page.frames().slice(1)) await frame.waitForFunction(()=>window.__garyVisualReady===true||document.querySelectorAll('svg path,svg rect,svg text,svg circle').length>10,null,{timeout:20000});
    result.metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,token:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim(),sceneCount:document.querySelectorAll('.gary-scene').length,bg:getComputedStyle(document.documentElement).backgroundColor,titles:[...document.querySelectorAll('.gary-role-title')].map(el=>({text:el.textContent,overflow:el.scrollWidth>el.clientWidth+2,lines:Math.round(el.getBoundingClientRect().height/parseFloat(getComputedStyle(el).lineHeight))})),bodySizes:[...document.querySelectorAll('.gary-role-body')].map(el=>parseFloat(getComputedStyle(el).fontSize))}));
    result.frameThemes=[];
    for(const frame of page.frames().slice(1))result.frameThemes.push(await frame.evaluate(()=>({theme:document.documentElement.dataset.garyTheme||document.documentElement.dataset.theme,svg:document.querySelectorAll('svg').length,title:document.title})));
    result.brokenLinks=await page.evaluate(()=>[...document.querySelectorAll('a[href]')].map(a=>a.href).filter(href=>href.startsWith('file:')&&!href.includes('#')));
    result.brokenLinks=result.brokenLinks.filter(href=>!fs.existsSync(decodeURIComponent(new URL(href).pathname).replace(/^\/([A-Za-z]:)/,'$1')));
    await page.evaluate(()=>scrollTo(0,0));
    if(width===1440)await page.screenshot({path:path.join(evidence,id+'-'+theme+'.png')});
    if(width===390&&theme==='light')await page.screenshot({path:path.join(evidence,id+'-mobile.png'),fullPage:true});
    if(width===1440&&theme==='dark')await page.screenshot({path:path.join(evidence,id+'-full.png'),fullPage:true});
    result.pass=result.metrics.scrollWidth<=width+2&&result.metrics.token==='44px'&&result.metrics.sceneCount===1&&result.metrics.titles.every(t=>!t.overflow&&t.lines===1&&!/[，。！？：；、,.!?;:]/.test(t.text))&&result.metrics.bodySizes.every(n=>n>=16)&&errors.length===0&&result.frameThemes.every(f=>f.theme===theme&&f.svg>0)&&result.brokenLinks.length===0&&blocked.length===0;
  }catch(error){result.pass=false;result.error=error.message;}
  result.errors=errors;result.externalRequests=blocked;results.push(result);await context.close();
}
await browser.close();
const report={generatedAt:new Date().toISOString(),method:'Real Chromium; network blocked; final page screenshots',checks:results.length,passed:results.filter(r=>r.pass).length,results};
fs.writeFileSync(path.join(evidence,'layout-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:report.checks,passed:report.passed,failures:results.filter(r=>!r.pass)}));
if(report.passed!==report.checks)process.exitCode=1;
