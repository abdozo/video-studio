#!/usr/bin/env python3
"""Split a transparent PNG atlas into tightly cropped icons using FFmpeg."""

import argparse
import json
import os
import re
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory


def run(*args: str) -> bytes:
    return subprocess.check_output(args)


def cell_bounds(alpha: bytes, stride: int, cell: tuple[int, int, int, int],
                floor: int) -> tuple[int, int, int, int]:
    left, top, right, bottom = cell
    occupied_rows = []
    for y in range(top, bottom):
        occupied = [x for x in range(left, right) if alpha[y * stride + x] > floor]
        if occupied:
            occupied_rows.append((y, occupied[0], occupied[-1]))
    if not occupied_rows:
        raise ValueError("empty sticker cell")
    x = min(row[1] for row in occupied_rows)
    y = occupied_rows[0][0]
    end_x = max(row[2] for row in occupied_rows) + 1
    end_y = occupied_rows[-1][0] + 1
    if x == left or y == top or end_x == right or end_y == bottom:
        raise ValueError("sticker touches a grid boundary; leave transparent gutters")
    return x - 1, y - 1, end_x - x + 2, end_y - y + 2


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("sheet", type=Path)
    parser.add_argument("--grid", default="3x3", help="columns x rows, e.g. 3x3")
    parser.add_argument("--names", nargs="+", required=True, help="names from left to right, top to bottom")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--max-size", type=int, default=320, help="maximum icon width or height in pixels")
    parser.add_argument("--alpha-floor", type=int, default=32, help="clear faint alpha noise at or below this value")
    args = parser.parse_args()

    grid = re.fullmatch(r"([1-9][0-9]*)x([1-9][0-9]*)", args.grid)
    if not grid or not 0 <= args.alpha_floor < 255 or args.max_size < 2:
        parser.error("use a positive CxR grid, alpha floor 0–254 and max size of at least 2")
    columns, rows = map(int, grid.groups())
    if len(args.names) != columns * rows or len({name.casefold() for name in args.names}) != len(args.names):
        parser.error("provide one unique name per cell")
    if any(not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", name) for name in args.names):
        parser.error("names may contain letters, numbers, underscores and hyphens")

    metadata = run("ffprobe", "-v", "error", "-select_streams", "v:0",
                   "-show_entries", "stream=width,height", "-of", "json", str(args.sheet))
    stream = json.loads(metadata)["streams"][0]
    width, height = stream["width"], stream["height"]
    alpha = run("ffmpeg", "-v", "error", "-i", str(args.sheet),
                "-vf", "alphaextract", "-frames:v", "1", "-f", "rawvideo", "-")
    if len(alpha) != width * height:
        parser.error("expected a PNG with an 8-bit alpha channel")

    crops = []
    for index, name in enumerate(args.names):
        row, column = divmod(index, columns)
        cell = (column * width // columns, row * height // rows,
                (column + 1) * width // columns, (row + 1) * height // rows)
        try:
            crops.append(cell_bounds(alpha, width, cell, args.alpha_floor))
        except ValueError as error:
            parser.error(f"{name}: {error}")

    args.out.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix=".stickers-", dir=args.out) as staging:
        staged = []
        for name, (x, y, w, h) in zip(args.names, crops):
            scale = min(1, args.max_size / max(w, h))
            target = Path(staging) / f"{name}.png"
            filters = (
                f"format=rgba,lutrgb=a='if(lte(val,{args.alpha_floor}),0,val)',"
                f"crop={w}:{h}:{x}:{y}:exact=1,"
                f"scale={max(1, round(w * scale))}:{max(1, round(h * scale))}:flags=lanczos"
            )
            run("ffmpeg", "-v", "error", "-i", str(args.sheet), "-vf", filters,
                "-frames:v", "1", "-update", "1", str(target))
            staged.append(target)

        published = []
        try:
            for target in staged:
                destination = args.out / target.name
                os.link(target, destination)
                published.append(destination)
        except OSError:
            for destination in published:
                destination.unlink()
            raise
    print(f"Exported {len(crops)} stickers to {args.out}")


if __name__ == "__main__":
    main()
