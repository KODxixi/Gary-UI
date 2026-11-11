from __future__ import annotations

import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import apply_review  # noqa: E402
import serve_portal  # noqa: E402
from review_contract import new_envelope, normalize_decision  # noqa: E402


def recommended_decision() -> dict:
    return {
        "schemaVersion": 3,
        "system": "Gary-UI",
        "defaultBackground": None,
        "backgroundCustomizable": True,
        "defaultTheme": "dark",
        "defaultMaterial": "ultrathin",
        "defaultDensity": "balanced",
        "reactAdapterStrategy": "demand-driven",
        "distributionScope": "internal",
        "syncAuditCadence": "weekly",
        "notes": "",
        "status": "ready",
    }


class ReviewBridgeHTTPTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.original_review_file = serve_portal.REVIEW_FILE
        serve_portal.REVIEW_FILE = Path(self.temporary.name) / "review-latest.json"
        self.server = serve_portal.ThreadingHTTPServer(
            ("127.0.0.1", 0),
            serve_portal.GaryPortalHandler,
        )
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        serve_portal.REVIEW_FILE = self.original_review_file
        self.temporary.cleanup()

    def request_json(self, path: str, *, payload: dict | None = None) -> tuple[int, dict]:
        data = None
        headers = {}
        method = "GET"
        if payload is not None:
            method = "POST"
            data = json.dumps(payload).encode("utf-8")
            headers = {
                "Content-Type": "application/json",
                "X-Gary-Review-Bridge": "1",
                "Origin": self.base,
            }
        request = Request(f"{self.base}{path}", data=data, headers=headers, method=method)
        try:
            with urlopen(request, timeout=3) as response:
                return response.status, json.loads(response.read())
        except HTTPError as error:
            return error.code, json.loads(error.read())

    def test_empty_then_valid_handoff(self) -> None:
        status, empty = self.request_json("/api/review")
        self.assertEqual(status, 200)
        self.assertEqual(empty["handoffStatus"], "empty")

        status, saved = self.request_json("/api/review", payload=recommended_decision())
        self.assertEqual(status, 200)
        self.assertEqual(saved["handoffStatus"], "pending")
        self.assertTrue(serve_portal.REVIEW_FILE.exists())
        self.assertEqual(saved["decision"]["defaultMaterial"], "ultrathin")

    def test_invalid_or_cross_origin_payload_is_rejected(self) -> None:
        invalid = recommended_decision()
        invalid["defaultMaterial"] = "solid"
        status, body = self.request_json("/api/review", payload=invalid)
        self.assertEqual(status, 400)
        self.assertIn("defaultMaterial", body["error"])
        self.assertFalse(serve_portal.REVIEW_FILE.exists())

        request = Request(
            f"{self.base}/api/review",
            data=json.dumps(recommended_decision()).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "X-Gary-Review-Bridge": "1",
                "Origin": "https://example.com",
            },
            method="POST",
        )
        with self.assertRaises(HTTPError) as context:
            urlopen(request, timeout=3)
        self.assertEqual(context.exception.code, 403)


class ApplyReviewTests(unittest.TestCase):
    def test_recommended_review_updates_canonical_and_acknowledges(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "decisions").mkdir()
            (root / "tokens").mkdir()
            envelope = new_envelope(normalize_decision(recommended_decision()))
            (root / "decisions" / "review-latest.json").write_text(
                json.dumps(envelope),
                encoding="utf-8",
            )
            (root / "metadata.json").write_text(
                json.dumps(
                    {
                        "version": "1.0.0",
                        "reactAdapterCoverage": "5/15-demand-driven",
                    }
                ),
                encoding="utf-8",
            )
            (root / "tokens" / "tokens.json").write_text(
                json.dumps({"defaultMode": "light", "tokens": {}}),
                encoding="utf-8",
            )

            result = apply_review.apply_review(root)
            self.assertEqual(result["handoffStatus"], "applied")
            metadata = json.loads((root / "metadata.json").read_text(encoding="utf-8"))
            self.assertEqual(metadata["defaultDensity"], "balanced")
            self.assertEqual(metadata["defaultScene"], "dot-grid")
            self.assertIsNone(metadata["defaultBackground"])
            self.assertEqual(metadata["defaultMaterial"], "ultrathin")
            self.assertEqual(metadata["reviewDecisionStatus"], "confirmed")
            self.assertEqual(
                metadata["syncAuditStrategy"],
                "single-heartbeat-weekly-with-first-monday-governance",
            )
            tokens = json.loads((root / "tokens" / "tokens.json").read_text(encoding="utf-8"))
            self.assertEqual(tokens["defaultMode"], "dark")
            applied = json.loads(
                (root / "decisions" / "review-latest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(applied["handoffStatus"], "applied")
            self.assertIsNotNone(applied["appliedAt"])

            repeated = apply_review.apply_review(root)
            self.assertTrue(repeated["alreadyApplied"])
            repeated_applied = json.loads(
                (root / "decisions" / "review-latest.json").read_text(encoding="utf-8")
            )
            self.assertEqual(repeated_applied["appliedAt"], applied["appliedAt"])


if __name__ == "__main__":
    unittest.main()
