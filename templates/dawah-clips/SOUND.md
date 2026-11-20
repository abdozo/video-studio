# Non-musical sound design

Use the shared `suggest-sfx` workflow and `tools/mix_sfx.py`. Original speech stays
prominent. No background music, melodic beds, nasheeds, or extra recitation tracks are
part of this template. Choose restrained paper movement, air movement or a short
contextual environmental sound when it supports a visible beat. Do not add an effect
to every word, every paper cue, or every jump cut.

## Sourcing

Reuse suitable shared assets first. Historical provider metadata stays intact; those
assets are not automatically CC0. For new reusable material prefer verified CC0 or
CC BY with the necessary credit. Record the creator, exact source, license URL and
any edits. Free-to-download does not establish reuse rights. These resources were
checked on 2026-11-12:

| Source | Scope and license | Local status |
| --- | --- | --- |
| [Various Paper Sound Effects, Luckius](https://opengameart.org/content/various-paper-sound-effects) | Paper handling pack, CC0-1.0 | Two clips imported as `paper-handling-cc0-1` and `paper-handling-cc0-2`. |
| [Crumpling Paper, OwlStorm](https://freesound.org/people/OwlStorm/sounds/151231/) | Paper recording, CC0 | Reference only; not imported. Download requires login. |
| [Blanket sound licensing](https://github.com/rafaelmardojai/blanket/blob/master/SOUNDS_LICENSING.md) | Lists CC0 birds, stream and wind, with links to original recordings; other sounds have other licenses. | Reference only; verify the chosen original before import. |

These are foley and nature sources, not a verified collection specifically labeled
Islamic. Judge suitability against the actual passage and the owner's preferences;
do not claim a religious ruling or infer a track is non-musical from its title.

Imported paper files originate from `paper_sound_-_1.mp3` and `paper_sound_-_2.mp3`.
The shared catalog preserves their page URL, file URLs, creator, CC0 license link and
verification date. Normalized duration is about .49 and .55 seconds respectively.

## Making a missing effect locally

For a missing non-tonal variation, `tools/synthesize_foley.py` offers deterministic
noise-based `air-swish` and `paper-brush` recipes. These are synthetic foley, not
recordings of real paper, AI-generated speech, or music. No provider key is needed:

```bash
python tools/synthesize_foley.py --kind air-swish --seed 7 --output /tmp/air-swish.wav
python tools/import_audio.py --kind sfx --id air-swish-local \
  --file /tmp/air-swish.wav --source-url 'repo:tools/synthesize_foley.py;kind=air-swish;seed=7' \
  --license 'MIT; repository LICENSE; procedural audio without external samples' \
  --category motion --tags air,non-musical,local \
  --discovery-note 'Keep the generated provenance JSON alongside project production notes'
```

Keep the emitted `.provenance.json` with the project's production notes, audition the
sound, then import only useful missing variations. The seed and generator/audio
hashes permit reproduction. Do not invoke the legacy ElevenLabs generator.

`air-swish-local` is already imported as one example. Its original WAV provenance is
stored in `air-swish-local.provenance.json` beside this guide; the shared library holds
the normalized MP3. None of the three new sounds has been mixed over a lesson yet.

## Timing and review

Author `sfx-plan.json` after the spoken edit and visual cues are final. Its `at_s` uses
the **assembled output** timeline, not source-video seconds. Sync to the first visible
paper movement, a meaningful reveal or the appropriate real word time. Imported
cutaway video audio remains muted.

Print the resolved sheet with `python tools/mix_sfx.py <plan> --print`. Follow the
`suggest-sfx` skill's user-audit requirement before mixing. Then render an audition,
listen across the affected words and joins, and reduce or omit effects that mask
consonants or distract from the passage. Do not assume an effect that sounded quiet
in isolation is quiet under the speaker. No automatic SFX is added merely by enabling
paper animation.
