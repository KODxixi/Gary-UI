"""Build a static Pages artifact from an already validated public Gary-UI checkout."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from check_public import check

ROOT = Path(__file__).resolve().parents[1]
DIRECTORIES = ('tokens', 'components', 'patterns', 'portal', 'examples', 'assets', 'docs', 'licenses', 'adapters', 'spec', 'contracts')
IGNORED = {'.git', 'node_modules', '__pycache__', '.last-good', '.failed', '.candidates'}


def build(output: Path) -> int:
    report = check(ROOT)
    if report['status'] != 'pass':
        raise ValueError('Build from a validated public checkout: ' + '; '.join(report['failures']))
    output = output.resolve()
    if output == ROOT or output in ROOT.parents:
        raise ValueError('Output cannot replace the checkout or its ancestors.')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output must be new or empty; existing files are never removed.')
    output.mkdir(parents=True, exist_ok=True)
    files = [ROOT / name for name in ('index.html', 'demo0909.html', 'README.md', 'DESIGN.md', 'SKILL.md', 'CONTRIBUTING.md', 'LICENSE', 'THIRD_PARTY_NOTICES.md')]
    for name in DIRECTORIES:
        files.extend(path for path in (ROOT / name).rglob('*') if path.is_file() and not any(part in IGNORED for part in path.relative_to(ROOT).parts))
    for path in files:
        if path.is_symlink() or not path.resolve().is_relative_to(ROOT):
            raise ValueError(f'Unsupported linked file: {path.name}')
        destination = output / path.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, destination)
    (output / '.nojekyll').write_text('', encoding='utf-8')
    return len(files)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / '_site')
    args = parser.parse_args()
    print(json.dumps({'files': build(args.output), 'output': str(args.output.resolve())}))
