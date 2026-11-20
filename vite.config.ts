import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Stamps a unique cache version and built hashed JS/CSS bundle URLs into
      // dist/sw.js on every production build so old caches auto-expire safely.
      {
        name: 'vidyora-pwa-sw-version',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const swPath = path.resolve(distDir, 'sw.js');
          if (!fs.existsSync(swPath)) {
            return;
          }
          const assetsDir = path.resolve(distDir, 'assets');
          const builtAssets: string[] = [];
          if (fs.existsSync(assetsDir)) {
            for (const entry of fs.readdirSync(assetsDir)) {
              if (/\.(?:js|css|woff2?)$/i.test(entry)) {
                builtAssets.push(`/assets/${entry}`);
              }
            }
          }
          const buildVersion = `vidyora-v1-${Date.now().toString(36)}`;
          let swSource = fs.readFileSync(swPath, 'utf-8');
          swSource = swSource.replace(
            "const CACHE_VERSION = 'vidyora-v1-dev';",
            `const CACHE_VERSION = '${buildVersion}';`
          );
          swSource = swSource.replace(
            'const BUILD_PRECACHE_URLS = /* __VIDYORA_BUILD_ASSETS__ */ [];',
            `const BUILD_PRECACHE_URLS = ${JSON.stringify(builtAssets)};`
          );
          fs.writeFileSync(swPath, swSource, 'utf-8');
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
