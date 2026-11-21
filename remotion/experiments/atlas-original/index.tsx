import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame, useDelayRender} from 'remotion';
import fonts from './fonts.json';
import {references} from './reference.generated';

const W = 1280;
const H = 720;
const styles = Object.keys(references);
let fontPromise: Promise<void> | undefined;
let fontsReady = false;
function preloadFonts() {
  fontPromise ??= Promise.all(fonts.map(async ([family,file,weight,style]) => {
    const face = new FontFace(family,`url("${staticFile(`fonts/${file}`)}")`,{weight,style});
    await face.load();
    (document.fonts as FontFaceSet & Set<FontFace>).add(face);
  })).then(() => { fontsReady = true; });
  return fontPromise;
}

const fps = 30;
function Preview({style}: {style:string}) {
  const time = useCurrentFrame() / fps;
  const canvas = useRef<HTMLCanvasElement>(null);
  const {delayRender,continueRender,cancelRender} = useDelayRender();
  const draw = useMemo(() => {
    const reference = references[style]();
    return (target: HTMLCanvasElement, t: number) => {
      const ctx = target.getContext('2d',{willReadFrequently:true});
      if (!ctx) throw new Error('Canvas drawing context unavailable');
      ctx.reset();
      reference.explainer(ctx,W,H,t);
    };
  },[style]);

  useLayoutEffect(() => {
    let live = true;
    if (fontsReady) {
      if (canvas.current) draw(canvas.current,time);
      return;
    }
    const handle = delayRender('Loading Atlas typefaces before painting');
    preloadFonts().then(() => {
      try {
        if (live && canvas.current) draw(canvas.current,time);
        continueRender(handle);
      } catch (error) {
        cancelRender(error instanceof Error ? error : String(error));
      }
    }).catch(cancelRender);
    return () => { live = false; };
  },[draw,time,delayRender,continueRender,cancelRender]);

  return <AbsoluteFill>
    <canvas ref={canvas} width={W} height={H} style={{width:'100%',height:'100%'}}
      aria-label="How does AI learn?"/>
  </AbsoluteFill>;
}

registerRoot(() => <>
  {styles.map(style => <Composition key={style} id={style} component={Preview} defaultProps={{style}}
    width={1920} height={1080} fps={fps} durationInFrames={references[style]().explainerDuration*fps}/>)}
</>);
