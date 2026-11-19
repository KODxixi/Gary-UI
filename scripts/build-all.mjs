/**
 * 全仓产物编译脚本（MWG 单轨 + 派生的暗色双生页）
 * 由 npm run build 调用。
 *
 * 2026-11-19：Astryx 轨（agent/render.mjs / viz/render-viz.mjs）已弃用，不再进 build——
 * 它占原来 19/27 页，闸时间几乎全花在上面。两个渲染器保留可跑，历史对照仍能手动调。
 * 旧产物由下面的 prune 清理：verify-all 扫的是 out/ 目录，残留页会被当成当前产物一起闸。
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, unlinkSync, writeFileSync } from 'node:fs';

const JOBS = [
  // MWG（唯一生产轨：文本 + 图表 + 流程图全包）
  ['mwg/render.mjs', 'examples/demo-report.content.json', '-o', 'out/mwg-demo-report.html'],
  ['mwg/render.mjs', 'examples/demo-report.content.json', '-o', 'out/mwg-demo-report-dark.html', '--theme', 'dark'],
  ['mwg/render.mjs', 'examples/demo-table.content.json', '-o', 'out/mwg-demo-table.html'],
  ['mwg/render.mjs', 'examples/demo-viz.content.json', '-o', 'out/mwg-viz-charts.html'],
  ['mwg/render.mjs', 'examples/demo-flow.content.json', '-o', 'out/mwg-viz-flow.html'],
];

// 每页配一个暗色双生页 <name>-dark.html。手写单条 dark 只会漏，派生才不会。
for (const job of [...JOBS]) {
  const i = job.indexOf('-o');
  const out = job[i + 1];
  if (!out || !out.endsWith('.html') || out.endsWith('-dark.html')) continue;
  const darkOut = out.replace(/\.html$/, '-dark.html');
  if (JOBS.some((j) => j[j.indexOf('-o') + 1] === darkOut)) continue;
  const twin = [...job];
  twin[i + 1] = darkOut;
  twin.push('--theme', 'dark');
  JOBS.push(twin);
}

for (const args of JOBS) {
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`build-all: 失败 -> node ${args.join(' ')}`);
    process.exit(r.status || 1);
  }
}

// 清掉上一轮留下的、已不在计划里的页（弃用轨产物 + 改名的页）
const planned = new Set(JOBS.map((j) => j[j.indexOf('-o') + 1]));
// 闸读这份清单，不读目录：目录里只要有残留页就会被当成当前产物
writeFileSync('out/.pages.json', JSON.stringify([...planned].sort(), null, 1));
let pruned = 0;
for (const f of readdirSync('out')) {
  if (!f.endsWith('.html')) continue;
  const rel = `out/${f}`;
  if (planned.has(rel)) continue;
  unlinkSync(rel);
  console.log(`build-all: 清理旧产物 ${rel}`);
  pruned++;
}
if (pruned) console.log(`build-all: 清掉 ${pruned} 个不在计划内的旧产物`);

console.log(`build-all: 全部 ${JOBS.length} 页编译完成`);
