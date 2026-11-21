# Video Studio

Everything for one video lives under `projects/<slug>/`. Open `script.md` for the script, `assets/` for art, audio, and editable Rigby2D files, and `output/` for previews and final renders. Remotion source lives in `_source/` and project settings and timings live in `project.json`.

## Quick start after cloning

On Windows 11 with WinGet, double-click [Windows Install.cmd](Windows%20Install.cmd) in the cloned folder. Leave the window open until setup finishes.

Setup installs Node.js, Python 3.12 and FFmpeg as needed, installs the video and audio packages, creates a sample project, and copies `.env.example` to `.env` if needed. Open `.env` and set `GEMINI_API_KEY` to your own Gemini API key.

On macOS or Linux, install Node.js 22, Python 3.12 and FFmpeg, then run the following from the repository root.

```sh
npm --prefix remotion ci
python3 -m pip install -r requirements-voice.txt
cp -n .env.example .env
python3 tools/create_project.py --format video --template whiteboard --slug first-film --duration 10
```

### Open Studio or render

```powershell
npm.cmd --prefix remotion run studio
```

Use a new terminal after setup so it picks up newly installed tools. Open the URL printed in the terminal and select `VideoFirstFilm`. To export `projects/first-film/output/first-film.mp4`, run the following from the repository root. On macOS or Linux, use `npm` in place of `npm.cmd`.

```powershell
npm.cmd --prefix remotion run render -- first-film
```

Remotion downloads Chrome Headless Shell on the first render if needed. Use `npm --prefix remotion run still -- first-film` for a preview frame. For specific frames, generate the registry and run `node remotion/scripts/frames.mjs first-film 0,30,60`.

Place generated media you want to keep under the project's `assets/`. Remotion serves those files with `staticFile('projects/<slug>/<filename>')`. Shared sound and music are available under `staticFile('library/...')`. Projects and renders stay local and are excluded from Git.

## Templates

[Style Atlas previews](templates/STYLE-ATLAS.html)

| Template | Guide |
| --- | --- |
| `egyptian-comedy-explainer` | [Egyptian Comedy Explainer](templates/egyptian-comedy-explainer/README.md) |
| `flat-vector-science` | [Flat-Vector Science](templates/flat-vector-science/README.md) |
| `watercolor-wash` | [Watercolor Wash](templates/watercolor-wash/README.md) |
| `shadow-puppet-theatre` | [Shadow Puppet Theatre](templates/shadow-puppet-theatre/README.md) |
| `whiteboard-explainer` | [Whiteboard Explainer](templates/whiteboard-explainer/README.md) |
| `psychedelic-poster` | [Psychedelic Poster](templates/psychedelic-poster/README.md) |
| `tech-glow-explainer` | [Tech Glow Explainer](templates/tech-glow-explainer/README.md) |
| `papercraft-models` | [Papercraft Models](templates/papercraft-models/README.md) |
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

Create narrated projects with `--narration ai`. Once the narration beats are in `project.json`, run `py -3.12 tools/prepare_narration.py --project projects/<slug>/project.json` to generate Gemini speech and align the words. For a recorded take, use `--mode recorded --audio <file>`. Keep generated or aligned timestamps in the project. Use the shared sound library before generating or importing audio.

```sh
python3 -m unittest discover -s tests -v
npm --prefix remotion run gen
npm --prefix remotion run typecheck
```

## Clean up retired Style Atlas previews

Run `python3 tools/cleanup_previews.py` from the repository root to see how
much space retired Style Atlas previews use. Add `--apply` to remove those
preview files. The tool protects output folders linked by the current gallery
and scopes cleanup to known Style Atlas runs. Project source, scripts, and
assets stay in place.
