import {H, kit} from './kit.js';
const INK='#1b1f29',RED='#c3202a';
const papers=new Map();
const progress=(t,at,d=.4)=>H.clamp((t-at)/d);
export function cameraAt(keys,t){
  if(!keys.length)return [1600,800,.4];
  if(t<=keys[0].at)return [keys[0].x,keys[0].y,keys[0].zoom];
  const a=keys.findLast(k=>k.at<=t),b=keys.find(k=>k.at>t);
  if(!b)return[a.x,a.y,a.zoom];
  const u=H.ease.inOut((t-a.at)/(b.at-a.at));
  return[H.lerp(a.x,b.x,u),H.lerp(a.y,b.y,u),Math.exp(H.lerp(Math.log(a.zoom),Math.log(b.zoom),u))];
}
export function markerText(c,s,x,y,size=54,color=INK,p=1,direction='rtl'){
  if(p<=0)return;
  if(direction==='ltr'){c.save();c.font=`700 ${size}px Kalam`;const w=c.measureText(s).width+20;kit.wr(c,p,x-w/2,y-size*.8,w,size*1.6,()=>kit.hand(c,[s],x,y,`700 ${size}px Kalam`,color,37,size));c.restore();return;}
  c.save();c.font=`700 ${size}px StickyArabic`;c.textAlign='center';c.textBaseline='middle';c.direction='rtl';
  const w=c.measureText(s).width+20;c.beginPath();c.rect(x+w/2-w*H.clamp(p),y-size*.8,w*H.clamp(p),size*1.6);c.clip();
  c.fillStyle=color;c.globalAlpha=.27;c.fillText(s,x+.7,y+.5);c.globalAlpha=.96;c.fillText(s,x,y);c.restore();
}
export function doodle(c,kind,x=0,y=0,p=1){
  if(p<=0)return;c.save();c.globalAlpha=H.clamp(p);c.translate(x,y);const r=H.rng(81),line=pts=>kit.mline(c,pts,4,INK,r);
  if(kind==='person'){kit.mline(c,kit.arcPts(0,-45,21,24,0,Math.PI*2,26),4,INK,r,true);line([[0,-20],[0,45],[-30,85]]);line([[0,45],[30,85]]);line([[-43,6],[0,-1],[43,6]]);}
  if(kind==='book'){line([[-65,28],[-65,-40],[-8,-32],[0,-24],[8,-32],[65,-40],[65,28],[8,34],[0,42],[-8,34],[-65,28]]);line([[0,-24],[0,42]]);}
  if(kind==='question')markerText(c,'؟',0,0,110,'#1f3c8f');
  if(kind==='cross'){kit.mline(c,[[-65,-40],[65,40]],6,RED,r);kit.mline(c,[[-65,40],[65,-40]],6,RED,r);}
  c.restore();
}
export function ring(c,x,y,rx,ry,p=1){if(p>0)kit.mline(c,kit.arcPts(x,y,rx,ry,-.3,-.3+Math.PI*2*1.05*H.clamp(p),60),5,RED,H.rng(64));}
export function drawScene(c,W,HH,t,data){
  const [cx,cy,z]=cameraAt(data.camera,t),direction=data.direction||'rtl';
  c.save();c.clearRect(0,0,W,HH);c.fillStyle='#9a6a3c';c.fillRect(0,0,W,HH);c.translate(W/2,HH/2);c.scale(z,z);c.translate(-cx,-cy);c.drawImage(kit.bigCork(),0,0);
  for(const n of data.notes){
    if(t<n.at||Math.abs(n.x-cx)>W/(2*z)+n.w*.8+100||Math.abs(n.y-cy)>HH/(2*z)+n.h*.8+100)continue;
    const u=progress(t,n.at,.3),s=1+.32*(1-H.ease.back(u));c.save();c.translate(n.x,n.y);c.scale(s,s);c.rotate(n.rotation||0);
    const opts={x:0,y:0,w:n.w,h:n.h,col:n.color||'#fbe36a',rot:0,lift:n.lift??.8,seed:n.seed??31};
    if(u<1)kit.note(c,{...opts,air:Math.max(0,s-1)},kit.grainPattern(c,3));
    else{
      const key=JSON.stringify(opts);let layer=papers.get(key);
      if(!layer){layer=H.layer(n.w+200,n.h+200);const lc=layer.getContext('2d');kit.note(lc,{...opts,x:layer.width/2,y:layer.height/2},kit.grainPattern(lc,3));papers.set(key,layer);}
      c.drawImage(layer,-layer.width/2,-layer.height/2);
    }
    if(n.kind==='index'){c.save();c.globalAlpha=.28;c.strokeStyle='#508cd2';c.lineWidth=1;for(let y=-n.h/2+65;y<n.h/2;y+=26){c.beginPath();c.moveTo(-n.w/2,y);c.lineTo(n.w/2,y);c.stroke();}c.restore();}
    for(const line of n.lines||[])markerText(c,line.text,line.x||0,line.y||0,line.size||54,line.color||INK,progress(t,line.at??n.at,line.duration??.35),direction);
    for(const d of n.doodles||[])doodle(c,d.kind,d.x||0,d.y||0,progress(t,d.at??n.at));
    for(const r of n.rings||[])ring(c,r.x||0,r.y||0,r.rx,r.ry,progress(t,r.at));
    c.restore();
    if(n.taped){kit.tape(c,n.x-n.w*.38,n.y-n.h/2+5,110,32,-.15,5);kit.tape(c,n.x+n.w*.38,n.y-n.h/2+5,110,32,.1,6);}
    if(n.pin!==false&&t>=n.at+.14){kit.pinShadow(c,n.x,n.y-n.h/2+18);kit.pinHead(c,n.x,n.y-n.h/2+18,n.pinColor||RED);}
  }
  for(const l of data.links||[]){const p=progress(t,l.at,l.duration??.7);if(l.kind==='arrow')kit.arrowM(c,l.points,p,l.color||RED,l.width||5,H.rng(l.seed||20));else kit.yarn(c,l.from,l.to,l.sag??35,p,H.rng(l.seed||20));}
  c.restore();
  const g=c.createRadialGradient(330,120,50,400,200,1100);g.addColorStop(0,'rgba(255,240,210,0.18)');g.addColorStop(.5,'rgba(255,240,210,0)');g.addColorStop(1,'rgba(40,20,0,0.3)');c.fillStyle=g;c.fillRect(0,0,W,HH);H.vignette(c,W,HH,.35,'30,15,0');H.grain(c,W,HH,.04,8+Math.floor(t*12));
}
export function soundEvents(data){return data.sfx||data.notes.filter(n=>n.at>=0).map(n=>({at:n.at+.11,kind:'slap'}));}
export function scoreSound(k,data){for(const e of soundEvents(data)){const t=Math.round(e.at*48000+.25)/48000,d=e.duration||.2;if(e.kind==='slap')k.play('slap',t,{gain:.35,minor:true});else if(e.kind==='marker')k.play('stroke',t,{material:'marker',dur:d,gain:.27,minor:true});else if(e.kind==='tape')k.play('tape',t,{dur:d,gain:.25,minor:true});else if(e.kind==='pin')k.noise(t,{dur:.035,filter:'bandpass',f:1300,q:1.6,gain:.12,minor:true});else k.noise(t,{dur:d,color:'pink',filter:'bandpass',f:650,q:.8,gain:.04,a:d*.35,minor:true});}}

export function parseStickyScene(data){
  if(!data||!['rtl','ltr'].includes(data.direction)||!(data.duration>0)||!Array.isArray(data.camera)||!data.camera.length||!Array.isArray(data.notes)||!data.notes.length)throw Error('Invalid Sticky Notes scene');
  let previous=-Infinity;const ids=new Set();
  for(const k of data.camera){if(!Number.isFinite(k.at)||k.at<=previous||!(k.zoom>0)||!Number.isFinite(k.x)||!Number.isFinite(k.y))throw Error('Invalid camera key');previous=k.at;}
  for(const n of data.notes){if(typeof n.id!=='string'||ids.has(n.id)||!(n.w>0)||!(n.h>0)||!Number.isFinite(n.at)||!Number.isFinite(n.x)||!Number.isFinite(n.y))throw Error('Invalid note');ids.add(n.id);}
  for(const l of data.links||[]){const points=l.kind==='arrow'?l.points:[l.from,l.to];if(!Array.isArray(points)||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v))))throw Error('Invalid link geometry');}
  return data;
}
