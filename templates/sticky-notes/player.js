const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true}),audio=document.querySelector('audio');
const scrub=document.querySelector('#scrub'),clock=document.querySelector('#time');scrub.max=DURATION;
let running=false,muted=false,stopSound=null,base=0,started=0;
const hasAudio=()=>!!audio.getAttribute('src');
const current=()=>hasAudio()?audio.currentTime:base+(running?(performance.now()-started)/1000:0);
function stopFX(){if(stopSound){stopSound();stopSound=null;}}
function startFX(){stopFX();if(!muted)stopSound=SOUND.live(window.scoreSound,current(),{voiceover:true,master:.52});}
function draw(t){explainer(ctx,1280,720,t);scrub.value=t;clock.textContent=t.toFixed(1)+' / '+DURATION.toFixed(1);}
window.seek=t=>{t=Math.max(0,Math.min(DURATION,t));base=t;started=performance.now();if(hasAudio())audio.currentTime=t;draw(t);};
document.querySelector('#play').onclick=async()=>{if(running){base=current();audio.pause();running=false;stopFX();}else{started=performance.now();if(hasAudio())await audio.play();running=true;startFX();}};
scrub.oninput=()=>{stopFX();seek(+scrub.value);if(running)startFX();};
document.querySelector('#sound').onclick=()=>{muted=!muted;audio.muted=muted;stopFX();if(running)startFX();};
function load(file){if(!file)return;audio.pause();stopFX();running=false;audio.src=URL.createObjectURL(file);audio.load();seek(0);}
document.querySelector('#load').onchange=e=>load(e.target.files[0]);document.body.ondragover=e=>e.preventDefault();document.body.ondrop=e=>{e.preventDefault();load(e.dataTransfer.files[0]);};
function end(){stopFX();audio.pause();running=false;if(document.querySelector('#loop').checked){seek(0);started=performance.now();running=true;if(hasAudio())audio.play();startFX();}else draw(DURATION);}
audio.onended=end;
function tick(){if(running){const t=current();if(t>=DURATION)end();else draw(t);}requestAnimationFrame(tick);}
window.ready=(async()=>{await Promise.all([...document.fonts].map(f=>f.load()));draw(0);tick();})();
