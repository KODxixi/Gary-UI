import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const RUNNER = path.join(ROOT, 'adapters', 'visual', 'runtime', 'runner.cjs');
const EVIDENCE = path.join(ROOT, 'examples', 'visuals', 'evidence', 'transaction');
const OUTPUT = path.join(EVIDENCE, 'outputs');
const SOURCE = path.join(EVIDENCE, 'source.mmd');
const MANIFEST = path.join(EVIDENCE, 'manifest.json');
const VALID = 'flowchart LR\n  A[候选生成] --> B{真实渲染通过?}\n  B -->|是| C[替换正式版本]\n  B -->|否| D[保留上一有效版本]\n';
const INVALID = 'flowchart LR\n  A[未闭合 --> B[错误候选]\n';

function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function run() {
  return spawnSync(process.execPath, [RUNNER, 'export', '--manifest', MANIFEST, '--json'], {
    cwd: ROOT, encoding: 'utf8', env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: '1' },
  });
}
function hashes() {
  return Object.fromEntries(['guard.html', 'guard.svg', 'guard.png', 'generation-receipt.json'].map(name => [name, sha(path.join(OUTPUT, name))]));
}

fs.rmSync(EVIDENCE, { recursive: true, force: true });
fs.mkdirSync(EVIDENCE, { recursive: true });
fs.writeFileSync(SOURCE, VALID);
fs.writeFileSync(MANIFEST, `${JSON.stringify({
  schemaVersion: 1,
  project: 'gary-ui-transaction-acceptance',
  outputRoot: 'outputs',
  visuals: [{ id: 'guard', title: '失败产物保护', description: '候选验证后才替换', purpose: 'simple-flow', tool: 'mermaid', source: 'source.mmd', scene: 'reading', theme: 'light', formats: ['html', 'svg', 'png'], citation: { label: 'Gary-UI 验收夹具', url: null, note: '仅用于事务测试' } }],
}, null, 2)}\n`);

const first = run();
if (first.status !== 0) throw new Error(`initial export failed: ${first.stderr || first.stdout}`);
const before = hashes();
const firstStatus = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'generation-status.json'), 'utf8'));

fs.writeFileSync(SOURCE, INVALID);
const failed = run();
if (failed.status === 0) throw new Error('invalid Mermaid unexpectedly passed');
const afterFailure = hashes();
const failedStatus = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'generation-status.json'), 'utf8'));
const unchanged = Object.keys(before).every(name => before[name] === afterFailure[name]);
if (!unchanged || failedStatus.state !== 'failed' || failedStatus.currentValidVersion !== firstStatus.currentValidVersion) throw new Error('failed candidate changed the valid artifact set');

fs.writeFileSync(SOURCE, VALID);
const recovered = run();
if (recovered.status !== 0) throw new Error(`recovery export failed: ${recovered.stderr || recovered.stdout}`);
const recoveredStatus = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'generation-status.json'), 'utf8'));
if (recoveredStatus.state !== 'valid' || recoveredStatus.currentValidVersion === firstStatus.currentValidVersion) throw new Error('recovery did not create a new valid version');

const failurePayload = (() => { try { return JSON.parse(failed.stdout); } catch { return { raw: failed.stdout, stderr: failed.stderr }; } })();
const report = {
  schemaVersion: 1,
  status: 'pass',
  generatedAt: new Date().toISOString(),
  sequence: ['valid export', 'invalid Mermaid export rejected', 'valid files unchanged', 'valid export recovered'],
  initialValidVersion: firstStatus.currentValidVersion,
  failedAttempt: failedStatus.lastAttempt,
  currentValidDuringFailure: failedStatus.currentValidVersion,
  staleArtifacts: failedStatus.staleArtifacts,
  unchangedAfterFailure: unchanged,
  failure: failurePayload,
  recoveredValidVersion: recoveredStatus.currentValidVersion,
  previousValidVersionAfterRecovery: recoveredStatus.previousValidVersion,
  hashesBeforeFailure: before,
  hashesAfterFailure: afterFailure,
  finalStatusPath: path.join(OUTPUT, 'generation-status.json'),
};
fs.writeFileSync(path.join(EVIDENCE, 'transaction-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, unchangedAfterFailure: unchanged, failedState: failedStatus.state, recoveredState: recoveredStatus.state, evidence: path.join(EVIDENCE, 'transaction-report.json') }));
