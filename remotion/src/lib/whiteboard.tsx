import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {FONT_BODY, FONT_DISPLAY, FONT_EDITORIAL} from '../fonts';

export const WHITEBOARD = {
  paper: '#F3F6F4', ink: '#1E2926', muted: '#74817D', indigo: '#6366F1',
  teal: '#4DB8A8', amber: '#D89043', line: '#D8DFDB',
} as const;

const progress = (frame: number, at: number, duration: number) => interpolate(frame, [at, at + Math.max(1, duration)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(.33, 1, .68, 1)});
export const pathSeed = (d: string) => Array.from(d).reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);

export const WhiteboardCanvas: React.FC<{children: React.ReactNode; format?: 'short'|'video'; showGrid?: boolean}> = ({children, format = 'video', showGrid = true}) => (
  <AbsoluteFill style={{background: WHITEBOARD.paper, color: WHITEBOARD.ink, overflow: 'hidden'}}>
    {showGrid ? <AbsoluteFill style={{opacity: .28, backgroundImage: `linear-gradient(${WHITEBOARD.line} 1px, transparent 1px), linear-gradient(90deg, ${WHITEBOARD.line} 1px, transparent 1px)`, backgroundSize: format === 'short' ? '54px 54px' : '64px 64px'}}/> : null}
    <AbsoluteFill style={{opacity: .12, backgroundImage: 'radial-gradient(#74817D 0.7px, transparent 0.7px)', backgroundSize: '11px 13px'}}/>
    {children}
  </AbsoluteFill>
);

export const BoardCamera: React.FC<{children:React.ReactNode; keyframes:{frame:number;x:number;y:number;scale:number}[]}> = ({children,keyframes}) => {
  const frame=useCurrentFrame();
  if (keyframes.length < 2) return <AbsoluteFill>{children}</AbsoluteFill>;
  const frames=keyframes.map((key)=>key.frame);
  const options={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
  const x=interpolate(frame,frames,keyframes.map((key)=>key.x),options);
  const y=interpolate(frame,frames,keyframes.map((key)=>key.y),options);
  const scale=interpolate(frame,frames,keyframes.map((key)=>key.scale),options);
  return <AbsoluteFill style={{transform:`translate(${x}px, ${y}px) scale(${scale})`,transformOrigin:'center'}}>{children}</AbsoluteFill>;
};

export const InkPath: React.FC<{d: string; at?: number; duration?: number; color?: string; width?: number; viewBox?: string; cursor?: boolean; rough?: boolean; style?: React.CSSProperties}> = ({d, at = 0, duration = 30, color = WHITEBOARD.ink, width = 5, viewBox = '0 0 1920 1080', cursor = false, rough = true, style}) => {
  const frame = useCurrentFrame(); const p = progress(frame, at, duration); const evolved = evolvePath(p, d);
  const length = getLength(d); const point = getPointAtLength(d, Math.max(0, Math.min(length, length * p)));
  const seed = pathSeed(d); const roughX = .7 + (seed % 17) / 12; const roughY = .6 + (seed % 13) / 14;
  return <svg viewBox={viewBox} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', ...style}}>
    {rough ? <path d={d} fill="none" stroke={color} strokeWidth={width + 2} opacity={.12} transform={`translate(${roughX} ${roughY})`} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset}/> : null}
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={evolved.strokeDasharray} strokeDashoffset={evolved.strokeDashoffset}/>
    {cursor && p > 0 && p < 1 ? <g transform={`translate(${point.x} ${point.y}) rotate(-25)`}><path d="M -4 -2 L 20 -2 L 26 0 L 20 2 L -4 2 Z" fill={color}/><circle cx={-5} cy={0} r={4} fill={WHITEBOARD.indigo}/></g> : null}
  </svg>;
};

export const IdeaThread: React.FC<{d: string; at?: number; duration?: number; viewBox?: string}> = ({d, at, duration, viewBox}) => <InkPath d={d} at={at} duration={duration} viewBox={viewBox} color={WHITEBOARD.indigo} width={7} cursor/>;

export const SketchArrow: React.FC<{d: string; at?: number; duration?: number; color?: string; viewBox?: string}> = ({d, at = 0, duration = 26, color = WHITEBOARD.ink, viewBox}) => <InkPath d={d} at={at} duration={duration} color={color} width={5} viewBox={viewBox}/>;

export const DrawnUnderline: React.FC<{x: number; y: number; width: number; at?: number; color?: string; canvas?: {w:number; h:number}}> = ({x, y, width, at = 0, color = WHITEBOARD.indigo, canvas = {w:1920,h:1080}}) => <InkPath d={`M ${x} ${y} C ${x+width*.28} ${y+7}, ${x+width*.7} ${y-5}, ${x+width} ${y+2}`} at={at} duration={18} color={color} width={6} viewBox={`0 0 ${canvas.w} ${canvas.h}`}/>;

export const ConceptNode: React.FC<{title: string; detail?: string; x: number; y: number; width?: number; at?: number; accent?: string}> = ({title, detail, x, y, width = 360, at = 0, accent = WHITEBOARD.indigo}) => {
  const frame = useCurrentFrame(); const p = progress(frame, at, 14);
  return <div style={{position: 'absolute', left: x, top: y, width, padding: '25px 28px', border: `2px solid ${accent}`, borderRadius: 18, background: 'rgba(243,246,244,.94)', boxShadow: '0 12px 28px rgba(30,41,38,.08)', opacity: p, transform: `translateY(${(1-p)*16}px)`}}><div style={{fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 650}}>{title}</div>{detail ? <div style={{fontFamily: FONT_BODY, fontSize: 22, lineHeight: 1.35, color: WHITEBOARD.muted, marginTop: 8}}>{detail}</div> : null}</div>;
};

export const ConceptMap: React.FC<{nodes: {title:string; detail?:string; x:number; y:number}[]; links?: {from:number; to:number}[]; at?: number}> = ({nodes, links = [], at = 0}) => <>{links.map((link, i) => {const a=nodes[link.from], b=nodes[link.to]; return <InkPath key={i} d={`M ${a.x+180} ${a.y+55} C ${(a.x+b.x)/2+180} ${a.y+55}, ${(a.x+b.x)/2+180} ${b.y+55}, ${b.x+180} ${b.y+55}`} at={at+i*5} duration={24} color={WHITEBOARD.muted} width={3}/>;})}{nodes.map((node, i) => <ConceptNode key={`${node.title}-${i}`} {...node} at={at+12+i*5}/>)}</>;

export const ThoughtBranch = ConceptMap;

export const QuoteCard: React.FC<{quote: string; attribution: string; at?: number}> = ({quote, attribution, at = 0}) => {
  const frame=useCurrentFrame(); const p=progress(frame,at,18);
  return <div style={{position:'absolute', left:'17%', right:'17%', top:'24%', padding:'58px 70px', borderLeft:`8px solid ${WHITEBOARD.indigo}`, background:'rgba(255,255,255,.66)', opacity:p, transform:`translateY(${(1-p)*18}px)`}}><div style={{fontFamily:FONT_EDITORIAL,fontSize:54,lineHeight:1.28,fontWeight:600}}>“{quote}”</div><div style={{fontFamily:FONT_BODY,fontSize:23,color:WHITEBOARD.muted,marginTop:24}}>— {attribution}</div></div>;
};

export const BeforeAfter: React.FC<{before: string; after: string; revealAt?: number}> = ({before, after, revealAt = 40}) => {const frame=useCurrentFrame(); const p=progress(frame,revealAt,14); const card=(title:string,detail:string,accent:string)=><div style={{padding:'34px 38px',border:`2px solid ${accent}`,borderRadius:18,background:'rgba(255,255,255,.72)',boxShadow:'0 12px 28px rgba(30,41,38,.08)'}}><div style={{fontFamily:FONT_DISPLAY,fontSize:30,fontWeight:700,color:accent}}>{title}</div><div style={{fontFamily:FONT_BODY,fontSize:30,lineHeight:1.38,marginTop:13}}>{detail}</div></div>; return <div style={{position:'absolute',inset:'23% 10%',display:'grid',gridTemplateColumns:'1fr 120px 1fr',alignItems:'center',gap:28}}>{card('BEFORE',before,WHITEBOARD.amber)}<div style={{fontFamily:FONT_DISPLAY,fontSize:64,textAlign:'center',color:WHITEBOARD.indigo}}>→</div><div style={{opacity:p,transform:`translateX(${(1-p)*22}px)`}}>{card('AFTER',after,WHITEBOARD.teal)}</div></div>};

export const CauseEffect: React.FC<{cause: string; effect: string; at?: number}> = ({cause,effect,at=0}) => <><ConceptNode title="CAUSE" detail={cause} x={260} y={380} width={480} at={at}/><ConceptNode title="EFFECT" detail={effect} x={1180} y={380} width={480} at={at+26} accent={WHITEBOARD.teal}/><IdeaThread d="M 740 455 C 870 390, 1050 510, 1180 455" at={at+12} duration={34}/></>;

export const TimelineSketch: React.FC<{items:{label:string;detail?:string}[]; at?:number}> = ({items,at=0}) => <div style={{position:'absolute',left:180,right:180,top:440,display:'flex',justifyContent:'space-between'}}><InkPath d="M 180 540 L 1740 540" at={at} duration={36} color={WHITEBOARD.indigo}/>{items.map((item,i)=><div key={item.label} style={{width:260,textAlign:'center'}}><div style={{width:18,height:18,borderRadius:99,background:WHITEBOARD.indigo,margin:'90px auto 18px'}}/><div style={{fontFamily:FONT_DISPLAY,fontSize:28,fontWeight:600}}>{item.label}</div>{item.detail?<div style={{fontFamily:FONT_BODY,fontSize:20,color:WHITEBOARD.muted,marginTop:7}}>{item.detail}</div>:null}</div>)}</div>;

export const CharacterGlyph: React.FC<{x:number;y:number;size?:number;at?:number;color?:string}> = ({x,y,size=180,at=0,color=WHITEBOARD.ink}) => <div style={{position:'absolute',left:x,top:y,width:size,height:size}}><InkPath d="M 90 34 A 26 26 0 1 1 89.9 34 M 90 86 L 90 140 M 90 104 L 48 124 M 90 104 L 132 124 M 90 140 L 58 176 M 90 140 L 122 176" at={at} duration={34} color={color} width={5} viewBox="0 0 180 190"/></div>;

export const BookCard: React.FC<{title:string;subtitle?:string;author?:string;at?:number;accent?:string}> = ({title,subtitle,author,at=0,accent=WHITEBOARD.indigo}) => {const frame=useCurrentFrame();const p=progress(frame,at,18);return <div style={{position:'absolute',left:'18%',right:'18%',top:'24%',padding:'68px 78px 62px 102px',border:`3px solid ${WHITEBOARD.ink}`,borderLeft:`28px solid ${accent}`,background:'rgba(255,255,255,.72)',boxShadow:'14px 18px 0 rgba(30,41,38,.08)',opacity:p,transform:`translateY(${(1-p)*24}px) rotate(${(1-p)*-1.2}deg)`}}>{author?<div style={{fontFamily:FONT_BODY,fontSize:20,letterSpacing:4,color:WHITEBOARD.muted,marginBottom:18}}>{author.toUpperCase()}</div>:null}<div style={{fontFamily:FONT_DISPLAY,fontSize:72,lineHeight:1.04,fontWeight:700}}>{title}</div>{subtitle?<div style={{fontFamily:FONT_BODY,fontSize:29,lineHeight:1.4,color:WHITEBOARD.muted,marginTop:24}}>{subtitle}</div>:null}</div>};

export const ActionList: React.FC<{items:string[];at?:number;title?:string;format?:'short'|'video'}> = ({items,at=0,title='PUT IT INTO PRACTICE',format='video'}) => {const frame=useCurrentFrame(); return <div style={{position:'absolute',left:format==='short'?'10%':'20%',right:format==='short'?'10%':'20%',top:format==='short'?1060:'18%'}}><div style={{fontFamily:FONT_DISPLAY,fontSize:format==='short'?32:34,fontWeight:700,color:WHITEBOARD.indigo,letterSpacing:3,marginBottom:30}}>{title}</div>{items.map((item,i)=>{const reveal=progress(frame,at+i*10,12);return <div key={item} style={{display:'flex',gap:22,alignItems:'flex-start',fontFamily:FONT_BODY,fontSize:format==='short'?42:34,lineHeight:1.3,marginBottom:format==='short'?32:22,opacity:reveal,transform:`translateX(${(1-reveal)*14}px)`}}><div style={{width:format==='short'?38:34,height:format==='short'?38:34,border:`3px solid ${WHITEBOARD.teal}`,borderRadius:8,flex:'0 0 auto',marginTop:5}}/><div>{item}</div></div>})}</div>};

export const EraseReveal: React.FC<{children:React.ReactNode;at?:number;duration?:number;direction?:'left'|'right'}> = ({children,at=0,duration=20,direction='left'}) => {const frame=useCurrentFrame();const p=progress(frame,at,duration);const clip=direction==='left'?`inset(0 ${100-p*100}% 0 0)`:`inset(0 0 0 ${100-p*100}%)`;return <AbsoluteFill style={{clipPath:clip}}>{children}</AbsoluteFill>};
