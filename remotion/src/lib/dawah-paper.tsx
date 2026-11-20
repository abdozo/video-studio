import React from 'react';
import {cancelRender, continueRender, delayRender, interpolate, staticFile} from 'remotion';

// Bundle the Arabic font locally; renders must wait for actual glyphs, not a fallback.
if (typeof document !== 'undefined') {
  const handle = delayRender('Loading Dawah paper Arabic font');
  const face = new FontFace('Dawah Naskh', `url("${staticFile('templates/dawah-clips/fonts/NotoNaskhArabic.ttf')}")`, {weight: '400 700'});
  face.load().then((loaded) => {
    // FontFaceSet.add is omitted when the host's TS lib excludes DOM.Iterable.
    (document.fonts as FontFaceSet & {add(font: FontFace): void}).add(loaded);
    continueRender(handle);
  }).catch(cancelRender);
}

export type PaperCue = {
  start: number; end: number; text: string; kind: 'quote' | 'summary' | 'label';
  animation?: 'rise' | 'slide' | 'unfold' | 'stamp';
  paper?: 'torn' | 'note' | 'strip';
};

const edges = {
  torn: 'polygon(0 2%,5% 0,11% 2%,18% 0,26% 1%,35% 0,44% 2%,55% 0,65% 1%,77% 0,87% 2%,96% 0,100% 2%,99% 20%,100% 42%,99% 68%,100% 96%,96% 99%,91% 96%,86% 100%,80% 97%,73% 99%,65% 96%,58% 100%,52% 97%,45% 99%,38% 96%,31% 100%,25% 97%,18% 99%,12% 96%,5% 100%,0 97%,1% 76%,0 54%,1% 31%)',
  note: 'polygon(1% 0,97% 1%,100% 12%,99% 98%,83% 100%,60% 98%,37% 100%,15% 98%,0 100%,1% 75%,0 48%)',
  strip: 'polygon(1% 1%,19% 0,40% 2%,65% 0,83% 2%,100% 0,99% 25%,100% 50%,99% 77%,100% 96%,93% 99%,85% 96%,77% 100%,68% 97%,59% 99%,50% 96%,41% 100%,30% 97%,22% 99%,12% 96%,1% 100%,0 76%,1% 47%,0 24%)',
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const animations = ['rise', 'slide', 'unfold', 'stamp'] as const;
const papers = ['torn', 'strip', 'note'] as const;

export const DawahPaper: React.FC<{cue: PaperCue; time: number; index: number; captions: boolean}> = ({cue, time, index, captions}) => {
  const duration = cue.end - cue.start;
  const age = time - cue.start;
  const enter = cue.start === 0 ? 1 : interpolate(age, [0, Math.min(.28, duration / 4)], [0, 1], clamp);
  const exit = interpolate(age, [duration - Math.min(.16, duration / 4), duration], [1, 0], clamp);
  const motion = cue.animation ?? animations[index % animations.length];
  const paper = cue.paper ?? papers[index % papers.length];
  const angle = paper === 'note' ? 1.1 : -.65;
  const x = motion === 'slide' ? (1 - enter) * 90 : 0;
  const y = motion === 'rise' ? (1 - enter) * 38 : 0;
  const scale = motion === 'stamp' ? .91 + enter * .09 : 1;
  const unfold = motion === 'unfold' ? .06 + enter * .94 : 1;
  const textOpacity = motion === 'unfold' ? interpolate(enter, [0, .6, 1], [0, 0, 1], clamp) : 1;
  return <div style={{position: 'absolute', top: captions ? 1370 : 1210, left: 76, right: 180,
    opacity: enter * exit, transformOrigin: 'right center',
    transform: `translate(${x}px, ${y}px) rotate(${angle + (motion === 'stamp' ? (1 - enter) * -4 : 0)}deg) scale(${scale}) scaleX(${unfold})`,
    filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.22))'}}>
    <div style={{clipPath: edges[paper], padding: '21px 30px 25px', color: '#283127',
      backgroundColor: paper === 'note' ? '#f2ead5' : '#fff6d7',
      backgroundImage: 'repeating-linear-gradient(7deg, transparent 0px, transparent 5px, rgba(107,83,39,.035) 6px, transparent 7px)',
      fontFamily: '"Dawah Naskh", "Geeza Pro", serif', fontSize: cue.text.length > 40 ? 44 : 52,
      fontWeight: 600, lineHeight: 1.35, textAlign: 'center'}}>
      {paper === 'note' ? <div style={{position: 'absolute', top: 0, right: 0, width: 26, height: 26, background: '#cfc2a4', clipPath: 'polygon(0 0,100% 100%,0 100%)'}}/> : null}
      <div style={{opacity: textOpacity}}>
        {cue.kind === 'summary' ? <div style={{fontSize: 25, fontWeight: 400, color: '#59614e', marginBottom: 5}}>المعنى باختصار</div> : null}
        {cue.text}
      </div>
    </div>
  </div>;
};
