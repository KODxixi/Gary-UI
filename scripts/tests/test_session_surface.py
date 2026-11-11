from __future__ import annotations

import json
import os
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import serve_portal  # noqa: E402


class StaticStore:
    def __init__(self, root: Path):
        self.root = root


class SurfaceServerTestCase(unittest.TestCase):
    surface = "session"

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.server = serve_portal.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            serve_portal.GaryPortalHandler,
        )
        self.server.surface = self.surface
        self.server.session_store = StaticStore(Path(self.temporary.name))
        self.server.allow_co_design_examples = False
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        self.temporary.cleanup()

    def status(self, request: Request | str) -> int:
        try:
            with urlopen(request, timeout=3) as response:
                response.read()
                return response.status
        except HTTPError as error:
            error.read()
            return error.code


class SessionSurfaceTests(SurfaceServerTestCase):
    surface = "session"

    def test_session_surface_exposes_only_session_routes_and_static_allowlist(self) -> None:
        self.assertEqual(self.status(f"{self.base}/api/session-health"), 200)
        self.assertEqual(self.status(f"{self.base}/session/"), 200)
        self.assertEqual(self.status(f"{self.base}/tokens/base.css"), 200)
        self.assertEqual(self.status(f"{self.base}/components/components.css"), 200)
        self.assertEqual(
            self.status(
                f"{self.base}/assets/backgrounds/gary-default-scene.png"
            ),
            200,
        )

        self.assertEqual(self.status(f"{self.base}/README.md"), 404)
        self.assertEqual(self.status(f"{self.base}/portal/"), 404)
        self.assertEqual(self.status(f"{self.base}/api/review"), 404)
        self.assertEqual(
            self.status(f"{self.base}/session/%2e%2e/README.md"),
            404,
        )
        self.assertEqual(
            self.status(f"{self.base}/examples/co-design/demo.css"),
            404,
        )

    def test_head_cannot_bypass_the_static_allowlist(self) -> None:
        request = Request(f"{self.base}/README.md", method="HEAD")
        self.assertEqual(self.status(request), 405)

    def test_session_surface_cannot_post_review(self) -> None:
        request = Request(
            f"{self.base}/api/review",
            data=json.dumps({"ignored": True}).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Gary-Review-Bridge": "1",
                "Origin": self.base,
            },
            method="POST",
        )
        self.assertEqual(self.status(request), 404)

    def test_examples_require_explicit_server_opt_in(self) -> None:
        self.server.allow_co_design_examples = True
        self.assertEqual(
            self.status(f"{self.base}/examples/co-design/demo.css"),
            200,
        )


class PortalSurfaceTests(SurfaceServerTestCase):
    def test_demo_allows_local_media_but_no_remote_media(self) -> None:
        with urlopen(f"{self.base}/examples/demos/index.html", timeout=3) as response:
            csp = response.headers["Content-Security-Policy"]
        self.assertIn("media-src 'self' blob:;", csp)
        self.assertIn("connect-src 'none'", csp)
        with urlopen(f"{self.base}/portal/", timeout=3) as response:
            self.assertNotIn("media-src 'self' blob:", response.headers["Content-Security-Policy"])

    surface = "portal"

    def test_portal_surface_keeps_portal_and_rejects_all_session_api(self) -> None:
        self.assertEqual(self.status(f"{self.base}/portal/"), 200)
        self.assertEqual(self.status(f"{self.base}/api/health"), 200)
        self.assertEqual(self.status(f"{self.base}/api/review"), 200)
        self.assertEqual(self.status(f"{self.base}/api/session-health"), 404)
        self.assertEqual(
            self.status(
                f"{self.base}/api/sessions/g2-surface1?token=not-used"
            ),
            404,
        )
        self.assertEqual(self.status(f"{self.base}/session/"), 404)

    def test_portal_surface_serves_embedded_pattern_and_visual_samples(self) -> None:
        self.assertEqual(
            self.status(f"{self.base}/patterns/application-modes/board.html"),
            200,
        )
        self.assertEqual(
            self.status(f"{self.base}/examples/demos/index.html"),
            200,
        )
        self.assertEqual(
            self.status(
                f"{self.base}/adapters/visual/vendor/browser/echarts.min.js"
            ),
            200,
        )
        self.assertEqual(
            self.status(f"{self.base}/patterns/%2e%2e/README.md"),
            404,
        )

        with urlopen(
            f"{self.base}/examples/demos/index.html", timeout=3
        ) as response:
            policy = response.headers["Content-Security-Policy"]
        self.assertIn("script-src 'self' 'unsafe-inline'", policy)
        self.assertIn("frame-ancestors 'self'", policy)
        self.assertIn("connect-src 'none'", policy)

        with urlopen(
            f"{self.base}/examples/demos/index.html", timeout=3
        ) as response:
            demo_policy = response.headers["Content-Security-Policy"]
        self.assertIn("script-src 'self' 'unsafe-inline'", demo_policy)
        self.assertIn("frame-src 'self'", demo_policy)

    def test_portal_surface_cannot_post_session_feedback(self) -> None:
        request = Request(
            f"{self.base}/api/sessions/g2-surface1/feedback",
            data=b"{}",
            headers={
                "Content-Type": "application/json",
                "X-Gary-Session-Token": "not-used",
                "Origin": self.base,
            },
            method="POST",
        )
        self.assertEqual(self.status(request), 404)


class SessionRootPolicyTests(unittest.TestCase):
    def test_override_requires_explicit_test_environment_flag(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            custom = Path(temporary)
            with patch.dict(os.environ, {}, clear=False):
                os.environ.pop(serve_portal.TEST_ROOT_ENV, None)
                with self.assertRaises(ValueError):
                    serve_portal.resolve_sessions_root(custom)
            with patch.dict(
                os.environ,
                {serve_portal.TEST_ROOT_ENV: "1"},
                clear=False,
            ):
                self.assertEqual(
                    serve_portal.resolve_sessions_root(custom),
                    custom.resolve(),
                )


if __name__ == "__main__":
    unittest.main()
