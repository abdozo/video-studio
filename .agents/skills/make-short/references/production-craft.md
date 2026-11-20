# Established Short Production Craft

This retains the production knowledge proven across the twelve existing TSX Shorts while the
main skill supports the new provider and template choices.

## Artifact contract

```text
projects/<slug>/
  script.md        hook, beat table, and production notes
  project.json       format, narration, captions, timed vo[], and visual beats
  voice/           cached continuous narration master + locally split working files
  sfx-plan.json    global-timeline cue sheet
  output/          final auditions and exports
projects/<slug>/_source/
  ShortN<Name>.tsx composition registered by npm run gen
  vo.gen.ts        generated aligned narration data; never hand-edit
```

Shared kit: `remotion/src/lib/shorts.tsx` provides captions, kickers, titles, stamps, pause cards,
stat chips, progress, backgrounds, safe areas, and timing helpers. Existing niche libraries include
chess, math, algorithms, spreadsheets, piano, probability, maps, orbit, charts, and storybook.
Add at most one new niche library per Short, and make it reusable enough for a series.

## Beat grammar

For a typical 38–42 second Short: hook (0–3.4s, fully composed frame 0) → setup → optional quiz →
reveal in two to four steps → twist → payoff → loop when natural. The last frame should return to
the opening state only when the topic supports it. Never pad the ending with engagement CTA filler.

Aim for roughly 100 narrated words and leave pacing slack. Verify factual claims before scripting.
Write estimated windows first; AI or recorded narration replaces them with locally aligned timing.

## Composition rules

- Use one persistent 1080×1920 canvas with Sequence-based scenes.
- Keep captions and progress at the root so their frame clock is global.
- Frames inside a Sequence are local: `localFrame = globalSeconds * fps - sequenceFrom`.
- Make frame 0 thumbnail-grade. Use negative entrance offsets when a hook element must already be
  visible.
- Keep critical material away from the lower platform UI area and the right-side action rail.
- Preserve existing library APIs and composition IDs when continuing an example.

## Frame QA

After `npm run gen`, render frame 0, every scene boundary, each hero/reveal moment, and the final
frame at phone scale. Inspect the PNGs for entrance timing, overlap, text wrapping, safe areas,
contrast, and loop continuity. Only then render at scale 1.

## Narration and captions

Use `tools/prepare_narration.py` with `ai`, `recorded`, or `none`. AI and recorded modes write exact
local alignment into `project.json` and optionally `vo.gen.ts`. AI mode makes one identity-locked
Gemini request for the full performance, then splits and fits passages locally; never loop over VO
lines. Generate narration before locking scene and reveal cues, reuse the cached master, and use
`--force` only for an intentional one-request regeneration. Never keep estimated word timing when
aligned audio exists. Shorts with narration default to word-highlight captions; silent Shorts do
not mount captions or audio.

## Sound

Sound design happens only after the visual timeline stabilizes. Reuse the catalog and sync cues to
exact landing frames: `atSeconds = (localCueFrame + sequenceFrom) / fps`. Diegetic action may be
denser than decorative sound, but decorative cues remain optional. Build-and-drop layers belong on
only the two or three largest moments. The user audits the printed cue sheet before mixing.

New SFX or music must be user-owned or genuinely free and imported with source/license provenance
through `tools/import_audio.py`; legacy generated assets remain reusable.
