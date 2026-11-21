import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const glide = Easing.bezier(.36,.06,.22,1);
const ink = '#304434';
const stages = [
  {number:'01',label:'Absorb water',detail:'Moisture softens the seed coat.',start:.055,end:.32,x:232,y:425,r:310},
  {number:'02',label:'Send out a root',detail:'The first root grows downward.',start:.32,end:.59,x:610,y:474,r:305},
  {number:'03',label:'Reach for light',detail:'The first leaves open above ground.',start:.59,end:.85,x:1012,y:354,r:378},
];

function inkStroke(id:string,d:string,color:string,width:number,progress:number,opacity=1) {
  return <path key={id} d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round"
    strokeLinejoin="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-progress} opacity={opacity}/>;
}

export function WatercolorWash({project}:{project:string}) {
  const {durationInFrames} = useVideoConfig();
  const t = useCurrentFrame()/Math.max(1,durationInFrames-1);
  const ramp = (start:number,end:number) => interpolate(t,[start,end],[0,1],{...clamp,easing:glide});
  const viewX = interpolate(t,[0,.12,.26,.39,.51,.65,.78,.94],[425,425,425,640,640,846,846,640],{...clamp,easing:glide});
  const zoom = interpolate(t,[0,.17,.27,.41,.50,.66,.77,.95],[1.12,1.37,1.37,1.59,1.59,1.39,1.39,1],{...clamp,easing:glide});
  const cameraX = Math.min(1280-640/zoom,Math.max(640/zoom,viewX));
  const roots = ramp(.39,.55);
  const light = ramp(.66,.77);
  const title = 'How a seed grows';
  const final = ramp(.85,.92);
  return <AbsoluteFill style={{backgroundColor:'#f5ecd9'}}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" aria-label={title}>
      <defs>
        <filter id="paper"><feTurbulence type="fractalNoise" baseFrequency=".81" numOctaves="3" seed="19"/></filter>
        <filter id="wash-edge" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="9" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="35" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <radialGradient id="wet"><stop offset=".69" stopColor="white"/><stop offset=".9" stopColor="white" stopOpacity=".8"/><stop offset="1" stopColor="white" stopOpacity="0"/></radialGradient>
        <radialGradient id="water"><stop stopColor="#a6c5cd" stopOpacity=".18"/><stop offset=".78" stopColor="#568c9a" stopOpacity=".58"/><stop offset="1" stopColor="#438292" stopOpacity="0"/></radialGradient>
        <radialGradient id="gold"><stop stopColor="#f4ca64" stopOpacity=".73"/><stop offset="1" stopColor="#d9a548" stopOpacity="0"/></radialGradient>
        <mask id="paint">
          {stages.map(({x,y,r,start,end}) => {
            const p = ramp(start,end-.035);
            return <ellipse key={x} cx={x} cy={y} rx={r*p} ry={r*p} fill="url(#wet)" filter="url(#wash-edge)"/>;
          })}
          <rect width="1280" height="720" fill="white" opacity={ramp(.79,.9)}/>
        </mask>
        {stages.map(({start,number})=><clipPath key={number} id={`write-${number}`}>
          <rect x="142" y="40" width={580*ramp(start+.035,start+.155)} height="89"/>
        </clipPath>)}
      </defs>
      <rect width="1280" height="720" fill="#f8f0df"/>
      <rect width="1280" height="720" filter="url(#paper)" opacity=".095" style={{mixBlendMode:'multiply'}}/>
      <g transform={`translate(640 396) scale(${zoom}) translate(${-cameraX} -396)`}>
        <image href={staticFile(`projects/${project}/seed-study.png`)} width="1280" height="720" mask="url(#paint)"
          preserveAspectRatio="xMidYMid slice" style={{mixBlendMode:'multiply'}}/>
        <g opacity={1-ramp(.28,.36)}>
          {[0,1,2,3].map((i)=>{
            const start=.077+i*.023;
            const fall=ramp(start,start+.102);
            const spread=ramp(start+.10,start+.17);
            return <g key={i} opacity={ramp(start,start+.021)*(1-spread*.92)}>
              <path transform={`translate(${150+i*49+20*fall} ${250+i*5+205*fall}) scale(${1-.52*spread})`}
                fill="url(#water)" d="M0-17Q-16 1-10 9Q0 18 10 9Q16 1 0-17Z"/>
              <ellipse cx={170+i*49} cy={463+i*5} rx={spread*36} ry={spread*12}
                fill="none" stroke="#507c88" strokeWidth="2" opacity={spread*(1-spread)*1.7}/>
            </g>;
          })}
        </g>
        <g opacity={1-ramp(.55,.62)}>
          {inkStroke('root','M610 449Q592 465 596 483T578 518Q563 531 557 557T535 586','#fbedce',5,roots)}
          {inkStroke('fork-1','M580 511Q610 528 614 559','#fbedce',3,ramp(.43,.53))}
          {inkStroke('fork-2','M563 545Q544 546 526 563','#fbedce',3,ramp(.47,.56))}
          {inkStroke('root-note','M647 476q53 12 64 67m-18-14 18 14 6-20','#71553e',3,ramp(.43,.55),.65)}
        </g>
        <g opacity={ramp(.62,.68)*(1-ramp(.82,.89))}>
          <ellipse cx="1108" cy="155" rx="132" ry="106" fill="url(#gold)"/>
          {[0,1,2,3,4].map(i=>inkStroke(`light-${i}`,
            `M${1014+i*39} 147 Q${998+i*35} 178 ${983+i*32} ${201+i*7}`,
            '#b7893f',3.5,light,.7))}
          {inkStroke('leaf','M930 262Q960 243 995 252','#c4af59',3,ramp(.70,.79),.75)}
        </g>
      </g>
      <g fontFamily="Baskerville, Georgia, serif" fill={ink}>
        <text x="62" y="104" fontSize="61" fontWeight="600" opacity={1-ramp(.034,.086)}>{title}</text>
        {stages.map(({number,label,detail,start,end})=>{
          const opacity=ramp(start,start+.044)*(1-ramp(end-.035,end));
          const pen=ramp(start+.035,start+.155);
          return <g key={number} opacity={opacity}>
            <path d="M59 66Q61 42 75 42L113 44Q129 49 127 68L123 112Q113 123 77 120Q57 115 59 66Z"
              fill="#b0b985" opacity=".55"/>
            <text x="93" y="100" textAnchor="middle" fontSize="54" fontWeight="600">{number}</text>
            <text x="149" y="96" fontSize="58" fontWeight="600" clipPath={`url(#write-${number})`}>{label}</text>
            {inkStroke('underline','M149 114Q242 121 361 113Q401 111 450 116','#75894d',4,ramp(start+.108,start+.216),.74)}
            <text x="151" y="155" fontSize="29" opacity={pen}>{detail}</text>
          </g>;
        })}
        <g opacity={final} textAnchor="middle">
          <text x="640" y="96" fontSize="61" fontWeight="600">From seed to seedling</text>
          <path d="M490 115Q652 122 799 113" fill="none" stroke="#768750" strokeWidth="3" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1-final}/>
        </g>
      </g>
    </svg>
  </AbsoluteFill>;
}
