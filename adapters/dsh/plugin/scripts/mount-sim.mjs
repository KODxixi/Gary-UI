/**
 * Mount simulation: resolve the gary-ui-dsh package EXACTLY the way a preset
 * tool row does (bare name from the harness base — see
 * dsh-agent-presets/lib/types/mount.js), apply() it against a mock ctx, then
 * execute both registered tools end-to-end. This is the strongest evidence
 * short of a real DSH session that the preset row will surface the tools.
 */
import { createRequire } from "node:module";
import { join } from "node:path";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const HARNESS = "C:/Users/shiguanyu/AppData/Roaming/npm/node_modules/@deepseek-ai/dsh";

const require = createRequire(join(HARNESS, "noop.cjs"));
let resolved;
try {
  resolved = require.resolve("gary-ui-dsh", { paths: [HARNESS] });
} catch (err) {
  console.error("MOUNT-SIM FAIL: package 'gary-ui-dsh' not resolvable from harness:", err.code);
  process.exit(1);
}
console.log("resolved:", resolved);

const mod = await import(pathToFileURL(resolved).href);
console.log("exports:", Object.keys(mod).sort().join(", "));
if (mod.name !== "gary-ui-dsh" || typeof mod.apply !== "function" || !Array.isArray(mod.inject)) {
  console.error("MOUNT-SIM FAIL: unexpected plugin surface");
  process.exit(1);
}

const registered = [];
const mockCtx = { tools: { register: (tool) => registered.push(tool) } };
mod.apply(mockCtx, { port: 0 }); // port 0 = OS-assigned, avoids conflicts
console.log("registered tools:", registered.map((t) => t.name).sort().join(", "));
if (registered.length !== 2 || !registered.every((t) => typeof t.execute === "function")) {
  console.error("MOUNT-SIM FAIL: expected exactly 2 executable tools");
  process.exit(1);
}

const byName = Object.fromEntries(registered.map((t) => [t.name, t]));

// gary_ui_serve
const serve = await byName.gary_ui_serve.execute({}, { signal: undefined });
console.log("serve:", JSON.stringify(serve));
const css = await fetch(`${serve.baseUrl}/tokens/base.css`);
const cssText = await css.text();
if (css.status !== 200 || !cssText.includes("--gary-control-height")) {
  console.error("MOUNT-SIM FAIL: serve did not return tokens");
  process.exit(1);
}
console.log("serve fetch /tokens/base.css:", css.status, css.headers.get("content-type"));

// gary_ui_emit
const outDir = await mkdtemp(join(tmpdir(), "gary-ui-mount-"));
const target = join(outDir, "index.html");
const emitted = await byName.gary_ui_emit.execute(
  {
    html: '<!doctype html><html><head><link rel="stylesheet" href="/tokens/base.css"></head><body class="gary-ui"><section class="gary-glass gary-regular">mount-sim</section></body></html>',
    target_path: target,
  },
  { signal: undefined },
);
const outText = await readFile(emitted.path, "utf-8");
if (emitted.bytes < 10000 || !outText.includes("data:image/png;base64,") || outText.includes("@import")) {
  console.error("MOUNT-SIM FAIL: emit output not self-contained");
  process.exit(1);
}
console.log("emit:", JSON.stringify({ path: emitted.path, bytes: emitted.bytes, inlined: emitted.inlined.length, assets: emitted.assets.length }));

try {
  await byName.gary_ui_serve.execute({}, { signal: undefined }); // idempotency
  console.log("serve idempotent: OK");
} catch (err) {
  console.error("MOUNT-SIM FAIL: serve not idempotent:", err.message);
  process.exit(1);
}

console.log("MOUNT-SIM OK — both tools register and execute through the preset resolution path");
// The serve tool intentionally keeps its singleton server alive; exit explicitly
// so this simulation script does not hang on the open listener.
process.exit(0);
