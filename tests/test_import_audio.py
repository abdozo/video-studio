import unittest

from tools.import_audio import safe_id


class ImportAudioTests(unittest.TestCase):
    def test_hyphen_id(self):
        self.assertEqual(safe_id("pencil-stroke-soft"), "pencil-stroke-soft")

    def test_rejects_unsafe_id(self):
        with self.assertRaises(Exception):
            safe_id("../bad")


if __name__ == "__main__":
    unittest.main()
