"""Apply the reference pause cut and pace, then timestamp the edited Arabic audio."""

import argparse
import json
import re
import subprocess
from pathlib import Path


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def prepare(source: Path, output: Path) -> int:
    duration = float(run(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(source),
    ).stdout)
    detection = run(
        "ffmpeg", "-hide_banner", "-i", str(source),
        "-af", "silencedetect=noise=-42dB:d=0.34", "-f", "null", "-",
    ).stderr
    silences = re.findall(r"silence_start: ([\d.]+).*?silence_end: ([\d.]+)", detection, re.S)
    cuts = []
    for left, right in silences:
        start, end = float(left), min(float(right), duration)
        if start < 0.03:
            cut = 0, max(0, end - 0.22)
        elif end >= duration - 0.03:
            cut = min(end, start + 0.40), duration
        else:
            margin = (end - start) * 0.15
            cut = start + margin, end - margin
        cuts.append(cut)

    pieces = []
    cursor = 0
    for start, end in cuts:
        if start > cursor:
            pieces.append((cursor, start))
        cursor = end
    if cursor < duration:
        pieces.append((cursor, duration))
    if not pieces:
        raise SystemExit("The recording has no audio outside the detected silence.")

    filters = [
        f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[s{index}]"
        for index, (start, end) in enumerate(pieces)
    ]
    inputs = "".join(f"[s{index}]" for index in range(len(pieces)))
    filters.append(
        f"{inputs}concat=n={len(pieces)}:v=0:a=1,"
        "atempo=1.10,loudnorm=I=-16:TP=-2:LRA=9,aresample=48000[out]"
    )
    subprocess.run([
        "ffmpeg", "-y", "-v", "error", "-i", str(source),
        "-filter_complex", ";".join(filters), "-map", "[out]",
        "-c:a", "aac", "-b:a", "192k", str(output),
    ], check=True)
    return len(cuts)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", type=Path)
    parser.add_argument("recording", type=Path)
    args = parser.parse_args()

    from faster_whisper import WhisperModel

    output = args.project / "assets/narration.m4a"
    if args.recording.resolve() == output.resolve():
        parser.error("Use the unedited recording as input, separate from assets/narration.m4a")
    model = WhisperModel("medium", device="cpu", compute_type="int8", local_files_only=True, cpu_threads=8)
    cuts = prepare(args.recording, output)
    segments, _ = model.transcribe(str(output), language="ar", word_timestamps=True, beam_size=3)
    alignment = [
        {
            "start": segment.start, "end": segment.end, "text": segment.text,
            "words": [
                {"word": word.word.strip(), "start": word.start, "end": word.end}
                for word in segment.words
            ],
        }
        for segment in segments
    ]
    (args.project / "_source/alignment.json").write_text(
        json.dumps(alignment, indent=2, ensure_ascii=False) + "\n", encoding="utf-8",
    )
    print(f"Shortened {cuts} pauses and aligned {len(alignment)} segments.")


if __name__ == "__main__":
    main()
