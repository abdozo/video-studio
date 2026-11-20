import {openBrowser} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';
if(!process.argv[2])throw Error('Usage: node scripts/inspect-character-pack.mjs <folder with Lottie JSON files>');
const dir=path.resolve(process.argv[2]);
const browser=await openBrowser('chrome');
const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
await page.evaluate((code)=>{const s=document.createElement('script');s.textContent=code;document.head.appendChild(s);},fs.readFileSync('node_modules/lottie-web/build/player/lottie_svg.js','utf8'));
const info={};
for(const name of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))){
 const d=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'),(key,value)=>key==='x'&&typeof value==='string'?undefined:value);
 if(!d.layers || !d.fr || !d.w || !d.op) continue;
 const result=await page.evaluate(async(data)=>{
  document.body.innerHTML='<div id="anim" style="width:1000px;height:1000px"></div>';
  const a=window.lottie.loadAnimation({container:document.getElementById('anim'),renderer:'svg',loop:false,autoplay:false,animationData:data});
  await new Promise(resolve=>a.addEventListener('DOMLoaded',resolve));
  a.goToAndStop(1,true);a.goToAndStop(0,true);
  const svg=document.querySelector('svg');
  const b=svg.getBBox();
  const layers=a.renderer.elements.map((el,i)=>({name:data.layers[i]?.nm,index:data.layers[i]?.ind,svg:el?.layerElement?.outerHTML??null}));
  a.destroy();return {bounds:{x:b.x,y:b.y,w:b.width,h:b.height},layers};
 },d);
 info[name]=result.bounds;
 if(name==='POINTING.json')fs.writeFileSync(path.join(dir,'pointing-layers.json'),JSON.stringify(result,null,2));
 console.log(name,result.bounds);
}
fs.writeFileSync(path.join(dir,'bounds.json'),JSON.stringify(info,null,2));
await browser.close({silent:true});
