from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/images/icon.png"
TARGETS = {
    "icon.png": 1024,
    "splash-icon.png": 1024,
    "android-icon-foreground.png": 1024,
    "favicon.png": 256,
}


def optimize_icon() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    for name, size in TARGETS.items():
        image = source.resize((size, size), Image.Resampling.LANCZOS)
        target = ROOT / "assets/images" / name
        image.save(target, format="PNG", optimize=True, compress_level=9)
        print(f"{target.name}: {target.stat().st_size} bytes")


if __name__ == "__main__":
    optimize_icon()
