from pathlib import Path

from PIL import Image


ASSET_DIR = Path(__file__).resolve().parents[1] / "assets" / "images"


def optimize(filename: str) -> None:
    path = ASSET_DIR / filename
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((700, 1050), Image.Resampling.LANCZOS)
        image.save(path, "PNG", optimize=True, compress_level=9)


if __name__ == "__main__":
    optimize("body-silhouette-male.png")
    optimize("body-silhouette-female.png")
    optimize("body-silhouette-male-back.png")
    optimize("body-silhouette-female-back.png")
