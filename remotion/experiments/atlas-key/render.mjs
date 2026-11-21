import {mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {withRenderBundle} from '../../scripts/render-bundle.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.resolve(process.argv[2] || path.join(here,'../../../output/atlas-key'));
const qa = process.argv.includes('--qa');
const styles = ['flat-vector-science','watercolor-wash','shadow-puppet-theatre',
  'whiteboard-explainer','psychedelic-poster','tech-glow-explainer','papercraft-models'];
const selected = styles.filter((style) => !process.env.ATLAS_STYLE || style === process.env.ATLAS_STYLE);
if (!selected.length) throw new Error('Unknown ATLAS_STYLE');
mkdirSync(output,{recursive:true});

await withRenderBundle({entryPoint:path.join(here,'index.tsx'),publicDir:path.join(here,'public')},async (serveUrl) => {
  const puppeteerInstance = await openBrowser('chrome',{logLevel:'error'});
  try {
    for (const id of selected) {
      const composition = await selectComposition({serveUrl,id,puppeteerInstance});
      if (qa) {
        for (const frame of [69,272,426]) {
          await renderStill({serveUrl,composition,puppeteerInstance,frame,scale:.2,jpegQuality:70,
            imageFormat:'jpeg',output:path.join(output,`${id}-${frame}.jpg`)});
        }
      } else {
        await renderMedia({serveUrl,composition,puppeteerInstance,codec:'h264',muted:true,
          concurrency:4,crf:20,outputLocation:path.join(output,`${id}.mp4`)});
        const capture=spawnSync('ffmpeg',['-v','error','-y','-ss','13.8','-i',path.join(output,`${id}.mp4`),
          '-vf','scale=640:-2','-frames:v','1','-q:v','5',path.join(output,`${id}.jpg`)],{stdio:'inherit'});
        if(capture.status!==0) throw new Error(`Could not generate poster for ${id}`);
      }
      console.log(`${id} checked (${qa ? 'stills' : 'MP4'})`);
    }
  } finally {
    await puppeteerInstance.close({silent:true});
  }
});
