// Bulk renderer: bundles once, renders every shot in the manifest.
//   node scripts/render-all.mjs                 -> render all
//   node scripts/render-all.mjs LevelsOverview  -> render only these ids
//   node scripts/render-all.mjs --still         -> render a poster PNG per shot instead of video
// Renders into each project’s output folder. Transparent shots use ProRes 4444.
// Renders at authored resolution by default. Pass --scale=2 only when a deliberate 4K export is needed.
import { withRenderBundle } from './render-bundle.mjs';
import { selectComposition, renderMedia, renderStill } from '@remotion/renderer';
import { readFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE;
const stillMode = args.includes('--still');
const scaleArg = args.find((a) => a.startsWith('--scale='));
const SCALE = scaleArg ? Number(scaleArg.split('=')[1]) : 1;
const onlyIds = args.filter((a) => !a.startsWith('--'));

const manifest = JSON.parse(readFileSync(path.join(root, 'src', 'shots.manifest.json'), 'utf8'));
const selected = manifest.filter(shot => !onlyIds.length || onlyIds.includes(shot.id) || onlyIds.includes(shot.project));
if (!selected.length) {
  if (onlyIds.length) throw new Error(`No matching projects: ${onlyIds.join(', ')}`);
  console.log('No projects yet. Create one with tools/create_project.py.');
  process.exit(0);
}

console.log('bundling...');
// publicDir must be passed explicitly: remotion.config.ts only applies to the CLI,
// not the programmatic bundle() API.
await withRenderBundle({ entryPoint: path.join(root, 'src', 'index.ts'), publicDir: path.join(root, '.public') }, async (serveUrl) => {

  let n = 0;
  for (const shot of selected) {
    const outDir = path.join(root,'..','projects',shot.project,'output');
    mkdirSync(outDir,{recursive:true});
    const composition = await selectComposition({ serveUrl, browserExecutable, id: shot.id });

    if (stillMode) {
      const out = path.join(outDir, `${shot.project}-preview.${shot.transparent?'png':'jpg'}`);
      await renderStill({
        serveUrl, browserExecutable, composition, output: out, scale: SCALE, overwrite: true,
        frame: Math.floor(composition.durationInFrames * 0.6),
        imageFormat: shot.transparent ? 'png' : 'jpeg',
      });
      console.log('  still ->', path.relative(root, out));
    } else {
      const transparent = !!shot.transparent;
      const out = path.join(outDir, `${shot.project}.${transparent ? 'mov' : 'mp4'}`);
      await renderMedia({
        serveUrl, browserExecutable, composition, outputLocation: out, scale: SCALE, overwrite: true,
        codec: transparent ? 'prores' : 'h264',
        proResProfile: transparent ? '4444' : undefined,
        pixelFormat: transparent ? 'yuva444p10le' : 'yuv420p',
        imageFormat: transparent ? 'png' : 'jpeg',
        crf: transparent ? undefined : 18,
        onProgress: ({ progress }) => process.stdout.write(`\r  ${shot.id}: ${Math.round(progress * 100)}%   `),
      });
      process.stdout.write('\n');
      console.log('  ->', path.relative(root, out));
    }
    n++;
  }
  console.log(`done: ${n} shot(s) rendered to project output folders`);
});
