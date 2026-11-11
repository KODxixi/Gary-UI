"""Reopen final SVG, PNG, and PDF artifacts and record independent integrity evidence."""

from __future__ import annotations

import json
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
VISUALS = ROOT / "examples" / "visuals" / "outputs"
DEMOS = ROOT / "examples" / "demos"
EVIDENCE = DEMOS / "evidence" / "export-integrity"


def inspect_svg(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.lstrip().startswith("<svg") or "<script" in text.lower():
        raise ValueError(f"not a standalone safe SVG: {path}")
    return {
        "path": str(path), "bytes": path.stat().st_size,
        "viewBox": "viewBox=" in text, "iconCount": text.count("data-gary-icon="),
        "hasInlinePresentation": any(token in text for token in (" fill=", " stroke=", " style=")),
    }


def inspect_png(path: Path) -> dict:
    with Image.open(path) as image:
        rgb = image.convert("RGB")
        colors = rgb.resize((min(rgb.width, 512), min(rgb.height, 512))).getcolors(maxcolors=512 * 512)
        color_count = len(colors or [])
        if image.width < 200 or image.height < 120 or color_count < 8:
            raise ValueError(f"PNG incomplete or visually empty: {path}")
        return {"path": str(path), "bytes": path.stat().st_size, "width": image.width, "height": image.height, "sampledColors": color_count}


def inspect_pdf(path: Path) -> dict:
    document = fitz.open(path)
    if document.page_count < 1:
        raise ValueError(f"PDF has no pages: {path}")
    text_chars = sum(len(page.get_text().strip()) for page in document)
    minimum_text = 80 if path.is_relative_to(DEMOS) else 20
    if text_chars < minimum_text:
        raise ValueError(f"PDF text content is incomplete: {path}")
    rendered = []
    sampled_colors = []
    for index in sorted({0, document.page_count - 1}):
        pixmap = document[index].get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
        colors = image.resize((min(image.width, 256), min(image.height, 256))).getcolors(maxcolors=256 * 256)
        color_count = len(colors or [])
        if color_count < 8:
            raise ValueError(f"PDF page is visually empty: {path} page {index + 1}")
        sampled_colors.append(color_count)
        output = EVIDENCE / f"{path.stem}-page-{index + 1}.png"
        pixmap.save(output)
        rendered.append(str(output))
    return {"path": str(path), "bytes": path.stat().st_size, "pages": document.page_count, "textChars": text_chars, "sampledColors": sampled_colors, "renderedPages": rendered}


def main() -> None:
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    result = {
        "schemaVersion": 1, "status": "pass",
        "svg": [inspect_svg(path) for path in sorted(VISUALS.glob("*.svg"))],
        "png": [inspect_png(path) for path in sorted(VISUALS.glob("*.png"))],
        "pdf": [inspect_pdf(path) for path in sorted(VISUALS.glob("*.pdf")) + [DEMOS / "research-report" / "research-report.pdf", DEMOS / "proposal-presentation" / "proposal-presentation.pdf"]],
    }
    icons = next(item for item in result["svg"] if item["path"].endswith("icons.svg"))
    architecture = next(item for item in result["svg"] if item["path"].endswith("architecture.svg"))
    if icons["iconCount"] != 10:
        raise ValueError(f"icons.svg contains {icons['iconCount']} icons, expected 10")
    if not architecture["hasInlinePresentation"]:
        raise ValueError("architecture.svg has no inlined presentation attributes")
    target = EVIDENCE / "integrity-report.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "pass", "svg": len(result["svg"]), "png": len(result["png"]), "pdf": len(result["pdf"]), "evidence": str(target)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
