import React from 'react';

export const colors = {ink:'#243831', teal:'#167567', mint:'#98d6c5', red:'#bc523a', coral:'#ed9b79', yellow:'#edbb58', paper:'#fff8e7', tan:'#e6d5ab'};
const {ink,teal,mint,red,coral,yellow,paper,tan}=colors;

export const Text:React.FC<React.PropsWithChildren<{y?:number; size?:number; color?:string}>>=({children,y=9,size=25,color=ink})=>
  <text y={y} textAnchor="middle" direction="rtl" fontSize={size} fontWeight="700" fill={color} stroke="none">{children}</text>;

export function Person({woman,t,worried}:{woman:boolean;t:number;worried:boolean}) {
  const blink=t%3.1>2.96;
  const glance=Math.sin(t*2.35)*3;
  const skin=woman?'#eaa77e':'#f1b992';
  return <g stroke={ink} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
    <ellipse cy="109" rx="91" ry="14" fill={ink} opacity=".13" stroke="none"/>
    <path d="M-73 102q5-85 73-85t73 85q-72 18-146 0Z" fill={woman?red:teal}/>
    <path d="M-42 89l-4-26m88 26 4-26" fill="none" opacity=".56"/>
    {woman && <path d="M-60-11q-20-101 57-111 72-11 68 111l15 59q-34 38-82 27l-66-18Z" fill={coral}/>}
    <g transform={`rotate(${(woman?-5:4)+Math.sin(t*2.15)*1.9} 0 27)`}>
      <ellipse cy="-34" rx="55" ry="58" fill={skin}/>
      {!woman&&<path d="M-52-44q-21-46 18-57 10-18 32-4 31-17 46 11 21 12 10 49l-19-24q-35 14-66-7Z" fill={ink}/>}
      {woman&&<path d="M-54-45q1-57 58-63 44 11 52 60-28-10-47-38-20 24-63 41Z" fill={red}/>}
      <g transform={`translate(${glance} 0)`} strokeWidth="3">
        <ellipse cx="-20" cy="-41" rx="12" ry={blink?2:14} fill={paper}/>
        <ellipse cx="18" cy="-41" rx="12" ry={blink?2:14} fill={paper}/>
        {!blink&&<path d="M-17-43v7m38-7v7" strokeWidth="5"/>}
        <path d={worried?'M-32-62l18 7m23-7 23-10':'M-32-61q10-12 21-4m17-1q10-8 23 0'} fill="none"/>
        <path d="M-4-37l-5 11h9" fill="none"/>
        <path d={worried?'M-11-11q11-7 23-1':'M-12-13q13 20 28-1Z'} fill={worried?'none':ink}/>
        {woman&&<circle cx="42" cy="-5" r="6" fill={yellow}/>}
      </g>
    </g>
  </g>;
}

export type IconName='hall'|'camera'|'cake'|'clock'|'door'|'tray'|'house'|'bulb'|'pot'|'spoon'|'book'|'heart'|'child'|'spark'|'fork'|'shield';

export function Icon({name}:{name:IconName}) {
  const drawings:Record<IconName,React.ReactNode>={
    hall:<><path d="M-73 60V-8L0-67 73-8v68Z" fill={coral}/><path d="M-39 60V7q39-54 78 0v53Z" fill={paper}/><path d="M0-45v25m-13-13h26" stroke={yellow}/></>,
    camera:<><path d="M-78-33h40l13-21h49l14 21h40v93H-78Z" fill={teal}/><circle cy="13" r="33" fill={mint}/><circle cy="13" r="15" fill={ink}/><path d="M49-15h12" stroke={paper}/></>,
    cake:<><ellipse cy="59" rx="83" ry="15" fill={mint}/><path d="M-67 2v45q66 29 134 0V2Z" fill={coral}/><path d="M-67 6q14 25 32 9Q-17 37 0 18q21 19 39-2 18 12 28-10V-8q-67-30-134 0Z" fill={paper}/><path d="M0-39v29" stroke={red}/><circle cy="-45" r="13" fill={red}/></>,
    clock:<><circle r="67" fill={yellow}/><circle r="49" fill={paper}/><path d="M0-31V0l28 15M0-50v8m50 42h-8M0 50v-8m-50-42h8" fill="none"/><path d="M-61-56l-17-15m139 15 17-15" stroke={red}/></>,
    door:<><path d="M-54 68V-75H51V68" fill={tan}/><path d="M-34-66l77-11V68l-77-17Z" fill={teal}/><circle cx="24" cy="0" r="5" fill={yellow}/><path d="M-74 69H71" fill="none"/></>,
    tray:<><ellipse cy="30" rx="83" ry="31" fill={teal}/><ellipse cy="22" rx="77" ry="26" fill={mint}/><path d="M-50 13l21-16 22 16-20 15ZM-7 13l23-17 21 17-21 15ZM27 17l19-14 20 13-19 13Z" fill={yellow}/></>,
    house:<><path d="M-70 1 0-54 70 1v64H-70Z" fill={mint}/><path d="M-84 5 0-63 84 5" fill="none" stroke={teal} strokeWidth="14"/><path d="M-17 64V20h33v44Z" fill={yellow}/><circle cx="37" cy="13" r="10" fill={paper}/></>,
    bulb:<><path d="M-26 20a42 42 0 1 1 52 0l-9 20h-34Z" fill={yellow}/><path d="M-17 51h34m-26 12H9M-65-33l-14-12m144 12 14-12M0-79v-13" stroke={teal} fill="none"/></>,
    pot:<><path d="M-65-13H65L50 52H-50Z" fill={mint}/><path d="M-72-17H72m-68-9h-20m-46 34h-20m151 0h20" fill="none"/><path d="M-39 19q39 12 79 0" fill="none" opacity=".34"/></>,
    spoon:<><path d="M-34 67 20-20" stroke={red} strokeWidth="18"/><ellipse cx="35" cy="-44" rx="20" ry="33" transform="rotate(31 35 -44)" fill={coral}/></>,
    book:<><path d="M0-32q-40-44-78-18v108q44-18 78 8 32-26 78-8V-50Q39-76 0-32Z" fill={paper}/><path d="M0-32v98M-57-29q20-6 41 9m-41 12q20-6 41 9m32-21q22-15 41-9m-41 30q22-15 41-9" fill="none" stroke={teal}/></>,
    heart:<path d="M0 62Q-105-8-61-47q32-28 61 4 29-32 61-4Q105-8 0 62Z" fill={coral}/>,
    child:<><path d="M-55 68q3-68 55-68t55 68Z" fill={yellow}/><circle cy="-22" r="43" fill={coral}/><path d="M-33-43q30 9 55-15m-40 37h1m34 0h1m-28 13q13 15 22 0" fill="none"/></>,
    spark:<path d="M0-70 14-16 70 0 14 14 0 68-15 14-70 0-15-16Z" fill={yellow}/>,
    fork:<path d="M0 68V-20m-25-43v37q25 28 50 0v-37M0-63v38" fill="none" stroke={teal} strokeWidth="9"/>,
    shield:<><path d="M0-72 61-48v49Q58 47 0 73-58 47-61 1v-49Z" fill={mint}/><path d="M-27-1l17 17 35-41" fill="none" stroke={teal} strokeWidth="10"/></>,
  };
  return <g stroke={ink} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">{drawings[name]}</g>;
}

export function Sticker({icon,label}:{icon:IconName;label?:string}) {
  return <>
    <circle r="102" fill={tan} opacity=".48" cy="7"/>
    <circle r="102" fill={paper} stroke={ink} strokeWidth="3.4" strokeDasharray="4 7"/>
    <Icon name={icon}/>
    {label&&<g transform="translate(0 98)"><rect x="-82" y="-20" width="164" height="40" rx="13" fill={yellow}/><Text y={7} size={19}>{label}</Text></g>}
  </>;
}
