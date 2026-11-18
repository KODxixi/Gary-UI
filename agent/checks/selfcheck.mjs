/**
 * 自检 · 读取产物 HTML，断言单文件约束与主题生效（支持 MWG 与 Astryx 双轨）。
 *   node agent/checks/selfcheck.mjs [out.html ...]
 * 不带参数时扫 out/*.html。任一项失败 exit 1 并打印具体项。
 */
import fs from 'node:fs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = args.length
  ? args
  : fs.existsSync('out')
    ? fs.readdirSync('out').filter((f) => f.endsWith('.html')).map((f) => `out/${f}`).sort()
    : [];
if (!files.length) {
  console.error('用法: node agent/checks/selfcheck.mjs [out.html ...]（无参数时扫 out/*.html）');
  process.exit(2);
}

let failed = 0;

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.error(`file: ${file}\nFAIL  文件不存在`);
    failed++;
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const isMwg = html.includes('data-gary-engine="mwg"');
  const styleBytes = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].reduce(
    (n, m) => n + Buffer.byteLength(m[1]),
    0
  );
  const astryxClasses = new Set(html.match(/\bastryx-[a-z][a-z0-9-]*/g) || []);
  const mwgClasses = new Set(html.match(/\bg-[a-z][a-z0-9-_]*/g) || []);

  const checks = [
    ['无 <script>', !/<script/i.test(html)],
    ['无外链 href/src/url(http)', !/(href|src)\s*=\s*["']?https?:|url\(\s*['"]?https?:/i.test(html)],
    [
      isMwg ? '含 MWG 引擎与 Gary 主题标识' : '含 data-astryx-theme="gary"',
      isMwg
        ? html.includes('data-gary-engine="mwg"') && html.includes('data-astryx-theme="gary"')
        : html.includes('data-astryx-theme="gary"'),
    ],
    [
      isMwg ? '内联 <style> ∈ (5KB, 60KB)' : '内联 <style> > 100000 B',
      isMwg ? styleBytes > 5000 && styleBytes < 60000 : styleBytes > 100000,
    ],
    [
      isMwg ? '≥ 3 个 MWG g- 语义类' : '≥ 3 个 astryx- 语义类',
      isMwg ? mwgClasses.size >= 3 : astryxClasses.size >= 3,
    ],
  ];

  console.log(`file: ${file} [${isMwg ? 'MWG' : 'Astryx'}]`);
  console.log(`inline style bytes: ${styleBytes}`);
  if (isMwg) {
    console.log(`mwg semantic classes: ${mwgClasses.size} (${[...mwgClasses].slice(0, 6).join(', ')}…)`);
  } else {
    console.log(`astryx semantic classes: ${astryxClasses.size} (${[...astryxClasses].slice(0, 6).join(', ')}…)`);
  }

  for (const [name, ok] of checks) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) failed++;
  }
}

if (failed) {
  console.error(`\n${failed} 项失败`);
  process.exit(1);
}
console.log('\nALL PASS');
