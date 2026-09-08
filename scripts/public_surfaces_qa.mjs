import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../adapters/visual/node_modules/playwright-core/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = await mkdtemp(path.join(tmpdir(), 'gary-public-surfaces-'));
const fixture = `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;background:#192331;color:#fff;font:18px system-ui;min-height:1700px}
.backdrop{position:absolute;inset:0 0 auto;height:640px;background:repeating-linear-gradient(32deg,#d6e8fb 0 14px,#20374f 14px 30px,#5a8cb2 30px 44px,#f1d69e 44px 56px)}
.card{position:relative;left:80px;top:100px;width:430px;height:290px;padding:56px;border:1px solid #ffffff40;border-radius:36px;background:#ffffff12;backdrop-filter:blur(12px);box-shadow:inset 0 1px #ffffff88}
[data-gary-refraction-state="svg"]{backdrop-filter:var(--gary-refraction-filter);background:#ffffff0a}
.gary-refraction-filter{position:absolute;width:0;height:0;pointer-events:none}
h1{font-size:30px;margin:0 0 20px}.waves{position:absolute;top:700px;left:0;width:800px;height:520px;overflow:hidden}
.gary-gradient-waves-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
</style></head><body><div class="backdrop"></div><article id="glass" class="card" data-gary-refraction><h1>Gary optical glass</h1><p>Readable foreground<br>Stationary rounded geometry</p></article><div id="waves" class="waves"></div>
<script src="/optical-glass.js"></script><script src="/ambient-waves.js"></script></body></html>`;
const server = http.createServer(async (req, res) => {
  const filename = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (!['optical-glass.js', 'ambient-waves.js'].includes(filename)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(fixture); return;
  }
  res.setHeader('Content-Type', 'text/javascript');
  try { res.end(await readFile(path.join(root, 'patterns/shared', filename))); }
  catch (error) { if (error.code === 'ENOENT') res.end('/* Module not implemented yet. */'); else throw error; }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: process.env.GARY_UI_CHROME || process.env.CHROME_PATH || chromium.executablePath(), headless: true, args: ['--disable-background-timer-throttling'] });
const context = await browser.newContext({ viewport: { width: 1100, height: 1350 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const report = { output, checks: [], browser: browser.version() };
const check = (name, value) => { assert.ok(value, name); report.checks.push(name); };
async function pixelDifference(first, second) {
  return page.evaluate(async ([a,b]) => {
    const decode = async src => { const img = new Image(); img.src = 'data:image/png;base64,' + src; await img.decode(); const c = document.createElement('canvas'); c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,c.width,c.height).data; };
    const x=await decode(a),y=await decode(b);let changed=0,total=0;
    for(let i=0;i<x.length;i+=4){const d=Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2]);total+=d;if(d>12)changed++;}
    return {changed,pixels:x.length/4,meanDifference:total/(x.length/4)/3};
  }, [first.toString('base64'), second.toString('base64')]);
}
try {
  await page.goto(origin);
  check('both public APIs available', await page.evaluate(() => !!window.GaryGlassSurface && !!window.GaryGradientWaves));
  check('wave renderer is opt-in', await page.locator('.gary-gradient-waves-canvas').count() === 0);
  await page.waitForFunction(() => document.querySelector('#glass').dataset.garyRefractionState === 'svg');
  const geometry = await page.locator('#glass').boundingBox();
  check('foreground has no CSS filter', await page.locator('#glass h1').evaluate(el => getComputedStyle(el).filter === 'none'));
  await page.evaluate(() => GaryGlassSurface.setStrength(0));
  await page.waitForTimeout(120);
  const zero = await page.screenshot({ clip: geometry, path: path.join(output, 'glass-0.png') });
  await page.evaluate(() => GaryGlassSurface.setStrength(180));
  await page.waitForTimeout(120);
  const full = await page.screenshot({ clip: geometry, path: path.join(output, 'glass-180.png') });
  report.refractionPixels = await pixelDifference(zero, full);
  check('refraction 0 to 180 changes actual backdrop pixels', report.refractionPixels.changed > 1000);
  assert.deepEqual(await page.locator('#glass').boundingBox(), geometry);report.checks.push('refraction preserves layout dimensions');
  check('one displacement operation without color separation', await page.locator('#glass feDisplacementMap').count() === 1);
  const oldMap = await page.locator('#glass feImage').getAttribute('href');
  await page.locator('#glass').evaluate(el => el.style.width='520px');
  await page.waitForFunction(old => document.querySelector('#glass feImage').getAttribute('href') !== old, oldMap);
  report.checks.push('resize regenerates the normal field');
  await page.evaluate(() => { const c=document.createElement('div');c.className='card';c.id='dynamic';c.setAttribute('data-gary-refraction','');document.body.append(c); });
  await page.waitForFunction(() => document.querySelector('#dynamic').dataset.garyRefractionState === 'svg');
  check('dynamic card mounts a unique filter', await page.locator('.gary-refraction-filter filter').evaluateAll(els => new Set(els.map(x=>x.id)).size===2));
  await page.evaluate(() => { window.removedCard=document.querySelector('#dynamic');removedCard.remove(); });
  await page.waitForFunction(() => !removedCard.querySelector('svg') && !removedCard.hasAttribute('data-gary-refraction-state'));
  report.checks.push('removed card releases its filter and state');
  await page.evaluate(() => { window.wave=GaryGradientWaves.mount(document.querySelector('#waves')); });
  await page.waitForFunction(() => wave.state.frames > 2);
  check('repeated mount reuses one renderer', await page.evaluate(() => GaryGradientWaves.mount(document.querySelector('#waves'))===wave&&document.querySelectorAll('.gary-gradient-waves-canvas').length===1));
  check('ranges expose controller-compatible triples', await page.evaluate(() => Object.values(GaryGradientWaves.ranges).every(r => Array.isArray(r)&&r.length===3)));
  check('invalid and out-of-range options normalize safely', await page.evaluate(() => { const o=GaryGradientWaves.normalize({speed:999,opacity:-1,amplitude:NaN,horizonColor:'url(test)',detail:'invalid',grain:'false'});return o.speed===GaryGradientWaves.ranges.speed[1]&&o.opacity===0&&Number.isFinite(o.amplitude)&&o.horizonColor===GaryGradientWaves.defaults.horizonColor&&o.detail===GaryGradientWaves.defaults.detail&&o.grain===GaryGradientWaves.defaults.grain; }));
  await page.evaluate(() => wave.pause());
  const paused = await page.evaluate(() => wave.state);
  await page.waitForTimeout(200);
  check('pause holds frames and time', await page.evaluate(s => wave.state.frames===s.frames&&wave.state.time===s.time&&wave.state.status==='paused',paused));
  const png = await page.evaluate(() => wave.snapshot());
  check('snapshot returns a PNG', png.startsWith('data:image/png;base64,') && png.length>3000);
  check('PNG includes configured opacity', await page.evaluate(async data => {const img=new Image();img.src=data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);const alpha=ctx.getImageData(0,0,c.width,c.height).data;let max=0;for(let i=3;i<alpha.length;i+=4)max=Math.max(max,alpha[i]);return max<=Math.ceil(wave.state.options.opacity*255)&&max>50;},png));
  await writeFile(path.join(output,'silver-waves.png'),Buffer.from(png.split(',')[1],'base64'));
  await page.evaluate(() => { window.waveEvents=[];document.querySelector('#waves').addEventListener('gary-waves-status',e=>waveEvents.push(e.detail.status));wave.play(); });
  await page.waitForFunction(t => wave.state.time>t,paused.time);
  check('play resumes and emits the controller event', await page.evaluate(() => waveEvents.includes('playing')));
  check('playing changes the rendered wave image', await page.evaluate(previous => wave.snapshot()!==previous,png));
  await page.evaluate(() => wave.update({speed:0}));
  check('zero speed is static', await page.evaluate(() => wave.state.status==='static'));
  await page.evaluate(() => wave.update({speed:.1}));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => wave.state.status==='reduced-motion');
  const reduced = await page.evaluate(() => ({state:wave.state,png:wave.snapshot()}));
  await page.mouse.move(740,1120);await page.waitForTimeout(150);
  check('reduced motion is static and ignores pointer parallax', await page.evaluate(s=>wave.state.frames===s.state.frames&&wave.snapshot()===s.png,reduced));
  await page.emulateMedia({reducedMotion:'no-preference',media:'print'});
  await page.waitForFunction(() => wave.state.status==='print');
  report.checks.push('print pauses rendering');
  await page.emulateMedia({media:'screen'});
  await page.waitForFunction(() => wave.state.status==='playing');
  await page.locator('#waves').evaluate(el=>el.style.top='2500px');
  await page.waitForFunction(() => wave.state.status==='suspended');
  const suspended=await page.evaluate(()=>wave.state.frames);await page.waitForTimeout(120);
  check('offscreen host suspends frames', await page.evaluate(n=>wave.state.frames===n,suspended));
  await page.evaluate(() => wave.update({speed:0}));
  await page.locator('#waves').evaluate(el=>{el.style.top='700px';el.style.width='680px';});
  await page.waitForFunction(() => wave.state.status==='static'&&wave.state.width===680);
  check('static offscreen update is painted when visible', await page.evaluate(n=>wave.state.frames>n,suspended));
  await page.evaluate(() => wave.update({speed:.1}));
  await page.waitForFunction(() => wave.state.status==='playing');
  report.checks.push('onscreen host resumes and resizes');
  await page.evaluate(() => { Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange')); });
  check('visibility signal suspends rendering', await page.evaluate(()=>wave.state.status==='suspended'));
  await page.evaluate(() => { delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));wave.pause();wave.replay(); });
  check('replay resets playback', await page.evaluate(()=>wave.state.time<.1&&wave.state.frames<3&&wave.state.status==='playing'));
  await page.evaluate(() => {wave.destroy();wave.destroy();GaryGlassSurface.destroy(document.querySelector('#glass'));});
  check('destroy removes owned canvases and filters', await page.locator('.gary-gradient-waves-canvas,.gary-refraction-filter').count()===0);
  check('destroy clears only owned card state', await page.locator('#glass').evaluate(el=>!el.hasAttribute('data-gary-refraction-state')&&!el.style.getPropertyValue('--gary-refraction-filter')));
  for(const mode of ['fallback','frosted']){
    await page.goto(origin+'/?glass='+mode);
    await page.waitForFunction(()=>document.querySelector('#glass').dataset.garyRefractionState==='fallback');
    check(mode+' mode preserves base glass', await page.locator('#glass').evaluate(el=>!el.querySelector('svg')&&getComputedStyle(el).backdropFilter==='blur(12px)'));
  }
  const fallbackPage=await context.newPage();
  await fallbackPage.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=function(){return null;};});
  await fallbackPage.goto(origin);
  check('unavailable canvas produces a controlled fallback', await fallbackPage.evaluate(()=>GaryGradientWaves.mount(document.querySelector('#waves')).state.status==='fallback'));
  await fallbackPage.close();
  assert.deepEqual(errors,[]);report.checks.push('no uncaught browser errors');
  report.passed=true;
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
