"""Build, compare, and sync the manifest-selected Gary-UI Agent runtime."""

from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "runtime" / "manifest.json"


class ProjectionError(RuntimeError):
    """Raised when a runtime projection operation is unsafe or invalid."""


def read_manifest() -> dict:
    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8-sig"))
    except (OSError, json.JSONDecodeError) as error:
        raise ProjectionError(f"runtime manifest 无效: {error}") from error
    if not isinstance(manifest, dict):
        raise ProjectionError("runtime manifest 根必须为 object")
    return manifest


def posix_relative(path: Path, root: Path = ROOT) -> str:
    return path.relative_to(root).as_posix()


def matches(relative: str, pattern: str) -> bool:
    if not any(character in pattern for character in "*?["):
        return relative == pattern
    if fnmatch.fnmatchcase(relative, pattern):
        return True
    if "/**/" in pattern:
        compact = pattern.replace("/**/", "/")
        return fnmatch.fnmatchcase(relative, compact)
    if pattern.endswith("/**"):
        prefix = pattern[:-3].rstrip("/")
        return relative == prefix or relative.startswith(prefix + "/")
    return False


def expand_selected(manifest: dict) -> dict[str, Path]:
    include = manifest.get("include")
    exclude = manifest.get("exclude")
    if not isinstance(include, list) or not all(isinstance(item, str) for item in include):
        raise ProjectionError("runtime manifest include 必须为 string array")
    if not isinstance(exclude, list) or not all(isinstance(item, str) for item in exclude):
        raise ProjectionError("runtime manifest exclude 必须为 string array")

    try:
        listed = subprocess.run(
            ["git", "-C", str(ROOT), "ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", "."],
            capture_output=True,
            check=True,
        ).stdout.split(b"\0")
    except (OSError, subprocess.CalledProcessError) as error:
        raise ProjectionError(f"无法读取受控源码清单: {error}") from error
    candidates = {Path(item.decode("utf-8")) for item in listed if item}
    generated = manifest.get("generatedFiles", [])
    if not isinstance(generated, list) or not all(isinstance(item, str) for item in generated):
        raise ProjectionError("runtime manifest generatedFiles 必须为 string array")
    candidates.update(Path(item) for item in generated)

    selected: dict[str, Path] = {}
    for relative_path in sorted(candidates):
        path = ROOT / relative_path
        if not path.is_file():
            continue
        relative = relative_path.as_posix()
        if any(matches(relative, pattern) for pattern in include):
            if not any(matches(relative, pattern) for pattern in exclude):
                selected[relative] = path

    missing_literals = []
    for pattern in include:
        if not any(character in pattern for character in "*?["):
            path = ROOT / pattern
            if not path.is_file():
                missing_literals.append(pattern)
    if missing_literals:
        raise ProjectionError(f"manifest 缺字面源文件: {', '.join(missing_literals)}")
    if not selected:
        raise ProjectionError("runtime manifest 没有选择任何文件")
    return dict(sorted(selected.items()))


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def projected_bytes(relative: str, source: Path) -> bytes:
    if relative == "patterns/shared/background-lab.js":
        from build_public import public_text

        return public_text(
            Path(relative), source.read_text(encoding="utf-8")
        ).encode("utf-8")
    return source.read_bytes()


def projected_hash(relative: str, source: Path) -> str:
    return hashlib.sha256(projected_bytes(relative, source)).hexdigest()


def projection_hash(manifest: dict, selected: dict[str, Path]) -> str:
    payload = {
        "manifest": manifest,
        "files": {
            relative: projected_hash(relative, path)
            for relative, path in selected.items()
        },
    }
    encoded = json.dumps(
        payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def resolve_target(manifest: dict, override: str | None) -> Path:
    raw = override or manifest.get("targetRoot")
    if not isinstance(raw, str) or not raw:
        raise ProjectionError("runtime targetRoot 缺失")
    target = Path(raw).expanduser().resolve()
    canonical = ROOT.resolve()
    if target == canonical or canonical in target.parents or target in canonical.parents:
        raise ProjectionError("runtime 目标不能与母本重叠")
    return target


def retired_runtime_paths(manifest: dict, target: Path) -> dict[str, Path]:
    raw = manifest.get("retireRuntimeFiles", [])
    if not isinstance(raw, list) or not all(isinstance(item, str) for item in raw):
        raise ProjectionError("runtime manifest retireRuntimeFiles 必须为 string array")
    resolved: dict[str, Path] = {}
    root = target.resolve()
    for relative in raw:
        normalized = relative.replace("\\", "/")
        if (
            not normalized
            or normalized.startswith("/")
            or any(character in normalized for character in "*?[")
            or ".." in Path(normalized).parts
            or Path(normalized).is_absolute()
        ):
            raise ProjectionError(f"retireRuntimeFiles 只允许精确的目标内相对文件: {relative}")
        destination = (root / Path(normalized)).resolve()
        if destination == root or root not in destination.parents:
            raise ProjectionError(f"retireRuntimeFiles 越出 runtime: {relative}")
        resolved[normalized] = destination
    return resolved


def remove_retired_runtime_files(manifest: dict, target: Path) -> dict[str, list[str]]:
    removed: list[str] = []
    missing: list[str] = []
    for relative, destination in retired_runtime_paths(manifest, target).items():
        if not destination.exists():
            missing.append(relative)
            continue
        if not destination.is_file():
            raise ProjectionError(f"retireRuntimeFiles 目标不是普通文件: {relative}")
        destination.unlink()
        removed.append(relative)
    return {"removed": sorted(removed), "alreadyAbsent": sorted(missing)}


def compare(selected: dict[str, Path], target: Path, manifest: dict | None = None) -> dict:
    missing: list[str] = []
    mismatch: list[str] = []
    expected = set(selected)

    for relative, source in selected.items():
        destination = target / Path(relative)
        if not destination.is_file():
            missing.append(relative)
        elif projected_hash(relative, source) != file_hash(destination):
            mismatch.append(relative)

    actual = {
        path.relative_to(target).as_posix()
        for path in target.rglob("*")
        if path.is_file()
    } if target.is_dir() else set()
    runtime_only = sorted(actual - expected)
    retired_present = sorted(
        relative
        for relative, destination in retired_runtime_paths(manifest or {}, target).items()
        if destination.is_file()
    )
    return {
        "selectedFiles": len(selected),
        "missing": sorted(missing),
        "hashMismatch": sorted(mismatch),
        "runtimeOnly": runtime_only,
        "retiredPresent": retired_present,
    }


def copy_projection(selected: dict[str, Path], destination: Path) -> int:
    copied = 0
    destination.mkdir(parents=True, exist_ok=True)
    for relative, source in selected.items():
        target = destination / Path(relative)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(projected_bytes(relative, source))
        copied += 1
    return copied


def result(command: str, status: str, **values: object) -> dict:
    return {
        "command": command,
        "status": status,
        "systemVersion": "2.0.0",
        **values,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--runtime", help="仅测试或显式替代目标；不得与母本重叠")
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("check", help="只读比较 manifest 投影与 runtime")
    build = subparsers.add_parser("build", help="构建 manifest 投影到显式 staging 目录")
    build.add_argument("--staging", required=True)
    sync = subparsers.add_parser("sync", help="复制 manifest 选中的文件，仅删除 manifest 精确声明的退役文件")
    sync.add_argument("--confirm", required=True, metavar="PROJECTION_HASH")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        manifest = read_manifest()
        selected = expand_selected(manifest)
        digest = projection_hash(manifest, selected)

        if args.command == "build":
            staging = Path(args.staging).expanduser().resolve()
            if staging == ROOT.resolve() or ROOT.resolve() in staging.parents:
                raise ProjectionError("staging 不能位于 Gary-UI 母本内")
            copied = copy_projection(selected, staging)
            payload = result(
                "runtime.build",
                "pass",
                projectionHash=digest,
                selectedFiles=len(selected),
                copiedFiles=copied,
                staging=str(staging),
            )
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0

        target = resolve_target(manifest, args.runtime)
        if args.command == "sync":
            if args.confirm != digest:
                raise ProjectionError("projectionHash 已变化；重新运行 check 后再确认")
            copied = copy_projection(selected, target)
            retired = remove_retired_runtime_files(manifest, target)
            comparison = compare(selected, target, manifest)
            status = "drift" if (
                comparison["missing"] or comparison["hashMismatch"] or comparison["retiredPresent"]
            ) else "pass"
            payload = result(
                "runtime.sync",
                status,
                projectionHash=digest,
                target=str(target),
                copiedFiles=copied,
                retiredRuntimeFiles=retired,
                comparison=comparison,
                warnings=(
                    ["runtime-only 不会自动删除或归档"]
                    if comparison["runtimeOnly"]
                    else []
                ),
            )
            print(json.dumps(payload, ensure_ascii=False, indent=2))
            return 0 if status == "pass" else 1

        comparison = compare(selected, target, manifest)
        # runtimeOnly 只降级为 warning：runtime 副本可能合法地含 manifest 未收录的
        # 文件（旧部署遗留、消费方本地文件），不作为 drift 判据；missing 与
        # hashMismatch 仍保持失败语义。
        status = "drift" if (
            comparison["missing"] or comparison["hashMismatch"] or comparison["retiredPresent"]
        ) else "pass"
        payload = result(
            "runtime.check",
            status,
            projectionHash=digest,
            target=str(target),
            comparison=comparison,
            warnings=(
                ["runtime-only 不会自动删除或归档"]
                if comparison["runtimeOnly"]
                else []
            ),
        )
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0 if status == "pass" else 1
    except (OSError, ProjectionError) as error:
        print(
            json.dumps(
                result(
                    f"runtime.{getattr(args, 'command', 'unknown')}",
                    "fail",
                    issues=[str(error)],
                ),
                ensure_ascii=False,
                indent=2,
            )
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
