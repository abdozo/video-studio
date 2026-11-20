---
name: make-short
description: Build a vertical 1080x1920 Remotion Short from a topic using code-native motion graphics or the classic whiteboard template, with AI, recorded, or no narration. Use for "make a short", YouTube Shorts, Reels, TikTok explainers, vertical English lessons, or whiteboard Shorts. Use make-video for regular horizontal videos, make-ai-short for video-model pixels, and make-vox for layered collage.
---

# Make a Short

Run from the repository root. Read `AGENTS.md`, `brand.md`, and
`vidtsx-2d-generator/SKILL.md`. Read `references/production-craft.md` when designing or
continuing a full Short. For whiteboard requests also use `$whiteboard-template`.
For `lines-anime`, Lines Anime, or animating a supplied illustration, follow
`templates/lines-anime/README.md` using the `motion` scaffold.

## Initialize

Infer the template and narration mode from the request. Ask only when the choice materially changes
the result and is not stated.

```bash
python tools/create_project.py --format short --template motion|whiteboard \
  --narration ai|recorded|none --slug <slug>
```

Do not create raster art for a motion/whiteboard Short. Use `$imagegen` only when the user asks for
or approves a real raster asset.

## Build

1. Author `script.md` and `project.json`. Default to 30–60 seconds, a composed frame 0, a concise
   hook, explanation, payoff, and loop when natural. Never add engagement-CTA filler.
2. Use one persistent Remotion canvas and Sequence-based scenes. Keep UI-safe areas from
   `lib/shorts.tsx`; frames inside Sequences are local.
3. Narration:
   - `ai`: `python tools/prepare_narration.py --mode ai --beats ... --emit-ts .../vo.gen.ts`.
     This generates one continuous Gemini performance for the entire Short, then locally splits,
     fits, and aligns it. Never issue one request per line. Generate it before locking visual cues,
     and drive captions/reveals from `vo.gen.ts` real word times. Reuse its cache; use `--force`
     only when intentionally spending one new request.
   - `recorded`: approve the script, then `--mode recorded --audio <file>`.
   - `none`: author explicit scene durations; omit Audio and captions.
4. Caption defaults: `word-highlight` when narration exists, otherwise `none`. Teaching text is
   designed content and is not a substitute for timing data.
5. Run registry generation, render phone-scale frames at every boundary and reveal, inspect them,
   then render at scale 1.
6. Use `$suggest-sfx` only after the visual timeline is stable. Reuse library audio first.

## Done

The Short has a verified frame 0, legible mobile layout, deterministic motion, correct narration
mode, inspected cue frames, and a scale-1 render. Provider-free Shorts never call external AI.
