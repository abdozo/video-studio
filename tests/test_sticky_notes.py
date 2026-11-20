import json
import tempfile
import unittest
from pathlib import Path
from tools.build_sticky_notes import TEMPLATE, build, validate

class StickyNotesTests(unittest.TestCase):
    def test_offline_player_and_storyboard_use_shared_renderer(self):
        with tempfile.TemporaryDirectory() as tmp:
            for storyboard in (False, True):
                out=build(TEMPLATE/'starter.json',Path(tmp)/f'{storyboard}.html',storyboard=storyboard)
                text=out.read_text()
                self.assertIn('data:font/',text)
                self.assertIn('function drawScene(',text)
                self.assertNotIn('import {',text)
                self.assertNotIn('Basair',text)
                if storyboard:
                    self.assertIn('data-time="2"',text)
                    self.assertNotIn('OfflineAudioContext',text)
                else:
                    self.assertIn('window.seek=',text)
                    self.assertIn('SOUND.live',text)
                    self.assertIn('scheduleStickySound',text)

    def test_invalid_camera_and_duplicate_notes_fail_before_build(self):
        scene=json.loads((TEMPLATE/'starter.json').read_text())
        scene['camera'][1]['at']=scene['camera'][0]['at']
        with self.assertRaisesRegex(ValueError,'strictly increase'):validate(scene)
        scene=json.loads((TEMPLATE/'starter.json').read_text())
        scene['notes'][1]['id']=scene['notes'][0]['id']
        with self.assertRaisesRegex(ValueError,'unique ids'):validate(scene)

    def test_reference_and_asset_sources_are_present(self):
        reference=(TEMPLATE/'REFERENCE.txt').read_text()
        self.assertIn('STORYBOARD FIRST',reference)
        self.assertIn('function note(',reference)
        self.assertTrue((TEMPLATE/'Arabic.ttf').is_file())
        for font in json.loads((TEMPLATE/'fonts.json').read_text()):
            self.assertGreater((TEMPLATE/(font['name']+'.woff2')).stat().st_size,1000)
            self.assertTrue((TEMPLATE/(font['name']+'.LICENSE.txt')).is_file())
