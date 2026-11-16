/**
 * ESLint rule: no-hardcoded-colors
 * --------------------------------
 * Components must resolve color from Gary tokens (var(--gary-*)) instead of
 * literal hex / rgb() / rgba() / hsl() values. This keeps dark/light and the
 * elevation system in one place (tokens/tokens.json).
 *
 * Enable in flat config (eslint.config.js):
 *   import noHardcodedColors from "./eslint-rules/no-hardcoded-colors.js"
 *   export default [{
 *     files: ["src/components/**\/*.{ts,tsx}"],
 *     plugins: { "gary-ui": { rules: { "no-hardcoded-colors": noHardcodedColors } } },
 *     rules: { "gary-ui/no-hardcoded-colors": "error" },
 *   }]
 */

// Matches a hex color (#fff, #abc123, #12345678) or a functional color(),
// but only when it looks like a color literal (not a var() / url()).
const COLOR_RE =
  /(?:^|[^\w-])#(?:[0-9a-fA-F]{3,4}\b|[0-9a-fA-F]{6}\b|[0-9a-fA-F]{8}\b)|\b(?:rgb|rgba|hsl|hsla)\s*\(/

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded hex/rgb/hsl colors in component source. Use var(--gary-*) tokens.",
    },
    messages: {
      hardcodedColor:
        "Hardcoded color '{{ value }}' is not allowed. Replace it with a Gary token, e.g. var(--gary-surface-page) or var(--gary-text-primary).",
    },
    schema: [], // no options
  },
  create(context) {
    function reportIfColor(node, text) {
      if (typeof text !== "string") return
      // Skip anything already expressed as a token reference or a CSS var.
      if (/var\(\s*--gary-/.test(text)) return
      if (!COLOR_RE.test(text)) return
      const shown = text.length > 40 ? text.slice(0, 40) + "…" : text
      context.report({ node, messageId: "hardcodedColor", data: { value: shown } })
    }

    return {
      // "bg-black/60" — no match. "#fff" / "rgba(0,0,0,.5)" — flagged.
      Literal(node) {
        reportIfColor(node, node.value)
      },
      // Style objects may use template literals; check the static quasis only.
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          reportIfColor(node, quasi.value.cooked ?? quasi.value.raw)
        }
      },
    }
  },
}
