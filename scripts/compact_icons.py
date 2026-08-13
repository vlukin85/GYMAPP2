from PIL import Image
from pathlib import Path

root = Path('/home/ubuntu/gym-training-diary')
for name in ['assets/images/icon.png', 'assets/images/splash-icon.png', 'assets/images/favicon.png', 'assets/images/android-icon-foreground.png', 'assets/exercises/bench-press.png', 'assets/exercises/incline-db-press.png', 'assets/exercises/lat-pulldown.png', 'assets/exercises/barbell-row.png', 'assets/exercises/squat.png', 'assets/exercises/leg-press.png', 'assets/exercises/shoulder-press.png', 'assets/exercises/lateral-raise.png', 'assets/exercises/biceps-curl.png', 'assets/exercises/triceps-pushdown.png']:
    path = root / name
    image = Image.open(path).convert('RGBA')
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    image.save(path, format='PNG', optimize=True, compress_level=9)
