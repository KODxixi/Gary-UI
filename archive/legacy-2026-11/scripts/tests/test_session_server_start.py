from __future__ import annotations

import io
import json
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import Mock, call, patch


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import gary_ui  # noqa: E402
from test_session_contract import valid_task  # noqa: E402


TEST_PORT = 8897
HIGH_PORT = 8900


class SessionServerStartTests(unittest.TestCase):
    def test_start_server_uses_fixed_root_service_argv(self) -> None:
        fake_process = Mock()
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with patch.object(
                gary_ui.subprocess,
                "Popen",
                return_value=fake_process,
            ) as popen:
                returned = gary_ui._start_server(TEST_PORT, root)

        self.assertIs(returned, fake_process)
        command = popen.call_args.args[0]
        self.assertEqual(
            command,
            [
                sys.executable,
                str(gary_ui.ROOT / "scripts" / "serve_portal.py"),
                "--surface",
                "session",
                "--port",
                str(TEST_PORT),
            ],
        )
        self.assertNotIn("--sessions-root", command)

    def test_ensure_server_reports_new_matching_service(self) -> None:
        fake_process = Mock()
        fake_process.poll.return_value = None
        root = Path("C:/AI/prototypes/gary-ui-sessions")
        with (
            patch.object(gary_ui, "_health", side_effect=[False, True]) as health,
            patch.object(gary_ui, "_port_available", return_value=True),
            patch.object(gary_ui, "_start_server", return_value=fake_process) as start,
            patch.object(gary_ui.time, "sleep"),
        ):
            result = gary_ui.ensure_server(root, preferred_port=TEST_PORT)

        self.assertEqual(result, (TEST_PORT, True))
        self.assertEqual(
            health.call_args_list,
            [call(TEST_PORT, root), call(TEST_PORT, root)],
        )
        start.assert_called_once_with(TEST_PORT, root)

    def test_ensure_server_reuses_existing_matching_service(self) -> None:
        root = Path("C:/AI/prototypes/gary-ui-sessions")
        with (
            patch.object(gary_ui, "_health", return_value=True),
            patch.object(gary_ui, "_port_available") as available,
            patch.object(gary_ui, "_start_server") as start,
        ):
            result = gary_ui.ensure_server(root, preferred_port=TEST_PORT)

        self.assertEqual(result, (TEST_PORT, False))
        available.assert_not_called()
        start.assert_not_called()

    def test_ensure_server_supports_preferred_port_above_legacy_cap(self) -> None:
        fake_process = Mock()
        fake_process.poll.return_value = None
        root = Path("C:/AI/prototypes/gary-ui-sessions")
        with (
            patch.object(gary_ui, "_health", side_effect=[False, True]),
            patch.object(gary_ui, "_port_available", return_value=True),
            patch.object(gary_ui, "_start_server", return_value=fake_process),
            patch.object(gary_ui.time, "sleep"),
        ):
            result = gary_ui.ensure_server(root, preferred_port=HIGH_PORT)

        self.assertEqual(result, (HIGH_PORT, True))

    def test_ensure_server_accepts_maximum_tcp_port(self) -> None:
        root = Path("C:/AI/prototypes/gary-ui-sessions")
        with (
            patch.object(gary_ui, "_health", return_value=True),
            patch.object(gary_ui, "_port_available") as available,
            patch.object(gary_ui, "_start_server") as start,
        ):
            result = gary_ui.ensure_server(root, preferred_port=65535)

        self.assertEqual(result, (65535, False))
        available.assert_not_called()
        start.assert_not_called()

    def test_start_preflight_failure_returns_fail_without_creating_session(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "sessions"
            task = Path(temporary) / "task.json"
            task.write_text(
                json.dumps(valid_task()),
                encoding="utf-8",
            )
            output = io.StringIO()
            with (
                patch.dict(
                    gary_ui.os.environ,
                    {gary_ui.TEST_ROOT_ENV: "1"},
                ),
                patch.object(
                    gary_ui,
                    "ensure_server",
                    side_effect=gary_ui.SessionStoreError("preflight failed"),
                ),
                redirect_stdout(output),
            ):
                exit_code = gary_ui.main(
                    [
                        "session",
                        "start",
                        "--sessions-root",
                        str(root),
                        "--task",
                        str(task),
                        "--session-id",
                        "g2-preflight-start",
                        "--writer-id",
                        "preflight-agent",
                        "--port",
                        str(HIGH_PORT),
                    ]
                )

            result = json.loads(output.getvalue())
            self.assertEqual(exit_code, 3)
            self.assertEqual(result["status"], "fail")
            self.assertIn("preflight failed", result["issues"])
            self.assertFalse((root / "g2-preflight-start").exists())

    def test_resume_preflight_failure_does_not_change_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "sessions"
            session_id = "g2-preflight-resume"
            store = gary_ui.SessionStore(root)
            created = store.create(
                valid_task(),
                owner_id="preflight-agent",
                session_id=session_id,
            )
            before = store.snapshot(session_id)
            args = gary_ui.parse_args(
                [
                    "session",
                    "resume",
                    "--sessions-root",
                    str(root),
                    "--session",
                    session_id,
                    "--writer-id",
                    "preflight-agent",
                    "--writer-lease",
                    created["writerCredential"],
                    "--port",
                    str(HIGH_PORT),
                ]
            )
            with (
                patch.dict(
                    gary_ui.os.environ,
                    {gary_ui.TEST_ROOT_ENV: "1"},
                ),
                patch.object(
                    gary_ui,
                    "ensure_server",
                    side_effect=gary_ui.SessionStoreError("preflight failed"),
                ),
                self.assertRaisesRegex(
                    gary_ui.SessionStoreError,
                    "preflight failed",
                ),
            ):
                gary_ui.run(args)

            self.assertEqual(store.snapshot(session_id), before)

    def test_watch_rejects_nan_timeout_as_json_failure(self) -> None:
        output = io.StringIO()
        with (
            patch.object(
                gary_ui.SessionStore,
                "watch",
                side_effect=AssertionError("watch must not run"),
            ) as watch,
            redirect_stdout(output),
        ):
            exit_code = gary_ui.main(
                [
                    "session",
                    "watch",
                    "--session",
                    "g2-timeout-nan",
                    "--timeout",
                    "nan",
                ]
            )

        result = json.loads(output.getvalue())
        self.assertEqual(exit_code, 1)
        self.assertEqual(result["status"], "fail")
        self.assertIn("timeout", result["issues"][0])
        watch.assert_not_called()

    def test_resume_no_serve_skips_server_preflight(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "sessions"
            session_id = "g2-no-serve-resume"
            store = gary_ui.SessionStore(root)
            created = store.create(
                valid_task(),
                owner_id="preflight-agent",
                session_id=session_id,
            )
            args = gary_ui.parse_args(
                [
                    "session",
                    "resume",
                    "--sessions-root",
                    str(root),
                    "--session",
                    session_id,
                    "--writer-id",
                    "preflight-agent",
                    "--writer-lease",
                    created["writerCredential"],
                    "--no-serve",
                ]
            )
            with (
                patch.dict(
                    gary_ui.os.environ,
                    {gary_ui.TEST_ROOT_ENV: "1"},
                ),
                patch.object(
                    gary_ui,
                    "ensure_server",
                    side_effect=AssertionError("preflight must not run"),
                ) as ensure,
            ):
                exit_code, result = gary_ui.run(args)

            self.assertEqual(exit_code, 0)
            self.assertIsNone(result["outputs"]["sessionUrl"])
            self.assertIsNone(result["outputs"]["port"])
            self.assertFalse(result["outputs"]["serverStarted"])
            self.assertEqual(
                store.snapshot(session_id)["session"]["tokenGeneration"],
                2,
            )
            ensure.assert_not_called()

    def test_non_utf8_task_returns_json_failure(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            task = Path(temporary) / "task.json"
            task.write_bytes(b"\xff")
            output = io.StringIO()
            try:
                with redirect_stdout(output):
                    exit_code = gary_ui.main(
                        ["session", "start", "--task", str(task), "--no-serve"]
                    )
            except UnicodeDecodeError as error:
                self.fail(f"CLI leaked UnicodeDecodeError: {error}")

        result = json.loads(output.getvalue())
        self.assertEqual(exit_code, 1)
        self.assertEqual(result["status"], "fail")
        self.assertIn("UTF-8", result["issues"][0])

    def test_missing_required_argument_returns_json_failure(self) -> None:
        output = io.StringIO()
        with redirect_stdout(output):
            exit_code = gary_ui.main(["session", "start", "--no-serve"])

        result = json.loads(output.getvalue())
        self.assertEqual(exit_code, 1)
        self.assertEqual(result["command"], "session start")
        self.assertEqual(result["status"], "fail")
        self.assertIn("--task", result["issues"][0])


if __name__ == "__main__":
    unittest.main()
