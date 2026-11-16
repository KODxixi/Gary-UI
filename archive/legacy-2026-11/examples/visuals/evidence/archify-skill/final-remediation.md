# Fresh-session Archify final remediation

- New Codex session: `01a0781e-689e-7a73-b902-2a6db458200b`
- Discovery: managed runtime copy of the canonical Archify Skill
- Locked engine: `2.17.0-dev.1` at `c6519401f7b91b9d43011657880893b0a8955548`
- Native JSON SHA-256: `89dbc15d5efd5d7f26d1b114564af3cae479fa262812fd4079f3d9ffa18361fc`
- Interactive HTML SHA-256: `c589d3fb31ef4128df164b4e2cce08f1d93a59f417287413c61e5bc76a282958`
- Standalone SVG SHA-256: `63a1670b3fb3c144076f6fa9a7cf449df214961e4481622f7d2e75a78f4c82ee`
- PNG SHA-256: `5de9e8d3371b5cef088fbbf98170ccd12dc8dbddfc9dca49ea1bf676cdef2ea7`
- Official `visual-check`: pass at 1440×900, 1600×1000, 1920×1080 and 2048×1320; light/dark captures retained.

The isolated child session's initial GPU sandbox failure remains preserved in
`fresh-session-visual-check-sandbox-failure.json`. The parent session then condensed only node copy, regenerated with the official `deliver` command, and reran the official browser check. This note records the final state without rewriting the original child-session transcript.
