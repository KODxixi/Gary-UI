from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from session_store import (  # noqa: E402
    SessionAuthenticationError,
    SessionStore,
    SessionStoreError,
)


def task() -> dict:
    return {
        "schemaVersion": 2,
        "skill": "gary-liquidglass-ui",
        "operation": "create",
        "mode": "compare",
        "target": {"stack": "html", "scope": "dashboard", "deliveryPath": None},
        "brief": {
            "goal": "Make one decision board.",
            "audience": "Owner",
            "content": "Real metrics",
            "assets": [],
            "interactions": ["filter"],
            "constraints": ["offline"],
        },
        "applicationMode": "board",
        "visualDefaults": {
            "theme": "dark",
            "material": "regular",
            "density": "compact",
        },
        "units": [
            {
                "id": "overview",
                "pageMode": "data-page",
                "content": "metrics",
                "assets": [],
                "visualOverrides": {},
                "acceptance": ["390px"],
            }
        ],
        "acceptance": {
            "viewports": ["desktop", "390px"],
            "keyboard": True,
            "browser": True,
            "visual": ["one scene"],
            "technical": ["no console errors"],
        },
    }


def route() -> dict:
    return {
        "schemaVersion": 1,
        "skill": "gary-liquidglass-ui",
        "application": "board",
        "page": "data-page",
        "theme": "dark",
        "material": "regular",
        "density": "compact",
    }


def proposal(
    artifacts: dict[str, Path],
    *,
    rationale_a: str = "recommended route.",
) -> dict:
    options = []
    for option_id, kind in (
        ("a", "recommended"),
        ("b", "alternative"),
        ("c", "stretch"),
    ):
        options.append(
            {
                "optionId": option_id,
                "label": option_id.upper(),
                "kind": kind,
                "rationale": rationale_a if option_id == "a" else f"{kind} route.",
                "risks": [],
                "expectedBenefit": f"{kind} benefit.",
                "visualRoute": route(),
                "artifactPath": str(artifacts[option_id]),
            }
        )
    return {
        "schemaVersion": 1,
        "sessionId": "g2-sec-test-0001",
        "proposalId": "round-1",
        "revision": 1,
        "baseRevision": 0,
        "mode": "compare",
        "understanding": "A decision board.",
        "assumptions": [],
        "recommendation": {"optionId": "a", "reason": "Best hierarchy."},
        "options": options,
        "lockedDecisions": [],
        "openDecisions": [],
        "changeSet": [],
    }


def feedback(*, notes: str = "Keep hierarchy.") -> dict:
    return {
        "schemaVersion": 1,
        "sessionId": "g2-sec-test-0001",
        "proposalId": "round-1",
        "revision": 1,
        "action": "iterate",
        "selectedOptionId": "a",
        "controls": {
            "theme": "dark",
            "material": "regular",
            "density": "compact",
            "pageMode": "data-page",
            "layout": "metrics-first",
        },
        "annotations": [],
        "combinations": [],
        "lockedDecisions": [],
        "notes": notes,
    }


class TakeoverSecurityTests(unittest.TestCase):
    """C 族安全修复回归：takeover 需要能力证明；凭证防泄漏扫描覆盖 proposal/feedback。"""

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.root = self.base / "sessions"
        self.store = SessionStore(self.root)
        self.created = self.store.create(
            task(),
            owner_id="agent-a",
            session_id="g2-sec-test-0001",
        )
        self.session_id = self.created["sessionId"]
        self.writer = self.created["writerCredential"]
        self.token = self.created["token"]
        self.takeover_credential = self.created["takeoverCredential"]
        self.artifacts: dict[str, Path] = {}
        for option_id in ("a", "b", "c"):
            path = self.base / f"{option_id}.html"
            path.write_text(f"<main>{option_id}</main>", encoding="utf-8")
            self.artifacts[option_id] = path

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def state(self) -> dict:
        return json.loads(
            (self.root / self.session_id / "state.json").read_text(encoding="utf-8")
        )

    def test_create_issues_takeover_credential_and_stores_only_hash(self) -> None:
        self.assertIsInstance(self.takeover_credential, str)
        self.assertGreaterEqual(len(self.takeover_credential), 32)
        stored = self.state()
        self.assertEqual(
            stored["takeoverCredentialHash"],
            hashlib.sha256(self.takeover_credential.encode("utf-8")).hexdigest(),
        )
        self.assertNotIn("takeoverCredential", stored)

    def test_snapshot_redacts_takeover_credential_hash(self) -> None:
        public = self.store.snapshot(self.session_id)["session"]
        self.assertNotIn("takeoverCredentialHash", public)

    def test_takeover_without_proof_is_rejected(self) -> None:
        with self.assertRaises(SessionAuthenticationError):
            self.store.resume(self.session_id, owner_id="attacker", takeover=True)

    def test_takeover_with_wrong_credentials_is_rejected(self) -> None:
        with self.assertRaises(SessionAuthenticationError):
            self.store.resume(
                self.session_id,
                owner_id="attacker",
                takeover=True,
                takeover_credential="x" * 43,
            )
        with self.assertRaises(SessionAuthenticationError):
            self.store.resume(
                self.session_id,
                owner_id="attacker",
                takeover=True,
                writer_credential="x" * 43,
            )

    def test_takeover_with_writer_credential_succeeds_and_rotates(self) -> None:
        old_hash = self.state()["takeoverCredentialHash"]
        resumed = self.store.resume(
            self.session_id,
            owner_id="agent-b",
            takeover=True,
            writer_credential=self.writer,
        )
        self.assertIn("writerCredential", resumed)
        self.assertIn("takeoverCredential", resumed)
        self.assertNotEqual(self.state()["takeoverCredentialHash"], old_hash)

    def test_takeover_with_takeover_credential_succeeds_once(self) -> None:
        resumed = self.store.resume(
            self.session_id,
            owner_id="agent-b",
            takeover=True,
            takeover_credential=self.takeover_credential,
        )
        new_tc = resumed["takeoverCredential"]
        self.assertNotEqual(new_tc, self.takeover_credential)
        with self.assertRaises(SessionAuthenticationError):
            self.store.resume(
                self.session_id,
                owner_id="agent-c",
                takeover=True,
                takeover_credential=self.takeover_credential,
            )
        again = self.store.resume(
            self.session_id,
            owner_id="agent-c",
            takeover=True,
            takeover_credential=new_tc,
        )
        self.assertIn("writerCredential", again)

    def test_normal_resume_still_requires_writer_capability(self) -> None:
        with self.assertRaises(SessionAuthenticationError):
            self.store.resume(self.session_id, owner_id="agent-a")

    def test_legacy_session_upgrade_takeover_still_possible(self) -> None:
        state_path = self.root / self.session_id / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state.pop("tokenGeneration")
        state.pop("integrityVersion")
        state.pop("latestVerificationId")
        state.pop("takeoverCredentialHash")
        state["writerLease"].pop("credentialHash")
        state_path.write_text(json.dumps(state), encoding="utf-8")
        upgraded = self.store.resume(
            self.session_id,
            owner_id="agent-b",
            takeover=True,
        )
        self.assertEqual(upgraded["state"]["integrityVersion"], 3)

    def test_proposal_with_embedded_writer_capability_is_rejected(self) -> None:
        with self.assertRaisesRegex(SessionStoreError, "不得包含"):
            self.store.publish_proposal(
                self.session_id,
                proposal(self.artifacts, rationale_a=self.writer),
                owner_id="agent-a",
                writer_credential=self.writer,
            )

    def test_feedback_with_embedded_token_is_rejected(self) -> None:
        self.store.publish_proposal(
            self.session_id,
            proposal(self.artifacts),
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        with self.assertRaisesRegex(SessionStoreError, "不得包含"):
            self.store.submit_feedback(
                self.session_id,
                feedback(notes=self.token),
                trusted_local=True,
            )


if __name__ == "__main__":
    unittest.main()
