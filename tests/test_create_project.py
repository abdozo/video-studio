import json
import tempfile
import unittest
from pathlib import Path

from tools.create_project import create, parser


class CreateProjectTests(unittest.TestCase):
    def run_create(self, *args):
        with tempfile.TemporaryDirectory() as tmp:
            ns = parser().parse_args([*args, "--root", tmp])
            result = create(ns)
            root = Path(tmp)
            beats = json.loads((root / result["project"] / "project.json").read_text())
            tsx = next((root / result["composition"]).glob("*.tsx")).read_text()
            return result, beats, tsx

    def test_animation_keeps_all_project_files_together(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            result = create(parser().parse_args([
                "--format", "short", "--template", "animation", "--slug", "first film", "--root", tmp,
            ]))
            self.assertEqual(result["project"], "projects/first-film")
            self.assertEqual(result["composition"], "projects/first-film/_source")
            self.assertEqual(result["media"], "projects/first-film/assets")
            project = root / result["project"]
            self.assertEqual(set(path.name for path in project.iterdir()),
                             {"project.json", "script.md", "assets", "output", "_source"})
            self.assertTrue((project / "_source/animation.json").is_file())

    def test_short_defaults(self):
        _, beats, tsx = self.run_create("--format", "short", "--slug", "Daily Words")
        self.assertEqual(beats["format"]["mode"], "short")
        self.assertEqual((beats["format"]["width"], beats["format"]["height"]), (1080, 1920))
        self.assertEqual(beats["narration"]["mode"], "none")
        self.assertEqual(beats["captions"]["mode"], "none")
        self.assertIn("MotionCanvas", tsx)

    def test_video_whiteboard_recorded(self):
        _, beats, tsx = self.run_create(
            "--format", "video", "--template", "whiteboard", "--narration", "recorded",
            "--slug", "Atomic Habits", "--duration", "480",
        )
        self.assertEqual(beats["format"]["durationSec"], 480)
        self.assertEqual((beats["format"]["width"], beats["format"]["height"]), (1920, 1080))
        self.assertTrue(beats["narration"]["audio"].endswith("narration.m4a"))
        self.assertIn("ClassicWhiteboardStarter", tsx)

    def test_ai_short_defaults_to_word_highlight(self):
        _, beats, _ = self.run_create(
            "--format", "short", "--narration", "ai", "--slug", "One Rule"
        )
        self.assertEqual(beats["captions"]["mode"], "word-highlight")

    def test_every_format_template_narration_combination(self):
        for video_format in ("short", "video"):
            for template, expected_starter in (
                ("motion", "MotionCanvas"),
                ("whiteboard", "ClassicWhiteboardStarter"),
                ("company-analysis", "CompanyAnalysis"),
                ("motion-comic-static", "MotionComic"),
                ("motion-graphic-animated", "MotionComic"),
            ):
                if template == "company-analysis" and video_format == "short":
                    continue
                for narration in ("ai", "recorded", "none"):
                    with self.subTest(format=video_format, template=template, narration=narration):
                        _, beats, tsx = self.run_create(
                            "--format", video_format, "--template", template,
                            "--narration", narration, "--slug", "Matrix Case",
                        )
                        self.assertEqual(beats["format"]["mode"], video_format)
                        self.assertEqual(beats["template"], template)
                        self.assertEqual(beats["narration"]["mode"], narration)
                        self.assertIn("CaptionTrack", tsx)
                        self.assertIn(expected_starter, tsx)
                        if expected_starter == "MotionComic":
                            self.assertIn('panelPlayback="accumulate"', tsx)

    def test_sticky_notes_shares_kit_and_separates_scene_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            result = create(parser().parse_args([
                "--format", "video", "--template", "sticky-notes", "--slug", "new topic",
                "--narration", "recorded", "--root", tmp,
            ]))
            root = Path(tmp)
            shot = root / result["composition"]
            scene = json.loads((shot / "scene.json").read_text())
            tsx = next(shot.glob("*.tsx")).read_text()
            beats = json.loads((root / result["project"] / "project.json").read_text())
            self.assertEqual(scene["direction"], "rtl")
            self.assertEqual(beats["template"], "sticky-notes")
            self.assertEqual(beats["captions"]["mode"], "none")
            self.assertEqual(beats["format"]["width"], 1920)
            self.assertIn("../../../remotion/src/lib/sticky-notes", tsx)
            self.assertIn("./scene.json", tsx)
            self.assertNotIn("Basair", tsx)
            self.assertIn("narration.m4a", tsx)

    def test_sticky_notes_alias_and_language(self):
        _, beats, tsx = self.run_create(
            "--format", "video", "--template", "sticky-note-wall", "--slug", "ideas", "--language", "en"
        )
        self.assertEqual(beats["template"], "sticky-notes")
        self.assertEqual(beats["language"], "en")
        self.assertIn("StickyNoteWall", tsx)
        with self.assertRaisesRegex(SystemExit, "requires --format video"):
            self.run_create("--format", "short", "--template", "sticky-notes", "--slug", "ideas")

    def test_company_analysis_rejects_vertical_canvas(self):
        with self.assertRaisesRegex(SystemExit, "requires --format video"):
            self.run_create("--format", "short", "--template", "company-analysis", "--slug", "analysis")

    def test_comic_language_reaches_both_templates(self):
        for template in ("motion-comic-static", "motion-graphic-animated"):
            for language, flag in (("ar", ("--language", "ar")), ("en", ())):
                with self.subTest(template=template, language=language):
                    _, beats, tsx = self.run_create(
                        "--format", "video", "--template", template, "--slug", "comic", *flag,
                    )
                    self.assertEqual(beats["language"], language)
                    self.assertIn(f'language="{language}"', tsx)

    def test_motion_comic_legacy_alias_imports_initial_page(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            image = root / "source.PNG"
            image.write_bytes(b"page artwork")
            result = create(parser().parse_args([
                "--format", "video", "--template", "motion-comic", "--duration", "10",
                "--slug", "comic story", "--comic-image", str(image), "--root", tmp,
            ]))
            imported = root / result["media"] / "page-01.png"
            tsx = next((root / result["composition"]).glob("*.tsx")).read_text()
            beats = json.loads((root / result["project"] / "project.json").read_text())
            self.assertEqual(beats["template"], "motion-comic-static")
            self.assertEqual(imported.read_bytes(), image.read_bytes())
            self.assertIn(f'projects/{result["id"]}/page-01.png', tsx)
            self.assertEqual(tsx.count('"at": 0'), 1)
            self.assertIn('"reveal": "cut"', tsx)
            self.assertNotIn('"showPanelFrames": true', tsx)


if __name__ == "__main__":
    unittest.main()
