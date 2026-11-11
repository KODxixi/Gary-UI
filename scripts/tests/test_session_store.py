from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

from session_contract import SessionContractError  # noqa: E402
from session_store import (  # noqa: E402
    SessionAuthenticationError,
    SessionConflictError,
    SessionCorruptError,
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
    revision: int = 1,
    base: int = 0,
    open_decisions: list[dict] | None = None,
    locked_decisions: list[dict] | None = None,
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
                "rationale": f"{kind} route.",
                "risks": [],
                "expectedBenefit": f"{kind} benefit.",
                "visualRoute": route(),
                "artifactPath": str(artifacts[option_id]),
            }
        )
    return {
        "schemaVersion": 1,
        "sessionId": "g2-store123",
        "proposalId": f"round-{revision}",
        "revision": revision,
        "baseRevision": base,
        "mode": "compare",
        "understanding": "A decision board.",
        "assumptions": [],
        "recommendation": {"optionId": "a", "reason": "Best hierarchy."},
        "options": options,
        "lockedDecisions": locked_decisions or [],
        "openDecisions": open_decisions or [],
        "changeSet": [],
    }


def feedback(*, revision: int = 1, action: str = "iterate") -> dict:
    return {
        "schemaVersion": 1,
        "sessionId": "g2-store123",
        "proposalId": f"round-{revision}",
        "revision": revision,
        "action": action,
        "selectedOptionId": "a",
        "controls": {
            "theme": "dark",
            "material": "regular",
            "density": "compact",
            "pageMode": "data-page",
            "layout": "metrics-first",
        },
        "annotations": [
            {
                "optionId": "a",
                "nodeId": "hero",
                "intent": "adjust",
                "priority": "must",
                "note": "Shorter.",
            }
        ],
        "combinations": [
            {
                "regionId": "hero",
                "fromOptionId": "c",
                "note": "Use its composition.",
            }
        ],
        "lockedDecisions": [{"key": "theme", "value": "dark"}],
        "notes": "Keep hierarchy.",
    }


PNG_BYTES = b"\x89PNG\r\n\x1a\nfixture"


def write_final_ui_report(path: Path, *, stack: str = "html") -> Path:
    style_entry = (
        "@gary-ui/react-shadcn/styles.css"
        if stack == "react-shadcn"
        else "tokens/base.css"
    )
    path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "source": "real-browser",
                "targetStack": stack,
                "url": "http://127.0.0.1:8891/target/",
                "styleEntry": style_entry,
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
    return path


def write_build_report(path: Path) -> Path:
    path.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "targetStack": "react-shadcn",
                "command": "npm run build",
                "exitCode": 0,
                "cssAssets": 1,
            }
        ),
        encoding="utf-8",
    )
    return path


def acceptance_coverage(check_id: str = "acceptance") -> list[dict]:
    coverage = [
        {
            "requirementId": "viewport:0",
            "checkId": check_id,
            "artifactLabels": ["desktop"],
        },
        {
            "requirementId": "viewport:1",
            "checkId": check_id,
            "artifactLabels": ["mobile"],
        },
    ]
    coverage.extend(
        {
            "requirementId": requirement_id,
            "checkId": check_id,
            "artifactLabels": ["desktop"],
        }
        for requirement_id in (
            "keyboard",
            "browser",
            "visual:0",
            "technical:0",
            "unit:overview:0",
        )
    )
    return coverage


class SessionStoreV2Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.root = self.base / "sessions"
        self.store = SessionStore(self.root)
        self.created = self.store.create(
            task(),
            owner_id="agent-a",
            session_id="g2-store123",
        )
        self.session_id = self.created["sessionId"]
        self.writer = self.created["writerCredential"]
        self.artifacts: dict[str, Path] = {}
        for option_id in ("a", "b", "c"):
            path = self.base / f"{option_id}.html"
            path.write_text(f"<main>{option_id}</main>", encoding="utf-8")
            self.artifacts[option_id] = path

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def publish(self, *, revision: int = 1, base: int = 0, **kwargs):
        return self.store.publish_proposal(
            self.session_id,
            proposal(self.artifacts, revision=revision, base=base, **kwargs),
            owner_id="agent-a",
            writer_credential=self.writer,
        )

    def test_create_uses_separate_writer_capability_and_redacts_snapshot(self) -> None:
        state = json.loads(
            (self.root / self.session_id / "state.json").read_text(encoding="utf-8")
        )
        self.assertEqual(state["tokenGeneration"], 1)
        self.assertEqual(state["integrityVersion"], 3)
        self.assertIn("credentialHash", state["writerLease"])
        self.assertNotEqual(state["writerLease"]["credentialHash"], self.writer)
        snapshot = self.store.snapshot(self.session_id)
        self.assertNotIn("tokenHash", snapshot["session"])
        self.assertNotIn("credentialHash", snapshot["session"]["writerLease"])
        self.store.authenticate(self.session_id, self.created["token"])

    def test_writer_capability_is_required_and_rotated_on_resume(self) -> None:
        with self.assertRaises(SessionAuthenticationError):
            self.store.publish_proposal(
                self.session_id,
                proposal(self.artifacts),
                owner_id="agent-a",
            )
        with self.assertRaises(SessionAuthenticationError):
            self.store.publish_proposal(
                self.session_id,
                proposal(self.artifacts),
                owner_id="agent-a",
                writer_credential="wrong",
            )
        resumed = self.store.resume(
            self.session_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertNotEqual(resumed["writerCredential"], self.writer)
        self.assertEqual(resumed["state"]["tokenGeneration"], 2)
        with self.assertRaises(SessionAuthenticationError):
            self.store.authenticate(self.session_id, self.created["token"])
        with self.assertRaises(SessionAuthenticationError):
            self.store.publish_proposal(
                self.session_id,
                proposal(self.artifacts),
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        self.writer = resumed["writerCredential"]
        self.assertEqual(self.publish()["state"]["status"], "awaiting_feedback")

    def test_full_loop_verify_fail_pass_and_close(self) -> None:
        self.publish()
        approved = self.store.submit_feedback(
            self.session_id,
            feedback(action="approve"),
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        finalized = self.store.finalize(
            self.session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(finalized["state"]["status"], "implementing")
        with self.assertRaisesRegex(SessionConflictError, "verified"):
            self.store.close(
                self.session_id,
                owner_id="agent-a",
                writer_credential=self.writer,
            )

        screenshot = self.base / "desktop.png"
        screenshot.write_bytes(PNG_BYTES)
        mobile = self.base / "mobile.webp"
        mobile.write_bytes(b"RIFF\x04\x00\x00\x00WEBP")
        browser_report = write_final_ui_report(self.base / "browser-report.json")
        evidence = {
            "schemaVersion": 1,
            "sessionId": self.session_id,
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "fail",
            "summary": "Console still fails.",
            "checks": [
                {"id": "console", "status": "fail", "summary": "One error."},
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
            "acceptanceCoverage": [],
            "artifacts": [
                {
                    "kind": "screenshot",
                    "label": "desktop",
                    "sourcePath": str(screenshot),
                    "viewport": "desktop",
                },
                {
                    "kind": "screenshot",
                    "label": "mobile",
                    "sourcePath": str(mobile),
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
        failed = self.store.verify(
            self.session_id,
            evidence,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(failed["state"]["status"], "implementing")
        evidence["result"] = "pass"
        evidence["summary"] = "All checks pass."
        evidence["checks"][0]["status"] = "pass"
        evidence["checks"][0]["summary"] = "No errors."
        evidence["acceptanceCoverage"] = acceptance_coverage("console")
        passed = self.store.verify(
            self.session_id,
            evidence,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(passed["state"]["status"], "verified")
        self.assertEqual(
            passed["receipt"]["acceptanceCoverage"],
            evidence["acceptanceCoverage"],
        )
        receipt_id = passed["receipt"]["receiptId"]
        copied = self.root / self.session_id / "evidence" / receipt_id
        self.assertTrue((copied / "receipt.json").is_file())
        snapshot = self.store.snapshot(self.session_id, base_url="http://127.0.0.1")
        self.assertEqual(snapshot["latestVerification"]["receiptId"], receipt_id)
        self.assertNotIn("sourcePath", snapshot["latestVerification"]["artifacts"][0])
        self.assertIn("/evidence/", snapshot["latestVerification"]["artifacts"][0]["url"])
        closed = self.store.close(
            self.session_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(closed["state"]["status"], "closed")

    def test_pass_requires_target_css_and_real_browser_report(self) -> None:
        self.publish()
        approved = self.store.submit_feedback(
            self.session_id,
            feedback(action="approve"),
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            self.session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        desktop = self.base / "gate-desktop.png"
        desktop.write_bytes(PNG_BYTES)
        mobile = self.base / "gate-mobile.webp"
        mobile.write_bytes(b"RIFF\x04\x00\x00\x00WEBP")
        evidence = {
            "schemaVersion": 1,
            "sessionId": self.session_id,
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "pass",
            "summary": "Target verification passed.",
            "checks": [
                {
                    "id": "acceptance",
                    "status": "pass",
                    "summary": "Task acceptance passed.",
                }
            ],
            "acceptanceCoverage": acceptance_coverage(),
            "artifacts": [
                {
                    "kind": "screenshot",
                    "label": "desktop",
                    "sourcePath": str(desktop),
                    "viewport": "desktop",
                },
                {
                    "kind": "screenshot",
                    "label": "mobile",
                    "sourcePath": str(mobile),
                    "viewport": "390px",
                },
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }
        with self.assertRaisesRegex(SessionContractError, "gary-css-loaded"):
            self.store.verify(
                self.session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=self.writer,
            )

        evidence["checks"].extend(
            [
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
            ]
        )
        with self.assertRaisesRegex(SessionContractError, "browser-report"):
            self.store.verify(
                self.session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=self.writer,
            )

        report = write_final_ui_report(self.base / "gate-browser.json")
        invalid_report = json.loads(report.read_text(encoding="utf-8"))
        invalid_report["styleEntryLoaded"] = False
        report.write_text(json.dumps(invalid_report), encoding="utf-8")
        evidence["artifacts"].append(
            {
                "kind": "browser-report",
                "label": "target-browser-report",
                "sourcePath": str(report),
            }
        )
        with self.assertRaisesRegex(SessionContractError, "styleEntryLoaded"):
            self.store.verify(
                self.session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=self.writer,
            )

        write_final_ui_report(report)
        result = self.store.verify(
            self.session_id,
            evidence,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(result["state"]["status"], "verified")

    def test_react_pass_requires_successful_target_production_build(self) -> None:
        react_task = task()
        react_task["target"]["stack"] = "react-shadcn"
        session_id = "g2-reactgate123"
        created = self.store.create(
            react_task,
            owner_id="agent-a",
            session_id=session_id,
        )
        current_proposal = proposal(self.artifacts)
        current_proposal["sessionId"] = session_id
        self.store.publish_proposal(
            session_id,
            current_proposal,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        current_feedback = feedback(action="approve")
        current_feedback["sessionId"] = session_id
        approved = self.store.submit_feedback(
            session_id,
            current_feedback,
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        desktop = self.base / "react-desktop.png"
        desktop.write_bytes(PNG_BYTES)
        mobile = self.base / "react-mobile.webp"
        mobile.write_bytes(b"RIFF\x04\x00\x00\x00WEBP")
        browser = write_final_ui_report(
            self.base / "react-browser.json",
            stack="react-shadcn",
        )
        evidence = {
            "schemaVersion": 1,
            "sessionId": session_id,
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "pass",
            "summary": "React target verification passed.",
            "checks": [
                {
                    "id": "acceptance",
                    "status": "pass",
                    "summary": "Task acceptance passed.",
                },
                {
                    "id": "gary-css-loaded",
                    "status": "pass",
                    "summary": "Gary adapter CSS loaded in target.",
                },
                {
                    "id": "gary-browser-computed-style",
                    "status": "pass",
                    "summary": "Real browser computed style matched tokens.",
                },
            ],
            "acceptanceCoverage": acceptance_coverage(),
            "artifacts": [
                {
                    "kind": "screenshot",
                    "label": "desktop",
                    "sourcePath": str(desktop),
                    "viewport": "desktop",
                },
                {
                    "kind": "screenshot",
                    "label": "mobile",
                    "sourcePath": str(mobile),
                    "viewport": "390px",
                },
                {
                    "kind": "browser-report",
                    "label": "target-browser-report",
                    "sourcePath": str(browser),
                },
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }
        with self.assertRaisesRegex(SessionContractError, "target-production-build"):
            self.store.verify(
                session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )

        evidence["checks"].append(
            {
                "id": "target-production-build",
                "status": "pass",
                "summary": "Target production build exited zero.",
            }
        )
        with self.assertRaisesRegex(SessionContractError, "build-report"):
            self.store.verify(
                session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )

        build = write_build_report(self.base / "react-build.json")
        failed_build = json.loads(build.read_text(encoding="utf-8"))
        failed_build["exitCode"] = 1
        build.write_text(json.dumps(failed_build), encoding="utf-8")
        evidence["artifacts"].append(
            {
                "kind": "build-report",
                "label": "target-production-build-report",
                "sourcePath": str(build),
            }
        )
        with self.assertRaisesRegex(SessionContractError, "exitCode"):
            self.store.verify(
                session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )

        write_build_report(build)
        result = self.store.verify(
            session_id,
            evidence,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        self.assertEqual(result["state"]["status"], "verified")

    def test_proposal_task_decision_and_feedback_cross_checks(self) -> None:
        wrong_application = proposal(self.artifacts)
        wrong_application["options"][0]["visualRoute"]["application"] = "web-ui"
        with self.assertRaisesRegex(SessionContractError, "application"):
            self.store.publish_proposal(
                self.session_id,
                wrong_application,
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        wrong_page = proposal(self.artifacts)
        wrong_page["options"][0]["visualRoute"]["page"] = "image-page"
        with self.assertRaisesRegex(SessionContractError, "page"):
            self.store.publish_proposal(
                self.session_id,
                wrong_page,
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        self.publish()
        invalid_feedback = feedback()
        invalid_feedback["annotations"][0]["optionId"] = "missing"
        with self.assertRaisesRegex(SessionContractError, "annotation"):
            self.store.submit_feedback(self.session_id, invalid_feedback, trusted_local=True)

    def test_confirmed_decision_and_rejected_option_cannot_return(self) -> None:
        self.publish()
        self.store.submit_feedback(self.session_id, feedback(), trusted_local=True)
        self.store.start_revision(
            self.session_id,
            base_revision=1,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        repeated = proposal(
            self.artifacts,
            revision=2,
            base=1,
            locked_decisions=[{"key": "theme", "value": "dark"}],
            open_decisions=[
                {
                    "id": "theme",
                    "question": "Theme again?",
                    "options": ["dark", "light"],
                }
            ],
        )
        with self.assertRaisesRegex(SessionContractError, "不得再次开放"):
            self.store.publish_proposal(
                self.session_id,
                repeated,
                owner_id="agent-a",
                writer_credential=self.writer,
            )

        second_root = self.base / "sessions-2"
        second = SessionStore(second_root)
        created = second.create(
            task(),
            owner_id="agent-a",
            session_id="g2-reject12",
        )
        first = proposal(self.artifacts)
        first["sessionId"] = created["sessionId"]
        second.publish_proposal(
            created["sessionId"],
            first,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        rejected = feedback(action="reject")
        rejected["sessionId"] = created["sessionId"]
        rejected["selectedOptionId"] = "c"
        second.submit_feedback(created["sessionId"], rejected, trusted_local=True)
        second.start_revision(
            created["sessionId"],
            base_revision=1,
            owner_id="agent-a",
            writer_credential=created["writerCredential"],
        )
        again = proposal(
            self.artifacts,
            revision=2,
            base=1,
            locked_decisions=[{"key": "theme", "value": "dark"}],
        )
        again["sessionId"] = created["sessionId"]
        with self.assertRaisesRegex(SessionContractError, "已拒绝"):
            second.publish_proposal(
                created["sessionId"],
                again,
                owner_id="agent-a",
                writer_credential=created["writerCredential"],
            )

    def test_revision_requires_exact_historical_locked_decisions(self) -> None:
        first_with_lock = proposal(
            self.artifacts,
            locked_decisions=[{"key": "theme", "value": "dark"}],
        )
        with self.assertRaisesRegex(SessionContractError, "lockedDecisions"):
            self.store.publish_proposal(
                self.session_id,
                first_with_lock,
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        self.publish()
        self.store.submit_feedback(self.session_id, feedback(), trusted_local=True)
        self.store.start_revision(
            self.session_id,
            base_revision=1,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        invalid = (
            [],
            [{"key": "theme", "value": "light"}],
            [
                {"key": "theme", "value": "dark"},
                {"key": "density", "value": "compact"},
            ],
        )
        for locked in invalid:
            with self.subTest(locked=locked):
                with self.assertRaisesRegex(SessionContractError, "lockedDecisions"):
                    self.store.publish_proposal(
                        self.session_id,
                        proposal(
                            self.artifacts,
                            revision=2,
                            base=1,
                            locked_decisions=locked,
                        ),
                        owner_id="agent-a",
                        writer_credential=self.writer,
                    )
        published = self.store.publish_proposal(
            self.session_id,
            proposal(
                self.artifacts,
                revision=2,
                base=1,
                locked_decisions=[{"key": "theme", "value": "dark"}],
            ),
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        self.assertEqual(
            published["proposal"]["lockedDecisions"],
            [{"key": "theme", "value": "dark"}],
        )

    def test_verify_rejects_invalid_acceptance_references_and_viewports(self) -> None:
        self.publish()
        approved = self.store.submit_feedback(
            self.session_id,
            feedback(action="approve"),
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            self.session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        desktop = self.base / "acceptance-desktop.png"
        desktop.write_bytes(PNG_BYTES)
        mobile = self.base / "acceptance-mobile.jpg"
        mobile.write_bytes(b"\xff\xd8\xfffixture")
        valid = {
            "schemaVersion": 1,
            "sessionId": self.session_id,
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "pass",
            "summary": "Acceptance passed.",
            "checks": [
                {"id": "acceptance", "status": "pass", "summary": "Passed."},
                {"id": "broken", "status": "pass", "summary": "Not used."},
            ],
            "acceptanceCoverage": acceptance_coverage(),
            "artifacts": [
                {
                    "kind": "screenshot",
                    "label": "desktop",
                    "sourcePath": str(desktop),
                    "viewport": "desktop",
                },
                {
                    "kind": "screenshot",
                    "label": "mobile",
                    "sourcePath": str(mobile),
                    "viewport": "390px",
                },
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }
        mutations = {}
        missing = copy.deepcopy(valid)
        missing["acceptanceCoverage"].pop()
        mutations["missing-requirement"] = missing
        unknown = copy.deepcopy(valid)
        unknown["result"] = "fail"
        unknown["acceptanceCoverage"] = [
            {
                "requirementId": "visual:99",
                "checkId": "acceptance",
                "artifactLabels": ["desktop"],
            }
        ]
        mutations["unknown-requirement"] = unknown
        unknown_check = copy.deepcopy(valid)
        unknown_check["acceptanceCoverage"][0]["checkId"] = "missing"
        mutations["unknown-check"] = unknown_check
        failed_check = copy.deepcopy(valid)
        failed_check["result"] = "fail"
        failed_check["checks"][1]["status"] = "fail"
        failed_check["acceptanceCoverage"] = [
            {
                "requirementId": "viewport:0",
                "checkId": "broken",
                "artifactLabels": ["desktop"],
            }
        ]
        mutations["failed-check"] = failed_check
        unknown_artifact = copy.deepcopy(valid)
        unknown_artifact["acceptanceCoverage"][0]["artifactLabels"] = ["missing"]
        mutations["unknown-artifact"] = unknown_artifact
        wrong_viewport = copy.deepcopy(valid)
        wrong_viewport["artifacts"][0]["viewport"] = "1440x1000"
        mutations["wrong-viewport"] = wrong_viewport
        for label, evidence in mutations.items():
            with self.subTest(label=label):
                with self.assertRaises(SessionContractError):
                    self.store.verify(
                        self.session_id,
                        evidence,
                        owner_id="agent-a",
                        writer_credential=self.writer,
                    )

    def test_screenshot_requires_image_suffix_and_matching_magic(self) -> None:
        self.publish()
        approved = self.store.submit_feedback(
            self.session_id,
            feedback(action="approve"),
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            self.session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        for name, payload in (("fake.png", b"not-a-png"), ("fake.txt", PNG_BYTES)):
            with self.subTest(name=name):
                screenshot = self.base / name
                screenshot.write_bytes(payload)
                evidence = {
                    "schemaVersion": 1,
                    "sessionId": self.session_id,
                    "proposalId": "round-1",
                    "revision": 1,
                    "approvalId": approval_id,
                    "result": "fail",
                    "summary": "Invalid screenshot.",
                    "checks": [
                        {"id": "image", "status": "fail", "summary": "Invalid."}
                    ],
                    "acceptanceCoverage": [],
                    "artifacts": [
                        {
                            "kind": "screenshot",
                            "label": "invalid",
                            "sourcePath": str(screenshot),
                        }
                    ],
                    "skillsUsed": ["gary-liquidglass-ui"],
                }
                with self.assertRaisesRegex(SessionStoreError, "screenshot"):
                    self.store.verify(
                        self.session_id,
                        evidence,
                        owner_id="agent-a",
                        writer_credential=self.writer,
                    )

    def test_watch_rejects_non_finite_timeout(self) -> None:
        for timeout in (float("nan"), float("inf"), float("-inf")):
            with self.subTest(timeout=timeout):
                with self.assertRaisesRegex(SessionStoreError, "timeout"):
                    self.store.watch(self.session_id, timeout=timeout)

    def test_integrity_detects_proposal_artifact_approval_and_decisions_tamper(self) -> None:
        targets = ("proposal", "artifact", "approval", "decisions")
        for index, target in enumerate(targets):
            with self.subTest(target=target):
                root = self.base / f"tamper-{index}"
                store = SessionStore(root)
                session_id = f"g2-tamper{index}x"
                created = store.create(task(), owner_id="agent", session_id=session_id)
                current = proposal(self.artifacts)
                current["sessionId"] = session_id
                store.publish_proposal(
                    session_id,
                    current,
                    owner_id="agent",
                    writer_credential=created["writerCredential"],
                )
                approval_id = None
                if target == "approval":
                    item = feedback(action="approve")
                    item["sessionId"] = session_id
                    approved = store.submit_feedback(session_id, item, trusted_local=True)
                    approval_id = approved["approval"]["approvalId"]
                session_path = root / session_id
                if target == "proposal":
                    file = session_path / "proposals" / "1" / "proposal.json"
                    value = json.loads(file.read_text(encoding="utf-8"))
                    value["understanding"] = "Tampered."
                    file.write_text(json.dumps(value), encoding="utf-8")
                elif target == "artifact":
                    (
                        session_path / "proposals" / "1" / "a" / "index.html"
                    ).write_text("<main>Tampered</main>", encoding="utf-8")
                elif target == "approval":
                    file = session_path / "approvals" / f"{approval_id}.json"
                    value = json.loads(file.read_text(encoding="utf-8"))
                    value["selectedOptionId"] = "b"
                    file.write_text(json.dumps(value), encoding="utf-8")
                else:
                    file = session_path / "decisions.json"
                    value = json.loads(file.read_text(encoding="utf-8"))
                    value["open"] = [{"id": "tampered"}]
                    file.write_text(json.dumps(value), encoding="utf-8")
                with self.assertRaises(SessionCorruptError):
                    store.snapshot(session_id)
                self.assertTrue((session_path / "corrupt.json").is_file())

    def test_legacy_read_requires_explicit_takeover_to_upgrade(self) -> None:
        state_path = self.root / self.session_id / "state.json"
        state = json.loads(state_path.read_text(encoding="utf-8"))
        state.pop("tokenGeneration")
        state.pop("integrityVersion")
        state.pop("latestVerificationId")
        # 安全契约 v3.1：接管需要旧 writer 凭据或一次性 takeover 凭据。
        # 模拟修复前创建的 legacy 会话（两者皆无）→ 仍可走迁移宽限接管。
        state.pop("takeoverCredentialHash")
        state["writerLease"].pop("credentialHash")
        state_path.write_text(json.dumps(state), encoding="utf-8")
        self.assertEqual(self.store.snapshot(self.session_id)["session"]["status"], "created")
        with self.assertRaisesRegex(SessionConflictError, "takeover"):
            self.store.resume(
                self.session_id,
                owner_id="agent-a",
                writer_credential=self.writer,
            )
        upgraded = self.store.resume(
            self.session_id,
            owner_id="agent-b",
            takeover=True,
        )
        self.assertEqual(upgraded["state"]["integrityVersion"], 3)
        self.assertIn("writerCredential", upgraded)

    def test_evidence_extension_is_whitelisted(self) -> None:
        self.publish()
        approved = self.store.submit_feedback(
            self.session_id,
            feedback(action="approve"),
            trusted_local=True,
        )
        approval_id = approved["approval"]["approvalId"]
        self.store.finalize(
            self.session_id,
            approval_id=approval_id,
            owner_id="agent-a",
            writer_credential=self.writer,
        )
        executable = self.base / "evidence.exe"
        executable.write_bytes(b"not allowed")
        evidence = {
            "schemaVersion": 1,
            "sessionId": self.session_id,
            "proposalId": "round-1",
            "revision": 1,
            "approvalId": approval_id,
            "result": "fail",
            "summary": "Unsafe evidence.",
            "checks": [{"id": "safe", "status": "fail", "summary": "No."}],
            "acceptanceCoverage": [],
            "artifacts": [
                {
                    "kind": "other",
                    "label": "unsafe",
                    "sourcePath": str(executable),
                }
            ],
            "skillsUsed": ["gary-liquidglass-ui"],
        }
        with self.assertRaises(SessionStoreError):
            self.store.verify(
                self.session_id,
                evidence,
                owner_id="agent-a",
                writer_credential=self.writer,
            )


if __name__ == "__main__":
    unittest.main()
