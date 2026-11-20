import { Config } from '@remotion/cli/config';

// Prepared by npm run gen. Project source and rendered files stay outside the public assets.
Config.setPublicDir('.public');

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(null); // auto
