/**
 * Minimal read-only static server for the Gary-UI design tree.
 * Zero dependencies, path-traversal safe, allowlisted top-level dirs,
 * automatic port fallback when the preferred port is busy.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { contentTypeFor } from "./core.js";

export const DEFAULT_PUBLIC_DIRS = ["tokens", "components", "patterns", "assets"];

export async function startStaticServer({
  root,
  port = 17888,
  host = "127.0.0.1",
  publicDirs = DEFAULT_PUBLIC_DIRS,
  maxPortAttempts = 12,
}) {
  const rootPrefix = resolve(root) + sep;
  const allowed = new Set(publicDirs);

  const handle = async (req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
      res.end("method not allowed");
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
        .replaceAll("\\", "/");
    } catch {
      res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
      res.end("bad request");
      return;
    }
    const segments = pathname.split("/").filter(Boolean);
    const top = segments[0];
    if (!top || !allowed.has(top) || segments.includes("..")) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    const filePath = resolve(root, ...segments);
    if (!filePath.startsWith(rootPrefix)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("not found");
      return;
    }
    try {
      const payload = await readFile(filePath);
      res.writeHead(200, { "content-type": contentTypeFor(filePath) });
      res.end(payload);
    } catch (err) {
      if (err && err.code === "ENOENT") {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("not found");
        return;
      }
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("internal error");
    }
  };

  let server;
  let boundPort = port;
  let lastError;
  for (let attempt = 0; attempt < maxPortAttempts; attempt += 1) {
    try {
      server = createServer(handle);
      await new Promise((resolveListen, rejectListen) => {
        server.once("error", rejectListen);
        server.listen(boundPort, host, () => {
          const addr = server.address();
          if (addr && typeof addr === "object") boundPort = addr.port;
          resolveListen();
        });
      });
      lastError = null;
      break;
    } catch (err) {
      if (err && err.code === "EADDRINUSE" && boundPort !== 0) {
        boundPort += 1;
        continue;
      }
      throw err;
    }
  }
  if (!server) {
    throw new Error(
      `gary-ui-dsh: 无法绑定静态服务端口 ${port}（尝试 ${maxPortAttempts} 个端口均失败）` +
        (lastError ? `: ${lastError.message}` : ""),
    );
  }
  const baseUrl = `http://${host}:${boundPort}`;
  return { server, port: boundPort, baseUrl };
}
