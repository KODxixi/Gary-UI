import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),demos=path.join(root,'examples/demos'),evidence=path.join(demos,'evidence/edition-02');
fs.mkdirSync(evidence,{recursive:true});
const ids=['web-analysis','web-reading','project-kanban','executive-board','research-report','proposal-presentation'];
const browser=await chromium.launch({executablePath:process.env.GARY_UI_CHROME||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const results=[];
for(const id of ids)for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'no-preference'});
  const external=[];await context.route(/^https?:\/\//,route=>{external.push(route.request().url());route.abort()});
  const page=await context.newPage(),errors=[];let cssLoaded=false;page.on('response',r=>{if(r.url().endsWith('/tokens/base.css')&&r.ok())cssLoaded=true});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const row={id,width,proof:{}};
  try{
    await page.goto(pathToFileURL(path.join(demos,id,'index.html')).href+'?theme=dark');await page.waitForFunction(()=>window.__garyDemoReady===true);
    await page.keyboard.press('Tab');assert.notEqual(await page.evaluate(()=>document.activeElement.tagName),'BODY');row.proof.keyboard=true;
    if(id==='web-analysis'){
      await page.locator('[data-filter-region="shanghai"]').click();assert.equal((await page.locator('[data-region-value="revenue"]').innerText()).trim(),'520');assert.equal(await page.locator('[data-region-table] tr').count(),1);
      const series=await page.locator('#analysis-chart').evaluate(el=>echarts.getInstanceByDom(el).getOption().series[0].data);assert.equal(series.at(-1),86);row.proof.filteredSeries=series;
      await page.locator('.qa-controls').last().locator('summary').click();
      for(const state of ['loading','empty','error','ready']){await page.locator('[data-state-set="'+state+'"]').last().click();assert.equal(await page.locator('[data-view-state]').getAttribute('data-view-state'),state);if(state!=='ready')assert.equal(await page.locator('[data-state-'+state+']').isVisible(),true);}
      await page.locator('[data-detail-trigger]').first().click();assert.equal(await page.locator('[data-detail-panel]').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('[data-detail-panel]').isVisible(),false);row.proof.statesAndDetail=true;
    }
    if(id==='web-reading'){
      await page.locator('[data-search]').fill('上一有效版本');assert.equal(await page.locator('.article-list button').count(),1);assert.match(await page.locator('[data-article-body]').innerText(),/上一有效版本/);
      await page.locator('[data-search]').fill('不存在的条目');assert.equal(await page.locator('[data-article-detail]').isVisible(),false);await page.locator('[data-search]').fill('');assert.equal(await page.locator('.article-list button').count(),3);row.proof.search=true;
    }
    if(id==='project-kanban'){
      await page.locator('[data-status="blocked"]').click();assert.equal(await page.locator('[data-work-item]').count(),1);assert.equal(await page.locator('[data-column]:visible').count(),1);
      const trigger=page.locator('[data-work-item] [data-detail-trigger]');await trigger.click();await page.keyboard.press('Tab');assert.equal(await page.locator('[data-detail-panel]').evaluate(el=>el.contains(document.activeElement)),true);await page.keyboard.press('Escape');assert.equal(await trigger.evaluate(el=>el===document.activeElement),true);await page.locator('[data-status="all"]').click();assert.equal(await page.locator('[data-work-item]').count(),6);row.proof.filterAndFocusRestore=true;
    }
    if(id==='executive-board'||id==='proposal-presentation'){
      await page.locator('[data-motion-action="replay"]').click();await page.waitForTimeout(120);await page.locator('[data-motion-action="pause"]').click();
      await page.evaluate(()=>Promise.all([...document.querySelectorAll("[data-motion-item]")].flatMap(e=>e.getAnimations()).map(a=>a.ready)));
      const a=await page.evaluate(()=>[...document.querySelectorAll("[data-motion-item]")].flatMap(e=>e.getAnimations()).map(a=>({time:a.currentTime,state:a.playState})));await page.waitForTimeout(180);const b=await page.evaluate(()=>[...document.querySelectorAll("[data-motion-item]")].flatMap(e=>e.getAnimations()).map(a=>({time:a.currentTime,state:a.playState})));
      assert.ok(a.length>0);assert.deepEqual(a,b);assert.ok(a.every(x=>x.state==='paused'));await page.locator('[data-motion-action="play"]').click();await page.waitForFunction(()=>document.body.dataset.motion==='complete');row.proof.motion={pausedAt:a,completed:true};
      if(id==='proposal-presentation'){await page.locator('[data-static-reading]').click();assert.equal(await page.locator('.motion-dock').isVisible(),false);await page.locator('[data-static-reading]').click();}
    }
    if(await page.locator('[data-source-drawer]').count()){await page.locator('[data-source-drawer]').click();assert.equal(await page.locator('[data-source-list]').isVisible(),true);row.proof.sources=true;}
    if(id==='research-report'){await page.locator('[data-report-toc] a[href="#analysis"]').click();await page.waitForTimeout(500);assert.equal(new URL(page.url()).hash,'#analysis');row.proof.toc=true;}
    await page.locator('[data-theme-toggle]').click();assert.equal(await page.locator('html').getAttribute('data-gary-theme'),'light');
    row.proof.frameThemes=[];
    for(const frame of page.frames().slice(1)){await frame.waitForLoadState('load');await frame.waitForFunction(()=>document.documentElement.dataset.garyTheme==='light');row.proof.frameThemes.push(await frame.evaluate(()=>document.documentElement.dataset.garyTheme));}
    for(const [i,frame] of page.frames().slice(1).entries()){
      const el=page.locator('iframe').nth(i);await el.scrollIntoViewIfNeeded();await page.waitForTimeout(200);await el.screenshot({path:path.join(evidence,id+'-'+width+'-embed-'+i+'.png')});
      if((await el.getAttribute('data-visual-id'))==='delivery-architecture'){
        const pan=await frame.evaluate(()=>{const before=document.scrollingElement.scrollLeft;document.scrollingElement.scrollLeft=200;return{before,after:document.scrollingElement.scrollLeft,width:document.documentElement.scrollWidth}});if(width===390)assert.ok(pan.after>pan.before);row.proof.diagramPan=pan;
      }
    }
    await page.addStyleTag({content:'html{font-size:32px!important}'});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250);
    row.proof.text200=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,body:[...document.querySelectorAll('.gary-role-body')].map(el=>parseFloat(getComputedStyle(el).fontSize)),titles:[...document.querySelectorAll('.gary-role-title')].map(el=>({text:el.textContent,overflow:el.scrollWidth>el.clientWidth+2})),nav:document.querySelector('.demo-nav').getBoundingClientRect().toJSON()}));
    await page.screenshot({path:path.join(evidence,id+'-'+width+'-text200.png')});
    assert.ok(row.proof.text200.scrollWidth<=width+2,'200% horizontal overflow');assert.ok(row.proof.text200.body.every(n=>n>=32));assert.ok(row.proof.text200.titles.every(t=>!t.overflow));
    await page.emulateMedia({reducedMotion:'reduce'});if(await page.locator('.motion-controls').count())assert.equal(await page.locator('.motion-controls').isVisible(),false);row.proof.reducedMotion=true;
    assert.equal(errors.length,0,errors.join(';'));assert.equal(external.length,0);row.pass=true;
    if(width===1440){assert.ok(cssLoaded,'Gary stylesheet response did not load');const gate=await page.evaluate(loaded=>({schemaVersion:1,source:'real-browser',targetStack:'html',url:location.href,styleEntry:'tokens/base.css',styleEntryLoaded:loaded,computedStyle:{property:'--gary-control-height',value:getComputedStyle(document.documentElement).getPropertyValue('--gary-control-height').trim()},sceneCount:document.querySelectorAll('.gary-scene').length,nestedGlassCount:document.querySelectorAll('.glass .glass').length,consoleErrors:0}),cssLoaded);fs.writeFileSync(path.join(evidence,id+'-target-browser-report.json'),JSON.stringify(gate,null,2)+'\n');}
  }catch(error){row.pass=false;row.error=error.message;}
  row.errors=errors;row.external=external;results.push(row);await context.close();
}
await browser.close();
fs.writeFileSync(path.join(evidence,'interaction-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),checks:results.length,passed:results.filter(r=>r.pass).length,results},null,2)+'\n');
console.log(JSON.stringify({checks:results.length,passed:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass)}));if(results.some(r=>!r.pass))process.exitCode=1;
