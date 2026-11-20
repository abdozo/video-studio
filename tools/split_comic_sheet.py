#!/usr/bin/env python3
"""Split a uniform comic contact sheet into named WebP panels."""

import argparse
import os
import re
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

try:
    from PIL import Image, ImageOps
except ImportError:
    raise SystemExit("Pillow is required. Install it with: python3 -m pip install Pillow")


def parse_grid(value: str) -> tuple[int, int]:
    match = re.fullmatch(r"([1-9][0-9]*)x([1-9][0-9]*)", value.lower())
    if not match:
        raise argparse.ArgumentTypeError("use COLUMNSxROWS, such as 3x3 or 2x2")
    return int(match[1]), int(match[2])


def split_sheet(source: Path, output: Path, grid: tuple[int, int], names: list[str],
                direction: str = "ltr") -> None:
    columns, rows = grid
    if len(names) > columns * rows:
        raise ValueError(f"{columns}x{rows} has only {columns * rows} cells")
    selected = [(index, name) for index, name in enumerate(names) if name != "-"]
    if not selected:
        raise ValueError("name at least one panel")
    if any(not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]*", name) for _, name in selected):
        raise ValueError("panel names must use letters, numbers, underscores or hyphens, without extensions")
    if len({name.casefold() for _, name in selected}) != len(selected):
        raise ValueError("panel names must be unique")

    destinations = [output / f"{name}.webp" for _, name in selected]
    for destination in destinations:
        if destination.exists() or destination.is_symlink():
            raise FileExistsError(f"refusing to overwrite {destination}")

    with Image.open(source) as original:
        if getattr(original, "n_frames", 1) != 1:
            raise ValueError("use a still image for the sheet")
        sheet = ImageOps.exif_transpose(original)
        width, height = sheet.size
        if columns > width or rows > height:
            raise ValueError("the grid is larger than the sheet in pixels")
        output.mkdir(parents=True, exist_ok=True)

        with TemporaryDirectory(prefix=".comic-sheet-", dir=output) as temp:
            sizes = []
            for (index, _), destination in zip(selected, destinations):
                row, column = divmod(index, columns)
                if direction == "rtl":
                    column = columns - 1 - column
                bounds = (
                    column * width // columns,
                    row * height // rows,
                    (column + 1) * width // columns,
                    (row + 1) * height // rows,
                )
                panel = sheet.crop(bounds)
                panel.save(
                    Path(temp) / destination.name,
                    lossless=True,
                    exact=True,
                    icc_profile=sheet.info.get("icc_profile"),
                )
                sizes.append(panel.size)

            # Publish only after every crop is encoded. Linking refuses to overwrite a concurrent result.
            published = []
            try:
                for destination in destinations:
                    os.link(Path(temp) / destination.name, destination)
                    published.append(destination)
            except OSError:
                for destination in published:
                    destination.unlink()
                raise

    print(f"{source.name}: {width}x{height}, {columns}x{rows} grid")
    for destination, (panel_width, panel_height) in zip(destinations, sizes):
        print(f"{destination}: {panel_width}x{panel_height}")
        if abs(panel_width / panel_height / (16 / 9) - 1) > 0.01:
            print(f"Warning: {destination.name} differs from 16:9 by more than 1%.", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sheet", type=Path, help="source WebP, PNG, or JPEG with equal cells and no gutters")
    parser.add_argument("--grid", type=parse_grid, required=True, help="COLUMNSxROWS, e.g. 3x3")
    parser.add_argument("--out", type=Path, required=True, help="directory for the panel WebPs")
    parser.add_argument("--direction", choices=("ltr", "rtl"), default="ltr",
                        help="reading direction within each row (default: ltr)")
    parser.add_argument(
        "--names", nargs="+", required=True,
        help="panel names in reading order within each row, from the top row down. Use - to skip a cell",
    )
    args = parser.parse_args()
    try:
        split_sheet(args.sheet, args.out, args.grid, args.names, args.direction)
    except (OSError, ValueError) as error:
        parser.exit(1, f"{parser.prog}: {error}\n")


if __name__ == "__main__":
    main()
