from __future__ import annotations

import sys
import tempfile
import threading
import unittest
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import HTTPCookieProcessor, build_opener, urlopen


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import serve_portal  # noqa: E402
from session_store import SessionStore  # noqa: E402
from test_session_contract import valid_proposal, valid_task  # noqa: E402


class ArtifactAssetPolicyTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.temporary.name)
        self.store = SessionStore(self.base_dir / "sessions")
        self.created = self.store.create(
            valid_task(),
            owner_id="asset-agent",
            session_id="g2-assets12",
        )
        artifact = self.base_dir / "artifact.html"
        artifact.write_text(
            '<!doctype html><link rel="stylesheet" href="/tokens/base.css">'
            '<body><img src="/assets/backgrounds/gary-default-scene.png"></body>',
            encoding="utf-8",
        )
        proposal = valid_proposal()
        proposal["sessionId"] = self.created["sessionId"]
        for option in proposal["options"]:
            option["artifactPath"] = str(artifact)
        self.store.publish_proposal(
            self.created["sessionId"],
            proposal,
            owner_id="asset-agent",
            writer_credential=self.created["writerCredential"],
        )
        self.server = serve_portal.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            serve_portal.GaryPortalHandler,
        )
        self.server.surface = "session"
        self.server.session_store = self.store
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def test_artifact_csp_allows_only_whitelisted_local_design_assets(self) -> None:
        snapshot_url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            f"?token={quote(self.created['token'], safe='')}"
        )
        with self.opener.open(snapshot_url, timeout=3) as response:
            self.assertEqual(response.status, 200)

        artifact_url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            "/artifacts/1/a/index.html"
        )
        with self.opener.open(artifact_url, timeout=3) as response:
            self.assertEqual(response.status, 200)
            csp = response.headers["Content-Security-Policy"]
        self.assertIn("default-src 'none'", csp)
        self.assertIn("style-src 'self' 'unsafe-inline'", csp)
        self.assertIn("img-src 'self' data: blob:", csp)
        self.assertIn("connect-src 'none'", csp)
        self.assertNotIn("http:", csp)
        self.assertNotIn("https:", csp)

        with urlopen(f"{self.base}/tokens/base.css", timeout=3) as response:
            self.assertEqual(response.status, 200)
            self.assertIn("text/css", response.headers["Content-Type"])
        with urlopen(
            f"{self.base}/components/components.css",
            timeout=3,
        ) as response:
            self.assertEqual(response.status, 200)
            self.assertIn("text/css", response.headers["Content-Type"])
        with urlopen(
            f"{self.base}/assets/backgrounds/gary-default-scene.png",
            timeout=3,
        ) as response:
            self.assertEqual(response.status, 200)
            self.assertIn("image/png", response.headers["Content-Type"])

        with self.assertRaises(HTTPError) as denied:
            urlopen(f"{self.base}/tokens/tokens.json", timeout=3)
        self.assertEqual(denied.exception.code, 404)

    def test_artifact_rejects_session_token_in_url(self) -> None:
        artifact_url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            "/artifacts/1/a/index.html"
            f"?token={quote(self.created['token'], safe='')}"
        )
        with self.assertRaises(HTTPError) as denied:
            urlopen(artifact_url, timeout=3)
        self.assertEqual(denied.exception.code, 403)


if __name__ == "__main__":
    unittest.main()
