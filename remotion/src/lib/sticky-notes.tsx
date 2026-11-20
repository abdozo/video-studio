import React from 'react';
import {cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {drawScene, type StickyScene} from '../../../templates/sticky-notes/scene.js';
export {parseStickyScene} from '../../../templates/sticky-notes/scene.js';
export type {StickyScene} from '../../../templates/sticky-notes/scene.js';

let fonts: Promise<unknown> | undefined;
const loadFonts = () => fonts ??= Promise.all([
  new FontFace('StickyArabic', `url(${staticFile('templates/sticky-notes/Arabic.ttf')})`, {weight:'700'}).load(),
  ...['Caveat','Gloria Hallelujah','Kalam','Permanent Marker','Rock Salt'].map(name =>
    new FontFace(name, `url(${staticFile(`templates/sticky-notes/${name.replaceAll(' ','')}.woff2`)})`, {weight:['Kalam','Caveat'].includes(name)?'700':'400'}).load()),
]).then(loaded => {loaded.forEach(font => (document.fonts as FontFaceSet & {add(font:FontFace):FontFaceSet}).add(font));});

/** The HTML player and Remotion use the same Canvas renderer and scene data. */
export const StickyNoteWall: React.FC<{scene:StickyScene}> = ({scene}) => {
  const frame=useCurrentFrame();
  const {width,height,fps}=useVideoConfig();
  return <canvas width={width} height={height} style={{width:'100%',height:'100%'}} ref={canvas => {
    if(!canvas)return;
    const handle=delayRender('Loading Sticky-Note Wall fonts');
    loadFonts().then(() => {
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      if(!ctx)throw new Error('Canvas 2D unavailable');
      ctx.save();ctx.scale(width/1280,height/720);drawScene(ctx,1280,720,frame/fps,scene);ctx.restore();
      continueRender(handle);
    }).catch(error => cancelRender(error));
  }} />;
};
