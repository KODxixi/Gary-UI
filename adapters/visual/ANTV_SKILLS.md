# AntV Infographic official Skills integration

Gary-UI uses the official AntV Infographic Skills for content interpretation and syntax authoring, while the
Gary visual adapter owns deterministic offline rendering, transaction-safe promotion, embedding, and export.

## Locked upstream

- Repository: [antvis/Infographic](https://github.com/antvis/Infographic)
- Commit: `2ea1894255e4002c7735586778be86d13ec30346`
- Package version at that commit: `0.2.20`
- Official Skill names: `infographic-creator` and `infographic-syntax-creator`
- Exact file hashes: `toolchain.lock.json > antvInfographicSkills.files`

The upstream repository has no `0.2.20` Git tag, so Gary locks both the package version and exact commit. The
official Skill files remain byte-identical to that commit; Gary-specific policy is kept here instead of forking
their instructions.

## Installation and path resolution

All Gary project paths below are relative to the checkout root. Ask the current Agent to discover its registered
Skills and read the selected Skill from the actual installed directory; resolve that Skill's references relative
to its own directory. Cloning Gary-UI does not install or register either external Skill.

If installation is needed, use the Agent's supported installation mechanism and the
[locked upstream commit](https://github.com/antvis/Infographic/tree/2ea1894255e4002c7735586778be86d13ec30346).
Preserve each complete Skill directory and the syntax Skill's `references/prompt.md`, then compare the files
with `adapters/visual/toolchain.lock.json`. Do not copy a rendering engine into the Skill or install into a
maintainer-specific drive path. Skill installation and any managed runtime projection are optional environment
setup steps, separate from rendering an existing Demo.

The current `adapters/visual/runner.mjs` doctor checks only these layouts, in order, for each Skill name:

1. `../../skills/<name>` resolved from the Gary-UI checkout root, for the maintainer's managed source layout.
2. `../<name>` resolved from the Gary-UI checkout root, for adjacent installed Skills.

There is currently no AntV Skill-root environment override. An Agent may read an installed Skill outside these
layouts, but doctor will not automatically find it there. Report that integration check as missing until the
installation layout or resolver is deliberately configured and verified; do not claim that a fresh public clone
has passed full Skill integration. Gary's prebuilt infographic Demo remains available without either Skill.

## Deterministic routing and reference loading

1. For a complete infographic deliverable, read `infographic-creator/SKILL.md` completely. Use it to understand
   the content, select a template, organize data, and produce valid infographic syntax.
2. For syntax-only requests, read `infographic-syntax-creator/SKILL.md` completely, then load
   `references/prompt.md` exactly as that Skill directs.
3. When Gary-UI is in scope, upstream instructions that generate an HTML file with `@latest` or a public CDN are
   superseded. Save native syntax in a JSON source and use `python scripts/gary_ui.py visual validate/render/export` with the
   local pinned `@antv/infographic@0.2.20` adapter.
4. Never copy AntV's rendering engine into a Skill. Skills provide authoring judgment; the package lock provides
   rendering code. Runtime updates and automatic installation remain disabled.
5. The self-contained HTML uses the byte-locked local browser build instead of the package SSR path. This is
   required because 0.2.20 SSR can serialize some `foreignObject` labels as empty spans. Semantic `icon` lines
   are omitted only in the offline render copy to prevent remote icon lookup; native syntax remains unchanged.

## Acceptance

`python scripts/gary_ui.py visual doctor` verifies the two discovered Skill entrypoints, the syntax reference, their exact hashes, the locked
package, browser runtime hash, and the compiled theme policy hashes. A fresh-session acceptance run must start from a new natural-language
request and create native source plus HTML/SVG/PNG; replaying an existing sample is not sufficient.
