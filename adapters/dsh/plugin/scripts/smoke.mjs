/**
 * Smoke test: run the emitter against the REAL Gary-UI tree, then boot the
 * static server and fetch a file through it. Verifies the plugin's two tools
 * end-to-end without needing a DSH session.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { emitPage } from "../lib/core.js";
import { startStaticServer } from "../lib/server.js";

const ROOT = new URL("../../../..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const TARGET = join(ROOT, "adapters", "dsh", "_smoke", "index.html");

const html = [
  "<!doctype html><html><head>",
  '<link rel="stylesheet" href="/tokens/base.css">',
  "</head><body class=\"gary-ui\" data-gary-theme=\"dark\">",
  '<section class="gary-glass gary-regular">smoke</section>',
  "</body></html>",
].join("");

const emitted = await emitPage({ root: ROOT, targetPath: TARGET, html });
const text = readFileSync(emitted.path, "utf-8");
const checks = {
  bytes: emitted.bytes,
  inlined: emitted.inlined.length,
  assets: emitted.assets.length,
  noImport: !text.includes("@import"),
  sceneInlined: text.includes("data:image/png;base64,"),
  tokensPresent: text.includes("--gary-control-height"),
};
console.log("EMIT:", JSON.stringify(checks, null, 2));
if (!checks.noImport || !checks.sceneInlined || !checks.tokensPresent) {
  throw new Error("emit smoke failed");
}

const { server, port, baseUrl } = await startStaticServer({ root: ROOT, port: 0 });
try {
  const resp = await fetch(`${baseUrl}/tokens/base.css`);
  const body = await resp.text();
  console.log("SERVE:", { baseUrl, status: resp.status, type: resp.headers.get("content-type"), hasTokens: body.includes("--gary-control-height") });
  if (resp.status !== 200 || !body.includes("--gary-control-height")) {
    throw new Error("serve smoke failed");
  }
  const bad = await fetch(`${baseUrl}/../secret.txt`);
  console.log("TRAVERSAL_GUARD:", bad.status, "(expect 404)");
  if (bad.status !== 404) throw new Error("traversal guard failed");
} finally {
  server.close();
}
console.log("SMOKE OK");
