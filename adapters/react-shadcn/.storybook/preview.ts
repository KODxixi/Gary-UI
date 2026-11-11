// .storybook/preview.ts — render-time config: global tokens + dark/light toggle.
//
// Gary UI ships DARK by default on :root (see src/styles/gary-ui.css).
// Light mode is an explicit opt-in via the `.light` class — so the toolbar
// simply adds/removes that class on <html>; no separate theme object needed.
import type { Preview } from "@storybook/react"
import "../src/styles/gary-ui.css"

const preview: Preview = {
  parameters: {
    layout: "centered",
    // The page chrome itself follows Gary tokens; disable Storybook's own
    // background swatches so screenshots show the real surface color.
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Gary UI theme — dark is the platform default, light is opt-in (.light).",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "dark", title: "Dark" },
          { value: "light", title: "Light" },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string | undefined) ?? "dark"
      // Dark requires NO class (:root is dark). Light requires `.light`.
      document.documentElement.classList.toggle("light", theme === "light")
      return (
        <div className="gary-storybook-root">
          <Story />
        </div>
      )
    },
  ],
}

export default preview
