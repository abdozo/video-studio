# Reference direction: speaker-led lesson edit

Owner-supplied reference: [اجبرني يارب | د. حازم شومان](https://www.youtube.com/shorts/_gC-aDYRtV4),
Good Shajara. Inspected in the browser and using a temporary 720×1280 copy on
2026-11-12. Duration approximately 113.14 seconds at 30 fps. The earlier silent
layout preview is a scaffold, not the intended visual direction.

## What is visible

- The speaker occupies the vertical frame. His face, upper body and hand gestures
  carry the shot. The table remains visible below him. The background stays in
  the same camera angle throughout the sampled frames.
- No permanent editorial headline or speaker-name header covers the top.
- Captions sit near the lower torso, just above the table. Usually a short phrase
  of about 2–6 words is visible, rather than a full sentence or paragraph.
- Caption text is bold white Arabic with a dark outline/shadow. The active word
  has a saturated violet rectangular background with slight corner rounding.
  The word itself stays white. It is not yellow text on a dark caption panel.
- Caption phrases are replaced as speech progresses. The violet block changes
  position with the active word. Some inspected moments have no caption; do not
  hold a completed phrase through a long gap.
- Near the opening, a secondary cream paper strip with a rough lower edge shows
  the quoted prayer while the short speech captions continue above it. This is
  an occasional supporting quotation, not a permanent summary heading.
- No illustrative cutaway, split-screen, or stock-footage insert appeared in the
  sampled frames. Do not add those as the default style for this reference.

## Verified cuts versus inference

Adjacent decoded frames around 1.0667 and 3.6667 seconds show an abrupt change in
the speaker's posture between consecutive frames. These are direct jump cuts in
the same camera view, without a dissolve or wipe. A wider contact sheet supports
the same visual pattern through the clip.

This verifies internal cuts in the finished Short. It does not establish precisely
which words or pauses were removed from the original lesson. That requires the
uncut source and listening review. A scene-change detector also responds to fast
hand movements, so its candidate timestamps are not a verified cut list.

## Changes needed in the template

1. Make a speaker-first preset: full-height source image, reviewed crop, no fixed
   header, limited darkening behind subtitles, original voice prominent.
2. Replace the current yellow word-color treatment with a violet active-word
   background and white outlined text. Make phrases short enough to stay close
   to one line where possible. Measure Arabic wrapping on the actual render host.
3. Add timed paper quotation strips, separately authored and reviewed. Distinguish
   quotations from editorial paraphrases. Do not copy the reference channel's logo.
4. Assemble a Short from passages anywhere in the full lesson using `keep` in final
   story order, which may differ from source order. A continuous excerpt is only one
   editorial option. Cut on reviewed spoken boundaries; preserve qualifications and
   complete meaning. Follow the editorial rule in README.md before cutting.
5. Remap source word timestamps into the concatenated output timeline. For a word
   inside a kept range: output time = prior kept duration + source time − range start.
   Apply the same mapping to quotation cues. Reject words/cues crossing an omitted
   boundary until that boundary has been corrected and reviewed.
6. Review the assembled audio across every join. Preserve natural breaths and
   prevent clipped syllables. No arbitrary silence threshold should decide the edit.

The renderer and exporter now support this direction: `keep` lists, shared cue
remapping, violet active-word backgrounds, paper strips and optional symbolic or
licensed-media cutaways. See README.md for the implemented schema and limitations.
Actual Arabic alignment and assembled speech still need listening review on the
first supplied clean lesson. The initial silent layout preview is historical.

`reference-frame.jpg` is an extracted analysis frame from the owner-supplied
reference. It is not production artwork, permission to republish, or a clean source
for the first three Shorts. Keep downloaded video copies temporary.
