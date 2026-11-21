# Dawah clips

> **Arabic video (RTL).** Start on the right and build toward the left. Draw, write, and reveal elements right to left, and lay out the screen in that same order. Follow the [global Arabic video direction rule](../../AGENTS.md#arabic-video-direction-rtl).

The owner-supplied [reference direction](REFERENCE.md) supersedes the initial silent
preview's visual styling. The renderer now implements the speaker-first frame, violet
word highlight, paper strips, optional cutaways and internal jump cuts.

Turn a recorded Arabic lesson into a batch of contextual vertical Shorts. The original
speaker's video and audio stay together. No TTS, music, API key, or network call is used.
The YouTube URL records provenance; this tool operates on a supplied local video and
does not download YouTube videos.

## Editorial rule: assemble the story

A Short is an edited story assembled from the lesson. It may combine phrases or
complete sentences from widely separated timestamps, in the order that best serves
the idea. Do not assume that one Short equals one continuous source excerpt. Reading
only the first attractive passage and cutting a 30–60-second window is not selection.

Before cutting:

1. Read the full transcript and identify the Short's central idea and payoff.
2. Find source passages for the opening, development, and ending. Search the whole
   lesson for stronger supporting lines, including passages far apart in the source.
3. Write the assembled spoken script in final playback order. For every part record
   exact source bounds, its `role`, and why it belongs there. Use `keep` in this order.
   For example: an opening from minute 18, an explanation from minute 4, and an ending
   from minute 27 may form one Short.
4. Review the original context around every selected part, then read and listen to
   the assembled result. Reordering must preserve who said what, the subject of each
   pronoun, negations, conditions, exceptions, and the scope of religious claims.
   Do not splice words into a new statement the speaker did not mean.
5. Choose captions, paper cues, and cutaways against the assembled script. Export only
   after checking every join for meaning and clipped syllables.

A single continuous passage is valid when it already tells the strongest complete
story. Record that editorial reason in `reason`; do not force multiple cuts for their
own sake. Complete this selection process for each Short, including a three-Short batch.

## Silence and pacing

Tighten the assembled Short by removing verified dead air inside passages and between
them. A long quiet interval is a candidate for a cut, not proof that speech is absent.
Never cut a spoken word, a quiet syllable, a whispered prayer, or a word that ASR missed.

1. Inspect the source audio and listen around each candidate pause. A waveform or
   spectrogram helps distinguish low-level speech from room noise. Compare with real
   word timestamps where available; low volume or a gap in the transcript is not enough.
2. For a confirmed silent interval, trim its interior and preserve a small margin around
   adjacent speech. About 100–150 ms on each side is a starting point, adjusted by ear.
   Preserve short natural breaths and intentional pauses that carry the meaning.
3. Split the relevant `keep` entry into retained ranges on verified frame boundaries.
   Record the removed source interval and reason in the edit notes. Remap every word,
   paper cue, cutaway and SFX cue through the revised edit.
4. Listen to every assembled join at normal speed. Reject a cut if it clips a syllable,
   merges words awkwardly, clicks, or changes the meaning. Restore padding or retain
   the pause when uncertain. Use direct visual cuts; do not overlap spoken words to
   conceal an edit.

Optional FFmpeg detection, which only writes a report and never changes the source:

```bash
ffmpeg -hide_banner -i lesson.mp4 -vn \
  -af silencedetect=noise=-45dB:d=0.35 -f null - 2> silence-candidates.log
```

The threshold and minimum duration above are inspection starting points, not an automatic
cut policy. Tune against the actual speaker and recording. Do not run blanket
`silenceremove` processing and assume quiet speech is safe.

## Captions or paper-only text

Choose the text mode for each Short explicitly:

- `captionMode: word-highlight`: short spoken phrases with the active word highlighted.
- `captionMode: subtitles`: spoken phrases without per-word highlighting.
- `captionMode: none`: no generated caption track. Use selected animated paper cues
  more often to carry key phrases, references and emotional words. Do not transcribe
  every sentence into a new paper card. Give each cue enough reading time and leave
  the speaker's face and important gestures visible.

For paper-only production, retain the transcript and timing data for editing and cue
sync even though they are not displayed. `none` disables generated captions, not text
already burned into the source video. Select paper density by the passage, not a fixed
quota. Quotes stay verbatim; editorial paraphrases use `kind: summary`.

## Workflow

Run from the repository root:

```bash
python -m tools.dawah_clips init --video /absolute/path/lesson.mp4 \
  --transcript /absolute/path/lesson.srt --url 'https://www.youtube.com/watch?v=SOURCE' \
  --speaker 'اسم الشيخ' --output projects/lesson-01-assets/assets
```

Inputs: SRT, JSON with `segments`, or plain UTF-8 text. Text without timestamps is
stored for editorial reading; it cannot be exported until accurately timed segments
replace `transcript.json`. SRT provides phrase timing, not word timing. Never distribute
words evenly across an SRT window and call that alignment.

Read the full transcript and author candidate selections in `clips.json`. Selection is
an editorial task performed by Codex with the owner, not a duration-based automatic
ranking. Aim for complete ideas, often 30–90 seconds. Include the reply to a quoted
objection, qualifications, conditions, and exceptions. Keep the actual spoken words.
Avoid hooks that change a religious claim or sensationalize it.

The initialized file contains source metadata, a relative transcript path and an empty
`clips` array. Fill the array using this shape. All times are seconds on the **source**:

```json
{
  "slug": "complete-idea",
  "title": "عنوان قصير للمقطع",
  "keep": [
    {"start": 1080, "end": 1088, "role": "hook", "reason": "افتتاح من موضع متأخر في الدرس"},
    {"start": 240, "end": 260, "role": "development", "reason": "شرح الفكرة من موضع سابق"},
    {"start": 1620, "end": 1632, "role": "payoff", "reason": "خاتمة تكمل المعنى"}
  ],
  "reason": "تجميع افتتاح وشرح وخاتمة من مواضع مختلفة مع الحفاظ على السياق",
  "fit": "cover",
  "position": 50,
  "captionMode": "subtitles",
  "visualMode": "speaker",
  "emphasis": [
    {"start": 245, "end": 248, "text": "تلخيص تحريري للمعنى", "kind": "summary"}
  ],
  "review": {"context": false, "listened": false, "text": false, "approved": false}
}
```

Generate the review sheet:

```bash
python -m tools.dawah_clips review --plan projects/lesson-01-assets/assets/clips.json
```

`review.md` contains the assembled script and each part in playback order, with its
source/output bounds, role, reason and two transcript segments before and after it.
Also read the full lesson when those segments do not resolve the context. Listen to
each proposed cut and check the first/last syllables. Review Quran/hadith wording,
names, and attribution against the source. Flags record completed review, never a
substitute for it. Mark `context`, `listened`, `text` and `approved` true after review.
This does not require a separate permission prompt if the user has authorized the work.

```bash
python -m tools.dawah_clips export --plan projects/lesson-01-assets/assets/clips.json
cd remotion
npm run gen
npx tsc --noEmit
node scripts/frames.mjs <CompositionId> 0,60,150 --scale=0.5
node scripts/render-all.mjs <CompositionId> --scale=1
```

Export requires FFmpeg/FFprobe and a local source with video and audio. It cuts approved
clips accurately by decoding and re-encoding, without changing speech speed. Each clip
gets a folder under `projects/<slug>/`. Review the source clip in `assets/source-clip.mp4`
and the render data in `_source/clip.json`. `project.json` records source bounds and review flags.
`clip.json` beside the TSX contains the editable visual data and clip-local timestamps.
The source clip carries audio; do not mount a second narration track.

Existing slugs are rejected on rerun to avoid duplicating Shorts. Edit an exported
`clip.json` for visual changes, or use a new slug for a different cut. Rendering is a
separate stage so every clip receives frame QA before a full render.

## Timestamp contract

JSON transcript example:

```json
{"segments": [
  {"start": 120.4, "end": 122.1, "text": "نص مطابق للصوت",
   "words": [
     {"start": 120.4, "end": 120.8, "text": "نص"},
     {"start": 120.9, "end": 121.3, "text": "مطابق"},
     {"start": 121.4, "end": 122.1, "text": "للصوت"}
   ]}
]}
```

Segments must be ordered and nonoverlapping. Cuts include whole segments. If a cut
falls inside one, split it at a verified spoken boundary first. Optional `words` must
be real, reviewed timestamps inside their segment and reproduce its text. Use
`word-highlight` only when every selected segment has word times. Word groups are
displayed in phrases of at most five words. Segment-only subtitles must be short
phrases, at most 10 words / 75 characters, rather than paragraphs. Review actual line
wrapping in rendered frames. No guessed timing fallback is allowed.

When `captionMode` is omitted, export chooses `word-highlight` if all selected phrases
have word timestamps, otherwise `subtitles`.

For untimed text, generate a local draft and compare it with the supplied transcript:

```bash
python -m tools.dawah_clips transcribe --video /path/lesson.mp4 \
  --output projects/lesson-01-assets/assets/transcript.draft.json
```

This uses the shared local Whisper helper from `tools/prepare_narration.py` and requires
`requirements-voice.txt`. A model must be cached locally or downloaded on first use.
The draft is a separate file; it never replaces the supplied text automatically.
Review the draft against the original transcript and audio, then save reviewed segments
as `transcript.json`. ASR word timestamps are draft measurements, not guaranteed exact.

For reviewed SRT/JSON phrase windows, add word alignment without rewriting the text:

```bash
python -m tools.dawah_clips align --video /path/lesson.mp4 \
  --transcript /path/reviewed.srt --output /path/aligned.json
```

This reuses the shared forced aligner. Windows must be at most 30 seconds / 400 tokens.
Invalid or incomplete alignment fails instead of falling back to estimates. Listen and
review the resulting words before importing them into the plan.

## Internal editing

Use `keep` for the source passages in **final playback order**, which may differ from
their order in the lesson. Source intervals must not overlap. A contiguous cut can
still use one `keep` entry or the legacy `start`/`end` pair:

```json
"keep": [{"start": 132, "end": 140}, {"start": 120.4, "end": 128.4}]
```

The result lasts 16 seconds. A source word at 133 seconds appears at output second 1;
a word at 121.4 seconds appears at output second 9. Optional `start`/`end` fields must
equal the minimum/maximum source bounds, not the first/last playback entries.
For internal edits each kept range must last a whole number of frames at 30 fps.
Author the cut in a natural pause at that frame precision. Captions, word timestamps,
paper cues and cutaways are remapped through the same edit. List paper cues and cutaways
in output story order while keeping their timestamps in source seconds. A cue crossing a removed
interval fails validation; split it into reviewed cues instead. Review sheets expose
the omitted transcript as well as the retained wording. Listen across every join.

## Production modes and cutaways

`visualMode` controls the allowed insert types:

| Mode | Picture |
| --- | --- |
| `speaker` | Original speaker, word captions and occasional paper strips. Default. |
| `stick` | Speaker plus symbolic SVG stick-figure inserts. |
| `stock` | Speaker plus imported still images or video. |
| `mixed` | Both kinds of inserts, selected per beat. |

The speaker's source video stays mounted and audible beneath every insert. Insert
videos are muted. The picture returns to the speaker when the insert ends; captions
and paper cues remain on the same continuous output clock. No music is added.

Stick scenes currently include `prayer`, `regret`, and `hope`, each with a suitable
setting and restrained frame-based motion. Select a scene because it supports a spoken
idea. Do not turn every noun into a new shot. Start with brief inserts around 2–4 seconds
and leave enough time with the speaker for expression and gestures to carry the passage.

Example fields on a clip, with **source** timestamps:

```json
"visualMode": "mixed",
"cutaways": [
  {"start": 1081, "end": 1084, "kind": "stick", "scene": "regret"},
  {"start": 245, "end": 248, "kind": "video", "file": "assets/prayer.mp4",
   "offset": 1, "fit": "cover", "creator": "Photographer name",
   "sourceUrl": "https://www.pexels.com/video/ACTUAL-ASSET-ID/",
   "license": "Pexels License", "licenseUrl": "https://www.pexels.com/license/"}
]
```

The local stock file is resolved relative to `clips.json`. `kind: image` takes the same
provenance fields, with no video offset needed. Export copies each asset into the Short's
media directory and stores its provenance in `clip.json` and `project.json`. The insert
list must be nonoverlapping and in output story order, and each insert must fit within one kept range.
Videos must have sufficient duration after `offset`; they are not silently stretched.

Asset selection is editorial. Find free photos/videos on [Pexels](https://www.pexels.com/license/)
and free images on [Unsplash](https://unsplash.com/license), inspect the actual asset and
its license, then download and record provenance. This tool does not perform automatic
stock search or require API keys. Do not treat all search results or Unsplash+ assets
as covered by the standard free license. For remorse or wrongdoing, choose symbolic
imagery or a stick figure rather than attributing the story to an identifiable stock model.

## Visual contract

- 1080×1920 at 30 fps. Speaker-led picture, white outlined Arabic captions and a violet
  background behind the active word, following the owner's reference. No fixed title
  or speaker header by default. `title` and `speaker` remain project metadata.
- `cover` fills the screen by default; `contain` preserves the entire source picture.
  `position` adjusts horizontal framing from 0 to 100 percent. Check face/hands at
  several moments before choosing a crop. No automatic face tracking in this version.
- Paper cues and subtitles occupy separate zones away from the right action rail
  and bottom platform controls. Arabic is RTL and words stay connected.
- `quote` must occur verbatim in the selected transcript. `summary` is visibly labeled
  `المعنى باختصار`. This check verifies text matching, not religious authenticity.
- `label` is a short keyword or editorial label. All emphasis kinds appear on a cream
  paper strip with a torn edge. They may remain visible across several caption phrases.
- Paper cues support `animation: rise|slide|unfold|stamp` and `paper: torn|note|strip`.
  Omitted values alternate restrained presets. Vary entrances to suit the beat, with
  a readable hold and a short fade out. Text stays still during the hold; avoid spins,
  repeated bounces or abrupt disappearance. All motion uses the frame clock.
- Paper shapes have irregular edges, a subtle fiber texture and soft depth. Paper text
  uses locally bundled Noto Naskh Arabic at weight 600, under its bundled OFL license.
  The caption track uses Geeza Pro, Noto Sans Arabic, then Arial. Inspect shaping,
  line breaks and contrast on the actual render host.
- Preview-only scaffolds omit media and say so on screen. Exported clips always use
  real source media. Do not publish the placeholder as a lesson.

Paper-only example, with source timestamps inside one retained range:

```json
"captionMode": "none",
"emphasis": [
  {"start": 1081, "end": 1084, "kind": "label", "text": "كلمة مؤثرة",
   "animation": "slide", "paper": "torn"},
  {"start": 1084.5, "end": 1087.5, "kind": "summary", "text": "تلخيص واضح للمعنى",
   "animation": "unfold", "paper": "note"}
]
```

## Sound effects

Follow [the non-musical SFX guide](SOUND.md) for verified free sources, the two imported
CC0 paper sounds, local procedural foley generation and the existing mixing workflow.
SFX are optional and sit under the original voice. This template does not add background
music. Set effects on chosen visual beats after editing, not on every silence cut.

Standalone scaffold, when needed:

```bash
python tools/create_project.py --format short --template dawah-clips \
  --narration recorded --slug example
```

For a six-second silent layout preview, scaffold with `--narration none --duration 6`,
then copy `templates/dawah-clips/preview.json` to the generated shot directory
as `clip.json`. Its text and cue times are illustrative, not aligned sermon content.

For the symbolic scene preview, use a nine-second silent scaffold and copy
`cutaway-preview.json` instead. This demonstrates illustrative cue timing, not real
word alignment. It contains no external photos or video.

For paper-only text with all four animation presets, use a twelve-second silent
scaffold and copy `paper-preview.json`. It deliberately retains a hidden caption
in its data to demonstrate that `captionMode: none` suppresses that track.

For actual lessons use the batch exporter. Start with three selections from one lesson,
review their context, listen, inspect frames at caption/emphasis boundaries and the final
frame, then render. Preserve an unbroken source copy for future edits.
