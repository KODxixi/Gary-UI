# Visual toolchain license record

Versions are locked in `toolchain.lock.json` and `package-lock.json`.

| Component | Version | License | Source |
|---|---:|---|---|
| Archify | 2.17.0-dev.1 (`c6519401f7b91b9d43011657880893b0a8955548`) | MIT | https://github.com/tt-a1i/archify |
| D3 (vendored browser runtime) | 7.9.0 | ISC | https://github.com/d3/d3 |
| Apache ECharts | 6.1.0 | Apache-2.0 | https://echarts.apache.org/ |
| Markmap (`markmap-lib`, `markmap-view`) | 0.18.12 | MIT | https://markmap.js.org/ |
| AntV Infographic | 0.2.20 | MIT | https://github.com/antvis/Infographic |
| Mermaid | 11.17.2 | MIT | https://mermaid.js.org/ |
| Lucide | 1.41.0 | ISC | https://lucide.dev/ |
| Playwright Core | 1.63.0 | Apache-2.0 | https://playwright.dev/ |
| esbuild (build only) | 0.25.9 | MIT | https://esbuild.github.io/ |

Original license and copyright texts, including dependency notices, are collected
under [`licenses/third-party/`](../../licenses/third-party/). The
[`manifest.json`](../../licenses/third-party/manifest.json) records each package,
version, SPDX identifier, relative source path, verbatim local copy and SHA-256.
These third-party terms are independent of Gary-UI's own license.

The collection follows the installed runtime/peer dependency closures of the
visual and React adapters, plus the esbuild build tool, D3 browser runtime and
vendored Archify/Playwright trees. It is intentionally broader than a particular
tree-shaken bundle. Platform-specific optional dependencies that are not installed
are listed separately; their source or binaries are not copied into this notice
collection. Development tools outside this scope remain governed by their own
installed package notices.

The initial collection has 292 package/version records. Full license/notice text
is available for 290; `@antv/event-emitter@0.1.3` and `measury@0.1.5` declare MIT
in their original package metadata but omit full license text. Their pinned
upstream source trees also omit a LICENSE file. Their original `package.json`
files are preserved with `licenseTextStatus: declared-only`; these are explicit
upstream notice gaps, not completed license files or invented copyright notices.
Both appear in installed runtime dependency paths, so they are not dismissed as
development-only packages.

The installed `fastdom` and `strictdom` packages contain complete MIT text in
their README files; those sections are copied verbatim. The esbuild platform
executable uses the original license of the same esbuild version. Two packages
that omit LICENSE in the installed release (`boolbase` and
`react-remove-scroll-bar`) include verbatim repository licenses from pinned
upstream retrieval commits. Those sources and hashes are recorded in
[`supplemental-sources.json`](../../licenses/third-party/supplemental-sources.json);
the record does not claim those files were present in the installed release.

Regenerate from the locked, installed dependencies without network access:

```sh
python scripts/collect_third_party_licenses.py
```

Run this command from the repository root after installing both adapters. It
copies only license/notice text, complete README license sections and the original
metadata of declared-only packages. A successful collection command does not
mean `licenseTextComplete` is true; inspect that manifest field and
`missingLicenseText`. Missing required dependencies produce a nonzero exit code.
The visual bundler keeps legal comments at the end of `runner.cjs`; the notice
directory must still accompany distributed generated runtimes and source copies.

The vendored Archify license and third-party notice remain under `vendor/archify/`.
Archify's MIT license does not relicense its third-party brand marks. Preserve its
brand source/attribution metadata and individual license/trademark conditions.
React Bits component implementations are not part of this distributable license
collection; this document does not grant permission to redistribute those ports.

Generated HTML embeds local runtime code and never loads a public CDN. When
distributing a standalone generated artifact, carry applicable third-party
notices with that artifact as well.
