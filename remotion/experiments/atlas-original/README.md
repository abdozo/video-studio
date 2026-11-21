# Original Futurepedia previews

Each preview plays the original `explainer()` from its saved Futurepedia prompt.
The prompt's bundled drawing helper and example code are used unchanged, including
the example's story, lettering, animation and 15-second timing. Remotion supplies
the frame clock and captures the canvas with locally loaded fonts. The gallery
previews are silent.

From the Video Studio root:

```sh
python3 remotion/experiments/atlas-original/prepare-reference.py templates
node remotion/experiments/atlas-original/render.mjs /tmp/atlas-original-qa --qa
node remotion/experiments/atlas-original/render.mjs projects/atlas-original-references/output
```
