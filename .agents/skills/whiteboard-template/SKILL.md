---
name: whiteboard-template
description: Apply the classic whiteboard template to Remotion Shorts and videos. Use for whiteboard animation, animated ink, hand-drawn explanations, book summaries, concept maps, or sketch-style educational videos.
---

# Classic whiteboard template

Use with `$make-short` or `$make-video`. Before storyboarding, inspect
`templates/classic-whiteboard/reference.png`. Scaffold with `--template whiteboard`
and read `remotion/src/lib/classic-whiteboard.tsx`. Replace the starter drawings and labels
with the story’s own beats.

## Visual direction

- Use a pure white canvas, bold black marker lettering, and restrained ochre and teal accents.
- Place a larger character or central idea as the anchor. Stagger the remaining drawings
  at different heights with enough space to reveal each silhouette, label, and accent separately.
- Use a few short dotted marks or an underline to guide the eye. Keep connectors clear of
  lettering and keep the illustration readable when paused.
- In horizontal videos, move the camera between board regions when it helps tell the story.
  In Shorts, build down the board with fewer elements per beat and reserve caption space.

## Animation

- Draw outlines in stroke order with `MarkerDrawing` or custom SVG paths. Bring in the color
  after the linework. Use occasional marker-tip motion when it clarifies a reveal.
- If the user supplies finished artwork to animate, preserve the composition and separate
  linework and pigment into independently timed reveals.
- Schedule underlines, highlights, and checkmarks as separate reveals. An underline or highlight
  starts after its target text is fully drawn. A checkmark starts after the action it confirms.
  Derive the accent cue from the end of that reveal. For automatic raster tracing, isolate the
  accent in its own mask or pass and give it an explicit cue.
- Place reveals on the aligned words in `vo.gen.ts` or `vo[].words`. Use authored frame cues
  for silent work. Preserve a supplied narration track when the user asks to reuse it.
- If sound design is requested, use `$suggest-sfx` for sparse drawing and paper sounds.

Inspect the opening, midpoint, and completion of important strokes. For dependent accents,
check the last frame before the accent and the first frame where it is visible. Confirm the
target is complete and the accent is absent in the first frame. Then check the finished board
and caption safe areas before the full render.
