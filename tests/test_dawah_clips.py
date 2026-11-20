import json
import tempfile
import unittest
import shutil
import subprocess
from argparse import Namespace
from unittest.mock import patch
from pathlib import Path

from tools.dawah_clips import load_transcript, load_plan, local_data, export, align, transcribe, clip_duration, review
from tools.create_project import create, parser


class DawahClipsTests(unittest.TestCase):
    def fixture(self, root, **overrides):
        segments = [{"start": 10, "end": 12, "text": "كلمة واضحة", "words": [
            {"start": 10, "end": 10.8, "text": "كلمة"}, {"start": 11, "end": 12, "text": "واضحة"}]}]
        (root / "transcript.json").write_text(json.dumps({"segments": segments}))
        clip = {"slug": "sample", "title": "عنوان", "start": 10, "end": 12, **overrides}
        plan = {"source": {"video": "video.mp4"}, "transcript": "transcript.json", "clips": [clip]}
        path = root / "clips.json"
        path.write_text(json.dumps(plan))
        return path

    def test_absolute_times_become_clip_local_without_drift(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = self.fixture(Path(tmp), captionMode="word-highlight", emphasis=[
                {"start": 11, "end": 12, "kind": "quote", "text": "واضحة"}])
            plan, segments = load_plan(path)
            data = local_data(plan, plan["clips"][0], segments, "projects/example/clip.mp4")
            self.assertEqual(data["captions"][0]["start"], 0)
            self.assertEqual(data["captions"][0]["words"][1]["start"], 1)
            self.assertEqual(data["emphasis"][0]["start"], 1)
            self.assertEqual(segments[0]["start"], 10)

    def test_rejects_truncated_sentence_and_invented_quote(self):
        for overrides, message in [({"start": 10.5}, "whole transcript"),
                                   ({"emphasis": [{"start": 10, "end": 12, "kind": "quote", "text": "مختلقة"}]}, "verbatim"),
                                   ({"end": float("nan")}, "finite")]:
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as tmp:
                path = self.fixture(Path(tmp), **overrides)
                with self.assertRaisesRegex(ValueError, message):
                    load_plan(path)

    def test_internal_edits_remap_every_word_paper_and_cutaway(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self.fixture(root, end=16, keep=[{"start": 10, "end": 12}, {"start": 14, "end": 16}],
                                visualMode="stick", cutaways=[{"start": 14, "end": 16, "kind": "stick", "scene": "hope"}],
                                emphasis=[{"start": 14, "end": 15, "text": "كلمة", "kind": "quote"}])
            transcript = json.loads((root / "transcript.json").read_text())
            transcript["segments"] += [{"start": 12, "end": 14, "text": "محذوف"},
                                       {"start": 14, "end": 16, "text": "كلمة", "words": [{"text": "كلمة", "start": 14.5, "end": 15}]}]
            (root / "transcript.json").write_text(json.dumps(transcript))
            plan, segments = load_plan(path)
            clip = plan["clips"][0]
            data = local_data(plan, clip, segments, "source.mp4")
            self.assertEqual(clip_duration(clip), 4)
            self.assertEqual(data["captions"][1]["words"][0]["start"], 2.5)
            self.assertEqual(data["emphasis"][0]["start"], 2)
            self.assertEqual(data["cutaways"][0]["end"], 4)
            self.assertNotIn("محذوف", " ".join(c["text"] for c in data["captions"]))

    def test_story_order_can_go_backwards_with_all_cues_and_review_context(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self.fixture(root, end=22, keep=[
                {"start": 20, "end": 22, "role": "hook", "reason": "Start with the later passage"},
                {"start": 10, "end": 12, "role": "explanation"}],
                visualMode="stick", captionMode="word-highlight",
                emphasis=[{"start": 20, "end": 21, "text": "افتتاح", "kind": "quote"},
                          {"start": 10, "end": 11, "text": "كلمة", "kind": "quote"}],
                cutaways=[{"start": 20, "end": 22, "kind": "stick", "scene": "hope"},
                          {"start": 10, "end": 12, "kind": "stick", "scene": "prayer"}])
            tr = json.loads((root / "transcript.json").read_text())
            tr["segments"].append({"start": 20, "end": 22, "text": "افتتاح", "words": [{"text": "افتتاح", "start": 20.2, "end": 21.5}]})
            (root / "transcript.json").write_text(json.dumps(tr))
            plan, segments = load_plan(path)
            data = local_data(plan, plan["clips"][0], segments, "source.mp4")
            self.assertEqual([c["text"] for c in data["captions"]], ["افتتاح", "كلمة واضحة"])
            self.assertAlmostEqual(data["captions"][0]["words"][0]["start"], .2)
            self.assertEqual(data["captions"][1]["words"][0]["start"], 2)
            self.assertEqual([c["start"] for c in data["emphasis"]], [0, 2])
            self.assertEqual([c["start"] for c in data["cutaways"]], [0, 2])
            review(Namespace(plan=path))
            report = (root / "review.md").read_text()
            self.assertIn("Part 1: source 20.000", report)
            self.assertIn("Part 2: source 10.000", report)
            self.assertIn("Role: hook", report)

    def test_rejects_crossing_cues_overlapping_edits_and_subframe_durations(self):
        for overrides, message in [
            ({"keep": [{"start": 10, "end": 12}, {"start": 11, "end": 12}]}, "nonoverlapping"),
            ({"end": 16, "keep": [{"start": 10, "end": 12.01}, {"start": 14, "end": 16}]}, "whole number"),
            ({"end": 16, "keep": [{"start": 10, "end": 12}, {"start": 14, "end": 16}],
              "emphasis": [{"start": 11, "end": 15, "text": "معنى", "kind": "summary"}]}, "omitted boundary")
        ]:
            with self.subTest(overrides=overrides), tempfile.TemporaryDirectory() as tmp:
                root = Path(tmp)
                path = self.fixture(root, **overrides)
                tr = json.loads((root / "transcript.json").read_text())
                tr["segments"].append({"start": 14, "end": 16, "text": "تكملة"})
                (root / "transcript.json").write_text(json.dumps(tr))
                with self.assertRaisesRegex(ValueError, message):
                    load_plan(path)

    def test_stock_requires_provenance_and_mode_is_enforced(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            asset = root / "test.svg"
            asset.write_text('<svg xmlns="http://www.w3.org/2000/svg"/>')
            cue = {"start": 10, "end": 11, "kind": "image", "file": "test.svg"}
            path = self.fixture(root, visualMode="stock", cutaways=[cue])
            with self.assertRaisesRegex(ValueError, "sourceUrl"):
                load_plan(path)
            cue.update(sourceUrl="https://example.test/asset", licenseUrl="https://example.test/license", creator="Test", license="Fixture")
            path = self.fixture(root, visualMode="stock", cutaways=[cue])
            plan, _ = load_plan(path)
            self.assertEqual(plan["clips"][0]["cutaways"][0]["file"], str(asset.resolve()))
            path = self.fixture(root, visualMode="speaker", cutaways=[cue])
            with self.assertRaisesRegex(ValueError, "visualMode"):
                load_plan(path)

    def test_paper_only_accepts_untimed_words_and_preserves_animation_settings(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            path = self.fixture(root, captionMode="none", emphasis=[
                {"start": 10, "end": 12, "text": "كلمة واضحة", "kind": "quote", "animation": "unfold", "paper": "note"}])
            transcript = {"segments": [{"start": 10, "end": 12, "text": "كلمة واضحة"}]}
            (root / "transcript.json").write_text(json.dumps(transcript))
            plan, segments = load_plan(path)
            data = local_data(plan, plan["clips"][0], segments, "source.mp4")
            self.assertEqual(data["captionMode"], "none")
            self.assertEqual(data["emphasis"][0]["animation"], "unfold")
            self.assertEqual(data["emphasis"][0]["paper"], "note")
            self.assertTrue(data["captions"])  # retained timing data is hidden, not deleted
            plan["clips"][0]["emphasis"][0]["animation"] = "invalid"
            path.write_text(json.dumps(plan))
            with self.assertRaisesRegex(ValueError, "Invalid paper"):
                load_plan(path)

    def test_srt_preserves_phrase_times_and_requires_words_for_highlight(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            srt = root / "sample.srt"
            srt.write_text("1\n00:00:10,250 --> 00:00:12,500\n<b>كلمة واضحة</b>\n", encoding="utf-8")
            transcript = load_transcript(srt)
            self.assertEqual(transcript["segments"][0], {"start": 10.25, "end": 12.5, "text": "كلمة واضحة"})
            path = self.fixture(root, captionMode="word-highlight", start=10.25, end=12.5)
            (root / "transcript.json").write_text(json.dumps(transcript))
            with self.assertRaisesRegex(ValueError, "real word timestamps"):
                load_plan(path)

    def test_untimed_text_is_not_given_estimated_times(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "transcript.txt"
            path.write_text("النص الأصلي", encoding="utf-8")
            self.assertEqual(load_transcript(path), {"text": "النص الأصلي", "segments": []})

    def test_local_alignment_reuses_shared_helper_and_keeps_source_text(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.fixture(root)
            source = root / "transcript.json"
            original = source.read_bytes()
            output = root / "aligned.json"
            with patch("tools.prepare_narration.force_align_segments", return_value=[
                {"word": "كلمة", "start": 10, "end": 10.8}, {"word": "واضحة", "start": 11, "end": 12}
            ]) as helper:
                align(Namespace(video=root / "video.mp4", transcript=source, output=output, model="small"))
                helper.assert_called_once()
            self.assertEqual(source.read_bytes(), original)
            data = json.loads(output.read_text())
            self.assertEqual(data["segments"][0]["words"][0]["text"], "كلمة")
            with self.assertRaisesRegex(ValueError, "overwrite"):
                align(Namespace(output=output))

    def test_transcription_is_a_separate_draft(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "draft.json"
            with patch("tools.prepare_narration.whisper_words", return_value=(
                [{"word": "نص", "start": 1, "end": 2}], [{"text": "نص", "start": 1, "end": 2}]
            )) as helper:
                transcribe(Namespace(video=Path(tmp) / "video.mp4", output=output, model="small"))
                helper.assert_called_once()
            self.assertEqual(json.loads(output.read_text())["status"], "draft-needs-review")

    def test_scaffold_has_embedded_audio_and_no_second_narration_track(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = create(parser().parse_args(["--format", "short", "--template", "dawah-clips", "--narration", "recorded", "--slug", "sample", "--root", tmp]))
            root = Path(tmp)
            tsx = next((root / result["composition"]).glob("*.tsx")).read_text()
            beats = json.loads((root / result["project"] / "project.json").read_text())
            self.assertIn("DawahClip", tsx)
            self.assertNotIn("<Audio", tsx)
            self.assertTrue(beats["narration"]["embedded"])
            self.assertEqual(beats["language"], "ar")

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"), "FFmpeg required")
    def test_real_batch_cuts_three_clips_and_preserves_audio(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            video = root / "source.mp4"
            subprocess.run(["ffmpeg", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=320x180:rate=30",
                            "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=48000", "-t", "4",
                            "-vf", "drawbox=color=green:t=fill:enable=gte(t\\,2)",
                            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", str(video)], check=True)
            path = self.fixture(root)
            plan = json.loads(path.read_text())
            plan["source"]["video"] = str(video)
            plan["clips"] = [{"slug": f"fixture-{i}", "title": "معاينة", "start": i, "end": i + 1,
                              "review": {"context": True, "listened": True, "text": True, "approved": True}}
                             for i in range(3)]
            plan["clips"][0].update(end=3, keep=[{"start": 2, "end": 3}, {"start": 0, "end": 1}])
            stock = root / "fixture.svg"
            stock.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920"><rect width="1080" height="1920" fill="blue"/></svg>')
            plan["clips"][0].update(visualMode="stock", cutaways=[{"start": 2, "end": 3, "kind": "image", "file": str(stock),
                "sourceUrl": "https://example.test/local-fixture", "licenseUrl": "https://example.test/test-license", "creator": "Test", "license": "Local fixture"}])
            (root / "transcript.json").write_text(json.dumps({"segments": [
                {"start": i, "end": i + 1, "text": "نص تجريبي"} for i in range(3)]}))
            path.write_text(json.dumps(plan))
            with patch("tools.dawah_clips.ROOT", root):
                export(Namespace(plan=path))
                with self.assertRaisesRegex(ValueError, "already exists"):
                    export(Namespace(plan=path))
            self.assertEqual(len(list((root / "projects").iterdir())), 3)
            for cut in (root / "projects").glob("*/assets/source-clip.mp4"):
                result = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(cut)],
                                        check=True, capture_output=True, text=True)
                info = json.loads(result.stdout)
                self.assertEqual({s["codec_type"] for s in info["streams"]}, {"video", "audio"})
                expected = 2 if "fixture-0" in str(cut) else 1
                self.assertAlmostEqual(float(info["format"]["duration"]), expected, delta=.05)
            exported = root / "projects" / "fixture-0" / "_source" / "clip.json"
            data = json.loads(exported.read_text())
            self.assertEqual(data["cutaways"][0]["start"], 0)
            self.assertEqual(data["captions"][1]["start"], 1)
            self.assertTrue((root / "projects" / "fixture-0" / "assets" / "cutaway-1.svg").is_file())
            cut = root / "projects" / "fixture-0" / "assets" / "source-clip.mp4"
            def sample(t):
                return subprocess.check_output(["ffmpeg", "-v", "error", "-ss", str(t), "-i", str(cut), "-frames:v", "1",
                                                "-vf", "scale=8:8,format=rgb24", "-f", "rawvideo", "-"])
            green = sample(.5)
            self.assertTrue(all(abs(value - target) < 12 for i, value in enumerate(green) for target in [(0, 128, 0)[i % 3]]))
            self.assertGreater(sum(abs(a - b) for a, b in zip(green, sample(1.5))) / len(green), 30)


if __name__ == "__main__":
    unittest.main()
