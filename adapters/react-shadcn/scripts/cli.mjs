#!/usr/bin/env node
/**
 * Gary UI CLI — copy one component + its relative dependencies into your project.
 *
 * Usage (from adapters/react-shadcn):
 *   node scripts/cli.mjs add <component-name> [--out <dir>] [--cwd <project-root>]
 *
 * Example:
 *   node scripts/cli.mjs add dialog
 *   node scripts/cli.mjs add card --out ./src/components/gary
 *
 * What it does:
 *   Resolves src/components/ui/<name>.tsx, walks every RELATIVE import it uses
 *   ("../../lib/utils", "./button", "../recipes", ...), and copies each file that
 *   lives under src/ into <out>, mirroring the src/ directory layout. Because the
 *   layout is mirrored, the relative imports keep working verbatim.
 *
 * Non-relative packages (react, radix-ui, reicon-react, class-variance-authority)
 * are NOT copied — they must already be (or become) dependencies of the user project.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join, relative, resolve, extname, basename, sep } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, "..")          // adapters/react-shadcn
const SRC_ROOT = join(PKG_ROOT, "src")
const UI_DIR = join(SRC_ROOT, "components", "ui")

const args = process.argv.slice(2)
const [command, name] = args
const outIdx = args.indexOf("--out")
const cwdIdx = args.indexOf("--cwd")
const OUT_ROOT = resolve(cwdIdx >= 0 ? args[cwdIdx + 1] : process.cwd(), outIdx >= 0 ? args[outIdx + 1] : "./gary-ui")

function fail(msg) {
  console.error(`\x1b[31mgary-ui: ${msg}\x1b[0m`)
  process.exit(1)
}

if (command !== "add" || !name) {
  console.error("Usage: node scripts/cli.mjs add <component-name> [--out <dir>] [--cwd <dir>]")
  console.error("Example: node scripts/cli.mjs add dialog")
  process.exit(1)
}

// --- find the component -----------------------------------------------------
const candidates = [".tsx", ".ts", ".jsx", ".js"]
let entry = null
for (const ext of candidates) {
  const p = join(UI_DIR, `${name}${ext}`)
  if (existsSync(p)) { entry = p; break }
}
if (!entry) {
  const available = readdirSync(UI_DIR)
    .filter((f) => candidates.includes(extname(f)) && !f.endsWith(".stories.tsx"))
    .map((f) => basename(f, extname(f)))
  fail(`no component named "${name}" in src/components/ui/.\nAvailable: ${available.sort().join(", ")}`)
}

// --- walk relative imports --------------------------------------------------
const IMPORT_RE = /(?:from|import)\s*["'](\.[^"']+)["']/g
const copied = new Set()

function resolveSpecifier(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec)
  // try exact, then extension, then /index
  for (const p of [base, ...candidates.map((e) => base + e), join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(p) && statSync(p).isFile()) return p
  }
  return null
}

function collect(file) {
  if (copied.has(file)) return
  copied.add(file)
  const code = readFileSync(file, "utf8")
  for (const m of code.matchAll(IMPORT_RE)) {
    const resolved = resolveSpecifier(file, m[1])
    // Only copy files that live inside this package's src/. External npm
    // packages (react, radix-ui, ...) are left to the user's package.json.
    if (resolved && resolved.startsWith(SRC_ROOT + sep)) {
      collect(resolved)
    }
  }
}
collect(entry)

// --- write mirror layout ----------------------------------------------------
mkdirSync(OUT_ROOT, { recursive: true })
const written = []
for (const file of copied) {
  const rel = relative(SRC_ROOT, file)        // components/ui/dialog.tsx
  const dest = join(OUT_ROOT, rel)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, readFileSync(file))
  written.push(rel)
}

console.log(`\x1b[32mgary-ui: added ${name} to ${relative(process.cwd(), OUT_ROOT)}/\x1b[0m`)
for (const f of written.sort()) console.log("  • " + f)
console.log("\nRemember to install peer packages if missing:")
console.log("  npm i radix-ui class-variance-authority clsx tailwind-merge reicon-react")
