#!/usr/bin/env python3
"""Compatibility entrypoint for Gemini AI narration.

New workflows should use tools/prepare_narration.py and select ai, recorded, or none.
"""
from prepare_narration import main

if __name__ == "__main__":
    main()
