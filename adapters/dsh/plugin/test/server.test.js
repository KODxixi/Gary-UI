import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { startStaticServer } from "../lib/server.js";

async function fixtureRoot() {
  const root = await mkdtemp(join(tmpdir(), "gary-ui-server-"));
  await mkdir(join(root, "tokens"));
  await mkdir(join(root, "assets", "backgrounds"), { recursive: true });
  await writeFile(join(root, "tokens", "base.css"), ":root { --x: 1; }", "utf-8");
  await writeFile(join(root, "assets", "backgrounds", "bg.png"), Buffer.from("png", "utf-8"));
  await writeFile(join(root, "secret.txt"), "do-not-serve", "utf-8");
  return root;
}

async function get(port, pathname) {
  const resp = await fetch(`http://127.0.0.1:${port}${pathname}`);
  return { status: resp.status, type: resp.headers.get("content-type"), body: await resp.text() };
}

test("serves a public file with the right content type", async () => {
  const root = await fixtureRoot();
  const { server, port, baseUrl } = await startStaticServer({ root, port: 0 });
  try {
    assert.ok(baseUrl.startsWith("http://127.0.0.1:"));
    const r = await get(port, "/tokens/base.css");
    assert.equal(r.status, 200);
    assert.match(r.type, /^text\/css/);
    assert.ok(r.body.includes("--x"));
    const png = await get(port, "/assets/backgrounds/bg.png");
    assert.match(png.type, /^image\/png/);
  } finally {
    server.close();
  }
});

test("404 for unknown top-level directories", async () => {
  const root = await fixtureRoot();
  const { server, port } = await startStaticServer({ root, port: 0 });
  try {
    assert.equal((await get(port, "/nope/x")).status, 404);
    assert.equal((await get(port, "/secret.txt")).status, 404, "root-level files outside publicDirs must not be served");
  } finally {
    server.close();
  }
});

test("rejects path traversal attempts", async () => {
  const root = await fixtureRoot();
  const { server, port } = await startStaticServer({ root, port: 0 });
  try {
    const attempts = ["/../secret.txt", "/%2e%2e/secret.txt", "/tokens/%2e%2e%2fsecret.txt", "/tokens/..%5c..%5csecret.txt"];
    for (const pathname of attempts) {
      const r = await get(port, pathname);
      assert.ok(r.status === 400 || r.status === 404, `${pathname} must be rejected, got ${r.status}`);
    }
  } finally {
    server.close();
  }
});

test("returns 405 for non-GET methods", async () => {
  const root = await fixtureRoot();
  const { server, port } = await startStaticServer({ root, port: 0 });
  try {
    const resp = await fetch(`http://127.0.0.1:${port}/tokens/base.css`, { method: "POST" });
    assert.equal(resp.status, 405);
  } finally {
    server.close();
  }
});

test("falls back to the next free port when the preferred one is busy", async () => {
  const root = await fixtureRoot();
  const first = await startStaticServer({ root, port: 0 });
  try {
    const second = await startStaticServer({ root, port: first.port });
    try {
      assert.notEqual(second.port, first.port);
      assert.equal((await get(second.port, "/tokens/base.css")).status, 200);
    } finally {
      second.server.close();
    }
  } finally {
    first.server.close();
  }
});
