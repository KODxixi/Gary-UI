import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { inlineHtml, emitPage } from "../lib/core.js";

const PNG_1PX =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function fixtureTree() {
  const root = await mkdtemp(join(tmpdir(), "gary-ui-core-"));
  await mkdir(join(root, "tokens"), { recursive: true });
  await mkdir(join(root, "components"), { recursive: true });
  await mkdir(join(root, "assets", "backgrounds"), { recursive: true });
  await writeFile(
    join(root, "tokens", "base.css"),
    [
      '@import url("../components/components.css");',
      ":root { --x: 1;",
      '  --scene: url("../assets/backgrounds/bg.png");',
      "}",
    ].join("\n"),
    "utf-8",
  );
  await writeFile(
    join(root, "components", "components.css"),
    ".gary-glass { color: var(--x); }",
    "utf-8",
  );
  await writeFile(join(root, "assets", "backgrounds", "bg.png"), Buffer.from(PNG_1PX, "base64"));
  return root;
}

test("inlines root-absolute stylesheet link and its @imports", async () => {
  const root = await fixtureTree();
  const { html } = await inlineHtml({
    root,
    html: '<html><head><link rel="stylesheet" href="/tokens/base.css"></head><body>x</body></html>',
  });
  assert.ok(!html.includes('href="/tokens/base.css"'), "link tag must be replaced");
  assert.ok(html.includes(".gary-glass"), "components.css via @import must be inlined");
  assert.ok(!html.includes("@import"), "no @import may survive");
  assert.ok(html.includes("<style>"), "inline <style> must be present");
});

test("inlines relative stylesheet link against htmlBase", async () => {
  const root = await fixtureTree();
  const htmlBase = join(root, "pages");
  await mkdir(htmlBase);
  const { html } = await inlineHtml({
    root,
    htmlBase,
    html: '<link rel="stylesheet" href="../tokens/base.css">',
  });
  assert.ok(!html.includes("href=\"../tokens/base.css\""));
  assert.ok(html.includes(":root"));
});

test("rewrites css url() assets to data URIs", async () => {
  const root = await fixtureTree();
  const { html, assets } = await inlineHtml({
    root,
    html: '<link rel="stylesheet" href="/tokens/base.css">',
  });
  assert.ok(html.includes("data:image/png;base64,"), "background url must become a data URI");
  assert.equal(assets.length, 1);
  assert.match(assets[0].mime, /^image\/png$/);
});

test("keeps remote and already-data urls untouched", async () => {
  const root = await fixtureTree();
  await writeFile(
    join(root, "tokens", "remote.css"),
    [
      '.a { background: url("https://cdn.example.com/x.png"); }',
      '.b { background: url(data:image/png;base64,AAAA); }',
    ].join("\n"),
    "utf-8",
  );
  const { html } = await inlineHtml({
    root,
    html: '<link rel="stylesheet" href="/tokens/remote.css">',
  });
  assert.ok(html.includes("https://cdn.example.com/x.png"));
  assert.ok(html.includes("data:image/png;base64,AAAA"));
});

test("emitPage writes a self-contained file and returns metadata", async () => {
  const root = await fixtureTree();
  const target = join(await mkdtemp(join(tmpdir(), "gary-ui-out-")), "report", "index.html");
  const result = await emitPage({
    root,
    targetPath: target,
    html: '<link rel="stylesheet" href="/tokens/base.css"><h1>ok</h1>',
  });
  const written = await readFile(target, "utf-8");
  assert.ok(written.includes(".gary-glass"));
  assert.ok(written.includes("data:image/png;base64,"));
  assert.equal(result.bytes, (await stat(target)).size);
  assert.equal(result.path, target);
});

test("unresolvable css asset fails with a clear message", async () => {
  const root = await fixtureTree();
  await writeFile(join(root, "tokens", "broken.css"), ".x { background: url(\"./missing.png\"); }", "utf-8");
  await assert.rejects(
    inlineHtml({ root, html: '<link rel="stylesheet" href="/tokens/broken.css">' }),
    /missing\.png/,
  );
});
