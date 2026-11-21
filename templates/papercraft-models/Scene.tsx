import {AtlasFrame, DrawLine, useAtlasTimeline} from '../../../remotion/src/lib/atlas-motion';

function Block({x,y,w,h,d,color,side,top}:{x:number;y:number;w:number;h:number;d:number;color:string;side:string;top:string}) {
  return <g transform={`translate(${x} ${y})`} stroke="#4d3029" strokeWidth="2" strokeLinejoin="round">
    <path d={`M0 0L${d} ${-d*.56}H${w+d}L${w} 0Z`} fill={top}/>
    <path d={`M${w} 0L${w+d} ${-d*.56}V${h-d*.56}L${w} ${h}Z`} fill={side}/>
    <rect width={w} height={h} fill={color}/>
    <path d={`M5 6H${w-6}V${h-6}H5Z`} stroke="#623529" strokeOpacity=".42" fill="none" strokeDasharray="2 5"/>
  </g>;
}

export function AtlasScene() {
  const {t,move}=useAtlasTimeline();
  const fold=move(.19,.46);
  const build=move(.48,.79);
  const label=move(0,.15);
  const headX=890-63*build;
  const headY=225+32*build;
  const armX=982-195*build;
  const bodyX=809+18*build;
  return <AtlasFrame label="From flat paper to a robot">
    <defs>
      <pattern id="mat" width="34" height="34" patternUnits="userSpaceOnUse"><path d="M34 0H0V34" fill="none" stroke="#b5c4a4" strokeWidth="1" opacity=".45"/></pattern>
      <pattern id="mat-heavy" width="170" height="170" patternUnits="userSpaceOnUse"><path d="M170 0H0V170" fill="none" stroke="#c7d2ae" strokeWidth="2" opacity=".40"/></pattern>
      <filter id="paper-noise"><feTurbulence type="fractalNoise" baseFrequency=".47" numOctaves="2" seed="11"/></filter>
      <radialGradient id="lamp"><stop stopColor="#b7bb78" stopOpacity=".37"/><stop offset="1" stopColor="#344c3c" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="#345849"/>
    <rect x="22" y="24" width="1236" height="672" rx="15" fill="url(#mat)" stroke="#a6bc9e" strokeWidth="3"/>
    <rect x="22" y="24" width="1236" height="672" rx="15" fill="url(#mat-heavy)"/>
    <ellipse cx="706" cy="270" rx="580" ry="375" fill="url(#lamp)"/>
    <rect width="1280" height="720" filter="url(#paper-noise)" opacity=".12" style={{mixBlendMode:'multiply'}}/>
    <g transform="rotate(-13 73 490)" opacity=".85">
      <path d="M13 445H100L110 460L100 654H8Z" fill="#bc8f52" stroke="#54432e" strokeWidth="3"/>
      <path d="M24 455v143m12-143v44m13-44v27m13-27v44m13-44v27m13-27v44" stroke="#645039" strokeWidth="3"/>
    </g>
    <g transform="rotate(30 1190 570)">
      <rect x="1164" y="510" width="42" height="139" rx="9" fill="#d9a543" stroke="#35372b" strokeWidth="3"/>
      <path d="M1174 508v-38h22l-8 38Z" fill="#c6ccbf" stroke="#50594f" strokeWidth="2"/>
      <path d="M1176 546h20m-20 16h20m-20 16h20m-20 16h20" stroke="#927039" strokeWidth="3"/>
    </g>
    <text x="77" y="117" fill="#faf0d4" fontFamily="Georgia" fontWeight="750" fontSize="66" opacity={label}>From flat paper to a robot</text>
    <g transform={`translate(220 323) rotate(${-7-6*fold} 120 80)`} opacity={1-.29*build}>
      <path d="M-2 66H63V0H148V63H229L246 80V147L229 164H146V227H63V163H-4Z" fill="#1a332c" opacity=".35" transform="translate(10 12)"/>
      <path d="M-2 66H63V0H148V63H229L246 80V147L229 164H146V227H63V163H-4Z" fill="#e5ad70" stroke="#624436" strokeWidth="3"/>
      <path d="M63 65H146V162H63Z" fill="#efbd81"/>
      <path d="M63 66H146V164H63ZM148 63V164M-2 78H63M148 77H229" fill="none" stroke="#7c5039" strokeDasharray="5 7" strokeWidth="3"/>
      <path d={`M63 66L-3 ${66-21*fold}L-4 ${164-32*fold}H63Z`} fill="#bf754c" stroke="#72513c" strokeWidth="2"/>
      <DrawLine d="M99 54Q79 20 50 30m9-11-9 11 14 8" amount={fold} color="#583827" width={4}/>
      <circle cx="88" cy="105" r="8" fill="#6f513c"/><circle cx="123" cy="105" r="8" fill="#6f513c"/>
    </g>
    <DrawLine d="M485 453Q551 405 676 430m-20-19 20 19-28 9" amount={move(.31,.56)} color="#f7e6ac" width={7}/>
    <ellipse cx="903" cy="552" rx={125+27*build} ry="30" fill="#192e26" opacity=".47"/>
    <Block x={bodyX+5} y={484-3*build} w={44} h={46} d={23} color="#9bb7a4" side="#607d6b" top="#bfd0b6"/>
    <Block x={bodyX+84} y={484-3*build} w={46} h={46} d={23} color="#9bb7a4" side="#607d6b" top="#bfd0b6"/>
    <Block x={armX} y={386+7*build} w={31} h={81} d={21} color="#d39966" side="#996647" top="#eec093"/>
    <Block x={bodyX} y={370-7*build} w={145} h={121} d={52} color="#dcaa75" side="#9c6b50" top="#f4d2a1"/>
    <rect x={bodyX+46} y={406-7*build} width="61" height="38" rx="3" fill="#876d54"/>
    <path d={`M${bodyX+54} ${427-7*build}h13l6-9 9 17 7-8h10`} stroke="#ffe3a7" strokeWidth="2.5" fill="none"/>
    <g transform={`translate(${headX} ${headY})`}>
      <Block x={0} y={0} w={145} h={102} d={52} color="#eab479" side="#a66b50" top="#f8d7a2"/>
      <rect x="22" y="23" width="101" height="49" rx="10" fill="#504c40"/>
      <circle cx="51" cy="46" r={6+move(.79,.9)*2} fill="#e7f3be"/><circle cx="94" cy="46" r={6+move(.79,.9)*2} fill="#e7f3be"/>
      <path d="M71 61q7 5 13 0M101-17v-31" stroke="#a98156" strokeWidth="4" fill="none"/>
      <circle cx="101" cy="-48" r="7" fill="#c78568"/>
    </g>
    <g fontFamily="system-ui" fontWeight="720" fill="#fff0cb">
      <text x="89" y="629" fontSize="45">{t<.36?'01  Score the folds':t<.69?'02  Join the faces':'03  Assemble the model'}</text>
      <DrawLine d="M90 648Q241 652 462 644" amount={move(.12,.36)} color="#dfb479" width={4}/>
    </g>
  </AtlasFrame>;
}
