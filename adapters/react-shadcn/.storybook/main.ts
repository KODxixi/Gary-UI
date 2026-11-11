// .storybook/main.ts — Storybook 8 + Vite entry for Gary UI.
//
// Prerequisites (install once, not bundled in package.json yet):
//   npm i -D storybook @storybook/react-vite @storybook/addon-essentials
// Then run:
//   npm run storybook   (add this script yourself, or `npx storybook dev -p 6006`)
import type { StorybookConfig } from "@storybook/react-vite"

const config: StorybookConfig = {
  // Discover component stories next to the source files.
  stories: ["../src/**/*.@(stories|story).@(tsx|ts|mdx)"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Gary UI CSS @imports tokens/base.css which lives outside this package.
  // Vite 4+ allows the monorepo root by default; if you see a
  // "The request url ... is outside of Vite serving allow list" error,
  // create a vite.config.ts with:
  //   server: { fs: { allow: ["../.."] } }
  docs: {},
}

export default config
