# Memphis Group

> **Arabic video (RTL).** Start on the right and build toward the left. Draw, write, and reveal elements right to left, and lay out the screen in that same order. Follow the [global Arabic video direction rule](../../AGENTS.md#arabic-video-direction-rtl).

Preserved user-supplied reference in `REFERENCE.txt`, with its H and SOUND libraries unchanged. `kit.js` wraps the original Memphis drawing recipes. `scene.js` draws timed subject-specific elements and shares those cues with its sound score. Scene data stays local to the video.

The English grammar example is `videos/video-35-present-simple-memphis/`. Its script, real word timings, countdown and source narration are reused from video 34. The supplied user request authorizes direct production, dense synchronized effects and background music.

Rebuild its offline player and visual storyboard with `python3 videos/video-35-present-simple-memphis/build_preview.py`. The player embeds the narration/music bed and renders the supplied sound kit live. Remotion mounts the final mix for export. Fonts and source URLs are recorded in `assets.json`; font license files are retained beside the fonts.
