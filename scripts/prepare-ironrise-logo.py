from pathlib import Path

from PIL import Image

source = Path("/home/ubuntu/upload/pasted_file_woUAnw_image.png")
assets = Path("/home/ubuntu/gym-training-diary/assets/images")
assets.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    # The supplied landscape artwork contains a centered rounded-square logo panel.
    panel = image.crop((530, 165, 1030, 665)).convert("RGBA")
    icon = panel.resize((1024, 1024), Image.Resampling.LANCZOS)
    for filename in ("icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png", "ironrise-logo.png"):
        icon.save(assets / filename, "PNG", optimize=True)
