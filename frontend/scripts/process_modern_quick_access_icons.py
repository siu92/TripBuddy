from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "src" / "assets" / "quick-access"
SOURCE_ROOT = Path(
    r"C:\Users\dltld\.codex\generated_images\01a07eac-83c3-77e1-bb4e-9a3949662585"
)

SOURCES = {
    "premium-ai-planner.png": "exec-832b2141-62d1-40dc-a2f8-1cd9205eabd9.png",
    "premium-flight.png": "exec-538b755a-6e78-483a-96b3-875c3a9347d2.png",
    "premium-hotel.png": "exec-8d0ed2d4-ac8c-49d2-ac76-7c4f27fa37a8.png",
    "premium-activity.png": "exec-12b7e7d9-de56-4fd0-a816-65cff7221610.png",
    "premium-mobility.png": "exec-2ee6f366-e559-425b-9be7-a515d207079e.png",
    "premium-esim.png": "exec-62a860da-d069-4fb8-a069-5d3aa04c193a.png",
}


def normalize(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    alpha_box = image.getchannel("A").getbbox()
    if alpha_box:
        image = image.crop(alpha_box)

    max_side = 292
    scale = min(max_side / image.width, max_side / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (320, 320), (0, 0, 0, 0))
    x = (canvas.width - image.width) // 2
    y = (canvas.height - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    canvas.save(destination, optimize=True)


if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    for output_name, source_name in SOURCES.items():
        normalize(SOURCE_ROOT / source_name, DEST / output_name)
