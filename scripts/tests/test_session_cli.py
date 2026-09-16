from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
CLI = SCRIPTS / "gary_ui.py"
sys.path.insert(0, str(SCRIPTS))

from session_store import SessionStore  # noqa: E402
from test_session_contract import valid_feedback, valid_proposal, valid_task  # noqa: E402


class SessionCLIV2Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.sessions = self.base / "sessions"
        self.task = self.base / "task.json"
        self.task.write_text(json.dumps(valid_task()), encoding="utf-8")
        self.artifacts: dict[str, Path] = {}
        for option_id in ("a", "b", "c"):
            artifact = self.base / f"{option_id}.html"
            artifact.write_text(f"<main>{option_id}</main>", encoding="utf-8")
            self.artifacts[option_id] = artifact

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def run_cli(self, *args: str, allow_test_root: bool = True) -> tuple[int, dict]:
        env = os.environ.copy()
        if allow_test_root:
            env["GARY_UI_ALLOW_TEST_SESSION_ROOT"] = "1"
        else:
            env.pop("GARY_UI_ALLOW_TEST_SESSION_ROOT", None)
        completed = subprocess.run(
            [sys.executable, str(CLI), *args],
            cwd=SCRIPTS.parent,
            env=env,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        return completed.returncode, json.loads(completed.stdout)

    def start(self) -> dict:
        code, started = self.run_cli(
            "session",
            "start",
            "--sessions-root",
            str(self.sessions),
            "--task",
            str(self.task),
            "--session-id",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--no-serve",
        )
        self.assertEqual(code, 0, started)
        return started

    def proposal_path(self) -> Path:
        proposal = valid_proposal()
        proposal["sessionId"] = "g2-cli12345"
        for option in proposal["options"]:
            option["artifactPath"] = str(self.artifacts[option["optionId"]])
        path = self.base / "proposal.json"
        path.write_text(json.dumps(proposal), encoding="utf-8")
        return path

    def test_cli_writer_capability_status_and_heartbeat(self) -> None:
        started = self.start()
        writer = started["outputs"]["writerCredential"]
        self.assertTrue(writer)
        self.assertNotIn("credentialHash", started["outputs"]["writerLease"])

        code, missing = self.run_cli(
            "session",
            "propose",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--proposal",
            str(self.proposal_path()),
        )
        self.assertEqual(code, 2)
        self.assertEqual(missing["status"], "needs-human")

        code, proposed = self.run_cli(
            "session",
            "propose",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--writer-lease",
            writer,
            "--proposal",
            str(self.proposal_path()),
        )
        self.assertEqual(code, 0, proposed)
        self.assertEqual(proposed["state"], "awaiting_feedback")

        code, status = self.run_cli(
            "session",
            "status",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
        )
        self.assertEqual(code, 0, status)
        snapshot = status["outputs"]["snapshot"]
        self.assertEqual(snapshot["session"]["activeRevision"], 1)
        self.assertNotIn("credentialHash", snapshot["session"]["writerLease"])

        code, watched = self.run_cli(
            "session",
            "watch",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--after",
            "999",
            "--timeout",
            "0",
        )
        self.assertEqual(code, 4)
        self.assertTrue(watched["outputs"]["heartbeat"])

    def test_cli_finalize_verify_and_close(self) -> None:
        started = self.start()
        writer = started["outputs"]["writerCredential"]
        code, proposed = self.run_cli(
            "session",
            "propose",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--writer-lease",
            writer,
            "--proposal",
            str(self.proposal_path()),
        )
        self.assertEqual(code, 0, proposed)

        store = SessionStore(self.sessions)
        feedback = valid_feedback()
        feedback["sessionId"] = "g2-cli12345"
        feedback["action"] = "approve"
        approved = store.submit_feedback("g2-cli12345", feedback, trusted_local=True)
        approval_id = approved["approval"]["approvalId"]

        code, finalized = self.run_cli(
            "session",
            "finalize",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--writer-lease",
            writer,
            "--approval-id",
            approval_id,
        )
        self.assertEqual(code, 0, finalized)
        self.assertEqual(finalized["state"], "implementing")

        desktop_screenshot = self.base / "desktop.png"
        mobile_screenshot = self.base / "mobile-390.png"
        desktop_screenshot.write_bytes(b"\x89PNG\r\n\x1a\n")
        mobile_screenshot.write_bytes(b"\x89PNG\r\n\x1a\n")
        browser_report = self.base / "target-browser-report.json"
        browser_report.write_text(
            json.dumps(
                {
                    "schemaVersion": 1,
                    "source": "real-browser",
                    "targetStack": "html",
                    "url": "http://127.0.0.1:8891/target/",
                    "styleEntry": "tokens/base.css",
                    "styleEntryLoaded": True,
                    "computedStyle": {
                        "property": "--gary-control-height",
                        "value": "44px",
                    },
                    "sceneCount": 1,
                    "nestedGlassCount": 0,
                    "consoleErrors": 0,
                }
            ),
            encoding="utf-8",
        )
        evidence = {
            "schemaVersion": 1,
            "sessionId": "g2-cli12345",
            "proposalId": "round-one",
            "revision": 1,
            "approvalId": approval_id,
            "result": "pass",
            "summary": "Browser verification passed.",
            "checks": [
                {
                    "id": "desktop-layout",
                    "status": "pass",
                    "summary": "Desktop layout is stable.",
                },
                {
                    "id": "mobile-layout",
                    "status": "pass",
                    "summary": "390px layout is stable.",
                },
                {
                    "id": "keyboard",
                    "status": "pass",
                    "summary": "Primary controls are keyboard reachable.",
                },
                {
                    "id": "browser",
                    "status": "pass",
                    "summary": "Critical browser interactions work.",
                },
                {
                    "id": "visual-scene",
                    "status": "pass",
                    "summary": "The page uses one scene.",
                },
                {
                    "id": "console",
                    "status": "pass",
                    "summary": "The browser console has no errors.",
                },
                {
                    "id": "unit-overview-390",
                    "status": "pass",
                    "summary": "The overview unit works at 390px.",
                },
                {
                    "id": "gary-css-loaded",
                    "status": "pass",
                    "summary": "Gary CSS entry loaded in target.",
                },
                {
                    "id": "gary-browser-computed-style",
                    "status": "pass",
                    "summary": "Real browser computed style matched tokens.",
                },
            ],
            "acceptanceCoverage": [
                {
                    "requirementId": "viewport:0",
                    "checkId": "desktop-layout",
                    "artifactLabels": ["desktop"],
                },
                {
                    "requirementId": "viewport:1",
                    "checkId": "mobile-layout",
                    "artifactLabels": ["mobile-390"],
                },
                {
                    "requirementId": "keyboard",
                    "checkId": "keyboard",
                    "artifactLabels": ["desktop"],
                },
                {
                    "requirementId": "browser",
                    "checkId": "browser",
                    "artifactLabels": ["desktop"],
                },
                {
                    "requirementId": "visual:0",
                    "checkId": "visual-scene",
                    "artifactLabels": ["desktop"],
                },
                {
                    "requirementId": "technical:0",
                    "checkId": "console",
                    "artifactLabels": ["desktop"],
                },
                {
                    "requirementId": "unit:overview:0",
                    "checkId": "unit-overview-390",
                    "artifactLabels": ["mobile-390"],
                },
            ],
            "artifacts": [
                {
                    "kind": "screenshot",
                    "label": "desktop",
                    "sourcePath": str(desktop_screenshot),
                    "viewport": "desktop",
                },
                {
                    "kind": "screenshot",
                    "label": "mobile-390",
                    "sourcePath": str(mobile_screenshot),
                    "viewport": "390px",
                },
                {
                    "kind": "browser-report",
                    "label": "target-browser-report",
                    "sourcePath": str(browser_report),
                },
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }
        evidence_path = self.base / "evidence.json"
        evidence_path.write_text(json.dumps(evidence), encoding="utf-8")
        code, verified = self.run_cli(
            "session",
            "verify",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--writer-lease",
            writer,
            "--evidence",
            str(evidence_path),
        )
        self.assertEqual(code, 0, verified)
        self.assertEqual(verified["state"], "verified")
        self.assertTrue(verified["outputs"]["receipt"]["receiptId"].startswith("vrf_"))

        code, closed = self.run_cli(
            "session",
            "close",
            "--sessions-root",
            str(self.sessions),
            "--session",
            "g2-cli12345",
            "--writer-id",
            "cli-agent",
            "--writer-lease",
            writer,
        )
        self.assertEqual(code, 0, closed)
        self.assertEqual(closed["state"], "closed")

    def test_cli_rejects_noncanonical_root_without_test_switch(self) -> None:
        code, result = self.run_cli(
            "session",
            "start",
            "--sessions-root",
            str(self.sessions),
            "--task",
            str(self.task),
            "--no-serve",
            allow_test_root=False,
        )
        self.assertEqual(code, 3)
        self.assertEqual(result["status"], "fail")
        self.assertIn("固定", result["issues"][0])


if __name__ == "__main__":
    unittest.main()
