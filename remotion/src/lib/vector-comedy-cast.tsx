import React from 'react';

// Static, code-native SVG cast. Coordinates are local; feet meet y=440.
// Head and neck share one contour. Sleeves conceal arm roots and trousers conceal shoe roots.
const P={ink:'#565078',skin:'#FFE4CC',skin2:'#EEC19F',blush:'#ECA4A5',mint:'#8AD9BE',mintDark:'#63B69D',lilac:'#B9B3E7',purple:'#8984B8',pink:'#EBAAC6',yellow:'#F7D886',hair:'#74616B',paper:'#FFFCF5',shoe:'#686581'};
export type CastPlacement={x?:number;y?:number;scale?:number};
const Stage:React.FC<CastPlacement&{children:React.ReactNode}>=({x=0,y=0,scale=1,children})=><g transform={`translate(${x} ${y}) scale(${scale})`} stroke={P.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">{children}</g>;
const Ground=({rx=100}:{rx?:number})=><ellipse cx="0" cy="442" rx={rx} ry="9" fill="#DED9E8" opacity=".55" stroke="none"/>;
const Ears=({y=100,w=48,skin=P.skin}:{y?:number;w?:number;skin?:string})=><g fill={skin}><ellipse cx={-w} cy={y} rx="10" ry="15"/><ellipse cx={w} cy={y} rx="10" ry="15"/></g>;
const Cheeks=({y=122,w=31}:{y?:number;w?:number})=><g fill={P.blush} opacity=".6" stroke="none"><ellipse cx={-w} cy={y} rx="9" ry="5"/><ellipse cx={w} cy={y} rx="9" ry="5"/></g>;
const ShirtButtons=({ys=[238,262,286],x=0}:{ys?:number[];x?:number})=><g fill={P.ink} stroke="none">{ys.map(y=><circle key={y} cx={x} cy={y} r="2"/>)}</g>;
const Coffee=({x,y}:{x:number;y:number})=><g transform={`translate(${x} ${y})`}><path d="M-13 -25 H14 L10 7 H-9Z" fill={P.paper}/><path d="M-12 -18 H13 L11 -3 H-10Z" fill={P.pink}/><rect x="-16" y="-30" width="33" height="6" rx="2" fill="#DED9ED"/></g>;

export const BahgatEmployee:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={112}/>
  <g data-part="trousers"><path d="M-65 317 Q0 301 66 317 L61 410 Q43 417 21 410 L8 365 L-5 410 Q-27 419 -53 410Z" fill={P.purple}/><path d="M8 350 V365" fill="none"/><path d="M-54 400 L-7 400 L-6 426 Q-25 439 -76 434 Q-84 423 -54 416Z" fill={P.shoe}/><path d="M22 401 H60 L64 418 Q99 428 87 436 H21Z" fill={P.shoe}/><path d="M-69 430 H-18 M33 431 H79" stroke="#AAA5C6" strokeWidth="2"/></g>
  <g data-part="arms" fill={P.skin}><path d="M-70 201 Q-101 203 -101 256 L-86 294 Q-73 309 -65 296 L-75 252 L-57 226Z"/><path d="M71 203 Q95 204 98 247 L110 270 Q116 286 104 291 Q91 295 86 279 L68 255 L57 220Z"/></g>
  <path data-part="shirt" d="M-24 178 Q-51 178 -76 193 Q-89 207 -87 232 L-66 239 Q-95 271 -86 318 Q-4 354 89 318 Q94 274 65 237 L86 231 Q88 205 72 193 Q50 178 22 178Z" fill={P.mint}/>
  <path d="M-75 233 L-65 237 M65 237 L77 234 M-13 204 L-8 321" fill="none" stroke="#66B59D"/>
  <path data-part="head-neck" d="M-52 101 Q-61 52 -25 37 Q-2 25 26 38 Q63 52 54 105 Q52 139 26 150 L25 183 Q2 201 -24 182 L-25 153 Q-52 143 -52 101Z" fill={P.skin}/>
  <path d="M-53 75 Q-61 94 -51 113 L-44 105 L-45 78 M52 75 Q61 94 51 113 L44 105 L45 78" fill={P.hair}/>
  <path d="M-17 44 Q-4 38 8 44" stroke="white" strokeWidth="5" opacity=".65" fill="none"/>
  <Cheeks y={124} w={34}/><path d="M-37 87 Q-24 80 -13 86 M15 86 Q27 81 39 88" fill="none" strokeWidth="3"/>
  <g fill="white" fillOpacity=".25"><rect x="-43" y="91" width="36" height="27" rx="10"/><rect x="8" y="91" width="36" height="27" rx="10"/></g><path d="M-7 99 Q1 94 8 99 M-43 98 L-53 96 M44 98 L54 95" fill="none"/>
  <g fill={P.ink} stroke="none"><ellipse cx="-23" cy="103" rx="3" ry="4"/><ellipse cx="25" cy="103" rx="3" ry="4"/></g><path d="M-1 104 Q-13 121 2 123" fill="none"/><path d="M-14 134 Q-3 123 5 132 Q14 124 21 135 Q6 143 -14 134Z" fill={P.hair} stroke="none"/><path d="M-4 146 Q8 151 18 143" fill="none" strokeWidth="2"/>
  <path d="M-25 181 L-2 195 L-21 211 L-37 185 M25 181 L-2 195 L17 211 L39 186" fill="#B7E9D9"/><path d="M-2 195 L9 206 L3 216 L17 275 L1 289 L-10 273 L-4 216 L-12 205Z" fill={P.pink}/>
  <path d="M39 218 H62 V241 Q50 251 39 241Z" fill="none"/><path d="M49 219 V206" stroke={P.purple} strokeWidth="4"/>
  <g data-part="file"><path d="M-106 258 L-63 249 L-53 321 L-99 328Z" fill={P.yellow}/><path d="M-105 264 L-65 255 M-94 279 L-73 275" fill="none" stroke="#C0A468"/><path d="M-98 282 Q-108 272 -111 284 L-107 303 Q-103 312 -95 306 L-88 295" fill={P.skin}/><path d="M-103 287 L-98 296" fill="none" strokeWidth="1.6"/></g>
  <Coffee x={106} y={272}/><path d="M97 269 Q85 264 87 276 Q91 289 104 282" fill={P.skin}/>
</Stage>;

export const NabilAccountant:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={83}/><path data-part="trousers" d="M-35 263 H36 L29 413 L8 420 L-2 322 L-13 417 L-38 415Z" fill="#8884B0"/><path d="M-38 408 H-12 L-13 426 Q-37 441 -67 433 Q-71 424 -38 419Z M8 408 H29 L38 423 Q69 432 54 438 H8Z" fill={P.shoe}/>
  <g fill={P.skin}><path d="M-28 159 Q-58 165 -56 219 L-43 266 Q-35 278 -26 270 Q-24 264 -31 257 L-37 212 L-14 175Z"/><path d="M28 161 Q49 162 52 199 L47 241 L65 246 Q75 252 69 262 Q63 269 50 260 L29 248 L29 207 L13 177Z"/></g>
  <path data-part="shirt" d="M-17 142 Q-33 144 -45 161 L-37 192 L-24 188 L-34 277 Q0 285 38 274 L25 188 L43 187 L44 159 Q35 146 15 142Z" fill="#E6E0F3"/>
  <path d="M-17 156 L-30 183 L-15 196 L-26 270 Q-3 276 -2 269 L0 179Z M16 155 L29 183 L18 197 L32 270 Q11 275 6 269 L0 179Z" fill={P.lilac}/>
  <path data-part="head-neck" d="M-35 72 Q-38 28 -1 24 Q39 23 41 65 L35 103 Q30 120 13 126 L15 151 Q1 163 -14 151 L-14 126 Q-36 117 -35 72Z" fill={P.skin}/>
  <path d="M-36 76 Q-48 55 -35 41 Q-41 20 -20 20 Q-4 1 10 20 Q33 7 38 29 Q57 39 42 74 L32 68 L30 46 Q9 50 -13 43 L-24 66Z" fill={P.hair}/>
  <Cheeks y={101} w={26}/><g fill="white" fillOpacity=".2"><circle cx="-21" cy="79" r="18"/><circle cx="22" cy="79" r="18"/></g><path d="M-3 78 H4 M-39 77 L-45 70 M40 77 L46 70" fill="none"/><g fill={P.ink} stroke="none"><ellipse cx="-18" cy="80" rx="3" ry="4"/><ellipse cx="20" cy="80" rx="3" ry="4"/></g>
  <path d="M-28 54 L-13 51 M14 52 L29 59 M0 81 L-5 99 H3 M-12 114 Q0 105 13 112" fill="none"/>
  <path d="M-15 149 L0 161 L-13 177 L-24 154 M15 149 L0 161 L12 177 L26 154" fill="white"/><path d="M0 161 L8 172 L2 183 L9 225 L-1 238 L-9 223 L-3 182 L-9 172Z" fill={P.yellow}/>
  <g data-part="paper-stack" transform="rotate(12 58 254)"><rect x="39" y="219" width="51" height="69" rx="2" fill="#E5DFF1"/><rect x="32" y="212" width="51" height="69" rx="2" fill="white"/><path d="M42 228 H70 M42 237 H65 M42 247 H70" stroke="#A49DC2" strokeWidth="2"/><path d="M40 270 Q27 261 29 252 Q33 244 39 252 L45 258" fill={P.skin}/></g>
</Stage>;

export const FaridaManager:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={96}/><path data-part="trousers" d="M-49 278 H48 L45 395 L19 403 L-1 318 L-21 404 L-48 398Z" fill={P.purple}/><path d="M-49 391 H-20 L-20 426 L-60 437 H-79 Q-84 431 -49 413Z M18 394 H44 L49 417 L72 431 Q75 440 59 437 H18Z" fill={P.shoe}/>
  <path data-part="hair-back" d="M-50 94 Q-75 32 -29 21 Q-2 -2 31 24 Q67 30 57 85 L51 166 Q29 190 -45 168Z" fill={P.hair}/>
  <g data-part="arms" fill={P.skin}><path d="M-50 174 Q-74 184 -86 227 Q-88 241 -72 245 L-43 238 L-40 222 L-66 225 L-40 193Z"/><path d="M49 175 Q70 183 88 223 Q93 237 79 244 L47 237 L42 222 L67 225 L38 193Z"/></g>
  <path data-part="blazer" d="M-22 156 Q-47 156 -62 173 L-54 200 L-38 195 L-53 283 Q-15 299 1 283 Q18 299 53 283 L37 195 L55 200 L63 175 Q51 156 24 156Z" fill={P.pink}/>
  <path d="M-20 159 L0 228 L24 159Z" fill={P.paper}/><path d="M-22 157 L-31 182 L-16 191 L-23 204 L0 232 L24 203 L17 190 L33 179 L24 157" fill="none"/><path d="M1 232 V278 M-36 257 H-14 M20 257 H40" fill="none"/><circle cx="10" cy="242" r="2" fill={P.ink}/>
  <path data-part="head-neck" d="M-43 77 Q-47 37 -7 31 Q38 28 43 70 L38 107 Q33 132 14 139 L15 161 Q1 178 -17 161 L-15 139 Q-40 129 -43 77Z" fill={P.skin2}/>
  <path d="M-47 89 Q-62 39 -27 27 Q3 5 32 31 Q58 35 46 92 Q31 77 20 48 Q1 78 -35 80 L-34 137 L-48 145Z" fill={P.hair}/><path d="M-27 42 Q-5 24 13 34" stroke="#A48D97" fill="none" strokeWidth="5"/>
  <path d="M-34 89 L-5 92 L-9 107 Q-28 115 -34 89Z M6 92 L36 87 Q34 109 14 107Z" fill="#F7E8F2" fillOpacity=".5"/><path d="M-5 96 H6" fill="none"/><g fill={P.ink} stroke="none"><ellipse cx="-20" cy="98" rx="2.5" ry="3.5"/><ellipse cx="22" cy="97" rx="2.5" ry="3.5"/></g>
  <path d="M-25 80 L-12 79 M16 80 L29 76 M2 99 L-2 115 L5 116 M-9 126 Q3 137 18 122" fill="none"/>
  <circle cx="-42" cy="121" r="6" fill={P.yellow}/><circle cx="40" cy="120" r="6" fill={P.yellow}/><path d="M-12 155 Q2 167 13 155" stroke={P.yellow} strokeWidth="4" fill="none"/>
  <path d="M-49 228 Q-35 215 -29 223 L-34 237 Q-40 245 -49 239 M49 228 Q34 215 29 224 L34 237 Q42 244 49 239" fill={P.skin2}/>
</Stage>;

export const ShawkyTeaMaster:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={108}/><path d="M-49 296 H52 L43 410 L11 414 L0 345 L-13 415 L-48 410Z" fill={P.purple}/><path d="M-48 403 H-13 L-15 429 Q-40 440 -74 435 Q-79 426 -49 416Z M12 404 H43 L50 419 Q85 431 74 437 H12Z" fill={P.shoe}/>
  <path data-part="left-arm" d="M-54 183 Q-83 191 -89 229 Q-92 250 -70 263 L-36 276 L-24 261 L-66 242 L-56 211Z" fill={P.skin2}/>
  <path data-part="shirt" d="M-20 167 Q-48 165 -68 184 L-65 213 L-48 218 L-62 314 Q-6 333 63 314 L49 215 L68 209 L66 183 Q44 166 20 167Z" fill={P.yellow}/>
  <path d="M-67 200 L-47 205 L-48 218 L-66 213Z M47 203 L67 197 L68 210 L49 216Z" fill="#FCE8B4"/>
  <path data-part="apron" d="M-29 207 H29 L35 238 Q49 249 55 307 Q1 324 -55 307 Q-50 252 -36 239Z" fill={P.mint}/><path d="M-29 207 L-17 166 M29 207 L17 166 M-55 269 L-68 275 M55 269 L68 275" fill="none" stroke={P.mintDark} strokeWidth="7"/><path d="M-23 257 H23 V283 Q0 298 -23 283Z" fill="none"/>
  <Ears y={103} w={45} skin={P.skin2}/><path data-part="head-neck" d="M-44 83 Q-49 38 -2 34 Q46 36 46 79 L43 119 Q37 145 19 149 L19 175 Q0 186 -20 174 L-18 149 Q-44 137 -44 83Z" fill={P.skin2}/>
  <path d="M-47 85 Q-58 42 -30 34 Q-20 10 2 28 Q34 12 43 40 Q58 50 46 85 L35 80 L31 58 Q6 72 -18 55 L-34 79Z" fill={P.hair}/><path d="M-31 90 Q-17 84 -9 91 M13 90 Q27 81 37 86" fill="none" strokeWidth="4"/>
  <path d="M-27 104 q8 -8 15 0 M17 104 q8 -8 15 0" fill="none"/><path d="M3 102 Q-5 119 9 121" fill="none"/><path d="M3 124 Q-15 109 -30 130 Q-7 141 3 130 Q16 142 36 127 Q17 112 3 124Z" fill={P.hair}/><path d="M-4 144 Q12 153 25 139" fill="none"/>
  <path data-part="tray-arm" d="M56 211 L70 250 Q77 266 94 255 L116 218 L103 211 L80 237 L77 204Z" fill={P.skin2}/>
  <g data-part="tea-tray"><path d="M62 207 H151 L144 214 H69Z" fill="#DED7EC"/><path d="M75 181 H94 L91 206 H79Z M117 176 H136 L133 206 H121Z" fill="#FFF4D7"/><path d="M77 190 H93 L91 204 H79Z M119 186 H135 L133 204 H121Z" fill="#D9A26B" stroke="none"/><path d="M94 186 Q106 184 103 194 Q100 201 93 198 M136 182 Q148 180 146 191 Q144 198 135 196" fill="none"/><path d="M100 215 Q96 226 108 228 L120 214" fill={P.skin2}/></g>
  <path d="M-34 264 Q-20 256 -15 263 L-22 277 Q-30 281 -36 273" fill={P.skin2}/>
</Stage>;

export const ZiadDeveloper:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={89}/><path data-part="trousers" d="M-41 266 H40 L44 402 L14 410 L-3 322 L-13 412 L-43 406Z" fill="#777DA9"/><path d="M-43 398 H-13 L-16 423 L-57 432 H-78 V422 L-43 412Z M13 400 H43 L49 416 L77 424 V437 H12Z" fill={P.paper}/><path d="M-78 427 H-21 M19 431 H75 M-40 414 L-28 420 M42 415 L31 421" fill="none"/>
  <path d="M-36 170 Q-69 182 -71 232 L-59 275 Q-53 287 -43 282 Q-34 275 -45 267 L-45 225 L-22 188Z" fill={P.skin}/>
  <path data-part="hoodie" d="M-19 158 Q-44 158 -59 177 L-52 209 L-37 207 L-47 280 Q0 295 49 279 L35 208 L55 204 L57 175 Q43 159 20 158Z" fill={P.lilac}/>
  <path d="M-21 159 Q-42 143 -30 130 Q2 118 31 132 Q44 149 20 160 L0 177Z" fill="#A09ACC"/><path d="M-19 169 L-14 200 M19 169 L13 196 M-25 245 Q-1 233 25 245 L29 263 H-27Z" fill="none"/><path d="M-14 197 V204 M13 193 V200" stroke={P.paper} strokeWidth="4"/>
  <Ears y={88} w={40}/><path data-part="head-neck" d="M-40 61 Q-40 24 3 25 Q45 27 43 63 L37 103 Q29 128 14 132 L16 160 Q-1 172 -17 158 L-16 132 Q-39 122 -40 61Z" fill={P.skin}/>
  <path data-part="curls" d="M-43 83 Q-63 73 -51 56 Q-69 41 -48 28 Q-51 6 -28 10 Q-15 -10 3 5 Q23 -8 33 11 Q59 7 58 29 Q77 43 57 57 Q59 80 41 86 L32 58 Q18 65 6 54 Q-8 65 -23 57 L-29 83Z" fill={P.hair}/>
  <path d="M-40 40 Q-29 24 -18 37 M-6 22 Q9 9 17 28 M29 35 Q41 24 46 39" fill="none" stroke="#9A8490"/>
  <path d="M-45 84 Q-52 15 4 16 Q59 19 47 89" fill="none" stroke={P.ink} strokeWidth="9"/><path d="M-45 84 Q-52 15 4 16 Q59 19 47 89" fill="none" stroke={P.mint} strokeWidth="5"/><rect x="-51" y="70" width="15" height="33" rx="7" fill={P.mint}/><rect x="35" y="70" width="15" height="33" rx="7" fill={P.mint}/>
  <path d="M-26 83 L-11 81 M14 82 L29 78" fill="none"/><g fill={P.ink} stroke="none"><ellipse cx="-18" cy="96" rx="3" ry="4"/><ellipse cx="23" cy="94" rx="3" ry="4"/></g><path d="M-25 105 H-11 M15 104 H29" opacity=".35"/><path d="M3 95 L-1 111 L6 112 M-10 124 Q4 130 19 119" fill="none"/>
  <path data-part="phone-arm" d="M42 199 Q57 208 72 224 L89 188 L102 194 L88 241 Q80 258 63 246 L39 226Z" fill={P.skin}/><g transform="rotate(12 98 184)"><rect x="84" y="153" width="28" height="49" rx="5" fill={P.paper}/><rect x="89" y="160" width="18" height="28" rx="2" fill={P.mint} stroke="none"/><circle cx="98" cy="195" r="2" fill={P.ink}/></g><path d="M89 188 Q82 179 79 188 Q79 200 91 202" fill={P.skin}/>
</Stage>;

export const TanteSoheir:React.FC<CastPlacement>=props=><Stage {...props}>
  <Ground rx={111}/><path d="M-43 375 H-15 L-16 421 H-41Z M16 374 H44 L42 420 H17Z" fill={P.skin}/><path d="M-42 408 H-14 L-13 428 Q-42 440 -70 434 Q-76 426 -42 419Z M17 409 H43 L49 419 Q79 428 70 437 H15Z" fill={P.shoe}/>
  <path data-part="dress" d="M-31 191 Q0 176 34 192 L68 369 Q0 397 -72 370Z" fill={P.pink}/>
  <g fill="#F7D4E1" stroke="none">{[[-30,283],[27,302],[-20,338],[40,353],[2,248]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y})`}><circle cx="-4" cy="0" r="4"/><circle cx="4" cy="0" r="4"/><circle cy="-4" r="4"/><circle cy="4" r="4"/></g>)}</g>
  <g fill={P.skin}><path d="M-59 207 Q-87 218 -87 261 L-68 298 Q-58 308 -50 297 L-63 264 L-45 226Z"/><path d="M61 209 Q84 220 87 259 L73 286 Q64 297 55 286 L64 257 L43 229Z"/></g>
  <path data-part="cardigan" d="M-24 186 Q-53 185 -72 208 L-64 238 L-49 234 L-60 308 Q-33 320 -19 297 L-5 215 L13 299 Q32 318 60 308 L48 235 L66 239 L73 211 Q53 187 27 186Z" fill={P.yellow}/><path d="M-23 189 L-5 215 L-20 278 M24 190 L-5 215 M-47 283 H-28 M30 283 H48" fill="none"/>
  <circle cx="8" cy="240" r="3" fill={P.paper}/><circle cx="12" cy="259" r="3" fill={P.paper}/>
  <path data-part="hair-back" d="M-55 108 Q-70 63 -40 43 Q-14 20 22 40 Q63 40 60 92 L50 155 H-50Z" fill="#B1A6B5"/>
  <ellipse cx="20" cy="30" rx="30" ry="25" fill="#B1A6B5"/><path d="M7 12 Q32 4 39 28 M-2 26 Q21 14 42 37" fill="none" stroke="#D4CBD9" strokeWidth="4"/>
  <Ears y={111} w={47}/><path data-part="head-neck" d="M-47 93 Q-49 50 -4 49 Q43 45 49 87 L44 126 Q39 152 17 159 L18 190 Q0 207 -19 189 L-17 160 Q-48 150 -47 93Z" fill={P.skin}/>
  <path d="M-51 107 Q-62 66 -36 49 Q-4 25 30 48 Q61 62 51 108 L38 103 L33 69 Q10 91 -14 69 Q-29 91 -40 93 L-40 114Z" fill="#B1A6B5"/><path d="M-31 57 Q-7 39 11 54" stroke="#DDD5E2" strokeWidth="5" fill="none"/>
  <Cheeks y={135} w={33}/><path d="M-32 98 Q-21 91 -11 97 M14 97 Q26 90 35 97" fill="none"/>
  <g fill="white" fillOpacity=".25"><ellipse cx="-24" cy="116" rx="19" ry="16"/><ellipse cx="25" cy="116" rx="19" ry="16"/></g><path d="M-5 114 H6 M-44 111 L-51 105 M44 111 L51 105" fill="none"/><g fill={P.ink} stroke="none"><ellipse cx="-22" cy="116" rx="3" ry="3.7"/><ellipse cx="25" cy="116" rx="3" ry="3.7"/></g>
  <path d="M2 114 Q-5 133 7 134 M-10 147 Q4 156 19 143 M-36 138 L-31 140 M30 138 L35 135" fill="none" strokeWidth="1.9"/>
  <g fill={P.paper}><circle cx="-15" cy="193" r="4"/><circle cx="-7" cy="198" r="4"/><circle cx="2" cy="200" r="4"/><circle cx="11" cy="198" r="4"/><circle cx="18" cy="193" r="4"/></g>
  <g data-part="handbag"><path d="M66 298 Q53 254 77 252 Q103 250 94 298" fill="none" stroke={P.purple} strokeWidth="7"/><path d="M55 285 Q77 276 106 286 L118 347 Q85 368 43 349Z" fill={P.lilac}/><path d="M45 306 Q78 321 111 306" fill="none"/><rect x="74" y="307" width="17" height="12" rx="2" fill={P.yellow}/><path d="M65 276 Q58 268 56 279 L58 291 Q69 303 76 289 L76 278" fill={P.skin}/></g>
</Stage>;

export const CAST=[
  {name:'بهجت',role:'الموظف اللي دايمًا بيقول بكرة',Component:BahgatEmployee,color:'#E8F6EF'},
  {name:'نبيل',role:'المحاسب اللي قلقان من كل حاجة',Component:NabilAccountant,color:'#EFEAF8'},
  {name:'فريدة',role:'المديرة اللي عندها آخر كلمة',Component:FaridaManager,color:'#FBEAF0'},
  {name:'شوقي',role:'صاحب البوفيه وعارف كل الأخبار',Component:ShawkyTeaMaster,color:'#FBF1DA'},
  {name:'زياد',role:'المبرمج اللي لسه صاحي من امبارح',Component:ZiadDeveloper,color:'#ECECF9'},
  {name:'طنط سهير',role:'فاهمة الحكاية قبل ما تبدأ',Component:TanteSoheir,color:'#F5EAF2'},
] as const;

export const ComedyCastSheet:React.FC=()=> <svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1640" viewBox="0 0 2400 1640">
  <rect width="2400" height="1640" fill="#FFFDF9"/>
  <g fontFamily="Arial, sans-serif" fill={P.ink}>
    <text x="1200" y="85" textAnchor="middle" fontSize="46" fontWeight="700">شِلّة المكتب</text>
    <text x="1200" y="132" textAnchor="middle" fontSize="23" fill="#948AA6">ست شخصيات لفيلم كرتون كوميدي</text>
    {CAST.map(({name,role,Component,color},i)=>{
      const x=65+(i%3)*775, y=185+Math.floor(i/3)*690;
      return <g key={name}>
        <rect x={x} y={y} width="720" height="650" rx="36" fill={color}/>
        <text x={x+42} y={y+55} fontSize="22" fill="#A49AAC">0{i+1}</text>
        <Component x={x+360} y={y+525-440*[1.02,1.18,1.14,1.08,1.19,1][i]} scale={[1.02,1.18,1.14,1.08,1.19,1][i]}/>
        <text x={x+360} y={y+575} fontSize="36" fontWeight="700" textAnchor="middle">{name}</text>
        <text x={x+360} y={y+615} fontSize="24" textAnchor="middle" fill="#82788E">{role}</text>
      </g>;
    })}
  </g>
</svg>;

export const BahgatDetailSheet:React.FC=()=> <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="0 0 1400 1400">
  <rect width="1400" height="1400" fill="#F4FBF6"/><BahgatEmployee x={700} y={65} scale={2.65}/>
  <g fontFamily="Arial, sans-serif" fill={P.ink} textAnchor="middle"><text x="700" y="1320" fontSize="46" fontWeight="700">بهجت · الموظف اللي دايمًا بيقول بكرة</text></g>
</svg>;
