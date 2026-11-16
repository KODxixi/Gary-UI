from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from validate import has_remote_dependency


def test_svg_namespace_is_metadata():
    assert not has_remote_dependency('const icon={xmlns:"http://www.w3.org/2000/svg"};')
    assert not has_remote_dependency('document.createElementNS("http://www.w3.org/2000/svg", "svg")')
    assert not has_remote_dependency('<svg xmlns="http://www.w3.org/2000/svg"></svg>')


def test_remote_resource_is_still_rejected():
    assert has_remote_dependency('<script src="https://cdn.example.org/icons.js"></script>')
    assert has_remote_dependency('fetch("http://www.w3.org/2000/svg")')
    assert has_remote_dependency('const icon={xmlns:"http://www.w3.org/2000/svg"};fetch("https://example.org/x")')
