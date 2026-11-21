import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft:'clamp',extrapolateRight:'clamp'} as const;
const ease = Easing.bezier(.35,0,.2,1);
const tau = Math.PI * 2;
const stars = Array.from({length:180}, (_, i) => ({
  x: ((i * 647 + 83) % 1297) - 8,
  y: ((i * 389 + 117) % 733) - 6,
  size: i % 11 === 0 ? 2.8 : .65 + i % 4 * .29,
  color: ['#9cd8ff','#d7beff','#fff2b9'][i % 3],
}));

function Spark({x,y,size,opacity=1}:{x:number;y:number;size:number;opacity?:number}) {
  return <path d="M0-10Q1-2 8 0Q1 2 0 10Q-1 2-8 0Q-1-2 0-10Z"
    transform={`translate(${x} ${y}) scale(${size})`} fill="#e0edff" opacity={opacity}/>;
}

export function FlatVectorScience() {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = frame / Math.max(1, durationInFrames - 1);
  const ramp = (a:number,b:number) => interpolate(t,[a,b],[0,1],{...clamp,easing:ease});
  const launch = ramp(.14,.38);
  const gravity = ramp(.33,.49);
  const orbit = ramp(.46,.86);
  const zoom = 1.03 + .15*ramp(0,.14) - .18*ramp(.40,.72);
  const angle = -2.21 + .10*launch + tau*orbit;
  const sx = 857 + Math.cos(angle)*315;
  const sy = 356 + Math.sin(angle)*208;
  const reveal = ramp(0,.11);
  const copy = t<.27?['Why do satellites','stay in orbit?','']:
    t<.48?['Forward motion','keeps it moving.','']:
    t<.75?['Gravity bends','its path inward.','']:
    ['An orbit is','a continuous fall.','The satellite keeps missing the planet.'];
  const op = t<.27?reveal:t<.48?ramp(.27,.32):t<.75?ramp(.48,.53):ramp(.75,.81);
  const rotation = Math.atan2(Math.cos(angle)*208,-Math.sin(angle)*315)*180/Math.PI;
  const gravityEndX = sx + (857-sx)*.46;
  const gravityEndY = sy + (356-sy)*.46;
  return <AbsoluteFill>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" aria-label="Why satellites stay in orbit">
      <defs>
        <linearGradient id="space" x2="1" y2="1"><stop stopColor="#080d31"/><stop offset=".57" stopColor="#191349"/><stop offset="1" stopColor="#382066"/></linearGradient>
        <radialGradient id="nebula"><stop stopColor="#733aea" stopOpacity=".58"/><stop offset="1" stopColor="#3b28ad" stopOpacity="0"/></radialGradient>
        <radialGradient id="aura"><stop stopColor="#77beff" stopOpacity=".42"/><stop offset="1" stopColor="#6f72fc" stopOpacity="0"/></radialGradient>
        <linearGradient id="planet" x1=".17" y1=".05" x2=".75" y2=".95"><stop stopColor="#a3fcf2"/><stop offset=".3" stopColor="#4adacc"/><stop offset=".7" stopColor="#268cc4"/><stop offset="1" stopColor="#4a3d9e"/></linearGradient>
        <linearGradient id="ring"><stop stopColor="#bc75fd"/><stop offset=".56" stopColor="#8edbfd"/><stop offset="1" stopColor="#f7a6fd"/></linearGradient>
        <linearGradient id="helmet" x2=".3" y2="1"><stop stopColor="#fff6df"/><stop offset=".55" stopColor="#c4deff"/><stop offset="1" stopColor="#787fec"/></linearGradient>
        <linearGradient id="visor" x2="0" y2="1"><stop stopColor="#263269"/><stop offset="1" stopColor="#11173f"/></linearGradient>
        <radialGradient id="peach" cx=".34" cy=".29"><stop stopColor="#ffd493"/><stop offset=".58" stopColor="#d77ad3"/><stop offset="1" stopColor="#693fb0"/></radialGradient>
        <clipPath id="globe"><circle cx="857" cy="356" r="130"/></clipPath>
        <clipPath id="upperRing"><rect x="-300" y="-95" width="600" height="95"/></clipPath>
        <clipPath id="lowerRing"><rect x="-300" y="0" width="600" height="95"/></clipPath>
        <marker id="tip" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="2.8" markerHeight="2.8" orient="auto-start-reverse"><path d="M0 0 9 5 0 10 2 5Z" fill="#ffcf68"/></marker>
      </defs>
      <rect width="1280" height="720" fill="url(#space)"/>
      <ellipse cx="864" cy="352" rx="580" ry="390" fill="url(#nebula)"/>
      <g transform={`translate(${t*28} ${-t*12})`}>
        {stars.map(({x,y,size,color},i)=><circle key={i} cx={x} cy={y} r={size} fill={color}
          opacity={.2 + .31*(.5+.5*Math.sin(t*8+i*2.1))}/>)}
      </g>
      <g transform={`translate(857 356) scale(${zoom}) translate(-857 -356)`}>
        <circle cx="1148" cy="111" r="36" fill="url(#peach)"/>
        <path d="M1122 91Q1146 107 1178 108M1115 105Q1146 124 1182 122" fill="none" stroke="#ffe1b2" strokeWidth="4" opacity=".31"/>
        <ellipse cx="857" cy="356" rx="244" ry="213" fill="url(#aura)"/>
        <ellipse cx="857" cy="356" rx="315" ry="208" fill="none" stroke="#9ee9ff" strokeWidth="3"
          strokeDasharray="2 12" strokeLinecap="round" opacity={.12+.68*orbit}/>
        {(['upperRing','lowerRing'] as const).map(half => half==='upperRing'&&
          <g key={half} transform="translate(857 356) rotate(-19)" clipPath="url(#upperRing)">
            <ellipse rx="225" ry="58" stroke="url(#ring)" strokeWidth="19" fill="none" opacity=".68"/>
            <ellipse rx="244" ry="67" stroke="#cfa2ff" strokeWidth="3" fill="none" opacity=".55"/>
          </g>)}
        <circle cx="857" cy="356" r="130" fill="url(#planet)"/>
        <g clipPath="url(#globe)">
          <path d="M691 300Q802 313 979 245L1007 276Q848 353 697 332Z" fill="#c1fff0" opacity=".34"/>
          <path d="M701 385Q866 388 1000 303L1004 337Q867 419 710 412Z" fill="#a3ffee" opacity=".2"/>
          <path d="M722 416Q871 430 999 325Q975 524 817 505Q745 486 722 416Z" fill="#211e73" opacity=".36"/>
          <path d="M727 338Q751 268 813 246" fill="none" stroke="#d0fff5" strokeWidth="4" opacity=".67" strokeLinecap="round"/>
        </g>
        <g transform="translate(857 356) rotate(-19)" clipPath="url(#lowerRing)">
          <ellipse rx="225" ry="58" stroke="url(#ring)" strokeWidth="19" fill="none"/>
          <ellipse rx="244" ry="67" stroke="#cfa2ff" strokeWidth="3" fill="none" opacity=".76"/>
        </g>
        <Spark x={697} y={267} size={1.25} opacity={.7}/>
        <Spark x={1040} y={478} size={1.8} opacity={.65+.35*Math.sin(t*10)}/>
        <Spark x={911} y={138} size={1.1}/>
        {t>=.14&&t<.51&&<path d={`M${sx+27} ${sy-13}q${50*launch} ${-31*launch} ${115*launch} ${-23*launch}`}
          fill="none" stroke="#7ef8ee" strokeWidth="7" strokeDasharray="1 15" strokeLinecap="round" opacity={1-ramp(.43,.51)}/>}
        {t>=.33&&t<.73&&<path d={`M${sx+(857-sx)*.20} ${sy+(356-sy)*.20} L${gravityEndX} ${gravityEndY}`}
          stroke="#ffcf68" strokeWidth="6" strokeLinecap="round" markerEnd="url(#tip)" opacity={gravity*(1-ramp(.68,.73))}/>}
        <g transform={`translate(${sx} ${sy}) rotate(${rotation*.15}) scale(${.55+.45*reveal})`}>
          <ellipse rx="84" ry="71" fill="url(#aura)"/>
          <rect x="-65" y="-11" width="29" height="22" rx="7" fill="#a99df7"/>
          <rect x="36" y="-11" width="29" height="22" rx="7" fill="#a99df7"/>
          <path d="M-67-7h18m-18 7h18m-18 7h18m98-14h18m-18 7h18m-18 7h18" stroke="#f4bdff" strokeWidth="2"/>
          <rect x="-43" y="-36" width="86" height="72" rx="34" fill="url(#helmet)"/>
          <rect x="-32" y="-25" width="64" height="47" rx="21" fill="url(#visor)"/>
          <path d="M-25-14Q-9-25 17-19" stroke="#7faedf" strokeWidth="2" opacity=".7" fill="none"/>
          <ellipse cx="-12" cy="-1" rx="6" ry="9" fill="#9bfff3"/>
          <ellipse cx="12" cy="-1" rx="6" ry="9" fill="#9bfff3"/>
          <path d="M-5 10Q0 15 5 10" stroke="#9bfff3" strokeWidth="2.3" fill="none" strokeLinecap="round"/>
          <path d="M0-37V-48" stroke="#c9dfff" strokeWidth="3"/>
          <circle cy="-51" r="5" fill="#ffe17d"/>
        </g>
      </g>
      <g transform={`translate(78 ${296+22*(1-op)})`} opacity={op}
        fontFamily="Nunito, 'Arial Rounded MT Bold', system-ui, sans-serif" fontWeight="900">
        <text fill="#f2f4ff" fontSize="57" letterSpacing="-1.6">{copy[0]}</text>
        <text y="68" fill="#ffdb7b" fontSize="57" letterSpacing="-1.6">{copy[1]}</text>
        {copy[2]&&<text y="127" fill="#cbdcf9" fontSize="26" fontWeight="700">{copy[2]}</text>}
      </g>
    </svg>
  </AbsoluteFill>;
}
