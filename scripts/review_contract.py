"""Shared validation for the Gary-UI collaborative review bridge."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any


DECISION_SCHEMA_VERSION = 3
BRIDGE_SCHEMA_VERSION = 1
SYSTEM_NAME = "Gary-UI"
DEFAULT_BACKGROUND = None
MAX_NOTES_LENGTH = 280

DECISION_KEYS = {
    "schemaVersion",
    "system",
    "defaultBackground",
    "backgroundCustomizable",
    "defaultTheme",
    "defaultMaterial",
    "defaultDensity",
    "reactAdapterStrategy",
    "distributionScope",
    "syncAuditCadence",
    "notes",
    "status",
}

ENUMS = {
    "defaultTheme": {"dark", "light"},
    "defaultMaterial": {"ultrathin", "regular", "thick", "solid-plate"},
    "defaultDensity": {"spacious", "balanced", "compact"},
    "reactAdapterStrategy": {"demand-driven", "full-coverage"},
    "distributionScope": {"internal", "public"},
    "syncAuditCadence": {"weekly", "monthly"},
}


class ReviewContractError(ValueError):
    """Raised when a review payload does not satisfy the fixed contract."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def normalize_decision(raw: Any, *, require_ready: bool = True) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ReviewContractError("decision 必须是 JSON object")

    missing = sorted(DECISION_KEYS - set(raw))
    extra = sorted(set(raw) - DECISION_KEYS)
    if missing:
        raise ReviewContractError(f"decision 缺字段: {', '.join(missing)}")
    if extra:
        raise ReviewContractError(f"decision 含未知字段: {', '.join(extra)}")

    if raw["schemaVersion"] != DECISION_SCHEMA_VERSION:
        raise ReviewContractError(f"schemaVersion 必须为 {DECISION_SCHEMA_VERSION}")
    if raw["system"] != SYSTEM_NAME:
        raise ReviewContractError(f"system 必须为 {SYSTEM_NAME}")
    if raw["defaultBackground"] != DEFAULT_BACKGROUND:
        raise ReviewContractError("defaultBackground 与母本不一致")
    if raw["backgroundCustomizable"] is not True:
        raise ReviewContractError("backgroundCustomizable 必须为 true")

    normalized: dict[str, Any] = {
        "schemaVersion": DECISION_SCHEMA_VERSION,
        "system": SYSTEM_NAME,
        "defaultBackground": DEFAULT_BACKGROUND,
        "backgroundCustomizable": True,
    }
    for field, allowed in ENUMS.items():
        value = raw[field]
        if value not in allowed:
            choices = ", ".join(sorted(allowed))
            raise ReviewContractError(f"{field} 必须为: {choices}")
        normalized[field] = value

    notes = raw["notes"]
    if not isinstance(notes, str):
        raise ReviewContractError("notes 必须是字符串")
    if len(notes) > MAX_NOTES_LENGTH:
        raise ReviewContractError(f"notes 不能超过 {MAX_NOTES_LENGTH} 字")
    normalized["notes"] = notes

    status = raw["status"]
    if status not in {"draft", "ready"}:
        raise ReviewContractError("status 必须为 draft 或 ready")
    if require_ready and status != "ready":
        raise ReviewContractError("只有 ready 决定可以交接")
    normalized["status"] = status
    return normalized


def decision_id(decision: dict[str, Any]) -> str:
    canonical = json.dumps(
        decision,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()[:16]


def new_envelope(decision: dict[str, Any]) -> dict[str, Any]:
    return {
        "bridgeSchemaVersion": BRIDGE_SCHEMA_VERSION,
        "decisionId": decision_id(decision),
        "handoffStatus": "pending",
        "savedAt": utc_now(),
        "appliedAt": None,
        "appliedFiles": [],
        "decision": decision,
    }
