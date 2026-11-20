#!/usr/bin/env python3
"""Create a Video Studio project with its assets and render source together."""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOTION_COMIC_STATIC = "motion-comic-static"
MOTION_GRAPHIC_ANIMATED = "motion-graphic-animated"
COMIC_TEMPLATES = (MOTION_COMIC_STATIC, MOTION_GRAPHIC_ANIMATED, "motion-comic")


def slug_value(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    if not slug:
        raise argparse.ArgumentTypeError("slug must contain a letter or number")
    return slug


def pascal(slug: str) -> str:
    return "".join(part.capitalize() for part in slug.split("-"))


def tsx_source(project_id: str, component_id: str, config: dict, template: str,
               narration_audio: str | None, caption_mode: str, comic_art: str | None = None,
               language: str = "en") -> str:
    audio = f"'{narration_audio}'" if narration_audio else "undefined"
    starter_content = ""
    audio_condition = "NARRATION"
    caption_lines = "VO"
    if template == "dawah-clips":
        return f'''import React from 'react';
import {{DawahClip, type DawahClipData}} from '../../../remotion/src/lib/dawah-clips';
import data from './clip.json';

export const compositionConfig = {{
  id: '{component_id}',
  durationInSeconds: {config['durationSec']},
  fps: 30,
  width: 1080,
  height: 1920,
}};

const {component_id}: React.FC = () => <DawahClip data={{data as DawahClipData}} />;
export default {component_id};
'''
    if template == "animation":
        body_import = ("import {AnimationStage} from '../../../remotion/src/lib/animation';\n"
                       "import scene from './animation.json';")
        body = f'<AnimationStage project={{{json.dumps(project_id)}}} scene={{scene}} />'
    elif template == "vector-explainer":
        body_import = "import {VectorExplainerWorld} from './World';"
        body = "<VectorExplainerWorld />"
    elif template == "sticky-notes":
        body_import = "import {StickyNoteWall, parseStickyScene} from '../../../remotion/src/lib/sticky-notes';\nimport scene from './scene.json';"
        body = "<StickyNoteWall scene={parseStickyScene(scene)} />"
    elif template == "company-analysis":
        body_import = "import {CompanyAnalysis, demoAnalysis} from '../../../remotion/src/lib/company-analysis';"
        body = "<CompanyAnalysis data={demoAnalysis} />"
    elif template == "whiteboard":
        body_import = "import {ClassicWhiteboardStarter} from '../../../remotion/src/lib/classic-whiteboard';"
        title = project_id.replace("-", " ").capitalize()
        starter_content = (
            f"const TITLE = {json.dumps(title)};\n"
            "const STEPS = ['Open it', 'Try one step', 'Keep going?'] as const;\n\n"
        )
        body = "<ClassicWhiteboardStarter title={TITLE} steps={STEPS} />"
    elif template in COMIC_TEMPLATES:
        body_import = "import {MotionComic, type ComicDialogue, type MotionComicPage} from '../../../remotion/src/lib/motion-comic';"
        pages = []
        if comic_art:
            panels = [{"at": 0, "art": comic_art, "reveal": "cut"}]
            pages.append({"panels": panels})
        animated = template == MOTION_GRAPHIC_ANIMATED
        template_title = "Motion Graphic Animated" if animated else "Motion Comic Static"
        rigby_note = (
            "// Rigby2D handles performance: a glance, a restrained smile, a slight head turn, or a flag in the wind.\n"
            "// Rig isolated transparent layers over a fixed background. Keep mouths and jaws still during dialogue.\n"
            if animated else "// Static uses Remotion only. Hold grounded poses, cut between actions, and move accents on separate layers.\n"
        )
        starter_content = (
            f"// Follow the {template_title} section in README.md.\n"
            "// Choose a visual layout reference from templates/motion-comic/README.md before planning masks.\n"
            "// Set the final panel crops once per page. Keep unrevealed slots empty and reveal panels on their own cues.\n"
            "// Use cut or fade to reveal a panel in place. A separate page can hold a full-screen shot.\n"
            "// Vary splits, stacks and diagonal masks while giving faces, text and action room to read.\n"
            "// Use Remotion for framing, camera moves, cuts and cinematic effects. Cue them to story beats.\n"
            "// Check the tightest crop in a full-size preview.\n"
            "// List panels in story order and lay out sheet rows in the project's reading direction.\n"
            "// For Arabic, fully vowel dialogue and narration and check names before generating audio.\n"
            "// Get cast sheet approval before generating production sheets.\n"
            "// Split the returned WebPs with tools/split_comic_sheet.py. Add all balloons as Remotion text.\n"
            "// Keep page numbers and production labels off screen.\n"
            "// Play documentary commentary as a separate voice track when a cast track already exists.\n"
            "// Keep the score at one low level through speech and pauses. Fade at cue boundaries only.\n"
            f"{rigby_note}"
            f"const PAGES: MotionComicPage[] = {json.dumps(pages, indent=2)};\n"
            "const DIALOGUE: ComicDialogue[] = [];\n\n"
        )
        body = f'<MotionComic pages={{PAGES}} dialogue={{DIALOGUE}} language="{language}" panelPlayback="accumulate" />'
        audio_condition = "NARRATION && !DIALOGUE.some(({audio}) => audio)"
        caption_lines = "DIALOGUE.length ? DIALOGUE : VO"
    else:
        body_import = "import {ChapterCard, MotionCanvas} from '../../../remotion/src/lib/video';"
        body = f"""<MotionCanvas format=\"{config['mode']}\">
      <ChapterCard kicker=\"INTRODUCTION\" title=\"{project_id.replace('-', ' ')}\" subtitle=\"Replace with the opening thesis\" />
    </MotionCanvas>"""

    return f"""import React from 'react';
import {{Audio, staticFile}} from 'remotion';
{body_import}
import {{CaptionTrack}} from '../../../remotion/src/lib/video';
import type {{VoLine}} from '../../../remotion/src/lib/shorts';

export const compositionConfig = {{
  id: '{component_id}',
  durationInSeconds: {config['durationSec']},
  fps: {config['fps']},
  width: {config['width']},
  height: {config['height']},
}};

{starter_content}const VO: VoLine[] = [];
const NARRATION = {audio};
const CAPTION_MODE = '{caption_mode}';

const {component_id}: React.FC = () => (
  <>
    {body}
    {{{audio_condition} ? <Audio src={{staticFile(NARRATION)}} /> : null}}
    <CaptionTrack lines={{{caption_lines}}} mode={{CAPTION_MODE}} format="{config['mode']}" />
  </>
);

export default {component_id};
"""


def create(args: argparse.Namespace) -> dict:
    root = Path(args.root).resolve()
    template = {"motion-comic": MOTION_COMIC_STATIC, "sticky-note-wall": "sticky-notes"}.get(args.template, args.template)
    is_short = args.format == "short"
    if template in ("vox", "ai-short") and not is_short:
        raise SystemExit(f"{template} requires --format short")
    if template == "vector-explainer" and is_short:
        raise SystemExit("vector-explainer requires --format video; reframe its camera before vertical use")
    if template == "sticky-notes" and is_short:
        raise SystemExit("sticky-notes requires --format video; use its authored horizontal canvas")
    if template == "company-analysis" and is_short:
        raise SystemExit("company-analysis requires --format video (1920x1080)")
    if template == "dawah-clips" and (not is_short or args.narration == "ai"):
        raise SystemExit("dawah-clips requires --format short and recorded or none narration")
    project_id = f"{args.number}-{args.slug}" if args.number is not None else args.slug
    prefix = "short" if is_short else "video"
    project_dir = root / "projects" / project_id
    shot_dir = project_dir / "_source"
    media_dir = project_dir / "assets"
    if project_dir.exists():
        raise SystemExit(f"refusing to overwrite existing project: {project_dir}")

    duration = args.duration if args.duration is not None else (42 if is_short else 10 if template in ("sticky-notes", "vector-explainer", "animation") else 120 if template == "company-analysis" else 300)
    comic_image = getattr(args, "comic_image", None)
    if comic_image and (template not in COMIC_TEMPLATES or not comic_image.is_file()):
        raise SystemExit("--comic-image must be an existing file used with a comic template")
    comic_filename = f"page-01{comic_image.suffix.lower()}" if comic_image else None
    comic_art = f"projects/{project_id}/{comic_filename}" if comic_filename else None
    language = getattr(args, "language", None) or ("ar" if template == "sticky-notes" else "en")
    width, height = ((1080, 1920) if is_short else (1920, 1080))
    narration_audio = None
    if args.narration != "none":
        narration_audio = f"projects/{project_id}/narration.m4a"
    caption_mode = args.captions
    if caption_mode is None:
        caption_mode = "word-highlight" if is_short and args.narration != "none" else "none"

    config = {
        "mode": args.format,
        "width": width,
        "height": height,
        "fps": 30,
        "durationSec": duration,
    }
    beats = {
        "id": project_id,
        "title": args.slug.replace("-", " ").title(),
        "composition": f"{prefix.capitalize()}{pascal(project_id)}",
        "entry": "_source/index.tsx",
        "format": config,
        "template": template,
        "narration": {"mode": args.narration, "audio": narration_audio},
        "captions": {"mode": caption_mode},
        "vo": [],
        "beats": [],
    }
    if template in COMIC_TEMPLATES or template == "sticky-notes":
        beats["language"] = language

    project_dir.mkdir(parents=True)
    shot_dir.mkdir(parents=True)
    media_dir.mkdir()
    (project_dir / "output").mkdir()
    if comic_image and comic_filename:
        shutil.copyfile(comic_image, media_dir / comic_filename)
    (project_dir / "project.json").write_text(json.dumps(beats, indent=2) + "\n", encoding="utf-8")
    (project_dir / "script.md").write_text(
        f"# {beats['title']}\n\n"
        f"Format: {args.format} · Template: {template} · Narration: {args.narration}\n\n"
        "## Outline\n\n- Hook / thesis\n- Development\n- Synthesis / payoff\n",
        encoding="utf-8",
    )
    if template == "vector-explainer":
        shutil.copyfile(ROOT / "templates/vector-explainer/World.tsx", shot_dir / "World.tsx")
        with (project_dir / "script.md").open("a") as script:
            script.write("\nRead templates/vector-explainer/README.md before adapting the scene.\n"
                         "Edit this project's World.tsx for new art, camera cues and independent motion.\n"
                         "The starter scales its 10-second visual timeline to the chosen duration.\n")
    if template == "sticky-notes":
        scene = json.loads((ROOT / "templates/sticky-notes/starter.json").read_text())
        scene["duration"] = duration
        scene["direction"] = "rtl" if language == "ar" else "ltr"
        if language == "en":
            for note, lines in zip(scene["notes"], (("One idea", "Start here"), ("One clear step", "Connect the ideas"))):
                for cue, text in zip(note["lines"], lines):
                    cue["text"] = text
            for item in [*scene["notes"], *scene["camera"]]:
                item["x"] = 3200 - item["x"]
            for link in scene["links"]:
                for point in link.get("points", [link.get("from"), link.get("to")]):
                    if point is not None:
                        point[0] = 3200 - point[0]
        (shot_dir / "scene.json").write_text(json.dumps(scene, ensure_ascii=False, indent=2) + "\n")
        with (project_dir / "script.md").open("a") as script:
            script.write("\nRead templates/sticky-notes/README.md and REFERENCE.txt first.\n"
                         "Reuse the shared kit; author content in the shot's scene.json.\n"
                         "The starter is silent illustrative timing, not aligned narration.\n")
    if template == "animation":
        (shot_dir / "animation.json").write_text('{"layers": []}\n',encoding="utf-8")
    guides = {"animation": "animation", "vox": "vox", "ai-short": "ai-short", "lines-anime": "lines-anime",
              "memphis-group": "memphis-group"}
    if template in guides:
        guide = "DESIGN.md" if template == "vox" else "IDEAS.md" if template == "ai-short" else "README.md"
        with (project_dir / "script.md").open("a", encoding="utf-8") as script:
            script.write(f"\nTemplate guide: ../../templates/{guides[template]}/{guide}\n")
    component_id = beats["composition"]
    (shot_dir / "index.tsx").write_text(
        tsx_source(project_id, component_id, config, template, narration_audio, caption_mode, comic_art, language),
        encoding="utf-8",
    )
    if template == "dawah-clips":
        (shot_dir / "clip.json").write_text(json.dumps({
            "title": "عنوان المقطع", "captionMode": "none", "captions": [], "emphasis": [],
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        beats["language"] = "ar"
        beats["narration"] = {"mode": args.narration, "audio": None, "embedded": True}
        beats["captions"] = {"mode": "none"}
        (project_dir / "project.json").write_text(json.dumps(beats, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {
        "id": project_id,
        "project": str(project_dir.relative_to(root)),
        "composition": str(shot_dir.relative_to(root)),
        "media": str(media_dir.relative_to(root)),
    }


def parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--format", choices=("short", "video"), required=True)
    ap.add_argument("--template", choices=("motion", "whiteboard", "company-analysis", "dawah-clips", "sticky-notes", "sticky-note-wall", "vector-explainer", "animation", "vox", "ai-short", "lines-anime", "memphis-group", *COMIC_TEMPLATES), default="motion",
                    help="motion-comic is a legacy alias for motion-comic-static")
    ap.add_argument("--comic-image", type=Path, help="initial page image for either comic template")
    ap.add_argument("--language", choices=("ar", "en"), help="reading language (sticky-notes defaults to ar; other templates to en)")
    ap.add_argument("--narration", choices=("ai", "recorded", "none"), default="none")
    ap.add_argument("--captions", choices=("none", "subtitles", "word-highlight"))
    ap.add_argument("--slug", required=True, type=slug_value)
    ap.add_argument("--duration", type=float)
    ap.add_argument("--number", type=int)
    ap.add_argument("--root", default=str(ROOT), help=argparse.SUPPRESS)
    return ap


def main() -> None:
    args = parser().parse_args()
    print(json.dumps(create(args), indent=2))


if __name__ == "__main__":
    main()
