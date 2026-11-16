import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';


const adapterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = path.resolve(adapterRoot, '..', '..');
const distRoot = path.join(adapterRoot, 'runtime');
fs.mkdirSync(distRoot, { recursive: true });

await build({
  entryPoints: [path.join(adapterRoot, 'runner.mjs')],
  outfile: path.join(distRoot, 'runner.cjs'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  sourcemap: false,
  legalComments: 'eof',
  logLevel: 'error',
});

const packageManifest = JSON.parse(fs.readFileSync(path.join(adapterRoot, 'package.json'), 'utf8'));
const policyFiles = {
  themeMap: path.join(adapterRoot, 'theme-map.json'),
  sceneRecipes: path.join(projectRoot, 'spec', 'scene-recipes.json'),
};
const policySources = Object.fromEntries(Object.entries(policyFiles).map(([name, filePath]) => [name, {
  path: path.relative(projectRoot, filePath).replaceAll('\\', '/'),
  sha256: crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex'),
}]));
fs.writeFileSync(
  path.join(distRoot, 'build-meta.json'),
  `${JSON.stringify({ packages: packageManifest.dependencies, policySources }, null, 2)}\n`,
  'utf8',
);

const stat = fs.statSync(path.join(distRoot, 'runner.cjs'));
fs.copyFileSync(
  path.join(adapterRoot, 'node_modules', 'playwright-core', 'browsers.json'),
  path.join(adapterRoot, 'browsers.json'),
);
process.stdout.write(`${JSON.stringify({ status: 'pass', output: path.join(distRoot, 'runner.cjs'), bytes: stat.size })}\n`);
