// 闸门自带静态服务：没有 GARY_BASE 时自动起一个（随机端口），进程退出即关。
// 这样闸门不依赖「先手工开 http.server」这一步——agent 和 CI 都不容易踩空。
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function startServer(root) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = path.join(root, url);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    fs.readFile(file, (err, buf) => {
      if (err) { res.writeHead(404).end("404"); return; }
      res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(buf);
    });
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const close = () => new Promise((r) => server.close(() => r()));
      process.on("exit", () => { try { server.close(); } catch (e) {} });
      resolve({ origin: `http://127.0.0.1:${port}`, close });
    });
  });
}

/**
 * 解析闸门要测的 base URL：
 * - 设了 GARY_BASE → 直接用（CI 可指向别处）
 * - 没设 → 自动起服务，root 为仓库根，base 为 <origin>/agent/out
 */
async function resolveBase(opt) {
  if (process.env.GARY_BASE) return { base: process.env.GARY_BASE, close: async () => {} };
  const root = path.resolve(__dirname, "..", "..");
  const { origin, close } = await startServer(root);
  return { base: `${origin}/agent/out`, close };
}

module.exports = { startServer, resolveBase };
