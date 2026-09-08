"""Copy installed dependency licenses verbatim into the public source tree.

Run after installing the locked dependencies of both adapters. No network access
or dependency installation is performed. Original notices retain their licenses;
the project's own license does not replace them.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "licenses" / "third-party"
NOTICE_NAME = re.compile(
    r"^(?:licen[cs]e|notice|copying|copyright|third[-_]?party[-_]?notices?)(?:$|[._-])"
    r"|\.(?:license|notice)$",
    re.IGNORECASE,
)


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def read_package(directory: Path) -> dict:
    return json.loads((directory / "package.json").read_text(encoding="utf-8"))


def resolve_package(name: str, parent: Path) -> Path | None:
    """Resolve installed nested/hoisted packages without invoking npm or Node."""
    current = parent
    while current == ROOT or ROOT in current.parents:
        candidate = current / "node_modules" / name
        if (candidate / "package.json").is_file():
            return candidate
        if current == ROOT:
            break
        current = current.parent
    return None


def notices(directory: Path) -> list[Path]:
    found = []
    for path in directory.rglob("*"):
        parts = path.relative_to(directory).parts
        if any(part in {"node_modules", ".git"} for part in parts):
            continue
        if path.is_file() and NOTICE_NAME.search(path.name):
            # Only copyright/license text is collected, never binary artifacts.
            content = path.read_bytes()
            if b"\x00" in content:
                continue
            found.append(path)
    return sorted(found)


def license_id(package: dict) -> str:
    value = package.get("license", package.get("licenses", "UNKNOWN"))
    if isinstance(value, dict):
        return str(value.get("type", "UNKNOWN"))
    if isinstance(value, list):
        return " OR ".join(
            str(item.get("type", "UNKNOWN")) if isinstance(item, dict) else str(item)
            for item in value
        )
    return str(value)


def record_copy(entry: dict, source: Path, content: bytes, name: str, **details) -> None:
    digest = hashlib.sha256(content).hexdigest()
    existing = next((item for item in entry["files"] if item["sha256"] == digest), None)
    if existing:
        existing["sources"].append(relative(source))
        return
    destination = OUTPUT / (entry["package"].replace("/", "__") + "@" + entry["version"])
    output = destination / f"{digest[:12]}-{name}"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(content)
    entry["files"].append({
        "sources": [relative(source)],
        "copy": relative(output),
        "sha256": digest,
        "bytes": len(content),
        **details,
    })


def embedded_notice(directory: Path) -> tuple[Path, bytes] | None:
    """Extract an actual full license section, preserving its original bytes."""
    for source in sorted(directory.glob("README*")):
        if not source.is_file():
            continue
        content = source.read_bytes()
        match = re.search(rb"(?im)^#{1,6} +licen[cs]e[^\r\n]*\r?\n", content)
        if not match:
            continue
        end = re.search(rb"(?m)^#{1,6} +", content[match.end():])
        section = content[match.start():match.end() + end.start()] if end else content[match.start():]
        if b"Permission is hereby granted" in section or b"Permission to use, copy" in section:
            return source, section
    return None


def collect() -> dict:
    visual = ROOT / "adapters" / "visual"
    react = ROOT / "adapters" / "react-shadcn"
    queue: list[Path] = []
    missing_required = []
    optional_uninstalled = []
    root_dependencies = []
    for adapter in (visual, react):
        metadata = read_package(adapter)
        dependencies = {
            **metadata.get("dependencies", {}),
            **metadata.get("peerDependencies", {}),
        }
        if adapter == visual:
            dependencies["esbuild"] = metadata["devDependencies"]["esbuild"]
            dependencies["d3"] = "vendored browser runtime"
        for name in sorted(dependencies):
            path = resolve_package(name, adapter)
            root_dependencies.append({"adapter": relative(adapter), "package": name})
            if path is None:
                missing_required.append(f"{relative(adapter)}: {name}")
            else:
                queue.append(path)

    # These distributed source trees are not installed npm dependencies.
    for path in (visual / "vendor" / "archify", visual / "vendor" / "node" / "playwright-core"):
        if (path / "package.json").is_file():
            queue.append(path)

    seen: set[Path] = set()
    packages: dict[tuple[str, str], dict] = {}
    while queue:
        directory = queue.pop(0)
        if directory in seen:
            continue
        seen.add(directory)
        metadata = read_package(directory)
        name = metadata["name"]
        version = metadata["version"]
        if "react-bits" in name.lower():
            raise RuntimeError("React Bits is excluded from this distributable license collection")
        entry = packages.setdefault((name, version), {
            "package": name,
            "version": version,
            "spdx": license_id(metadata),
            "packageSources": [],
            "files": [],
        })
        entry["packageSources"].append(relative(directory / "package.json"))
        for source in notices(directory):
            record_copy(entry, source, source.read_bytes(), source.name)
            if entry["spdx"] == "UNKNOWN" and source.read_bytes().startswith(b"The MIT License (MIT)"):
                entry["spdx"] = "MIT"
                entry["spdxSource"] = relative(source)
        if not entry["files"]:
            embedded = embedded_notice(directory)
            if embedded:
                source, content = embedded
                record_copy(entry, source, content, "README-LICENSE.txt", extraction="Verbatim complete License section from the upstream README")
        if not entry["files"] and name.startswith("@esbuild/"):
            esbuild = resolve_package("esbuild", visual)
            if esbuild and read_package(esbuild)["version"] == version:
                source = esbuild / "LICENSE.md"
                if source.is_file():
                    record_copy(entry, source, source.read_bytes(), source.name, note="Platform executable from the same version and repository as the esbuild package")

        # Archify is vendored application code with no runtime npm dependencies.
        optional = metadata.get("optionalDependencies", {})
        dependencies = {**metadata.get("dependencies", {}), **optional}
        for dependency in sorted(dependencies):
            path = resolve_package(dependency, directory)
            if path:
                queue.append(path)
            elif dependency in optional:
                optional_uninstalled.append({"package": name, "dependency": dependency})
            else:
                missing_required.append(f"{name}@{version}: {dependency}")
        for dependency in sorted(metadata.get("peerDependencies", {})):
            path = resolve_package(dependency, directory)
            if path:
                queue.append(path)

    supplemental_file = OUTPUT / "supplemental-sources.json"
    supplemental = json.loads(supplemental_file.read_text(encoding="utf-8")) if supplemental_file.is_file() else {"sources": []}
    for item in supplemental["sources"]:
        entry = packages.get((item["package"], item["version"]))
        if not entry or entry["files"]:
            continue
        source = ROOT / item["copy"]
        content = source.read_bytes()
        if hashlib.sha256(content).hexdigest() != item["sha256"]:
            raise RuntimeError(f"Supplemental license hash mismatch: {item['copy']}")
        entry["files"].append({
            "sources": [item["copy"]], "copy": item["copy"],
            "sourceUrl": item["sourceUrl"], "sha256": item["sha256"],
            "bytes": len(content), "note": item["note"],
        })

    entries = sorted(packages.values(), key=lambda item: (item["package"], item["version"]))
    missing_text = []
    for entry in entries:
        entry["licenseTextStatus"] = "full-text" if entry["files"] else "declared-only"
        if not entry["files"]:
            missing_text.append(f"{entry['package']}@{entry['version']}")
            source = ROOT / entry["packageSources"][0]
            record_copy(entry, source, source.read_bytes(), "package.json", note="Original package license declaration and available author metadata only; upstream full license text was not supplied")
        entry["packageSources"] = sorted(set(entry["packageSources"]))
        entry["files"].sort(key=lambda item: item["copy"])
        for item in entry["files"]:
            item["sources"] = sorted(set(item["sources"]))
    result = {
        "schemaVersion": 1,
        "scope": "Installed runtime and peer dependency closures of both adapters, visual build esbuild, D3 browser runtime, vendored Archify and Playwright",
        "notice": "Full-text records preserve upstream license and copyright notices verbatim. Declared-only records preserve original package metadata and do not supply missing license text. Each dependency retains its own terms; Gary-UI does not relicense third-party code or brand marks.",
        "sourcePaths": "Paths are relative to the repository root; node_modules sources are available after installing the locked dependencies.",
        "rootDependencies": root_dependencies,
        "packages": entries,
        "optionalDependenciesNotInstalled": optional_uninstalled,
        "missingRequiredDependencies": sorted(set(missing_required)),
        "missingLicenseText": missing_text,
        "licenseTextComplete": not missing_text,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "manifest.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    manifest = collect()
    print(json.dumps({
        "status": "incomplete-dependencies" if manifest["missingRequiredDependencies"] else "collected-with-declarations-only" if manifest["missingLicenseText"] else "collected",
        "packages": len(manifest["packages"]),
        "licenseFiles": sum(len(item["files"]) for item in manifest["packages"]),
        "missingRequiredDependencies": manifest["missingRequiredDependencies"],
        "missingLicenseText": manifest["missingLicenseText"],
        "manifest": relative(OUTPUT / "manifest.json"),
    }, ensure_ascii=False))
    # Declared-only packages remain explicit audit gaps, not fabricated licenses.
    raise SystemExit(1 if manifest["missingRequiredDependencies"] else 0)
