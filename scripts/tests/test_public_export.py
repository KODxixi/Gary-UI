"""Public snapshots must never absorb the parent repo or overwrite an existing checkout."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from build_public import export, selected


class PublicExportTests(unittest.TestCase):
    def test_boundary_and_required_demo_images(self):
        for name in ('provenance/react-bits/GlassSurface.jsx', 'private/customer.json', '.env', 'docs/.env.local', 'portal/light-rays.js', 'patterns/shared/glass-surface.js', 'examples/demos/visuals/outputs/.last-good/old.html'):
            with self.subTest(name=name):
                self.assertFalse(selected(Path(name)))
        self.assertTrue(selected(Path('examples/demos/evidence/edition-02/web-analysis-dark.png')))
        self.assertTrue(selected(Path('patterns/shared/optical-glass.js')))

    def test_export_is_portable_and_cannot_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            source, output = base / 'source', base / 'public'
            source.mkdir()
            subprocess.run(['git', 'init', '-q', str(source)], check=True)
            (source / 'README.md').write_text('public', encoding='utf-8')
            (source / 'private').mkdir()
            (source / 'private/customer.json').write_text('private', encoding='utf-8')
            (source / 'portal').mkdir()
            (source / 'portal/index.html').write_text('<html lang="zh-CN"></html>', encoding='utf-8')
            report = export(source, output)
            self.assertEqual(report['files'], 2)
            self.assertFalse((output / 'private').exists())
            self.assertIn('data-gary-static', (output / 'portal/index.html').read_text(encoding='utf-8'))
            self.assertEqual(json.loads((output / 'public-source-manifest.json').read_text(encoding='utf-8'))['files'], 2)
            with self.assertRaises(ValueError):
                export(source, output)
            with self.assertRaises(ValueError):
                export(source, source / 'nested')
            self.assertEqual((output / 'README.md').read_text(encoding='utf-8'), 'public')


if __name__ == '__main__':
    unittest.main()
