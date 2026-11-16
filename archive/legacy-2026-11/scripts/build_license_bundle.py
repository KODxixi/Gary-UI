"""Consolidate the per-package license copies into one readable bundle.

Inputs are the generated `manifest.json` and the verbatim copies it points at;
nothing is fetched. Output is `licenses/third-party/THIRD_PARTY_LICENSES.txt`,
the file `THIRD_PARTY_NOTICES.md` links to as the full original license text.

Bytes are handled verbatim: copied license files keep their own line endings
(many upstream notices are CRLF), while the generated wrapper lines use LF.
Writing in text mode would rewrite every CRLF and silently alter the record.

Usage:
    python scripts/build_license_bundle.py [--root <dir>] [--generated YYYY-MM-DD] [--check]
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path

RULE = "=" * 82
THIN = "-" * 82
INTRO = (
    "This file contains the full text of all third-party open source licenses",
    "for dependencies used by gary-ui. Individual per-package license files were",
    "consolidated here to keep the repository tree concise. Package metadata",
    "(name, version, SPDX identifier, source paths) is available in manifest.json.",
)


def build(root: Path, generated: str) -> tuple[bytes, int, int]:
    manifest = json.loads(
        (root / "licenses" / "third-party" / "manifest.json").read_text(encoding="utf-8")
    )
    packages = sorted(manifest["packages"], key=lambda item: (item["package"], item["version"]))

    body = bytearray()
    files = 0
    for entry in packages:
        # Directory-name form, matching the collector's output directories.
        label = entry["package"].replace("/", "__") + "@" + entry["version"]
        body.extend(f"{THIN}\r\nPACKAGE: {label}\r\n{THIN}\r\n\r\n".encode("utf-8"))
        for item in sorted(entry["files"], key=lambda i: i["copy"]):
            content = (root / item["copy"]).read_bytes()
            files += 1
            body.extend(f"--- FILE: {item['copy'].rsplit('/', 1)[-1]} ---\r\n\r\n".encode("utf-8"))
            body.extend(content.rstrip(b"\r\n"))
            body.extend(b"\n\r\n")

    # Supplemental upstream texts (releases that declare a license but ship no
    # LICENSE file); they are recorded as one "upstream" block, as before.
    supplemental = root / "licenses" / "third-party" / "supplemental-sources.json"
    if supplemental.is_file():
        sources = json.loads(supplemental.read_text(encoding="utf-8"))["sources"]
        if sources:
            body.extend(f"{THIN}\r\nPACKAGE: upstream\r\n{THIN}\r\n\r\n".encode("utf-8"))
            for item in sorted(sources, key=lambda i: i["copy"]):
                content = (root / item["copy"]).read_bytes()
                files += 1
                body.extend(
                    f"--- FILE: {item['copy'].rsplit('/', 1)[-1]} ---\r\n\r\n".encode("utf-8")
                )
                body.extend(content.rstrip(b"\r\n"))
                body.extend(b"\n\r\n")

    out = bytearray()
    out.extend(f"{RULE}\nGARY-UI THIRD-PARTY LICENSES\n{RULE}\n\n".encode("utf-8"))
    for line in INTRO:
        out.extend(line.encode("utf-8") + b"\n")
    out.extend(f"\nGenerated: {generated}\nLicense files: {files}\n\n{RULE}\n\n\n".encode("utf-8"))
    out.extend(body)
    return bytes(out), files, len(packages)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    parser.add_argument("--generated", default=date.today().isoformat())
    parser.add_argument("--out", default="licenses/third-party/THIRD_PARTY_LICENSES.txt")
    parser.add_argument("--check", action="store_true", help="write nothing; fail if the file differs")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    payload, files, packages = build(root, args.generated)
    target = root / args.out
    if args.check:
        if not target.is_file() or target.read_bytes() != payload:
            raise SystemExit(f"license bundle is stale: {args.out}")
        print(json.dumps({"status": "current", "packages": packages, "licenseFiles": files}))
    else:
        target.write_bytes(payload)
        print(json.dumps({"status": "written", "packages": packages, "licenseFiles": files, "output": args.out}))