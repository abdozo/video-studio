import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {ReactNode} from 'react';

export function useAtlasTimeline() {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames - 1);
  const move = (start:number,end:number) => interpolate(t,[start,end],[0,1],{
    extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.34,.05,.23,1),
  });
  return {t,move};
}

export function AtlasFrame({label,children}:{label:string;children:ReactNode}) {
  return <AbsoluteFill><svg width="100%" height="100%" viewBox="0 0 1280 720" aria-label={label}>{children}</svg></AbsoluteFill>;
}

export function DrawLine({d,amount,color,width=6,dash=false}:{d:string;amount:number;color:string;width?:number;dash?:boolean}) {
  if (dash) {
    return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
      strokeDasharray="2 12" opacity={amount}/>;
  }
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
    pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-amount}/>;
}
