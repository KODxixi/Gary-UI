from __future__ import annotations

import copy
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"
CONTRACTS = ROOT / "contracts"


def _load_contract_module():
    replacement = SCRIPTS / "session_contract.v2.py"
    source = replacement if replacement.exists() else SCRIPTS / "session_contract.py"
    spec = importlib.util.spec_from_file_location("session_contract_under_test", source)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load {source}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


contract = _load_contract_module()



def valid_task() -> dict:
    return {
        "schemaVersion": 2,
        "skill": "gary-liquidglass-ui",
        "operation": "create",
        "mode": "compare",
        "target": {
            "stack": "html",
            "scope": "one local dashboard",
            "deliveryPath": None,
        },
        "brief": {
            "goal": "Compare three usable directions.",
            "audience": "Project owner",
            "content": "Real project content",
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


def _route() -> dict:
    return {
        "schemaVersion": 1,
        "skill": "gary-liquidglass-ui",
        "application": "board",
        "page": "data-page",
        "theme": "dark",
        "material": "regular",
        "density": "compact",
    }


def _option(option_id: str, kind: str) -> dict:
    return {
        "optionId": option_id,
        "label": option_id.upper(),
        "kind": kind,
        "rationale": f"{kind} rationale.",
        "risks": [],
        "expectedBenefit": f"{kind} benefit.",
        "visualRoute": _route(),
        "artifactPath": f"{option_id}.html",
    }


def valid_proposal(mode: str = "compare") -> dict:
    options = [_option("a", "recommended")]
    if mode != "quick":
        options.extend(
            [
                _option("b", "alternative"),
                _option("c", "stretch"),
            ]
        )
    return {
        "schemaVersion": 1,
        "sessionId": "g2-12345678",
        "proposalId": "round-one",
        "revision": 1,
        "baseRevision": 0,
        "mode": mode,
        "understanding": "A dense decision board.",
        "assumptions": ["Desktop first."],
        "recommendation": {"optionId": "a", "reason": "Best hierarchy."},
        "options": options,
        "lockedDecisions": [],
        "openDecisions": [],
        "changeSet": [],
    }


def valid_feedback() -> dict:
    return {
        "schemaVersion": 1,
        "sessionId": "g2-12345678",
        "proposalId": "round-one",
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
        "annotations": [
            {
                "optionId": "a",
                "nodeId": "hero-title",
                "intent": "adjust",
                "priority": "must",
                "note": "Shorter.",
            }
        ],
        "combinations": [
            {
                "regionId": "hero",
                "fromOptionId": "c",
                "note": "Use the stretch composition with the recommended typography.",
            }
        ],
        "lockedDecisions": [{"key": "theme", "value": "dark"}],
        "notes": "Keep the direction.",
    }


def valid_session() -> dict:
    return {
        "schemaVersion": 1,
        "sessionId": "g2-12345678",
        "status": "created",
        "mode": "compare",
        "taskHash": "a" * 64,
        "activeRevision": 0,
        "activeProposalId": None,
        "lastEventSequence": 0,
        "lastEventHash": None,
        "tokenHash": "b" * 64,
        "writerLease": {
            "ownerId": "agent-1",
            "leaseId": "c" * 32,
            "credentialHash": "d" * 64,
            "acquiredAt": "2026-07-28T10:00:00Z",
            "expiresAt": "2026-07-28T10:15:00Z",
        },
        "tokenGeneration": 1,
        "integrityVersion": 2,
        "latestVerificationId": None,
        "createdAt": "2026-07-28T10:00:00Z",
        "updatedAt": "2026-07-28T10:00:00Z",
        "finalizedAt": None,
        "closedAt": None,
    }


def valid_evidence() -> dict:
    return {
        "schemaVersion": 1,
        "sessionId": "g2-12345678",
        "proposalId": "round-one",
        "revision": 1,
        "approvalId": "apr_" + ("a" * 24),
        "result": "pass",
        "summary": "Desktop and mobile verification passed.",
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
                "artifactLabels": ["browser"],
            },
            {
                "requirementId": "browser",
                "checkId": "browser",
                "artifactLabels": ["browser"],
            },
            {
                "requirementId": "visual:0",
                "checkId": "visual-scene",
                "artifactLabels": ["desktop"],
            },
            {
                "requirementId": "technical:0",
                "checkId": "console",
                "artifactLabels": ["console"],
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
                "sourcePath": "C:\\tmp\\gary-desktop.png",
                "viewport": "desktop",
            },
            {
                "kind": "screenshot",
                "label": "mobile-390",
                "sourcePath": "C:\\tmp\\gary-mobile-390.png",
                "viewport": "390px",
            },
            {
                "kind": "browser-report",
                "label": "browser",
                "sourcePath": "C:\\tmp\\gary-browser.json",
            },
            {
                "kind": "console-log",
                "label": "console",
                "sourcePath": "C:\\tmp\\gary-console.json",
            },
        ],
        "skillsUsed": ["gary-liquidglass-ui", "verification-before-completion"],
    }

class ReplacementContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls._temp = tempfile.TemporaryDirectory()
        cls.contracts_dir = Path(cls._temp.name)
        for name in (
            "task.schema.json",
            "proposal.schema.json",
            "approval.schema.json",
            "command-result.schema.json",
        ):
            shutil.copy2(CONTRACTS / name, cls.contracts_dir / name)
        for canonical, replacement in (
            ("session.schema.json", "session.schema.v2.json"),
            ("feedback.schema.json", "feedback.schema.v2.json"),
            ("evidence.schema.json", "evidence.schema.json"),
        ):
            source = CONTRACTS / replacement
            if not source.exists():
                source = CONTRACTS / canonical
            if source.exists():
                shutil.copy2(source, cls.contracts_dir / canonical)

    @classmethod
    def tearDownClass(cls) -> None:
        cls._temp.cleanup()

    def test_session_accepts_hardened_fields_without_breaking_legacy(self) -> None:
        normalized = contract.normalize_session(
            valid_session(),
            contracts_dir=self.contracts_dir,
        )
        self.assertEqual(normalized["tokenGeneration"], 1)
        self.assertEqual(normalized["writerLease"]["credentialHash"], "d" * 64)

        legacy = valid_session()
        legacy.pop("tokenGeneration")
        legacy.pop("integrityVersion")
        legacy.pop("latestVerificationId")
        legacy["writerLease"].pop("credentialHash")
        normalized_legacy = contract.normalize_session(
            legacy,
            contracts_dir=self.contracts_dir,
        )
        self.assertNotIn("integrityVersion", normalized_legacy)

    def test_task_acceptance_requirements_cannot_exceed_evidence_capacity(self) -> None:
        at_capacity = valid_task()
        at_capacity["units"] = []
        for index, count in enumerate((50, 50, 50, 44)):
            unit = copy.deepcopy(valid_task()["units"][0])
            unit["id"] = f"unit-{index}"
            unit["acceptance"] = [f"requirement-{item}" for item in range(count)]
            at_capacity["units"].append(unit)

        normalized = contract.normalize_task(
            at_capacity,
            contracts_dir=self.contracts_dir,
        )
        self.assertEqual(len(normalized["units"]), 4)

        over_capacity = copy.deepcopy(at_capacity)
        over_capacity["acceptance"]["technical"].append("one requirement too many")
        with self.assertRaisesRegex(
            contract.SessionContractError,
            "acceptance requirements.*200",
        ):
            contract.normalize_task(
                over_capacity,
                contracts_dir=self.contracts_dir,
            )

    def test_quick_requires_one_recommended_option(self) -> None:
        quick = valid_proposal("quick")
        self.assertEqual(
            contract.normalize_proposal(quick, contracts_dir=self.contracts_dir)[
                "options"
            ][0]["kind"],
            "recommended",
        )

        invalid = valid_proposal("quick")
        invalid["options"][0]["kind"] = "alternative"
        with self.assertRaisesRegex(contract.SessionContractError, "recommended"):
            contract.normalize_proposal(invalid, contracts_dir=self.contracts_dir)

    def test_compare_and_deep_review_require_exact_three_kinds(self) -> None:
        for mode in ("compare", "deep-review"):
            self.assertEqual(
                len(
                    contract.normalize_proposal(
                        valid_proposal(mode),
                        contracts_dir=self.contracts_dir,
                    )["options"]
                ),
                3,
            )

            too_few = valid_proposal(mode)
            too_few["options"].pop()
            with self.assertRaisesRegex(contract.SessionContractError, "三个方案"):
                contract.normalize_proposal(
                    too_few,
                    contracts_dir=self.contracts_dir,
                )

            duplicate_kind = valid_proposal(mode)
            duplicate_kind["options"][2]["kind"] = "alternative"
            with self.assertRaisesRegex(
                contract.SessionContractError,
                "recommended.*alternative.*stretch",
            ):
                contract.normalize_proposal(
                    duplicate_kind,
                    contracts_dir=self.contracts_dir,
                )

    def test_proposal_defaults_and_validates_locked_decisions(self) -> None:
        locked = valid_proposal()
        locked["lockedDecisions"] = [
            {"key": "first-screen-focus", "value": "风险例外"}
        ]
        normalized = contract.normalize_proposal(
            locked,
            contracts_dir=self.contracts_dir,
        )
        self.assertEqual(normalized["lockedDecisions"], locked["lockedDecisions"])

        legacy = valid_proposal()
        legacy.pop("lockedDecisions")
        normalized_legacy = contract.normalize_proposal(
            legacy,
            contracts_dir=self.contracts_dir,
        )
        self.assertEqual(normalized_legacy["lockedDecisions"], [])

        duplicate = valid_proposal()
        duplicate["lockedDecisions"] = [
            {"key": "first-screen-focus", "value": "风险例外"},
            {"key": "first-screen-focus", "value": "总体健康度"},
        ]
        with self.assertRaisesRegex(
            contract.SessionContractError,
            "lockedDecisions key 必须唯一",
        ):
            contract.normalize_proposal(
                duplicate,
                contracts_dir=self.contracts_dir,
            )

    def test_feedback_tracks_option_annotations_and_combinations(self) -> None:
        normalized = contract.normalize_feedback(
            valid_feedback(),
            contracts_dir=self.contracts_dir,
        )
        self.assertEqual(normalized["controls"]["layout"], "metrics-first")
        self.assertEqual(normalized["annotations"][0]["optionId"], "a")
        self.assertEqual(normalized["combinations"][0]["fromOptionId"], "c")

        missing_option = valid_feedback()
        missing_option["annotations"][0].pop("optionId")
        with self.assertRaisesRegex(contract.SessionContractError, "optionId"):
            contract.normalize_feedback(
                missing_option,
                contracts_dir=self.contracts_dir,
            )

        malformed = valid_feedback()
        malformed["combinations"][0]["unexpected"] = True
        with self.assertRaisesRegex(contract.SessionContractError, "未知字段"):
            contract.normalize_feedback(
                malformed,
                contracts_dir=self.contracts_dir,
            )

        overflow = valid_feedback()
        overflow["combinations"] = overflow["combinations"] * 13
        with self.assertRaisesRegex(contract.SessionContractError, "超过 12"):
            contract.normalize_feedback(
                overflow,
                contracts_dir=self.contracts_dir,
            )

    def test_feedback_approval_still_requires_selected_option(self) -> None:
        invalid = valid_feedback()
        invalid["action"] = "approve"
        invalid["selectedOptionId"] = None
        with self.assertRaisesRegex(contract.SessionContractError, "必须选择"):
            contract.normalize_feedback(
                invalid,
                contracts_dir=self.contracts_dir,
            )

    def test_evidence_is_registered_strict_and_cross_checked(self) -> None:
        normalize = getattr(contract, "normalize_evidence", None)
        self.assertTrue(callable(normalize), "normalize_evidence must be registered")
        if not callable(normalize):
            return

        normalized = normalize(valid_evidence(), contracts_dir=self.contracts_dir)
        self.assertEqual(normalized["result"], "pass")
        self.assertEqual(
            [
                item["requirementId"]
                for item in normalized["acceptanceCoverage"]
            ],
            [
                "viewport:0",
                "viewport:1",
                "keyboard",
                "browser",
                "visual:0",
                "technical:0",
                "unit:overview:0",
            ],
        )
        self.assertEqual(
            normalized["acceptanceCoverage"][1]["artifactLabels"],
            ["mobile-390"],
        )

        missing_coverage = valid_evidence()
        missing_coverage.pop("acceptanceCoverage")
        with self.assertRaisesRegex(
            contract.SessionContractError,
            "acceptanceCoverage",
        ):
            normalize(missing_coverage, contracts_dir=self.contracts_dir)

        unknown = valid_evidence()
        unknown["unexpected"] = True
        with self.assertRaisesRegex(contract.SessionContractError, "未知字段"):
            normalize(unknown, contracts_dir=self.contracts_dir)

        unknown_coverage = valid_evidence()
        unknown_coverage["acceptanceCoverage"][0]["unexpected"] = True
        with self.assertRaisesRegex(contract.SessionContractError, "未知字段"):
            normalize(unknown_coverage, contracts_dir=self.contracts_dir)

        duplicate_check = valid_evidence()
        duplicate_check["checks"].append(copy.deepcopy(duplicate_check["checks"][0]))
        with self.assertRaisesRegex(contract.SessionContractError, "check id 必须唯一"):
            normalize(duplicate_check, contracts_dir=self.contracts_dir)

        duplicate_coverage = valid_evidence()
        duplicate_coverage["acceptanceCoverage"].append(
            copy.deepcopy(duplicate_coverage["acceptanceCoverage"][0])
        )
        with self.assertRaisesRegex(
            contract.SessionContractError,
            "acceptanceCoverage requirementId 必须唯一",
        ):
            normalize(duplicate_coverage, contracts_dir=self.contracts_dir)

        inconsistent_pass = valid_evidence()
        inconsistent_pass["checks"][0]["status"] = "fail"
        with self.assertRaisesRegex(contract.SessionContractError, "全部 checks"):
            normalize(inconsistent_pass, contracts_dir=self.contracts_dir)
    def test_contract_json_files_remain_draft_2020_12(self) -> None:
        for name in (
            "session.schema.json",
            "feedback.schema.json",
            "evidence.schema.json",
        ):
            payload = json.loads((self.contracts_dir / name).read_text(encoding="utf-8"))
            self.assertEqual(
                payload["$schema"],
                "https://json-schema.org/draft/2020-12/schema",
            )
            self.assertFalse(payload["additionalProperties"])


if __name__ == "__main__":
    unittest.main()


