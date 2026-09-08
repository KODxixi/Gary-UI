"""Apply one validated Gary-UI review handoff to the canonical metadata."""

from __future__ import annotations

import argparse
import json
import os
import tempfile
from pathlib import Path

from review_contract import ReviewContractError, normalize_decision, utc_now


ROOT = Path(__file__).resolve().parents[1]
REVIEW_FILE = ROOT / "decisions" / "review-latest.json"
METADATA_FILE = ROOT / "metadata.json"
TOKENS_FILE = ROOT / "tokens" / "tokens.json"


def write_json_atomic(path: Path, payload: dict) -> None:
    encoded = (json.dumps(payload, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    with tempfile.NamedTemporaryFile(
        mode="wb",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as handle:
        temporary = Path(handle.name)
        handle.write(encoded)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temporary, path)


def apply_review(root: Path = ROOT, *, dry_run: bool = False) -> dict:
    review_file = root / "decisions" / "review-latest.json"
    metadata_file = root / "metadata.json"
    tokens_file = root / "tokens" / "tokens.json"

    try:
        envelope = json.loads(review_file.read_text(encoding="utf-8"))
        metadata = json.loads(metadata_file.read_text(encoding="utf-8"))
        tokens = json.loads(tokens_file.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ReviewContractError(f"缺少文件: {error.filename}") from error
    except json.JSONDecodeError as error:
        raise ReviewContractError(f"JSON 无效: {error}") from error

    if envelope.get("bridgeSchemaVersion") != 1:
        raise ReviewContractError("bridgeSchemaVersion 必须为 1")
    if envelope.get("handoffStatus") not in {"pending", "applied"}:
        raise ReviewContractError("handoffStatus 必须为 pending 或 applied")

    decision = normalize_decision(envelope.get("decision"), require_ready=True)
    if envelope["handoffStatus"] == "applied":
        return {
            "decisionId": envelope.get("decisionId"),
            "handoffStatus": "applied",
            "appliedFiles": envelope.get("appliedFiles", []),
            "dryRun": dry_run,
            "alreadyApplied": True,
        }

    strategy = decision["reactAdapterStrategy"]
    scope = decision["distributionScope"]
    if strategy == "full-coverage" and metadata.get("reactAdapterCoverage") != "15/15-full-coverage":
        raise ReviewContractError("选择 full-coverage 前必须先完成 15/15 React 包装")
    if scope == "public" and not (root / "LICENSE").exists():
        raise ReviewContractError("选择 public 前必须补齐公开许可证与背景授权")

    material = decision["defaultMaterial"]
    metadata.update(
        {
            "defaultTheme": decision["defaultTheme"],
            "defaultMaterial": material,
            "defaultDensity": decision["defaultDensity"],
            "defaultScene": "dot-grid",
            "defaultSceneImplementation": "assets/scenes/dot-grid.js",
            "defaultBackground": decision["defaultBackground"],
            "defaultBackgroundRole": "custom-only; default themes use pure color plus dot-grid",
            "reactAdapterStrategy": strategy,
            "distributionScope": scope,
            "syncAuditCadence": decision["syncAuditCadence"],
            "syncAuditStrategy": (
                "single-heartbeat-weekly-with-first-monday-governance"
                if decision["syncAuditCadence"] == "weekly"
                else "single-heartbeat-monthly-combined"
            ),
            "reviewDecisionStatus": "confirmed",
            "reviewDecisionId": envelope.get("decisionId"),
            "reviewAppliedAt": utc_now(),
        }
    )
    tokens["defaultMode"] = decision["defaultTheme"]

    envelope["handoffStatus"] = "applied"
    envelope["appliedAt"] = metadata["reviewAppliedAt"]
    envelope["appliedFiles"] = ["metadata.json", "tokens/tokens.json"]

    result = {
        "decisionId": envelope.get("decisionId"),
        "handoffStatus": envelope["handoffStatus"],
        "appliedFiles": envelope["appliedFiles"],
        "dryRun": dry_run,
    }
    if not dry_run:
        write_json_atomic(tokens_file, tokens)
        write_json_atomic(metadata_file, metadata)
        write_json_atomic(review_file, envelope)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        result = apply_review(dry_run=args.dry_run)
    except ReviewContractError as error:
        raise SystemExit(f"review apply failed: {error}") from error
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
