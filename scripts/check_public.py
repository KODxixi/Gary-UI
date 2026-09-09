"""Check the public source boundary, required assets and reader-facing local links."""
from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ('LICENSE', 'README.md', 'AGENTS.md', 'CONTRIBUTING.md', 'index.html', 'demo0909.html', 'docs/ROADMAP.md',
            'docs/PUBLIC_RELEASE.md', 'docs/images/demo-home.png', 'licenses/third-party/manifest.json',
            'patterns/shared/optical-glass.js', 'patterns/shared/ambient-waves.js', 'scripts/preview.py',
            'adapters/react-shadcn/dist/index.js', 'adapters/react-shadcn/dist/styles/gary-ui.css')
FORBIDDEN = ('portal/light-rays.js', 'patterns/shared/glass-surface.js', 'patterns/shared/gradient-waves.js',
             'provenance/react-bits/GlassSurface.jsx', 'provenance/react-bits/GradientWaves.jsx')
PAGES = ('demo0909.html', 'examples/demos/index.html', 'portal/index.html', 'patterns/starting-points/index.html',
         *(f'examples/demos/{slug}/index.html' for slug in ('web-analysis', 'web-reading', 'project-kanban', 'executive-board', 'research-report', 'proposal-presentation')))


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'href', 'src'} and value:
                self.links.append(value)


def check(root: Path) -> dict:
    failures = []
    checked = 0
    for name in REQUIRED:
        if not (root / name).is_file():
            failures.append(f'Missing required file: {name}')
    for name in FORBIDDEN:
        if (root / name).exists():
            failures.append(f'Restricted historical implementation in public tree: {name}')
    for filename in (*PAGES, 'README.md', 'AGENTS.md', 'DESIGN.md', 'SKILL.md', 'PROJECT_STRUCTURE.md', 'CONTRIBUTING.md', 'docs/ROADMAP.md', 'docs/PUBLIC_RELEASE.md', 'docs/PUBLISHING.md'):
        file = root / filename
        if not file.is_file():
            failures.append(f'Missing entrypoint: {filename}')
            continue
        content = file.read_text(encoding='utf-8')
        if file.suffix == '.html':
            parser = Links()
            parser.feed(content)
            links = parser.links
        else:
            links = re.findall(r'\]\(([^)]+)\)', content)
        for link in links:
            url = urlsplit(link)
            if url.scheme or url.netloc or not url.path or '${' in link:
                continue
            checked += 1
            target = (root / unquote(url.path).lstrip('/')) if url.path.startswith('/') else file.parent / unquote(url.path)
            if not target.exists():
                failures.append(f'{filename}: missing local link {link}')
    # These signatures identify the retired port, not general SVG filter APIs.
    for directory in ('examples', 'portal', 'patterns', 'adapters/visual/runtime'):
        for file in (root / directory).rglob('*'):
            if file.suffix not in {'.html', '.js', '.cjs'} or not file.is_file():
                continue
            if any(part in {'node_modules', '.git'} for part in file.parts):
                continue
            content = file.read_text(encoding='utf-8', errors='replace')
            if 'Adapted from React Bits GlassSurface' in content or ('dispRed' in content and 'dispGreen' in content and 'dispBlue' in content):
                failures.append(f'Restricted inline implementation: {file.relative_to(root).as_posix()}')
    return {'status': 'fail' if failures else 'pass', 'localLinks': checked, 'failures': failures}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    report = check(args.root.resolve())
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(report['status'] != 'pass')
