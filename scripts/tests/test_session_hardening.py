from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from session_store import (  # noqa: E402
    SessionAuthenticationError,
    SessionCorruptError,
    SessionStore,
)
from test_session_contract import valid_proposal, valid_task  # noqa: E402


class SessionHardeningV2Tests(unittest.TestCase):
    def test_writer_secret_is_hashed_and_never_projected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "sessions"
            store = SessionStore(root)
            created = store.create(
                valid_task(),
                owner_id="agent-a",
                session_id="g2-hardening",
            )
            state = json.loads(
                (root / created["sessionId"] / "state.json").read_text(encoding="utf-8")
            )
            self.assertNotEqual(
                state["writerLease"]["credentialHash"],
                created["writerCredential"],
            )
            snapshot = store.snapshot(created["sessionId"])
            self.assertNotIn("credentialHash", snapshot["session"]["writerLease"])
            missing_credential = valid_proposal()
            missing_credential["sessionId"] = created["sessionId"]
            with self.assertRaises(SessionAuthenticationError):
                store.publish_proposal(
                    created["sessionId"],
                    missing_credential,
                    owner_id="agent-a",
                )

    def test_valid_but_tampered_proposal_is_detected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            store = SessionStore(base / "sessions")
            created = store.create(
                valid_task(),
                owner_id="agent-a",
                session_id="g2-anchor12",
            )
            proposal = valid_proposal()
            proposal["sessionId"] = created["sessionId"]
            for option in proposal["options"]:
                artifact = base / f"{option['optionId']}.html"
                artifact.write_text(f"<main>{option['optionId']}</main>", encoding="utf-8")
                option["artifactPath"] = str(artifact)
            store.publish_proposal(
                created["sessionId"],
                proposal,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )
            proposal_path = (
                base
                / "sessions"
                / created["sessionId"]
                / "proposals"
                / "1"
                / "proposal.json"
            )
            stored = json.loads(proposal_path.read_text(encoding="utf-8"))
            stored["understanding"] = "Tampered but schema-valid."
            proposal_path.write_text(json.dumps(stored), encoding="utf-8")
            with self.assertRaises(SessionCorruptError):
                store.snapshot(created["sessionId"])

    def test_store_exposes_verified_transition(self) -> None:
        self.assertTrue(hasattr(SessionStore, "verify"))


if __name__ == "__main__":
    unittest.main()

