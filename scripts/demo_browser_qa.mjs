import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEMOS = path.join(ROOT, 'examples', 'demos');
const EVIDENCE = path.join(DEMOS, 'evidence', 'browser');
const manifest = JSON.parse(fs.readFileSync(path.join(DEMOS, 'demo-manifest.json'), 'utf8'));
const executablePath = process.env.GARY_UI_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(EVIDENCE, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu'] });
const results = [];
const errors = [];

async function measure(page) {
  return page.evaluate(() => {
    const bodyText = document.body.innerText.trim();
    const root = document.documentElement;
    const targetSizes = [...document.querySelectorAll('button,a,input,select')].filter(el => {
      const s = getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden';
    }).map(el => { const r=el.getBoundingClientRect(); return {tag:el.tagName,w:Math.round(r.width),h:Math.round(r.height),text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,30)}; });
    const clipped = [...document.querySelectorAll('h1,h2,h3,p,td,th,button,a')].filter(el => {
      const s=getComputedStyle(el); return (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2) && ['hidden','clip'].includes(s.overflow);
    }).map(el => (el.textContent||'').trim().slice(0,50));
    const displayTitles = [...document.querySelectorAll('.gary-role-title')].map(el => {
      const style=getComputedStyle(el); const rect=el.getBoundingClientRect(); const lineHeight=parseFloat(style.lineHeight); const text=(el.textContent||'').trim();
      return {text,whiteSpace:style.whiteSpace,lineCount:lineHeight?Math.round(rect.height/lineHeight):null,hasBreak:Boolean(el.querySelector('br')),hasPunctuation:/[，。！？：；、,.!?;:]/.test(text),overflows:el.scrollWidth>el.clientWidth+2};
    });
    const displayTitleViolations=displayTitles.filter(item=>item.whiteSpace!=='nowrap'||item.lineCount!==1||item.hasBreak||item.hasPunctuation||item.overflows);
    return {
      title: document.title,
      bodyTextLength: bodyText.length,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 2,
      semanticBodyPx: [...document.querySelectorAll('.gary-role-body')].map(el => parseFloat(getComputedStyle(el).fontSize)),
      undersizedTargets: targetSizes.filter(x => x.h < 40 && x.w < 40),
      clipped,
      displayTitles,
      displayTitleViolations,
      svgCount: document.querySelectorAll('svg').length,
      iframeCount: document.querySelectorAll('iframe').length,
      theme: root.dataset.garyTheme,
    };
  });
}

async function inspectFrames(page) {
  const frames = page.frames().slice(1);
  const values = [];
  for (const frame of frames) {
    try {
      await frame.waitForLoadState('domcontentloaded', { timeout: 10000 });
      const frameElement = await frame.frameElement();
      await frameElement.scrollIntoViewIfNeeded();
      await frame.waitForFunction(() => window.__garyVisualReady === true || Boolean(window.__garyVisualError) || document.querySelectorAll('svg path,svg rect,svg text,svg circle').length > 10, null, { timeout: 30000 });
      await frame.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches || !document.querySelector('[data-motion-action]') || document.body.dataset.motion === 'complete', null, { timeout: 5000 });
      values.push(await frame.evaluate(() => ({ title:document.title, text:document.body?.innerText.trim().length||0, svg:document.querySelectorAll('svg').length })));
    } catch (error) { values.push({ error:error.message }); }
  }
  return values;
}

async function interactions(page, id) {
  const proof = {};
  await page.keyboard.press('Tab');
  proof.keyboardFocus = await page.evaluate(() => document.activeElement !== document.body && document.activeElement !== document.documentElement);
  if (id === 'web-analysis') {
    await page.locator('[data-filter-region="shanghai"]').click();
    proof.filterRevenue = await page.locator('[data-region-value="revenue"]').first().textContent();
    await page.locator('.qa-controls').last().locator('summary').click();
    for (const state of ['loading','empty','error','ready']) { await page.locator('.qa-controls').last().locator(`[data-state-set="${state}"]`).click(); proof[`state_${state}`] = await page.locator('[data-view-state]').getAttribute('data-view-state'); }
    await page.locator('[data-detail-trigger]').first().click(); proof.detailVisible = await page.locator('[data-detail-panel]').isVisible();
  } else if (id === 'web-reading') {
    await page.locator('[data-search]').fill('上一有效版本'); proof.searchResults = await page.locator('.article-list button').count();
    await page.locator('[data-source-drawer]').click(); proof.sourcesVisible = await page.locator('[data-source-list]').isVisible();
  } else if (id === 'project-kanban') {
    await page.locator('[data-status="blocked"]').click(); proof.blockedItems = await page.locator('[data-work-item]').count();
    await page.locator('[data-work-item] [data-detail-trigger]').click(); proof.detailVisible = await page.locator('[data-detail-panel]').isVisible();
  } else if (id === 'executive-board' || id === 'proposal-presentation') {
    await page.locator('[data-motion-action="replay"]').click(); await page.waitForTimeout(120); await page.locator('[data-motion-action="pause"]').click();
    proof.motionPaused = (await page.locator('[data-motion-status]').textContent())?.includes('暂停');
    await page.locator('[data-motion-action="play"]').click();
  } else if (id === 'research-report') {
    await page.locator('[data-source-drawer]').click(); proof.sourcesVisible = await page.locator('[data-source-list]').isVisible();
    proof.tocLinks = await page.locator('[data-report-toc] a').count();
  }
  return proof;
}

for (const demo of manifest.demos) {
  for (const viewport of [{name:'desktop',width:1440,height:1000},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844}]) {
    for (const theme of ['dark','light']) {
      const context = await browser.newContext({ viewport, reducedMotion:'no-preference' });
      const blocked=[]; await context.route(/^https?:\/\//, route => { blocked.push(route.request().url()); route.abort(); });
      const page = await context.newPage(); const consoleErrors=[]; page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>consoleErrors.push(e.message));
      const url = new URL(pathToFileURL(path.join(DEMOS,demo.entry)).href); url.searchParams.set('theme',theme);
      try {
        await page.goto(url.href,{waitUntil:'load',timeout:30000}); await page.waitForTimeout(800);
        const metrics=await measure(page); const frames=await inspectFrames(page);
        if ((viewport.name==='desktop'&&theme==='dark')||(viewport.name==='mobile'&&theme==='light')) await page.screenshot({path:path.join(EVIDENCE,`${demo.id}-${viewport.name}-${theme}.png`),fullPage:true});
        if (demo.id==='proposal-presentation'&&viewport.name==='mobile'&&theme==='light') {
          const embedded=page.locator('iframe');
          for (const [index,label] of ['archify','infographic'].entries()) {
            await embedded.nth(index).scrollIntoViewIfNeeded();
            await page.waitForTimeout(250);
            await embedded.nth(index).screenshot({path:path.join(EVIDENCE,`proposal-${label}-iframe-mobile.png`)});
          }
        }
        const proof=await interactions(page,demo.id);
        const ok=!metrics.horizontalOverflow && metrics.bodyTextLength>180 && metrics.semanticBodyPx.every(n=>n>=16) && metrics.clipped.length===0 && metrics.displayTitleViolations.length===0 && proof.keyboardFocus && consoleErrors.length===0 && frames.every(f=>!f.error && f.text>20 && f.svg>0);
        const row={demo:demo.id,viewport:viewport.name,theme,ok,metrics,frames,proof,blockedExternalRequests:blocked,consoleErrors}; results.push(row); if(!ok) errors.push(row);
      } catch(error) { const row={demo:demo.id,viewport:viewport.name,theme,ok:false,error:error.message}; results.push(row); errors.push(row); }
      await context.close();
    }
  }
}

for (const special of [
  {id:'web-reading',name:'text-200-mobile',viewport:{width:390,height:844},reducedMotion:'no-preference',font200:true},
  {id:'research-report',name:'text-200-desktop',viewport:{width:1440,height:1000},reducedMotion:'no-preference',font200:true},
  {id:'executive-board',name:'reduced-motion',viewport:{width:1440,height:1000},reducedMotion:'reduce'},
  {id:'proposal-presentation',name:'reduced-motion',viewport:{width:390,height:844},reducedMotion:'reduce'},
]) {
  const demo=manifest.demos.find(x=>x.id===special.id); const context=await browser.newContext({viewport:special.viewport,reducedMotion:special.reducedMotion});
  const page=await context.newPage(); await page.goto(pathToFileURL(path.join(DEMOS,demo.entry)).href,{waitUntil:'load'}); if(special.font200) await page.addStyleTag({content:'html{font-size:32px!important}'}); await page.waitForTimeout(300);
  const metrics=await measure(page); const motionHidden=await page.locator('.motion-controls').count() ? await page.locator('.motion-controls').evaluate(el=>getComputedStyle(el).display==='none') : null;
  const ok=!metrics.horizontalOverflow && metrics.clipped.length===0 && metrics.displayTitleViolations.length===0 && (!special.font200||metrics.semanticBodyPx.every(n=>n>=32)) && (special.reducedMotion!=='reduce'||motionHidden===true);
  const row={demo:special.id,special:special.name,ok,metrics,motionHidden}; results.push(row); if(!ok)errors.push(row); await page.screenshot({path:path.join(EVIDENCE,`${special.id}-${special.name}.png`),fullPage:true}); await context.close();
}

{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});
  const blocked=[]; await context.route(/^https?:\/\//, route => { blocked.push(route.request().url()); route.abort(); });
  const page=await context.newPage(); const consoleErrors=[]; page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>consoleErrors.push(e.message));
  const url=new URL(pathToFileURL(path.join(ROOT,'portal','index.html')).href); url.hash='product-design';
  try {
    await page.goto(url.href,{waitUntil:'load',timeout:30000});
    await page.locator('#pd-font-weight').evaluate(el=>{el.value='700';el.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.waitForTimeout(200);
    const proof=await page.evaluate(()=>{
      const preview=document.querySelector('#pd-live-preview');
      const body=document.querySelector('#pd-live-body');
      return {
        selectedWeight:document.querySelector('#pd-font-weight').value,
        outputWeight:document.querySelector('#pd-font-weight-output').textContent,
        previewFontFamily:getComputedStyle(preview).fontFamily,
        bodyFontWeight:getComputedStyle(body).fontWeight,
        proposal:document.querySelector('#pd-token-proposal').textContent,
      };
    });
    const ok=proof.selectedWeight==='700' && proof.outputWeight==='700' && proof.bodyFontWeight==='700' && /Helvetica/i.test(proof.previewFontFamily) && /Microsoft YaHei/i.test(proof.previewFontFamily) && /"bodyWeight": 700/.test(proof.proposal) && blocked.length===0 && consoleErrors.length===0;
    const row={surface:'portal-product-design',special:'bilingual-font-and-weight',ok,proof,blockedExternalRequests:blocked,consoleErrors}; results.push(row); if(!ok)errors.push(row);
    await page.screenshot({path:path.join(EVIDENCE,'portal-product-design-font-weight-700.png'),fullPage:true});
  } catch(error) { const row={surface:'portal-product-design',special:'bilingual-font-and-weight',ok:false,error:error.message}; results.push(row); errors.push(row); }
  await context.close();
}

for (const sceneCheck of [
  {theme:'dark',expected:'rgb(0, 0, 0)',reducedMotion:'no-preference',interactive:true},
  {theme:'light',expected:'rgb(255, 255, 255)',reducedMotion:'no-preference',interactive:true},
  {theme:'dark',expected:'rgb(0, 0, 0)',reducedMotion:'reduce',interactive:false},
]) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:sceneCheck.reducedMotion});
  const blocked=[]; await context.route(/^https?:\/\//, route => { blocked.push(route.request().url()); route.abort(); });
  const page=await context.newPage(); const consoleErrors=[]; page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())}); page.on('pageerror',e=>consoleErrors.push(e.message));
  const url=new URL(pathToFileURL(path.join(ROOT,'portal','index.html')).href); url.hash='review';
  try {
    await page.goto(url.href,{waitUntil:'load',timeout:30000});
    if(sceneCheck.theme==='light') await page.locator('#theme-toggle').evaluate(el=>el.click());
    await page.waitForFunction(() => ['ready','reduced-motion'].includes(document.querySelector('[data-gary-scene-engine="dot-grid"]')?.dataset.sceneStatus));
    const canvas=page.locator('.gary-dot-grid-canvas');
    const before=await canvas.evaluate(el=>el.toDataURL());
    await page.mouse.move(720,500); await page.waitForTimeout(80);
    const after=await canvas.evaluate(el=>el.toDataURL());
    const proof=await page.evaluate(()=>({
      background:getComputedStyle(document.documentElement).backgroundColor,
      backgroundImage:getComputedStyle(document.querySelector('.portal-scene')).backgroundImage,
      status:document.querySelector('[data-gary-scene-engine="dot-grid"]').dataset.sceneStatus,
      canvasCount:document.querySelectorAll('.gary-dot-grid-canvas').length,
      displayTitle:(()=>{const el=document.querySelector('.review-surface .gary-role-title'),style=getComputedStyle(el),rect=el.getBoundingClientRect(),lineHeight=parseFloat(style.lineHeight),text=el.textContent.trim();return{text,whiteSpace:style.whiteSpace,lineCount:Math.round(rect.height/lineHeight),hasPunctuation:/[，。！？：；、,.!?;:]/.test(text),overflows:el.scrollWidth>el.clientWidth+2}})(),
    }));
    const changed=before!==after;
    const expectedStatus=sceneCheck.reducedMotion==='reduce'?'reduced-motion':'ready';
    const ok=proof.background===sceneCheck.expected && proof.canvasCount===1 && proof.status===expectedStatus && changed===sceneCheck.interactive && proof.displayTitle.whiteSpace==='nowrap' && proof.displayTitle.lineCount===1 && !proof.displayTitle.hasPunctuation && !proof.displayTitle.overflows && blocked.length===0 && consoleErrors.length===0;
    const row={surface:'portal-review',special:`dot-grid-${sceneCheck.theme}-${sceneCheck.reducedMotion}`,ok,proof,canvasChangedAfterPointer:changed,blockedExternalRequests:blocked,consoleErrors}; results.push(row); if(!ok)errors.push(row);
    await page.screenshot({path:path.join(EVIDENCE,`portal-dot-grid-${sceneCheck.theme}-${sceneCheck.reducedMotion}.png`),fullPage:true});
  } catch(error) { const row={surface:'portal-review',special:`dot-grid-${sceneCheck.theme}-${sceneCheck.reducedMotion}`,ok:false,error:error.message}; results.push(row); errors.push(row); }
  await context.close();
}

const report={schemaVersion:1,generatedAt:new Date().toISOString(),browser:executablePath,summary:{checks:results.length,passed:results.length-errors.length,failed:errors.length},method:"real Chromium; 200% uses 32px root font-size, not page zoom; external HTTP(S) requests blocked",results};
fs.writeFileSync(path.join(EVIDENCE,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
console.log(JSON.stringify(report.summary));
if(errors.length)process.exitCode=1;
