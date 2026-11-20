import json
import struct
import tempfile
import unittest
import wave
from pathlib import Path

from tools.synthesize_foley import synthesize


class FoleyTests(unittest.TestCase):
    def test_reproducible_bounded_audio_with_provenance_and_no_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for recipe in ('air-swish', 'paper-brush'):
                first, second, different = [root / f'{recipe}-{i}.wav' for i in range(3)]
                result = synthesize(recipe, first, seed=7)
                synthesize(recipe, second, seed=7)
                synthesize(recipe, different, seed=8)
                self.assertEqual(first.read_bytes(), second.read_bytes())
                self.assertNotEqual(first.read_bytes(), different.read_bytes())
                self.assertEqual(json.loads(first.with_suffix('.provenance.json').read_text()), result)
                with wave.open(str(first)) as wav:
                    self.assertEqual(wav.getframerate(), 48000)
                    raw = wav.readframes(wav.getnframes())
                samples = struct.unpack('<' + 'h' * (len(raw) // 2), raw)
                self.assertEqual((samples[0], samples[-1]), (0, 0))
                self.assertLess(max(abs(x) for x in samples), 20000)
                with self.assertRaisesRegex(ValueError, 'overwrite'):
                    synthesize(recipe, first)
