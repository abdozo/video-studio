#!/usr/bin/env python3
"""Import licensed SFX or music into the shared normalized audio library."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def safe_id(value: str) -> str:
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
        raise argparse.ArgumentTypeError("id must be lowercase hyphen-case")
    return value


def command(args: list[str]) -> str:
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode:
        raise RuntimeError(result.stdout)
    return result.stdout


def probe(path: Path) -> float:
    return round(float(command(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)]).strip()), 3)


def peak(path: Path) -> float | None:
    output = command(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "/dev/null"])
    match = re.search(r"max_volume:\s*(-?[\d.]+) dB", output)
    return float(match.group(1)) if match else None


def import_asset(args: argparse.Namespace) -> dict:
    source = Path(args.file).resolve()
    if not source.exists():
        raise RuntimeError(f"audio file not found: {source}")
    library = ROOT / "library" / ("sfx" if args.kind == "sfx" else "music")
    catalog_path = library / "catalog.json"
    output = library / "clips" / f"{args.id}.mp3"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8")) if catalog_path.exists() else {"clips": []}
    existing = next((clip for clip in catalog.get("clips", []) if clip.get("id") == args.id), None)
    if existing and not args.force:
        raise RuntimeError(f"audio id already exists: {args.id}; pass --force to replace it")
    if args.dry_run:
        return {"id": args.id, "output": str(output.relative_to(ROOT)), "source": args.source_url, "license": args.license}
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = output.with_suffix(".tmp.mp3")
    command(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-af", "loudnorm=I=-20:TP=-1.5:LRA=11", "-c:a", "libmp3lame", "-q:a", "2", str(temp)])
    shutil.move(temp, output)
    entry = {
        "id": args.id,
        "file": f"clips/{output.name}",
        "category": args.category,
        "tags": [tag.strip() for tag in args.tags.split(",") if tag.strip()],
        "duration_s": probe(output),
        "peak_dbfs": peak(output),
        "source": args.source_url,
        "license": args.license,
        "prompt": args.discovery_note or "",
        "used_in": [item.strip() for item in args.used_in.split(",") if item.strip()],
    }
    clips = [clip for clip in catalog.get("clips", []) if clip.get("id") != args.id]
    clips.append(entry)
    catalog["clips"] = clips
    catalog_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return entry


def parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--kind", choices=("sfx", "music"), required=True)
    ap.add_argument("--id", required=True, type=safe_id)
    ap.add_argument("--file", required=True)
    ap.add_argument("--source-url", required=True)
    ap.add_argument("--license", required=True)
    ap.add_argument("--category", default="imported")
    ap.add_argument("--tags", default="")
    ap.add_argument("--used-in", default="")
    ap.add_argument("--discovery-note")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    return ap


def main() -> None:
    print(json.dumps(import_asset(parser().parse_args()), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
