"""Export a standalone Gary-UI public source tree without parent-repository history."""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_PARTS = {'.git', 'node_modules', '__pycache__', '.pytest_cache', '.ruff_cache', '.last-good', '.failed', '.candidates', '_site', 'public-build', '.venv'}
ROOT_DIRECTORIES = {'.github', 'adapters', 'assets', 'components', 'contracts', 'docs', 'examples', 'licenses', 'patterns', 'portal', 'runtime', 'scripts', 'session', 'spec', 'tokens'}
ROOT_FILES = {'.gitattributes', '.nojekyll', '.gitignore', 'AGENTS.md', 'CHANGELOG.md', 'CONTRIBUTING.md', 'DESIGN.md', 'LICENSE', 'PROJECT_STRUCTURE.md', 'README.md', 'SKILL.md', 'THIRD_PARTY_NOTICES.md', 'design-qa.md', 'gary-ui.cmd', 'index.html', 'demo0909.html', 'library-consumption.json', 'metadata.json'}
EXCLUDED = (
    'scripts/tests/test_light_rays_scene.py', 'provenance/*', 'decisions/*', 'portal/evidence/*', 'docs/LOCAL_WORKFLOW.md',
    'portal/light-rays.js', 'patterns/shared/glass-surface.js', 'patterns/shared/gradient-waves.js',
    'patterns/shared/glass-surface-*', 'patterns/shared/gradient-waves-*',
    'licenses/react-bits-LICENSE.md', 'assets/backgrounds/gary-default-scene.png',
    'examples/visuals/fresh-session-*', 'examples/visuals/evidence/*',
    'docs/GARY_UI_ACCEPTANCE_*', 'docs/GARY_UI_INDEPENDENT_ACCEPTANCE_*',
)


def selected(path: Path) -> bool:
    name = path.as_posix()
    if not path.parts or (len(path.parts) == 1 and name not in ROOT_FILES) or (len(path.parts) > 1 and path.parts[0] not in ROOT_DIRECTORIES):
        return False
    if path.name.startswith('.env') or path.suffix in {'.pem', '.key'}:
        return False
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    if any(fnmatch.fnmatchcase(name, pattern) for pattern in EXCLUDED):
        return False
    if 'evidence' in path.parts:
        return name.startswith('examples/demos/evidence/public-release/') or (
            name.startswith('examples/demos/evidence/edition-02/')
            and path.name.endswith(('-dark.png', '-light.png'))
        )
    return path.suffix not in {'.pyc', '.log', '.tmp'}


def source_files(root: Path) -> list[Path]:
    result = subprocess.run(
        ['git', '-C', str(root), 'ls-files', '--cached', '--others', '--exclude-standard', '-z', '--', '.'],
        capture_output=True, check=True,
    )
    return sorted({Path(item.decode('utf-8')) for item in result.stdout.split(b'\0') if item})


def export(root: Path, output: Path) -> dict:
    root, output = root.resolve(), output.resolve()
    if output == root or root in output.parents or output in root.parents:
        raise ValueError('Output must be outside the source tree and its ancestors.')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be a new or empty directory; existing content is never removed.')
    output.mkdir(parents=True, exist_ok=True)
    records = []
    for relative in source_files(root):
        if not selected(relative):
            continue
        source = root / relative
        if not source.is_file():
            continue
        if source.is_symlink() or not source.resolve().is_relative_to(root):
            raise ValueError(f'Source escapes the checkout: {relative}')
        destination = output / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, destination)
        if relative.as_posix() == 'portal/index.html':
            html = destination.read_text(encoding='utf-8')
            if 'data-gary-static' not in html:
                html = html.replace('<html ', '<html data-gary-static ', 1)
            destination.write_text(html, encoding='utf-8')
        records.append({'path': relative.as_posix(), 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()})
    attributes = root / 'scripts/public.gitattributes'
    if attributes.is_file() and not (output / '.gitattributes').exists():
        shutil.copyfile(attributes, output / '.gitattributes')
        records.append({'path': '.gitattributes', 'sha256': hashlib.sha256(attributes.read_bytes()).hexdigest()})
    records.sort(key=lambda entry: entry['path'])
    report = {'schemaVersion': 1, 'repository': 'KODxixi/Gary-UI', 'files': len(records), 'entries': records,
              'note': 'Public source snapshot only; no parent repository history, machine receipts or restricted component ports.'}
    (output / 'public-source-manifest.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    report = export(ROOT, args.output)
    print(json.dumps({'output': str(args.output.resolve()), 'files': report['files']}, ensure_ascii=False))


if __name__ == '__main__':
    main()
