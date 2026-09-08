from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import (
    HTTPCookieProcessor,
    Request,
    build_opener,
    urlopen,
)


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import serve_portal  # noqa: E402
from session_store import (  # noqa: E402
    SessionAuthenticationError,
    SessionStore,
)
from test_session_contract import valid_feedback, valid_proposal, valid_task  # noqa: E402


class GenerationProxy:
    """Delegate storage while making token-generation changes deterministic."""

    def __init__(self, delegate: SessionStore):
        self.delegate = delegate
        self.generation = 1
        self.expected_generations: list[int] = []

    @property
    def root(self):
        return self.delegate.root

    def authenticate(
        self,
        session_id: str,
        token: str,
        expected_generation: int | None = None,
    ) -> int:
        self.delegate.authenticate(session_id, token)
        if expected_generation is not None:
            self.expected_generations.append(expected_generation)
            if expected_generation != self.generation:
                raise SessionAuthenticationError("token generation 已变化")
        return self.generation

    def __getattr__(self, name: str):
        return getattr(self.delegate, name)


class AuthenticationSignalProxy:
    """Expose when HTTP header authentication has completed."""

    def __init__(self, delegate: SessionStore, authenticated: threading.Event):
        self.delegate = delegate
        self.authenticated = authenticated

    @property
    def root(self):
        return self.delegate.root

    def authenticate(
        self,
        session_id: str,
        token: str,
        expected_generation: int | None = None,
    ) -> int:
        generation = self.delegate.authenticate(
            session_id,
            token,
            expected_generation=expected_generation,
        )
        self.authenticated.set()
        return generation

    def __getattr__(self, name: str):
        return getattr(self.delegate, name)


class EvidenceProxy:
    def __init__(self, delegate: SessionStore, evidence: Path):
        self.delegate = delegate
        self.evidence = evidence

    @property
    def root(self):
        return self.delegate.root

    def evidence_path(
        self,
        session_id: str,
        receipt_id: str,
        file_name: str,
    ) -> Path:
        if receipt_id != "vrf_111111111111111111111111" or file_name != self.evidence.name:
            raise FileNotFoundError(file_name)
        return self.evidence

    def __getattr__(self, name: str):
        return getattr(self.delegate, name)


class SessionHTTPTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base_dir = Path(self.temporary.name)
        self.store = SessionStore(self.base_dir / "sessions")
        self.created = self.store.create(
            valid_task(),
            owner_id="http-agent",
            session_id="g2-http1234",
        )
        artifacts = self.base_dir / "artifacts"
        artifacts.mkdir()
        (artifacts / "a.html").write_text(
            '<!doctype html><body><button data-gary-node-id="cta">A</button></body>',
            encoding="utf-8",
        )
        (artifacts / "b.html").write_text(
            "<!doctype html><body>B</body>",
            encoding="utf-8",
        )
        proposal = valid_proposal()
        proposal["sessionId"] = self.created["sessionId"]
        for index, option in enumerate(proposal["options"]):
            option["artifactPath"] = str(
                artifacts / ("a.html" if index == 0 else "b.html")
            )
        self.store.publish_proposal(
            self.created["sessionId"],
            proposal,
            owner_id="http-agent",
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
        self.jar = CookieJar()
        self.opener = build_opener(HTTPCookieProcessor(self.jar))

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    @property
    def token(self) -> str:
        return self.created["token"]

    def read_json(
        self,
        request: Request | str,
        *,
        use_cookies: bool = False,
    ) -> tuple[int, dict, object]:
        opener = self.opener.open if use_cookies else urlopen
        try:
            with opener(request, timeout=3) as response:
                return response.status, json.loads(response.read()), response.headers
        except HTTPError as error:
            return error.code, json.loads(error.read()), error.headers

    def snapshot_url(self) -> str:
        return (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            f"?token={quote(self.token, safe='')}"
        )

    def test_snapshot_sets_scoped_http_only_cookies_and_token_free_urls(self) -> None:
        status, snapshot, headers = self.read_json(
            self.snapshot_url(),
            use_cookies=True,
        )
        self.assertEqual(status, 200)
        self.assertEqual(snapshot["session"]["status"], "awaiting_feedback")
        serialized = json.dumps(snapshot)
        self.assertNotIn(self.token, serialized)
        self.assertNotIn("?token=", snapshot["activeArtifactUrl"])
        self.assertNotIn(
            "?token=",
            snapshot["activeProposal"]["options"][0]["artifactUrl"],
        )
        self.assertNotIn("tokenHash", snapshot["session"])
        cookie_headers = headers.get_all("Set-Cookie")
        self.assertEqual(len(cookie_headers), 2)
        self.assertTrue(all("HttpOnly" in value for value in cookie_headers))
        self.assertTrue(all("SameSite=Strict" in value for value in cookie_headers))
        self.assertTrue(
            any(
                f"Path=/api/sessions/{self.created['sessionId']}/artifacts/" in value
                for value in cookie_headers
            )
        )
        self.assertTrue(
            any(
                f"Path=/api/sessions/{self.created['sessionId']}/evidence/" in value
                for value in cookie_headers
            )
        )

        status, error, _ = self.read_json(
            f"{self.base}/api/sessions/{self.created['sessionId']}?token=wrong"
        )
        self.assertEqual(status, 403)
        self.assertIn("token", error["error"].lower())

    def test_artifact_only_accepts_cookie_and_injects_bridge_in_memory(self) -> None:
        self.read_json(self.snapshot_url(), use_cookies=True)
        url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            "/artifacts/1/a/index.html"
        )
        with self.opener.open(url, timeout=3) as response:
            html = response.read().decode("utf-8")
            csp = response.headers["Content-Security-Policy"]
        self.assertIn('/session/preview-bridge.js', html)
        self.assertIn("connect-src 'none'", csp)
        stored = self.store.artifact_path(
            self.created["sessionId"],
            1,
            "a",
        ).read_text(encoding="utf-8")
        self.assertNotIn("preview-bridge.js", stored)

        status, _, _ = self.read_json(
            f"{url}?token={quote(self.token, safe='')}"
        )
        self.assertEqual(status, 403)
        header_attempt = Request(
            url,
            headers={
                "Cookie": (
                    f"{serve_portal.ARTIFACT_COOKIE}={self.token}"
                ),
                "X-Gary-Session-Token": self.token,
            },
        )
        status, _, _ = self.read_json(header_attempt)
        self.assertEqual(status, 403)

    def test_evidence_only_accepts_evidence_cookie(self) -> None:
        evidence = self.base_dir / "browser-check.txt"
        evidence.write_text("verified", encoding="utf-8")
        self.server.session_store = EvidenceProxy(self.store, evidence)
        self.read_json(self.snapshot_url(), use_cookies=True)
        url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}"
            "/evidence/vrf_111111111111111111111111/browser-check.txt"
        )
        with self.opener.open(url, timeout=3) as response:
            self.assertEqual(response.read(), b"verified")
            self.assertIn("default-src 'none'", response.headers["Content-Security-Policy"])

        status, _, _ = self.read_json(
            f"{url}?token={quote(self.token, safe='')}"
        )
        self.assertEqual(status, 403)

    def test_feedback_requires_strict_origin_and_header(self) -> None:
        feedback = valid_feedback()
        feedback["sessionId"] = self.created["sessionId"]
        payload = json.dumps(feedback).encode("utf-8")
        route = f"{self.base}/api/sessions/{self.created['sessionId']}/feedback"

        missing_origin = Request(
            route,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Gary-Session-Token": self.token,
            },
            method="POST",
        )
        status, _, _ = self.read_json(missing_origin)
        self.assertEqual(status, 403)

        cross_origin = Request(
            route,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Gary-Session-Token": self.token,
                "Origin": "https://example.com",
            },
            method="POST",
        )
        status, _, _ = self.read_json(cross_origin)
        self.assertEqual(status, 403)

        valid = Request(
            route,
            data=payload,
            headers={
                "Content-Type": "application/json",
                "X-Gary-Session-Token": self.token,
                "Origin": self.base,
            },
            method="POST",
        )
        status, response, _ = self.read_json(valid)
        self.assertEqual(status, 200)
        self.assertEqual(response["status"], "accepted")
        self.assertEqual(response["state"], "feedback_received")
        self.assertIsNone(response["approvalId"])

    def test_feedback_rechecks_token_generation_after_reading_body(self) -> None:
        authenticated = threading.Event()
        self.server.session_store = AuthenticationSignalProxy(
            self.store,
            authenticated,
        )
        feedback = valid_feedback()
        feedback["sessionId"] = self.created["sessionId"]
        payload = json.dumps(feedback).encode("utf-8")
        route = f"/api/sessions/{self.created['sessionId']}/feedback"
        connection = HTTPConnection(
            "127.0.0.1",
            self.server.server_port,
            timeout=3,
        )
        connection.putrequest("POST", route)
        connection.putheader("Origin", self.base)
        connection.putheader("X-Gary-Session-Token", self.token)
        connection.putheader("Content-Type", "application/json")
        connection.putheader("Content-Length", str(len(payload)))
        connection.endheaders()

        self.assertTrue(authenticated.wait(2))
        self.store.resume(
            self.created["sessionId"],
            owner_id="http-agent",
            writer_credential=self.created["writerCredential"],
        )
        connection.send(payload)
        response = connection.getresponse()
        error = json.loads(response.read())
        connection.close()

        self.assertEqual(response.status, 403)
        self.assertIn("token", error["error"].lower())
        self.assertEqual(
            self.store.snapshot(self.created["sessionId"])["session"]["status"],
            "awaiting_feedback",
        )

    def test_sse_revalidates_captured_generation_and_stops_after_rotation(self) -> None:
        proxy = GenerationProxy(self.store)
        self.server.session_store = proxy
        url = (
            f"{self.base}/api/sessions/{self.created['sessionId']}/events"
            f"?token={quote(self.token, safe='')}&after=0"
        )
        with urlopen(url, timeout=3) as response:
            event_line = response.readline().decode("utf-8").strip()
            message_line = response.readline().decode("utf-8").strip()
            data_line = response.readline().decode("utf-8").strip()
            self.assertTrue(event_line.startswith("id: "))
            self.assertEqual(message_line, "event: message")
            event = json.loads(data_line.removeprefix("data: "))
            self.assertEqual(event["type"], "session_created")
            proxy.generation = 2
            remaining = response.read()
        self.assertNotIn(b": heartbeat", remaining)
        self.assertIn(1, proxy.expected_generations)


if __name__ == "__main__":
    unittest.main()




