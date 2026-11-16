/**
 * 自检 · 读取产物 HTML，断言单文件约束与主题生效。
 *   node agent/checks/selfcheck.mjs <out.html>
 * 任一项失败 exit 1 并打印具体项。
 */
import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('用法: node agent/checks/selfcheck.mjs <out.html>');
  process.exit(2);
}

const html = fs.readFileSync(file, 'utf8');
const styleBytes = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].reduce(
  (n, m) => n + Buffer.byteLength(m[1]),
  0
);
const astryxClasses = new Set(html.match(/\bastryx-[a-z][a-z0-9-]*/g) || []);

const checks = [
  ['无 <script>', !/<script/i.test(html)],
  ['无外链 href/src/url(http)', !/(href|src)\s*=\s*["']?https?:|url\(\s*['"]?https?:/i.test(html)],
  ['含 data-astryx-theme="gary"', html.includes('data-astryx-theme="gary"')],
  ['内联 <style> > 100000 B', styleBytes > 100000],
  ['≥ 3 个 astryx- 语义类', astryxClasses.size >= 3],
];

console.log(`file: ${file}`);
console.log(`inline style bytes: ${styleBytes}`);
console.log(`astryx semantic classes: ${astryxClasses.size} (${[...astryxClasses].slice(0, 6).join(', ')}…)`);

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) failed++;
}
if (failed) {
  console.error(`\n${failed} 项失败`);
  process.exit(1);
}
console.log('\nALL PASS');