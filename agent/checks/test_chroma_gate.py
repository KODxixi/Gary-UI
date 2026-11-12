#!/usr/bin/env python3
"""负例自检：语义色写成灰，check_token_chroma 必须抓住（2026-11-12 分层管色的回归闸）。

跑法：python -B agent/checks/test_chroma_gate.py
不引入测试框架；纯 assert。改灰 → 必须报错；改回彩色 → 必须通过。
"""

import copy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import invariants  # noqa: E402


def main() -> int:
    data = json.loads(invariants.TOKENS.read_text(encoding="utf-8-sig"))["tokens"]

    # 0) 基线：tokens.json 原样必须干净
    problems = invariants.check_token_chroma(data)
    assert not problems, f"基线就报错: {problems[:3]}"
    print("PASS  基线（tokens.json 原样）无问题")

    # 1) 把 --gary-category-1 改成灰 → 必须失败
    bad = copy.deepcopy(data)
    bad["--gary-category-1"] = {"type": "color", "dark": "oklch(0.75 0 0)", "light": "oklch(0.5 0 0)"}
    problems = invariants.check_token_chroma(bad)
    assert problems, "category-1 写成灰居然没报错 —— 闸失效"
    print(f"FAIL(预期)  category-1 改灰 → {problems[0]}")

    # 2) 改回彩色 → 必须通过
    ok = copy.deepcopy(data)
    ok["--gary-category-1"] = {"type": "color", "dark": "oklch(0.75 0.13 245)", "light": "oklch(0.5 0.13 245)"}
    problems = invariants.check_token_chroma(ok)
    assert not problems, f"改回彩色仍报错: {problems[:3]}"
    print("PASS  category-1 改回彩色 → 通过")

    # 3) 过饱和同样要抓（chroma 0.30 > 0.22）
    hot = copy.deepcopy(data)
    hot["--gary-state-negative"] = {"type": "color", "dark": "oklch(0.6 0.3 25)", "light": "oklch(0.5 0.3 25)"}
    problems = invariants.check_token_chroma(hot)
    assert problems, "过饱和语义色没报错"
    print(f"FAIL(预期)  state-negative 过饱和 → {problems[0]}")

    print("chroma gate self-test: ALL OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
