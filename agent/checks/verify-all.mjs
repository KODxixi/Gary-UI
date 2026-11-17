// verify-all — 对 out/ 下每一页跑三道闸。
//
// 为什么不是一个写死六页的清单：清单式 verify 在新增页时会静默漏跑，
// 绿灯只覆盖旧页面（2026-11-17 对抗审查第 8 条）。这里改成扫描产物目录，
// 新增页自动纳入。npm 在 Windows 走 cmd，通配符不展开，所以 glob 放脚本里。

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const pages = readdirSync('out')
  .filter((f) => f.endsWith('.html'))
  .map((f) => `out/${f}`)
  .sort();

if (!pages.length) {
  console.error('verify-all: out/ 里没有 .html，先跑 npm run build');
  process.exit(1);
}

const GATES = ['selfcheck', 'layout', 'contrast'];
let failed = 0;

// 内容契约闸：吃 JSON 不吃 HTML，所以排在页面闸之前——字段写错了不该等到渲染完、
// 起两次浏览器才发现。它也是唯一能在 0.2s 内说出「哪个 block 的哪个字段错」的一道。
const contents = readdirSync('examples')
  .filter((f) => f.endsWith('.content.json'))
  .map((f) => `examples/${f}`)
  .sort();

if (contents.length) {
  const r = spawnSync(process.execPath, ['agent/checks/content.mjs', ...contents], {
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error(`\nverify-all: content 在 ${contents.length} 份示例内容上有失败`);
    failed = 1;
  }
}

for (const gate of GATES) {
  const r = spawnSync(process.execPath, [`agent/checks/${gate}.mjs`, ...pages], {
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error(`\nverify-all: ${gate} 在 ${pages.length} 页上有失败`);
    failed = 1;
  }
}

console.log(
  `\nverify-all: ${contents.length} 份内容 × content 闸 + ${pages.length} 页 × ${GATES.length} 道闸 → ${failed ? 'FAIL' : 'ALL PASS'}`
);
process.exit(failed);
