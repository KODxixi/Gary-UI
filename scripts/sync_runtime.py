#!/usr/bin/env python3
"""已废弃：旧整树同步机制（deprecated 2026-08-23）。

原实现按整树复制（仅排除 .git/__pycache__/node_modules/dist），与
runtime/manifest.json 的 include/exclude 语义矛盾，任何一次 `--sync` 都会
重新制造 runtimeOnly 漂移（且 deleteOrphansAutomatically=false 无人清理）。

本脚本不再执行任何同步。所有 runtime 投影请使用 scripts/runtime_projection.py
（按 runtime/manifest.json 的 include/exclude 选择文件，check/build/sync 均可用）。
"""

from __future__ import annotations

import sys


DEPRECATION_MESSAGE = """\
sync_runtime.py 已废弃：整树复制与 runtime/manifest.json 的 include/exclude 语义矛盾，
会重新制造 runtimeOnly 漂移。请改用 scripts/runtime_projection.py：

  python -B scripts/runtime_projection.py check    # 只读校验 manifest 投影 vs runtime
  python -B scripts/runtime_projection.py build --staging <dir>
  python -B scripts/runtime_projection.py sync --confirm <projectionHash>
"""


def main(argv: list[str] | None = None) -> int:
    print(DEPRECATION_MESSAGE, file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
