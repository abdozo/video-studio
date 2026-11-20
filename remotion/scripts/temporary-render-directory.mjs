import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Only remove the directory created by this invocation. Never sweep shared temp.
export async function withTemporaryRenderDirectory(run) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'video-creator-render-'));
  const cleanup = () => {
    try {
      // Remove symlinks themselves, never their original media targets.
      rmSync(directory, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Could not remove temporary render directory ${directory}: ${error.message}`);
    }
  };
  const interrupt = () => process.exit(130);
  const terminate = () => process.exit(143);
  process.once('exit', cleanup);
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  try {
    return await run(directory);
  } finally {
    cleanup();
    process.removeListener('exit', cleanup);
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
  }
}
