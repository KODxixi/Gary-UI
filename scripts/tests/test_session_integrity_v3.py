from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from session_contract import content_hash  # noqa: E402
from session_store import (  # noqa: E402
    SessionConflictError,
    SessionCorruptError,
    SessionStore,
    SessionStoreError,
)
from test_session_store import feedback, proposal, task  # noqa: E402


class SessionIntegrityV3Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.root = self.base / "sessions"
        self.store = SessionStore(self.root)
        self.artifacts: dict[str, Path] = {}
        for option_id in ("a", "b", "c"):
            path = self.base / f"{option_id}.html"
            path.write_text(f"<main>{option_id}</main>", encoding="utf-8")
            self.artifacts[option_id] = path

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def create(self, suffix: str = "main") -> dict:
        return self.store.create(
            task(),
            owner_id="agent-a",
            session_id=f"g2-v3-{suffix}123",
        )

    def publish(self, created: dict, *, revision: int = 1, base: int = 0) -> dict:
        current = proposal(self.artifacts, revision=revision, base=base)
        current["sessionId"] = created["sessionId"]
        return self.store.publish_proposal(
            created["sessionId"],
            current,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )

    def finalize(self, suffix: str) -> tuple[dict, str]:
        created = self.create(suffix)
        self.publish(created)
        current_feedback = feedback(action="approve")
        current_feedback["sessionId"] = created["sessionId"]
        approved = self.store.submit_feedback(
            created["sessionId"],
            current_feedback,
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            created["sessionId"],
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        return created, approval_id

    def evidence(
        self,
        created: dict,
        approval_id: str,
        source: Path,
        *,
        summary: str = "Verification failed safely.",
    ) -> dict:
        return {
            "schemaVersion": 1,
            "sessionId": created["sessionId"],
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "fail",
            "summary": summary,
            "checks": [
                {
                    "id": "secret-scan",
                    "status": "fail",
                    "summary": "Secret scan fixture.",
                }
            ],
            "acceptanceCoverage": [],
            "artifacts": [
                {
                    "kind": "other",
                    "label": "secret-scan",
                    "sourcePath": str(source),
                }
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }

    def events(self, session_id: str) -> list[dict]:
        path = self.root / session_id / "events.jsonl"
        return [
            json.loads(line)
            for line in path.read_text(encoding="utf-8").splitlines()
        ]

    def test_new_session_uses_v3_and_every_event_has_state_hash(self) -> None:
        created = self.create("anchors")
        state = json.loads(
            (self.root / created["sessionId"] / "state.json").read_text(
                encoding="utf-8"
            )
        )
        self.assertEqual(state["integrityVersion"], 3)
        events = self.events(created["sessionId"])
        self.assertGreaterEqual(len(events), 2)
        for event in events:
            self.assertRegex(event["stateHash"], r"^[a-f0-9]{64}$")

    def test_invalid_utf8_state_marks_session_corrupt(self) -> None:
        created = self.create("utf8-state")
        session_path = self.root / created["sessionId"]
        (session_path / "state.json").write_bytes(b"\xff")

        try:
            self.store.snapshot(created["sessionId"])
        except SessionCorruptError:
            pass
        except UnicodeDecodeError as error:
            self.fail(f"UnicodeDecodeError escaped: {error}")
        else:
            self.fail("invalid UTF-8 state was accepted")

        marker = json.loads(
            (session_path / "corrupt.json").read_text(encoding="utf-8")
        )
        self.assertEqual(marker["status"], "corrupt")

    def test_invalid_utf8_event_log_marks_session_corrupt(self) -> None:
        created = self.create("utf8-events")
        session_path = self.root / created["sessionId"]
        (session_path / "events.jsonl").write_bytes(b"\xff")

        try:
            self.store.snapshot(created["sessionId"])
        except SessionCorruptError:
            pass
        except UnicodeDecodeError as error:
            self.fail(f"UnicodeDecodeError escaped: {error}")
        else:
            self.fail("invalid UTF-8 event log was accepted")

        marker = json.loads(
            (session_path / "corrupt.json").read_text(encoding="utf-8")
        )
        self.assertEqual(marker["status"], "corrupt")

    def test_task_and_matching_state_task_hash_tamper_is_detected(self) -> None:
        created = self.create("task")
        session_path = self.root / created["sessionId"]
        task_path = session_path / "task.json"
        state_path = session_path / "state.json"
        changed_task = json.loads(task_path.read_text(encoding="utf-8"))
        changed_task["brief"]["goal"] = "Tampered goal."
        task_path.write_text(json.dumps(changed_task), encoding="utf-8")
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["taskHash"] = content_hash(changed_task)
        state_path.write_text(json.dumps(state), encoding="utf-8")

        with self.assertRaises(SessionCorruptError):
            self.store.snapshot(created["sessionId"])

    def test_status_tamper_is_detected_by_state_hash(self) -> None:
        created = self.create("status")
        state_path = self.root / created["sessionId"] / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["status"] = "feedback_received"
        state_path.write_text(json.dumps(state), encoding="utf-8")

        with self.assertRaises(SessionCorruptError):
            self.store.snapshot(created["sessionId"])

    def test_writer_credential_hash_tamper_is_detected_by_state_hash(self) -> None:
        created = self.create("credential")
        state_path = self.root / created["sessionId"] / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["writerLease"]["credentialHash"] = "f" * 64
        state_path.write_text(json.dumps(state), encoding="utf-8")

        with self.assertRaises(SessionCorruptError):
            self.store.snapshot(created["sessionId"])

    def test_feedback_file_tamper_is_detected(self) -> None:
        created = self.create("feedback")
        self.publish(created)
        current_feedback = feedback()
        current_feedback["sessionId"] = created["sessionId"]
        submitted = self.store.submit_feedback(
            created["sessionId"],
            current_feedback,
            trusted_local=True,
        )
        feedback_path = (
            self.root
            / created["sessionId"]
            / "feedback"
            / f"{submitted['feedbackId']}.json"
        )
        envelope = json.loads(feedback_path.read_text(encoding="utf-8"))
        envelope["feedback"]["notes"] = "Tampered after receipt."
        feedback_path.write_text(json.dumps(envelope), encoding="utf-8")

        with self.assertRaises(SessionCorruptError):
            self.store.snapshot(created["sessionId"])

    def test_v2_is_readable_but_takeover_is_required_to_upgrade(self) -> None:
        created = self.create("legacy")
        session_path = self.root / created["sessionId"]
        events = self.events(created["sessionId"])
        previous = None
        downgraded = []
        for event in events:
            unsigned = {
                key: value
                for key, value in event.items()
                if key not in {"hash", "stateHash"}
            }
            if event["type"] == "session_created":
                unsigned["payload"]["integrityVersion"] = 2
            unsigned["previousHash"] = previous
            rewritten = {**unsigned, "hash": content_hash(unsigned)}
            downgraded.append(rewritten)
            previous = rewritten["hash"]
        (session_path / "events.jsonl").write_text(
            "".join(
                json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n"
                for item in downgraded
            ),
            encoding="utf-8",
        )
        state_path = session_path / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state["integrityVersion"] = 2
        state["lastEventSequence"] = len(downgraded)
        state["lastEventHash"] = previous
        # 安全契约 v3.1：接管需要旧 writer 凭据或一次性 takeover 凭据。
        # 模拟修复前创建的 legacy 会话（两者皆无）→ 仍可走迁移宽限接管。
        state.pop("takeoverCredentialHash")
        state["writerLease"].pop("credentialHash")
        state_path.write_text(json.dumps(state), encoding="utf-8")

        self.assertEqual(
            self.store.snapshot(created["sessionId"])["session"]["integrityVersion"],
            2,
        )
        with self.assertRaisesRegex(SessionConflictError, "takeover"):
            self.store.resume(
                created["sessionId"],
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )
        upgraded = self.store.resume(
            created["sessionId"],
            owner_id="agent-b",
            takeover=True,
        )
        self.assertEqual(upgraded["state"]["integrityVersion"], 3)
        upgraded_events = self.events(created["sessionId"])
        anchor = next(
            index
            for index, event in enumerate(upgraded_events)
            if event["type"] == "integrity_upgraded"
        )
        for event in upgraded_events[anchor:]:
            self.assertRegex(event["stateHash"], r"^[a-f0-9]{64}$")

    def test_publish_requires_created_or_revising_state(self) -> None:
        created = self.create("publish")
        self.publish(created)
        with self.assertRaisesRegex(SessionConflictError, "状态"):
            self.publish(created, revision=2, base=1)

    def test_artifact_rejects_session_token(self) -> None:
        created = self.create("artifact-token")
        self.artifacts["a"].write_text(
            f"<main>{created['token']}</main>",
            encoding="utf-8",
        )
        with self.assertRaisesRegex(SessionStoreError, "token|capability"):
            self.publish(created)

    def test_artifact_rejects_writer_capability(self) -> None:
        created = self.create("artifact-writer")
        self.artifacts["b"].write_text(
            f"<main>{created['writerCredential']}</main>",
            encoding="utf-8",
        )
        with self.assertRaisesRegex(SessionStoreError, "token|capability"):
            self.publish(created)

    def test_evidence_rejects_token_in_structured_text(self) -> None:
        created, approval_id = self.finalize("evidence-struct")
        screenshot = self.base / "safe.png"
        screenshot.write_bytes(b"safe-image")
        current = self.evidence(
            created,
            approval_id,
            screenshot,
            summary=f"Leaked token: {created['token']}",
        )
        with self.assertRaisesRegex(SessionStoreError, "token|capability"):
            self.store.verify(
                created["sessionId"],
                current,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )

    def test_evidence_rejects_writer_capability_in_text_file(self) -> None:
        created, approval_id = self.finalize("evidence-file")
        report = self.base / "report.txt"
        report.write_text(
            f"Writer capability: {created['writerCredential']}",
            encoding="utf-8",
        )
        current = self.evidence(created, approval_id, report)
        with self.assertRaisesRegex(SessionStoreError, "token|capability"):
            self.store.verify(
                created["sessionId"],
                current,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )


if __name__ == "__main__":
    unittest.main()
