from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import urlopen


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import gary_ui  # noqa: E402
import serve_portal  # noqa: E402


class StaticStore:
    def __init__(self, root: Path):
        self.root = root


class SessionHealthTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.server = serve_portal.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            serve_portal.GaryPortalHandler,
        )
        self.server.surface = "session"
        self.server.session_store = StaticStore(self.root)
        self.server.allow_co_design_examples = False
        self.thread = threading.Thread(
            target=self.server.serve_forever,
            daemon=True,
        )
        self.thread.start()
        self.port = self.server.server_port

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def test_health_declares_session_surface_and_cli_reuses_it(self) -> None:
        with urlopen(
            f"http://127.0.0.1:{self.port}/api/session-health",
            timeout=3,
        ) as response:
            payload = json.loads(response.read())

        self.assertEqual(response.status, 200)
        self.assertEqual(payload["status"], "ready")
        self.assertEqual(payload["surface"], "session")
        self.assertEqual(Path(payload["sessionRoot"]).resolve(), self.root.resolve())
        self.assertTrue(gary_ui._health(self.port, self.root))


if __name__ == "__main__":
    unittest.main()
