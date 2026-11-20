#!/usr/bin/env python3
"""Prepare AI, recorded, or transcript-only narration for a Remotion project."""

from __future__ import annotations

import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import wave
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import fcntl

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL = "gemini-3.1-flash-tts-preview"
DEFAULT_VOICE = "Charon"
DEFAULT_ALIGN_MODEL = "base.en"
DEFAULT_GEMINI_RPD_LIMIT = 10
DEFAULT_GEMINI_DAILY_RESERVE = 1
DEFAULT_GEMINI_MIN_INTERVAL_SECONDS = 31.0
GEMINI_QUOTA_TIMEZONE = ZoneInfo("America/Los_Angeles")
GEMINI_QUOTA_STATE = ROOT / ".cache" / "gemini-tts-quota.json"


class GeminiQuotaError(RuntimeError):
    """Raised before a Gemini request would consume the configured safety margin."""


class GeminiFreeTierGuard:
    """Locally pace and count Gemini TTS attempts against free-tier limits.

    Google applies quotas per project, so requests made outside this repository cannot be
    discovered automatically. ``used_today_baseline`` lets the caller reserve those too.
    Every attempt is recorded before the network call because failed requests can count.
    """

    def __init__(self, model: str, *, state_path: Path = GEMINI_QUOTA_STATE,
                 rpd_limit: int = DEFAULT_GEMINI_RPD_LIMIT,
                 daily_reserve: int = DEFAULT_GEMINI_DAILY_RESERVE,
                 used_today_baseline: int = 0,
                 min_interval_seconds: float = DEFAULT_GEMINI_MIN_INTERVAL_SECONDS,
                 now=None, sleeper=None) -> None:
        self.model = model
        self.state_path = state_path
        self.rpd_limit = rpd_limit
        self.daily_reserve = daily_reserve
        self.used_today_baseline = used_today_baseline
        self.min_interval_seconds = min_interval_seconds
        self.now = now or (lambda: datetime.now(timezone.utc))
        self.sleeper = sleeper or time.sleep
        if self.rpd_limit < 1 or self.daily_reserve < 0:
            raise ValueError("Gemini quota limits must be positive")
        if self.daily_budget < 1:
            raise ValueError("Gemini daily reserve must be smaller than the RPD limit")

    @property
    def daily_budget(self) -> int:
        return self.rpd_limit - self.daily_reserve

    def _load(self, handle) -> dict:
        handle.seek(0)
        raw = handle.read().strip()
        if not raw:
            return {"models": {}}
        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise GeminiQuotaError(f"Gemini quota state is invalid: {self.state_path}") from exc
        return data if isinstance(data, dict) else {"models": {}}

    def _timestamps(self, data: dict, now: datetime) -> list[datetime]:
        models = data.setdefault("models", {})
        raw = models.setdefault(self.model, [])
        parsed: list[datetime] = []
        for value in raw:
            try:
                stamp = datetime.fromisoformat(value)
                if stamp.tzinfo is None:
                    stamp = stamp.replace(tzinfo=timezone.utc)
                if (now - stamp).total_seconds() < 172800:
                    parsed.append(stamp)
            except (TypeError, ValueError):
                continue
        parsed.sort()
        return parsed

    def _today_count(self, timestamps: list[datetime], now: datetime) -> int:
        today = now.astimezone(GEMINI_QUOTA_TIMEZONE).date()
        return sum(stamp.astimezone(GEMINI_QUOTA_TIMEZONE).date() == today for stamp in timestamps)

    def preflight(self, planned_requests: int) -> None:
        """Fail before a run starts if its minimum request count cannot fit today."""
        if planned_requests <= 0:
            return
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = self.state_path.with_suffix(self.state_path.suffix + ".lock")
        with lock_path.open("a+", encoding="utf-8") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            with self.state_path.open("a+", encoding="utf-8") as state:
                now = self.now()
                used = self._today_count(self._timestamps(self._load(state), now), now)
        available = self.daily_budget - self.used_today_baseline - used
        if planned_requests > available:
            raise GeminiQuotaError(
                f"Gemini free-tier guard stopped before generation: {planned_requests} new TTS "
                f"request(s) are needed, but only {max(0, available)} remain in today's safe "
                f"budget ({self.daily_budget}/{self.rpd_limit}, resetting at midnight Pacific). "
                "Reuse cached lines, wait for the reset, or choose recorded/none narration."
            )

    def reserve_request(self) -> None:
        """Wait for RPM headroom, then durably count one request attempt."""
        self.state_path.parent.mkdir(parents=True, exist_ok=True)
        lock_path = self.state_path.with_suffix(self.state_path.suffix + ".lock")
        with lock_path.open("a+", encoding="utf-8") as lock:
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            with self.state_path.open("a+", encoding="utf-8") as state:
                data = self._load(state)
                now = self.now()
                timestamps = self._timestamps(data, now)
                if timestamps:
                    wait = self.min_interval_seconds - (now - timestamps[-1]).total_seconds()
                    if wait > 0:
                        print(f"Gemini free-tier guard: waiting {wait:.1f}s for RPM headroom")
                        self.sleeper(wait)
                        now = self.now()
                        timestamps = self._timestamps(data, now)
                used = self._today_count(timestamps, now) + self.used_today_baseline
                if used >= self.daily_budget:
                    raise GeminiQuotaError(
                        f"Gemini free-tier guard stopped at {used}/{self.daily_budget} safe daily "
                        f"requests ({self.rpd_limit} provider limit; reset is midnight Pacific)."
                    )
                timestamps.append(now)
                data.setdefault("models", {})[self.model] = [stamp.isoformat() for stamp in timestamps]
                state.seek(0)
                state.truncate()
                json.dump(data, state, indent=2)
                state.write("\n")
                state.flush()
                os.fsync(state.fileno())


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    path = ROOT / ".env"
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip().strip('"').strip("'")
    return {**env, **os.environ}


def run(command: list[str]) -> str:
    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if result.returncode:
        raise RuntimeError(f"command failed: {' '.join(command)}\n{result.stdout}")
    return result.stdout


def duration(path: Path) -> float:
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)]).strip())


def delivery_and_transcript(line: dict) -> tuple[str, str]:
    source = line.get("tts") or line["text"]
    directions = [tag.strip() for tag in re.findall(r"\[([^]]+)]", source) if tag.strip()]
    clean = re.sub(r"\s*\[[^]]+]\s*", " ", source)
    clean = re.sub(r"\s+", " ", clean).strip()
    # Caption text is authoritative when old ElevenLabs tags were mixed into `tts`.
    transcript = line.get("text", clean).strip()
    return ", ".join(directions), transcript


def normalize_word(word: str) -> str:
    normalized = word.lower().replace("’", "'").translate(str.maketrans("أإآٱى", "ااااي"))
    return "".join(char for char in normalized if char.isalnum() or char == "'")


def estimate_words(text: str, start: float, end: float) -> list[dict]:
    words = text.split()
    if not words:
        return []
    weights = [max(2, len(normalize_word(word))) + 1.6 for word in words]
    total = sum(weights)
    cursor = start
    output = []
    for word, weight in zip(words, weights):
        word_end = cursor + (end - start) * weight / total
        output.append({"w": word, "start": round(cursor, 3), "end": round(word_end, 3)})
        cursor = word_end
    return output


def map_words(text: str, recognized: list[dict], start: float = 0.0,
              end: float | None = None) -> tuple[list[dict], float]:
    authored = text.split()
    a_norm = [normalize_word(word) for word in authored]
    r_norm = [normalize_word(word["word"]) for word in recognized]
    matcher = difflib.SequenceMatcher(a=a_norm, b=r_norm, autojunk=False)
    mapped: list[dict | None] = [None] * len(authored)
    matched = 0
    for block in matcher.get_matching_blocks():
        for offset in range(block.size):
            ai, ri = block.a + offset, block.b + offset
            mapped[ai] = {
                "w": authored[ai],
                "start": round(start + float(recognized[ri]["start"]), 3),
                "end": round(start + float(recognized[ri]["end"]), 3),
            }
            matched += 1
    coverage = matched / max(1, len(authored))
    fallback_end = end if end is not None else (start + float(recognized[-1]["end"]) if recognized else start + max(1, len(authored)) * .35)
    index = 0
    previous_end = start
    while index < len(mapped):
        if mapped[index] is not None:
            previous_end = mapped[index]["end"]
            index += 1
            continue
        first = index
        while index < len(mapped) and mapped[index] is None:
            index += 1
        next_start = mapped[index]["start"] if index < len(mapped) else fallback_end
        mapped[first:index] = estimate_words(" ".join(authored[first:index]), previous_end, max(previous_end, next_start))
    return [word for word in mapped if word is not None], coverage


def whisper_words(path: Path, model_name: str, language: str | None) -> tuple[list[dict], list[dict]]:
    try:
        from faster_whisper import WhisperModel
    except ImportError as exc:
        raise RuntimeError("faster-whisper is required for local alignment; install requirements-voice.txt") from exc
    model = WhisperModel(model_name, device="auto", compute_type="int8")
    segments, _ = model.transcribe(str(path), language=language, word_timestamps=True, vad_filter=True)
    words: list[dict] = []
    segment_rows: list[dict] = []
    for segment in segments:
        segment_rows.append({"text": segment.text.strip(), "start": segment.start, "end": segment.end})
        for word in segment.words or []:
            words.append({"word": word.word.strip(), "start": word.start, "end": word.end})
    return words, segment_rows


def force_align_segments(path: Path, text: str, model_name: str,
                         language: str | None, segments_path: Path) -> list[dict]:
    """Align supplied text against audio attention inside reviewed utterance windows.

    This does not synthesize audio or estimate word durations. Window boundaries
    come from a reviewed transcription of the continuous master.
    """
    from faster_whisper import WhisperModel
    from faster_whisper.audio import decode_audio, pad_or_trim
    from faster_whisper.tokenizer import Tokenizer

    segments = json.loads(segments_path.read_text(encoding="utf-8"))
    if " ".join(s["text"] for s in segments).split() != text.split():
        raise RuntimeError("Forced-alignment segments must contain the exact full transcript")
    model = WhisperModel(model_name, device="auto", compute_type="int8")
    tokenizer = Tokenizer(model.hf_tokenizer, multilingual=model.model.is_multilingual,
                          task="transcribe", language=language or "ar")
    audio = decode_audio(str(path), sampling_rate=16000)
    words = []
    previous_end = 0.0
    for segment in segments:
        start, end = float(segment["start"]), float(segment["end"])
        tokens = tokenizer.encode(segment["text"])
        if start < previous_end or end <= start or end-start > 30 or len(tokens) > 400:
            raise RuntimeError("Forced-alignment windows must be ordered, <=30s and <=400 tokens")
        if end > len(audio)/16000 + .05:
            raise RuntimeError("Forced-alignment window exceeds the audio duration")
        features = model.feature_extractor(audio[round(start*16000):round(end*16000)])
        aligned = model.find_alignment(tokenizer, [tokens], model.encode(pad_or_trim(features)), features.shape[-1])[0]
        for word in aligned:
            if normalize_word(word["word"]):
                words.append({"word": word["word"].strip(),
                              "start": start+float(word["start"]),
                              "end": min(end, start+float(word["end"]))})
        previous_end = end
    return words


def write_pcm_wav(path: Path, pcm: bytes, rate: int = 24000) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(pcm)


def continuous_tts_prompt(passages: list[tuple[str, str]]) -> str:
    scripted = []
    for delivery, transcript in passages:
        direction = delivery or "clear, natural, informative"
        scripted.append(f"[{direction}]\n{transcript}")
    return (
        "Synthesize one continuous narration performance using the same speaker identity, "
        "accent, vocal character, recording perspective, and energy throughout. Interpret each "
        "bracketed direction as acting guidance, but never speak the directions, brackets, labels, "
        "or passage numbers aloud. Speak every transcript exactly as written. Use a brief natural "
        "pause between passages; do not reset or introduce a new voice.\n\n"
        + "\n\n".join(scripted)
    )


def cast_performances(vo: list[dict], passages: list[tuple[str, str]],
                      casts: list[dict[str, str]], dialect: str | None = None) -> list[tuple]:
    """Build one continuous performance per one- or two-speaker cast."""
    if any(not isinstance(cast, dict) or len(cast) not in (1, 2) or
           any(not speaker or not isinstance(name, str) or not name.strip()
               for speaker, name in cast.items()) for cast in casts) or any(
        sum(line.get("speaker") in cast for cast in casts) != 1 for line in vo
    ):
        raise RuntimeError("Each dialogue line needs one matching one- or two-speaker cast")
    language = dialect or "clear Modern Standard Arabic"
    performances = []
    for cast in casts:
        indices = [index for index, line in enumerate(vo) if line["speaker"] in cast]
        if not indices:
            continue
        if len(cast) == 1:
            # The single-voice API needs no speaker labels in its transcript.
            voice = next(iter(cast.values()))
            prompt = f"Perform in {language}. No music or effects.\n\n" + continuous_tts_prompt(
                [passages[index] for index in indices]
            )
        else:
            voice = cast
            turns = "\n\n".join(
                f"{vo[index]['speaker']}: [{passages[index][0] or 'natural'}]\n{passages[index][1]}"
                for index in indices
            )
            prompt = (
                f"Perform the following dialogue in {language}. Speak only the Arabic "
                "lines, exactly as written, in their given order. Never speak names, labels, or bracketed "
                "acting directions. Keep each speaker's configured voice fixed, with a short natural pause "
                "between lines. No music or effects.\n\n" + turns
            )
        performances.append((voice, indices, prompt))
    return performances


def reviewed_masters(masters: list[tuple], supplied: list[Path], *, force: bool = False) -> list[tuple]:
    """Reuse explicitly reviewed recordings, identified by content rather than prompt."""
    paths = [Path(path).resolve() for path in supplied]
    if force or len(paths) != len(masters) or any(not path.is_file() for path in paths):
        raise RuntimeError("Explicit master audio needs one existing file per continuous performance and cannot use --force")
    output = []
    for path, (_, _, voice, indices, prompt) in zip(paths, masters):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
        output.append((path, digest, voice, indices, prompt))
    return output


def gemini_tts(api_key: str, model: str, voice: str | dict[str, str], prompt: str,
               output: Path, quota: GeminiFreeTierGuard) -> None:
    try:
        from google import genai
        from google.genai import types
    except ImportError as exc:
        raise RuntimeError("google-genai is required for AI narration; install requirements-voice.txt") from exc
    client = genai.Client(api_key=api_key)
    def voice_config(name: str) -> types.VoiceConfig:
        return types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=name))

    speech = types.SpeechConfig(voice_config=voice_config(voice)) if isinstance(voice, str) else types.SpeechConfig(
        multi_speaker_voice_config=types.MultiSpeakerVoiceConfig(speaker_voice_configs=[
            types.SpeakerVoiceConfig(speaker=speaker, voice_config=voice_config(name))
            for speaker, name in voice.items()
        ])
    )
    config = types.GenerateContentConfig(response_modalities=["AUDIO"], speech_config=speech)
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            quota.reserve_request()
            response = client.models.generate_content(model=model, contents=prompt, config=config)
            part = response.candidates[0].content.parts[0]
            data = part.inline_data.data
            pcm = base64.b64decode(data) if isinstance(data, str) else data
            write_pcm_wav(output, pcm)
            return
        except Exception as exc:  # SDK error types vary by release.
            last_error = exc
            if isinstance(exc, GeminiQuotaError):
                raise
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Gemini TTS failed after 3 attempts: {last_error}")


def narration_output(beats_path: Path, beats: dict) -> Path:
    if beats_path.name == "project.json":
        return beats_path.parent / "assets" / "narration.m4a"
    audio = (beats.get("narration") or {}).get("audio")
    if audio:
        return ROOT / "media" / audio
    project_id = beats.get("id") or beats_path.parent.name
    return ROOT / "media" / "projects" / project_id / "narration.m4a"


def emit_ts(vo: list[dict], path: Path) -> None:
    shared = Path(os.path.relpath(ROOT / "remotion/src/lib/shorts", path.resolve().parent)).as_posix()
    if not shared.startswith("."):
        shared = f"./{shared}"
    lines = ["// AUTO-GENERATED by tools/prepare_narration.py — do not edit.",
             f"import type {{ VoLine }} from '{shared}';", "", "export const VO: VoLine[] = ["]
    for line in vo:
        lines.append("  " + json.dumps({key: line[key] for key in ("text", "start", "end", "words") if key in line}, ensure_ascii=False) + ",")
    lines.extend(["];", ""])
    # JSON object syntax is valid TypeScript; protect U+2028/U+2029 parsing.
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines).replace("\u2028", "\\u2028").replace("\u2029", "\\u2029"), encoding="utf-8")


def align_or_estimate(path: Path, text: str, args: argparse.Namespace,
                      offset: float = 0.0, known_end: float | None = None) -> tuple[list[dict], float]:
    try:
        segments_path = getattr(args, "alignment_segments", None)
        if segments_path:
            recognized = force_align_segments(path, text, args.align_model, args.language, Path(segments_path))
        else:
            recognized, _ = whisper_words(path, args.align_model, args.language)
        words, coverage = map_words(text, recognized, offset, known_end)
    except RuntimeError:
        if not args.allow_estimated_alignment:
            raise
        words = estimate_words(text, offset, known_end or offset + duration(path))
        coverage = 0.0
    if coverage < .90 and not args.allow_estimated_alignment:
        raise RuntimeError(f"alignment coverage {coverage:.0%} is below the required 90% for: {text!r}")
    return words, coverage


def prepare_ai(beats_path: Path, beats: dict, args: argparse.Namespace) -> Path:
    env = load_env()
    key = env.get("GEMINI_API_KEY", "").strip()
    if not key and not args.dry_run:
        raise RuntimeError("GEMINI_API_KEY is required for --mode ai")
    vo = beats.get("vo", [])
    if not vo:
        raise RuntimeError("AI narration requires at least one authored line in project.json vo[]")
    total = float(beats["format"]["durationSec"])
    cache = beats_path.parent / ("_source/voice" if beats_path.name == "project.json" else "voice")
    cache.mkdir(exist_ok=True)
    passages = [delivery_and_transcript(line) for line in vo]
    narration = beats.get("narration") or {}
    casts = narration.get("casts")
    performances = []
    if casts:
        performances = cast_performances(vo, passages, casts, narration.get("dialect"))
    else:
        prompt = (
            "\n\n".join(transcript for _, transcript in passages)
            if getattr(args, "transcript_only", False)
            else continuous_tts_prompt(passages)
        )
        performances.append((args.voice, list(range(len(vo))), prompt))

    masters = []
    for voice, indices, prompt in performances:
        digest = hashlib.sha1(f"gemini-continuous-v1|{args.model}|{voice}|{prompt}".encode()).hexdigest()[:12]
        masters.append((cache / f"narration-{digest}.wav", digest, voice, indices, prompt))
    supplied_master = getattr(args, "master_audio", None)
    supplied_masters = getattr(args, "master_audios", None)
    if supplied_master and supplied_masters:
        raise RuntimeError("--master-audio and --master-audios are mutually exclusive")
    if supplied_master:
        supplied_master = Path(supplied_master).resolve()
        if len(masters) != 1 or args.force or not supplied_master.is_file():
            raise RuntimeError("--master-audio needs one existing continuous performance and cannot use --force")
        # A reviewed transcript may correct a provider omission without paying for
        # another performance or pretending that the revised prompt generated it.
        digest = hashlib.sha256(supplied_master.read_bytes()).hexdigest()[:12]
        _, _, voice, indices, prompt = masters[0]
        masters = [(supplied_master, digest, voice, indices, prompt)]
        beats["narration"]["masterAudio"] = str(supplied_master)
        beats["narration"]["masterSha256"] = hashlib.sha256(supplied_master.read_bytes()).hexdigest()
    elif supplied_masters:
        masters = reviewed_masters(masters, supplied_masters, force=args.force)
        beats["narration"]["reviewedMasters"] = [{
            "audio": str(path),
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "voice": voice,
            "lineIds": [vo[index].get("id", index) for index in indices],
        } for path, _, voice, indices, _ in masters]
    quota = GeminiFreeTierGuard(
        args.model,
        rpd_limit=int(env.get("GEMINI_TTS_RPD_LIMIT", DEFAULT_GEMINI_RPD_LIMIT)),
        daily_reserve=int(env.get("GEMINI_TTS_DAILY_RESERVE", DEFAULT_GEMINI_DAILY_RESERVE)),
        used_today_baseline=int(env.get("GEMINI_TTS_USED_TODAY", "0")),
        min_interval_seconds=float(env.get(
            "GEMINI_TTS_MIN_INTERVAL_SECONDS", DEFAULT_GEMINI_MIN_INTERVAL_SECONDS
        )),
    )
    planned_requests = sum(args.force or not master.exists() for master, *_ in masters)
    if not args.dry_run:
        quota.preflight(planned_requests)
        print(
            f"Gemini continuous narration: {planned_requests} new request(s) planned; "
            f"safe daily budget is {quota.daily_budget}/{quota.rpd_limit}"
        )
    if args.dry_run:
        for index, (delivery, transcript) in enumerate(passages):
            print(f"{index:02d} {float(vo[index]['start']):7.2f}s {vo[index].get('speaker', args.voice)} [{delivery}]: {transcript}")
        return narration_output(beats_path, beats)
    aligned = {}
    for master, digest, voice, indices, prompt in masters:
        if args.force or not master.exists():
            gemini_tts(key, args.model, voice, prompt, master, quota)
        master_duration = duration(master)
        transcript = " ".join(passages[index][1] for index in indices)
        alignment_args = argparse.Namespace(**vars(args))
        if args.alignment_segments_dir:
            reviewed = Path(args.alignment_segments_dir) / f"{master.stem}.json"
            if reviewed.is_file():
                alignment_args.alignment_segments = reviewed
        master_words, coverage = align_or_estimate(master, transcript, alignment_args, 0.0, master_duration)
        word_cursor = 0
        for index in indices:
            word_count = len(passages[index][1].split())
            line_words = master_words[word_cursor:word_cursor + word_count]
            if not line_words or len(line_words) != word_count:
                raise RuntimeError(f"Continuous narration did not align every word on line {index}")
            aligned[index] = (master, digest, master_duration, line_words, coverage)
            word_cursor += word_count

    fitted: list[tuple[Path, float]] = []
    for index, line in enumerate(vo):
        _, transcript = passages[index]
        master, master_digest, master_duration, line_words, coverage = aligned[index]
        segment_start = max(0.0, float(line_words[0]["start"]) - .04)
        segment_end = min(master_duration, float(line_words[-1]["end"]) + .10)
        digest = hashlib.sha1(
            f"gemini-continuous-segment-v1|{master_digest}|{index}|{transcript}".encode()
        ).hexdigest()[:10]
        raw = cache / f"line-{index:02d}-{digest}.wav"
        start = float(line["start"])
        next_start = float(vo[index + 1]["start"]) if index + 1 < len(vo) else total - .2
        window = max(.2, next_start - start - .05)
        fit = cache / f"line-{index:02d}-{digest}-fit-{round(window * 1000)}ms.wav"
        if args.force or not raw.exists():
            run([
                "ffmpeg", "-y", "-v", "error", "-i", str(master),
                "-af", f"atrim=start={segment_start:.6f}:end={segment_end:.6f},asetpts=PTS-STARTPTS",
                "-ar", "24000", "-ac", "1", str(raw),
            ])
        raw_duration = duration(raw)
        tempo = min(1.3, raw_duration / window) if raw_duration > window else 1.0
        if args.force or not fit.exists():
            run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-filter:a", f"atempo={tempo:.5f}", "-ar", "44100", "-ac", "2", str(fit)])
        fitted_duration = duration(fit)
        if fitted_duration > window + .08:
            raise RuntimeError(
                f"line {index} is {fitted_duration:.2f}s after maximum safe time compression "
                f"but its scene window is {window:.2f}s; retime the scene or shorten the line"
            )
        line["end"] = round(start + fitted_duration, 3)
        line["words"] = [{
            "w": word["w"],
            "start": round(start + max(0.0, word["start"] - segment_start) / tempo, 3),
            "end": round(start + max(0.0, word["end"] - segment_start) / tempo, 3),
        } for word in line_words]
        line["alignmentCoverage"] = round(coverage, 3)
        fitted.append((fit, start))
    output = narration_output(beats_path, beats)
    output.parent.mkdir(parents=True, exist_ok=True)
    inputs: list[str] = []
    filters: list[str] = []
    labels = []
    for index, (path, start) in enumerate(fitted):
        inputs.extend(["-i", str(path)])
        delay = round(start * 1000)
        filters.append(f"[{index}:a]adelay={delay}|{delay}[a{index}]")
        labels.append(f"[a{index}]")
    filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{total},loudnorm=I=-16:TP=-1.5:LRA=11[out]")
    run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]", "-c:a", "aac", "-b:a", "192k", str(output)])
    beats["voiceStatus"] = f"gemini-continuous:{args.model}:{'cast' if casts else args.voice}"
    return output


def prepare_recorded(beats_path: Path, beats: dict, args: argparse.Namespace) -> Path:
    if not args.audio:
        raise RuntimeError("--audio is required for --mode recorded")
    source = Path(args.audio).resolve()
    if not source.exists():
        raise RuntimeError(f"recording not found: {source}")
    output = narration_output(beats_path, beats)
    output.parent.mkdir(parents=True, exist_ok=True)
    if not args.dry_run:
        run(["ffmpeg", "-y", "-v", "error", "-i", str(source), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", str(output)])
    if args.dry_run:
        return output
    recognized, segments = whisper_words(output, args.align_model, args.language)
    vo = beats.get("vo", [])
    if not vo:
        beats["vo"] = [{"beat": "narration", "text": row["text"], "start": round(row["start"], 3), "end": round(row["end"], 3), "words": []} for row in segments if row["text"]]
        vo = beats["vo"]
    authored = " ".join(line["text"] for line in vo)
    mapped, coverage = map_words(authored, recognized, 0.0, duration(output))
    if coverage < .90 and not args.allow_estimated_alignment:
        raise RuntimeError(f"recorded narration alignment coverage {coverage:.0%} is below 90%")
    cursor = 0
    for line in vo:
        count = len(line["text"].split())
        words = mapped[cursor:cursor + count]
        cursor += count
        if words:
            line["start"], line["end"], line["words"] = words[0]["start"], words[-1]["end"], words
        line["alignmentCoverage"] = round(coverage, 3)
    beats["format"]["durationSec"] = round(duration(output), 3)
    beats["voiceStatus"] = f"recorded:{source.name}"
    return output


def parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--project", "--beats", dest="beats", required=True, help="path to project.json")
    ap.add_argument("--mode", choices=("ai", "recorded", "none"), help="defaults to project.json narration.mode, then ai for legacy projects")
    ap.add_argument("--audio", help="recorded narration file")
    ap.add_argument("--model", default=DEFAULT_MODEL)
    ap.add_argument("--voice", default=DEFAULT_VOICE)
    masters_group = ap.add_mutually_exclusive_group()
    masters_group.add_argument("--master-audio", type=Path,
                    help="Reuse an existing continuous AI performance with a reviewed transcript; never synthesizes")
    masters_group.add_argument("--master-audios", nargs="+", type=Path,
                    help="Reuse reviewed continuous recordings in performance/cast order; never synthesizes")
    ap.add_argument("--alignment-segments", type=Path,
                    help="JSON of reviewed master-audio utterance windows for forced word alignment")
    ap.add_argument("--alignment-segments-dir", type=Path,
                    help="Directory of reviewed utterance windows named after each cached master, for casts")
    ap.add_argument("--transcript-only", action="store_true",
                    help="send only the spoken text for a single voice")
    ap.add_argument("--align-model", default=DEFAULT_ALIGN_MODEL)
    ap.add_argument("--language", default="en")
    ap.add_argument("--emit-ts")
    ap.add_argument("--allow-estimated-alignment", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    return ap


def main(argv: list[str] | None = None) -> None:
    args = parser().parse_args(argv)
    beats_path = Path(args.beats).resolve()
    beats = json.loads(beats_path.read_text(encoding="utf-8"))
    mode = args.mode or (beats.get("narration") or {}).get("mode") or "ai"
    args.mode = mode
    if mode == "ai":
        output = prepare_ai(beats_path, beats, args)
    elif mode == "recorded":
        output = prepare_recorded(beats_path, beats, args)
    else:
        beats.setdefault("narration", {})["mode"] = "none"
        beats["voiceStatus"] = "none"
        output = narration_output(beats_path, beats)
    if not args.dry_run:
        beats.setdefault("narration", {})["mode"] = mode
        beats_path.write_text(json.dumps(beats, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        if args.emit_ts:
            emit_ts(beats.get("vo", []), Path(args.emit_ts).resolve())
    print(f"narration -> {output}")


if __name__ == "__main__":
    main()
