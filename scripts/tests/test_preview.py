"""The public preview must run from a clone without the private Agent runtime."""

from __future__ import annotations

import http.client
import importlib.util
import shutil
import tempfile
import threading
import unittest
from pathlib import Path


SOURCE = Path(__file__).resolve().parents[1] / "preview.py"


class PortablePreviewTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="gary-ui-clone-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "new clone"
        (self.root / "scripts").mkdir(parents=True)
        shutil.copy2(SOURCE, self.root / "scripts" / "preview.py")
        demo = self.root / "examples" / "demos"
        demo.mkdir(parents=True)
        (demo / "index.html").write_text("<!doctype html><title>完整 Demo</title>", encoding="utf-8")
        (demo / "demo.js").write_text("window.gary = true;", encoding="utf-8")
        (demo / "demo.css").write_text("body { color: black; }", encoding="utf-8")
        (self.root / ".git").mkdir()
        (self.root / ".git" / "config").write_text("private", encoding="utf-8")
        (self.root / ".env").write_text("private", encoding="utf-8")
        spec = importlib.util.spec_from_file_location("gary_preview_clone", self.root / "scripts" / "preview.py")
        assert spec and spec.loader
        self.module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.module)
        self.server = self.module.create_server(0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop_server)

    def stop_server(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, path: str, method: str = "GET"):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            connection.request(method, path)
            response = connection.getresponse()
            return response.status, {name.lower(): value for name, value in response.getheaders()}, response.read()
        finally:
            connection.close()

    def test_relocated_root_and_demo_landing(self) -> None:
        self.assertEqual(self.module.ROOT, self.root.resolve())
        self.assertEqual(self.server.server_address[0], "127.0.0.1")
        status, headers, body = self.request("/?theme=light")
        self.assertEqual(status, 307)
        self.assertEqual(headers["location"], "/examples/demos/index.html?theme=light")
        self.assertEqual(body, b"")
        status, headers, body = self.request(headers["location"])
        self.assertEqual(status, 200)
        self.assertIn("完整 Demo", body.decode("utf-8"))
        self.assertEqual(headers["content-type"], "text/html; charset=utf-8")

    def test_browser_assets_have_correct_mime_and_head(self) -> None:
        for file_name, mime in (("demo.js", "text/javascript"), ("demo.css", "text/css")):
            with self.subTest(asset=file_name):
                status, headers, body = self.request(f"/examples/demos/{file_name}", "HEAD")
                self.assertEqual(status, 200)
                self.assertEqual(headers["content-type"], mime + "; charset=utf-8")
                self.assertEqual(headers["x-content-type-options"], "nosniff")
                self.assertGreater(int(headers["content-length"]), 0)
                self.assertEqual(body, b"")

    def test_private_paths_listings_and_traversal_are_not_served(self) -> None:
        for path in ("/.env", "/%2egit/config", "/scripts/", "/../.env", "/%2e%2e/.env"):
            with self.subTest(path=path):
                self.assertEqual(self.request(path)[0], 404)

    def test_post_does_not_create_session_or_write_files(self) -> None:
        status, _, _ = self.request("/api/sessions", "POST")
        self.assertEqual(status, 501)
        self.assertFalse((self.root / "decisions").exists())
        self.assertFalse((self.root / "session").exists())


if __name__ == "__main__":
    unittest.main()
