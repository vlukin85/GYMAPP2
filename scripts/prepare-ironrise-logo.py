from pathlib import Path

from PIL import Image

source = Path("/home/ubuntu/upload/pasted_file_woUAnw_image.png")
assets = Path("/home/ubuntu/gym-training-diary/assets/images")
assets.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    # The supplied landscape artwork contains a centered rounded-square logo panel.
    panel = image.crop((530, 165, 1030, 665)).convert("RGBA")
    launcher_icon = Image.new("RGBA", (1024, 1024), (255, 255, 255, 255))
    launcher_panel = panel.resize((720, 720), Image.Resampling.LANCZOS)
    launcher_icon.alpha_composite(launcher_panel, ((1024 - 720) // 2, (1024 - 720) // 2))

    adaptive_foreground = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    safe_panel = panel.resize((620, 620), Image.Resampling.LANCZOS)
    adaptive_foreground.alpha_composite(safe_panel, ((1024 - 620) // 2, (1024 - 620) // 2))

    for filename in ("icon.png", "splash-icon.png", "favicon.png", "ironrise-logo.png"):
        launcher_icon.save(assets / filename, "PNG", optimize=True)
    adaptive_foreground.save(assets / "android-icon-foreground.png", "PNG", optimize=True)
