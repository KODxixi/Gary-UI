/**
 * Gary-UI self-contained HTML emitter — pure, testable core.
 *
 * The whole point: a generated artifact must survive ANY delivery path
 * (UNC share, file://, arbitrary static host). We therefore inline every
 * linked stylesheet (recursively resolving @import) and rewrite every
 * css url() asset into a base64 data URI. The output references nothing
 * outside itself.
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

const MIME = {
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".json": "application/json",
};

export function contentTypeFor(path) {
  return MIME[extname(path).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Resolve a css/link reference to an absolute file path, or null when it
 * must be left untouched (data:/http(s):/protocol-relative URLs).
 *
 * - `/foo/bar`          → root-absolute (the Gary-UI tree root)
 * - `./x` / `../x`      → relative to htmlBase (link tags) or the css file's
 *                         own directory (url()/@import inside a stylesheet)
 */
export function resolveRef(ref, { root, htmlBase, cssDir }) {
  if (/^(data:|https?:|\/\/)/i.test(ref)) return null;
  const base = ref.startsWith("/") ? root : cssDir || htmlBase || root;
  return resolve(base, ref.startsWith("/") ? "." + ref : ref);
}

async function processCss(text, cssPath, root, state) {
  const cssDir = dirname(cssPath);

  // 1. Inline @import url("...") — resolved against this css file's dir.
  const importRe = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)\s*;?/g;
  let out = "";
  let last = 0;
  let m;
  while ((m = importRe.exec(text)) !== null) {
    out += text.slice(last, m.index);
    const target = resolveRef(m[1], { root, cssDir });
    if (!target) throw new Error(`@import 目标无法解析: ${m[1]} (${cssPath})`);
    const imported = await readFile(target, "utf-8");
    out += await processCss(imported, target, root, state);
    last = m.index + m[0].length;
  }
  out += text.slice(last);

  // 2. Rewrite url(...) assets into data URIs.
  const urlRe = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  let rewritten = "";
  last = 0;
  while ((m = urlRe.exec(out)) !== null) {
    rewritten += out.slice(last, m.index);
    const raw = m[2];
    if (/^(data:|https?:|\/\/)/i.test(raw)) {
      rewritten += m[0];
      last = m.index + m[0].length;
      continue;
    }
    const target = resolveRef(raw, { root, cssDir });
    if (!target) throw new Error(`CSS 资源无法解析: ${raw} (${cssPath})`);
    const mime = contentTypeFor(target);
    const payload = await readFile(target);
    state.assets.push({ ref: raw, file: target, mime, bytes: payload.length });
    rewritten += `url(data:${mime};base64,${payload.toString("base64")})`;
    last = m.index + m[0].length;
  }
  rewritten += out.slice(last);
  return rewritten;
}

/**
 * Inline every <link rel="stylesheet"> in `html` into <style> blocks.
 * Returns the rewritten html plus audit lists.
 */
export async function inlineHtml({ html, root, htmlBase }) {
  const state = { inlined: [], assets: [] };
  const linkRe = /<link\b[^>]*>/gi;
  let out = "";
  let last = 0;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    out += html.slice(last, m.index);
    const tag = m[0];
    const isStylesheet = /rel\s*=\s*["']?stylesheet["']?/i.test(tag);
    const hrefMatch = /href\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (isStylesheet && hrefMatch) {
      const target = resolveRef(hrefMatch[1], { root, htmlBase });
      if (!target) throw new Error(`样式表引用无法解析: ${hrefMatch[1]}`);
      const css = await processCss(await readFile(target, "utf-8"), target, root, state);
      state.inlined.push(target);
      out += `<style>${css}</style>`;
    } else {
      out += tag;
    }
    last = m.index + m[0].length;
  }
  out += html.slice(last);
  return { html: out, inlined: state.inlined, assets: state.assets };
}

/** Inline then write a fully self-contained html file to targetPath. */
export async function emitPage({ html, root, targetPath, htmlBase }) {
  const result = await inlineHtml({ html, root, htmlBase });
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, result.html, "utf-8");
  const bytes = (await stat(targetPath)).size;
  return {
    path: targetPath,
    bytes,
    inlined: result.inlined,
    assets: result.assets,
  };
}
