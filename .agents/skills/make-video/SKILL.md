---
name: make-video
description: Build a regular horizontal 1920x1080 Remotion YouTube video with modular scenes or chapters using code-native motion graphics or the classic whiteboard template, with Gemini AI narration, user-recorded narration, or no narration. Use for "make a video", long-form video, regular YouTube video, book summary, self-help explainer, horizontal English lesson, or a video using the user's recording. Use make-short for vertical short-form output.
---

# Make a Regular Video

Run from the repository root. Read `AGENTS.md`, `brand.md`, and
`vidtsx-2d-generator/SKILL.md`. For whiteboard requests also use `$whiteboard-template`.
For `lines-anime`, Lines Anime, or animating a supplied illustration, follow
`templates/lines-anime/README.md` using the `motion` scaffold.

## Initialize

```bash
python tools/create_project.py --format video --template motion|whiteboard \
  --narration ai|recorded|none --slug <slug> [--duration <seconds>]
```

Default to 1920x1080, 30fps, and duration driven by the approved script or recorded audio. Keep the
entry composition small and split chapters into scene components. Use `lib/video.tsx` for the
horizontal canvas and `lib/english.tsx` for English-teaching visuals.

## Workflow

1. Write a chapter outline before detailed scenes. Each chapter needs one visual thesis, not a
   slideshow of interchangeable cards.
2. Author the script and timeline. Long videos may reset the canvas between chapters while keeping
   a recurring motif or progress device.
3. Narration:
   - `recorded` (preferred for the user's voice): approve script, optionally storyboard, import the
     recording, align locally, then animate to real pacing.
   - `ai`: use `tools/prepare_narration.py` once for the whole script. It creates one continuous
     Gemini performance with a locked speaker identity, then locally splits, fits, and word-aligns
     passages into chapter windows. Never generate per scene. Reuse the cached master and use
     `--force` only when intentionally spending one fresh request.
   - `none`: use explicit scene durations and omit narration/captions.
4. Store prepared narration at `projects/<slug>/assets/narration.m4a` and include it with Remotion
   `<Audio>` so Studio and final render share timing.
   Generate narration before finalizing chapter boundaries and motion cues; use aligned `vo[].words`
   or emitted `vo.gen.ts` timestamps for captions and important reveals. For scripts substantially
   longer than a few minutes, do not silently switch to per-line calls; discuss chapter batching
   only if continuous-generation quality is inadequate.
5. Caption default is `none`; intentional teaching text remains on screen. Use `subtitles` or
   `word-highlight` only when requested.
6. QA the opening, every chapter boundary, teaching reveal, dense text layout, and final frame.
   Render long-form at scale 1.

## Book summaries

Use hook → book/author/thesis → 3–7 key ideas → examples/contrasts → synthesis → practical actions.
Label direct quotations and attribution accurately; otherwise state that wording is paraphrased.
Do not present the video as a replacement for the copyrighted book.

## Done

The composition is modular, chapter pacing follows real or explicit timing, teaching text is
legible, optional captions are correctly separated, audio previews in Remotion, and representative
frames plus a scale-1 render have been inspected.
