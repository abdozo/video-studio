# Video Studio

Run project tools from the repository root. Read `brand.md` before designing visuals.

## Arabic video direction (RTL)

For an Arabic-language video, use right-to-left (RTL) direction in every template and scene. Build the storyboard and layout from the right edge, with the first panel, item or focal point on the right and subsequent items to its left. Draw, write and reveal elements from right to left. Keep ordered entrances, arrows, directional wipes and camera moves consistent with that reading order when they carry the story across the screen.

Use native RTL text shaping and right alignment for Arabic titles, labels and captions. Let the text renderer handle mixed Arabic, Latin text and numerals. For handwriting animation, follow the Arabic stroke order. Inspect a representative animation sequence before the final render and verify the layout, reveal order and writing direction.

## Production workflow

- Create productions with `tools/create_project.py`. Keep the script, assets, output, Remotion source and settings together under `projects/<slug>/`.
- Place project-specific images, recordings, Rigby2D files and exported frame sequences in `assets/`. Copy selected ImageGen outputs there before referencing them. Use `staticFile('projects/<slug>/<filename>')` for those assets.
- Keep scene sources in `_source/`. Put review frames, previews and final renders in `output/`. Shared template assets live under `templates/`; reusable audio lives under `library/`.
- Use the [Animation guide](templates/animation/README.md) for Rigby2D productions. Read the relevant [template guide](README.md#templates) before starting any other template. For sermon clips, read the Dawah guide before selecting excerpts and preserve its review and paper-only workflow.
- Prepare AI narration with `tools/prepare_narration.py --project projects/<slug>/project.json`. Reuse its continuous master and quota guard. Generate or align speech before final timing, then use actual word times for captions and visual cues.
- Keep Remotion motion deterministic and frame-driven. Use strictly increasing interpolation inputs, clamped where appropriate. Account for local frame numbers inside sequences.
- Generate the registry, typecheck and inspect representative frames before a full render. Check a narrated project's scene boundaries, captions and reveals against its aligned audio.

Project content, credentials, dependency folders and generated files are excluded from Git.
