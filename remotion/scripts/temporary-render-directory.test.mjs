import assert from 'node:assert/strict';
import {existsSync,mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {withTemporaryRenderDirectory} from './temporary-render-directory.mjs';
let owned;
const source=mkdtempSync(path.join(os.tmpdir(),'render-source-test-'));
writeFileSync(path.join(source,'keep.txt'),'original media');
await withTemporaryRenderDirectory(async dir=>{
 owned=dir;symlinkSync(source,path.join(dir,'public'));writeFileSync(path.join(dir,'bundle.js'),'generated');
});
assert(!existsSync(owned));assert(existsSync(path.join(source,'keep.txt')));
await assert.rejects(withTemporaryRenderDirectory(async dir=>{owned=dir;throw Error('render failed');}),/render failed/);
assert(!existsSync(owned));
for(const mode of ['exit','SIGINT','SIGTERM']){
 console.log('Checking',mode);
 const helper=new URL('./temporary-render-directory.mjs',import.meta.url).href;
 const code=`import {withTemporaryRenderDirectory} from ${JSON.stringify(helper)};await withTemporaryRenderDirectory(async dir=>{console.log(dir);${mode==='exit'?'process.exit(7);':'await new Promise(()=>{setInterval(()=>{},1000);});'}});`;
 const child=spawn(process.execPath,['--input-type=module','-e',code],{stdio:['ignore','pipe','pipe']});
 const finished=once(child,'exit');
 const [data]=await once(child.stdout,'data');const dir=data.toString().trim();
 if(mode!=='exit'){await new Promise(r=>setTimeout(r,100));child.kill(mode);}
 const timeout=setTimeout(()=>{child.kill('SIGKILL');},5000);
 const [status]=await finished;clearTimeout(timeout);
 assert.equal(status,mode==='exit'?7:mode==='SIGINT'?130:143);assert(!existsSync(dir));
}
rmSync(source,{recursive:true});
console.log('PASS: success, render failure, process.exit, SIGINT, SIGTERM; original media survives symlink cleanup.');
