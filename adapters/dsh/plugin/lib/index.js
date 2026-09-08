/**
 * gary-ui-dsh — DSH tool plugin for the Gary-UI Liquid Glass design system.
 *
 * Tools:
 *   gary_ui_serve — start (or reuse) the local read-only static server that
 *                   serves tokens/components/patterns/assets of the Gary-UI
 *                   tree for preview and development.
 *   gary_ui_emit  — generate a fully SELF-CONTAINED html file: every linked
 *                   stylesheet is inlined (recursively resolving @import) and
 *                   every css url() asset becomes a base64 data URI, so the
 *                   artifact survives any delivery path without 404s.
 *
 * Deployment pattern follows the `local-vision` preset plugin: the package is
 * installed (junction) under the harness node_modules as `gary-ui-dsh`, and
 * the gary-ui preset mounts a pure-consumer tool row naming it.
 */
import { defineTool } from "@deepseek-ai/dsh-tools";
import { fileURLToPath } from "node:url";
import { resolve as resolvePath } from "node:path";

import { emitPage } from "./core.js";
import { startStaticServer, DEFAULT_PUBLIC_DIRS } from "./server.js";

const name = "gary-ui-dsh";
const inject = ["tools"];

// The plugin lives at <gary-ui>/adapters/dsh/plugin — the design tree root is
// four levels up. Node resolves junctions to their real path, so this keeps
// working when the package is junctioned into the harness node_modules.
// resolvePath() normalizes away the trailing separator for clean output.
const DEFAULT_ROOT = resolvePath(fileURLToPath(new URL("../../../..", import.meta.url)));

let serverPromise = null;

function apply(ctx, config = {}) {
  const root = String(config.root ?? DEFAULT_ROOT);
  const host = String(config.host ?? "127.0.0.1");
  const port = Number(config.port ?? 17888);
  const publicDirs = Array.isArray(config.publicDirs)
    ? config.publicDirs.map(String)
    : DEFAULT_PUBLIC_DIRS;

  ctx.tools.register(
    defineTool({
      name: "gary_ui_serve",
      description:
        "Start (or reuse) the local read-only Gary-UI design system static server. " +
        "Serves the design tree (tokens/, components/, patterns/, assets/) over HTTP for " +
        "previewing pages while developing. Idempotent: repeated calls reuse the running " +
        "server. Returns the base URL to build preview links from. If the preferred port " +
        "is busy the server falls back to the next free port.",
      parameters: {},
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            baseUrl: { type: "string", required: true },
            root: { type: "string" },
            port: { type: "integer" },
            publicDirs: { type: "array", items: { type: "string" } },
          },
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }],
      },
      async execute() {
        if (serverPromise === null) {
          serverPromise = startStaticServer({ root, host, port, publicDirs }).catch((err) => {
            serverPromise = null;
            throw err;
          });
        }
        const running = await serverPromise;
        return { baseUrl: running.baseUrl, root, port: running.port, publicDirs };
      },
    }),
  );

  ctx.tools.register(
    defineTool({
      name: "gary_ui_emit",
      description:
        "Generate a SELF-CONTAINED Gary-UI html file: given page html referencing Gary-UI " +
        "stylesheets (e.g. <link rel=\"stylesheet\" href=\"/tokens/base.css\">), inline every " +
        "stylesheet (recursively resolving @import) and rewrite every css url() asset into a " +
        "base64 data URI. The output file references nothing outside itself, so it renders " +
        "correctly from any delivery path (UNC share, file://, any static host) — no 404s, " +
        "no missing background. Writes the file to target_path and returns its metadata.",
      parameters: {
        html: {
          type: "string",
          required: true,
          description:
            "Full page HTML. <link rel=\"stylesheet\"> tags pointing at the design tree " +
            "(root-absolute like /tokens/base.css, or relative) are inlined. Any other content " +
            "is passed through unchanged.",
        },
        target_path: {
          type: "string",
          required: true,
          description:
            "Absolute output path for the generated self-contained html file (directories are created).",
        },
        html_base: {
          type: "string",
          description:
            "Optional directory the html's relative stylesheet references resolve against. " +
            "Defaults to the design tree root.",
        },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            path: { type: "string", required: true },
            bytes: { type: "integer", required: true },
            inlined: { type: "array", items: { type: "string" } },
            assets: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  ref: { type: "string" },
                  file: { type: "string" },
                  mime: { type: "string" },
                  bytes: { type: "integer" },
                },
              },
            },
          },
        },
        render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }],
      },
      async execute(args) {
        const result = await emitPage({
          html: String(args.html),
          root,
          htmlBase: args.html_base ? String(args.html_base) : undefined,
          targetPath: String(args.target_path),
        });
        return {
          path: result.path,
          bytes: result.bytes,
          inlined: result.inlined,
          assets: result.assets,
        };
      },
    }),
  );
}

export { apply, inject, name };
