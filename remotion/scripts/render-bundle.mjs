import { bundle } from '@remotion/bundler';
import { withTemporaryRenderDirectory } from './temporary-render-directory.mjs';

// Local renders only. Deployment requires a self-contained bundle instead.
export async function withRenderBundle(options, render) {
  return withTemporaryRenderDirectory(async (directory) => {
    const serveUrl = await bundle({ ...options, outDir: directory, symlinkPublicDir: true });
    return render(serveUrl);
  });
}
