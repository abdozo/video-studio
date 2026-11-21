import {AtlasFrame, DrawLine, useAtlasTimeline} from '../../../remotion/src/lib/atlas-motion';

const nodes = [
  {x:206,label:'REQUEST',color:'#73ceff',d:'M-34-27H34V26H-34ZM-20-8l12 11-12 12M1 15h19'},
  {x:640,label:'CACHE',color:'#c49cff',d:'M-37-25Q0-53 37-25V27Q0 54-37 27ZM-37-25Q0 3 37-25M-37 1Q0 28 37 1'},
  {x:1074,label:'SERVER',color:'#71efce',d:'M-37-32H37V-5H-37ZM-37 6H37V33H-37ZM-25-19h4m-4 39h4m30-39h18m-18 39h18'},
];
const rows=Array.from({length:9},(_,i)=>i);

export function AtlasScene() {
  const {t,move}=useAtlasTimeline();
  const reveal=move(.02,.2);
  const across=move(.23,.44);
  const home=move(.54,.78);
  const end=move(.77,.94);
  return <AtlasFrame label="A cache makes repeat requests faster">
    <defs>
      <linearGradient id="dark" x2="1" y2="1"><stop stopColor="#070a1b"/><stop offset="1" stopColor="#141332"/></linearGradient>
      <linearGradient id="title" x2="1" y2="0"><stop stopColor="#a3e5ff"/><stop offset=".6" stopColor="#fff"/><stop offset="1" stopColor="#c2a4ff"/></linearGradient>
      <radialGradient id="cloud"><stop stopColor="#5960ff" stopOpacity=".34"/><stop offset="1" stopColor="#5960ff" stopOpacity="0"/></radialGradient>
      <radialGradient id="packet"><stop stopColor="#e4ffff"/><stop offset=".26" stopColor="#a2eaff" stopOpacity=".84"/><stop offset="1" stopColor="#5dcfff" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#dark)"/>
    <ellipse cx={635+52*Math.sin(t*5)} cy="370" rx="600" ry="315" fill="url(#cloud)"/>
    <g opacity=".22" fill="none" stroke="#685fd0">
      {rows.map(i=><path key={i} d={`M${512+i*31} 437L${-470+i*280} 720M0 ${448+i*i*4.3}H1280`}/>)}
    </g>
    <text x="640" y="145" textAnchor="middle" fontSize="81" fontFamily="system-ui" fontWeight="780" letterSpacing="-2"
      fill="url(#title)" opacity={reveal}>Why a cache is faster</text>
    <DrawLine d="M294 365H553M727 365H989" amount={move(.14,.26)} color="#7473e4" width={3}/>
    <DrawLine d="M640 451Q617 550 420 550Q214 534 207 451" amount={home} color="#8b73ff" width={4}/>
    {nodes.map(({x,label,color,d},i)=>{
      const visible=move(.085+i*.036,.23+i*.06);
      const active=i===0?1-across:i===1?across:1-end;
      return <g key={label} transform={`translate(${x} ${365+24*(1-visible)})`} opacity={visible}>
        <circle r="144" fill="url(#cloud)" opacity={active}/>
        <rect x="-83" y="-85" width="166" height="170" rx="28" fill="#141a3b" stroke={color} strokeWidth={2+active*2}/>
        <DrawLine d={d} amount={visible} color={color} width={5}/>
        <text y="125" textAnchor="middle" fill={color} fontFamily="system-ui" fontWeight="740" fontSize="26" letterSpacing="3">{label}</text>
      </g>;
    })}
    {t>=.23&&t<.48&&<circle cx={294+260*across} cy="365" r="33" fill="url(#packet)"/>}
    {t>=.54&&t<.78&&<circle cx={640-433*home} cy={452+98*Math.sin(Math.PI*home)} r="38" fill="url(#packet)"/>}
    <g fill="#e9e8ff" textAnchor="middle" fontFamily="system-ui" fontWeight="640">
      <text x="640" y="648" fontSize="39">{t<.41?'01 · Send the request':t<.72?'02 · Find a saved response':'03 · Serve it from the cache'}</text>
      <text x="1056" y="535" fontSize="26" fill="#b0a5df" opacity={end}>Server skipped</text>
    </g>
  </AtlasFrame>;
}
