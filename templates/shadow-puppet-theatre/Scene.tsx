import {AtlasFrame, DrawLine, useAtlasTimeline} from '../../../remotion/src/lib/atlas-motion';

export function AtlasScene() {
  const {t,move}=useAtlasTimeline();
  const open=move(.03,.18);
  const reach=move(.24,.51);
  const grow=move(.48,.72);
  const close=move(.74,.90);
  const ux=240 + 39*open;
  const uy=420-18*reach;
  const pawX=108+79*reach;
  const pawY=-62-68*reach;

  return <AtlasFrame label="How light makes a shadow">
    <defs>
      <radialGradient id="stage"><stop stopColor="#ffe596"/><stop offset=".57" stopColor="#eda951"/><stop offset="1" stopColor="#632921"/></radialGradient>
      <filter id="cloth"><feTurbulence baseFrequency=".52 .72" numOctaves="2" seed="8"/></filter>
      <pattern id="lace" width="19" height="19" patternUnits="userSpaceOnUse"><path d="M9 2l6 7-6 7-6-7Z" fill="#17100f"/><circle cx="9" cy="9" r="2" fill="#fff"/></pattern>
      <mask id="body"><path d="M-110 73Q-102-3-37-37Q28-58 70-7Q88 41 33 81Q-35 108-110 73Z" fill="white"/><rect x="-70" y="-19" width="104" height="86" fill="url(#lace)" opacity=".91" style={{mixBlendMode:'multiply'}}/><path d="M-52 22Q-26-12-2 19Q-24 69-52 22Z" fill="black"/></mask>
    </defs>
    <rect width="1280" height="720" fill="url(#stage)"/>
    <rect width="1280" height="720" filter="url(#cloth)" opacity=".13" style={{mixBlendMode:'multiply'}}/>
    <path d="M22 19H1258V701H22ZM39 35V684H1241V35Z" fill="#361e1a" fillRule="evenodd"/>
    <path d="M0 0H218Q115 61 80 223L0 265ZM1280 0H1062Q1165 61 1200 223L1280 265Z" fill="#522721"/>
    <text x="640" y="103" textAnchor="middle" fill="#35231a" fontSize="63" fontFamily="Georgia" fontWeight="700" opacity={open}>HOW A SHADOW GROWS</text>
    <path d="M140 473L1100 222V558Z" fill="#ffdc7d" opacity={.13+.24*reach}/>
    <g transform="translate(123 475)">
      <circle r="32" fill="#fff1ab" opacity=".7"/>
      <path d="M-17-7H3L21-21V21L3 8H-17Z" fill="#2f1b16"/>
      <DrawLine d="M30-26l23-14M37 0h27M30 24l21 13" amount={.3+.7*reach} color="#fff3b5" width={4}/>
    </g>
    <path d="M1086 204V572" stroke="#562d23" strokeWidth="3" strokeDasharray="4 9" opacity=".55"/>
    <g transform={`translate(1000 459) scale(${.6+.53*grow})`} opacity={grow*.58}>
      <path d="M-83 71Q-106-13-38-70L-22-178Q-8-196-2-165L10-86L39-182Q57-196 57-162L49-68Q88-48 80 4Q57 73-83 71Z" fill="#56282a"/>
    </g>
    <g transform={`translate(${ux-34*grow} ${uy+Math.sin(t*10)*4})`}>
      <path d={`M-58 69L-156 293M${pawX} ${pawY}L${pawX+84} 264`} stroke="#593328" strokeWidth="3.5" opacity=".85"/>
      <path d="M-108 40Q-141 25-151 62Q-143 93-109 78" fill="#291a17"/>
      <rect x="-116" y="-71" width="207" height="179" fill="#2a1b17" mask="url(#body)"/>
      <ellipse cx="-25" cy="24" rx="19" ry="24" fill="#ac4f3d" opacity=".92"/>
      <path d="M-29-28Q-51-85 1-110L-9-206Q-4-230 10-207L30-127L54-205Q70-224 76-198L66-116Q108-99 101-58Q83-22 20-32Z" fill="#291a17"/>
      <path d="M7-192l15 56-13 10ZM64-191l-10 66-12-6Z" fill="#d87846"/>
      <circle cx="71" cy="-81" r="9" fill="#f3c97a"/><circle cx="74" cy="-81" r="4" fill="#281814"/>
      <path d={`M32-17Q${pawX-31} ${pawY+62} ${pawX} ${pawY}`} fill="none" stroke="#291a17" strokeWidth="20" strokeLinecap="round"/>
      <circle cx="34" cy="-18" r="7" fill="#c48751"/><circle cx={pawX} cy={pawY} r="5" fill="#c48751"/>
    </g>
    <DrawLine d="M177 456L1082 238M177 487L1082 560" amount={grow} color="#fff1b0" width={3}/>
    <rect x="143" y="585" width="994" height="81" rx="13" fill="#492721" opacity=".79"/>
    <g fill="#ffeab7" fontFamily="Georgia" fontWeight="700" textAnchor="middle">
      <text x="640" y="630" fontSize="41" opacity={open*(1-reach)}>Light travels toward the screen</text>
      <text x="640" y="630" fontSize="41" opacity={reach*(1-close)}>The puppet blocks part of the light</text>
      <text x="640" y="630" fontSize="43" opacity={close}>Closer to the lamp. A bigger shadow.</text>
      <DrawLine d="M386 649Q631 664 894 649" amount={close} color="#ffcf78" width={4}/>
    </g>
  </AtlasFrame>;
}
