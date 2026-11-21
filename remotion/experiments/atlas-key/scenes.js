import {makeReference} from './reference.generated.js';

export const W = 1280;
export const H = 720;
export const duration = 15;
export const styles = Object.keys(makeReference);
const title = 'How does a key open a lock?';
const beats = [
  {at: 0, text: 'Three spring-loaded pins block the plug.'},
  {at: 4, text: 'The key lifts each pin a different amount.'},
  {at: 8, text: 'All three splits meet the shear line.'},
  {at: 12, text: 'The plug turns. The lock opens.'},
];

const clamp = (x) => Math.max(0, Math.min(1, x));
function ease(t, a, b) {
  const u = clamp((t - a) / (b - a));
  return u * u * (3 - 2 * u);
}
function gradient(c, y, h, colors) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
  return g;
}
function poly(points) {
  const p = new Path2D();
  points.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y));
  p.closePath();
  return p;
}
function round(x, y, w, h, r) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
function text(c, value, x, y, size, family, color, weight = 700) {
  c.save();
  c.font = `${weight} ${size}px ${family}`;
  c.textAlign = 'center';
  c.fillStyle = color;
  c.fillText(value, x, y);
  c.restore();
}

const profile = [[890, 421], [842, 421], [824, 391], [795, 391], [776, 417],
  [730, 417], [694, 345], [665, 345], [638, 415], [586, 415], [564, 369],
  [535, 369], [508, 415], [368, 415]];
const key = new Path2D();
key.moveTo(368, 415);
key.bezierCurveTo(338, 371, 279, 376, 256, 415);
key.bezierCurveTo(223, 474, 289, 529, 344, 492);
key.quadraticCurveTo(359, 482, 371, 473);
key.lineTo(890, 473);
for (const [x, y] of profile) key.lineTo(x, y);
key.closePath();
key.moveTo(330, 448);
key.arc(305, 448, 25, 0, 2 * Math.PI, true);
const shell = round(456, 214, 512, 302, 34);
const plug = round(456, 324, 512, 192, 33);
const pins = [{x:550, length:45}, {x:680, length:21}, {x:810, length:67}];

function contactAt(x) {
  for (let i = 1; i < profile.length; i++) {
    const [right, y0] = profile[i - 1];
    const [left, y1] = profile[i];
    if (x >= left && x <= right) return y1 + (y0 - y1) * (x - left) / (right - left);
  }
  return 444;
}
function state(t) {
  const entry = ease(t, 4, 7.8);
  const keyScaleX = .39 + .61 * entry;
  const keyScaleY = .66 + .34 * entry;
  const turn = ease(t, 11.2, 12.6);
  const lift = ease(t, 12, 13.4);
  const pinStates = pins.map(({x, length}) => ({
    x, length, split: Math.min(444, 448 + (contactAt(x / keyScaleX) - 448) * keyScaleY) - length,
  }));
  const index = beats.findLastIndex(({at}) => t >= at);
  return {t, entry, keyScaleX, keyScaleY, turn, lift, pinStates, index,
    aligned: pinStates.filter(({split}) => Math.abs(split - 324) < .1).length,
    caption: beats[index].text};
}

function line(c, pts, color, width, dash = []) {
  c.save();
  c.lineWidth = width;
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.setLineDash(dash);
  c.beginPath();
  pts.forEach(([x,y],i) => i ? c.lineTo(x,y) : c.moveTo(x,y));
  c.stroke();
  c.restore();
}

const palette = {
  flat: {shell:['#8c85fa','#4235aa'], plug:['#6553d0','#292471'], key:['#fff1a1','#fba84d'], pin:['#fbb2da','#b64de0'], low:['#98fff1','#24bdb8'], good:'#8afbe9', outline:'#d0c4ff'},
  ink: {shell:['#dfe7ef','#d5e0e8'], plug:['#f8fbf9','#f2f6f7'], key:['#efd79e','#dfb563'], pin:['#ec8c88','#da625d'], low:['#e3c570','#cba24b'], good:'#16884a', outline:'#243343'},
  wash: {shell:['#a6bdcd','#7895b4'], plug:['#e4e2d6','#aabfca'], key:['#efd8a4','#ca9360'], pin:['#cd8685','#aa5c64'], low:['#e1bd76','#bc985a'], good:'#9f444b', outline:'#504354'},
  shadow: {shell:['#713d21','#492211'], plug:['#63331b','#3f1c0d'], key:['#301109','#170908'], pin:['#ecac56','#bd722c'], low:['#ffe0a1','#ed9f40'], good:'#ffd48e', outline:'#150905'},
  acid: {shell:['#753ad7','#2d3db3'], plug:['#ff719a','#f33d82'], key:['#fff35a','#ffa032'], pin:['#ff95c7','#ef2c92'], low:['#ebff65','#91d72a'], good:'#eeff84', outline:'#26092c'},
  tech: {shell:['#182e6b','#1c124b'], plug:['#132c52','#0b162d'], key:['#d8fbff','#4aa6ff'], pin:['#fb8fda','#9655ff'], low:['#9fffe9','#1f9cb1'], good:'#86ffe6', outline:'#7ac8ff'},
};

function fill(c, p, colors, y, h, edge, width = 3) {
  c.fillStyle = gradient(c, y, h, colors);
  c.fill(p, 'evenodd');
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.stroke(p);
  }
}

function diagram(c, s, p, {stroke = true, hole = false, texture = null} = {}) {
  const edge = stroke ? p.outline : null;
  const grain = (shape) => {
    if (!texture) return;
    c.fillStyle = texture;
    c.fill(shape,'evenodd');
  };
  fill(c, shell, p.shell, 214, 302, edge, 5);
  fill(c, plug, p.plug, 324, 192, edge, 4);
  grain(shell);
  for (const {x, length, split} of s.pinStates) {
    const track = round(x - 22, 229, 44, 234, 16);
    c.save();
    c.globalAlpha = .24;
    c.fillStyle = edge || '#120936';
    c.fill(track);
    c.restore();
    const spring = [[x,230]];
    for (let i = 1; i < 8; i++) spring.push([x + (i % 2 ? -10 : 10), 230 + (split - 263) * i / 8]);
    spring.push([x,split - 33]);
    line(c, spring, edge || '#d1bbff', 3.5);
    fill(c, round(x - 17, split - 32, 34, 31, 5), p.pin, split - 32, 32, edge);
    const tip = split + length;
    fill(c, poly([[x-17,split+1],[x+17,split+1],[x+17,tip-9],[x,tip],[x-17,tip-9]]),
      p.low, split, length, edge);
    if (hole) {
      c.fillStyle = '#ffc875';
      for (let y = split - 23; y < split - 6; y += 6) {
        c.beginPath(); c.arc(x,y,2.5,0,7); c.fill();
      }
    }
  }
  line(c, [[468,324],[951,324]], s.t > 7.8 ? p.good : p.outline, 4, [12,9]);
  c.save();
  c.globalAlpha *= .7 + .3 * ease(s.t, 2, 4);
  c.translate(0, 448);
  c.scale(s.keyScaleX, s.keyScaleY * (1 - .62 * s.turn));
  c.translate(0,-448);
  fill(c, key, p.key, 382, 110, edge, 5);
  grain(key);
  line(c, [[382,453],[858,453]], edge || p.key[1], 3);
  c.restore();
}

function result(c, x, y, s, p, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.lineWidth = 19;
  c.strokeStyle = p.good;
  c.lineCap = 'round';
  c.save();
  c.translate(-s.lift * 18, -s.lift * 28);
  c.rotate(s.lift * -.24);
  c.beginPath();
  c.moveTo(-48, 15);
  c.lineTo(-48, -42);
  c.bezierCurveTo(-48,-107,48,-107,48,-42);
  c.lineTo(48,15);
  c.stroke();
  c.restore();
  fill(c,round(-79,0,158,106,25),p.shell,0,106,p.outline,5);
  c.fillStyle = p.good;
  c.beginPath();
  c.arc(0,45,13,0,7);
  c.fill();
  c.fillRect(-5,45,10,21);
  c.restore();
}

function camera(c, s) {
  const push = ease(s.t, 2.8, 4.7) * (1 - ease(s.t, 10.8, 12.8));
  c.translate(-52 * push, -38 * push);
  c.scale(1 + .09 * push, 1 + .09 * push);
}

function mainDrawing(c, s, p, options) {
  c.save();
  camera(c, s);
  c.translate(-145 * s.turn, 0);
  diagram(c, s, p, options);
  c.restore();
  if (s.turn > 0) {
    c.save();
    c.globalAlpha = s.turn;
    result(c, 1040, 368, s, p);
    c.restore();
  }
}

function whiteboard(c, s, r) {
  const {t, caption, index} = s;
  c.fillStyle = gradient(c, 0, H, ['#f6f8f7','#ecefee','#dfe4e3']);
  c.fillRect(0,0,W,H);
  const ghost = r.ghostBoard();
  c.drawImage(ghost.cv, ghost.x0, ghost.y0, ghost.w, ghost.h);
  const titleP = ease(t, .1, 1.5);
  const titleFont = '400 58px "Permanent Marker"';
  r.mText(c,title,84,123,titleFont,'#1d1f26',82,titleP);
  const p = ease(t, 1.2, 2.65);
  const outline = [[455,215],[965,215],[968,516],[457,516],[456,217]];
  c.save();
  camera(c,s);
  const marker = (pts, color, width, seed, amount) =>
    r.marker(c,r.wobble(r.seg(pts,2.5),r.H.makeNoise(seed),seed,1.1),color,width,seed,amount);
  if (p < 1) marker(outline,'#1d1f26',6,10,p);
  c.restore();
  if (t >= 2.35) {
    c.save();
    c.globalAlpha = ease(t,2.35,2.95);
    mainDrawing(c,s,palette.ink);
    c.restore();
  }
  const labelP = ease(t, beats[index].at + .08, beats[index].at + .85);
  r.mText(c,caption,98,615,'700 42px "Kalam"',index > 1 ? '#16884a' : '#1f4fc2',63,labelP);
  if (t > 8 && t < 11.2) {
    r.mText(c,'3 / 3',1035,293,'400 63px "Permanent Marker"','#16884a',14,ease(t,8.1,8.9));
    marker([[1046,307],[1119,305],[1156,307]],'#16884a',6,41,ease(t,8.85,9.4));
  }
  const sheen = c.createLinearGradient(200,0,800,700);
  sheen.addColorStop(.34,'#ffffff00'); sheen.addColorStop(.49,'#ffffff32'); sheen.addColorStop(.56,'#ffffff00');
  c.fillStyle = sheen; c.fillRect(0,0,W,H);
  let tip = null;
  if (titleP > 0 && titleP < 1) {
    c.font = titleFont;
    tip = [84 + c.measureText(title.slice(0,Math.ceil(title.length * titleP))).width,106,'#1d1f26'];
  } else if (p > 0 && p < 1) {
    tip = r.tip();
  } else if (labelP > 0 && labelP < 1) {
    c.font = '700 42px "Kalam"';
    tip = [98 + c.measureText(caption.slice(0,Math.ceil(caption.length * labelP))).width,596,index > 1 ? '#16884a' : '#1f4fc2'];
  }
  if (tip) {
    c.save();
    c.translate(tip[0],tip[1]); c.rotate(.72);
    fill(c,poly([[0,0],[18,-8],[18,8]]),[tip[2],tip[2]],-8,16,null);
    fill(c,round(16,-13,182,26,8),['#fff','#d9dce0','#9da5ac'],-13,26,null);
    c.fillStyle = tip[2]; c.fillRect(153,-13,32,26); c.restore();
  }
  r.H.grain(c,W,H,.018,9 + Math.floor(t * 12) % 5);
}

function flat(c, s, r) {
  r.sky(c,W,H,s.t,{x:s.t * 13,y:20,z:1.08});
  r.glow(c,720,367,410,'#865cff',.24);
  const pop = ease(s.t,.12,1.65);
  c.save();
  c.globalAlpha = pop;
  c.translate(640,355);
  c.scale(.72 + .28 * pop,.72 + .28 * pop);
  c.translate(-640,-355);
  mainDrawing(c,s,palette.flat,{stroke:false});
  c.restore();
  text(c,title,640,126,70,'Fredoka','#fff3c3');
  r.pill(c,640,626,s.caption,27,{a:ease(s.t,beats[s.index].at,beats[s.index].at+.32)});
  if (s.index === 2) r.text(c,'3 / 3',1080,254,67,'#8afbe9');
  r.finish(c,W,H,s.t);
}

let washAccent;
function paperWash(c,r) {
  const glaze = r.H.layer(W,H);
  const x = glaze.getContext('2d');
  const noise = r.H.rng(72);
  for (let i=0;i<1150;i++) {
    x.fillStyle = i % 2 ? 'rgba(59,49,76,0.10)' : 'rgba(255,251,223,0.31)';
    x.beginPath();
    x.ellipse(noise.range(0,W),noise.range(0,H),noise.range(.5,4.5),noise.range(.4,2.0),noise.range(0,4),0,7);
    x.fill();
  }
  return c.createPattern(glaze,'repeat');
}
let washGrain;
function wash(c, s, r) {
  const {paper} = r.cachedExplainer();
  c.drawImage(paper,Math.round(s.t * 22),0,W,H,0,0,W,H);
  if (!washAccent) {
    washAccent = r.H.layer(W,H);
    const x = washAccent.getContext('2d');
    const cloud = [[265,350,1],[420,204,1],[735,203,1],[930,255,1],[1050,417,1],
      [915,523,1],[674,534,1],[381,482,1]];
    r.exWash(x,cloud.map(([x,y,v])=>({x,y,v})),[150,177,206],{layers:28,alpha:.037,amt:.22,seed:14});
    const amber = [[180,460,1],[300,325,1],[460,331,1],[513,435,1],[401,529,1],[246,533,1]];
    r.exWash(x,amber.map(([x,y,v])=>({x,y,v})),[213,161,89],{layers:26,alpha:.039,amt:.18,seed:26});
  }
  c.save(); c.globalAlpha = ease(s.t,1,3.4); c.drawImage(washAccent,0,0); c.restore();
  const reveal = ease(s.t,1.45,3.15);
  r.pencil(c,[[455,215],[967,215],[967,516],[457,516],[455,215]],reveal,.7,2);
  if (reveal > .25) {
    c.save();
    c.globalAlpha = .88 * ease(s.t,1.8,3.6);
    c.globalCompositeOperation = 'multiply';
    washGrain ??= paperWash(c,r);
    mainDrawing(c,s,palette.wash,{texture:washGrain});
    c.restore();
  }
  r.wcText(c,title,640,120,78,'#504354',{align:'center',reveal:ease(s.t,.1,1.65)});
  r.wcText(c,s.caption,640,622,45,'#563d49',{align:'center',reveal:ease(s.t,beats[s.index].at,beats[s.index].at+.9)});
  if (s.index === 2) {
    const oval = Array.from({length:100},(_,i)=>{
      const a = i * Math.PI * 2 / 99;
      return [747 + 232 * Math.cos(a), 324 + 69 * Math.sin(a)];
    });
    r.wcStroke(c,oval,8,'#a74550',ease(s.t,8.55,9.75));
  }
}

function shadow(c, s, r) {
  const t = s.t;
  const light = .22 + .78 * ease(t,0,1.15);
  r.lamp(c,W,H,t,light,.14);
  const st = r.begin(W,H);
  r.stage(st,t);
  r.pup(st,{alpha:ease(t,.65,2.35)},(p,g,rods)=>{
    const dy = 93 * (1 - ease(t,.65,2.6)) + Math.sin(t * 2.8) * 2;
    p.save(); p.translate(0,dy);
    mainDrawing(p,s,palette.shadow,{hole:true});
    p.restore();
    rods.push([723 - 145 * s.turn,502 + dy,4,1]);
    if (s.t > 1.8) rods.push([305*s.keyScaleX - 145*s.turn,448 + dy,4,.95]);
    for (const {x} of s.pinStates) {
      g.fillStyle = '#ffd38c';
      g.fillRect(x - 9,319 + dy,18,7);
    }
  });
  r.pup(st,{},(p,g)=>r.tag(p,g,{
    x:640,y:47 - 100 * (1-ease(t,.18,1.0)),w:720,h:70,size:52,text:title,rot:Math.sin(t*2)*.013,
  }));
  r.pup(st,{},(p,g)=>r.tag(p,g,{
    x:640,y:550 - 114 * (1-ease(t,beats[s.index].at,beats[s.index].at+.66)) * .45,
    w:790,h:63,size:39,text:s.caption,rot:Math.sin(t*2.8)*.019,
  }));
  r.curtains(st.S.getContext('2d'),W,H,1-ease(t,0,1.08),t);
  r.end(c,st,t);
}

function psychedelic(c, s, r) {
  const t = s.t;
  const fade = ease(t,.2,1.5);
  c.fillStyle = r.C.cream; c.fillRect(0,0,W,H);
  c.save(); c.globalAlpha = fade * .93;
  r.liquid(c,W,H,t,{cx:640,cy:381,cols:[r.C.mag,r.C.acid],line:r.C.purple,lineW:.13,freq:6.5,speed:.47,warp:.26,k:8});
  c.restore();
  c.save(); c.translate(640,380);
  r.sunburst(c,150+460*fade,t,{n:26,c1:r.C.orange,c2:r.C.yellow,lit:.86+.14*s.lift});
  c.restore();
  const panel = round(84,176,1112,373,65);
  c.save(); c.globalAlpha = ease(t,.65,1.6);
  fill(c,panel,['#381650','#1b102f'],176,373,r.C.cream,5);
  mainDrawing(c,s,palette.acid);
  c.restore();
  const name = r.txt(title,62,{grad:[r.C.yellow,r.C.orange],line:r.C.ink,lw:7,outer:r.C.cream,ow:5,shadow:{dx:5,dy:5,col:r.C.blue}});
  r.wavy(c,name,640,100,{amp:4+16*(1-fade),ph:t*2.6,bulge:.18,melt:.7*(1-fade),alpha:fade});
  r.banner(c,640,627,464,66,ease(t,.5,1.55),r.C.cream);
  const label = r.txt(s.caption,33,{font:'Righteous',fill:r.C.ink});
  r.wavy(c,label,640,627,{amp:1.8,ph:t*3,alpha:ease(t,beats[s.index].at+.25,beats[s.index].at+.67)});
  r.finish(c,W,H,t);
}

function tech(c, s, r) {
  const t = s.t;
  r.background(c,W,H,t,Math.sin(t*.3)*65,1);
  r.card(c,98,174,1084,381,{r:32,a:ease(t,.4,1.5),flash:.35*Math.sin(Math.PI*ease(t,7.7,8.6))});
  c.save(); c.globalAlpha = ease(t,.7,1.8);
  mainDrawing(c,s,palette.tech);
  c.restore();
  for (let i=0;i<3;i++) {
    const x=550+i*130;
    const trace=[{x,y:514},{x:x+10,y:543},{x:x+10,y:579}];
    r.connector(c,trace,{draw:ease(t,3.6+i*.1,4.6+i*.1), pulses:[((t*1.25+i*.32)%1)]});
  }
  const titleProgress=ease(t,.1,1.44);
  const words=title.split(' ');
  const heading=words.slice(0,Math.ceil(titleProgress*words.length)).join(' ');
  if(heading) r.gtext(c,heading,640,117,66,{align:'center'});
  const captionAlpha=ease(t,beats[s.index].at,beats[s.index].at+.42);
  c.save(); c.globalAlpha=captionAlpha;
  r.gtext(c,s.caption,640,652,34,{align:'center'});
  c.restore();
  if(s.index===2) r.gtext(c,'3 / 3',1061,296,60,{align:'center',cols:['#b8fff6','#79a6ff']});
  r.bloom(c,.85);
}

function paper(c, s, r) {
  const t=s.t, q=Math.floor(t*12)/12;
  const cameraPush=ease(t,3,5)*(1-ease(t,11,13));
  const cam=r.makeCam(-4+cameraPush*3,-2,88-10*cameraPush,1.04,W,H,0,1030);
  const f=ease(q,.25,2.2);
  const printLock=(g,w,h)=>{
    g.save(); g.scale(w/W,h/H);
    // Keep the diagram readable from the camera side of the cardstock.
    g.translate(-153,-224); g.scale(1.28,1.28);
    diagram(g,s,palette.ink);
    g.restore();
  };
  const faces=[
    ...r.place(r.box({w:79,d:35,h:2.4,col:'#d9cbae',f,pr:{top:printLock}}),51,q,0,.05,1,0,1,.04),
    ...r.place(r.tent({w:66,h:7,a:ease(q,.55,2.0),pf:r.pTag(title,'#244c53',46)}),61,q,0,0,25,0,1,.04),
    ...r.place(r.tent({w:60,h:6,a:ease(q,beats[s.index].at,beats[s.index].at+.85),pf:r.pTag(s.caption,'#244c53',34)}),62,q,0,0,-24,0,1,.035),
  ];
  for(const [i,pin] of s.pinStates.entries()){
    const x = ((pin.x*1.28-153)/W - .5)*79;
    const z = 1 + (.5-(pin.split*1.28-224)/H)*35;
    if (f > .92) {
      const fold = ease(q,2.1+i*.15,2.8+i*.15);
      const aligned=Math.abs(pin.split-324)<.2;
      faces.push(...r.place(r.box({w:2.05,d:1.8,h:1.4,
        col:aligned?'#57ae89':'#e37b5c',f:fold}),77+i,q,x,2.46,z,0,1,.03));
    }
  }
  r.renderScene(c,W,H,cam,faces,q);
  if(s.turn > 0){
    c.save(); c.globalAlpha=s.turn;
    result(c,1080,440,s,palette.ink,.8);
    c.restore();
  }
}

const drawStyle = {
  'flat-vector-science': flat,
  'watercolor-wash': wash,
  'shadow-puppet-theatre': shadow,
  'whiteboard-explainer': whiteboard,
  'psychedelic-poster': psychedelic,
  'tech-glow-explainer': tech,
  'papercraft-models': paper,
};

export function createRenderer(style) {
  const render = drawStyle[style];
  const reference = makeReference[style]();
  return (canvas, t) => {
    const ctx = canvas.getContext('2d',{willReadFrequently:true});
    ctx.reset();
    render(ctx,state(t),reference);
  };
}
