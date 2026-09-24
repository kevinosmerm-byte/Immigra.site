"""Reduce embedded study-guide images while preserving PDF text and page structure."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter


def optimize(source: Path, destination: Path, max_dimension: int, quality: int) -> None:
    reader = PdfReader(source)
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)

    replaced = 0
    for page in writer.pages:
        for embedded in list(page.images):
            image = embedded.image
            if max(image.size) > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            if image.mode not in ("RGB", "L"):
                background = Image.new("RGB", image.size, "white")
                if "A" in image.getbands():
                    background.paste(image, mask=image.getchannel("A"))
                    image = background
                else:
                    image = image.convert("RGB")
            embedded.replace(image, quality=quality)
            replaced += 1

    writer.compress_identical_objects(remove_identicals=True, remove_orphans=True)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as output:
        writer.write(output)

    print(f"Optimized {len(writer.pages)} pages and {replaced} embedded images.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--max-dimension", type=int, default=1800)
    parser.add_argument("--quality", type=int, default=78)
    args = parser.parse_args()
    optimize(args.source, args.destination, args.max_dimension, args.quality)
