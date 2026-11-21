# Atlas key comparison

Seven silent 15-second previews use the same pin-tumbler explanation. The diagram is simplified to three pins. The title and four beats use the same wording in every preview.

| Time | Visual beat |
| --- | --- |
| 0–4 s | Establish the key and the three pins that block rotation. |
| 4–8 s | Insert the key. Its teeth raise each pin according to their height. |
| 8–12 s | Emphasize the three splits meeting the shear line. |
| 12–15 s | Turn the key and show the unlocked result. |

The original Futurepedia prompts stay in the template directories. `prepare-reference.py` reads the helper library and drawing source from each prompt. The authored scenes call the original style functions for the board and marker, cold-press paper and washes, backlit stage and cloth, cosmic backdrop and grain, animated ink and poster typography, tech grid and bloom, or cutting mat and cardstock models. Geometry and timing live in `scenes.js`. Typography is loaded locally. The whiteboard preview uses a continuous board, so it does not include the reference's felt-eraser transition.

Run from the Video Studio root.

```sh
python3 remotion/experiments/atlas-key/prepare-reference.py templates
node remotion/experiments/atlas-key/render.mjs /tmp/atlas-key-qa --qa
node remotion/experiments/atlas-key/render.mjs projects/atlas-key-comparison/output
```

Set `ATLAS_STYLE` to a style's slug to render just its preview. The renderer also writes a small JPEG poster next to each MP4.
