import {AtlasFrame, DrawLine, useAtlasTimeline} from '../../../remotion/src/lib/atlas-motion';

const colors=['#311757','#f14b68','#f8bd51','#d1da77','#4f9c9b'];
const rays=Array.from({length:26},(_,i)=>i);
const petals=Array.from({length:12},(_,i)=>i);

export function AtlasScene() {
  const {t,move}=useAtlasTimeline();
  const wave=move(.21,.7);
  const pulse=move(.54,.84);
  const title=move(.01,.17);
  const radius=tauRadius(t);
  return <AtlasFrame label="See sound move">
    <defs>
      <filter id="stock"><feTurbulence baseFrequency=".52" numOctaves="3" seed="47"/></filter>
      <clipPath id="print"><rect x="25" y="25" width="1230" height="670" rx="9"/></clipPath>
      <clipPath id="letters"><rect x="43" y="63" width={1196*title} height="145"/></clipPath>
    </defs>
    <rect width="1280" height="720" fill="#eed4a0"/>
    <g clipPath="url(#print)">
      <rect x="25" y="25" width="1230" height="670" fill={colors[0]}/>
      <g transform={`translate(640 420) rotate(${t*23})`}>
        {rays.map(i=><path key={i} transform={`rotate(${i*360/rays.length})`}
          d="M-12 0Q91-139 512-166L875-121Q631 56 200 56Z" fill={colors[1+i%4]} opacity=".85"/>)}
      </g>
      <ellipse cx="640" cy="404" rx="544" ry="208" fill="#331651"/>
      {[0,1,2].map(i=><ellipse key={i} cx="640" cy="404" rx={290+i*69+radius} ry={132+i*28+radius*.48}
        fill="none" stroke={colors[2+i%3]} strokeWidth="8" opacity={wave*(.8-i*.18)}/>)}
      <g transform={`translate(640 397) rotate(${12*Math.sin(t*5)}) scale(${.69+.31*title+.12*pulse})`}>
        {petals.map(i=><path key={i} transform={`rotate(${i*30})`}
          d="M0 11Q-78-16-62-84Q-53-136 0-174Q52-138 63-85Q76-16 0 11Z"
          fill={colors[1+i%4]} stroke={colors[0]} strokeWidth="4"/>)}
        <path d="M-147 0Q0-130 147 0Q0 133-147 0Z" fill="#f7d877" stroke="#2b154a" strokeWidth="11"/>
        <circle r={51+11*pulse} fill="#ef5271"/><circle r={28+12*pulse} fill="#311757"/>
        <circle cx="-11" cy="-12" r="8" fill="#ffed9d"/>
      </g>
      <DrawLine d="M105 401q25-29 53 0t55 0t55 0t55 0M957 401q29-29 55 0t55 0t55 0t55 0" amount={wave} color="#ffcf64" width={8}/>
      <text x="640" y="170" textAnchor="middle" fill="#ffe27f" stroke="#3b1a60" strokeWidth="12" paintOrder="stroke"
        fontFamily="Cooper Black, Georgia, serif" fontStyle="italic" fontSize="113" fontWeight="900"
        letterSpacing="-6" textLength="874" lengthAdjust="spacingAndGlyphs" clipPath="url(#letters)">SEE SOUND MOVE</text>
      <path d="M198 570Q642 596 1082 570L1058 655Q640 674 222 655Z" fill="#351951" stroke="#f7bb67" strokeWidth="4"/>
      <text x="640" y="632" textAnchor="middle" fill="#ffe9a4" fontFamily="Cooper Black, Georgia, serif" fontWeight="900" fontSize="44">
        {t<.42?'01 · A vibration starts':t<.74?'02 · It sends out a wave':'03 · The wave carries energy'}
      </text>
      <rect width="1280" height="720" filter="url(#stock)" opacity=".21" style={{mixBlendMode:'multiply'}}/>
    </g>
  </AtlasFrame>;
}

function tauRadius(t:number) {
  return 20*Math.sin(t*Math.PI*6);
}
