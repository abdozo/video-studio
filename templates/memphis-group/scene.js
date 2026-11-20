import {H,kit} from './kit.js';
const {K,PAL,solid,bubble,burst,roundRect,tag,chunky,fatArrow,sceneGround,strokeOutlined,squigglePath,zigzagPath}=kit;
const clamp=H.clamp;
function drawItem(c,e,t){
 if(t<e.at||t>=(e.until??Infinity))return;
 const q=Math.floor(t*15)/15;
 // Entrances use the exact word clock; only the held cut-outs bob on twos.
 const p=clamp((t-e.at)/.22),s=H.ease.back(p);
 if(s<=0)return;
 let x=e.x,y=e.y;
 if(e.moveAt!=null){const m=H.ease.inOut(clamp((t-e.moveAt)/.65));x=H.lerp(x,e.toX,m);y=H.lerp(y,e.toY,m)-Math.sin(m*Math.PI)*75;}
 c.save();c.translate(x,y+(p===1?Math.sin(q*2.4+e.x)*3:0));c.scale(s*(1+.08*Math.sin(p*Math.PI)),s*(1-.06*Math.sin(p*Math.PI)));c.rotate(e.kind==='letter'?.035*Math.sin(q*2):e.kind==='bubble'?-.022:0);
 const col=PAL[e.color]||e.color;
 c.textAlign='center';c.textBaseline='middle';c.font=`600 ${e.size}px Fredoka`;
 if(e.kind==='tag'){tag(c,e.text,0,0,col,e.size,0);}
 else if(e.kind==='bubble'){solid(c,bubble(e.w,e.h,[-e.w*.32,e.h*.5+40]),col,13,6);c.fillStyle=K;c.fillText(e.text,0,0);}
 else if(['letter','burst','count'].includes(e.kind)){
  if(e.kind==='count'){c.rotate(q*.12);solid(c,burst(12,95,112),col,8,5);c.rotate(-q*.12);chunky(c,e.text,0,4,e.size,PAL.magenta,-4);}
  else {c.save();if(e.kind==='burst')c.rotate(q*.5);solid(c,e.kind==='letter'?roundRect(-Math.max(e.size*1.32,e.text.length*e.size*.95)/2,-e.size*.72,Math.max(e.size*1.32,e.text.length*e.size*.95),e.size*1.44,22):burst(12,75,100),col,9,5);c.restore();chunky(c,e.text,0,3,e.size,e.kind==='letter'?PAL.cream:PAL.yellow,-5);}
 }
 else if(e.kind==='arrow'){c.restore();fatArrow(c,e.x,e.y,e.toX,e.toY,H.ease.out(p),col,25);return;}
 else if(e.kind==='check'){solid(c,burst(10,48,67),col,7,5);c.strokeStyle=PAL.cream;c.lineWidth=12;c.lineCap='round';c.beginPath();c.moveTo(-26,0);c.lineTo(-8,20);c.lineTo(30,-24);c.stroke();}
 else if(e.kind==='clock'){
  const a=new Path2D();a.arc(0,0,55,0,7);solid(c,a,col,8,5);c.strokeStyle=K;c.lineWidth=6;c.lineCap='round';c.beginPath();c.moveTo(0,0);c.lineTo(Math.sin(q*.8)*32,-Math.cos(q*.8)*32);c.moveTo(0,0);c.lineTo(-24,-10);c.stroke();
 }
 else if(e.kind==='calendar'){
  solid(c,roundRect(-130,-115,260,245,16),PAL.cream,12,5);solid(c,roundRect(-130,-115,260,58,12),PAL.magenta,0,5);
  c.strokeStyle=K;c.lineWidth=7;for(const xx of [-75,75]){c.beginPath();c.moveTo(xx,-137);c.lineTo(xx,-90);c.stroke();}
  for(let i=0;i<7;i++){c.fillStyle=i<=Math.floor(q*1.4)%7?PAL.teal:PAL.lilac;c.fillRect(-95+(i%4)*55,-25+Math.floor(i/4)*55,36,34);}
  c.fillStyle=K;c.font='600 32px Fredoka';c.fillText(e.text,0,103);
 }
 else if(e.kind==='tv'){
  solid(c,roundRect(-80,-65,160,130,18),col,8,5);solid(c,roundRect(-62,-48,110,90,15),PAL.blue,0,4);c.fillStyle=PAL.yellow;c.beginPath();c.moveTo(-24,-28);c.lineTo(14,0);c.lineTo(-24,28);c.fill();c.strokeStyle=K;c.lineWidth=5;c.beginPath();c.moveTo(-25,-65);c.lineTo(-50,-95);c.moveTo(15,-65);c.lineTo(40,-95);c.stroke();
 }
 else if(e.kind==='tennis'){
  c.rotate(-.4);c.lineWidth=6;c.strokeStyle=K;c.beginPath();c.moveTo(0,30);c.lineTo(0,100);c.stroke();const a=new Path2D();a.ellipse(0,-15,42,58,0,0,7);solid(c,a,PAL.cream,6,4);c.save();c.clip(a);c.strokeStyle=PAL.blue;c.lineWidth=2;for(let k=-3;k<4;k++){c.beginPath();c.moveTo(k*14,-80);c.lineTo(k*14,50);c.moveTo(-50,k*18);c.lineTo(50,k*18);c.stroke();}c.restore();c.fillStyle=PAL.yellow;c.strokeStyle=K;c.lineWidth=3;c.beginPath();c.arc(80,Math.sin(q*5)*30,24,0,7);c.fill();c.stroke();
 }
 else if(e.kind==='confetti'){
  const r=H.rng(81),u=clamp((t-e.at)/.8);
  for(let i=0;i<35;i++){const a=r.range(0,7),d=r.range(280,590)*H.ease.out(u);c.save();c.translate(Math.cos(a)*d,Math.sin(a)*d);c.rotate(q*r.range(-2,2));c.fillStyle=r.pick([PAL.blue,PAL.magenta,PAL.teal,PAL.yellow]);c.fillRect(-9,-5,18,10);c.restore();}
 }
 c.restore();
}
export function drawScene(c,W,HH,t,data){
 c.save();c.clearRect(0,0,W,HH);let i=data.scenes.findLastIndex(s=>t>=s.start);i=Math.max(0,i);
 const grounds=[[PAL.pink,PAL.mint],[PAL.butter,PAL.lilac],[PAL.mint,PAL.pink],[PAL.pink,PAL.butter],[PAL.lilac,PAL.mint],[PAL.butter,PAL.pink],[PAL.mint,PAL.lilac]];
 c.drawImage(sceneGround(i%4+1,grounds[i],W,HH),0,0);
 const q=Math.floor(t*15)/15;
 strokeOutlined(c,squigglePath(50,70,160,12,3,-.1,q*2),PAL.blue,10,3,5);
 strokeOutlined(c,zigzagPath(1000,665,210,10,8,-.05),PAL.magenta,9,3,5);
 for(const e of data.elements)if(e.scene===i)drawItem(c,e,t);
 for(const idx of [1,3,4,5]){
  const start=data.scenes[idx].start-.35,u=(t-start)/.7;if(u<=0||u>=1)continue;
  const x=H.lerp(-2300,W+900,u);c.save();c.translate(x,HH/2);c.rotate(-.35);const path=new Path2D();path.rect(0,-1400,1700,2800);solid(c,path,PAL.yellow,14,6);c.save();c.clip(path);
  const cols=[PAL.magenta,PAL.yellow,PAL.blue,PAL.mint,PAL.red];for(let k=0;k<20;k++){c.fillStyle=cols[k%5];c.fillRect(k*85,-1400,86,2800);c.fillStyle=K;for(let yy=-1400;yy<1400;yy+=40){c.beginPath();c.arc(k*85+42,yy+(k%2)*20,5,0,7);c.fill();}}c.restore();c.restore();
 }
 H.grain(c,W,HH,.05,6+Math.floor(t*12),true);c.restore();
}
export function scoreSound(k,data){
 for(const e of data.events){
  const t=e.at_s,opts={gain:e.gain,minor:e.minor,pan:0};
  if(e.kind==='boing'){
   k.tone(t,{f:[[0,140],[.04,330],[.26,180]],type:'triangle',dur:.29,gain:.12*e.gain,a:.003,minor:e.minor});k.play('pop',t,{...opts,f:460});
  }else k.play(e.kind,t,opts);
 }
}
