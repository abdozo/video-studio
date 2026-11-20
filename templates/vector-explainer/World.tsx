import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const C = {ink: '#555384', mint: '#71E8BC', green: '#45CDA3', lilac: '#BBB9F4', blue: '#8E99EC', pink: '#F4B1E4', yellow: '#FFE399', skin: '#FFE9D3', hair: '#A17D69'};
const smooth = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const tween = (f:number,a:number,b:number,x=0,y=1,easing=smooth) => interpolate(f,[a,b],[x,y],{easing,extrapolateLeft:'clamp',extrapolateRight:'clamp'});

const Reveal: React.FC<{f:number;at:number;x?:number;y?:number;children:React.ReactNode}> = ({f,at,x=0,y=0,children}) => {
  const p=tween(f,at,at+30,0,1,out);
  return <g transform={`translate(${x} ${y+(1-p)*95})`} opacity={p}>{children}</g>;
};

const Tree: React.FC<{f:number;x:number;y:number;size:number;at:number}> = ({f,x,y,size,at}) => <Reveal f={f} at={at} x={x} y={y}><g transform={`scale(${size})`}><g transform={`rotate(${Math.sin(f/44+x)*1.1} 0 0)`}>
  <path d="M0 -72 C-150 -52 -181 -147 -145 -223 C-210 -314 -131 -429 -50 -417 C-14 -503 116 -468 123 -387 C221 -357 201 -235 143 -214 C165 -116 85 -56 0 -72Z" fill={C.mint}/>
  <path d="M0 0 V-422 M0 -189 L-72 -264 M0 -277 L66 -343" fill="none"/>
  {[-1,0,1].map(v=><path key={v} d={`M${v*36+36} ${-340+Math.abs(v)*43} q18 34 36 0Z`} fill={C.green} opacity=".4" stroke="none"/>)}
</g></g></Reveal>;

const Bush: React.FC<{x:number;y:number;s?:number}> = ({x,y,s=1}) => <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-115 0 Q-148 -58 -95 -65 Q-81 -127 -32 -91 Q4 -145 44 -92 Q102 -110 109 -62 Q164 -39 125 0Z" fill={C.mint}/><path d="M-70 -39 q10 18 20 0Z M-45 -57 q10 18 20 0Z M76 -32 q10 18 20 0Z" fill="#ABF8D9" stroke="none"/></g>;

const Window: React.FC<{x:number;y:number}> = ({x,y}) => <g transform={`translate(${x} ${y})`}><path d="M0 110 V40 A36 36 0 0 1 72 40 V110Z" fill="#F7F6FF"/><path d="M6 107 L67 43 V70 L30 108Z" fill="#E3E2FC" stroke="none"/><path d="M36 5 V110 M0 43 H72 M0 76 H72" fill="none"/><rect x="-8" y="110" width="88" height="8" fill="#EEEFFF"/></g>;

const Cafe: React.FC<{f:number}> = ({f}) => <Reveal f={f} at={27} x={710} y={230}>
  <rect width="550" height="465" rx="3" fill={C.lilac}/><path d="M0 465 V0 H550Z" fill={C.blue} opacity=".2" stroke="none"/>
  <rect x="-17" y="-17" width="584" height="18" fill="#F5F2FF"/><rect x="45" y="-45" width="42" height="28" fill={C.pink}/><rect x="38" y="-55" width="56" height="12" fill="#FBD9F2"/>
  {[55,235,415].map(x=><Window key={x} x={x} y={34}/>)}
  <path d="M-20 256 L20 193 H530 L570 256Z" fill={C.pink}/>
  {[0,1,2,3,4,5].map(i=><path key={i} d={`M${20+i*85} 193 L${-20+i*98} 256 H${78+i*98} L${105+i*85} 193Z`} fill={i%2?'#F9D9F2':C.pink}/>)}
  <path d="M-20 256 V271 H570 V256" fill="#E9A0DF"/><rect x="159" y="212" width="233" height="44" rx="3" fill="white"/>
  <Window x={52} y={295}/><Window x={426} y={295}/><rect x="187" y="289" width="177" height="176" fill={C.pink}/>
  {[200,286].map(x=><g key={x}><rect x={x} y="303" width="65" height="110" fill="#FAFAFF"/><path d={`M${x+3} 410 L${x+61} 307 V331 L${x+3} 389Z`} fill="#E5E4FA" stroke="none"/><rect x={x+19} y="431" width="29" height="5" fill="white"/></g>)}
  <rect x="167" y="466" width="217" height="12" fill="#DFDDF6"/><rect x="150" y="478" width="251" height="12" fill="#F3F1FF"/>
</Reveal>;

const Face: React.FC<{f:number;girl?:boolean}> = ({f,girl=false}) => <g>
  <rect x="-10" y="-42" width="20" height="45" rx="8" fill={C.skin}/>
  {girl&&<path d="M-39 -65 Q-51 -127 0 -128 Q53 -126 42 -60 L43 -10 Q12 2 -39 -10Z" fill={C.hair}/>}
  <path d="M-32 -87 Q-32 -119 1 -118 Q37 -117 34 -85 L31 -52 Q19 -25 -5 -34 Q-33 -41 -32 -87Z" fill={C.skin}/>
  {girl?<path d="M-35 -73 Q-5 -77 8 -107 Q20 -81 38 -78 L35 -108 Q18 -137 -18 -116 Q-41 -102 -35 -73Z" fill={C.hair}/>:<path d="M-33 -83 L-40 -108 Q-46 -133 -20 -128 L18 -124 Q47 -129 40 -99 L34 -81 L22 -85 L21 -105 L-20 -102 L-22 -83Z" fill={C.hair}/>}
  <path d="M-21 -81 h8 M10 -81 h8" strokeWidth="3"/>
  {[-16,15].map(x=>f%104>98?<path key={x} d={`M${x-3} -69 h6`}/>:<ellipse key={x} cx={x} cy="-69" rx="2.8" ry="4.2" fill={C.ink} stroke="none"/>)}
  <path d="M-2 -64 q-4 7 3 7 M-8 -48 q10 9 19 -3" fill="none" strokeWidth="2"/>
  {girl&&<g fill={C.pink} stroke="none"><ellipse cx="-24" cy="-58" rx="5" ry="3"/><ellipse cx="24" cy="-58" rx="5" ry="3"/><circle cx="-31" cy="-87" r="6" fill="white"/></g>}
</g>;

const LaptopGirl: React.FC<{f:number}> = ({f}) => <Reveal f={f} at={46} x={433} y={612}>
  <ellipse cx="4" cy="128" rx="108" ry="11" fill="#7FAF9F" opacity=".14" stroke="none"/>
  <path d="M-42 69 Q-65 114 -29 117 H74 Q95 111 75 92 L5 74" fill={C.blue} strokeWidth="3"/><path d="M-35 111 l-18 17 q-13 7 -20 -3 l15 -25Z" fill={C.pink}/>
  <path d="M-26 0 Q-48 7 -45 49 L-37 78 Q-5 94 38 74 L31 22 Q25 -1 10 -1" fill={C.pink}/><Face f={f} girl/>
  <path d={`M-32 22 Q-49 67 4 69 L${39+Math.sin(f*.7)*2} ${56+Math.sin(f*.7)*2}`} stroke={C.ink} strokeWidth="15" fill="none"/>
  <path d={`M-32 22 Q-49 67 4 69 L${39+Math.sin(f*.7)*2} ${56+Math.sin(f*.7)*2}`} stroke={C.skin} strokeWidth="10" fill="none"/>
  <path d={`M24 17 Q33 34 44 ${52+Math.sin(f*.8)*2}`} fill="none" stroke={C.skin} strokeWidth="11"/>
  <path d="M22 82 L40 22 H131 L115 82Z" fill="#E8E8FA"/><path d="M22 82 H115 L112 88 H8 L5 82Z" fill="#D0CFF1"/><circle cx="81" cy="52" r="7" fill="white"/>
</Reveal>;

const Walker: React.FC<{f:number}> = ({f}) => {
  const x=interpolate(f,[45,240],[655,1850],{extrapolateLeft:'clamp',extrapolateRight:'clamp'}), phase=(f-45)/6;
  return <Reveal f={f} at={50} x={x} y={565}><g transform={`translate(0 ${Math.sin(phase*2)*2})`}>
    {[0,Math.PI].map((p,i)=><g key={i} transform={`rotate(${Math.sin(phase+p)*21} 0 70)`}><path d="M-13 66 L-16 135 L-12 197 L7 197 L12 131 L14 66Z" fill={i?C.blue:'#727FCB'}/><path d="M-14 193 L8 193 L17 206 H-24Z" fill={C.ink}/></g>)}
    <path d="M-30 0 Q0 -10 29 6 L37 77 Q0 87 -34 76Z" fill="#7372A5"/><Face f={f}/>
    <path d="M-23 15 Q-6 57 36 40 L52 24" stroke={C.ink} strokeWidth="15" fill="none"/><path d="M-23 15 Q-6 57 36 40 L52 24" stroke={C.skin} strokeWidth="10" fill="none"/>
    <rect x="43" y="-2" width="18" height="32" rx="3" transform="rotate(18 43 0)" fill="#DEDDF6"/>
    <path d="M26 18 Q39 65 61 85" stroke={C.ink} strokeWidth="14" fill="none"/><path d="M26 18 Q39 65 61 85" stroke={C.skin} strokeWidth="9" fill="none"/>
    <path d="M61 83 Q107 168 154 182" fill="none" strokeWidth="1.6"/>
  </g><g transform={`translate(166 ${186+Math.sin(phase*2)*2})`}>
    <path d={`M-31 -1 l-11 ${17+Math.sin(phase)*7} M-8 0 l6 ${18-Math.sin(phase)*7} M13 -3 l5 ${17+Math.sin(phase)*7}`} strokeWidth="8"/>
    <path d="M-36 -9 Q-52 -14 -51 -32 Q-37 -26 -32 -22 Q-7 -37 16 -20 L27 -37 L43 -33 L49 -17 L35 -10 L21 -1 Q-2 13 -33 2Z" fill="#B4B4C4"/>
    <path d="M27 -34 L22 -48 L36 -40 M-5 -22 Q-15 -6 -25 -15" fill="#9697B0"/><circle cx="38" cy="-27" r="2" fill={C.ink}/><path d="M16 -23 L26 -12" stroke={C.mint} strokeWidth="5"/>
  </g></Reveal>;
};

const Cup: React.FC<{x:number;f:number}> = ({x,f}) => <g transform={`translate(${x} 0)`}><path d="M-13 -28 H13 L10 0 H-9Z" fill="white"/><path d="M-12 -22 H12 L11 -8 H-10Z" fill={C.mint}/><rect x="-15" y="-33" width="30" height="6" rx="2" fill="#D8D7F0"/><circle cy="-15" r="4" fill="white" strokeWidth="1"/><path d={`M0 -43 Q${7+Math.sin(f/10)*4} -52 0 -60`} opacity={.25+Math.sin(f/15)*.1} fill="none" strokeWidth="2"/></g>;

const Couple: React.FC<{f:number}> = ({f}) => <Reveal f={f} at={61} x={1112} y={638}>
  <ellipse cy="130" rx="185" ry="12" fill="#507E74" opacity=".12" stroke="none"/>
  <g transform="translate(-97 -7)">
    <path d="M-34 68 V134 M27 68 V134 M-40 58 H35 V69 H-40Z" fill="#DAD7F2"/>
    <path d="M-23 28 Q-25 56 25 52 L42 63 L38 117 L18 117 L18 73 L-20 74 Q-49 68 -38 26" fill={C.yellow}/><path d="M18 115 L38 115 L51 129 H15Z" fill={C.hair}/>
    <path d="M-25 -41 Q-41 -33 -36 22 L-23 37 H18 L25 -18 Q25 -40 10 -42Z" fill={C.yellow}/><g transform="translate(0 -40)"><Face f={f} girl/></g>
    <g transform={`rotate(${Math.sin(f/14)*3} -22 -24)`}><path d="M-28 -23 Q-27 14 -9 8 L5 -33" fill="none" stroke={C.ink} strokeWidth="12"/><path d="M-28 -23 Q-27 14 -9 8 L5 -33" fill="none" stroke={C.skin} strokeWidth="8"/></g>
    <path d="M21 -24 L35 10 L47 -11" fill="none" stroke={C.skin} strokeWidth="9"/>
  </g>
  <g transform="translate(121 -11)">
    <path d="M-30 70 V138 M35 70 V138 M-36 60 H42 V71 H-36Z" fill="#DAD7F2"/><path d="M25 25 L29 61 L-29 65 L-46 122 H-66 L-55 51 Q-53 37 -33 36 L-15 31" fill={C.blue}/><path d="M-67 119 H-46 L-39 133 H-83 Q-89 128 -67 119Z" fill={C.ink}/>
    <path d="M-20 -40 Q-5 -50 20 -38 L31 37 H-25Z" fill="#FFFDF8"/><g transform="translate(0 -42)"><Face f={f}/></g>
    <g transform={`rotate(${Math.sin(f/24)*1.8} 13 -24)`}><path d="M13 -25 Q-22 -17 -70 -42 L-83 -56" stroke={C.ink} strokeWidth="13" fill="none"/><path d="M13 -25 Q-22 -17 -70 -42 L-83 -56" stroke={C.skin} strokeWidth="9" fill="none"/><rect x="-96" y="-87" width="17" height="32" rx="3" transform="rotate(-14 -96 -87)" fill="#DDDDF2"/><circle cx="-89" cy="-80" r="2" strokeWidth="1"/></g>
  </g>
  <path d="M-5 0 V129 M-50 129 H45" strokeWidth="9"/><path d="M-5 0 V129 M-50 129 H45" stroke="#E6E3F7" strokeWidth="5"/><rect x="-143" y="-5" width="288" height="10" rx="5" fill="#FDFBFF"/><Cup x={-65} f={f}/><Cup x={86} f={f}/>
</Reveal>;

const Umbrella: React.FC<{f:number}> = ({f}) => <Reveal f={f} at={53} x={1112} y={363}>
  <path d="M0 -4 V277" strokeWidth="7"/><path d="M0 -4 V277" stroke="#E4E0F4" strokeWidth="3"/><circle cy="-5" r="7" fill="white"/>
  {[-2,-1,0,1].map(i=><path key={i} d={`M0 0 L${i*82} 100 Q${i*82+41} 137 ${i*82+82} 100Z`} fill={i%2?C.pink:'white'}/>)}
</Reveal>;

const Icon: React.FC<{kind:number}> = ({kind}) => <g fill="none" strokeWidth="2.4">
  {kind===0&&<path d="M0 14 C-37 -8 -15 -31 0 -14 C16 -32 37 -7 0 14Z" fill={C.pink}/>}
  {kind===1&&<g><rect x="-18" y="-17" width="36" height="34" rx="9"/><circle r="9"/><circle cx="11" cy="-10" r="2" fill={C.ink} stroke="none"/></g>}
  {kind===2&&<g><path d="M-19 -15 H19 V10 H2 L-11 21 V10 H-19Z" fill="white"/><path d="M-10 -5 H10 M-10 2 H4"/></g>}
  {kind===3&&<g><path d="M-13 0 L-4 -3 L1 -20 Q10 -25 9 -12 L7 -4 H20 L15 17 H-5 L-13 12Z" fill="white"/><rect x="-22" y="-2" width="8" height="21" rx="2" fill={C.lilac}/></g>}
  {kind===4&&<g><path d="M0 21 Q-26 -5 -15 -18 Q0 -31 15 -18 Q26 -5 0 21Z" fill={C.mint}/><circle cy="-8" r="6" fill="white"/></g>}
</g>;

const FloatingIcons: React.FC<{f:number}> = ({f}) => <g>{[0,1,2,3,4].map(i=>{
  const p=tween(f,131+i*7,151+i*7,0,1,out), travel=tween(f,181+i*3,237+i*3);
  const starts=[[356,441],[552,455],[639,540],[594,355],[364,546]], ends=[[1008,404],[1242,392],[1286,529],[1130,466],[945,548]];
  const x=starts[i][0]+(ends[i][0]-starts[i][0])*travel, y=starts[i][1]+(ends[i][1]-starts[i][1])*travel-110*Math.sin(travel*Math.PI)+Math.sin(f/19+i)*5;
  return <g key={i} transform={`translate(${x} ${y+(1-p)*30}) scale(${p})`} opacity={p}><circle cy="4" r="31" fill={C.ink} stroke="none" opacity=".07"/><circle r="31" fill={['#FFE1F1','#FFF0B9','#F1EEFF','#E5E6FF','#D4F9E8'][i]}/><Icon kind={i}/></g>;
})}</g>;

export const VectorExplainerWorld: React.FC = () => {
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  // All authored cues use a 300-frame timeline, scaled to this composition.
  const f=frame*300/durationInFrames, zoom=tween(f,88,137,1,1.72)-tween(f,181,239,0,.12), cx=tween(f,88,137,800,490)+tween(f,181,239,0,610), cy=tween(f,0,78,-510,450)+tween(f,88,137,0,80)-tween(f,181,239,0,12);
  return <AbsoluteFill style={{backgroundColor:'white'}}><svg width="100%" height="100%" viewBox="0 0 1600 900">
    <g transform={`translate(800 450) scale(${zoom}) translate(${-cx} ${-cy})`} stroke={C.ink} strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
      <g opacity={tween(f,9,55)} transform={`translate(${(800-cx)*.08} ${(450-cy)*.05})`} stroke="none" fill="#F0EFFC"><rect x="200" y="260" width="180" height="450"/><rect x="397" y="179" width="135" height="530"/><rect x="568" y="325" width="172" height="390"/><rect x="1252" y="274" width="165" height="440"/></g>
      <g opacity={tween(f,7,42)} fill="white"><path d="M360 203 Q366 178 389 187 Q415 155 436 188 Q460 184 467 203Z"/><path d="M1110 146 Q1115 118 1140 125 Q1160 91 1182 127 Q1207 120 1214 146Z"/></g>
      <Reveal f={f} at={15}><path d="M-600 715 Q800 684 2200 715 V1500 H-600Z" fill="#E1FAEE" stroke="none"/><path d="M-600 715 H2200" stroke="#A7DCC7"/><path d="M-500 821 Q700 783 2200 828" stroke="#C3EBDD" fill="none" strokeWidth="21"/></Reveal>
      <Tree f={f} x={260} y={713} size={.96} at={12}/><Tree f={f} x={588} y={710} size={.66} at={21}/><Cafe f={f}/><Tree f={f} x={1445} y={719} size={1.14} at={29}/>
      <Reveal f={f} at={38}><Bush x={260} y={713} s={.65}/><Bush x={672} y={713} s={.85}/><Bush x={1363} y={718} s={.73}/></Reveal>
      <Reveal f={f} at={38} x={639} y={710}><path d="M0 0 V-301" strokeWidth="7"/><path d="M0 0 V-301" stroke="#B4B0E8" strokeWidth="3"/><path d="M-13 -301 L-26 -326 H26 L13 -301Z" fill={C.lilac}/><circle cy="-347" r="29" fill="white"/><path d="M-23 -334 H23" stroke="#D9D6F2"/></Reveal>
      <Reveal f={f} at={42} x={779} y={733}><path d="M-94 -8 V-103 M88 -8 V-103" strokeWidth="9"/><path d="M-111 -102 H106 M-111 -81 H106 M-111 -59 H106 M-111 -33 H106" stroke="#DFDAEB" strokeWidth="14"/><path d="M-111 -111 H106 M-111 -50 H106 M-111 -24 H106" strokeWidth="2"/></Reveal>
      <LaptopGirl f={f}/><Umbrella f={f}/><Couple f={f}/><Walker f={f}/>
      <Reveal f={f} at={44}><Bush x={60} y={840} s={1.18}/><Bush x={1510} y={840} s={1.14}/></Reveal><FloatingIcons f={f}/>
      <g stroke="#72B899" strokeWidth="2" opacity={tween(f,30,60)}>{[180,340,625,905,1380].map(x=><path key={x} d={`M${x} 766 l-5 -8 m8 8 l5 -10`}/>)}</g>
    </g>
  </svg></AbsoluteFill>;
};
export default VectorExplainerWorld;
