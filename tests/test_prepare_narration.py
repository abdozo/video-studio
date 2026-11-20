import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

from tools.prepare_narration import (
    GeminiFreeTierGuard,
    GeminiQuotaError,
    cast_performances,
    continuous_tts_prompt,
    delivery_and_transcript,
    estimate_words,
    main,
    map_words,
    parser,
    reviewed_masters,
)


class NarrationTests(unittest.TestCase):
    def test_reviewed_masters_reuse_exact_files_and_content_digests(self):
        import hashlib
        with tempfile.TemporaryDirectory() as tmp:
            paths = [Path(tmp) / 'first.wav', Path(tmp) / 'second.wav']
            for index, path in enumerate(paths):
                path.write_bytes(f'reviewed audio {index}'.encode())
            planned = [(Path(tmp) / 'old.wav', 'old-digest', 'Puck', [0, 3], 'revised transcript'),
                       (Path(tmp) / 'other.wav', 'other-digest', {'A': 'Charon', 'B': 'Kore'}, [1, 2], 'revised dialogue')]
            reused = reviewed_masters(planned, paths)
            self.assertEqual([row[0] for row in reused], [path.resolve() for path in paths])
            self.assertEqual(reused[0][1], hashlib.sha256(paths[0].read_bytes()).hexdigest()[:12])
            self.assertEqual(reused[1][2:], planned[1][2:])
            for supplied, force in ((paths[:1], False), (paths, True), ([paths[0], Path(tmp) / 'missing.wav'], False)):
                with self.subTest(supplied=supplied, force=force), self.assertRaises(RuntimeError):
                    reviewed_masters(planned, supplied, force=force)

    def test_master_override_options_are_mutually_exclusive(self):
        with patch('sys.stderr'), self.assertRaises(SystemExit):
            parser().parse_args(['--beats', 'beats.json', '--master-audio', 'one.wav', '--master-audios', 'two.wav'])

    def test_casts_group_dialogue_and_use_single_voice_for_solo_role(self):
        vo = [
            {"speaker": "Citizen", "text": "First request."},
            {"speaker": "Bahgat", "text": "First reply."},
            {"speaker": "Soheir", "text": "Second reply."},
            {"speaker": "Citizen", "text": "Second request."},
        ]
        performances = cast_performances(
            vo, [delivery_and_transcript(line) for line in vo],
            [{"Bahgat": "Charon", "Soheir": "Kore"}, {"Citizen": "Puck"}],
            "Egyptian Arabic, everyday Cairo dialect",
        )
        self.assertEqual(len(performances), 2)
        pair, solo = performances
        self.assertEqual(pair[0], {"Bahgat": "Charon", "Soheir": "Kore"})
        self.assertEqual(pair[1], [1, 2])
        self.assertIn("Bahgat: [natural]\nFirst reply.", pair[2])
        self.assertEqual(solo[0], "Puck")
        self.assertEqual(solo[1], [0, 3])
        self.assertNotIn("Citizen:", solo[2])
        self.assertLess(solo[2].index("First request."), solo[2].index("Second request."))
        for _, _, prompt in performances:
            self.assertIn("Egyptian Arabic, everyday Cairo dialect", prompt)
            self.assertNotIn("Modern Standard Arabic", prompt)

    def test_casts_keep_legacy_msa_default(self):
        vo = [{"speaker": "A", "text": "Hello."}]
        performances = cast_performances(vo, [("", "Hello.")], [{"A": "Charon", "B": "Kore"}])
        self.assertIn("clear Modern Standard Arabic", performances[0][2])

    def test_casts_reject_ambiguous_missing_and_oversized_roles(self):
        vo = [{"speaker": "A", "text": "Hello."}]
        for casts in ([{"A": "Charon"}, {"A": "Puck"}], [{"B": "Kore"}],
                      [{"A": "Charon", "B": "Kore", "C": "Puck"}], [{"A": ""}]):
            with self.subTest(casts=casts), self.assertRaises(RuntimeError):
                cast_performances(vo, [("", "Hello.")], casts)

    def test_continuous_prompt_locks_voice_and_preserves_passages(self):
        prompt = continuous_tts_prompt([
            ("calm, curious", "First scene."),
            ("clear, explanatory", "Second scene."),
        ])
        self.assertIn("same speaker identity", prompt)
        self.assertIn("[calm, curious]\nFirst scene.", prompt)
        self.assertIn("[clear, explanatory]\nSecond scene.", prompt)

    def test_quota_guard_paces_and_counts_attempts(self):
        with tempfile.TemporaryDirectory() as tmp:
            current = [datetime(2026, 8, 4, 12, 0, tzinfo=timezone.utc)]
            waits = []

            def sleep(seconds):
                waits.append(seconds)
                current[0] += timedelta(seconds=seconds)

            guard = GeminiFreeTierGuard(
                "test-model",
                state_path=Path(tmp) / "quota.json",
                min_interval_seconds=31,
                now=lambda: current[0],
                sleeper=sleep,
            )
            guard.reserve_request()
            guard.reserve_request()
            self.assertEqual(waits, [31])
            state = json.loads((Path(tmp) / "quota.json").read_text())
            self.assertEqual(len(state["models"]["test-model"]), 2)

    def test_quota_guard_stops_before_partial_run(self):
        with tempfile.TemporaryDirectory() as tmp:
            guard = GeminiFreeTierGuard(
                "test-model",
                state_path=Path(tmp) / "quota.json",
                rpd_limit=10,
                daily_reserve=1,
                used_today_baseline=6,
            )
            with self.assertRaises(GeminiQuotaError):
                guard.preflight(4)

    def test_delivery_tags_are_not_spoken(self):
        delivery, transcript = delivery_and_transcript({
            "text": "This is Pip. Welcome home.",
            "tts": "[warmly] This is Pip. [whispers] Welcome home.",
        })
        self.assertEqual(delivery, "warmly, whispers")
        self.assertEqual(transcript, "This is Pip. Welcome home.")

    def test_exact_alignment(self):
        recognized = [
            {"word": "Hello", "start": 0.1, "end": 0.4},
            {"word": "world", "start": 0.5, "end": 0.9},
        ]
        words, coverage = map_words("Hello, world!", recognized)
        self.assertEqual(coverage, 1)
        self.assertEqual([word["w"] for word in words], ["Hello,", "world!"])

    def test_estimates_cover_window(self):
        words = estimate_words("one longer-word three", 2, 5)
        self.assertEqual(words[0]["start"], 2)
        self.assertAlmostEqual(words[-1]["end"], 5, places=3)

    def test_none_mode_invokes_no_provider(self):
        with tempfile.TemporaryDirectory() as tmp:
            beats = Path(tmp) / "beats.json"
            beats.write_text(json.dumps({
                "id": "silent-test",
                "format": {"durationSec": 5},
                "narration": {"mode": "none", "audio": None},
                "vo": [],
            }))
            with patch("tools.prepare_narration.prepare_ai", side_effect=AssertionError("AI called")), patch("tools.prepare_narration.prepare_recorded", side_effect=AssertionError("recorded called")):
                main(["--beats", str(beats)])
            updated = json.loads(beats.read_text())
            self.assertEqual(updated["voiceStatus"], "none")


if __name__ == "__main__":
    unittest.main()
