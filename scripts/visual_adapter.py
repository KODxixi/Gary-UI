"""Safe bridge between the Gary-UI CLI and the local visual toolchain."""

from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
VISUAL_ROOT = ROOT / "adapters" / "visual"
SOURCE_RUNNER = VISUAL_ROOT / "runner.mjs"
BUNDLED_RUNNER = VISUAL_ROOT / "runtime" / "runner.cjs"

DEFAULT_TOOLS = {
    "architecture": "archify",
    "workflow": "archify",
    "sequence": "archify",
    "data-flow": "archify",
    "lifecycle": "archify",
    "quantitative": "echarts",
    "outline": "markmap",
    "infographic": "antv-infographic",
    "simple-flow": "mermaid",
    "icons": "lucide",
}

TOOL_SUFFIXES = {
    "archify": {".json"},
    "echarts": {".json"},
    "markmap": {".md", ".markdown"},
    "antv-infographic": {".json"},
    "mermaid": {".mmd", ".mermaid", ".md"},
    "lucide": {".json"},
}

TOOL_PURPOSES = {
    "archify": {"architecture", "workflow", "sequence", "data-flow", "lifecycle"},
    "echarts": {"quantitative"},
    "markmap": {"outline"},
    "antv-infographic": {"infographic"},
    "mermaid": {"simple-flow"},
    "lucide": {"icons"},
}

SCENES = {"reading", "analysis", "showcase"}
THEMES = {"dark", "light"}
FORMATS = {"html", "svg", "png", "pdf"}


class VisualContractError(RuntimeError):
    """Raised when a visual manifest or toolchain result is invalid."""


def choose_default_tool(purpose: str, *, source_suffix: str | None = None) -> str:
    try:
        tool = DEFAULT_TOOLS[purpose]
    except KeyError as error:
        raise VisualContractError(f"Unsupported visual purpose: {purpose}") from error
    if source_suffix and source_suffix.lower() not in TOOL_SUFFIXES[tool]:
        raise VisualContractError(
            f"Source suffix {source_suffix} is not supported by {tool} for {purpose}"
        )
    return tool


def _safe_relative(raw: object, *, field: str) -> Path:
    if not isinstance(raw, str) or not raw.strip():
        raise VisualContractError(f"{field} must be a non-empty relative path")
    parsed = urlsplit(raw)
    candidate = Path(raw)
    if parsed.scheme or parsed.netloc or candidate.is_absolute() or ".." in candidate.parts:
        raise VisualContractError(f"{field} must stay inside the manifest directory")
    return candidate


def _require_string(value: object, *, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise VisualContractError(f"{field} must be a non-empty string")
    return value


def validate_visual_manifest(payload: object, manifest_path: Path) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise VisualContractError("Visual manifest root must be an object")
    if payload.get("schemaVersion") != 1:
        raise VisualContractError("Visual manifest schemaVersion must be 1")
    project = _require_string(payload.get("project"), field="project")
    root = manifest_path.resolve().parent
    output_relative = _safe_relative(payload.get("outputRoot"), field="outputRoot")
    output_root = (root / output_relative).resolve()
    try:
        output_root.relative_to(root)
    except ValueError as error:
        raise VisualContractError("outputRoot escapes the manifest directory") from error

    raw_visuals = payload.get("visuals")
    if not isinstance(raw_visuals, list) or not raw_visuals:
        raise VisualContractError("visuals must be a non-empty array")

    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, raw_visual in enumerate(raw_visuals):
        if not isinstance(raw_visual, dict):
            raise VisualContractError(f"visuals[{index}] must be an object")
        visual_id = _require_string(raw_visual.get("id"), field=f"visuals[{index}].id")
        if not visual_id.replace("-", "").isalnum() or visual_id != visual_id.lower():
            raise VisualContractError(f"Invalid visual id: {visual_id}")
        if visual_id in seen:
            raise VisualContractError(f"Duplicate visual id: {visual_id}")
        seen.add(visual_id)

        purpose = _require_string(
            raw_visual.get("purpose"), field=f"visuals[{index}].purpose"
        )
        tool = raw_visual.get("tool") or choose_default_tool(purpose)
        if tool not in TOOL_PURPOSES or purpose not in TOOL_PURPOSES[tool]:
            raise VisualContractError(
                f"Tool {tool} is not the deterministic route for purpose {purpose}"
            )
        source_relative = _safe_relative(
            raw_visual.get("source"), field=f"visuals[{index}].source"
        )
        suffix = source_relative.suffix.lower()
        if suffix not in TOOL_SUFFIXES[tool]:
            raise VisualContractError(f"Source type {suffix or '<none>'} is invalid for {tool}")
        source_path = (root / source_relative).resolve()
        try:
            source_path.relative_to(root)
        except ValueError as error:
            raise VisualContractError(f"Source escapes manifest root: {source_relative}") from error
        if not source_path.is_file():
            raise VisualContractError(f"Source file does not exist: {source_relative}")

        scene = raw_visual.get("scene")
        theme = raw_visual.get("theme")
        formats = raw_visual.get("formats")
        if scene not in SCENES:
            raise VisualContractError(f"Invalid scene for {visual_id}: {scene}")
        if theme not in THEMES:
            raise VisualContractError(f"Invalid theme for {visual_id}: {theme}")
        if (
            not isinstance(formats, list)
            or not formats
            or any(item not in FORMATS for item in formats)
        ):
            raise VisualContractError(f"Invalid formats for {visual_id}")
        citation = raw_visual.get("citation")
        if not isinstance(citation, dict) or not citation.get("label"):
            raise VisualContractError(f"Citation is required for {visual_id}")

        normalized.append({**raw_visual, "sourcePath": source_path})

    return {
        **payload,
        "project": project,
        "manifestPath": manifest_path.resolve(),
        "outputRoot": output_root,
        "visuals": normalized,
    }


def load_visual_manifest(path: Path) -> dict[str, Any]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
    except FileNotFoundError as error:
        raise VisualContractError(f"Manifest file does not exist: {path}") from error
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise VisualContractError(f"Manifest must be valid UTF-8 JSON: {path}") from error
    return validate_visual_manifest(payload, path)


def promote_candidate(candidate: Path, target: Path) -> None:
    if not candidate.is_file() or candidate.stat().st_size == 0:
        raise VisualContractError(f"Verified candidate is missing or empty: {candidate}")
    target.parent.mkdir(parents=True, exist_ok=True)
    os.replace(candidate, target)


def run_visual_command(
    action: str,
    *,
    manifest: Path | None = None,
    visual_id: str | None = None,
    output_format: str | None = None,
) -> tuple[int, dict[str, Any]]:
    runner = BUNDLED_RUNNER if BUNDLED_RUNNER.is_file() else SOURCE_RUNNER
    if not runner.is_file():
        raise VisualContractError(f"Visual runner is missing: {runner}")
    command = ["node", str(runner), action, "--json"]
    if manifest is not None:
        load_visual_manifest(manifest)
        command.extend(["--manifest", str(manifest.resolve())])
    if visual_id:
        command.extend(["--id", visual_id])
    if output_format:
        if output_format not in FORMATS:
            raise VisualContractError(f"Unsupported export format: {output_format}")
        command.extend(["--format", output_format])
    environment = dict(os.environ)
    environment["ARCHIFY_UPDATE_CHECK_DISABLED"] = "1"
    completed = subprocess.run(
        command,
        cwd=ROOT,
        env=environment,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    stdout = completed.stdout.strip()
    try:
        payload = json.loads(stdout) if stdout else {}
    except json.JSONDecodeError as error:
        raise VisualContractError(
            f"Visual runner returned invalid JSON: {stdout[:240]}"
        ) from error
    if completed.stderr.strip():
        payload.setdefault("warnings", []).append(completed.stderr.strip())
    return completed.returncode, payload
