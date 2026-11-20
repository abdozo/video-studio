#!/usr/bin/env python3
"""Import transcripts, review contextual clip selections, and build recorded Shorts."""
from __future__ import annotations

import argparse
import html
import json
import math
import re
import subprocess
import shutil
import tempfile
from pathlib import Path

from tools.create_project import ROOT, create, parser as project_parser


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"))


def write_json(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def seconds(value):
    value = float(value)
    if not math.isfinite(value) or value < 0:
        raise ValueError("Times must be finite and nonnegative")
    return value


def validate_segments(segments):
    previous = 0.0
    for seg in segments:
        seg["start"], seg["end"] = seconds(seg["start"]), seconds(seg["end"])
        if seg["start"] < previous or seg["end"] <= seg["start"] or not seg["text"].strip():
            raise ValueError("Transcript segments must be ordered, nonoverlapping, and nonempty")
        previous = seg["end"]
        word_end = seg["start"]
        words = seg.get("words", [])
        for word in words:
            word["start"], word["end"] = seconds(word["start"]), seconds(word["end"])
            if not word["text"].strip() or not word_end <= word["start"] < word["end"] <= seg["end"]:
                raise ValueError("Word times must be ordered and contained within their segment")
            word_end = word["end"]
        if words and "".join("".join(w["text"].split()) for w in words) != "".join(seg["text"].split()):
            raise ValueError("Word text must reproduce segment text exactly apart from whitespace")
    return segments


def load_transcript(path):
    path = Path(path)
    if path.suffix.lower() == ".json":
        data = read_json(path)
        segments = data if isinstance(data, list) else data["segments"]
    elif path.suffix.lower() == ".srt":
        def timestamp(s):
            h, m, sec = s.replace(",", ".").split(":")
            return int(h) * 3600 + int(m) * 60 + float(sec)
        segments = []
        for block in re.split(r"\n\s*\n", path.read_text(encoding="utf-8-sig").strip()):
            lines = block.splitlines()
            timing = next((i for i, line in enumerate(lines) if "-->" in line), None)
            if timing is None:
                raise ValueError("Invalid SRT block")
            start, end = lines[timing].split("-->")
            segments.append({"start": timestamp(start.strip()), "end": timestamp(end.strip()),
                             "text": html.unescape(re.sub(r"<[^>]+>", "", " ".join(lines[timing + 1:])))})
    else:
        return {"text": path.read_text(encoding="utf-8-sig"), "segments": []}
    return {"segments": validate_segments(segments)}


def init(args):
    output = args.output.resolve()
    if output.exists():
        raise ValueError(f"Refusing to overwrite {output}")
    if not args.video.is_file():
        raise ValueError("A local source video is required")
    transcript = load_transcript(args.transcript)
    output.mkdir(parents=True)
    write_json(output / "transcript.json", transcript)
    write_json(output / "clips.json", {
        "version": 1, "source": {"video": str(args.video.resolve()), "url": args.url, "speaker": args.speaker},
        "transcript": "transcript.json", "clips": [],
    })
    print(f"Imported into {output}. Author selections in clips.json, then run review.")


def keep_ranges(clip):
    return clip["keep"] if "keep" in clip else [{"start": clip["start"], "end": clip["end"]}]


def output_window(clip, start, end):
    offset = 0.0
    for window in keep_ranges(clip):
        if window["start"] <= start and end <= window["end"]:
            return offset + start - window["start"], offset + end - window["start"]
        offset += window["end"] - window["start"]
    raise ValueError("Cue or segment crosses an omitted boundary; split and review it first")


def selected_segments(clip, segments):
    return [s for w in keep_ranges(clip) for s in segments if s["start"] < w["end"] and s["end"] > w["start"]]


def clip_duration(clip):
    return sum(w["end"] - w["start"] for w in keep_ranges(clip))


def load_plan(path):
    plan = read_json(path)
    transcript = read_json(path.parent / plan["transcript"])
    segments = validate_segments(transcript["segments"])
    seen = set()
    for clip in plan["clips"]:
        slug = clip["slug"]
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or slug in seen:
            raise ValueError("Clip slugs must be unique lowercase ASCII slugs")
        seen.add(slug)
        if "keep" in clip:
            if not clip["keep"]:
                raise ValueError("keep must contain at least one range")
            accepted = []
            for window in clip["keep"]:
                window["start"], window["end"] = seconds(window["start"]), seconds(window["end"])
                if window["end"] <= window["start"]:
                    raise ValueError("Keep ranges require start < end")
                if any(window["start"] < other["end"] and window["end"] > other["start"] for other in accepted):
                    raise ValueError("Keep ranges must be nonoverlapping; list them in story order")
                accepted.append(window)
                frames = (window["end"] - window["start"]) * 30
                if len(clip["keep"]) > 1 and not math.isclose(frames, round(frames), abs_tol=1e-6):
                    raise ValueError("Each internal keep range must last a whole number of 30 fps frames")
            bounds = min(w["start"] for w in accepted), max(w["end"] for w in accepted)
            if ("start" in clip and seconds(clip["start"]) != bounds[0]) or ("end" in clip and seconds(clip["end"]) != bounds[1]):
                raise ValueError("start/end must match the outer bounds of keep")
            clip["start"], clip["end"] = bounds
        start, end = seconds(clip["start"]), seconds(clip["end"])
        clip["start"], clip["end"] = start, end
        if end <= start or not clip["title"].strip():
            raise ValueError("Each clip needs a title and start < end")
        if not segments or not any(s["start"] < end and s["end"] > start for s in segments):
            raise ValueError("A clip needs a timed transcript; align untimed text first")
        mode = clip.get("captionMode", "subtitles")
        if mode not in ("none", "subtitles", "word-highlight") or clip.get("fit", "contain") not in ("contain", "cover"):
            raise ValueError("Invalid captionMode or fit")
        if not 0 <= float(clip.get("position", 50)) <= 100:
            raise ValueError("position must be a percentage between 0 and 100")
        if len(clip["title"]) > 65:
            raise ValueError("Keep clip titles within 65 characters for the vertical layout")
        # Do not silently clip a sentence or discard words at an authored cut.
        selected = selected_segments(clip, segments)
        for window in keep_ranges(clip):
            rows = [s for s in selected if s["start"] < window["end"] and s["end"] > window["start"]]
            if not rows:
                raise ValueError("Each keep range needs transcript coverage")
            if any(s["start"] < window["start"] or s["end"] > window["end"] for s in rows):
                raise ValueError("Cuts must include whole transcript segments; split and review the transcript first")
        if mode == "word-highlight" and any(not s.get("words") for s in selected):
            raise ValueError("word-highlight requires real word timestamps for every selected segment")
        if mode != "none" and any(not s.get("words") and (len(s["text"]) > 75 or len(s["text"].split()) > 10) for s in selected):
            raise ValueError("Split long subtitle segments into short, accurately timed phrases first")
        emphasis_end = 0
        for cue in clip.get("emphasis", []):
            if cue["kind"] not in ("quote", "summary", "label") or not cue["text"].strip():
                raise ValueError("Emphasis needs text and kind quote, summary or label")
            if len(cue["text"]) > 65:
                raise ValueError("Keep emphasis within 65 characters")
            if cue.get("animation", "rise") not in ("rise", "slide", "unfold", "stamp") or cue.get("paper", "torn") not in ("torn", "note", "strip"):
                raise ValueError("Invalid paper animation or paper style")
            cue["start"], cue["end"] = seconds(cue["start"]), seconds(cue["end"])
            if not start <= seconds(cue["start"]) < seconds(cue["end"]) <= end:
                raise ValueError("Emphasis uses absolute source times inside its clip")
            mapped_start, mapped_end = output_window(clip, cue["start"], cue["end"])
            if mapped_start < emphasis_end:
                raise ValueError("Paper cues must be nonoverlapping and listed in output story order")
            emphasis_end = mapped_end
            if cue["kind"] == "quote":
                spoken = " ".join(s["text"] for s in selected)
                if " ".join(cue["text"].split()) not in " ".join(spoken.split()):
                    raise ValueError("A quote must occur verbatim in the selected transcript")
        visual_mode = clip.get("visualMode", "speaker")
        if visual_mode not in ("speaker", "stick", "stock", "mixed"):
            raise ValueError("Invalid visualMode")
        previous_end = 0
        for cue in clip.get("cutaways", []):
            cue["start"], cue["end"] = seconds(cue["start"]), seconds(cue["end"])
            if cue["end"] <= cue["start"]:
                raise ValueError("Cutaways require start < end")
            mapped_start, mapped_end = output_window(clip, cue["start"], cue["end"])
            if mapped_start < previous_end:
                raise ValueError("Cutaways must be nonoverlapping and listed in output story order")
            previous_end = mapped_end
            kind = cue["kind"]
            if kind not in ("stick", "image", "video") or visual_mode == "speaker" or (visual_mode == "stick" and kind != "stick") or (visual_mode == "stock" and kind == "stick"):
                raise ValueError("Cutaway kind must match visualMode")
            if kind == "stick":
                if cue.get("scene") not in ("prayer", "regret", "hope"):
                    raise ValueError("Stick scene must be prayer, regret or hope")
            else:
                if cue.get("fit", "contain") not in ("contain", "cover"):
                    raise ValueError("Invalid stock fit")
                for field in ("file", "sourceUrl", "licenseUrl", "creator", "license"):
                    if not isinstance(cue.get(field), str) or not cue[field].strip():
                        raise ValueError(f"Stock cutaway requires {field}")
                asset = Path(cue["file"])
                if not asset.is_absolute():
                    asset = path.parent / asset
                if not asset.is_file():
                    raise ValueError(f"Stock asset not found: {asset}")
                extensions = (".png", ".jpg", ".jpeg", ".webp", ".svg", ".avif") if kind == "image" else (".mp4", ".mov", ".webm", ".mkv", ".m4v")
                if asset.suffix.lower() not in extensions:
                    raise ValueError("Unsupported stock file format")
                cue["file"] = str(asset.resolve())
                cue["offset"] = seconds(cue.get("offset", 0))
    return plan, segments


def local_data(plan, clip, segments, video):
    captions = []
    for seg in selected_segments(clip, segments):
        # Split word-aligned captions at five words; segment-only subtitles stay authored.
        words = seg.get("words", [])
        groups = [words[i:i + 5] for i in range(0, len(words), 5)] if words else []
        if groups:
            for group in groups:
                window = output_window(clip, group[0]["start"], group[-1]["end"])
                captions.append({"start": window[0], "end": window[1],
                                 "text": " ".join(w["text"] for w in group),
                                 "words": [{**w, "start": output_window(clip, w["start"], w["end"])[0], "end": output_window(clip, w["start"], w["end"])[1]} for w in group]})
        else:
            window = output_window(clip, seg["start"], seg["end"])
            captions.append({"start": window[0], "end": window[1], "text": seg["text"]})
    def mapped(cue):
        window = output_window(clip, cue["start"], cue["end"])
        return {**cue, "start": window[0], "end": window[1]}
    return {"video": video, "title": clip["title"], "speaker": plan["source"].get("speaker", ""),
            "fit": clip.get("fit", "cover"), "position": clip.get("position", 50),
            "visualMode": clip.get("visualMode", "speaker"),
            "captionMode": clip.get("captionMode", "word-highlight" if captions and all(c.get("words") for c in captions) else "subtitles"), "captions": captions,
            "emphasis": [mapped(c) for c in clip.get("emphasis", [])],
            "cutaways": [mapped(c) for c in clip.get("cutaways", [])]}


def review(args):
    plan, segments = load_plan(args.plan)
    lines = ["# Dawah clip review", "", f"Source: {plan['source'].get('url', '')}", ""]
    for clip in plan["clips"]:
        start, end = clip["start"], clip["end"]
        lines += [f"## {clip['slug']} · {clip['title']}", "", f"{start:.3f}–{end:.3f}s source · {clip_duration(clip):.3f}s output", "",
                  clip.get("reason", "No selection rationale recorded."), "", "### Context before", ""]
        before = [s for s in segments if s["end"] <= start][-2:]
        selected = selected_segments(clip, segments)
        after = [s for s in segments if s["start"] >= end][:2]
        lines += [" ".join(s["text"] for s in before) or "Beginning of transcript.", "", "### Selected", "",
                  " ".join(s["text"] for s in selected), "", "### Context after", "",
                  " ".join(s["text"] for s in after) or "End of transcript.", "",
                  "Checks: complete meaning, conditions/exceptions, opening/ending by ear, religious quotations, framing and captions.", "",
                  f"Review: {json.dumps(clip.get('review', {}), ensure_ascii=False)}", ""]
        lines += ["### Internal edit", "", json.dumps(keep_ranges(clip)), "", "Omitted text inside source bounds:", "",
                  " ".join(s["text"] for s in segments if start <= s["start"] and s["end"] <= end and s not in selected) or "None", "",
                  "### Cutaways", "", json.dumps(clip.get("cutaways", []), ensure_ascii=False, indent=2), ""]
        for i, window in enumerate(keep_ranges(clip), 1):
            a, b = window["start"], window["end"]
            out_a, out_b = output_window(clip, a, b)
            rows = [s for s in segments if s["start"] < b and s["end"] > a]
            before = [s for s in segments if s["end"] <= a][-2:]
            after = [s for s in segments if s["start"] >= b][:2]
            lines += [f"### Part {i}: source {a:.3f}–{b:.3f}s → output {out_a:.3f}–{out_b:.3f}s", "",
                      f"Role: {window.get('role', 'Not recorded')} · Reason: {window.get('reason', 'Not recorded')}", "",
                      "Before: " + " ".join(s["text"] for s in before), "",
                      "Kept: " + " ".join(s["text"] for s in rows), "",
                      "After: " + " ".join(s["text"] for s in after), ""]
    output = args.plan.parent / "review.md"
    output.write_text("\n".join(lines), encoding="utf-8")
    print(output)


def transcribe(args):
    """Produce a draft only; never overwrite the owner's supplied transcript."""
    from tools.prepare_narration import whisper_words
    if args.output.exists():
        raise ValueError("Refusing to overwrite transcript output")
    words, rows = whisper_words(args.video, args.model, "ar")
    segments = [{**row, "words": [{"text": w["word"], "start": w["start"], "end": w["end"]}
                                  for w in words if row["start"] <= w["start"] < row["end"]]} for row in rows]
    validate_segments(segments)
    write_json(args.output, {"status": "draft-needs-review", "segments": segments})
    print(f"Draft only: {args.output}. Compare with the supplied transcript and listen before use.")


def align(args):
    """Use the shared local forced aligner on reviewed phrase windows."""
    from tools.prepare_narration import force_align_segments
    if args.output.exists():
        raise ValueError("Refusing to overwrite alignment output")
    segments = load_transcript(args.transcript)["segments"]
    if not segments:
        raise ValueError("align requires reviewed timed phrase segments, not plain text")
    with tempfile.TemporaryDirectory(prefix="dawah-align-") as tmp:
        windows = Path(tmp) / "windows.json"
        write_json(windows, segments)
        words = force_align_segments(args.video, " ".join(s["text"] for s in segments), args.model, "ar", windows)
    for seg in segments:
        seg["words"] = [{"text": w["word"], "start": w["start"], "end": w["end"]}
                        for w in words if seg["start"] <= w["start"] < seg["end"]]
        if not seg["words"]:
            raise ValueError("Alignment returned no words for a segment; review the window")
    validate_segments(segments)
    write_json(args.output, {"status": "aligned-needs-listening-review", "segments": segments})
    print(args.output)


def export(args):
    plan, segments = load_plan(args.plan)
    selected = [c for c in plan["clips"] if c.get("review", {}).get("approved") is True]
    if not selected:
        raise ValueError("No approved clips. Review selections before export")
    video = Path(plan["source"]["video"])
    if not video.is_absolute():
        video = args.plan.parent / video
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(video)], check=True, capture_output=True, text=True)
    info = json.loads(probe.stdout)
    if not all(any(s["codec_type"] == t for s in info["streams"]) for t in ("video", "audio")):
        raise ValueError("Source must contain both video and the speaker's audio")
    for clip in selected:
        if clip["end"] > float(info["format"]["duration"]):
            raise ValueError("Clip exceeds source duration")
        if not all(clip["review"].get(k) is True for k in ("context", "listened", "text")):
            raise ValueError("Approved clips need context, listened and text review flags")
        if (ROOT / "projects" / clip["slug"]).exists():
            raise ValueError(f"A Short with slug {clip['slug']} already exists; choose a new slug")
        for cue in clip.get("cutaways", []):
            if cue["kind"] == "video":
                stock_probe = subprocess.run(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", cue["file"]], check=True, capture_output=True, text=True)
                stock = json.loads(stock_probe.stdout)
                if not any(s["codec_type"] == "video" for s in stock["streams"]):
                    raise ValueError("Video cutaway must contain a video stream")
                if cue["offset"] + cue["end"] - cue["start"] > float(stock["format"]["duration"]):
                    raise ValueError("Stock video is shorter than its cutaway window")
    for clip in selected:
        with tempfile.TemporaryDirectory(prefix="dawah-cut-") as tmp:
            target = Path(tmp) / "source-clip.mp4"
            filters = []
            for i, window in enumerate(keep_ranges(clip)):
                a, b = window["start"], window["end"]
                filters += [f"[0:v:0]trim=start={a}:end={b},setpts=PTS-STARTPTS,fps=30,format=yuv420p[v{i}]",
                            f"[0:a:0]atrim=start={a}:end={b},asetpts=PTS-STARTPTS[a{i}]"]
            inputs = "".join(f"[v{i}][a{i}]" for i in range(len(keep_ranges(clip))))
            filters.append(f"{inputs}concat=n={len(keep_ranges(clip))}:v=1:a=1[v][a]")
            subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-n", "-i", str(video),
                            "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
                            "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p",
                            "-c:a", "aac", "-movflags", "+faststart", str(target)], check=True)
            ns = project_parser().parse_args(["--format", "short", "--template", "dawah-clips", "--narration", "recorded",
                                             "--slug", clip["slug"], "--duration", str(clip_duration(clip)), "--root", str(ROOT)])
            result = create(ns)
            shutil.move(str(target), ROOT / result["media"] / "source-clip.mp4")
        static_video = f"projects/{result['id']}/source-clip.mp4"
        data = local_data(plan, clip, segments, static_video)
        for i, cue in enumerate(data["cutaways"]):
            if cue["kind"] == "stick":
                continue
            asset = Path(cue.pop("file"))
            name = f"cutaway-{i + 1}{asset.suffix.lower()}"
            shutil.copyfile(asset, ROOT / result["media"] / name)
            cue["src"] = f"projects/{result['id']}/{name}"
        shot_dir = ROOT / result["composition"]
        write_json(shot_dir / "clip.json", data)
        beats_path = ROOT / result["project"] / "project.json"
        beats = read_json(beats_path)
        beats.update(title=clip["title"], source={**plan["source"], "start": clip["start"], "end": clip["end"], "keep": keep_ranges(clip), "review": clip["review"]},
                     narration={"mode": "recorded", "audio": static_video, "embedded": True},
                     captions={"mode": data["captionMode"]},
                     vo=[{**c, "words": [{"w": w["text"], "start": w["start"], "end": w["end"]} for w in c.get("words", [])]}
                         for c in data["captions"]], beats=data["emphasis"],
                     visualMode=data["visualMode"], cutaways=data["cutaways"])
        write_json(beats_path, beats)
        print(json.dumps(result))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sub = ap.add_subparsers(dest="command", required=True)
    imp = sub.add_parser("init")
    imp.add_argument("--video", type=Path, required=True)
    imp.add_argument("--transcript", type=Path, required=True)
    imp.add_argument("--output", type=Path, required=True)
    imp.add_argument("--url", default="")
    imp.add_argument("--speaker", default="")
    for name in ("review", "export"):
        sub.add_parser(name).add_argument("--plan", type=Path, required=True)
    for name in ("transcribe", "align"):
        command = sub.add_parser(name)
        command.add_argument("--video", type=Path, required=True)
        command.add_argument("--output", type=Path, required=True)
        command.add_argument("--model", default="small", help="local faster-whisper model name or path")
        if name == "align":
            command.add_argument("--transcript", type=Path, required=True)
    args = ap.parse_args()
    try:
        {"init": init, "review": review, "transcribe": transcribe, "align": align, "export": export}[args.command](args)
    except (ValueError, KeyError, OSError, RuntimeError, ImportError, subprocess.CalledProcessError) as exc:
        ap.exit(1, f"dawah-clips: {exc}\n")


if __name__ == "__main__":
    main()
