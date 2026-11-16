/**
 * viz/check-flow.mjs — geometry audit for the rendered flow page.
 *
 *   node viz/check-flow.mjs out/viz-flow.html
 *
 * Reads the finished HTML (no second renderer): every polyline/line in the
 * three flow SVGs must be strictly axis-aligned (orthogonal routing), every
 * edge must carry a marker-end (the water-drop arrow), and no two node boxes
 * may intersect. Exit 1 on any failure, so it can sit in a command chain.
 */
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('用法: node viz/check-flow.mjs <out.html>');
  process.exit(2);
}
const verbose = process.argv.includes('--verbose');
const html = fs.readFileSync(file, 'utf8');

/** flow cards are the <div> containing a <svg> with marker defs */
const svgs = [];
const svgRe = /<svg[^>]*>([\s\S]*?)<\/svg>/g;
let m;
while ((m = svgRe.exec(html))) {
  const body = m[1];
  if (/id="flow-arrow/.test(body) || /marker-/.test(body)) svgs.push(body);
}

const report = [];
let fail = 0;

for (const [i, body] of svgs.entries()) {
  // ---- edges: polylines and lines
  const edges = [];
  for (const pm of body.matchAll(/<polyline points="([^"]+)"[^>]*>/g)) {
    const tag = pm[0];
    const pts = pm[1].trim().split(/\s+/).map((p) => p.split(',').map(Number));
    edges.push({ kind: 'polyline', pts, hasMarker: /marker-end="url\(#/.test(tag) });
  }
  for (const lm of body.matchAll(/<line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"([^>]*)>/g)) {
    const tag = lm[0];
    // annotation leaders are dashed 3 3 and carry no marker; flow edges are 1.5/2px
    const isLeader = /stroke-dasharray="3 3"/.test(tag) || /var\(--color-accent\)/.test(tag);
    if (isLeader) continue;
    const pts = [
      [Number(lm[1]), Number(lm[2])],
      [Number(lm[3]), Number(lm[4])],
    ];
    edges.push({ kind: 'line', pts, hasMarker: /marker-end="url\(#/.test(tag) });
  }

  const bad = edges.filter((e) =>
    e.pts.some((p, k) => {
      if (k === 0) return false;
      const [x0, y0] = e.pts[k - 1];
      return Math.abs(p[0] - x0) > 0.51 && Math.abs(p[1] - y0) > 0.51;
    })
  );
  const noMarker = edges.filter((e) => !e.hasMarker);

  report.push(`svg#${i + 1}: edges=${edges.length} 非正交=${bad.length} 无箭头=${noMarker.length}`);
  if (verbose) edges.forEach((e) => report.push(`  · ${e.kind} ${e.pts.map((p) => p.join(',')).join(' → ')}`));
  if (bad.length) {
    fail++;
    bad.slice(0, 5).forEach((e) => report.push(`  ✗ 斜段 ${JSON.stringify(e.pts)}`));
  }
  if (noMarker.length) {
    fail++;
    noMarker.slice(0, 5).forEach((e) => report.push(`  ✗ 缺 marker-end ${JSON.stringify(e.pts[0])}`));
  }
}

// ---- node boxes must not intersect (scoped per svg: separate viewBoxes)
let nodeHits = 0;
let nodeCount = 0;
for (const [i, body] of svgs.entries()) {
  const rects = [];
  for (const rm of body.matchAll(/<rect x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)" rx="[-\d.]+" style="[^"]*stroke:var\(--color-[^"]*"/g)) {
    rects.push({ x: +rm[1], y: +rm[2], w: +rm[3], h: +rm[4] });
  }
  nodeCount += rects.length;
  const hits = [];
  for (let a = 0; a < rects.length; a++) {
    for (let b = a + 1; b < rects.length; b++) {
      const A = rects[a];
      const B = rects[b];
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
      const oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ox > 1 && oy > 1) hits.push(`#${a} vs #${b} overlap ${ox.toFixed(1)}×${oy.toFixed(1)}`);
    }
  }
  nodeHits += hits.length;
  report.push(`svg#${i + 1}: node boxes=${rects.length} 相交=${hits.length}`);
  hits.slice(0, 6).forEach((s) => report.push(`  ✗ ${s}`));
}
if (nodeHits) fail++;

// ---- arrow markers present at all
const markers = [...html.matchAll(/<marker id="([^"]+)"/g)].map((x) => x[1]);
report.push(`markers=${markers.length} ${markers.slice(0, 6).join(', ')}`);
if (markers.length === 0) {
  report.push('  ✗ 无箭头 marker');
  fail++;
}

console.log(report.join('\n'));
console.log(fail === 0 ? 'FLOW GEOMETRY PASS' : `FLOW GEOMETRY FAIL (${fail})`);
process.exit(fail === 0 ? 0 : 1);
