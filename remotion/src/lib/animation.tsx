import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';

type RigbyLayer = {
  folder: string;
  startFrame: number;
  frameCount: number;
  firstFrame?: number;
  digits?: number;
  prefix?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};
type AnimationScene = {
  background?: string;
  color?: string;
  layers: RigbyLayer[];
};

function RigbyFrames({project, layer}: {project: string; layer: RigbyLayer}) {
  const frame = useCurrentFrame() + (layer.firstFrame ?? 0);
  const name = String(frame).padStart(layer.digits ?? 4, '0');
  const src = staticFile(`projects/${project}/${layer.folder}/${layer.prefix ?? ''}${name}.png`);
  return <Img src={src} style={{
    position:'absolute', left:layer.x ?? 0, top:layer.y ?? 0,
    width:layer.width ?? '100%', height:layer.height ?? '100%', objectFit:'contain',
  }}/>;
}

export function AnimationStage({project, scene}: {project:string; scene:AnimationScene}) {
  return <AbsoluteFill style={{backgroundColor:scene.color ?? '#20202a'}}>
    {scene.background && <Img src={staticFile(`projects/${project}/${scene.background}`)}
      style={{width:'100%',height:'100%',objectFit:'cover'}}/>}
    {scene.layers.map((layer,index)=>(
      <Sequence key={index} from={layer.startFrame} durationInFrames={layer.frameCount} layout="none">
        <RigbyFrames project={project} layer={layer}/>
      </Sequence>
    ))}
  </AbsoluteFill>;
}
