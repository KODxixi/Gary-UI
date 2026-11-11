"""Durable, fail-closed storage for Gary-UI 2.0 co-design sessions.

The store is deliberately local and capability based:

* a Session token authorizes the browser collaboration surface;
* a separate writer credential authorizes Agent mutations;
* all durable design and verification artifacts are hash-anchored to the
  append-only event chain;
* legacy v1/v2 sessions remain readable and can only be upgraded by an explicit
  writer takeover.
"""

from __future__ import annotations

import contextlib
import hashlib
import hmac
import json
import math
import os
import re
import secrets
import shutil
import tempfile
import time
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterator

from session_contract import (
    SessionContractError,
    canonical_bytes,
    content_hash,
    normalize_approval,
    normalize_build_report,
    normalize_evidence,
    normalize_feedback,
    normalize_final_ui_report,
    normalize_proposal,
    normalize_session,
    normalize_task,
    utc_now,
    validate_contract,
)


DEFAULT_SESSIONS_ROOT = Path(r"C:\AI\prototypes\gary-ui-sessions")
MAX_ARTIFACT_BYTES = 2 * 1024 * 1024
MAX_EVENT_BYTES = 256 * 1024
MAX_EVIDENCE_FILES = 20
MAX_EVIDENCE_FILE_BYTES = 5 * 1024 * 1024
MAX_EVIDENCE_TOTAL_BYTES = 20 * 1024 * 1024
EVIDENCE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".json", ".txt"}
SESSION_ID = re.compile(r"^[a-z0-9][a-z0-9-]{7,63}$")
OPTION_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
APPROVAL_ID = re.compile(r"^apr_[a-f0-9]{24}$")
RECEIPT_ID = re.compile(r"^vrf_[a-f0-9]{24}$")
EVIDENCE_FILE = re.compile(r"^[0-9]{3}-[a-z0-9][a-z0-9-]{0,79}\.[a-z0-9]{2,5}$")
GENESIS_HASH: str | None = None
FEEDBACK_ID = re.compile(r"^fb_[a-f0-9]{24}$")
BASE64URL_SECRET = re.compile(
    r"(?<![A-Za-z0-9_-])([A-Za-z0-9_-]{32,256})(?![A-Za-z0-9_-])"
)


class SessionStoreError(RuntimeError):
    """Base class for a session persistence failure."""


class SessionNotFoundError(SessionStoreError):
    """Raised for an unknown session identifier or protected artifact."""


class SessionConflictError(SessionStoreError):
    """Raised when a compare-and-set, state, or lease precondition fails."""


class SessionAuthenticationError(SessionStoreError):
    """Raised when a Session token or writer capability is invalid."""


class SessionCorruptError(SessionStoreError):
    """Raised when persisted state fails an integrity check."""


def _parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _secret_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _bytes_hash(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def _has_image_magic(suffix: str, payload: bytes) -> bool:
    if suffix == ".png":
        return payload.startswith(b"\x89PNG\r\n\x1a\n")
    if suffix in {".jpg", ".jpeg"}:
        return payload.startswith(b"\xff\xd8\xff")
    if suffix == ".webp":
        return (
            len(payload) >= 12
            and payload[:4] == b"RIFF"
            and payload[8:12] == b"WEBP"
        )
    return False


def _acceptance_requirements(task: dict[str, Any]) -> dict[str, str | None]:
    acceptance = task["acceptance"]
    requirements: dict[str, str | None] = {
        f"viewport:{index}": viewport
        for index, viewport in enumerate(acceptance["viewports"])
    }
    if acceptance["keyboard"]:
        requirements["keyboard"] = None
    if acceptance["browser"]:
        requirements["browser"] = None
    requirements.update(
        {f"visual:{index}": None for index, _ in enumerate(acceptance["visual"])}
    )
    requirements.update(
        {
            f"technical:{index}": None
            for index, _ in enumerate(acceptance["technical"])
        }
    )
    for unit in task["units"]:
        requirements.update(
            {
                f"unit:{unit['id']}:{index}": None
                for index, _ in enumerate(unit["acceptance"])
            }
        )
    return requirements


def _validate_acceptance_coverage(
    evidence: dict[str, Any],
    task: dict[str, Any],
) -> None:
    requirements = _acceptance_requirements(task)
    expected_ids = set(requirements)
    coverage = {
        item["requirementId"]: item for item in evidence["acceptanceCoverage"]
    }
    coverage_ids = set(coverage)
    unknown = coverage_ids - expected_ids
    if unknown:
        raise SessionContractError(
            "acceptanceCoverage 含未知 requirementId: " + ", ".join(sorted(unknown))
        )
    if evidence["result"] == "pass" and coverage_ids != expected_ids:
        missing = expected_ids - coverage_ids
        extra = coverage_ids - expected_ids
        details = []
        if missing:
            details.append("缺 " + ", ".join(sorted(missing)))
        if extra:
            details.append("多 " + ", ".join(sorted(extra)))
        raise SessionContractError(
            "pass acceptanceCoverage 必须精确覆盖 Task acceptance: "
            + "; ".join(details)
        )

    checks = {item["id"]: item["status"] for item in evidence["checks"]}
    artifacts = {item["label"]: item for item in evidence["artifacts"]}
    for requirement_id, item in coverage.items():
        check_id = item["checkId"]
        if checks.get(check_id) != "pass":
            raise SessionContractError(
                f"acceptanceCoverage {requirement_id} 的 checkId 必须存在且为 pass"
            )
        labels = item["artifactLabels"]
        missing_labels = [label for label in labels if label not in artifacts]
        if missing_labels:
            raise SessionContractError(
                f"acceptanceCoverage {requirement_id} 引用未知 artifactLabels: "
                + ", ".join(sorted(missing_labels))
            )
        viewport = requirements[requirement_id]
        if viewport is not None and not any(
            artifacts[label].get("viewport") == viewport for label in labels
        ):
            raise SessionContractError(
                f"acceptanceCoverage {requirement_id} 必须引用 viewport={viewport} 的 artifact"
            )


FINAL_DELIVERY_OPERATIONS = frozenset({"create", "integrate", "govern"})
FINAL_BROWSER_REPORT_LABEL = "target-browser-report"
FINAL_BUILD_REPORT_LABEL = "target-production-build-report"


def _decode_json_report(payload: bytes, contract_name: str) -> dict[str, Any]:
    try:
        value = json.loads(payload.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise SessionContractError(
            f"{contract_name} artifact 必须是 UTF-8 JSON object"
        ) from error
    if not isinstance(value, dict):
        raise SessionContractError(f"{contract_name} artifact 必须是 JSON object")
    return value


def _validate_final_delivery_evidence(
    evidence: dict[str, Any],
    task: dict[str, Any],
    source_payloads: list[tuple[dict[str, Any], Path, bytes]],
) -> None:
    if (
        evidence["result"] != "pass"
        or task["operation"] not in FINAL_DELIVERY_OPERATIONS
    ):
        return

    checks = {item["id"]: item["status"] for item in evidence["checks"]}
    required_checks = ["gary-css-loaded", "gary-browser-computed-style"]
    stack = task["target"]["stack"]
    if stack == "react-shadcn":
        required_checks.append("target-production-build")
    for check_id in required_checks:
        if checks.get(check_id) != "pass":
            raise SessionContractError(
                f"最终稿 pass 必须包含 status=pass 的 check: {check_id}"
            )

    artifacts = {
        item["label"]: (item, source, payload)
        for item, source, payload in source_payloads
    }
    browser_artifact = artifacts.get(FINAL_BROWSER_REPORT_LABEL)
    if browser_artifact is None or browser_artifact[0]["kind"] != "browser-report":
        raise SessionContractError(
            "最终稿 pass 必须包含 label=target-browser-report 的 browser-report"
        )
    _, browser_source, browser_payload = browser_artifact
    if browser_source.suffix.lower() != ".json":
        raise SessionContractError("target-browser-report 必须是 .json 文件")
    browser_report = normalize_final_ui_report(
        _decode_json_report(browser_payload, "final-ui-report")
    )
    if browser_report["targetStack"] != stack:
        raise SessionContractError("final-ui-report.targetStack 与 Task target.stack 不一致")
    expected_style_entry = (
        "@gary-ui/react-shadcn/styles.css"
        if stack == "react-shadcn"
        else "tokens/base.css"
    )
    if browser_report["styleEntry"] != expected_style_entry:
        raise SessionContractError(
            "final-ui-report.styleEntry 与 Task target.stack 不一致"
        )

    if stack != "react-shadcn":
        return
    build_artifact = artifacts.get(FINAL_BUILD_REPORT_LABEL)
    if build_artifact is None or build_artifact[0]["kind"] != "build-report":
        raise SessionContractError(
            "React 最终稿 pass 必须包含 label=target-production-build-report "
            "的 build-report"
        )
    _, build_source, build_payload = build_artifact
    if build_source.suffix.lower() != ".json":
        raise SessionContractError("target-production-build-report 必须是 .json 文件")
    build_report = normalize_build_report(
        _decode_json_report(build_payload, "build-report")
    )
    if build_report["targetStack"] != stack:
        raise SessionContractError("build-report.targetStack 与 Task target.stack 不一致")


def _atomic_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    _atomic_bytes(path, encoded)


def _atomic_bytes(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="wb",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


@contextlib.contextmanager
def _exclusive_lock(path: Path, *, timeout: float = 5.0) -> Iterator[None]:
    """Take a one-byte advisory lock that works across CLI/server processes."""

    path.parent.mkdir(parents=True, exist_ok=True)
    handle = path.open("a+b")
    if path.stat().st_size == 0:
        handle.write(b"\0")
        handle.flush()
    deadline = time.monotonic() + timeout
    while True:
        try:
            if os.name == "nt":
                import msvcrt

                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl

                fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            break
        except OSError:
            if time.monotonic() >= deadline:
                handle.close()
                raise SessionConflictError("Session 正被另一个进程更新")
            time.sleep(0.05)
    try:
        yield
    finally:
        try:
            if os.name == "nt":
                import msvcrt

                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                import fcntl

                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        finally:
            handle.close()


def _public_lease(lease: dict[str, Any] | None) -> dict[str, Any] | None:
    if lease is None:
        return None
    return {key: value for key, value in lease.items() if key != "credentialHash"}


def _state_integrity_hash(state: dict[str, Any]) -> str:
    """Hash durable security state without event-pointer/update-time cycles."""

    excluded = {"lastEventSequence", "lastEventHash", "updatedAt"}
    anchored = {
        key: value for key, value in state.items() if key not in excluded
    }
    return content_hash(anchored)


class SessionStore:
    """Persist sessions below one configured root and nowhere else."""

    def __init__(self, root: Path = DEFAULT_SESSIONS_ROOT):
        self.root = root.resolve()

    def _session_path(self, session_id: str, *, must_exist: bool = True) -> Path:
        if not isinstance(session_id, str) or SESSION_ID.fullmatch(session_id) is None:
            raise SessionStoreError("sessionId 格式无效")
        path = (self.root / session_id).resolve()
        try:
            path.relative_to(self.root)
        except ValueError as error:
            raise SessionStoreError("sessionId 越出 Session 根") from error
        if must_exist and (not path.exists() or not path.is_dir()):
            raise SessionNotFoundError(f"Session 不存在: {session_id}")
        return path

    def _lock(self, session_id: str) -> contextlib.AbstractContextManager[None]:
        return _exclusive_lock(self._session_path(session_id) / ".lock")

    def _mark_corrupt(self, path: Path, message: str) -> None:
        marker = path / "corrupt.json"
        if marker.exists():
            return
        try:
            _atomic_json(
                marker,
                {
                    "schemaVersion": 1,
                    "status": "corrupt",
                    "detectedAt": utc_now(),
                    "error": message[:2000],
                    "preservedFiles": sorted(
                        item.name for item in path.iterdir() if item.name != "corrupt.json"
                    ),
                },
            )
        except OSError:
            pass

    def _read_json(self, path: Path, label: str) -> dict[str, Any]:
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as error:
            raise SessionCorruptError(f"缺少 {label}") from error
        except (OSError, UnicodeDecodeError, json.JSONDecodeError) as error:
            raise SessionCorruptError(f"{label} 无效: {error}") from error
        if not isinstance(value, dict):
            raise SessionCorruptError(f"{label} 必须是 object")
        return value

    def _read_events(self, path: Path) -> list[dict[str, Any]]:
        events_file = path / "events.jsonl"
        try:
            lines = events_file.read_text(encoding="utf-8").splitlines()
        except FileNotFoundError as error:
            raise SessionCorruptError("缺少 events.jsonl") from error
        except (OSError, UnicodeDecodeError) as error:
            raise SessionCorruptError(f"events.jsonl 无法读取: {error}") from error

        events: list[dict[str, Any]] = []
        previous: str | None = GENESIS_HASH
        for index, line in enumerate(lines, 1):
            if not line.strip():
                raise SessionCorruptError(f"events.jsonl 第 {index} 行为空")
            try:
                event = json.loads(line)
            except json.JSONDecodeError as error:
                raise SessionCorruptError(f"events.jsonl 第 {index} 行无效") from error
            if not isinstance(event, dict):
                raise SessionCorruptError(f"events.jsonl 第 {index} 行不是 object")
            event_hash = event.get("hash")
            unsigned = {key: value for key, value in event.items() if key != "hash"}
            if event.get("sequence") != index:
                raise SessionCorruptError(f"events.jsonl sequence 在第 {index} 行断裂")
            if event.get("previousHash") != previous:
                raise SessionCorruptError(f"events.jsonl hash chain 在第 {index} 行断裂")
            expected = content_hash(unsigned)
            if not isinstance(event_hash, str) or not hmac.compare_digest(event_hash, expected):
                raise SessionCorruptError(f"events.jsonl 第 {index} 行 hash 不匹配")
            events.append(event)
            previous = event_hash
        return events

    def _append_event(
        self,
        path: Path,
        state: dict[str, Any],
        event_type: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        unsigned = {
            "schemaVersion": 1,
            "sequence": state["lastEventSequence"] + 1,
            "eventId": f"evt_{secrets.token_hex(12)}",
            "type": event_type,
            "at": utc_now(),
            "previousHash": state["lastEventHash"],
            "payload": payload,
        }
        if int(state.get("integrityVersion", 1)) >= 3:
            unsigned["stateHash"] = _state_integrity_hash(state)
        event = {**unsigned, "hash": content_hash(unsigned)}
        encoded = canonical_bytes(event) + b"\n"
        if len(encoded) > MAX_EVENT_BYTES:
            raise SessionStoreError("单个 Session event 超过大小限制")
        with (path / "events.jsonl").open("ab") as handle:
            handle.write(encoded)
            handle.flush()
            os.fsync(handle.fileno())
        state["lastEventSequence"] = event["sequence"]
        state["lastEventHash"] = event["hash"]
        state["updatedAt"] = event["at"]
        return event

    def _save_state(self, path: Path, state: dict[str, Any]) -> None:
        normalize_session(state)
        _atomic_json(path / "state.json", state)

    def _proposal_manifest(self, path: Path) -> dict[str, Any]:
        root = path / "proposals"
        manifest: dict[str, Any] = {}
        if not root.exists():
            return manifest
        for revision_dir in sorted(root.iterdir(), key=lambda item: item.name):
            if revision_dir.name.startswith("."):
                continue
            if not revision_dir.is_dir() or not revision_dir.name.isdigit():
                raise SessionCorruptError("proposals 含未知条目")
            proposal = validate_contract(
                "proposal",
                self._read_json(
                    revision_dir / "proposal.json",
                    f"proposal revision {revision_dir.name}",
                )
            )
            if proposal["revision"] != int(revision_dir.name):
                raise SessionCorruptError("proposal revision 与目录不一致")
            artifact_hashes: dict[str, str] = {}
            expected_children = {"proposal.json"}
            for option in proposal["options"]:
                option_id = option["optionId"]
                artifact = revision_dir / option_id / "index.html"
                try:
                    payload = artifact.read_bytes()
                except (FileNotFoundError, OSError) as error:
                    raise SessionCorruptError(
                        f"proposal {revision_dir.name} 缺 artifact {option_id}"
                    ) from error
                artifact_hashes[option_id] = _bytes_hash(payload)
                expected_children.add(option_id)
            actual_children = {
                item.name for item in revision_dir.iterdir() if not item.name.startswith(".")
            }
            if actual_children != expected_children:
                raise SessionCorruptError(
                    f"proposal {revision_dir.name} artifact 集合不一致"
                )
            manifest[revision_dir.name] = {
                "proposalHash": content_hash(proposal),
                "artifactHashes": artifact_hashes,
            }
        return manifest

    def _approval_manifest(self, path: Path) -> dict[str, str]:
        root = path / "approvals"
        manifest: dict[str, str] = {}
        if not root.exists():
            return manifest
        for item in sorted(root.iterdir(), key=lambda entry: entry.name):
            if item.name.startswith("."):
                continue
            if not item.is_file() or item.suffix != ".json":
                raise SessionCorruptError("approvals 含未知条目")
            approval = normalize_approval(self._read_json(item, item.name))
            expected_name = f"{approval['approvalId']}.json"
            if item.name != expected_name:
                raise SessionCorruptError("approvalId 与文件名不一致")
            manifest[approval["approvalId"]] = content_hash(approval)
        return manifest

    def _feedback_manifest(self, path: Path) -> dict[str, str]:
        root = path / "feedback"
        manifest: dict[str, str] = {}
        if not root.exists():
            return manifest
        expected_keys = {
            "schemaVersion",
            "feedbackId",
            "receivedAt",
            "feedback",
        }
        for item in sorted(root.iterdir(), key=lambda entry: entry.name):
            if item.name.startswith("."):
                continue
            if not item.is_file() or item.suffix != ".json":
                raise SessionCorruptError("feedback 含未知条目")
            envelope = self._read_json(item, item.name)
            if set(envelope) != expected_keys or envelope.get("schemaVersion") != 1:
                raise SessionCorruptError("feedback envelope 字段无效")
            feedback_id = envelope.get("feedbackId")
            if (
                not isinstance(feedback_id, str)
                or FEEDBACK_ID.fullmatch(feedback_id) is None
                or item.name != f"{feedback_id}.json"
            ):
                raise SessionCorruptError("feedbackId 与文件名不一致")
            received_at = envelope.get("receivedAt")
            try:
                if not isinstance(received_at, str):
                    raise ValueError
                _parse_utc(received_at)
            except (TypeError, ValueError) as error:
                raise SessionCorruptError("feedback receivedAt 无效") from error
            normalize_feedback(envelope.get("feedback"))
            manifest[feedback_id] = content_hash(envelope)
        return manifest

    def _evidence_manifest(self, path: Path) -> dict[str, Any]:
        root = path / "evidence"
        manifest: dict[str, Any] = {}
        if not root.exists():
            return manifest
        for receipt_dir in sorted(root.iterdir(), key=lambda entry: entry.name):
            if receipt_dir.name.startswith("."):
                continue
            if (
                not receipt_dir.is_dir()
                or RECEIPT_ID.fullmatch(receipt_dir.name) is None
            ):
                raise SessionCorruptError("evidence 含未知条目")
            receipt = self._read_json(
                receipt_dir / "receipt.json",
                f"evidence {receipt_dir.name}/receipt.json",
            )
            if receipt.get("receiptId") != receipt_dir.name:
                raise SessionCorruptError("verification receiptId 与目录不一致")
            file_hashes: dict[str, str] = {}
            expected_children = {"receipt.json"}
            for item in receipt.get("artifacts", []):
                if not isinstance(item, dict) or not isinstance(item.get("fileName"), str):
                    raise SessionCorruptError("verification receipt artifact 无效")
                file_name = item["fileName"]
                if EVIDENCE_FILE.fullmatch(file_name) is None:
                    raise SessionCorruptError("verification evidence 文件名无效")
                evidence_file = receipt_dir / file_name
                try:
                    payload = evidence_file.read_bytes()
                except (FileNotFoundError, OSError) as error:
                    raise SessionCorruptError(f"缺 evidence 文件: {file_name}") from error
                actual_hash = _bytes_hash(payload)
                if item.get("sha256") != actual_hash or item.get("size") != len(payload):
                    raise SessionCorruptError(f"evidence 文件 hash 不匹配: {file_name}")
                file_hashes[file_name] = actual_hash
                expected_children.add(file_name)
            actual_children = {
                item.name for item in receipt_dir.iterdir() if not item.name.startswith(".")
            }
            if actual_children != expected_children:
                raise SessionCorruptError(
                    f"verification {receipt_dir.name} 文件集合不一致"
                )
            manifest[receipt_dir.name] = {
                "receiptHash": content_hash(receipt),
                "fileHashes": file_hashes,
            }
        return manifest

    def _current_integrity_manifest(
        self,
        path: Path,
        *,
        integrity_version: int,
    ) -> dict[str, Any]:
        decisions = self._read_json(path / "decisions.json", "decisions.json")
        manifest = {
            "decisionsHash": content_hash(decisions),
            "proposalHashes": self._proposal_manifest(path),
            "approvalHashes": self._approval_manifest(path),
            "evidenceHashes": self._evidence_manifest(path),
        }
        if integrity_version >= 3:
            task = normalize_task(self._read_json(path / "task.json", "task.json"))
            return {
                "taskHash": content_hash(task),
                "feedbackHashes": self._feedback_manifest(path),
                **manifest,
            }
        return manifest

    def _expected_integrity_manifest(
        self,
        events: list[dict[str, Any]],
    ) -> tuple[int, dict[str, Any]] | None:
        expected: dict[str, Any] | None = None
        expected_version: int | None = None
        for event in events:
            event_type = event.get("type")
            payload = event.get("payload")
            if not isinstance(payload, dict):
                continue
            anchor_version = payload.get("integrityVersion")
            if (
                event_type == "session_created"
                and isinstance(anchor_version, int)
                and anchor_version in {2, 3}
            ):
                expected_version = anchor_version
                expected = {
                    "decisionsHash": payload.get("decisionsHash"),
                    "proposalHashes": {},
                    "approvalHashes": {},
                    "evidenceHashes": {},
                }
                if anchor_version >= 3:
                    expected = {
                        "taskHash": payload.get("taskHash"),
                        "feedbackHashes": {},
                        **expected,
                    }
            elif (
                event_type == "integrity_upgraded"
                and isinstance(anchor_version, int)
                and anchor_version in {2, 3}
            ):
                expected_version = anchor_version
                expected = {
                    "decisionsHash": payload.get("decisionsHash"),
                    "proposalHashes": payload.get("proposalHashes", {}),
                    "approvalHashes": payload.get("approvalHashes", {}),
                    "evidenceHashes": payload.get("evidenceHashes", {}),
                }
                if anchor_version >= 3:
                    expected = {
                        "taskHash": payload.get("taskHash"),
                        "feedbackHashes": payload.get("feedbackHashes", {}),
                        **expected,
                    }
            if expected is None:
                continue
            if event_type == "proposal_published":
                expected["proposalHashes"][str(payload.get("revision"))] = {
                    "proposalHash": payload.get("proposalHash"),
                    "artifactHashes": payload.get("artifactHashes", {}),
                }
            approval_id = payload.get("approvalId")
            approval_hash = payload.get("approvalHash")
            if isinstance(approval_id, str) and isinstance(approval_hash, str):
                expected["approvalHashes"][approval_id] = approval_hash
            if isinstance(payload.get("decisionsHash"), str):
                expected["decisionsHash"] = payload["decisionsHash"]
            if event_type == "feedback_submitted" and "feedbackHashes" in expected:
                feedback_id = payload.get("feedbackId")
                feedback_hash = payload.get("feedbackHash")
                if isinstance(feedback_id, str) and isinstance(feedback_hash, str):
                    expected["feedbackHashes"][feedback_id] = feedback_hash
            receipt_id = payload.get("receiptId")
            receipt_hash = payload.get("receiptHash")
            if isinstance(receipt_id, str) and isinstance(receipt_hash, str):
                expected["evidenceHashes"][receipt_id] = {
                    "receiptHash": receipt_hash,
                    "fileHashes": payload.get("fileHashes", {}),
                }
        if expected is None or expected_version is None:
            return None
        return expected_version, expected

    def _verify_integrity(
        self,
        path: Path,
        state: dict[str, Any],
        events: list[dict[str, Any]],
    ) -> None:
        integrity_version = int(state.get("integrityVersion", 1))
        if integrity_version < 2:
            return
        anchored = self._expected_integrity_manifest(events)
        if anchored is None:
            raise SessionCorruptError(
                f"integrityVersion={integrity_version} 但事件链没有完整性锚"
            )
        anchor_version, expected = anchored
        if anchor_version != integrity_version:
            raise SessionCorruptError("state integrityVersion 与事件链锚不一致")
        actual = self._current_integrity_manifest(
            path,
            integrity_version=integrity_version,
        )
        if actual != expected:
            raise SessionCorruptError("Session durable artifact 与事件链完整性锚不一致")
        if integrity_version < 3:
            return
        v3_started = False
        for event in events:
            payload = event.get("payload")
            if (
                event.get("type") in {"session_created", "integrity_upgraded"}
                and isinstance(payload, dict)
                and payload.get("integrityVersion") == 3
            ):
                v3_started = True
            if v3_started:
                state_hash = event.get("stateHash")
                if (
                    not isinstance(state_hash, str)
                    or re.fullmatch(r"[a-f0-9]{64}", state_hash) is None
                ):
                    raise SessionCorruptError("integrity v3 event 缺 stateHash")
        if not v3_started or not events:
            raise SessionCorruptError("integrityVersion=3 但事件链没有 v3 state 锚")
        if not hmac.compare_digest(
            events[-1]["stateHash"],
            _state_integrity_hash(state),
        ):
            raise SessionCorruptError("Session state 与最后事件 stateHash 不一致")

    def _load_verified_unlocked(
        self,
        path: Path,
    ) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]]]:
        marker = path / "corrupt.json"
        if marker.exists():
            raise SessionCorruptError(f"Session 已标记 corrupt: {path.name}")
        try:
            state = normalize_session(self._read_json(path / "state.json", "state.json"))
            task = normalize_task(self._read_json(path / "task.json", "task.json"))
            events = self._read_events(path)
            if content_hash(task) != state["taskHash"]:
                raise SessionCorruptError("task.json hash 与 state 不一致")
            last_sequence = len(events)
            last_hash = events[-1]["hash"] if events else None
            if state["lastEventSequence"] != last_sequence:
                raise SessionCorruptError("state.lastEventSequence 与 event chain 不一致")
            if state["lastEventHash"] != last_hash:
                raise SessionCorruptError("state.lastEventHash 与 event chain 不一致")
            self._verify_integrity(path, state, events)
            if state["activeRevision"] > 0:
                proposal_file = (
                    path / "proposals" / str(state["activeRevision"]) / "proposal.json"
                )
                proposal = validate_contract(
                    "proposal",
                    self._read_json(proposal_file, "active proposal")
                )
                if proposal["proposalId"] != state["activeProposalId"]:
                    raise SessionCorruptError("active proposal 与 state 不一致")
                if proposal["revision"] != state["activeRevision"]:
                    raise SessionCorruptError("active proposal revision 与 state 不一致")
            return state, task, events
        except (SessionContractError, SessionCorruptError) as error:
            self._mark_corrupt(path, str(error))
            raise SessionCorruptError(str(error)) from error

    def _lease_active(self, lease: dict[str, Any] | None) -> bool:
        try:
            return bool(
                lease
                and isinstance(lease.get("expiresAt"), str)
                and _parse_utc(lease["expiresAt"]) > datetime.now(timezone.utc)
            )
        except (ValueError, TypeError):
            return False

    def _new_lease(
        self,
        *,
        owner_id: str,
        lease_seconds: int,
    ) -> tuple[dict[str, Any], str]:
        owner_id = owner_id.strip()
        if not owner_id or len(owner_id) > 128:
            raise SessionStoreError("writer ownerId 格式无效")
        if not 30 <= lease_seconds <= 3600:
            raise SessionStoreError("lease seconds 必须为 30–3600")
        now = datetime.now(timezone.utc)
        credential = secrets.token_urlsafe(32)
        lease = {
            "ownerId": owner_id,
            "leaseId": secrets.token_hex(16),
            "credentialHash": _secret_hash(credential),
            "acquiredAt": now.isoformat(timespec="seconds").replace("+00:00", "Z"),
            "expiresAt": (now + timedelta(seconds=lease_seconds))
            .isoformat(timespec="seconds")
            .replace("+00:00", "Z"),
        }
        return lease, credential

    def _rotate_lease_unlocked(
        self,
        path: Path,
        state: dict[str, Any],
        *,
        owner_id: str,
        takeover: bool,
        lease_seconds: int,
    ) -> tuple[dict[str, Any], str]:
        previous = state.get("writerLease")
        lease, credential = self._new_lease(
            owner_id=owner_id,
            lease_seconds=lease_seconds,
        )
        state["writerLease"] = lease
        replaced = bool(
            takeover
            or (
                previous
                and self._lease_active(previous)
                and previous.get("ownerId") != owner_id
            )
        )
        self._append_event(
            path,
            state,
            "lease_taken_over" if replaced else "lease_acquired",
            {
                "ownerId": owner_id,
                "leaseId": lease["leaseId"],
                "previousOwnerId": (
                    previous.get("ownerId")
                    if replaced and isinstance(previous, dict)
                    else None
                ),
                "expiresAt": lease["expiresAt"],
            },
        )
        return lease, credential

    def _require_writer(
        self,
        state: dict[str, Any],
        owner_id: str,
        writer_credential: str | None,
    ) -> None:
        lease = state.get("writerLease")
        if not self._lease_active(lease):
            raise SessionConflictError(
                "writer lease 已过期；请使用有效 capability resume 或显式 --takeover"
            )
        assert isinstance(lease, dict)
        if lease.get("ownerId") != owner_id:
            raise SessionConflictError(
                f"writer lease 属于 {lease.get('ownerId')}；请 resume --takeover"
            )
        credential_hash = lease.get("credentialHash")
        if not isinstance(credential_hash, str):
            raise SessionConflictError(
                "legacy writer lease 缺 capability；仅允许 resume --takeover 升级"
            )
        if not isinstance(writer_credential, str) or not writer_credential:
            raise SessionAuthenticationError("缺少 writer lease capability")
        if not hmac.compare_digest(credential_hash, _secret_hash(writer_credential)):
            raise SessionAuthenticationError("writer lease capability 无效")

    def _require_takeover_proof_unlocked(
        self,
        state: dict[str, Any],
        writer_credential: str | None,
        takeover_credential: str | None,
    ) -> bool:
        """接管必须持有旧 writer capability 或一次性 takeover 凭据。

        返回 True 表示走 legacy 迁移宽限（state 中没有任何可验证的凭据材料，
        调用方应记录审计事件）；返回 False 表示证明有效。存在凭据材料但均未
        通过时抛 SessionAuthenticationError，杜绝"知道 sessionId 即接管"。
        """
        protected: list[str] = []
        lease = state.get("writerLease")
        if isinstance(lease, dict) and isinstance(lease.get("credentialHash"), str):
            protected.append(lease["credentialHash"])
        stored_tc = state.get("takeoverCredentialHash")
        if isinstance(stored_tc, str):
            protected.append(stored_tc)
        if isinstance(writer_credential, str):
            candidate = _secret_hash(writer_credential)
            if any(
                hmac.compare_digest(candidate, expected)
                for expected in protected
            ):
                return False
        if isinstance(takeover_credential, str) and isinstance(stored_tc, str):
            candidate = _secret_hash(takeover_credential)
            if hmac.compare_digest(candidate, stored_tc):
                return False
        if not protected:
            return True
        raise SessionAuthenticationError(
            "takeover 需要旧 writer 凭据或有效 takeover 凭据"
        )

    def _reject_embedded_capabilities(
        self,
        state: dict[str, Any],
        payload: bytes,
        *,
        label: str,
    ) -> None:
        try:
            text = payload.decode("utf-8")
        except UnicodeDecodeError as error:
            raise SessionStoreError(f"{label} 必须使用 UTF-8") from error
        protected_hashes = [state.get("tokenHash")]
        lease = state.get("writerLease")
        if isinstance(lease, dict):
            protected_hashes.append(lease.get("credentialHash"))
        protected = [
            item
            for item in protected_hashes
            if isinstance(item, str) and re.fullmatch(r"[a-f0-9]{64}", item)
        ]
        for match in BASE64URL_SECRET.finditer(text):
            candidate_hash = _secret_hash(match.group(1))
            if any(
                hmac.compare_digest(candidate_hash, expected)
                for expected in protected
            ):
                raise SessionStoreError(
                    f"{label} 不得包含 Session token 或 writer capability"
                )

    def _upgrade_integrity_unlocked(
        self,
        path: Path,
        state: dict[str, Any],
    ) -> None:
        state["integrityVersion"] = 3
        state.setdefault("tokenGeneration", 1)
        state.setdefault("latestVerificationId", None)
        manifest = self._current_integrity_manifest(
            path,
            integrity_version=3,
        )
        self._append_event(
            path,
            state,
            "integrity_upgraded",
            {"integrityVersion": 3, **manifest},
        )

    def create(
        self,
        task_raw: Any,
        *,
        owner_id: str,
        lease_seconds: int = 1800,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        task = normalize_task(task_raw)
        self.root.mkdir(parents=True, exist_ok=True)
        session_id = session_id or f"g2-{uuid.uuid4().hex[:16]}"
        path = self._session_path(session_id, must_exist=False)
        try:
            path.mkdir(parents=False, exist_ok=False)
        except FileExistsError as error:
            raise SessionConflictError(f"Session 已存在: {session_id}") from error
        for child in ("proposals", "feedback", "approvals", "evidence"):
            (path / child).mkdir()
        (path / "events.jsonl").write_bytes(b"")
        token = secrets.token_urlsafe(32)
        now = utc_now()
        state: dict[str, Any] = {
            "schemaVersion": 1,
            "sessionId": session_id,
            "status": "created",
            "mode": task["mode"],
            "taskHash": content_hash(task),
            "activeRevision": 0,
            "activeProposalId": None,
            "lastEventSequence": 0,
            "lastEventHash": None,
            "tokenHash": _secret_hash(token),
            "tokenGeneration": 1,
            "integrityVersion": 3,
            "latestVerificationId": None,
            "writerLease": None,
            "createdAt": now,
            "updatedAt": now,
            "finalizedAt": None,
            "closedAt": None,
        }
        takeover_credential = secrets.token_urlsafe(32)
        state["takeoverCredentialHash"] = _secret_hash(takeover_credential)
        state["takeoverCredentialGeneration"] = 1
        decisions = {
            "schemaVersion": 1,
            "confirmed": [],
            "open": [],
            "rejected": [],
            "finalApprovalId": None,
        }
        _atomic_json(path / "task.json", task)
        _atomic_json(path / "decisions.json", decisions)
        with _exclusive_lock(path / ".lock"):
            self._append_event(
                path,
                state,
                "session_created",
                {
                    "sessionId": session_id,
                    "mode": task["mode"],
                    "operation": task["operation"],
                    "taskHash": state["taskHash"],
                    "integrityVersion": 3,
                    "decisionsHash": content_hash(decisions),
                },
            )
            lease, writer_credential = self._rotate_lease_unlocked(
                path,
                state,
                owner_id=owner_id,
                takeover=False,
                lease_seconds=lease_seconds,
            )
            self._save_state(path, state)
        return {
            "sessionId": session_id,
            "token": token,
            "writerCredential": writer_credential,
            "takeoverCredential": takeover_credential,
            "state": state,
            "writerLease": _public_lease(lease),
        }

    def _require_session_token_unlocked(
        self,
        state: dict[str, Any],
        token: str,
        *,
        expected_generation: int | None = None,
    ) -> int:
        if not isinstance(token, str) or not hmac.compare_digest(
            state["tokenHash"], _secret_hash(token)
        ):
            raise SessionAuthenticationError("Session token 无效")
        generation = int(state.get("tokenGeneration", 1))
        if expected_generation is not None and generation != expected_generation:
            raise SessionAuthenticationError("Session token generation 已轮换")
        return generation

    def authenticate(
        self,
        session_id: str,
        token: str,
        *,
        expected_generation: int | None = None,
    ) -> int:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            return self._require_session_token_unlocked(
                state,
                token,
                expected_generation=expected_generation,
            )

    def _latest_verification(
        self,
        path: Path,
        state: dict[str, Any],
        *,
        base_url: str,
    ) -> dict[str, Any] | None:
        receipt_id = state.get("latestVerificationId")
        if not isinstance(receipt_id, str):
            return None
        receipt = self._read_json(
            path / "evidence" / receipt_id / "receipt.json",
            "latest verification receipt",
        )
        public = json.loads(json.dumps(receipt, ensure_ascii=False))
        for artifact in public.get("artifacts", []):
            artifact.pop("sourcePath", None)
            artifact["url"] = (
                f"{base_url}/api/sessions/{state['sessionId']}/evidence/"
                f"{receipt_id}/{artifact['fileName']}"
            )
        return public

    def snapshot(
        self,
        session_id: str,
        *,
        base_url: str = "",
    ) -> dict[str, Any]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, task, events = self._load_verified_unlocked(path)
            decisions = self._read_json(path / "decisions.json", "decisions.json")
            proposal: dict[str, Any] | None = None
            active_artifact: str | None = None
            if state["activeRevision"]:
                proposal = validate_contract(
                    "proposal",
                    self._read_json(
                        path
                        / "proposals"
                        / str(state["activeRevision"])
                        / "proposal.json",
                        "active proposal",
                    )
                )
                for option in proposal["options"]:
                    option["artifactPath"] = None
                    option["artifactUrl"] = (
                        f"{base_url}/api/sessions/{session_id}/artifacts/"
                        f"{state['activeRevision']}/{option['optionId']}/index.html"
                    )
                    if option["optionId"] == proposal["recommendation"]["optionId"]:
                        active_artifact = option["artifactUrl"]
            public_state = {
                key: value
                for key, value in state.items()
                if key not in ("tokenHash", "takeoverCredentialHash")
            }
            public_state["writerLease"] = _public_lease(state.get("writerLease"))
            return {
                "schemaVersion": 1,
                "session": public_state,
                "task": task,
                "activeProposal": proposal,
                "activeArtifactUrl": active_artifact,
                "decisions": decisions,
                "latestVerification": self._latest_verification(
                    path,
                    state,
                    base_url=base_url,
                ),
                "events": {
                    "lastSequence": len(events),
                    "lastHash": events[-1]["hash"] if events else None,
                },
            }

    def _validate_proposal_against_task(
        self,
        proposal: dict[str, Any],
        task: dict[str, Any],
        decisions: dict[str, Any],
    ) -> None:
        expected_locked = {
            item["key"]: item["value"]
            for item in decisions.get("confirmed", [])
            if (
                isinstance(item, dict)
                and isinstance(item.get("revision"), int)
                and item["revision"] < proposal["revision"]
                and isinstance(item.get("key"), str)
                and isinstance(item.get("value"), str)
            )
        }
        actual_locked = {
            item["key"]: item["value"] for item in proposal["lockedDecisions"]
        }
        if actual_locked != expected_locked:
            raise SessionContractError(
                "proposal.lockedDecisions 必须精确携带历史 confirmed decisions"
            )

        allowed_pages = {unit["pageMode"] for unit in task["units"]}
        for option in proposal["options"]:
            route = option["visualRoute"]
            if route["application"] != task["applicationMode"]:
                raise SessionContractError(
                    f"option {option['optionId']} application 与 task.applicationMode 不一致"
                )
            if route["page"] not in allowed_pages:
                raise SessionContractError(
                    f"option {option['optionId']} page 不属于 task.units[].pageMode"
                )
        confirmed_keys = {
            item.get("key")
            for item in decisions.get("confirmed", [])
            if isinstance(item, dict) and isinstance(item.get("key"), str)
        }
        repeated_decisions = {
            item["id"] for item in proposal["openDecisions"] if item["id"] in confirmed_keys
        }
        if repeated_decisions:
            raise SessionContractError(
                "已确认 decision 不得再次开放: " + ", ".join(sorted(repeated_decisions))
            )
        rejected = {
            item.get("optionId")
            for item in decisions.get("rejected", [])
            if isinstance(item, dict) and isinstance(item.get("optionId"), str)
        }
        republished = {
            item["optionId"] for item in proposal["options"] if item["optionId"] in rejected
        }
        if republished:
            raise SessionContractError(
                "已拒绝 optionId 不得再次发布: " + ", ".join(sorted(republished))
            )

    def publish_proposal(
        self,
        session_id: str,
        proposal_raw: Any,
        *,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        proposal = normalize_proposal(proposal_raw)
        if proposal["sessionId"] != session_id:
            raise SessionConflictError("proposal.sessionId 与命令不一致")
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, task, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] not in {"created", "revising"}:
                raise SessionConflictError(
                    f"Session 状态 {state['status']} 不允许发布提案；"
                    "首轮必须是 created，后续必须先 revise"
                )
            if proposal["mode"] != state["mode"]:
                raise SessionConflictError("proposal.mode 与 Session 不一致")
            if proposal["baseRevision"] != state["activeRevision"]:
                raise SessionConflictError(
                    f"revision CAS 失败：当前 {state['activeRevision']}，"
                    f"提案基于 {proposal['baseRevision']}"
                )
            if proposal["revision"] != state["activeRevision"] + 1:
                raise SessionConflictError("proposal.revision 必须等于当前 revision + 1")
            decisions = self._read_json(path / "decisions.json", "decisions.json")
            self._validate_proposal_against_task(proposal, task, decisions)

            sources: list[tuple[dict[str, Any], bytes]] = []
            for option in proposal["options"]:
                source = Path(option["artifactPath"]).expanduser().resolve()
                if not source.is_file() or source.suffix.lower() not in {".html", ".htm"}:
                    raise SessionStoreError(
                        f"artifact 必须是现有 HTML 文件: {option['optionId']}"
                    )
                size = source.stat().st_size
                if size < 1 or size > MAX_ARTIFACT_BYTES:
                    raise SessionStoreError(
                        f"artifact 大小必须为 1–{MAX_ARTIFACT_BYTES} bytes: "
                        f"{option['optionId']}"
                    )
                payload = source.read_bytes()
                try:
                    payload.decode("utf-8")
                except UnicodeDecodeError as error:
                    raise SessionStoreError("artifact 必须使用 UTF-8") from error
                self._reject_embedded_capabilities(
                    state,
                    payload,
                    label=f"artifact {option['optionId']}",
                )
                sources.append((option, payload))

            revision_dir = path / "proposals" / str(proposal["revision"])
            if revision_dir.exists():
                raise SessionConflictError("目标 revision 已存在，拒绝覆盖")
            staging = path / "proposals" / (
                f".{proposal['revision']}.{uuid.uuid4().hex}.staging"
            )
            staging.mkdir()
            self._reject_embedded_capabilities(
                state,
                canonical_bytes(proposal),
                label="proposal JSON",
            )
            stored = json.loads(json.dumps(proposal, ensure_ascii=False))
            artifact_hashes: dict[str, str] = {}
            try:
                for option, payload in sources:
                    option_dir = staging / option["optionId"]
                    option_dir.mkdir()
                    _atomic_bytes(option_dir / "index.html", payload)
                    artifact_hashes[option["optionId"]] = _bytes_hash(payload)
                    for stored_option in stored["options"]:
                        if stored_option["optionId"] == option["optionId"]:
                            stored_option["artifactPath"] = (
                                f"artifact://{proposal['revision']}/{option['optionId']}"
                            )
                            break
                _atomic_json(staging / "proposal.json", stored)
                os.replace(staging, revision_dir)
            except Exception:
                if staging.exists():
                    shutil.rmtree(staging)
                raise

            state["activeRevision"] = proposal["revision"]
            state["activeProposalId"] = proposal["proposalId"]
            state["status"] = "proposal_ready"
            decisions["open"] = proposal["openDecisions"]
            _atomic_json(path / "decisions.json", decisions)
            published = self._append_event(
                path,
                state,
                "proposal_published",
                {
                    "proposalId": proposal["proposalId"],
                    "revision": proposal["revision"],
                    "baseRevision": proposal["baseRevision"],
                    "optionIds": [item["optionId"] for item in proposal["options"]],
                    "proposalHash": content_hash(stored),
                    "artifactHashes": artifact_hashes,
                    "decisionsHash": content_hash(decisions),
                },
            )
            state["status"] = "awaiting_feedback"
            self._append_event(
                path,
                state,
                "awaiting_feedback",
                {
                    "proposalId": proposal["proposalId"],
                    "revision": proposal["revision"],
                },
            )
            self._save_state(path, state)
            return {"state": state, "event": published, "proposal": stored}

    def start_revision(
        self,
        session_id: str,
        *,
        base_revision: int,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] != "feedback_received":
                raise SessionConflictError("只有收到反馈后才能开始 revise")
            if state["activeRevision"] != base_revision:
                raise SessionConflictError(
                    f"revision CAS 失败：当前 {state['activeRevision']}，"
                    f"请求基于 {base_revision}"
                )
            state["status"] = "revising"
            event = self._append_event(
                path,
                state,
                "revision_started",
                {
                    "baseRevision": base_revision,
                    "expectedRevision": base_revision + 1,
                    "ownerId": owner_id,
                },
            )
            self._save_state(path, state)
            return {
                "state": state,
                "event": event,
                "expectedRevision": base_revision + 1,
            }

    def submit_feedback(
        self,
        session_id: str,
        feedback_raw: Any,
        *,
        token: str | None = None,
        expected_generation: int | None = None,
        trusted_local: bool = False,
    ) -> dict[str, Any]:
        feedback = normalize_feedback(feedback_raw)
        if feedback["sessionId"] != session_id:
            raise SessionConflictError("feedback.sessionId 与 URL 不一致")
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            if not trusted_local:
                if expected_generation is None:
                    raise SessionAuthenticationError(
                        "feedback 写入缺少 Session token generation"
                    )
                self._require_session_token_unlocked(
                    state,
                    token,
                    expected_generation=expected_generation,
                )
            if state["status"] != "awaiting_feedback":
                raise SessionConflictError(
                    f"Session 状态 {state['status']} 不接受反馈"
                )
            if feedback["revision"] != state["activeRevision"]:
                raise SessionConflictError("feedback revision 已过期")
            if feedback["proposalId"] != state["activeProposalId"]:
                raise SessionConflictError("feedback proposalId 已过期")
            proposal = validate_contract(
                "proposal",
                self._read_json(
                    path
                    / "proposals"
                    / str(state["activeRevision"])
                    / "proposal.json",
                    "active proposal",
                )
            )
            option_ids = {item["optionId"] for item in proposal["options"]}
            selected = feedback["selectedOptionId"]
            if selected is not None and selected not in option_ids:
                raise SessionContractError("selectedOptionId 不属于当前提案")
            invalid_annotations = {
                item["optionId"]
                for item in feedback["annotations"]
                if item["optionId"] not in option_ids
            }
            if invalid_annotations:
                raise SessionContractError(
                    "annotation.optionId 不属于当前提案: "
                    + ", ".join(sorted(invalid_annotations))
                )
            invalid_combinations = {
                item["fromOptionId"]
                for item in feedback["combinations"]
                if item["fromOptionId"] not in option_ids
            }
            if invalid_combinations:
                raise SessionContractError(
                    "combination.fromOptionId 不属于当前提案: "
                    + ", ".join(sorted(invalid_combinations))
                )

            feedback_id = f"fb_{secrets.token_hex(12)}"
            feedback_envelope = {
                "schemaVersion": 1,
                "feedbackId": feedback_id,
                "receivedAt": utc_now(),
                "feedback": feedback,
            }
            feedback_hash = content_hash(feedback_envelope)
            self._reject_embedded_capabilities(
                state,
                canonical_bytes(feedback_envelope),
                label="feedback envelope",
            )
            _atomic_json(path / "feedback" / f"{feedback_id}.json", feedback_envelope)
            state["status"] = (
                "approved" if feedback["action"] == "approve" else "feedback_received"
            )
            event = self._append_event(
                path,
                state,
                "feedback_submitted",
                {
                    "feedbackId": feedback_id,
                    "proposalId": feedback["proposalId"],
                    "revision": feedback["revision"],
                    "action": feedback["action"],
                    "selectedOptionId": selected,
                    "feedback": feedback,
                    "feedbackHash": feedback_hash,
                },
            )

            decisions = self._read_json(path / "decisions.json", "decisions.json")
            existing = {
                item["key"]: item
                for item in decisions.get("confirmed", [])
                if isinstance(item, dict) and "key" in item
            }
            for item in feedback["lockedDecisions"]:
                existing[item["key"]] = {
                    **item,
                    "revision": feedback["revision"],
                    "feedbackId": feedback_id,
                }
            decisions["confirmed"] = list(existing.values())
            if feedback["action"] == "reject" and selected:
                rejected = {
                    item.get("optionId")
                    for item in decisions.setdefault("rejected", [])
                    if isinstance(item, dict)
                }
                if selected not in rejected:
                    decisions["rejected"].append(
                        {
                            "optionId": selected,
                            "revision": feedback["revision"],
                            "feedbackId": feedback_id,
                        }
                    )

            approval: dict[str, Any] | None = None
            approval_event: dict[str, Any] | None = None
            if feedback["action"] == "approve":
                approval = {
                    "schemaVersion": 1,
                    "approvalId": f"apr_{secrets.token_hex(12)}",
                    "sessionId": session_id,
                    "proposalId": feedback["proposalId"],
                    "revision": feedback["revision"],
                    "feedbackId": feedback_id,
                    "selectedOptionId": selected,
                    "decisionHash": content_hash(feedback),
                    "createdAt": utc_now(),
                    "finalizedAt": None,
                }
                normalize_approval(approval)
                _atomic_json(
                    path / "approvals" / f"{approval['approvalId']}.json",
                    approval,
                )
                approval_event = self._append_event(
                    path,
                    state,
                    "approval_created",
                    {
                        "approvalId": approval["approvalId"],
                        "proposalId": approval["proposalId"],
                        "revision": approval["revision"],
                        "feedbackId": feedback_id,
                        "selectedOptionId": selected,
                        "decisionHash": approval["decisionHash"],
                        "approvalHash": content_hash(approval),
                    },
                )
            _atomic_json(path / "decisions.json", decisions)
            self._append_event(
                path,
                state,
                "decisions_updated",
                {
                    "reason": "feedback_submitted",
                    "feedbackId": feedback_id,
                    "decisionsHash": content_hash(decisions),
                },
            )
            self._save_state(path, state)
            return {
                "state": state,
                "event": event,
                "approvalEvent": approval_event,
                "feedbackId": feedback_id,
                "approval": approval,
            }

    def feedback_events(
        self,
        session_id: str,
        *,
        after: int = 0,
    ) -> list[dict[str, Any]]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            _, _, events = self._load_verified_unlocked(path)
            return [
                event
                for event in events
                if event["sequence"] > after and event["type"] == "feedback_submitted"
            ]

    def events_after(
        self,
        session_id: str,
        *,
        after: int = 0,
    ) -> list[dict[str, Any]]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            _, _, events = self._load_verified_unlocked(path)
            return [event for event in events if event["sequence"] > after]

    def watch(
        self,
        session_id: str,
        *,
        after: int = 0,
        timeout: float = 45,
    ) -> dict[str, Any]:
        if (
            isinstance(timeout, bool)
            or not isinstance(timeout, (int, float))
            or not math.isfinite(timeout)
            or not 0 <= timeout <= 45
        ):
            raise SessionStoreError("watch timeout 必须是 0–45 的有限数值")
        deadline = time.monotonic() + timeout
        while True:
            events = self.events_after(session_id, after=after)
            feedback = [
                event for event in events if event["type"] == "feedback_submitted"
            ]
            if feedback:
                return {"heartbeat": False, "events": events, "feedback": feedback}
            if time.monotonic() >= deadline:
                return {"heartbeat": True, "events": events, "feedback": []}
            time.sleep(min(0.25, max(0.01, deadline - time.monotonic())))

    def resume(
        self,
        session_id: str,
        *,
        owner_id: str,
        writer_credential: str | None = None,
        takeover: bool = False,
        takeover_credential: str | None = None,
        lease_seconds: int = 1800,
    ) -> dict[str, Any]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            if state["status"] == "closed":
                raise SessionConflictError("closed Session 不能 resume")
            lease = state.get("writerLease")
            needs_upgrade = (
                state.get("integrityVersion", 1) < 3
                or not isinstance(lease, dict)
                or not isinstance(lease.get("credentialHash"), str)
            )
            if needs_upgrade and not takeover:
                raise SessionConflictError(
                    "legacy Session 仅允许显式 resume --takeover 完成安全升级"
                )
            legacy_grace = False
            if takeover:
                legacy_grace = self._require_takeover_proof_unlocked(
                    state,
                    writer_credential,
                    takeover_credential,
                )
                if legacy_grace:
                    self._append_event(
                        path,
                        state,
                        "takeover_unverified_legacy",
                        {
                            "reason": "legacy Session 无凭据材料，迁移宽限接管",
                            "ownerId": owner_id,
                        },
                    )
            else:
                self._require_writer(state, owner_id, writer_credential)
            if needs_upgrade:
                self._upgrade_integrity_unlocked(path, state)
            new_lease, new_credential = self._rotate_lease_unlocked(
                path,
                state,
                owner_id=owner_id,
                takeover=takeover,
                lease_seconds=lease_seconds,
            )
            new_takeover_credential: str | None = None
            if takeover:
                new_takeover_credential = secrets.token_urlsafe(32)
                state["takeoverCredentialHash"] = _secret_hash(
                    new_takeover_credential
                )
                state["takeoverCredentialGeneration"] = (
                    int(state.get("takeoverCredentialGeneration", 0)) + 1
                )
            token = secrets.token_urlsafe(32)
            state["tokenHash"] = _secret_hash(token)
            state["tokenGeneration"] = int(state.get("tokenGeneration", 1)) + 1
            self._append_event(
                path,
                state,
                "token_rotated",
                {
                    "reason": "session_resume",
                    "tokenGeneration": state["tokenGeneration"],
                },
            )
            self._append_event(
                path,
                state,
                "session_resumed",
                {
                    "ownerId": owner_id,
                    "activeRevision": state["activeRevision"],
                    "status": state["status"],
                    "takeover": takeover,
                },
            )
            self._save_state(path, state)
            return {
                "sessionId": session_id,
                "token": token,
                "writerCredential": new_credential,
                "takeoverCredential": new_takeover_credential,
                "state": state,
                "writerLease": _public_lease(new_lease),
            }

    def reopen(
        self,
        session_id: str,
        *,
        approval_id: str,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        if APPROVAL_ID.fullmatch(approval_id) is None:
            raise SessionConflictError("approvalId 格式无效")
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] != "approved":
                raise SessionConflictError("只有 approved Session 可以 reopen")
            approval_path = path / "approvals" / f"{approval_id}.json"
            if not approval_path.is_file():
                raise SessionConflictError("approvalId 不存在")
            approval = normalize_approval(self._read_json(approval_path, "approval"))
            if (
                approval["sessionId"] != session_id
                or approval["proposalId"] != state["activeProposalId"]
                or approval["revision"] != state["activeRevision"]
            ):
                raise SessionConflictError("approvalId 未绑定当前 revision")
            if approval["finalizedAt"] is not None or state["finalizedAt"] is not None:
                raise SessionConflictError("已 finalize 的 approval 不能 reopen")
            reopened_at = utc_now()
            decisions = self._read_json(path / "decisions.json", "decisions.json")
            decisions["finalApprovalId"] = None
            decisions.setdefault("reopenedApprovals", []).append(
                {
                    "approvalId": approval_id,
                    "proposalId": approval["proposalId"],
                    "revision": approval["revision"],
                    "reopenedAt": reopened_at,
                }
            )
            _atomic_json(path / "decisions.json", decisions)
            state["status"] = "feedback_received"
            event = self._append_event(
                path,
                state,
                "session_reopened",
                {
                    "approvalId": approval_id,
                    "proposalId": approval["proposalId"],
                    "revision": approval["revision"],
                    "selectedOptionId": approval["selectedOptionId"],
                    "reason": "continue_iteration",
                    "decisionsHash": content_hash(decisions),
                },
            )
            self._save_state(path, state)
            return {"state": state, "event": event, "approval": approval}

    def finalize(
        self,
        session_id: str,
        *,
        approval_id: str,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        if APPROVAL_ID.fullmatch(approval_id) is None:
            raise SessionConflictError("approvalId 格式无效")
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] != "approved":
                raise SessionConflictError("只有 approved Session 可以 finalize")
            approval_path = path / "approvals" / f"{approval_id}.json"
            if not approval_path.is_file():
                raise SessionConflictError("approvalId 不存在")
            approval = normalize_approval(self._read_json(approval_path, "approval"))
            if (
                approval["sessionId"] != session_id
                or approval["proposalId"] != state["activeProposalId"]
                or approval["revision"] != state["activeRevision"]
            ):
                raise SessionConflictError("approvalId 未绑定当前 revision")
            proposal = validate_contract(
                "proposal",
                self._read_json(
                    path
                    / "proposals"
                    / str(state["activeRevision"])
                    / "proposal.json",
                    "active proposal",
                )
            )
            if approval["selectedOptionId"] not in {
                item["optionId"] for item in proposal["options"]
            }:
                raise SessionConflictError("approval selectedOptionId 不属于当前提案")
            if approval["finalizedAt"] is not None:
                raise SessionConflictError("approval 已 finalize")
            finalized_at = utc_now()
            approval["finalizedAt"] = finalized_at
            normalize_approval(approval)
            _atomic_json(approval_path, approval)
            decisions = self._read_json(path / "decisions.json", "decisions.json")
            decisions["finalApprovalId"] = approval_id
            _atomic_json(path / "decisions.json", decisions)
            state["status"] = "implementing"
            state["finalizedAt"] = finalized_at
            event = self._append_event(
                path,
                state,
                "session_finalized",
                {
                    "approvalId": approval_id,
                    "proposalId": approval["proposalId"],
                    "revision": approval["revision"],
                    "selectedOptionId": approval["selectedOptionId"],
                    "approvalHash": content_hash(approval),
                    "decisionsHash": content_hash(decisions),
                },
            )
            self._save_state(path, state)
            return {"state": state, "event": event, "approval": approval}

    def _evidence_file_name(
        self,
        index: int,
        label: str,
        suffix: str,
    ) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")[:64]
        if not slug:
            slug = "evidence"
        return f"{index:03d}-{slug}{suffix}"

    def verify(
        self,
        session_id: str,
        evidence_raw: Any,
        *,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        evidence = normalize_evidence(evidence_raw)
        if evidence["sessionId"] != session_id:
            raise SessionConflictError("evidence.sessionId 与命令不一致")
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, task, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] != "implementing":
                raise SessionConflictError("只有 implementing Session 可以 verify")
            decisions = self._read_json(path / "decisions.json", "decisions.json")
            approval_id = decisions.get("finalApprovalId")
            if (
                evidence["proposalId"] != state["activeProposalId"]
                or evidence["revision"] != state["activeRevision"]
                or evidence["approvalId"] != approval_id
            ):
                raise SessionConflictError(
                    "verification 必须匹配当前 proposal/revision/final approval"
                )
            approval_path = path / "approvals" / f"{approval_id}.json"
            approval = normalize_approval(
                self._read_json(approval_path, "final approval")
            )
            if approval["finalizedAt"] is None:
                raise SessionConflictError("verification approval 尚未 finalize")

            _validate_acceptance_coverage(evidence, task)
            self._reject_embedded_capabilities(
                state,
                canonical_bytes(evidence),
                label="verification evidence",
            )
            artifacts = evidence["artifacts"]
            if len(artifacts) > MAX_EVIDENCE_FILES:
                raise SessionStoreError("verification evidence 文件数量超限")
            source_payloads: list[tuple[dict[str, Any], Path, bytes]] = []
            total = 0
            for item in artifacts:
                source = Path(item["sourcePath"]).expanduser().resolve()
                suffix = source.suffix.lower()
                if suffix not in EVIDENCE_SUFFIXES or not source.is_file():
                    raise SessionStoreError(
                        "evidence 只允许现有 PNG/JPG/JPEG/WEBP/JSON/TXT 文件"
                    )
                payload = source.read_bytes()
                if len(payload) < 1 or len(payload) > MAX_EVIDENCE_FILE_BYTES:
                    raise SessionStoreError("单个 evidence 文件大小超限")
                if item["kind"] == "screenshot" and not _has_image_magic(
                    suffix, payload
                ):
                    raise SessionStoreError(
                        "screenshot 必须是 magic 匹配的 PNG/JPG/JPEG/WEBP 文件"
                    )
                total += len(payload)
                if total > MAX_EVIDENCE_TOTAL_BYTES:
                    raise SessionStoreError("verification evidence 总大小超限")
                if suffix in {".json", ".txt"}:
                    self._reject_embedded_capabilities(
                        state,
                        payload,
                        label=f"evidence {source.name}",
                    )
                source_payloads.append((item, source, payload))

            _validate_final_delivery_evidence(evidence, task, source_payloads)

            receipt_id = f"vrf_{secrets.token_hex(12)}"
            staging = path / "evidence" / f".{receipt_id}.{uuid.uuid4().hex}.staging"
            target = path / "evidence" / receipt_id
            staging.mkdir()
            stored_artifacts: list[dict[str, Any]] = []
            file_hashes: dict[str, str] = {}
            try:
                for index, (item, source, payload) in enumerate(source_payloads, 1):
                    file_name = self._evidence_file_name(
                        index,
                        item["label"],
                        source.suffix.lower(),
                    )
                    _atomic_bytes(staging / file_name, payload)
                    digest = _bytes_hash(payload)
                    file_hashes[file_name] = digest
                    stored = {
                        "kind": item["kind"],
                        "label": item["label"],
                        "fileName": file_name,
                        "sha256": digest,
                        "size": len(payload),
                    }
                    if "viewport" in item:
                        stored["viewport"] = item["viewport"]
                    stored_artifacts.append(stored)
                receipt = {
                    "schemaVersion": 1,
                    "receiptId": receipt_id,
                    "sessionId": session_id,
                    "proposalId": evidence["proposalId"],
                    "revision": evidence["revision"],
                    "approvalId": evidence["approvalId"],
                    "result": evidence["result"],
                    "summary": evidence["summary"],
                    "checks": evidence["checks"],
                    "acceptanceCoverage": evidence["acceptanceCoverage"],
                    "artifacts": stored_artifacts,
                    "skillsUsed": evidence["skillsUsed"],
                    "recordedAt": utc_now(),
                }
                _atomic_json(staging / "receipt.json", receipt)
                os.replace(staging, target)
            except Exception:
                if staging.exists():
                    shutil.rmtree(staging)
                raise

            state["latestVerificationId"] = receipt_id
            if evidence["result"] == "pass":
                state["status"] = "verified"
            event = self._append_event(
                path,
                state,
                "verification_recorded",
                {
                    "receiptId": receipt_id,
                    "proposalId": evidence["proposalId"],
                    "revision": evidence["revision"],
                    "approvalId": evidence["approvalId"],
                    "result": evidence["result"],
                    "receiptHash": content_hash(receipt),
                    "fileHashes": file_hashes,
                },
            )
            self._save_state(path, state)
            return {
                "state": state,
                "event": event,
                "receipt": receipt,
            }

    def close(
        self,
        session_id: str,
        *,
        owner_id: str,
        writer_credential: str | None = None,
    ) -> dict[str, Any]:
        path = self._session_path(session_id)
        with _exclusive_lock(path / ".lock"):
            state, _, _ = self._load_verified_unlocked(path)
            self._require_writer(state, owner_id, writer_credential)
            if state["status"] == "closed":
                return {"state": state, "event": None, "alreadyClosed": True}
            if state["status"] != "verified":
                raise SessionConflictError("只有 verified Session 可以 close")
            state["status"] = "closed"
            state["closedAt"] = utc_now()
            event = self._append_event(
                path,
                state,
                "session_closed",
                {
                    "activeRevision": state["activeRevision"],
                    "finalizedAt": state["finalizedAt"],
                    "verificationId": state.get("latestVerificationId"),
                },
            )
            self._save_state(path, state)
            return {"state": state, "event": event, "alreadyClosed": False}

    def artifact_path(
        self,
        session_id: str,
        revision: int,
        option_id: str,
    ) -> Path:
        if not isinstance(revision, int) or revision < 1:
            raise SessionStoreError("artifact revision 无效")
        if OPTION_ID.fullmatch(option_id) is None:
            raise SessionStoreError("artifact optionId 无效")
        session_path = self._session_path(session_id)
        target = (
            session_path
            / "proposals"
            / str(revision)
            / option_id
            / "index.html"
        ).resolve()
        expected_parent = (
            session_path / "proposals" / str(revision) / option_id
        ).resolve()
        if target.parent != expected_parent:
            raise SessionStoreError("artifact path 越界")
        if not target.is_file():
            raise SessionNotFoundError("artifact 不存在")
        return target

    def evidence_path(
        self,
        session_id: str,
        receipt_id: str,
        file_name: str,
    ) -> Path:
        if RECEIPT_ID.fullmatch(receipt_id) is None:
            raise SessionStoreError("receiptId 格式无效")
        if EVIDENCE_FILE.fullmatch(file_name) is None:
            raise SessionStoreError("evidence filename 格式无效")
        session_path = self._session_path(session_id)
        receipt_dir = (session_path / "evidence" / receipt_id).resolve()
        expected_root = (session_path / "evidence").resolve()
        try:
            receipt_dir.relative_to(expected_root)
        except ValueError as error:
            raise SessionStoreError("evidence path 越界") from error
        receipt = self._read_json(receipt_dir / "receipt.json", "verification receipt")
        allowed = {
            item.get("fileName")
            for item in receipt.get("artifacts", [])
            if isinstance(item, dict)
        }
        if file_name not in allowed:
            raise SessionNotFoundError("evidence 文件不属于 receipt")
        target = (receipt_dir / file_name).resolve()
        if target.parent != receipt_dir or not target.is_file():
            raise SessionNotFoundError("evidence 文件不存在")
        return target
