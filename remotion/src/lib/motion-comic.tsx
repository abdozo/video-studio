import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VoLine} from './shorts';

type Point = readonly [x: number, y: number];
type Region = readonly Point[];
type ComicLanguage = 'ar' | 'en';

export type ComicCue = number | {line: string; offset?: number};
export type ComicDialogue = VoLine & {id: string; speaker: string; audio?: string};

type ComicBalloon = {
  at: ComicCue;
  until?: ComicCue;
  text: string;
  /** Position, size, and type size are percentages of the page. */
  box: {x: number; y: number; width: number; height: number};
  fontSize: number;
  tailX?: number;
  tailUp?: boolean;
  caption?: boolean;
};

export type ComicRigbyLayer = {
  /** Numbered, zero-based PNGs, e.g. `flag_000.png` for prefix `flag_`. */
  prefix: string;
  frameCount: number;
  fps: number;
  digits?: number;
  at?: ComicCue;
  loop?: boolean;
};

export type ComicSceneBox = {x: number; y: number; width: number; height: number};

type ComicSceneMotion = {
  x?: number;
  y?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
};

export type ComicSceneLayer = ComicSceneBox & {
  /** Still or numbered take placed in the same space as the background. */
  art: string | ComicRigbyLayer;
  clipPath?: string;
  filter?: React.CSSProperties['filter'];
  /** Rotation and scale pivot in background pixels. Defaults to the center of the layer. */
  pivot?: Point;
  /** Layer motion evaluated in seconds since the panel reveal. */
  motion?: (time: number) => ComicSceneMotion;
};

type ComicScene = {
  /** Dimensions of the base artwork. All coordinates are in its pixel space. */
  width: number;
  height: number;
  viewport?: ComicSceneBox;
  /** Images arranged from back to front. */
  layers: readonly ComicSceneLayer[];
};

export type ComicPanel = {
  at: ComicCue;
  /** Independent art fills this panel. Otherwise use the shared page art. */
  art?: string;
  /** Position the artwork within its panel before applying camera motion. */
  artPosition?: string;
  artFit?: 'cover' | 'contain';
  /** Frame the base art and registered transparent layers as one scene. */
  scene?: ComicScene;
  /** Reveal the artwork inside its fixed crop. */
  reveal?: 'cut' | 'wipe' | 'fade';
  outline?: boolean;
  inkBorder?: boolean;
  /** Fixed polygon vertices as percentages of the page. Omit for equal-width panels. */
  crop?: Region;
  bubble?: {at: ComicCue; region: Region; origin: Point; cleanArt: string};
  balloons?: readonly ComicBalloon[];
  camera?: {at?: ComicCue; duration: number; zoom: number; startZoom?: number;
    focus?: {x: number; y: number}; endFocus?: {x: number; y: number}};
  /** A page-aligned cutout, or a crop of the panel's own artwork when art is omitted. */
  motion?: {art?: string; region: Region; x?: number; y?: number; period?: number};
  /** Transparent Rigby2D passes registered to the base artwork, back to front. */
  rigby?: readonly ComicRigbyLayer[];
};

export type MotionComicPage = {
  art?: string;
  at?: number;
  aspectRatio?: number;
  /** Draw the layout's ink frames before the artwork is revealed. */
  showPanelFrames?: boolean;
  panels: readonly ComicPanel[];
};

const PAPER = '#f5ebd6';
const EASE = Easing.bezier(.22, .78, .28, 1);
const POP = Easing.bezier(.22, 1.25, .42, 1);
const clip = (points: Region) => `polygon(${points.map(([x, y]) => `${x}% ${y}%`).join(', ')})`;

function cueTime(cue: ComicCue, dialogue: readonly ComicDialogue[]) {
  if (typeof cue === 'number') return cue;
  const line = dialogue.find(({id}) => id === cue.line);
  if (!line) throw new Error(`Unknown comic dialogue cue: ${cue.line}`);
  return (line.words?.[0]?.start ?? line.start) + (cue.offset ?? 0);
}

function enter(time: number, at: number, duration: number, easing = EASE) {
  return interpolate(time, [at, at + duration], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing,
  });
}

const PageArt: React.FC<{src: string; style?: React.CSSProperties}> = ({src, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', ...style}} />
);

const SceneArt: React.FC<{
  art: string;
  scene: ComicScene;
  width: number;
  height: number;
  frame: number;
  fps: number;
  at: number;
  visibleAt: number;
  dialogue: readonly ComicDialogue[];
  cameraStyle: React.CSSProperties;
}> = ({art, scene, width, height, frame, fps, at, visibleAt, dialogue, cameraStyle}) => {
  const view = scene.viewport ?? {x: 0, y: 0, width: scene.width, height: scene.height};
  const scale = Math.max(width / view.width, height / view.height);
  const time = frame / fps - at;

  return <AbsoluteFill style={cameraStyle}>
    <div style={{
      position: 'absolute',
      left: (width - view.width * scale) / 2 - view.x * scale,
      top: (height - view.height * scale) / 2 - view.y * scale,
      width: scene.width * scale,
      height: scene.height * scale,
    }}>
      <PageArt src={art} />
      {scene.layers.map((layer, index) => {
        const move = layer.motion?.(time);
        const pivot = layer.pivot;
        const src = typeof layer.art === 'string' ? layer.art : rigbyFrame(layer.art, frame, fps, visibleAt, dialogue);
        return <PageArt key={index} src={src} style={{
          inset: 'auto',
          left: layer.x * scale,
          top: layer.y * scale,
          width: layer.width * scale,
          height: layer.height * scale,
          clipPath: layer.clipPath,
          filter: layer.filter,
          transformOrigin: pivot ? `${(pivot[0] - layer.x) * scale}px ${(pivot[1] - layer.y) * scale}px` : undefined,
          transform: move
            ? `translate(${(move.x ?? 0) * scale}px, ${(move.y ?? 0) * scale}px) rotate(${move.rotate ?? 0}deg) scale(${move.scaleX ?? 1}, ${move.scaleY ?? 1})`
            : undefined,
          opacity: move?.opacity,
        }} />;
      })}
    </div>
  </AbsoluteFill>;
};

function rigbyFrame(layer: ComicRigbyLayer, frame: number, fps: number, visibleAt: number, dialogue: readonly ComicDialogue[]) {
  if (!Number.isSafeInteger(layer.frameCount) || layer.frameCount < 1 || !Number.isFinite(layer.fps) || layer.fps <= 0) {
    throw new Error(`Invalid Rigby2D frame count or FPS for ${layer.prefix}`);
  }
  const at = Math.max(visibleAt, layer.at === undefined ? visibleAt : cueTime(layer.at, dialogue));
  // Start on the first composition frame at or after the cue.
  const start = Math.floor(at * fps);
  const startFrame = start / fps < at ? start + 1 : start;
  const elapsed = Math.max(0, frame - startFrame);
  const sample = Math.floor(elapsed * layer.fps / fps);
  const index = layer.loop ? sample % layer.frameCount : Math.min(sample, layer.frameCount - 1);
  const digits = layer.digits ?? Math.max(3, String(layer.frameCount - 1).length);
  return `${layer.prefix}${String(index).padStart(digits, '0')}.png`;
}

const Balloon: React.FC<{
  balloon: ComicBalloon;
  time: number;
  at: number;
  pageWidth: number;
  language: ComicLanguage;
}> = ({balloon, time, at, pageWidth, language}) => {
  if (time < at) return null;
  const pop = enter(time, at, .32, POP);
  const {x, y, width, height} = balloon.box;
  const tail = balloon.tailX ?? 62;
  const caption = balloon.caption;
  const tailUp = balloon.tailUp && !caption;
  return <div style={{
    position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%`,
    opacity: enter(time, at, caption ? .35 : .12), transform: caption ? undefined : `scale(${.65 + .35 * pop})`,
    transformOrigin: `${tail}% ${tailUp ? 10 : 90}%`,
  }}>
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{display: 'block', transform: tailUp ? 'scaleY(-1)' : undefined}}>
      <path d={caption ? 'M 1 1 H 99 V 99 H 1 Z' : `M 50 1 C 82 1 99 13 99 43 C 99 67 88 83 76 85 H ${tail + 4} L ${tail - 4} 99 L ${tail - 1} 86 H 25 C 10 85 1 68 1 43 C 1 13 18 1 50 1 Z`}
        fill="#fff0cc" stroke="#241913" strokeWidth={2.3} vectorEffect="non-scaling-stroke" />
    </svg>
    <div lang={language} dir={language === 'ar' ? 'rtl' : 'ltr'} style={{
      position: 'absolute', inset: caption ? '6% 4%' : tailUp ? '21% 7% 8%' : '8% 7% 21%',
      display: 'grid', placeItems: 'center', textAlign: 'center',
      whiteSpace: 'pre-line', color: '#211812', fontFamily: 'Geeza Pro, Arial, sans-serif', fontWeight: 700,
      fontSize: pageWidth * balloon.fontSize / 100, lineHeight: 1.22,
    }}>{balloon.text}</div>
  </div>;
};

const Panel: React.FC<{
  art: string;
  panel: ComicPanel;
  crop: Region;
  revealMode: NonNullable<ComicPanel['reveal']>;
  frame: number;
  fps: number;
  pageAt: number;
  pageWidth: number;
  pageHeight: number;
  dialogue: readonly ComicDialogue[];
  language: ComicLanguage;
}> = ({art, panel, crop, revealMode, frame, fps, pageAt, pageWidth, pageHeight, dialogue, language}) => {
  const time = frame / fps;
  const at = cueTime(panel.at, dialogue);
  if (time < at) return null;
  const reveal = at === 0 || revealMode === 'cut' ? 1 : enter(time, at, revealMode === 'fade' ? .22 : .42);
  const xs = crop.map(([x]) => x);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const ys = crop.map(([, y]) => y);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const hiddenWidth = (right - left) * (1 - reveal);
  const wipe = language === 'ar'
    ? `inset(0 0 0 ${left + hiddenWidth}%)`
    : `inset(0 ${100 - right + hiddenWidth}% 0 0)`;
  const {bubble, motion, camera} = panel;
  const bubbleAt = bubble ? Math.max(at, cueTime(bubble.at, dialogue)) : 0;
  const pop = enter(time, bubbleAt, .32, POP);
  const moving = motion ? Math.sin((time - at) * 2 * Math.PI / (motion.period ?? 4)) : 0;
  const cameraAt = camera?.at === undefined ? at : cueTime(camera.at, dialogue);
  const cameraProgress = camera ? enter(time, cameraAt, camera.duration) : 0;
  const startZoom = camera?.startZoom ?? 1;
  const zoom = startZoom + ((camera?.zoom ?? 1) - startZoom) * cameraProgress;
  const focus = camera?.focus ?? {x: 50, y: 50};
  const endFocus = camera?.endFocus ?? focus;
  const focusX = focus.x + (endFocus.x - focus.x) * cameraProgress;
  const focusY = focus.y + (endFocus.y - focus.y) * cameraProgress;
  const artBox: React.CSSProperties = panel.art || panel.scene ? {
    position: 'absolute', left: `${left}%`, top: `${top}%`, width: `${right - left}%`, height: `${bottom - top}%`,
  } : {position: 'absolute', inset: 0};
  const cameraStyle: React.CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: `${focusX}% ${focusY}%`,
  };
  const artStyle: React.CSSProperties = {
    objectFit: panel.art ? panel.artFit ?? 'cover' : 'fill',
    objectPosition: panel.artPosition,
    ...cameraStyle,
  };

  return <AbsoluteFill style={{
    clipPath: revealMode === 'wipe' ? wipe : undefined,
    opacity: revealMode === 'fade' ? reveal : undefined,
  }}>
    <AbsoluteFill style={{clipPath: clip(crop)}}>
      <div style={{...artBox, backgroundColor: panel.artFit === 'contain' ? '#241913' : undefined}}>
        {panel.scene ? <SceneArt art={art} scene={panel.scene} frame={frame} fps={fps} at={at}
          visibleAt={Math.max(pageAt, at)} dialogue={dialogue} cameraStyle={cameraStyle}
          width={pageWidth * (right - left) / 100} height={pageHeight * (bottom - top) / 100} />
          : <PageArt src={art} style={artStyle} />}
        {panel.rigby?.map((layer, index) => <PageArt key={index}
          src={rigbyFrame(layer, frame, fps, Math.max(pageAt, at), dialogue)} style={artStyle} />)}
      </div>
      {motion && <PageArt src={motion.art ?? art} style={{
        ...(panel.art && !motion.art ? {...artBox, objectFit: panel.artFit ?? 'cover', objectPosition: panel.artPosition} : {}),
        clipPath: clip(motion.region),
        transform: `translate(${moving * (motion.x ?? 0)}px, ${moving * (motion.y ?? 0)}px)`,
      }} />}
      {bubble && time < bubbleAt + .32 && <>
        <PageArt src={bubble.cleanArt} style={{clipPath: clip(bubble.region)}} />
        {time >= bubbleAt && <AbsoluteFill style={{
          transformOrigin: `${bubble.origin[0]}% ${bubble.origin[1]}%`,
          transform: `scale(${.65 + .35 * pop})`,
          opacity: Math.min(1, (time - bubbleAt) / .12),
        }}>
          <PageArt src={art} style={{clipPath: clip(bubble.region)}} />
        </AbsoluteFill>}
      </>}
      {panel.outline && <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <polygon points={crop.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={PAPER}
          strokeWidth={12} vectorEffect="non-scaling-stroke" />
      </svg>}
      {panel.inkBorder && <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <polygon points={crop.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke="#241913"
          strokeWidth={6} vectorEffect="non-scaling-stroke" />
      </svg>}
      {panel.balloons?.map((balloon, index) => (balloon.until === undefined || time < cueTime(balloon.until, dialogue)) && (
        <Balloon key={index} balloon={balloon} time={time} at={Math.max(at, cueTime(balloon.at, dialogue))}
          pageWidth={pageWidth} language={language} />
      ))}
    </AbsoluteFill>
  </AbsoluteFill>;
};

export const MotionComic: React.FC<{
  pages: readonly MotionComicPage[];
  dialogue?: readonly ComicDialogue[];
  panelPlayback?: 'accumulate' | 'sequential';
  language?: ComicLanguage;
}> = ({pages, dialogue = [], panelPlayback = 'accumulate', language = 'ar'}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const page = pages.findLast(({at = 0}) => at <= time);
  const ratio = page?.aspectRatio ?? 16 / 9;
  const pageWidth = Math.min(width, height * ratio);
  const sequential = panelPlayback === 'sequential';
  let activePanel = -1;
  if (page && sequential) {
    let previousCue = -Infinity;
    page.panels.forEach((panel, index) => {
      const cue = cueTime(panel.at, dialogue);
      if (!(cue > previousCue)) throw new Error(`Sequential comic panel ${index + 1} needs a cue later than the previous panel.`);
      if (cue <= time) activePanel = index;
      previousCue = cue;
    });
  }

  return <AbsoluteFill style={{backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center'}}>
    {page && <div style={{position: 'relative', width: pageWidth, height: pageWidth / ratio}}>
      {page.panels.map((panel, index) => {
        if (sequential && index !== activePanel) return null;
        const column = language === 'ar' ? page.panels.length - 1 - index : index;
        const left = column / page.panels.length * 100;
        const right = (column + 1) / page.panels.length * 100;
        const crop = panel.crop ?? [[left, 0], [right, 0], [right, 100], [left, 100]];
        if (page.showPanelFrames && time < cueTime(panel.at, dialogue)) {
          return <svg key={index} viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
            <polygon points={crop.map(([x, y]) => `${x},${y}`).join(' ')} fill="#e8dac0"
              stroke="#241913" strokeWidth={3} vectorEffect="non-scaling-stroke" />
          </svg>;
        }
        const art = panel.art ?? page.art;
        if (!art) throw new Error(`Missing artwork for comic panel ${index + 1}`);
        return <Panel key={index} art={art} panel={panel} crop={crop} frame={frame} fps={fps}
          revealMode={panel.reveal ?? (sequential ? 'cut' : 'wipe')}
          pageAt={page.at ?? 0} pageWidth={pageWidth} pageHeight={pageWidth / ratio}
          dialogue={dialogue} language={language} />;
      })}
    </div>}
    {dialogue.map((line) => {
      if (!line.audio) return null;
      const start = Math.round((line.words?.[0]?.start ?? line.start) * fps);
      const end = Math.round((line.words?.at(-1)?.end ?? line.end) * fps);
      return <Sequence key={line.id} name={line.speaker} from={start} durationInFrames={Math.max(1, end - start)}>
        <Audio src={staticFile(line.audio)} />
      </Sequence>;
    })}
  </AbsoluteFill>;
};
