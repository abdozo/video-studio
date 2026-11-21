# Style Atlas in Video Studio

> **Arabic video (RTL).** Apply the [global Arabic video direction rule](../AGENTS.md#arabic-video-direction-rtl) to the storyboard and render. Lay out, draw, write, and reveal elements from right to left. Include this instruction with the project topic when adapting an original Atlas prompt.

For the Video Studio [Egyptian Comedy Explainer](egyptian-comedy-explainer/README.md), use its local starter and production guide. The gallery thumbnail comes from the approved edit.

Read the entire template's `futurepedia-prompt.txt`, including its drawing source and sound kit. Keep that file intact. Use the supplied story and format for the new production, and reuse the drawing, lettering, textures, finishing and transitions defined by the source. Set the topic in your working instructions and keep the saved prompt unchanged.

Create the project with `tools/create_project.py`. Put artwork and sound in `assets/`, render code in `_source/`, and stills and videos in `output/`. Use Remotion's frame clock in place of a standalone HTML player's clock. Load the specified fonts before capturing frames. Render the source's sound cues when the brief calls for sound.

For a new story, use the source's visual storyboard step when the brief calls for approval. For a calibration against an existing reference, use its existing beats and state the changes to runtime, duration and sound. The Style Atlas gallery shows lightweight WebP stills from the original examples. For prompt-based styles without a project starter, scaffold with `--template motion` and use the preserved prompt to author the scene.
