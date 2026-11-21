# Egyptian Comedy Explainer

Style Atlas 87 · Video Studio · Horizontal Arabic explainer

![Preview from the approved reference](../style-atlas-previews/87-egyptian-comedy-explainer.webp)

Start with an everyday setup. Build the joke out of props and reactions timed to the narrator. Give the serious turn room to land, then bring an opening prop back for the close. The reference, «إحنا بنتجوز ليه؟», goes from a wedding schedule to a spoon in a pot, then returns to the schedule with a different question.

## Start a production

```sh
python3 tools/create_project.py --format video --template egyptian-comedy-explainer \
  --slug my-essay --language ar --narration recorded
```

The starter copies the character art, scene engine, reference storyboard, font files and OFL licenses. It starts at 1920×1080, 30 fps and the reference duration of 90.4 seconds. Use `--narration none` to inspect the starter silently. For a new story, replace `_source/storyboard.ts` with its own text, props and word times. Set the final duration in `project.json` and `_source/index.tsx` after editing the voice. Save the script in `script.md` and any project artwork and recordings in `assets/`.

## Picture and direction

- Start on warm off-white, `#fbf8ef`. Fade in the scene paper over 0.42 s. Use cream `#f5e9cb` for setup, pale sage `#dcece2` for a reset or reflective beat and peach `#f6dfd0` for comic tension. Keep the 30 px dot grid, off-white illustrated area and faint dashed baseline. The paper changes with the scene.
- Keep the headline on the right in Lemonada 700. Use ink `#243831` and an underline in terracotta `#bc523a` that draws from right to left. Use teal `#167567`, mint `#98d6c5`, coral `#ed9b79` and ochre `#edbb58` for the illustrations. The bundled files fix the Arabic type across machines. Use native Arabic shaping and right alignment for text blocks. Use Noto Naskh Arabic for an Arabic quotation and set its source in `verseLabel`.
- Place the first focal point at the right. Stage each group from its rightmost prop toward the left, with the first directional stroke starting on the right. Keep the drawings in the illustrated field and the copy in its own column. Center short labels inside their stickers.
- Use the stock rounded vector props, expressive eyes and eyebrows, sparse outlines and soft contact shadows. The two characters blink, glance and tilt independently. Stagger them, switch expressions at the punchline and give the offending prop a separate scale reveal. Reuse an early prop in the closing image.
- Keep motion frame-driven. A prop enters from the right with a 0.36 s settle, slight overshoot and short wiggle. It exits to the left over 0.28 s where needed. Scene entrances use 0.32 s, pre-cut fades 0.14 s, and the close fades across the last 20 frames. The verse uses a still paper panel and line fades on speech. No effects or animated comedy props during recitation.
- Use short, timed screen phrases in place of a running subtitle track. Author the storyboard in seconds on the **edited audio** clock. The starter adds the 0.50 s lead to scene, title, layer, exit and verse times and delays the audio by 15 frames. Leave room for the last line and closing fade.

## Narration

Use the [original voice directions and fully vowelled sample](voice-prompt.md). Put performance direction in the voice instruction field and spoken copy in the script field. Record one continuous Egyptian Arabic voice, with short sentences, small pauses and dry, well-timed comic reactions. Read formal quotations distinctly and at a measured pace. Record a clean isolated track without music or SFX.

The approved cut used a supplied WAV. Its generator, voice ID and settings were not recorded. For a new AI take, use the repo's `tools/prepare_narration.py --project projects/<slug>/project.json --language ar` continuous-master workflow with the saved directions. The earlier take used Gemini `gemini-2.5-flash-preview-tts` with `Puck` and is an alternate voice reference. Keep the raw AI take as a separate file before processing it.

```sh
python3 templates/egyptian-comedy-explainer/prepare_recording.py \
  projects/my-essay projects/my-essay/assets/recording.wav
```

The helper uses FFmpeg and the locally cached faster-whisper `medium` model. It detects pauses from 0.34 s below −42 dB, cuts about 70% from the middle of each interior pause, retains up to 0.22 s of leading silence and 0.40 s trailing, then applies pitch-preserving 1.10× speed. It targets −16 LUFS, −2 dBTP and LRA 9 in 48 kHz AAC at 192 kb/s. It writes `assets/narration.m4a` and word times in `_source/alignment.json`. Listen back, check the Arabic transcript against the spoken copy and verify the anchor words before placing visual cues.

## SFX and finish

Use [the exact 28-cue reference plan](reference/sfx-plan.json) for sound selection and relative levels. Paper and cards use `page-flip` or `ui-click-soft`, a toggled bulb uses `ui-toggle-on`, a door uses `knock-solid`, a clock uses `clock-tick-soft`, and placed props use `chess-piece-thock`. A reveal or reaction uses `pop-reveal`, the spoon punchline uses `impact-soft`, and moving paths or disappearing props use `whoosh-soft`. Reuse the catalog clips. Reference gain runs from −13 to −4 dB with ducking and no music bed. Leave room for unscored speech.

For a new edit, copy the plan to the project as `sfx-plan.json`, replace its paths and duration, and retime the cues to the frame where the visual action reads. Its times are already on the video clock, including the voice lead and any entrance offset. Approve the SFX audition before final mixing. Use [the reference settings](reference/project.json), [script](reference/script.md) and [audio alignment](reference/alignment.json) to check how the original edit was assembled. The voice and video masters remain in the local `projects/family-foundations-comedy-v2/` production.

For production, generate the registry, typecheck and inspect an RTL sequence of stills across entrances, text changes and the verse. Then render with `node remotion/scripts/render-all.mjs my-essay`, and mix with `python3 tools/mix_sfx.py projects/my-essay/sfx-plan.json --out projects/my-essay/output/mixed.mp4`. The approved cut used the following final pass, preserving the picture stream.

```sh
ffmpeg -i projects/my-essay/output/mixed.mp4 -c:v copy \
  -af 'alimiter=limit=0.81:level=false:latency=true' \
  -c:a aac -b:a 224k -movflags +faststart projects/my-essay/output/final.mp4
```
