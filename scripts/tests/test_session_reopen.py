from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from session_store import SessionConflictError, SessionStore  # noqa: E402
from test_session_contract import valid_feedback, valid_proposal, valid_task  # noqa: E402


class SessionReopenV2Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.store = SessionStore(self.base / "sessions")
        self.session_id = "g2-reopen12"
        created = self.store.create(
            valid_task(),
            owner_id="agent-a",
            session_id=self.session_id,
        )
        self.writer = created["writerCredential"]
        proposal = valid_proposal()
        proposal["sessionId"] = self.session_id
        for option in proposal["options"]:
            artifact = self.base / f"{option['optionId']}.html"
            artifact.write_text(f"<main>{option['optionId']}</main>", encoding="utf-8")
            option["artifactPath"] = str(artifact)
        self.store.publish_proposal(
            self.session_id,
            proposal,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        feedback = valid_feedback()
        feedback["sessionId"] = self.session_id
        feedback["action"] = "approve"
        approved = self.store.submit_feedback(self.session_id, feedback, trusted_local=True)
        self.approval_id = approved["approval"]["approvalId"]

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def test_reopen_revokes_current_approval_and_requires_revise(self) -> None:
        reopened = self.store.reopen(
            self.session_id,
            approval_id=self.approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(reopened["state"]["status"], "feedback_received")
        snapshot = self.store.snapshot(self.session_id)
        self.assertEqual(
            snapshot["decisions"]["reopenedApprovals"][0]["approvalId"],
            self.approval_id,
        )
        revision = self.store.start_revision(
            self.session_id,
            base_revision=1,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(revision["expectedRevision"], 2)

    def test_wrong_or_finalized_approval_cannot_reopen(self) -> None:
        with self.assertRaisesRegex(SessionConflictError, "格式无效"):
            self.store.reopen(
                self.session_id,
                approval_id="../../state",
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        finalized = self.store.finalize(
            self.session_id,
            approval_id=self.approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(finalized["state"]["status"], "implementing")
        with self.assertRaisesRegex(SessionConflictError, "approved"):
            self.store.reopen(
                self.session_id,
                approval_id=self.approval_id,
                owner_id="agent-a",
                writer_credential=self.writer,
            )


if __name__ == "__main__":
    unittest.main()
