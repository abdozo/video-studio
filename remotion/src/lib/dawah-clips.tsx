import React from 'react';
import {AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {DawahPaper, type PaperCue} from './dawah-paper';

export type DawahCaption = {
  start: number; end: number; text: string;
  words?: {start: number; end: number; text: string}[];
};
type CutawayBase = {start: number; end: number};
export type DawahCutaway = CutawayBase & (
  {kind: 'stick'; scene: 'prayer' | 'regret' | 'hope'} |
  {kind: 'image' | 'video'; src: string; offset?: number; fit?: 'contain' | 'cover'; sourceUrl: string; licenseUrl: string; license: string; creator: string}
);
export type DawahClipData = {
  video?: string;
  title: string;
  speaker?: string;
  showTitle?: boolean;
  fit?: 'contain' | 'cover';
  position?: number;
  visualMode?: 'speaker' | 'stick' | 'stock' | 'mixed';
  captions: DawahCaption[];
  captionMode?: 'none' | 'subtitles' | 'word-highlight';
  emphasis?: PaperCue[];
  cutaways?: DawahCutaway[];
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Symbolic poses, designed as full-screen cutaways. All clocks are Sequence-local.
const StickScene: React.FC<{scene: 'prayer' | 'regret' | 'hope'; duration: number}> = ({scene, duration}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = interpolate(frame, [0, Math.max(1, duration * fps)], [0, 1], clamp);
  const lift = interpolate(p, [0, 1], [15, -10], clamp);
  const night = scene !== 'hope';
  return <AbsoluteFill style={{background: night ? '#15212c' : '#eee9dc'}}>
    <svg width="1080" height="1920" viewBox="0 0 1080 1920">
      <defs>
        <radialGradient id="dawah-glow"><stop stopColor={night ? '#748c89' : '#fffef7'} stopOpacity=".65"/><stop offset="1" stopColor={night ? '#15212c' : '#eee9dc'} stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="620" cy="640" rx="630" ry="850" fill="url(#dawah-glow)"/>
      {scene === 'prayer' ? <g fill="none" stroke="#718982" opacity=".45" strokeWidth="3">
        <path d="M225 1200 V600 Q540 80 855 600 V1200"/><path d="M250 1200 V610 Q540 130 830 610 V1200"/>
      </g> : null}
      {scene === 'regret' ? <g stroke="#84959e" opacity=".4" fill="none">
        <rect x="630" y="350" width="240" height="440" strokeWidth="4"/><path d="M750 350 V790 M630 570 H870" strokeWidth="3"/>
        {Array.from({length: 14}, (_, i) => <path key={i} d={`M${646 + (i * 43) % 203} ${370 + (i * 71 + p * 90) % 345} l-14 40`} strokeWidth="2"/>)}
      </g> : null}
      {scene === 'hope' ? <g>
        <circle cx="740" cy={620 - p * 35} r="150" fill="#e6bc6c" opacity=".7"/>
        <path d="M0 1190 Q430 1030 1080 1140 V1920 H0" fill="#d0d7c4"/>
        <path d="M525 1100 Q600 1300 400 1920 H880 Q730 1340 525 1100" fill="#fffef7"/>
      </g> : null}
      <ellipse cx="500" cy="1170" rx="215" ry="26" fill={night ? '#090f19' : '#687865'} opacity=".3"/>
      <g fill="none" stroke={night ? '#fff5df' : '#283d3a'} strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" transform={`translate(0 ${lift})`}>
        {scene === 'prayer' ? <>
          <circle cx="510" cy="715" r="62"/><path d="M510 783 Q495 880 510 965 L620 1075 L440 1075 L400 1130 H650"/>
          <path d="M507 820 L410 900 L370 790 M505 820 L595 900 L640 790"/>
          <path d="M370 790 l-18 -25 m18 25 l12 -28 M640 790 l-12 -28 m12 28 l18 -25"/>
        </> : scene === 'regret' ? <>
          <circle cx="460" cy="730" r="62"/><path d="M480 796 Q535 855 535 975 L420 1035 L390 1140 M535 975 L635 1040 L650 1140"/>
          <path d="M500 835 L400 900 L438 790 M515 850 L590 930 L555 1010"/>
        </> : <>
          <circle cx="510" cy="690" r="62"/><path d="M510 760 V985 L445 1150 M510 985 L590 1150 M510 800 L410 865 L355 820 M510 800 L610 865 L665 820"/>
        </>}
      </g>
    </svg>
  </AbsoluteFill>;
};

const Cutaway: React.FC<{cue: DawahCutaway}> = ({cue}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (cue.kind === 'stick') return <StickScene scene={cue.scene} duration={cue.end - cue.start}/>;
  const scale = interpolate(frame, [0, Math.max(1, (cue.end - cue.start) * fps)], [1, 1.035], clamp);
  const style: React.CSSProperties = {width: '100%', height: '100%', objectFit: cue.fit ?? 'contain', transform: `scale(${scale})`};
  return <AbsoluteFill style={{background: '#15212c', overflow: 'hidden'}}>
    {cue.kind === 'image' ? <Img src={staticFile(cue.src)} style={style}/> :
      <OffthreadVideo src={staticFile(cue.src)} muted trimBefore={Math.round((cue.offset ?? 0) * fps)} style={style}/>}
  </AbsoluteFill>;
};

// The source stays mounted and audible under every cutaway. Never duplicate its audio.
export const DawahClip: React.FC<{data: DawahClipData}> = ({data}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const time = frame / fps;
  const caption = data.captions.find((c) => time >= c.start && time < c.end);
  const emphasis = data.emphasis?.find((c) => time >= c.start && time < c.end);
  return <AbsoluteFill style={{background: '#15212c', color: '#fffef7', fontFamily: '"Geeza Pro", "Noto Sans Arabic", Arial, sans-serif', direction: 'rtl'}}>
    {data.video ? <OffthreadVideo src={staticFile(data.video)} style={{width: '100%', height: '100%', objectFit: data.fit ?? 'cover', objectPosition: `${data.position ?? 50}% center`}}/> :
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', color: '#aaa9bd', fontSize: 30}}>معاينة التصميم · بدون فيديو مصدر</AbsoluteFill>}
    {(data.visualMode ?? 'speaker') !== 'speaker' ? data.cutaways?.map((cue, i) =>
      <Sequence key={i} from={Math.round(cue.start * fps)} durationInFrames={Math.max(1, Math.round(cue.end * fps) - Math.round(cue.start * fps))}>
        <Cutaway cue={cue}/>
      </Sequence>) : null}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 50%, rgba(0,0,0,.16) 78%, rgba(0,0,0,.25))'}}/>
    {data.showTitle ? <div style={{position: 'absolute', top: 210, left: 76, right: 180, fontSize: 36, textShadow: '0 1px 5px #000, 0 0 3px #000', WebkitTextStroke: '1px #17151d', paintOrder: 'stroke fill'}}>{data.title}</div> : null}
    {emphasis ? <DawahPaper cue={emphasis} time={time} index={data.emphasis!.indexOf(emphasis)} captions={data.captionMode !== 'none'}/> : null}
    {data.captionMode !== 'none' && caption ? <div style={{position: 'absolute', top: 1190, left: 76, right: 180, textAlign: 'center', fontSize: 55, fontWeight: 700, lineHeight: 1.4, textShadow: '0 2px 5px #000, 0 0 5px #000', WebkitTextStroke: '1.6px #17151d', paintOrder: 'stroke fill'}}>
      {data.captionMode === 'word-highlight' && caption.words?.length ? caption.words.map((w, i) => <React.Fragment key={i}>
        <span style={{display: 'inline-block', background: time >= w.start && time < w.end ? '#7c16d9' : 'transparent', borderRadius: 7, padding: '0 9px'}}>{w.text}</span>{' '}
      </React.Fragment>) : caption.text}
    </div> : null}
  </AbsoluteFill>;
};
