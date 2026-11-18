/**
 * 全仓产物编译脚本（Astryx 11 页 + MWG 5 页）
 * 由 npm run build 调用。
 */
import { spawnSync } from 'node:child_process';

const JOBS = [
  // Astryx（可选组件底座，11 页）
  ['agent/render.mjs', 'examples/demo-report.content.json', '-o', 'out/demo-report.html'],
  ['agent/render.mjs', 'examples/demo-report.content.json', '-o', 'out/demo-report-dark.html', '--theme', 'dark'],
  ['agent/render.mjs', 'examples/demo-table.content.json', '-o', 'out/demo-table.html'],
  ['agent/render.mjs', 'examples/demo-dashboard.content.json', '-o', 'out/demo-dashboard.html'],
  ['agent/render.mjs', 'examples/demo-landing.content.json', '-o', 'out/demo-landing.html'],
  ['agent/render.mjs', 'examples/probe-dark.content.json', '-o', 'out/probe-dark.html'],
  ['agent/render.mjs', 'examples/probe-weekly.content.json', '-o', 'out/probe-weekly.html'],
  ['viz/render-viz.mjs', 'examples/demo-park.content.json', '-o', 'out/demo-park.html'],
  ['viz/render-viz.mjs', 'examples/demo-viz.content.json', '-o', 'out/viz-charts.html'],
  ['viz/render-viz.mjs', 'examples/demo-flow.content.json', '-o', 'out/viz-flow.html'],
  ['viz/render-viz.mjs', 'examples/probe-viz.content.json', '-o', 'out/probe-viz.html'],

  // MWG（默认原生底座，5 页）
  ['mwg/render.mjs', 'examples/demo-report.content.json', '-o', 'out/mwg-demo-report.html'],
  ['mwg/render.mjs', 'examples/demo-report.content.json', '-o', 'out/mwg-demo-report-dark.html', '--theme', 'dark'],
  ['mwg/render.mjs', 'examples/demo-table.content.json', '-o', 'out/mwg-demo-table.html'],
  ['mwg/render.mjs', 'examples/demo-viz.content.json', '-o', 'out/mwg-viz-charts.html'],
  ['mwg/render.mjs', 'examples/demo-flow.content.json', '-o', 'out/mwg-viz-flow.html'],
];

for (const args of JOBS) {
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`build-all: 失败 -> node ${args.join(' ')}`);
    process.exit(r.status || 1);
  }
}

console.log(`build-all: 全部 ${JOBS.length} 页编译完成`);
