from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_scene_recipes_preserve_approved_baseline_and_add_local_density() -> None:
    recipes = json.loads(
        (ROOT / "spec" / "scene-recipes.json").read_text(encoding="utf-8")
    )
    assert set(recipes["scenes"]) == {"reading", "analysis", "showcase"}
    assert recipes["legacyBaseline"] == {
        "spacing": "8px",
        "cardRadius": "30px",
        "immutableBySceneRecipes": True,
    }
    assert recipes["typography"]["body"] == {
        "fontSize": "16px",
        "lineHeight": 1.68,
        "measure": "65-75ch",
    }
    assert set(recipes["semanticRoles"]) == {
        "title",
        "section-title",
        "body",
        "label",
        "annotation",
        "metric",
    }


def test_color_roles_are_separated_and_have_theme_values() -> None:
    recipes = json.loads(
        (ROOT / "spec" / "scene-recipes.json").read_text(encoding="utf-8")
    )
    colors = recipes["colors"]
    assert set(colors) == {"interfaceState", "chartCategory", "diagramRelation"}
    for family in colors.values():
        assert set(family) == {"dark", "light"}
    assert colors["interfaceState"]["dark"]["positive"] != colors["chartCategory"]["dark"][0]
    assert recipes["financialDirection"]["cn-stock"] == {
        "up": "red",
        "down": "green",
    }


def test_design_document_uses_the_approved_30px_card_baseline() -> None:
    design = (ROOT / "DESIGN.md").read_text(encoding="utf-8")
    assert "card 28px" not in design
    assert "card 30px" in design


def test_semantic_roles_and_card_structures_are_executable_rules() -> None:
    recipes = json.loads(
        (ROOT / "spec" / "scene-recipes.json").read_text(encoding="utf-8")
    )
    assert set(recipes["roleDefinitions"]) == set(recipes["semanticRoles"])
    for role in recipes["semanticRoles"]:
        rule = recipes["roleDefinitions"][role]
        assert {"fontSize", "fontWeight", "lineHeight", "spacing", "longContent", "use", "avoid"} <= set(rule)
    assert set(recipes["cardDefinitions"]) == set(recipes["cardStructures"])
    for structure in recipes["cardStructures"]:
        assert {"anatomy", "density", "use", "avoid", "longContent"} <= set(recipes["cardDefinitions"][structure])

    css = (ROOT / "tokens" / "base.css").read_text(encoding="utf-8")
    for role in recipes["semanticRoles"]:
        assert f'.gary-role-{role}' in css
    for structure in recipes["cardStructures"]:
        assert f'[data-gary-card="{structure}"]' in css

    react_recipes = (ROOT / "adapters" / "react-shadcn" / "src" / "recipes.ts").read_text(encoding="utf-8")
    assert 'gary-role-title' in react_recipes
    assert 'data-gary-card' in react_recipes


def test_global_bilingual_font_policy_and_rich_text_weights_are_shared() -> None:
    tokens = json.loads((ROOT / "tokens" / "tokens.json").read_text(encoding="utf-8"))["tokens"]
    recipes = json.loads((ROOT / "spec" / "scene-recipes.json").read_text(encoding="utf-8"))
    stack = tokens["--gary-font-sans"]["value"]
    assert '"Helvetica Neue", Helvetica, Arial' in stack
    assert '"Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑"' in stack
    assert recipes["typography"]["families"] == {
        "latin": ["Helvetica Neue", "Helvetica", "Arial"],
        "cjk": ["Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑"],
    }
    assert recipes["typography"]["richTextWeights"] == [100, 300, 400, 500, 600, 700, 800, 900]

    css = (ROOT / "tokens" / "base.css").read_text(encoding="utf-8")
    assert "--gary-font-latin:" in css
    assert "--gary-font-cjk:" in css
    for weight in recipes["typography"]["richTextWeights"]:
        assert f'[data-gary-font-weight="{weight}"]' in css

    react_recipes = (ROOT / "adapters" / "react-shadcn" / "src" / "recipes.ts").read_text(encoding="utf-8")
    assert "garyWeight" in react_recipes


def test_display_titles_are_single_line_short_and_punctuation_free() -> None:
    recipes = json.loads(
        (ROOT / "spec" / "scene-recipes.json").read_text(encoding="utf-8")
    )
    title = recipes["roleDefinitions"]["title"]
    assert title["lineCount"] == 1
    assert title["maxCjkCharacters"] == 12
    assert title["punctuation"] == "none"

    css = (ROOT / "tokens" / "base.css").read_text(encoding="utf-8")
    title_css = re.search(r"\.gary-role-title\s*\{([^}]*)\}", css, re.S)
    assert title_css
    assert "white-space: nowrap" in title_css.group(1)
    assert "text-wrap: nowrap" in title_css.group(1)
    assert "overflow-wrap: normal" in title_css.group(1)

    portal = (ROOT / "portal" / "index.html").read_text(encoding="utf-8")
    assert '<h3 class="gary-role-title">清晰先于玻璃</h3>' in portal

    punctuation = re.compile(r"[，。！？：；、,.!?;:]")
    display_title = re.compile(
        r'<h[1-6][^>]*class="[^"]*gary-role-title[^"]*"[^>]*>(.*?)</h[1-6]>',
        re.S,
    )
    pages = list((ROOT / "examples" / "demos").glob("*/index.html"))
    pages.extend((ROOT / "patterns").glob("**/*.html"))
    for page in pages:
        html = page.read_text(encoding="utf-8")
        for raw in display_title.findall(html):
            assert "<br" not in raw.lower(), page
            text = re.sub(r"<[^>]+>", "", raw).strip()
            assert not punctuation.search(text), (page, text)
            assert len(re.findall(r"[\u3400-\u9fff]", text)) <= 12, (page, text)
