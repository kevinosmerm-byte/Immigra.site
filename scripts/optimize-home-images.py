"""Derive home WebPs without replacing approved source artwork (requires Pillow).

Full-size WebPs preserve decoded pixels exactly. Smaller responsive variants
use deterministic Lanczos downsampling and lossless encoding (no AI/editing).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
HOME = ROOT / 'public/images/home'
sources = [(HOME / 'william-home.png', [640, 1024])]
sources += [(HOME / f'{name}-20261014.png', [80, 160, 240]) for name in ['citizenship', 'asylum', 'residency']]
sources += [(HOME / f'{name}-scene.png', []) for name in ['asylum', 'residency']]
sources += [(ROOT / 'modules/citizenship/src/assets/citizenship-background.png', [])]
for source, widths in sources:
    original = Image.open(source)
    # Use a separate home-only background asset; do not alter module artwork.
    destination = HOME / source.with_suffix('.webp').name
    if not widths or original.width in widths:
        original.save(destination, 'WEBP', lossless=True, exact=True, method=6)
        assert Image.open(destination).convert('RGBA').tobytes() == original.convert('RGBA').tobytes(), source
        print(f'{source.name}: {source.stat().st_size} -> {destination.stat().st_size} bytes (pixel-identical)')
    for width in widths:
        if width >= original.width:
            continue
        size = (width, round(original.height * width / original.width))
        resized = original.resize(size, Image.Resampling.LANCZOS)
        variant = destination.with_name(f'{destination.stem}-{width}.webp')
        resized.save(variant, 'WEBP', lossless=True, exact=True, method=6)
        assert Image.open(variant).convert('RGBA').tobytes() == resized.convert('RGBA').tobytes(), variant
        print(f'  {variant.name}: {variant.stat().st_size} bytes')
