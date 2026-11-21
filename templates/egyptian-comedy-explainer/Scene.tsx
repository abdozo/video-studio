import React from 'react';
import {AbsoluteFill,Easing,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {colors,Icon,Person,Sticker,Text,type IconName} from './Art';

type Figure = 'person'|'woman'|'line'|'check'|'question'|'ticket'|'calendar'|'ray'|IconName;
export type Layer = {
  at:number;x:number;y:number;kind:Figure;
  scale?:number; tilt?:number; label?:string; off?:number; worried?:boolean;
};
type Copy = {at:number;text:string};
export type Scene = {at:number; bg:string; title:Copy[]; layers?:Layer[]; verse?:Copy[]; verseLabel?:string};

const {ink,teal,red,yellow,mint,paper}=colors;
const option = {extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.bezier(.23,.72,.29,1)} as const;
const progress = (t:number,d:number) => interpolate(t,[0,d],[0,1],option);

function Element({layer,time}:{layer:Layer;time:number}) {
  const t=time-layer.at;
  if(t<0) return null;
  const incoming=progress(t,.36);
  const leaving=layer.off===undefined?0:progress(time-layer.off,.28);
  const bounce=Math.sin(incoming*Math.PI)*.11;
  const scale=(layer.scale??1)*(.76+.24*incoming+bounce)*(1-.17*leaving);
  const wiggle=(layer.kind==='person'||layer.kind==='woman')?0:Math.sin(t*4.8)*Math.max(0,1-t*1.25)*3;
  return <g opacity={Math.min(1,incoming*1.6)*(1-leaving)} transform={`translate(${layer.x+31*(1-incoming)-75*leaving} ${layer.y+12*(1-incoming)-26*leaving}) rotate(${(layer.tilt??0)+8*(1-incoming)+wiggle}) scale(${scale})`}>
    {(layer.kind==='person'||layer.kind==='woman')?<Person woman={layer.kind==='woman'} t={t} worried={!!layer.worried}/>:
      layer.kind==='line'?<g stroke={teal} strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M108-4Q65-25-102 4" pathLength="1" strokeDasharray={`${incoming} 1`}/>
        <path d="M-83-12l-20 16 23 14" opacity={progress(t-.21,.15)}/>
      </g>:
      layer.kind==='check'?<g><circle r="34" fill={teal}/><path d="M-15 0l10 11 23-26" stroke={paper} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>:
      layer.kind==='question'?<g><path d="M-107-21q0-38 41-38H68q39 0 39 38v37q0 32-42 32H26L4 70l-9-22h-64q-38 0-38-32Z" fill={yellow} stroke={ink} strokeWidth="4"/><Text size={layer.label?20:52} y={8}>{layer.label??'؟'}</Text></g>:
      layer.kind==='ticket'?<g><rect x="-96" y="-32" width="192" height="63" rx="11" fill={paper} stroke={ink} strokeWidth="3"/><path d="M-66-23v46" stroke={ink} strokeWidth="2" strokeDasharray="3 5"/><Text size={22}>{layer.label}</Text></g>:
      layer.kind==='calendar'?<g><rect x="-87" y="-67" width="174" height="130" rx="15" fill={paper} stroke={ink} strokeWidth="4"/><path d="M-86-31H86M-45-80v29m90-29v29" stroke={red} strokeWidth="8" strokeLinecap="round"/><Text y={18} size={23}>{layer.label}</Text></g>:
      layer.kind==='ray'?<path d="M-16-9l-22-16m36 9V-44m19 33 22-19" stroke={red} strokeWidth="5" fill="none" strokeLinecap="round"/>:
      <Sticker icon={layer.kind} label={layer.label}/>}
  </g>;
}

export const EgyptianComedyExplainer:React.FC<{project:string;scenes:Scene[]}>=({project,scenes})=>{
  const path = (file:string) => staticFile(`projects/${project}/${file}`);
  const frame=useCurrentFrame();
  const {durationInFrames,fps}=useVideoConfig();
  const t=frame/fps;
  const index=scenes.findLastIndex(s=>s.at<=t);
  const scene=scenes[Math.max(index,0)];
  const title=scene.title.findLast(c=>c.at<=t);
  const enter=index<0?0:progress(t-scene.at,.32);
  const next=scenes[index+1];
  const exit=index>=0&&next?progress(t-next.at+.14,.14):0;
  const closing=progress(t-(durationInFrames-20)/fps,19/fps);
  const intro=progress(t,.42);
  const verse=!!scene.verse;

  return <AbsoluteFill dir="rtl" lang="ar" style={{fontFamily:'Lemonada, Damascus, sans-serif',background:'#fbf8ef',color:ink}}>
    <style>{`@font-face{font-family:Lemonada;src:url("${path('Lemonada.ttf')}");font-weight:300 700;font-display:block}@font-face{font-family:Quran;src:url("${path('Naskh.ttf')}");font-display:block}`}</style>
    <AbsoluteFill style={{opacity:intro*(1-closing),backgroundColor:scene.bg,backgroundImage:'radial-gradient(#3c514b24 1.3px, transparent 1.3px)',backgroundSize:'30px 30px'}}/>
    {index>=0&&<AbsoluteFill style={{opacity:(1-exit)*(1-closing)}}>
      {verse?<div style={{position:'absolute',inset:'14% 13%',padding:'2% 5%',background:paper,border:'3px solid #b8b18c',borderRadius:46,textAlign:'right'}}>
        <div style={{color:teal,fontSize:34,fontWeight:700,marginBottom:28}}>{scene.verseLabel}</div>
        {scene.verse?.map((line,i)=>t>=line.at&&<div key={line.at} style={{fontFamily:'Quran, serif',fontSize:i===2?96:87,lineHeight:1.45,color:i===2?teal:ink,opacity:progress(t-line.at,.48)}}>{line.text}</div>)}
      </div>:<>
        <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',inset:0,opacity:enter}}>
          <path d="M53 496Q26 277 97 164t322-83q216 18 262 151t-28 308q-77 98-270 101Q76 640 53 496Z" fill={paper} fillOpacity=".55"/>
          <path d="M94 591q235 36 534-4" stroke={teal} strokeWidth="2" strokeDasharray="5 13" opacity=".28" fill="none"/>
          {scene.layers?.map(l=><Element key={`${l.at}:${l.kind}:${l.x}`} layer={l} time={t}/>)}
        </svg>
        {title&&<div key={title.at} style={{position:'absolute',right:'6.7%',left:'56%',top:'31%',transform:`translateX(${24*(1-progress(t-title.at,.34))}px)`,opacity:progress(t-title.at,.34),textAlign:'right'}}>
          <div style={{fontSize:title.text.length>32?63:title.text.length>22?73:88,lineHeight:1.42,fontWeight:700,whiteSpace:'pre-line'}}>{title.text}</div>
          <div style={{width:195,height:11,marginTop:28,borderRadius:'55% 30% 30% 26%',background:red,transformOrigin:'right',transform:`rotate(-4deg) scaleX(${progress(t-title.at-.09,.48)})`}}/>
        </div>}
      </>}
    </AbsoluteFill>}
  </AbsoluteFill>;
};
