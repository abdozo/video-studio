# Local render temporary files

Use `withRenderBundle` from `render-bundle.mjs` for local programmatic renders and QA frames. It creates an invocation-owned output directory, uses `symlinkPublicDir` on macOS/Linux instead of copying the media folder, and removes that directory on completion, failure, ordinary exit, SIGINT, or SIGTERM. Do not use it for deployment bundles, which must be self-contained.

Keep source TSX, project JSON/settings, `media/projects`, shared library media, narration, original images/audio, licenses, and final deliverables. Temporary bundles can be regenerated from those sources and are not required for future editing. QA images and old output versions are reviewable artifacts, not automatically disposable source files.

Never sweep all system temporary files or delete another invocation's directory. SIGKILL, power loss, or cleanup permission errors can leave a small bundle behind. Windows copies media because Remotion does not support this symlink option there. CLI/Studio and scripts that call `bundle()` directly do not use this wrapper.

Old `remotion-webpack-bundle-*` directories need a separate review after active renders are stopped. This change does not remove them.

Run lifecycle checks with `node scripts/temporary-render-directory.test.mjs`. They cover success, render failure, ordinary exit, SIGINT, SIGTERM, and preserving original media behind a symlink.
