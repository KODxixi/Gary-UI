#!/usr/bin/env node
/**
 * Gary UI visual-regression capture.
 * -----------------------------------
 * Drives a headless browser against a running Storybook and screenshots the
 * Button / Card / Dialog stories in BOTH dark and light themes. Output lands
 * in __screenshots__/ next to this script's parent package.
 *
 * Prerequisites (install once):
 *   npm i -D @playwright/test
 *   npx playwright install chromium
 *
 * Run:
 *   # terminal 1 — start Storybook (after adding it as a dev dep)
 *   npx storybook dev -p 6006
 *   # terminal 2
 *   node scripts/visual-regression.mjs
 *
 * Env overrides:
 *   STORYBOOK_URL=http://localhost:6006   base URL
 *   ONLY=button,card                      comma-separated subset
 */
import { mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, "..", "__screenshots__")
const BASE = process.env.STORYBOOK_URL ?? "http://localhost:6006"

// Story ids derive from title "UI/<X>" + export name (Storybook lowercases
// and replaces non-alphanumerics with dashes). Listed explicitly so a rename
// in the story file surfaces here as a 404 instead of a silent miss.
const STORIES = [
  { id: "ui-button--default", name: "button" },
  { id: "ui-card--default", name: "card" },
  { id: "ui-dialog--open", name: "dialog" },
]
const THEMES = ["dark", "light"]

async function main() {
  let chromium
  try {
    ;({ chromium } = await import("@playwright/test"))
  } catch {
    console.error(
      "\x1b[31mMissing dependency: @playwright/test.\x1b[0m\n" +
        "  npm i -D @playwright/test && npx playwright install chromium"
    )
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const only = (process.env.ONLY ?? "").split(",").filter(Boolean)
  const targets = STORIES.filter((s) => only.length === 0 || only.includes(s.name))

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()

  // Sanity check once per run.
  try {
    await page.goto(`${BASE}/iframe.html`, { timeout: 5000 })
  } catch {
    console.error(`\x1b[31mCould not reach Storybook at ${BASE}.\x1b[0m\n` + `Start it with: npx storybook dev -p 6006`)
    await browser.close()
    process.exit(1)
  }

  for (const story of targets) {
    for (const theme of THEMES) {
      // Storybook forwards toolbar globals as query params.
      const url = `${BASE}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`
      await page.goto(url)
      // Let the spring settle (Dialog spring ~0.35s; give it margin).
      await page.waitForTimeout(900)
      const file = join(OUT_DIR, `${story.name}-${theme}.png`)
      await page.screenshot({ path: file, fullPage: true })
      console.log(`  captured ${story.name}-${theme}.png`)
    }
  }

  await browser.close()
  console.log(`\x1b[32mDone. Screenshots in ${OUT_DIR}\x1b[0m`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
