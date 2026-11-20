// Render the shared HTML player's frames or procedural foley without external services.
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const arg=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};
const input=arg('--html'),output=arg('--out');
if(!input||!output)throw Error('Usage: node tools/render_sticky_notes.mjs --html player.html --out file.png|effects.wav|video.mp4 [--qa|--effects]');
const require=createRequire(new URL('../remotion/package.json',import.meta.url));
const {openBrowser}=require('@remotion/renderer');
const browser=await openBrowser('chrome');
try{
 const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
 await page.setViewport({width:1280,height:800,deviceScaleFactor:1});
 await page.goto({url:pathToFileURL(resolve(input)).href,timeout:30000});
 await page.evaluate(async()=>{await window.ready;});
 if(process.argv.includes('--qa')){
  const r=await page.evaluate(()=>{const canvas=document.querySelector('canvas'),c=canvas.getContext('2d');const sample=t=>{explainer(c,1280,720,t);return canvas.toDataURL();};const a=sample(1);sample(DURATION-.1);const deterministic=a===sample(1);const times=[0,...SCENE.beats.map(b=>b.frameAt??b.start),DURATION-.1];const sheet=document.createElement('canvas');sheet.width=1280;sheet.height=Math.ceil(times.length/2)*380;const x=sheet.getContext('2d');times.forEach((t,i)=>{sample(t);x.drawImage(canvas,i%2*640,Math.floor(i/2)*380,640,360);});return {image:sheet.toDataURL().split(',')[1],deterministic};});
  if(!r.deterministic)throw Error('Non-deterministic scene');writeFileSync(output,Buffer.from(r.image,'base64'));console.log('Deterministic QA saved:',output);
 }else if(process.argv.includes('--effects')){
  const bytes=await page.evaluate(async()=>{const {inter}=await SOUND.renderOffline(window.scoreSound,DURATION,48000,{voiceover:true,master:.52});const pcm=new Int16Array(inter.length);for(let i=0;i<pcm.length;i++)pcm[i]=Math.max(-32768,Math.min(32767,Math.round(inter[i]*32767)));let str='';const u=new Uint8Array(pcm.buffer);for(let i=0;i<u.length;i+=16384)str+=String.fromCharCode(...u.subarray(i,i+16384));return btoa(str);});
  const pcm=Buffer.from(bytes,'base64'),h=Buffer.alloc(44);h.write('RIFF');h.writeUInt32LE(36+pcm.length,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(2,22);h.writeUInt32LE(48000,24);h.writeUInt32LE(192000,28);h.writeUInt16LE(4,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(pcm.length,40);writeFileSync(output,Buffer.concat([h,pcm]));
 }else{
  const frames=await page.evaluate(()=>Math.ceil(DURATION*30));
  const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-vcodec','mjpeg','-r','30','-i','-','-an','-c:v','libx264','-crf','19','-pix_fmt','yuv420p',output],{stdio:['pipe','inherit','inherit']});
  for(let i=0;i<frames;i++){const data=await page.evaluate(t=>{const canvas=document.querySelector('canvas');explainer(canvas.getContext('2d'),1280,720,t);return canvas.toDataURL('image/jpeg',.95).split(',')[1];},i/30);if(!ff.stdin.write(Buffer.from(data,'base64')))await once(ff.stdin,'drain');}
  ff.stdin.end();const [code]=await once(ff,'close');if(code!==0)throw Error('FFmpeg failed: '+code);
 }
}finally{await browser.close({silent:true});}
