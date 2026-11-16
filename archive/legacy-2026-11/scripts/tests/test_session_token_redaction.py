from __future__ import annotations

import contextlib
import io
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import serve_portal  # noqa: E402
from session_store import SessionStore  # noqa: E402
from test_session_contract import valid_task  # noqa: E402


class SessionTokenRedactionV2Tests(unittest.TestCase):
    def test_query_token_is_never_written_to_http_log(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            store = SessionStore(Path(directory) / "sessions")
            created = store.create(
                valid_task(),
                owner_id="log-agent",
                session_id="g2-logs1234",
            )
            server = serve_portal.ThreadingHTTPServer(
                ("127.0.0.1", 0),
                serve_portal.GaryPortalHandler,
            )
            server.session_store = store
            server.surface = "session"
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_port}"
            captured = io.StringIO()
            try:
                with contextlib.redirect_stderr(captured):
                    with urlopen(
                        f"{base}/api/sessions/{created['sessionId']}"
                        f"?token={quote(created['token'], safe='')}",
                        timeout=3,
                    ) as response:
                        self.assertEqual(response.status, 200)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)
            log = captured.getvalue()
            self.assertNotIn(created["token"], log)
            self.assertIn("token=<redacted>", log)


if __name__ == "__main__":
    unittest.main()
