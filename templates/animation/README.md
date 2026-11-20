# Animation

1. Design a character sheet with the angles and expressions needed for the story. Copy the approved reference into the project's `assets/`.
2. Prepare the SVG in editable pieces. Keep each sleeve and trouser leg continuous and separate the parts that need independent movement or expression changes.
3. Sketch the shots and pick the hardest action. Rig the character in Rigby2D and preview that action before animating the full sequence. Keep the editable `.rigby` project in `assets/`. For dialogue, sync mouth attachments to the final recording in Rigby2D.
4. Export transparent PNG frames from Rigby2D at the project FPS. Keep them in a folder inside `assets/`, such as `assets/kid-jump/`. Re-export the frames after editing the Rigby2D project.
5. Compose in Remotion. Add the exported layer to `_source/animation.json`, then stage the background, props, camera and audio in `_source/index.tsx` as needed. Render representative frames before the full video.

Each layer takes a path relative to `assets/`, its first frame on the scene timeline, and the number of source frames. Name padding, prefix and the first source frame are configurable. Layers draw in list order.

```json
{
  "background": "living-room.png",
  "layers": [
    {
      "folder": "kid-jump",
      "startFrame": 12,
      "frameCount": 90,
      "firstFrame": 0,
      "digits": 4,
      "prefix": "jump-"
    }
  ]
}
```

This example reads `assets/kid-jump/jump-0000.png` through `jump-0089.png`. Optional `x`, `y`, `width` and `height` position the layer in the composition. By default the exported frame fills the composition with its aspect ratio preserved.
