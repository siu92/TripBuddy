from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "assets" / "quick-access"
FONT = Path(r"C:\Windows\Fonts\SegoeIcons.ttf")

SIZE = 192
TILE = (18, 18, 174, 174)

ICONS = {
    "ai-planner": ("\ue99a", "#0B746A", "#E9F7F3", "#C2E5DC"),
    "flight": ("\ue709", "#2B67A5", "#EDF5FF", "#C9DCF4"),
    "hotel": ("\uea8a", "#8A5B19", "#FFF8E8", "#E8D3A5"),
    "activity": ("\ue707", "#C45D3E", "#FFF3ED", "#F0CFBF"),
    "mobility": ("\ue804", "#B96029", "#FFF5EB", "#EED3B8"),
    "esim": ("\uf61b", "#08736B", "#ECF8F5", "#C4E5DE"),
}


def hex_rgb(value: str):
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def mix(a, b, ratio):
    return tuple(round(a[index] * (1 - ratio) + b[index] * ratio) for index in range(3))


def render(name, glyph, ink_hex, top_hex, border_hex):
    ink = hex_rgb(ink_hex)
    top = hex_rgb(top_hex)
    border = hex_rgb(border_hex)
    white = (255, 255, 255)

    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    shadow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((22, 26, 170, 178), radius=42, fill=(24, 51, 46, 34))
    shadow = shadow.filter(ImageFilter.GaussianBlur(11))
    image.alpha_composite(shadow)

    tile = Image.new("RGBA", image.size, (0, 0, 0, 0))
    tile_draw = ImageDraw.Draw(tile)
    for y in range(TILE[1], TILE[3]):
        ratio = (y - TILE[1]) / max(1, TILE[3] - TILE[1])
        color = mix(top, white, ratio * .82)
        tile_draw.line((TILE[0], y, TILE[2], y), fill=(*color, 255), width=1)

    mask = Image.new("L", image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(TILE, radius=42, fill=255)
    tile.putalpha(mask)
    image.alpha_composite(tile)

    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(TILE, radius=42, outline=(*border, 255), width=3)
    draw.arc((27, 27, 92, 92), 185, 300, fill=(*white, 180), width=4)

    font = ImageFont.truetype(str(FONT), 72)
    bbox = draw.textbbox((0, 0), glyph, font=font)
    width = bbox[2] - bbox[0]
    height = bbox[3] - bbox[1]
    x = (SIZE - width) / 2 - bbox[0]
    y = (SIZE - height) / 2 - bbox[1] + 2

    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.text((x, y + 4), glyph, font=font, fill=(*ink, 38))
    glow = glow.filter(ImageFilter.GaussianBlur(5))
    image.alpha_composite(glow)
    draw = ImageDraw.Draw(image)
    draw.text((x, y), glyph, font=font, fill=(*ink, 255))

    image.save(OUTPUT / f"{name}.png", optimize=True)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, values in ICONS.items():
        render(name, *values)


if __name__ == "__main__":
    main()
