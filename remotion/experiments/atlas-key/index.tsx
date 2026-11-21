import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame, useDelayRender} from 'remotion';
import {createRenderer, duration, H, styles, W} from './scenes';

const fonts = [
  ['Fredoka','1.woff2','700','normal'],
  ['IM Fell English','2.woff2','400','normal'],
  ['IM Fell English','3.woff2','400','italic'],
  ['Nunito','4.woff2','900','normal'],
  ['Righteous','5.woff2','400','normal'],
  ['Shrikhand','6.woff2','400','normal'],
  ['Space Grotesk','7.woff2','700','normal'],
  ['Space Mono','8.woff2','400','normal'],
  ['Caveat','Caveat.woff2','700','normal'],
  ['Kalam','Kalam.woff2','700','normal'],
  ['Permanent Marker','PermanentMarker.woff2','400','normal'],
] as const;

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
  const draw = useMemo(() => createRenderer(style),[style]);

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
      aria-label="How does a key open a lock?"/>
  </AbsoluteFill>;
}

registerRoot(() => <>
  {styles.map(style => <Composition key={style} id={style} component={Preview} defaultProps={{style}}
    width={1920} height={1080} fps={fps} durationInFrames={duration*fps}/>)}
</>);
