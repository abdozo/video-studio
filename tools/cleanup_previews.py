#!/usr/bin/env python3
"""Report or remove retired Style Atlas preview files."""
import argparse
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ATLAS_RUNS = (
    "atlas-full-references", "atlas-original-references",
    "atlas-key-comparison", "atlas-key-comparison-v2",
    "flat-vector-science-test", "watercolor-wash-test", "shadow-puppet-theatre-test",
    "whiteboard-explainer-test", "psychedelic-poster-test", "tech-glow-explainer-test",
    "papercraft-models-test",
)
PREVIEW_SUFFIXES = {".mp4", ".png", ".jpg", ".jpeg", ".webp"}


class GalleryLinks(HTMLParser):
    def __init__(self, gallery):
        super().__init__()
        self.gallery = gallery
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in {"src", "poster", "href", "data-source-video"} or not value:
                continue
            url = urlsplit(value)
            if not url.scheme and not url.netloc and url.path:
                self.paths.add((self.gallery.parent / unquote(url.path)).resolve())


def retired_previews(root):
    root = root.resolve()
    gallery = root / "templates/STYLE-ATLAS.html"
    parser = GalleryLinks(gallery)
    parser.feed(gallery.read_text(encoding="utf-8"))
    projects = root / "projects"
    if projects.is_symlink() or not any(path.is_relative_to(projects) for path in parser.paths):
        raise ValueError("Cannot verify the local gallery and projects directory.")

    for run in ATLAS_RUNS:
        project = projects / run
        directory = project / "output"
        if project.is_symlink() or directory.is_symlink() or not directory.is_dir():
            continue
        if any(path.is_relative_to(directory) for path in parser.paths):
            continue
        for path in sorted(directory.iterdir()):
            if path.suffix.lower() in PREVIEW_SUFFIXES and not path.is_symlink() and path.is_file():
                yield path


def human_size(size):
    return f"{size / (1024 ** 2):,.1f} MiB"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Remove the files listed by a dry run.")
    args = parser.parse_args()

    candidates = [(path, path.stat().st_size) for path in retired_previews(ROOT)]
    totals = defaultdict(int)
    for path, size in candidates:
        totals[path.parent.parent.name] += size

    for project, size in totals.items():
        print(f"{human_size(size):>12}  projects/{project}/output")
    print(f"{len(candidates)} retired preview files, {human_size(sum(totals.values()))} total.")

    if args.apply:
        for path, _ in candidates:
            path.unlink()
        print(f"Removed {len(candidates)} retired preview files.")
    else:
        print("Dry run. Re-run with --apply to remove the listed files.")


if __name__ == "__main__":
    main()
