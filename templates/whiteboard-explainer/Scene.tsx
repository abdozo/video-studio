import {useLayoutEffect, useRef, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {createReference} from './futurepedia-reference.js';

const width = 1280;
const height = 720;
let fontLoad: Promise<void> | undefined;

function loadFonts() {
  fontLoad ??= Promise.all([
    new FontFace('Permanent Marker', `url(${staticFile('templates/sticky-notes/PermanentMarker.woff2')})`, {weight:'400'}).load(),
    new FontFace('Kalam', `url(${staticFile('templates/sticky-notes/Kalam.woff2')})`, {weight:'700'}).load(),
  ]).then(faces => {
    for (const face of faces) (document.fonts as FontFaceSet & Set<FontFace>).add(face);
  });
  return fontLoad;
}

export function AtlasScene() {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const [handle] = useState(() => delayRender('Loading the original Whiteboard fonts'));
  const [reference] = useState(createReference);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ready = useRef(false);
  const requestedTime = useRef(0);
  requestedTime.current = Math.min(reference.duration, reference.duration * frame / Math.max(1,durationInFrames-1));

  function draw() {
    const ctx = canvas.current?.getContext('2d',{willReadFrequently:true});
    if (!ctx) return;
    ctx.reset();
    reference.draw(ctx,width,height,requestedTime.current);
  }

  useLayoutEffect(() => {
    let mounted = true;
    loadFonts().then(() => {
      if (!mounted) return;
      ready.current = true;
      draw();
      continueRender(handle);
    }).catch(cancelRender);
    return () => { mounted = false; };
  },[handle,reference]);

  // Remotion owns the clock. Draw just the requested frame before capture.
  useLayoutEffect(() => {
    if (ready.current) draw();
  },[frame,reference]);

  return <AbsoluteFill style={{backgroundColor:'#f6f8f7'}}>
    <canvas ref={canvas} width={width} height={height} style={{width:'100%',height:'100%'}}
      aria-label="How does AI learn? Original Whiteboard Explainer calibration"/>
  </AbsoluteFill>;
}
