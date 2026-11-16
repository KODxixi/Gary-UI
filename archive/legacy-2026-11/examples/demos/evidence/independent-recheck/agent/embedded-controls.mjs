import { chromium } from '../../../../../adapters/visual/node_modules/playwright-core/index.mjs';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const out=fileURLToPath(new URL('.',import.meta.url));
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'});
const results=[];
try{
for(const width of [320,390]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/portal/#demos');await page.waitForTimeout(500);const frame=page.frames().find(f=>f.url().includes('/examples/demos/index.html'));await frame.locator('.gary-background-nav').waitFor();
 const read=()=>({theme:document.documentElement.dataset.garyTheme,open:!!document.querySelector('.gary-background-lab[open]'),viewport:innerWidth,docWidth:document.documentElement.scrollWidth,brand:{client:document.querySelector('.demo-nav__brand').getBoundingClientRect().toJSON(),scrollWidth:document.querySelector('.demo-nav__brand').scrollWidth},panel:document.querySelector('.gary-background-lab[open]')?.getBoundingClientRect().toJSON()||null,headerText:[...document.querySelector('.demo-nav').childNodes].length});
 const r={width,initial:await frame.evaluate(read)};
 await frame.locator('.gary-background-nav').click();r.background=await frame.evaluate(read);r.outerThemeAfterBackground=await page.evaluate(()=>document.documentElement.dataset.garyTheme);await page.screenshot({path:out+`embedded-background-${width}.png`});
 await page.keyboard.press('Escape');r.escape=await frame.evaluate(read);
 await frame.locator('[data-theme-toggle]').click();r.theme=await frame.evaluate(read);r.outerThemeAfterTheme=await page.evaluate(()=>document.documentElement.dataset.garyTheme);await page.screenshot({path:out+`embedded-theme-${width}.png`});
 await frame.locator('.gary-header-menu').click();r.menu={open:await frame.locator('.gary-header-menu').getAttribute('aria-expanded'),visibleLinks:await frame.locator('.demo-nav__links a:visible').count()};await context.close();results.push(r);
}
}finally{await browser.close();await writeFile(out+'embedded-controls.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
