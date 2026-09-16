#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { exportArtifact, findBrowser, inspectArtifact } from './lib/exporter.mjs';
import {
  buildEchartsHtml,
  buildInfographicHtml,
  buildLucideHtml,
  buildMarkmapHtml,
  buildMermaidHtml,
  escapeHtml,
  escapeInlineJson,
  validateTextSource,
} from './lib/renderers.mjs';


const MODULE_FILE = typeof __filename === 'string' ? __filename : fileURLToPath(import.meta.url);
const MODULE_ROOT = path.dirname(MODULE_FILE);
const ADAPTER_ROOT = ['dist', 'runtime'].includes(path.basename(MODULE_ROOT))
  ? path.resolve(MODULE_ROOT, '..')
  : MODULE_ROOT;
const PROJECT_ROOT = path.resolve(ADAPTER_ROOT, '..', '..');
function resolveManagedSkillRoot(name) {
  const candidates = [
    path.resolve(PROJECT_ROOT, '..', '..', 'skills', name),
    path.resolve(ADAPTER_ROOT, '..', '..', '..', name),
  ];
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'SKILL.md'))) || candidates[0];
}
function resolveArchifyRoot() {
  const candidates = [
    process.env.GARY_UI_ARCHIFY_ROOT,
    path.resolve(PROJECT_ROOT, '..', '..', 'skills', 'archify'),
    path.resolve(ADAPTER_ROOT, '..', '..', '..', 'archify'),
    path.join(ADAPTER_ROOT, 'vendor', 'archify'),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'bin', 'archify.mjs')))
    || path.join(ADAPTER_ROOT, 'vendor', 'archify');
}
const ARCHIFY_ROOT = resolveArchifyRoot();
const ARCHIFY_CLI = path.join(ARCHIFY_ROOT, 'bin', 'archify.mjs');
const LOCK_PATH = path.join(ADAPTER_ROOT, 'toolchain.lock.json');

const DEFAULT_TOOLS = Object.freeze({
  architecture: 'archify',
  workflow: 'archify',
  sequence: 'archify',
  'data-flow': 'archify',
  lifecycle: 'archify',
  quantitative: 'echarts',
  outline: 'markmap',
  infographic: 'antv-infographic',
  'simple-flow': 'mermaid',
  icons: 'lucide',
});

const TOOL_SUFFIXES = Object.freeze({
  archify: new Set(['.json']),
  echarts: new Set(['.json']),
  markmap: new Set(['.md', '.markdown']),
  'antv-infographic': new Set(['.json']),
  mermaid: new Set(['.mmd', '.mermaid', '.md']),
  lucide: new Set(['.json']),
});

const FORMATS = new Set(['html', 'svg', 'png', 'pdf']);
const SCENES = new Set(['reading', 'analysis', 'showcase']);
const THEMES = new Set(['dark', 'light']);


class VisualError extends Error {}


function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    throw new VisualError(`Invalid JSON file ${file}: ${error.message}`);
  }
}


function safeRelative(root, raw, field) {
  if (typeof raw !== 'string' || !raw.trim()) throw new VisualError(`${field} must be a non-empty relative path`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || path.isAbsolute(raw)) throw new VisualError(`${field} must be local and relative`);
  const resolved = path.resolve(root, raw);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new VisualError(`${field} escapes the manifest directory`);
  return resolved;
}


function requireString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new VisualError(`${field} must be a non-empty string`);
  return value;
}


export function validateManifest(payload, manifestPath) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new VisualError('Visual manifest root must be an object');
  if (payload.schemaVersion !== 1) throw new VisualError('Visual manifest schemaVersion must be 1');
  requireString(payload.project, 'project');
  const manifestRoot = path.dirname(path.resolve(manifestPath));
  const outputRoot = safeRelative(manifestRoot, payload.outputRoot, 'outputRoot');
  if (!Array.isArray(payload.visuals) || payload.visuals.length === 0) throw new VisualError('visuals must be a non-empty array');
  const ids = new Set();
  const visuals = payload.visuals.map((visual, index) => {
    if (!visual || typeof visual !== 'object' || Array.isArray(visual)) throw new VisualError(`visuals[${index}] must be an object`);
    const id = requireString(visual.id, `visuals[${index}].id`);
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw new VisualError(`Invalid visual id: ${id}`);
    if (ids.has(id)) throw new VisualError(`Duplicate visual id: ${id}`);
    ids.add(id);
    const purpose = requireString(visual.purpose, `visuals[${index}].purpose`);
    const expectedTool = DEFAULT_TOOLS[purpose];
    if (!expectedTool) throw new VisualError(`Unsupported purpose: ${purpose}`);
    const tool = visual.tool || expectedTool;
    if (tool !== expectedTool) throw new VisualError(`Tool ${tool} is not the deterministic route for ${purpose}`);
    const sourcePath = safeRelative(manifestRoot, visual.source, `visuals[${index}].source`);
    if (!fs.statSync(sourcePath, { throwIfNoEntry: false })?.isFile()) throw new VisualError(`Source file does not exist: ${visual.source}`);
    if (!TOOL_SUFFIXES[tool].has(path.extname(sourcePath).toLowerCase())) throw new VisualError(`Source type is invalid for ${tool}: ${visual.source}`);
    if (!SCENES.has(visual.scene)) throw new VisualError(`Invalid scene for ${id}: ${visual.scene}`);
    if (!THEMES.has(visual.theme)) throw new VisualError(`Invalid theme for ${id}: ${visual.theme}`);
    if (!Array.isArray(visual.formats) || visual.formats.length === 0 || visual.formats.some((format) => !FORMATS.has(format))) throw new VisualError(`Invalid formats for ${id}`);
    if (!visual.citation || typeof visual.citation !== 'object' || !visual.citation.label) throw new VisualError(`Citation is required for ${id}`);
    return { ...visual, tool, sourcePath };
  });
  return { ...payload, manifestPath: path.resolve(manifestPath), manifestRoot, outputRoot, visuals };
}


export function loadManifest(manifestPath) {
  return validateManifest(readJson(path.resolve(manifestPath)), manifestPath);
}


function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}


function createRunId() {
  return `run-${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
}


export function promoteCandidate(candidate, target) {
  const status = fs.statSync(candidate, { throwIfNoEntry: false });
  if (!status?.isFile() || status.size === 0) throw new VisualError(`Verified candidate is missing or empty: ${candidate}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const backupRoot = path.join(path.dirname(target), '.last-good');
  if (fs.existsSync(target)) {
    fs.mkdirSync(backupRoot, { recursive: true });
    fs.copyFileSync(target, path.join(backupRoot, path.basename(target)));
  }
  fs.renameSync(candidate, target);
}


function parseArgs(argv) {
  const [action, ...rest] = argv;
  const options = { action, json: false, manifest: null, id: null, format: null };
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--json') options.json = true;
    else if (['--manifest', '--id', '--format'].includes(token)) {
      const value = rest[index + 1];
      if (!value) throw new VisualError(`${token} requires a value`);
      options[token.slice(2)] = value;
      index += 1;
    } else throw new VisualError(`Unknown option: ${token}`);
  }
  if (!['doctor', 'validate', 'render', 'export'].includes(action)) throw new VisualError('Usage: runner.mjs doctor|validate|render|export [--manifest FILE] [--id ID] [--format FORMAT] [--json]');
  if (action !== 'doctor' && !options.manifest) throw new VisualError(`--manifest is required for ${action}`);
  if (options.format && !FORMATS.has(options.format)) throw new VisualError(`Unsupported format: ${options.format}`);
  return options;
}


function selectVisuals(manifest, id) {
  const selected = id ? manifest.visuals.filter((visual) => visual.id === id) : manifest.visuals;
  if (id && selected.length === 0) throw new VisualError(`Visual id not found: ${id}`);
  return selected;
}


function archifyType(purpose) {
  return purpose === 'data-flow' ? 'dataflow' : purpose;
}


function runArchify(args) {
  const result = spawnSync(process.execPath, [ARCHIFY_CLI, ...args], {
    cwd: ARCHIFY_ROOT,
    env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: '1' },
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) throw new VisualError((result.stdout || result.stderr || 'Archify command failed').trim());
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}


function validateJsonSource(sourcePath, tool) {
  const source = readJson(sourcePath);
  if (tool === 'echarts') {
    if (!source.option || typeof source.option !== 'object') throw new VisualError('ECharts source requires option');
    if (!Array.isArray(source.table) || source.table.length < 2) throw new VisualError('ECharts source requires a data table fallback');
  } else if (tool === 'antv-infographic') {
    validateTextSource(source.syntax, tool);
  } else if (tool === 'lucide') {
    if (!Array.isArray(source.icons) || source.icons.length === 0) throw new VisualError('Lucide source requires icons');
  }
  return source;
}


async function validateVisual(visual) {
  if (visual.tool === 'archify') {
    runArchify(['validate', archifyType(visual.purpose), visual.sourcePath, '--quality', visual.quality || 'standard', '--json']);
  } else if (['echarts', 'antv-infographic', 'lucide'].includes(visual.tool)) {
    validateJsonSource(visual.sourcePath, visual.tool);
  } else {
    validateTextSource(fs.readFileSync(visual.sourcePath, 'utf8'), visual.tool);
  }
  return { id: visual.id, tool: visual.tool, source: visual.sourcePath, status: 'pass' };
}


function currentStatus(outputRoot) {
  const file = path.join(outputRoot, 'generation-status.json');
  if (!fs.existsSync(file)) return null;
  try { return readJson(file); } catch { return null; }
}


function copyNativeSource(outputRoot, visual) {
  const extension = path.extname(visual.sourcePath);
  const target = path.join(outputRoot, 'sources', `${visual.id}${extension}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(visual.sourcePath, target);
  return target;
}


function applyArchifyTheme(html, visual) {
  const theme = visual.theme;
  const fontFamily = readJson(path.join(ADAPTER_ROOT, 'theme-map.json')).fontFamily;
  let adapted = html
    .replace(/\s*<link[^>]+href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com\/[^>]*>\s*/gi, '\n')
    .replace(/<html([^>]*)>/i, (_match, attributes) => {
    const clean = attributes
      .replace(/\sdata-theme=["'][^"']*["']/i, '')
      .replace(/\sdata-gary-theme=["'][^"']*["']/i, '');
    return `<html${clean} data-theme="${theme}" data-gary-theme="${theme}">`;
  });
  adapted = adapted.replace(/<style>/i, `<style>\n:root,body,button,input,select,textarea,svg,svg text,svg foreignObject{font-family:${fontFamily}!important;font-synthesis:weight}`);
  adapted = adapted.replace('var theme = null;', `var theme = '${theme}';`);
  const readableEmbed = `<style data-gary-readable-embed>
html[data-gary-readable="true"][data-embed="true"] body{overflow:auto!important}
html[data-gary-readable="true"][data-embed="true"] .container{width:max(100%,1200px)}
html[data-gary-readable="true"][data-embed="true"] .diagram-container svg{width:100%;min-width:1184px!important;max-width:none}
@media print{html[data-gary-readable="true"][data-embed="true"] body{overflow:visible!important}html[data-gary-readable="true"][data-embed="true"] .container{width:100%!important}html[data-gary-readable="true"][data-embed="true"] .diagram-container svg{min-width:0!important;width:100%!important;max-width:100%!important}}
</style><script>if(new URLSearchParams(location.search).get('readable')==='1')document.documentElement.dataset.garyReadable='true';</script>`;
  adapted = adapted.replace(/<\/head>/i, `${readableEmbed}</head>`);
  // Upstream initializes again when the toolbar mounts. Pin that second path too;
  // otherwise a light OS preference silently overrides a dark manifest after paint.
  const initialResolver = /function resolveInitial\(\) \{[\s\S]*?\n      \}/;
  if (!initialResolver.test(adapted)) throw new VisualError('Pinned Archify theme resolver was not found');
  adapted = adapted.replace(initialResolver, `function resolveInitial() {\n        return urlOverride() || '${theme}';\n      }`);
  adapted = adapted.replace("if (urlOverride() || saved === 'light' || saved === 'dark') return;", "if (html.hasAttribute('data-gary-theme') || urlOverride() || saved === 'light' || saved === 'dark') return;");
  const sync = `<script data-gary-theme-bridge>(()=>{const root=document.documentElement;const sync=()=>{root.dataset.garyTheme=root.dataset.theme||'${theme}';try{parent.postMessage({type:'gary-visual-theme',theme:root.dataset.garyTheme},location.origin)}catch(_){}};new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-theme']});sync()})();</script>`;
  return adapted.replace(/<\/body>/i, `${sync}</body>`);
}


async function assertRenderedHtml(file, visual) {
  const inspection = await inspectArtifact(file, {
    theme: visual.theme,
    reducedMotion: 'reduce',
    offline: true,
    timeout: 30000,
  });
  if (!inspection.ready) throw new VisualError('Candidate did not reach a rendered ready state');
  if (inspection.renderError) throw new VisualError(`Candidate render failed: ${inspection.renderError}`);
  if (inspection.consoleErrors.length) throw new VisualError(`Candidate console error: ${inspection.consoleErrors.join(' | ')}`);
  if (inspection.svgCount < 1) throw new VisualError('Candidate rendered no SVG content');
  if (inspection.theme !== visual.theme) throw new VisualError(`Candidate theme mismatch: expected ${visual.theme}, got ${inspection.theme || '<none>'}`);
  return inspection;
}


async function validateRenderedSource(visual) {
  await validateVisual(visual);
  if (visual.tool !== 'mermaid') return;
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gary-visual-validate-'));
  const file = path.join(directory, `${visual.id}.html`);
  try {
    fs.writeFileSync(file, await buildHtml(visual), 'utf8');
    await assertRenderedHtml(file, visual);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}


async function buildHtml(visual) {
  if (visual.tool === 'echarts') return buildEchartsHtml(validateJsonSource(visual.sourcePath, visual.tool), visual);
  if (visual.tool === 'markmap') return buildMarkmapHtml(fs.readFileSync(visual.sourcePath, 'utf8'), visual);
  if (visual.tool === 'antv-infographic') return buildInfographicHtml(validateJsonSource(visual.sourcePath, visual.tool), visual);
  if (visual.tool === 'mermaid') return buildMermaidHtml(fs.readFileSync(visual.sourcePath, 'utf8'), visual);
  if (visual.tool === 'lucide') return buildLucideHtml(validateJsonSource(visual.sourcePath, visual.tool), visual);
  throw new VisualError(`HTML builder is not available for ${visual.tool}`);
}


function adaptedArchifySource(visual, candidateDirectory) {
  const source = readJson(visual.sourcePath);
  source.meta = {
    ...(source.meta || {}),
    locale: 'zh-CN',
    animation: source.meta?.animation || (visual.scene === 'reading' ? 'none' : 'trace'),
    visual_preset: source.meta?.visual_preset || 'classic',
  };
  const target = path.join(candidateDirectory, `${visual.id}.archify.json`);
  fs.writeFileSync(target, JSON.stringify(source, null, 2));
  return target;
}


async function renderVisual(manifest, visual, candidateDirectory) {
  fs.mkdirSync(candidateDirectory, { recursive: true });
  const candidate = path.join(candidateDirectory, `${visual.id}.html`);
  let adapted = null;
  await validateVisual(visual);
  if (visual.tool === 'archify') {
    adapted = adaptedArchifySource(visual, candidateDirectory);
    runArchify(['deliver', archifyType(visual.purpose), adapted, candidate, '--quality', visual.quality || 'standard', '--json']);
  } else {
    fs.writeFileSync(candidate, await buildHtml(visual), 'utf8');
  }
  let candidateText = fs.readFileSync(candidate, 'utf8');
  if (visual.tool === 'archify') {
    candidateText = applyArchifyTheme(candidateText, visual).replace(
      /<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>\s*/gi,
      '',
    );
    fs.writeFileSync(candidate, candidateText, 'utf8');
  }
  if (!/<(?:!doctype\s+html|html\b)/i.test(candidateText)) throw new VisualError('Candidate is not an HTML artifact');
  if (/<script[^>]+src=["']https?:/i.test(candidateText)) throw new VisualError('Candidate depends on a remote script');
  const inspection = await assertRenderedHtml(candidate, visual);
  if (adapted) fs.rmSync(adapted, { force: true });
  const sourceCopy = copyNativeSource(candidateDirectory, visual);
  return { id: visual.id, tool: visual.tool, html: candidate, source: sourceCopy, sha256: sha256(candidate), inspection, status: 'pass' };
}


function buildIndex(manifest, records) {
  const cards = records.map((record) => {
    const visual = manifest.visuals.find((item) => item.id === record.id);
    return `<article data-gary-material="glass" data-gary-refraction><div><span>${escapeHtml(visual.tool)}</span><span>${escapeHtml(visual.scene)}</span><span>${escapeHtml(visual.theme)}</span></div><h2>${escapeHtml(visual.title || visual.id)}</h2><p>${escapeHtml(visual.description || visual.citation.note || '')}</p><nav><a data-gary-icon="arrow-up-right" aria-label="打开交互 HTML" href="${encodeURIComponent(visual.id)}.html">打开交互 HTML</a><a data-gary-icon="code" aria-label="查看原生源文件" href="sources/${encodeURIComponent(path.basename(record.source))}">原生源文件</a>${visual.formats.filter((format) => format !== 'html').map((format) => `<span class="export-action"><a data-gary-icon="download" aria-label="打开 ${format.toUpperCase()} 导出文件" href="${encodeURIComponent(visual.id)}.${format}">${format.toUpperCase()}</a><small>${format.toUpperCase()}</small></span>`).join('')}</nav></article>`;
  }).join('');
  const fontFamily = readJson(path.join(ADAPTER_ROOT, 'theme-map.json')).fontFamily;
  const sharedCss = fs.readFileSync(path.join(PROJECT_ROOT, 'tokens/base.css'), 'utf8').replace('@import url("../components/components.css");', fs.readFileSync(path.join(PROJECT_ROOT, 'components/components.css'), 'utf8'));
  const icons = fs.readFileSync(path.join(PROJECT_ROOT, 'patterns/shared/icons.js'), 'utf8').replaceAll('</script', '<\\/script');
  const dots = fs.readFileSync(path.join(PROJECT_ROOT, 'patterns/shared/dot-grid.js'), 'utf8').replaceAll('</script', '<\\/script');
  const optics = fs.readFileSync(path.join(PROJECT_ROOT, 'patterns/shared/optical-glass.js'), 'utf8').replaceAll('</script', '<\\/script');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gary-UI 制图样例</title><style>${sharedCss}</style><style>
    :root{color-scheme:dark light}*{box-sizing:border-box}
    body{margin:0;padding:clamp(18px,4vw,56px);background:var(--gary-surface-page);color:var(--gary-text-primary);font-family:${fontFamily};font-size:16px;line-height:1.68}
    main{width:min(1200px,100%);margin:auto}h1{font-size:clamp(32px,6vw,68px);line-height:1.05;text-wrap:balance}header{max-width:72ch;margin-bottom:48px}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:24px}article{display:flex;flex-direction:column;min-height:260px;padding:24px;border-radius:30px}
    article>div{display:flex;gap:8px;flex-wrap:wrap}span{padding:4px 10px;border:1px solid var(--gary-card-edge);border-radius:999px;color:var(--gary-text-secondary);font-size:13px}h2{margin:20px 0 8px}p{color:var(--gary-text-secondary)}
    nav{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;align-items:start}.export-action{display:grid;justify-items:center;padding:0;border:0;gap:2px}.export-action small{font-size:11px}body{isolation:isolate}.gallery-scene{position:fixed;inset:0;z-index:-1;pointer-events:none}
    @media(max-width:600px){body{padding:16px}}
  </style></head><body><div class="gallery-scene" data-gary-scene-engine="dot-grid" aria-hidden="true"></div><main><header><h1>真实引擎，可回到源文件。</h1><p>示例数据均明确标注；HTML 自包含且无需公共 CDN。每张图保留原生源、主题、场景与导出结果。</p></header><section class="grid">${cards}</section></main><script>document.documentElement.dataset.garyTheme=new URLSearchParams(location.search).get("theme")==="light"?"light":"dark";</script><script>${icons}</script><script>${dots}</script><script>${optics}</script><script>window.__garyVisualReady=true;</script></body></html>`;
}


function writeReceipt(manifest, command, records, directory, versionId) {
  const target = path.join(directory, 'generation-receipt.json');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(target, JSON.stringify({ schemaVersion: 2, command, project: manifest.project, manifest: manifest.manifestPath, versionId, generatedAt: new Date().toISOString(), records }, null, 2));
  return target;
}


function stagedFiles(root) {
  const output = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else output.push(path.relative(root, full));
    }
  };
  visit(root);
  return output;
}


function finalRecord(manifest, record) {
  const outputs = record.outputs
    ? Object.fromEntries(Object.entries(record.outputs).map(([format, file]) => [format, path.join(manifest.outputRoot, path.basename(file))]))
    : undefined;
  return {
    ...record,
    html: record.html ? path.join(manifest.outputRoot, path.basename(record.html)) : undefined,
    source: record.source ? path.join(manifest.outputRoot, 'sources', path.basename(record.source)) : undefined,
    outputs,
    inspection: undefined,
  };
}


function writeGenerationStatus(outputRoot, status) {
  fs.mkdirSync(outputRoot, { recursive: true });
  const target = path.join(outputRoot, 'generation-status.json');
  const temporary = `${target}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, target);
  return target;
}


function commitTransaction(manifest, stageRoot, versionId, staleArtifacts) {
  const previous = currentStatus(manifest.outputRoot);
  const previousVersion = previous?.currentValidVersion || `legacy-${Date.now()}`;
  const backupRoot = path.join(manifest.outputRoot, '.last-good', previousVersion);
  const files = stagedFiles(stageRoot);
  const created = [];
  const backedUp = [];
  try {
    for (const relative of files) {
      const source = path.join(stageRoot, relative);
      const target = path.join(manifest.outputRoot, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (fs.existsSync(target)) {
        const backup = path.join(backupRoot, relative);
        fs.mkdirSync(path.dirname(backup), { recursive: true });
        fs.copyFileSync(target, backup);
        backedUp.push([backup, target]);
      } else created.push(target);
      const temporary = `${target}.${versionId}.tmp`;
      fs.copyFileSync(source, temporary);
      fs.renameSync(temporary, target);
    }
  } catch (error) {
    for (const target of created) fs.rmSync(target, { force: true });
    for (const [backup, target] of backedUp.reverse()) fs.copyFileSync(backup, target);
    throw error;
  }
  const status = {
    schemaVersion: 1,
    state: 'valid',
    currentValidVersion: versionId,
    previousValidVersion: previous?.currentValidVersion || null,
    lastAttempt: { versionId, status: 'pass', completedAt: new Date().toISOString() },
    failure: null,
    staleArtifacts,
  };
  const statusPath = writeGenerationStatus(manifest.outputRoot, status);
  fs.rmSync(stageRoot, { recursive: true, force: true });
  return { status, statusPath };
}


function recordFailedRun(manifest, stageRoot, versionId, error, selected) {
  const previous = currentStatus(manifest.outputRoot);
  const failedRoot = path.join(manifest.outputRoot, '.failed', versionId);
  fs.mkdirSync(path.dirname(failedRoot), { recursive: true });
  if (fs.existsSync(stageRoot)) fs.renameSync(stageRoot, failedRoot);
  else fs.mkdirSync(failedRoot, { recursive: true });
  const staleArtifacts = selected.flatMap((visual) => visual.formats
    .map((format) => `${visual.id}.${format}`)
    .filter((relative) => fs.existsSync(path.join(manifest.outputRoot, relative))));
  const status = {
    schemaVersion: 1,
    state: 'failed',
    currentValidVersion: previous?.currentValidVersion || null,
    previousValidVersion: previous?.previousValidVersion || null,
    lastAttempt: { versionId, status: 'fail', completedAt: new Date().toISOString() },
    failure: { message: error.message, evidence: path.join(failedRoot, 'failure.json') },
    staleArtifacts,
  };
  fs.writeFileSync(status.failure.evidence, `${JSON.stringify({ ...status.failure, selected: selected.map((item) => item.id) }, null, 2)}\n`, 'utf8');
  writeGenerationStatus(manifest.outputRoot, status);
  return status.failure.evidence;
}


function stageIndexManifestReceipt(manifest, stageRoot, records, command, versionId) {
  fs.writeFileSync(path.join(stageRoot, 'index.html'), buildIndex(manifest, records), 'utf8');
  fs.copyFileSync(manifest.manifestPath, path.join(stageRoot, 'visual-manifest.json'));
  const finalRecords = records.map((record) => finalRecord(manifest, record));
  writeReceipt(manifest, command, finalRecords, stageRoot, versionId);
  return finalRecords;
}


async function validateCommand(manifest, selected) {
  const records = [];
  for (const visual of selected) {
    await validateRenderedSource(visual);
    records.push({ id: visual.id, tool: visual.tool, source: visual.sourcePath, status: 'pass' });
  }
  return { status: 'pass', outputs: { manifest: manifest.manifestPath, visuals: records }, evidence: records.map((record) => ({ kind: 'validated-source', value: record.source })) };
}


async function renderCommand(manifest, selected) {
  fs.mkdirSync(manifest.outputRoot, { recursive: true });
  const versionId = createRunId();
  const stageRoot = path.join(manifest.outputRoot, '.candidates', versionId);
  try {
    const records = [];
    for (const visual of selected) records.push(await renderVisual(manifest, visual, stageRoot));
    const finalRecords = stageIndexManifestReceipt(manifest, stageRoot, records, 'visual render', versionId);
    const stale = selected.flatMap((visual) => visual.formats.filter((format) => format !== 'html').map((format) => `${visual.id}.${format}`));
    const committed = commitTransaction(manifest, stageRoot, versionId, stale);
    return { status: 'pass', outputs: { outputRoot: manifest.outputRoot, index: path.join(manifest.outputRoot, 'index.html'), receipt: path.join(manifest.outputRoot, 'generation-receipt.json'), status: committed.statusPath, visuals: finalRecords }, evidence: finalRecords.map((record) => ({ kind: 'artifact-sha256', value: `${record.id}:${record.sha256}` })) };
  } catch (error) {
    const failed = recordFailedRun(manifest, stageRoot, versionId, error, selected);
    throw new VisualError(`${error.message}; failure evidence: ${failed}`);
  }
}


async function exportCommand(manifest, selected, requestedFormat) {
  fs.mkdirSync(manifest.outputRoot, { recursive: true });
  const versionId = createRunId();
  const stageRoot = path.join(manifest.outputRoot, '.candidates', versionId);
  try {
    const records = [];
    for (const visual of selected) {
      const rendered = await renderVisual(manifest, visual, stageRoot);
      const formats = requestedFormat ? [requestedFormat] : visual.formats;
      const outputs = { html: rendered.html };
      for (const format of formats) {
        if (format === 'html') continue;
        const candidate = path.join(stageRoot, `${visual.id}.${format}`);
        await exportArtifact(rendered.html, candidate, format, { theme: visual.theme, reducedMotion: 'reduce' });
        if (!fs.statSync(candidate, { throwIfNoEntry: false })?.size) throw new VisualError(`${visual.id} ${format} export is empty`);
        outputs[format] = candidate;
      }
      records.push({ ...rendered, outputs });
    }
    const finalRecords = stageIndexManifestReceipt(manifest, stageRoot, records, 'visual export', versionId);
    const regenerated = new Set(finalRecords.flatMap((record) => Object.keys(record.outputs || {}).map((format) => `${record.id}.${format}`)));
    const stale = selected.flatMap((visual) => visual.formats.map((format) => `${visual.id}.${format}`)).filter((item) => !regenerated.has(item));
    const committed = commitTransaction(manifest, stageRoot, versionId, stale);
    return { status: 'pass', outputs: { outputRoot: manifest.outputRoot, index: path.join(manifest.outputRoot, 'index.html'), receipt: path.join(manifest.outputRoot, 'generation-receipt.json'), status: committed.statusPath, exports: finalRecords }, evidence: finalRecords.flatMap((record) => Object.entries(record.outputs).map(([format, file]) => ({ kind: `export-${format}`, value: file }))) };
  } catch (error) {
    const failed = recordFailedRun(manifest, stageRoot, versionId, error, selected);
    throw new VisualError(`${error.message}; failure evidence: ${failed}`);
  }
}


function inspectPackages(lock, adapterRoot = ADAPTER_ROOT, bundledPackages = null) {
  return Object.fromEntries(Object.entries(lock.packages).map(([name, expected]) => {
    const packageFile = path.join(adapterRoot, 'node_modules', ...name.split('/'), 'package.json');
    const actual = bundledPackages?.[name] || (fs.existsSync(packageFile) ? readJson(packageFile).version : null);
    return [name, { expected, actual, ok: actual === expected }];
  }));
}


function doctorCommand() {
  const lock = readJson(LOCK_PATH);
  const buildMetaPath = path.join(ADAPTER_ROOT, 'runtime', 'build-meta.json');
  const buildMeta = fs.existsSync(buildMetaPath) ? readJson(buildMetaPath) : {};
  const bundledPackages = ['dist', 'runtime'].includes(path.basename(MODULE_ROOT)) ? buildMeta.packages : null;
  const browser = findBrowser();
  const archify = spawnSync(process.execPath, [ARCHIFY_CLI, 'doctor'], {
    cwd: ARCHIFY_ROOT,
    env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: '1' },
    encoding: 'utf8',
    windowsHide: true,
  });
  const packages = inspectPackages(lock, ADAPTER_ROOT, bundledPackages);
  const skillPath = path.join(ARCHIFY_ROOT, 'SKILL.md');
  const skillHash = fs.existsSync(skillPath) ? crypto.createHash('sha256').update(fs.readFileSync(skillPath)).digest('hex') : null;
  const skillOk = skillHash === lock.archify.skillSha256;
  const antvSkills = Object.fromEntries(Object.entries(lock.antvInfographicSkills.files).map(([name, expectedFiles]) => {
    const root = resolveManagedSkillRoot(name);
    const files = Object.fromEntries(Object.entries(expectedFiles).map(([relative, expectedSha256]) => {
      const file = path.join(root, ...relative.split('/'));
      const actualSha256 = fs.existsSync(file) ? sha256(file) : null;
      return [relative, { path: file, sha256: actualSha256, expectedSha256, ok: actualSha256 === expectedSha256 }];
    }));
    return [name, { root, files, ok: Object.values(files).every((item) => item.ok) }];
  }));
  const policyFiles = {
    themeMap: path.join(ADAPTER_ROOT, 'theme-map.json'),
    sceneRecipes: path.join(PROJECT_ROOT, 'spec', 'scene-recipes.json'),
  };
  const policySources = Object.fromEntries(Object.entries(policyFiles).map(([name, file]) => {
    const expected = buildMeta.policySources?.[name];
    const actualSha256 = fs.existsSync(file) ? sha256(file) : null;
    return [name, { path: file, sha256: actualSha256, expectedSha256: expected?.sha256 || null, ok: Boolean(expected?.sha256) && actualSha256 === expected.sha256 }];
  }));
  const antvSkillsOk = Object.values(antvSkills).every((item) => item.ok);
  const browserAssets = Object.fromEntries(Object.entries(lock.browserAssets || {}).map(([relative, expectedSha256]) => {
    const file = path.join(ADAPTER_ROOT, ...relative.split('/'));
    const actualSha256 = fs.existsSync(file) ? sha256(file) : null;
    return [relative, { path: file, sha256: actualSha256, expectedSha256, ok: actualSha256 === expectedSha256 }];
  }));
  const browserAssetsOk = Object.values(browserAssets).every((item) => item.ok);
  const policyOk = Object.values(policySources).every((item) => item.ok);
  const ok = Boolean(browser) && archify.status === 0 && skillOk && antvSkillsOk && browserAssetsOk && policyOk && Object.values(packages).every((item) => item.ok);
  return {
    status: ok ? 'pass' : 'fail',
    outputs: {
      node: process.version,
      platform: process.platform,
      browser,
      archify: { version: lock.archify.version, commit: lock.archify.commit, root: ARCHIFY_ROOT, source: ARCHIFY_ROOT.includes(`${path.sep}vendor${path.sep}`) ? 'bundled-offline-fallback' : 'managed-skill', ok: archify.status === 0 },
      archifySkill: { path: skillPath, sha256: skillHash, expectedSha256: lock.archify.skillSha256, ok: skillOk },
      antvInfographicSkills: { repository: lock.antvInfographicSkills.repository, commit: lock.antvInfographicSkills.commit, packageVersion: lock.antvInfographicSkills.packageVersion, skills: antvSkills, ok: antvSkillsOk },
      browserAssets: { files: browserAssets, ok: browserAssetsOk },
      policySources: { sources: policySources, ok: policyOk },
      packages,
      networkPolicy: 'runtime updates disabled; no CDN required',
    },
    issues: [
      ...(!browser ? ['Chrome or Edge was not found'] : []),
      ...(archify.status === 0 ? [] : ['Archify doctor failed']),
      ...(skillOk ? [] : ['Official Archify SKILL.md is missing or differs from the locked commit']),
      ...(antvSkillsOk ? [] : ['Official AntV Infographic Skills or referenced files are missing or differ from the locked commit']),
      ...(browserAssetsOk ? [] : ['Pinned local browser runtime is missing or differs from the lock']),
      ...(policyOk ? [] : ['Compiled runtime theme policy is missing or stale; run npm run build']),
      ...Object.entries(packages).filter(([, value]) => !value.ok).map(([name]) => `Package version mismatch: ${name}`),
    ],
    evidence: [
      ...(browser ? [{ kind: 'browser-executable', value: browser }] : []),
      ...(skillOk ? [{ kind: 'official-skill', value: skillPath }] : []),
      ...Object.values(antvSkills).filter((item) => item.ok).map((item) => ({ kind: 'official-skill', value: path.join(item.root, 'SKILL.md') })),
      ...Object.values(browserAssets).filter((item) => item.ok).map((item) => ({ kind: 'browser-runtime', value: item.path })),
      ...(policyOk ? [{ kind: 'compiled-policy', value: buildMetaPath }] : []),
    ],
  };
}


async function main(argv = process.argv.slice(2)) {
  let options;
  try {
    options = parseArgs(argv);
    let result;
    if (options.action === 'doctor') result = doctorCommand();
    else {
      const manifest = loadManifest(options.manifest);
      const selected = selectVisuals(manifest, options.id);
      if (options.action === 'validate') result = await validateCommand(manifest, selected);
      else if (options.action === 'render') result = await renderCommand(manifest, selected);
      else result = await exportCommand(manifest, selected, options.format);
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result.status === 'pass' ? 0 : 1;
  } catch (error) {
    const result = { status: 'fail', outputs: {}, issues: [error.message], warnings: [], evidence: [], nextActions: ['Fix the reported source or dependency issue and retry'] };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 1;
  }
}


const invoked = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(MODULE_FILE);
if (invoked) {
  main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}

export {
  buildIndex,
  buildEchartsHtml,
  buildInfographicHtml,
  buildLucideHtml,
  buildMarkmapHtml,
  buildMermaidHtml,
  escapeInlineJson,
  validateTextSource,
  VisualError,
  main,
  inspectPackages,
};
