#!/usr/bin/env python3
"""Validate one normalized Gary-UI Agent invocation without third-party packages."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_PATH = ROOT / "contracts" / "invocation.schema.json"


class InvocationContractError(ValueError):
    """Raised when an invocation does not satisfy the canonical schema."""


def load_schema(path: Path = SCHEMA_PATH) -> dict[str, Any]:
    schema = json.loads(path.read_text(encoding="utf-8-sig"))
    if not isinstance(schema, dict):
        raise InvocationContractError("invocation schema 必须是 JSON object")
    return schema


def validate_schema(schema: dict[str, Any]) -> None:
    if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
        raise InvocationContractError("invocation schema 必须使用 JSON Schema Draft 2020-12")
    if schema.get("type") != "object":
        raise InvocationContractError("invocation schema type 必须为 object")
    if schema.get("additionalProperties") is not False:
        raise InvocationContractError("invocation schema 必须禁止未知字段")

    properties = schema.get("properties")
    required = schema.get("required")
    if not isinstance(properties, dict) or not isinstance(required, list):
        raise InvocationContractError("invocation schema 缺 properties 或 required")
    if set(required) != set(properties):
        raise InvocationContractError("invocation schema 的全部字段都必须 required")

    for name in required:
        specification = properties.get(name)
        if not isinstance(specification, dict):
            raise InvocationContractError(f"invocation schema 字段无定义: {name}")
        if "const" not in specification and not specification.get("enum"):
            raise InvocationContractError(f"invocation schema 字段缺 const/enum: {name}")


def normalize_invocation(
    raw: Any,
    *,
    schema: dict[str, Any] | None = None,
) -> dict[str, Any]:
    schema = schema or load_schema()
    validate_schema(schema)
    if not isinstance(raw, dict):
        raise InvocationContractError("invocation 必须是 JSON object")

    properties = schema["properties"]
    required = schema["required"]
    missing = [name for name in required if name not in raw]
    extra = sorted(set(raw) - set(properties))
    if missing:
        raise InvocationContractError(f"invocation 缺字段: {', '.join(missing)}")
    if extra:
        raise InvocationContractError(f"invocation 含未知字段: {', '.join(extra)}")

    normalized: dict[str, Any] = {}
    for name in required:
        value = raw[name]
        specification = properties[name]
        expected_type = specification.get("type")
        if expected_type == "integer" and (not isinstance(value, int) or isinstance(value, bool)):
            raise InvocationContractError(f"{name} 必须是整数")
        if expected_type == "string" and not isinstance(value, str):
            raise InvocationContractError(f"{name} 必须是字符串")
        if "const" in specification and value != specification["const"]:
            raise InvocationContractError(f"{name} 必须为 {specification['const']}")
        if "enum" in specification and value not in specification["enum"]:
            choices = ", ".join(str(item) for item in specification["enum"])
            raise InvocationContractError(f"{name} 必须为: {choices}")
        normalized[name] = value
    return normalized


def invocation_from_axes(
    application: str,
    page: str,
    *,
    theme: str | None = None,
    material: str | None = None,
    density: str | None = None,
    system_path: Path | None = None,
    schema: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the smallest runnable route, filling only formal system defaults."""
    if system_path is None:
        system_path = ROOT / "spec" / "system.json"
    system = json.loads(system_path.read_text(encoding="utf-8-sig"))
    defaults = system.get("visualAxes", {}).get("defaults", {})
    raw = {
        "schemaVersion": 1,
        "skill": "gary-liquidglass-ui",
        "application": application,
        "page": page,
        "theme": theme if theme is not None else defaults.get("theme"),
        "material": material if material is not None else defaults.get("material"),
        "density": density if density is not None else defaults.get("density"),
    }
    return normalize_invocation(raw, schema=schema)


def payload_from_args(args: argparse.Namespace) -> dict[str, Any]:
    axes = ("application", "page", "theme", "material", "density")
    if args.file:
        if any(getattr(args, axis) is not None for axis in axes):
            raise InvocationContractError("--file 不能与调用轴参数同时使用")
        return json.loads(args.file.read_text(encoding="utf-8-sig"))

    missing = [axis for axis in axes if getattr(args, axis) is None]
    if missing:
        raise InvocationContractError(f"缺调用参数: {', '.join(missing)}")
    return {
        "schemaVersion": 1,
        "skill": "gary-liquidglass-ui",
        **{axis: getattr(args, axis) for axis in axes},
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="校验一次 Gary-UI Agent 调用。",
    )
    parser.add_argument("--file", type=Path, help="待校验的 invocation JSON 文件。")
    parser.add_argument("--application")
    parser.add_argument("--page")
    parser.add_argument("--theme")
    parser.add_argument("--material")
    parser.add_argument("--density")
    return parser.parse_args()


def main() -> int:
    try:
        invocation = normalize_invocation(payload_from_args(parse_args()))
    except (InvocationContractError, OSError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "fail", "error": str(error)}, ensure_ascii=False, indent=2))
        return 1
    print(
        json.dumps(
            {"status": "pass", "invocation": invocation},
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
