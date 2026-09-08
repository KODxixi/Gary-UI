import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as lucide from 'lucide';
import { Transformer } from 'markmap-lib';

import { motion, palettes, policyMetadata, sceneRules, themes, typography } from './policy.mjs';


const MODULE_FILE = typeof __filename === 'string' ? __filename : fileURLToPath(import.meta.url);
const MODULE_ROOT = path.dirname(MODULE_FILE);
const ADAPTER_ROOT = path.resolve(MODULE_ROOT, '..');
const readRuntime = (relative) => fs.readFileSync(path.join(ADAPTER_ROOT, relative), 'utf8');

const ECHARTS_RUNTIME = readRuntime('vendor/browser/echarts.min.js');
const MERMAID_RUNTIME = readRuntime('vendor/browser/mermaid.min.js');
const D3_RUNTIME = readRuntime('vendor/browser/d3.min.js');
const MARKMAP_RUNTIME = readRuntime('vendor/browser/markmap-view.js');
const INFOGRAPHIC_RUNTIME = readRuntime('vendor/browser/infographic.min.js');

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}


export function escapeInlineJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}


export function validateTextSource(text, tool) {
  if (typeof text !== 'string' || !text.trim()) throw new Error(`${tool} source is empty`);
  const blocked = /<\s*(script|iframe|object|embed)|javascript\s*:|\bon(?:error|load|click)\s*=|\bclick\s+\S+\s+["']?/i;
  if (blocked.test(text)) throw new Error(`${tool} source contains executable content`);
  return text;
}


function commonCss(themeName, scene) {
  const theme = themes[themeName];
  const rules = sceneRules[scene] || sceneRules.analysis;
  const sceneCss = `--content-gap:${rules.contentGap};--section-gap:${rules.sectionGap};--surface-alpha:${rules.surfaceAlpha};`;
  return `
    :root{color-scheme:${themeName};${sceneCss}}
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background-color:${theme.page};background-image:radial-gradient(circle,${theme.grid} 1px,transparent 1.2px);background-size:28px 28px;color:${theme.text};font-family:${typography.fontFamily};font-size:${typography.bodyFontSize};line-height:${typography.bodyLineHeight}}
    body{padding:clamp(16px,3vw,40px)}
    body[data-scene="showcase"]{background-color:${theme.page}}
    .visual-shell{width:min(1440px,100%);margin:0 auto;display:grid;gap:var(--content-gap)}
    .visual-header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:20px 24px;border:1px solid ${theme.border};border-radius:30px;background:${theme.surface};box-shadow:0 2px 8px #0002}
    .visual-header h1{margin:0;font-size:clamp(24px,4vw,42px);line-height:1.12;text-wrap:balance}
    .visual-meta{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .visual-meta span,.motion-controls button{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border:1px solid ${theme.border};border-radius:999px;background:transparent;color:inherit;font:inherit}
    .motion-controls{display:flex;gap:8px;flex-wrap:wrap}
    .motion-controls button{cursor:pointer}
    .motion-controls button:focus-visible,summary:focus-visible{outline:3px solid ${palettes[themeName][0]};outline-offset:3px}
    .gary-visual-stage{min-height:620px;overflow:auto;border:1px solid ${theme.border};border-radius:30px;background:color-mix(in srgb,${theme.surface} var(--surface-alpha),transparent);padding:clamp(16px,3vw,32px)}
    .gary-visual-stage>svg,.gary-visual-stage #chart{display:block;width:100%;min-height:560px}
    .visual-footer{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,.45fr);gap:var(--content-gap);align-items:start}
    .visual-note,.visual-source{border-top:1px solid ${theme.border};padding-top:16px;color:${theme.secondary}}
    .visual-note strong{color:${theme.text}}
    .visual-source summary{min-height:44px;display:flex;align-items:center;cursor:pointer;color:${theme.text}}
    .visual-source pre{overflow:auto;max-height:360px;padding:16px;border-radius:18px;background:${theme.surface};color:${theme.text};font:13px/1.6 Consolas,monospace;white-space:pre-wrap}
    table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
    th,td{padding:10px 12px;border-bottom:1px solid ${theme.border};text-align:left}
    td:not(:first-child),th:not(:first-child){text-align:right}
    .icon-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}
    .icon-item{display:grid;place-items:center;gap:12px;min-height:180px;border:1px solid ${theme.border};border-radius:24px;background:${theme.surface}}
    .icon-item svg{width:48px;height:48px;stroke:${palettes[themeName][0]};stroke-width:1.75}
    .icon-item code{font-size:13px;color:${theme.secondary}}
    #infographic-target{width:100%;height:620px;min-height:560px}
    .antv-infographic{display:block;width:100%;height:auto!important;min-height:260px!important;max-height:620px}
    .infographic-copy{display:grid;margin:18px 0 0;padding:0;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;list-style:none;counter-reset:step}
    .infographic-copy li{padding:16px;border:1px solid ${theme.border};border-radius:18px;background:${theme.surface};counter-increment:step}
    .infographic-copy strong{display:block;margin-bottom:4px;color:${theme.text};font-size:15px}
    .infographic-copy strong::before{content:counter(step,decimal-leading-zero) " · ";color:${palettes[themeName][1]}}
    .infographic-copy span{color:${theme.secondary};font-size:13px;line-height:1.68}
    @media(max-width:767px){body{padding:12px}.visual-header{display:grid;padding:18px;border-radius:24px}.visual-meta{justify-content:flex-start}.gary-visual-stage{padding:12px;border-radius:24px;min-height:520px}.gary-visual-stage>svg,.gary-visual-stage #chart,#infographic-target{min-height:480px}.visual-footer{grid-template-columns:1fr}}
    html[data-embed="true"] body{padding:0;overflow:hidden}
    html[data-embed="true"] .visual-shell{width:100%;min-height:100vh}
    html[data-embed="true"] .visual-header,html[data-embed="true"] .visual-footer{display:none}
    html[data-embed="true"] .gary-visual-stage{min-height:100vh;padding:12px;border:0;border-radius:0;box-shadow:none}
    html[data-embed="true"] .gary-visual-stage>svg,html[data-embed="true"] .gary-visual-stage #chart{min-height:calc(100vh - 24px)}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}.motion-controls{display:none!important}}
    body[data-motion="paused"] *,body[data-motion="paused"] *::before,body[data-motion="paused"] *::after{animation-play-state:paused!important}
    @media print{body{padding:0;background:${theme.page}}.motion-controls,.visual-source{display:none}.visual-header,.gary-visual-stage{border-radius:0;box-shadow:none}.gary-visual-stage{overflow:visible}}
  `;
}


function sourcePanel(source) {
  return `<details class="visual-source"><summary>查看原生源文件</summary><pre>${escapeHtml(source)}</pre></details>`;
}


function citationBlock(citation = {}) {
  const label = escapeHtml(citation.label || '来源未标注');
  const note = escapeHtml(citation.note || '');
  const url = citation.url ? `<a href="${escapeHtml(citation.url)}" rel="noreferrer">${label}</a>` : `<strong>${label}</strong>`;
  return `<p class="visual-note">来源：${url}${note ? ` · ${note}` : ''}</p>`;
}


function controls(scene) {
  if (scene !== 'showcase') return '';
  return `<div class="motion-controls" aria-label="演示控制"><button type="button" data-motion-action="play">播放</button><button type="button" data-motion-action="pause">暂停</button><button type="button" data-motion-action="replay">重播</button><span data-motion-state role="status" aria-live="polite">就绪</span></div>`;
}


function motionController(scene) {
  if (scene !== 'showcase') return '';
  const stepDelay = Math.round(motion.feedbackMs / 2);
  const completionMs = motion.dataUpdateMs + (7 * stepDelay) + motion.reorderMs;
  return `<script>(()=>{const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const stage=document.querySelector('.gary-visual-stage');const state=document.querySelector('[data-motion-state]');let animations=[];let completionTimer=0;const setState=(value,label)=>{document.body.dataset.motion=value;if(state)state.textContent=label};const targets=()=>{const svg=stage?.querySelector('svg');const groups=svg?Array.from(svg.querySelectorAll(':scope>g')).slice(0,8):[];return groups.length?groups:Array.from(stage?.children||[]).slice(0,8)};const complete=()=>{clearTimeout(completionTimer);animations.forEach((item)=>item.cancel());animations=[];targets().forEach((item)=>{item.style.opacity='1';item.style.transform='none'});setState('complete','已完整呈现')};const finishIfPlaying=()=>{if(document.body.dataset.motion==='playing')complete()};const start=()=>{if(reduced){complete();return}clearTimeout(completionTimer);animations.forEach((item)=>item.cancel());animations=targets().map((item,index)=>item.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:${motion.dataUpdateMs},delay:Math.min(index,7)*${stepDelay},easing:'cubic-bezier(.32,.72,0,1)',fill:'both'}));setState('playing','播放中');Promise.allSettled(animations.map((item)=>item.finished)).then(finishIfPlaying);completionTimer=setTimeout(finishIfPlaying,${completionMs})};document.querySelectorAll('[data-motion-action]').forEach((button)=>button.addEventListener('click',()=>{const action=button.dataset.motionAction;if(action==='pause'){animations.forEach((item)=>item.pause());setState('paused','已暂停')}else if(action==='play'&&animations.length){animations.forEach((item)=>item.play());setState('playing','播放中')}else{start()}}));if(reduced)complete();else setTimeout(start,${motion.feedbackMs})})();</script>`;
}


function shell({ title, visual, content, source, scripts = '', afterStage = '' }) {
  const theme = themes[visual.theme] ? visual.theme : 'dark';
  const scene = visual.scene || 'analysis';
  return `<!doctype html>
<html lang="zh-CN" data-gary-theme="${theme}" data-gary-theme-source="${policyMetadata.themeSource}" data-gary-scene-source="${policyMetadata.sceneSource}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${escapeHtml(title)}</title><script>if(new URLSearchParams(location.search).get('embed')==='1')document.documentElement.dataset.embed='true';</script><style>${commonCss(theme, scene)}</style></head>
<body data-scene="${scene}"><main class="visual-shell"><header class="visual-header"><div><h1>${escapeHtml(title)}</h1>${controls(scene)}</div><div class="visual-meta"><span>${escapeHtml(scene)}</span><span>${escapeHtml(visual.tool || '')}</span><span>${escapeHtml(theme)}</span></div></header><section class="gary-visual-stage" aria-label="${escapeHtml(title)}">${content}</section>${afterStage}<footer class="visual-footer">${citationBlock(visual.citation)}${sourcePanel(source)}</footer></main>
${motionController(scene)}${scripts}</body></html>`;
}


function tableHtml(rows) {
  if (!Array.isArray(rows) || rows.length < 2) throw new Error('ECharts source requires a table fallback');
  const [head, ...body] = rows;
  if (!Array.isArray(head) || head.length < 2) throw new Error('ECharts table header is invalid');
  return `<details class="visual-source" open><summary>查看数据表</summary><table><thead><tr>${head.map((cell) => `<th scope="col">${escapeHtml(cell)}</th>`).join('')}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}


export function buildEchartsHtml(source, visual) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) throw new Error('ECharts source must be an object');
  if (!source.option || typeof source.option !== 'object') throw new Error('ECharts option is required');
  const theme = themes[visual.theme] || themes.dark;
  const themeName = `gary-${visual.theme}`;
  const option = {
    animation: true,
    animationDuration: motion.dataUpdateMs,
    color: palettes[visual.theme] || palettes.dark,
    textStyle: { color: theme.text, fontFamily: typography.fontFamily },
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { textStyle: { color: theme.secondary } },
    ...source.option,
  };
  const runtime = `${ECHARTS_RUNTIME}\nconst option=${escapeInlineJson(option)};const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;option.animation=!reduced;echarts.registerTheme('${themeName}',${escapeInlineJson({ color: palettes[visual.theme], textStyle: { color: theme.text }, categoryAxis: { axisLine: { lineStyle: { color: theme.border } }, splitLine: { lineStyle: { color: theme.grid } } }, valueAxis: { axisLine: { lineStyle: { color: theme.border } }, splitLine: { lineStyle: { color: theme.grid } } } })});const chart=echarts.init(document.getElementById('chart'),'${themeName}',{renderer:'svg'});chart.setOption(option);addEventListener('resize',()=>chart.resize());setTimeout(()=>{window.__garyVisualReady=true},50);`;
  return shell({
    title: source.title || visual.id,
    visual,
    content: '<div id="chart" role="img" aria-label="数据图表；完整数值见下方数据表"></div>',
    source: JSON.stringify(source, null, 2),
    afterStage: tableHtml(source.table),
    scripts: `<script>${runtime}</script>`,
  });
}


export function buildMarkmapHtml(markdown, visual) {
  validateTextSource(markdown, 'markmap');
  const transformer = new Transformer();
  const { root } = transformer.transform(markdown);
  const script = `${D3_RUNTIME}\n${MARKMAP_RUNTIME}\nconst data=${escapeInlineJson(root)};const palette=${escapeInlineJson(palettes[visual.theme] || palettes.dark)};markmap.Markmap.create(document.getElementById('markmap'),{autoFit:true,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:${motion.expandMs},color:(node)=>palette[node.state.depth%palette.length],maxWidth:240,paddingX:12},data);setTimeout(()=>{window.__garyVisualReady=true},80);`;
  return shell({
    title: markdown.match(/^#\s+(.+)$/m)?.[1] || visual.id,
    visual,
    content: '<svg id="markmap" role="img" aria-label="可折叠中文思维导图"></svg>',
    source: markdown,
    scripts: `<script>${script}</script>`,
  });
}


export function buildMermaidHtml(source, visual) {
  validateTextSource(source, 'mermaid');
  const theme = themes[visual.theme] || themes.dark;
  const config = {
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    flowchart: { htmlLabels: false, curve: 'basis' },
    themeVariables: {
      background: theme.page,
      primaryColor: theme.surface,
      primaryTextColor: theme.text,
      primaryBorderColor: palettes[visual.theme][0],
      lineColor: theme.secondary,
      secondaryColor: theme.surface,
      tertiaryColor: theme.page,
      fontFamily: typography.fontFamily,
    },
  };
  const script = `${MERMAID_RUNTIME}\nconst source=${escapeInlineJson(source)};mermaid.initialize(${escapeInlineJson(config)});mermaid.render('gary-mermaid',source).then(({svg,bindFunctions})=>{const target=document.getElementById('mermaid-target');target.innerHTML=svg;bindFunctions?.(target);window.__garyVisualReady=true}).catch((error)=>{document.getElementById('mermaid-target').textContent='Render failed: '+error.message;window.__garyVisualError=error.message});`;
  return shell({
    title: visual.title || visual.id,
    visual,
    content: '<div id="mermaid-target" role="img" aria-label="Mermaid 流程图"></div>',
    source,
    scripts: `<script>${script}</script>`,
  });
}


function attrsToText(attributes) {
  return Object.entries(attributes)
    .map(([name, value]) => `${name === 'className' ? 'class' : name}="${escapeHtml(value)}"`)
    .join(' ');
}


function lucideSvg(name) {
  const nodes = lucide[name];
  if (!Array.isArray(nodes)) throw new Error(`Unknown Lucide icon: ${name}`);
  const body = nodes.map(([tag, attributes]) => `<${tag} ${attrsToText(attributes)}></${tag}>`).join('');
  const kebab = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `<svg class="lucide lucide-${kebab}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-label="${escapeHtml(name)}" role="img">${body}</svg>`;
}


export function buildLucideHtml(source, visual) {
  if (!source || !Array.isArray(source.icons) || source.icons.length === 0) throw new Error('Lucide source requires icons');
  const content = `<div class="icon-grid">${source.icons.map((name) => `<article class="icon-item">${lucideSvg(name)}<code>${escapeHtml(name)}</code></article>`).join('')}</div>`;
  return shell({
    title: source.title || visual.id,
    visual,
    content,
    source: JSON.stringify(source, null, 2),
    scripts: '<script>window.__garyVisualReady=true;</script>',
  });
}


export async function buildInfographicHtml(source, visual) {
  if (!source || typeof source.syntax !== 'string') throw new Error('AntV Infographic syntax is required');
  validateTextSource(source.syntax, 'antv-infographic');
  const items = [];
  for (const line of source.syntax.split(/\r?\n/)) {
    const label = line.match(/^\s*-\s+label\s+(.+)$/);
    const description = line.match(/^\s+desc\s+(.+)$/);
    if (label) items.push({ label: label[1], description: '' });
    else if (description && items.length) items.at(-1).description = description[1];
  }
  const copy = `<ol class="infographic-copy">${items.map((item) => `<li><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></li>`).join('')}</ol>`;
  return shell({
    title: source.title || visual.id,
    visual,
    content: `<div id="infographic-target" role="img" aria-label="AntV 信息图"></div>${copy}`,
    source: source.syntax,
    scripts: `<script>${INFOGRAPHIC_RUNTIME}\n(()=>{try{AntVInfographic.getFonts().forEach((font)=>AntVInfographic.registerFont({...font,fontFamily:font.fontFamily.replaceAll('"',''),baseUrl:'',fontWeight:{}}));AntVInfographic.setDefaultFont('Helvetica Neue, Helvetica, Arial, Microsoft YaHei UI, Microsoft YaHei, 微软雅黑, sans-serif');const source=${escapeInlineJson(source.syntax)};const offlineSource=source.replace(/^\\s+icon\\s+.*$/gm,'');const target=document.getElementById('infographic-target');const infographic=new AntVInfographic.Infographic({container:target,width:'100%',height:'100%',theme:'${visual.theme}',editable:false});infographic.render(offlineSource);let attempts=0;const settle=()=>{const svg=target.querySelector('svg');const text=Array.from(target.querySelectorAll('foreignObject span,text')).map((node)=>node.textContent||node.innerText||'').join(' ').trim();if(svg&&text){svg.classList.add('antv-infographic');svg.setAttribute('role','img');svg.setAttribute('aria-label','AntV 信息图');window.__garyVisualReady=true;return}if(attempts++<60){requestAnimationFrame(settle);return}window.__garyVisualError='AntV Infographic browser render did not produce readable SVG text'};requestAnimationFrame(settle)}catch(error){window.__garyVisualError=error instanceof Error?error.message:String(error)}})();</script>`,
  });
}


export { palettes, themes };
