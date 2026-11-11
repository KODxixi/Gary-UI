"""Contracts and canonical hashing for Gary-UI co-design sessions.

The runtime intentionally uses only the Python standard library.  The validator
implements the JSON Schema features used by the canonical Gary-UI contracts; it
does not pretend to be a general-purpose JSON Schema implementation.
"""

from __future__ import annotations

import copy
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "contracts"
CONTRACT_NAMES = {
    "task": "task.schema.json",
    "session": "session.schema.json",
    "proposal": "proposal.schema.json",
    "feedback": "feedback.schema.json",
    "evidence": "evidence.schema.json",
    "final-ui-report": "final-ui-report.schema.json",
    "build-report": "build-report.schema.json",
    "approval": "approval.schema.json",
    "command-result": "command-result.schema.json",
}


class SessionContractError(ValueError):
    """Raised when a co-design payload violates a canonical contract."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def content_hash(value: Any) -> str:
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def load_contract(name: str, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    try:
        filename = CONTRACT_NAMES[name]
    except KeyError as error:
        raise SessionContractError(f"未知 contract: {name}") from error
    try:
        value = json.loads((contracts_dir / filename).read_text(encoding="utf-8-sig"))
    except FileNotFoundError as error:
        raise SessionContractError(f"缺 contract: {filename}") from error
    except json.JSONDecodeError as error:
        raise SessionContractError(f"contract JSON 无效: {filename}: {error}") from error
    if not isinstance(value, dict):
        raise SessionContractError(f"contract 必须是 object: {filename}")
    return value


def _matches_type(value: Any, expected: str) -> bool:
    if expected == "null":
        return value is None
    if expected == "object":
        return isinstance(value, dict)
    if expected == "array":
        return isinstance(value, list)
    if expected == "string":
        return isinstance(value, str)
    if expected == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected == "boolean":
        return isinstance(value, bool)
    return False


def _resolve_ref(root: dict[str, Any], reference: str) -> dict[str, Any]:
    if not reference.startswith("#/"):
        raise SessionContractError(f"只支持本地 contract reference: {reference}")
    current: Any = root
    for segment in reference[2:].split("/"):
        segment = segment.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or segment not in current:
            raise SessionContractError(f"contract reference 无效: {reference}")
        current = current[segment]
    if not isinstance(current, dict):
        raise SessionContractError(f"contract reference 不是 object: {reference}")
    return current


def _validate(
    value: Any,
    schema: dict[str, Any],
    *,
    root: dict[str, Any],
    path: str,
) -> None:
    if "$ref" in schema:
        _validate(value, _resolve_ref(root, schema["$ref"]), root=root, path=path)
        return

    expected = schema.get("type")
    allowed_types = expected if isinstance(expected, list) else [expected]
    if expected is not None and not any(_matches_type(value, item) for item in allowed_types):
        readable = " | ".join(str(item) for item in allowed_types)
        raise SessionContractError(f"{path} 必须为 {readable}")

    if "const" in schema and value != schema["const"]:
        raise SessionContractError(f"{path} 必须为 {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        choices = ", ".join(repr(item) for item in schema["enum"])
        raise SessionContractError(f"{path} 必须为: {choices}")

    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            raise SessionContractError(f"{path} 长度不足")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            raise SessionContractError(f"{path} 超过 {schema['maxLength']} 字")
        if "pattern" in schema and re.fullmatch(schema["pattern"], value) is None:
            raise SessionContractError(f"{path} 格式无效")

    if isinstance(value, int) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            raise SessionContractError(f"{path} 不能小于 {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            raise SessionContractError(f"{path} 不能大于 {schema['maximum']}")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            raise SessionContractError(f"{path} 项目不足")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            raise SessionContractError(f"{path} 项目超过 {schema['maxItems']}")
        if schema.get("uniqueItems"):
            fingerprints = [canonical_bytes(item) for item in value]
            if len(fingerprints) != len(set(fingerprints)):
                raise SessionContractError(f"{path} 含重复项目")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                _validate(item, item_schema, root=root, path=f"{path}[{index}]")

    if isinstance(value, dict):
        properties = schema.get("properties", {})
        required = schema.get("required", [])
        missing = [name for name in required if name not in value]
        if missing:
            raise SessionContractError(f"{path} 缺字段: {', '.join(missing)}")
        if schema.get("additionalProperties") is False:
            extra = sorted(set(value) - set(properties))
            if extra:
                raise SessionContractError(f"{path} 含未知字段: {', '.join(extra)}")
        for name, item in value.items():
            item_schema = properties.get(name)
            if isinstance(item_schema, dict):
                _validate(item, item_schema, root=root, path=f"{path}.{name}")


def validate_contract(
    name: str,
    raw: Any,
    *,
    contracts_dir: Path = CONTRACTS,
) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise SessionContractError(f"{name} 必须是 JSON object")
    schema = load_contract(name, contracts_dir=contracts_dir)
    if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
        raise SessionContractError(f"{name} contract 必须使用 Draft 2020-12")
    _validate(raw, schema, root=schema, path=name)
    return copy.deepcopy(raw)


def normalize_task(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    task = validate_contract("task", raw, contracts_dir=contracts_dir)
    unit_ids = [item["id"] for item in task["units"]]
    if len(unit_ids) != len(set(unit_ids)):
        raise SessionContractError("task.units id 必须唯一")

    acceptance = task["acceptance"]
    acceptance_requirement_count = (
        len(acceptance["viewports"])
        + int(acceptance["keyboard"])
        + int(acceptance["browser"])
        + len(acceptance["visual"])
        + len(acceptance["technical"])
        + sum(len(unit["acceptance"]) for unit in task["units"])
    )
    if acceptance_requirement_count > 200:
        raise SessionContractError(
            "task acceptance requirements 不能超过 200，"
            f"当前为 {acceptance_requirement_count}"
        )
    return task


def normalize_session(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    return validate_contract("session", raw, contracts_dir=contracts_dir)


def normalize_proposal(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    proposal = validate_contract("proposal", raw, contracts_dir=contracts_dir)
    options = proposal["options"]
    option_ids = [item["optionId"] for item in options]
    if len(option_ids) != len(set(option_ids)):
        raise SessionContractError("proposal.options optionId 必须唯一")

    proposal.setdefault("lockedDecisions", [])
    locked_keys = [item["key"] for item in proposal["lockedDecisions"]]
    if len(locked_keys) != len(set(locked_keys)):
        raise SessionContractError("proposal.lockedDecisions key 必须唯一")

    recommendation = proposal["recommendation"]["optionId"]
    if recommendation not in option_ids:
        raise SessionContractError("proposal.recommendation.optionId 不存在")
    recommended = [item for item in options if item["kind"] == "recommended"]
    if len(recommended) != 1 or recommended[0]["optionId"] != recommendation:
        raise SessionContractError(
            "proposal 必须且只能有一个匹配 recommendation 的 recommended 方案"
        )

    mode = proposal["mode"]
    if mode == "quick":
        if len(options) != 1 or options[0]["kind"] != "recommended":
            raise SessionContractError(
                "quick proposal 必须恰有一个 recommended 方案"
            )
    elif mode in {"compare", "deep-review"}:
        if len(options) != 3:
            raise SessionContractError(f"{mode} proposal 必须恰有三个方案")
        kinds = [item["kind"] for item in options]
        required_kinds = {"recommended", "alternative", "stretch"}
        if set(kinds) != required_kinds or len(kinds) != len(required_kinds):
            raise SessionContractError(
                f"{mode} proposal 必须各有一个 recommended、alternative、stretch 方案"
            )
    return proposal


def normalize_feedback(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    feedback = validate_contract("feedback", raw, contracts_dir=contracts_dir)
    if feedback["action"] == "approve" and not feedback["selectedOptionId"]:
        raise SessionContractError("approve feedback 必须选择方案")
    return feedback


def normalize_evidence(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    evidence = validate_contract("evidence", raw, contracts_dir=contracts_dir)

    check_ids = [item["id"] for item in evidence["checks"]]
    if len(check_ids) != len(set(check_ids)):
        raise SessionContractError("evidence.checks check id 必须唯一")

    coverage_ids = [item["requirementId"] for item in evidence["acceptanceCoverage"]]
    if len(coverage_ids) != len(set(coverage_ids)):
        raise SessionContractError(
            "evidence.acceptanceCoverage requirementId 必须唯一"
        )

    artifact_labels = [item["label"] for item in evidence["artifacts"]]
    if len(artifact_labels) != len(set(artifact_labels)):
        raise SessionContractError("evidence.artifacts label 必须唯一")

    if evidence["result"] == "pass" and any(
        item["status"] != "pass" for item in evidence["checks"]
    ):
        raise SessionContractError("pass evidence 必须全部 checks 为 pass")
    return evidence


def normalize_final_ui_report(
    raw: Any,
    *,
    contracts_dir: Path = CONTRACTS,
) -> dict[str, Any]:
    return validate_contract("final-ui-report", raw, contracts_dir=contracts_dir)


def normalize_build_report(
    raw: Any,
    *,
    contracts_dir: Path = CONTRACTS,
) -> dict[str, Any]:
    return validate_contract("build-report", raw, contracts_dir=contracts_dir)


def normalize_approval(raw: Any, *, contracts_dir: Path = CONTRACTS) -> dict[str, Any]:
    return validate_contract("approval", raw, contracts_dir=contracts_dir)


def normalize_command_result(
    raw: Any,
    *,
    contracts_dir: Path = CONTRACTS,
) -> dict[str, Any]:
    return validate_contract("command-result", raw, contracts_dir=contracts_dir)


