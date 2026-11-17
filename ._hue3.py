import re

src = open(r'C:/AI/UI/gary-ui/theme/gary.theme.mjs', encoding='utf-8').read()


def hsv(h):
    h = h.lstrip('#')
    r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    mx, mn = max(r, g, b), min(r, g, b)
    s = 0 if mx == 0 else (mx - mn) / mx
    if mx == mn:
        hu = 0
    elif mx == r:
        hu = ((g - b) / (mx - mn)) % 6
    elif mx == g:
        hu = (b - r) / (mx - mn) + 2
    else:
        hu = (r - g) / (mx - mn) + 4
    return round(hu * 60), round(s * 100), round(mx * 100)


for n in ['--color-accent', '--color-text-accent', '--color-accent-muted', '--color-on-accent']:
    m = re.search(r"'(" + re.escape(n) + r")':\s*\['(#[0-9A-Fa-f]{6})',\s*'(#[0-9A-Fa-f]{6})'\]", src)
    print(f"MISSING {n}" if not m else f"{n:24} " + "  ".join(
        f"{v} hue{hsv(v)[0]:3} v{hsv(v)[2]:3}%" for v in m.groups()[1:]))
