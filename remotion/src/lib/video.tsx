import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, EASINGS, SHADOW} from '../brand';
import {FONT_BODY, FONT_DISPLAY} from '../fonts';
import {Captions, type VoLine} from './shorts';

const enter = (frame: number, at = 0, duration = 16) =>
  interpolate(frame, [at, at + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASINGS.easeOut,
  });

export const MotionCanvas: React.FC<{
  children: React.ReactNode;
  format?: 'short' | 'video';
  base?: string;
  accent?: string;
}> = ({children, format = 'video', base = COLORS.d900, accent = COLORS.accent}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const drift = (frame / Math.max(1, durationInFrames)) * Math.PI * 2;
  return (
    <AbsoluteFill style={{background: base, color: '#fff', overflow: 'hidden'}}>
      <AbsoluteFill style={{
        background: `radial-gradient(circle at ${24 + Math.sin(drift) * 5}% 22%, ${accent}35, transparent 31%), radial-gradient(circle at 76% ${72 + Math.cos(drift) * 4}%, ${COLORS.signal}22, transparent 34%)`,
      }}/>
      <AbsoluteFill style={{
        opacity: 0.13,
        backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px)',
        backgroundSize: format === 'short' ? '34px 34px' : '42px 42px',
      }}/>
      {children}
    </AbsoluteFill>
  );
};

export const StaticBackground: React.FC<{
  src: string; opacity?: number; blur?: number; overlay?: string;
}> = ({src, opacity = 0.55, blur = 0, overlay = 'rgba(13,17,23,.42)'}) => (
  <AbsoluteFill>
    <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', opacity, filter: `blur(${blur}px)`, transform: 'scale(1.03)'}}/>
    <AbsoluteFill style={{background: overlay}}/>
  </AbsoluteFill>
);

export const ChapterCard: React.FC<{
  kicker?: string; title: string; subtitle?: string; at?: number; align?: 'left' | 'center';
}> = ({kicker, title, subtitle, at = 0, align = 'center'}) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, 18);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start', padding: '9%'}}>
      <div style={{maxWidth: 1420, textAlign: align, opacity: p, transform: `translateY(${(1 - p) * 28}px)`}}>
        {kicker ? <div style={{fontFamily: FONT_BODY, fontWeight: 600, fontSize: 24, letterSpacing: 6, color: COLORS.signal, marginBottom: 24}}>{kicker}</div> : null}
        <div style={{fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 96, lineHeight: 1.02, letterSpacing: -3}}>{title}</div>
        {subtitle ? <div style={{fontFamily: FONT_BODY, fontSize: 34, lineHeight: 1.4, color: COLORS.d300, marginTop: 28, maxWidth: 1100}}>{subtitle}</div> : null}
      </div>
    </AbsoluteFill>
  );
};

export const LowerThird: React.FC<{title: string; detail?: string; at?: number}> = ({title, detail, at = 0}) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, 12);
  return <div style={{position: 'absolute', left: 86, bottom: 66, padding: '20px 28px', borderRadius: 14, background: 'rgba(22,27,34,.9)', border: `1px solid ${COLORS.d600}`, boxShadow: SHADOW.soft, opacity: p, transform: `translateY(${(1 - p) * 18}px)`}}>
    <div style={{fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 600}}>{title}</div>
    {detail ? <div style={{fontFamily: FONT_BODY, fontSize: 20, color: COLORS.d400, marginTop: 4}}>{detail}</div> : null}
  </div>;
};

export const Callout: React.FC<{children: React.ReactNode; x?: number; y?: number; width?: number; accent?: string; at?: number}> = ({children, x = 120, y = 180, width = 620, accent = COLORS.accent, at = 0}) => {
  const frame = useCurrentFrame();
  const p = enter(frame, at, 14);
  return <div style={{position: 'absolute', left: x, top: y, width, padding: '30px 34px', borderRadius: 16, borderLeft: `6px solid ${accent}`, background: 'rgba(255,255,255,.96)', color: COLORS.ink, fontFamily: FONT_BODY, fontSize: 30, lineHeight: 1.4, boxShadow: SHADOW.card, opacity: p, transform: `translateY(${(1 - p) * 20}px)`}}>{children}</div>;
};

export const ChapterProgress: React.FC<{chapters: string[]; active: number; color?: string}> = ({chapters, active, color = COLORS.accent}) => (
  <div style={{position: 'absolute', left: 72, right: 72, top: 38, display: 'flex', gap: 10}}>
    {chapters.map((chapter, index) => <div key={chapter} style={{flex: 1}}>
      <div style={{height: 5, borderRadius: 999, background: index <= active ? color : 'rgba(255,255,255,.18)'}}/>
      <div style={{fontFamily: FONT_BODY, fontSize: 14, color: index === active ? '#fff' : COLORS.d400, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{chapter}</div>
    </div>)}
  </div>
);

export const CaptionTrack: React.FC<{
  lines: VoLine[];
  mode: 'none' | 'subtitles' | 'word-highlight';
  format?: 'short' | 'video';
}> = ({lines, mode, format = 'video'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (mode === 'none' || lines.length === 0) return null;
  if (mode === 'word-highlight') {
    return <Captions lines={lines} y={format === 'short' ? 1280 : 900} size={format === 'short' ? 58 : 38} plate/>;
  }
  const time = frame / fps;
  const active = lines.find((line) => time >= line.start && time < line.end + .3);
  if (!active) return null;
  return <div style={{position:'absolute',left:'15%',right:'15%',bottom:format === 'short' ? 430 : 54,textAlign:'center'}}>
    <span style={{display:'inline-block',padding:'12px 22px',borderRadius:8,background:'rgba(0,0,0,.76)',color:'#fff',fontFamily:FONT_BODY,fontSize:format === 'short' ? 42 : 31,lineHeight:1.3}}>{active.text}</span>
  </div>;
};
