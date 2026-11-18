import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/** Preload the Latin Inter font (the first text the user sees) so it does not swap in late. */
function preloadMainFont(): Plugin {
  return {
    name: 'preload-main-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const font = Object.keys(ctx.bundle ?? {}).find((f) => /inter-latin-wght-normal.*\.woff2$/.test(f));
        return font ? [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${font}`, crossorigin: '' }, injectTo: 'head' }] : html;
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      preloadMainFont(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: false,
        injectManifest: {
          // App shell only: flags, fonts and other images are cached at runtime when first used.
          globPatterns: ['**/*.{js,css,html,webmanifest}', 'favicon.svg', 'icons/*.png', 'offline.html'],
          globIgnores: ['**/assets/*.svg'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          // Hosting serves clean URLs (/index.html -> /, /offline.html -> /offline); precache those, not redirects.
          manifestTransforms: [
            async (entries) => ({
              manifest: entries.map((e) => (e.url === 'index.html' ? { ...e, url: '/' } : e.url === 'offline.html' ? { ...e, url: '/offline' } : e)),
              warnings: [],
            }),
          ],
        },
        manifest: {
          id: '/',
          name: 'FIT ME AI',
          short_name: 'FIT ME AI',
          description: 'Food, water, sleep, steps and workouts, with Jai and Jaya, your AI coaches.',
          lang: 'en',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'any',
          background_color: '#F7F5EF',
          theme_color: '#F7F5EF',
          categories: ['health', 'fitness', 'lifestyle', 'food'],
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          ],
          screenshots: [
            { src: '/screenshots/desktop-home.png', sizes: '1280x720', type: 'image/png', form_factor: 'wide', label: 'Home dashboard on desktop' },
            { src: '/screenshots/phone-home.png', sizes: '780x1688', type: 'image/png', form_factor: 'narrow', label: 'Home dashboard on a phone' },
          ],
          shortcuts: [
            { name: 'Log food', url: '/food?add=auto', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
            { name: 'Water', url: '/health/water', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Flag SVGs are tiny; keep them as separate cached files instead of base64 inside the main bundle.
      assetsInlineLimit: (file: string) => (file.includes('flag-icons') ? false : undefined),
      rollupOptions: {
        output: {
          // Firebase SDK in its own long-lived chunks (one-way dependencies, so no init cycles); Rollup
          // splits the rest. App releases do not invalidate these, and none exceeds 500 kB.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/re2js\//.test(id)) return 're2js';
            // React, React DOM, the scheduler and the router reference each other: one chunk, no init cycle.
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
            // The `firebase/<x>` wrappers re-export `@firebase/<x>`: keep each pair together.
            if (/node_modules\/(@firebase|firebase)\/firestore\//.test(id)) return 'firebase-firestore';
            if (/node_modules\/(@firebase|firebase)\/auth\//.test(id)) return 'firebase-auth';
            if (/node_modules\/(@firebase|firebase)\/storage\//.test(id)) return 'firebase-storage';
            if (/node_modules\/(@firebase\/[^/]+|firebase|idb)\//.test(id)) return 'firebase-core';
            return undefined;
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
