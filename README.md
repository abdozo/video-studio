# Video Studio

Everything for one video lives under `projects/<slug>/`. Open `script.md` for the script, `assets/` for art, audio, and editable Rigby2D files, and `output/` for previews and final renders. Remotion source lives in `_source/` and project settings and timings live in `project.json`.

## Create and render

Install Node.js, Python 3 and FFmpeg. Install the Remotion dependencies once. Install `requirements-voice.txt` if you need narration or word alignment.

```sh
npm --prefix remotion ci
python3 tools/create_project.py --format video --template animation --slug first-film --duration 10
npm --prefix remotion run studio
npm --prefix remotion run render -- first-film
```

The render is written to `projects/first-film/output/first-film.mp4`. Use `npm --prefix remotion run still -- first-film` for a preview frame. For specific frames, generate the registry and run `node remotion/scripts/frames.mjs first-film 0,30,60`.

Place generated media you want to keep under the project's `assets/`. Remotion serves those files with `staticFile('projects/<slug>/<filename>')`. Shared sound and music are available under `staticFile('library/...')`. Projects and renders stay local and are excluded from Git.

## Templates

| Template | Guide |
| --- | --- |
| `animation` | [Rigby2D and Remotion](templates/animation/README.md) |
| `motion` | [Horizontal video](.agents/skills/make-video/SKILL.md) / [Shorts](.agents/skills/make-short/SKILL.md) |
| `whiteboard` | [Classic Whiteboard](.agents/skills/whiteboard-template/SKILL.md) |
| `vox` | [Vox collage](templates/vox/DESIGN.md) |
| `ai-short` | [Generative video Shorts](.agents/skills/make-ai-short/SKILL.md) |
| `motion-comic-static`, `motion-graphic-animated` | [Motion comic production](templates/motion-comic/README.md) |
| `dawah-clips` | [Dawah clips](templates/dawah-clips/README.md) |
| `company-analysis` | [Company analysis](templates/company-analysis/README.md) |
| `sticky-notes` | [Sticky Notes](templates/sticky-notes/README.md) |
| `vector-explainer` | [2.5D vector explainer](templates/vector-explainer/README.md) |
| `memphis-group` | [Memphis Group](templates/memphis-group/README.md) |
| `lines-anime` | [Lines Anime](templates/lines-anime/README.md) |

## Audio

Use `python3 tools/prepare_narration.py --project projects/<slug>/project.json`. For a recorded take, use `--mode recorded --audio <file>`. AI narration uses Gemini and only needs `GEMINI_API_KEY` when generating speech. Keep generated or aligned timestamps in the project. Use the shared sound library before generating or importing audio.

```sh
python3 -m unittest discover -s tests -v
npm --prefix remotion run gen
npm --prefix remotion run typecheck
```
