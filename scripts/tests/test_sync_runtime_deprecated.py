from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
ROOT = SCRIPTS.parent


class SyncRuntimeDeprecationTests(unittest.TestCase):
    def _run(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, "-B", str(SCRIPTS / "sync_runtime.py"), *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )

    def test_check_invocation_is_deprecated(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = self._run("--runtime", directory)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("已废弃", result.stdout + result.stderr)
        self.assertIn("runtime_projection", result.stdout + result.stderr)

    def test_sync_invocation_is_deprecated(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            result = self._run("--sync", "--runtime", directory)

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("已废弃", result.stdout + result.stderr)
        self.assertIn("runtime_projection", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
