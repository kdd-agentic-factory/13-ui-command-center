/// <reference types="vitest" />
import { defineConfig, loadEnv, type Plugin } from 'vite';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import react from '@vitejs/plugin-react';
import {applyCommercialCsp} from './scripts/commercial-csp.mjs';

export default defineConfig(({ mode, command }) => {
  const env=loadEnv(mode,process.cwd(),'VITE_');
  const profile=env.VITE_PRODUCT_PROFILE??(command==='build'?'chassis':'local-development');
  if(!['chassis','local-development'].includes(profile))throw new Error('Unknown product delivery profile');
  if(profile==='chassis'&&env.VITE_TELEMETRY_URL&&env.VITE_TELEMETRY_URL!=='/api/telemetry')throw new Error('Commercial telemetry must use the same-origin perimeter');
  if(profile==='chassis'&&Object.entries(env).some(([k,v])=>v&&/VITE_.*(SECRET|SERVICE_ROLE|INTERNAL_API_KEY|RAG_KEY)$/.test(k)))throw new Error('Private credential must not enter a browser build');
  const deliveryAssets:Plugin={name:'chassis-public-assets',generateBundle(){
    for(const name of ['favicon.svg','kdd-application-manual.md','paper-kit/experimental-design.pdf'])this.emitFile({type:'asset',fileName:name,source:readFileSync(resolve('public',name))});
  }};
  const commercialPublic=['VITE_INSFORGE_URL','VITE_INSFORGE_ANON_KEY','VITE_LEAD_CAPTURE_URL','VITE_BLUEPRINT_WEB_URL','VITE_POSTHOG_KEY'];
  const publicDefines=profile==='chassis'?Object.fromEntries(commercialPublic.map(key=>['import.meta.env.'+key,JSON.stringify(env[key]??'')])):{};
  return ({
  define: {...publicDefines,'import.meta.env.VITE_PRODUCT_PROFILE':JSON.stringify(profile),...(profile==='chassis'?{'import.meta.env.VITE_TELEMETRY_URL':JSON.stringify('/api/telemetry')}: {})},
  envPrefix:profile==='chassis'?[]:'VITE_',
  plugins: [react(),...(profile==='chassis'?[deliveryAssets,{name:'chassis-connection-policy',transformIndexHtml(html){return applyCommercialCsp(html,env);}} satisfies Plugin]:[])],
  publicDir:profile==='chassis'?false:'public',
  resolve:{alias:{'@delivery/settings':resolve('src/pages',profile==='chassis'?'SettingsCommercialPage.tsx':'SettingsDevelopmentPage.tsx')}},
  base: '/pit-wall/',
  server: {
    proxy: {
      '/api/telemetry': { target: 'http://127.0.0.1:8180', changeOrigin: true,
        headers: { 'X-API-Key': loadEnv(mode, process.cwd(), 'TDS_').TDS_API_KEY ?? '' },
        rewrite: path => path.replace(/^\/api\/telemetry/, '') },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Modular Babylon imports are reached only through the React.lazy()'d 3D viewers
        // (see components/babylon/lazy.tsx), so Rollup splits it into its own
        // ASYNC chunk automatically — it is no longer preloaded on first paint.
        // We only pin the eager vendor chunk here; forcing a `babylon` object
        // entry would mark it as an initial chunk and re-add the modulepreload.
        manualChunks: {
          vendor: ['react', 'react-dom', 'i18next', 'react-i18next'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    pool: 'threads',
    minWorkers: 1,
    maxWorkers: 1,
    exclude: ['tests/e2e/**', 'node_modules/**', '**/.superpowers/**']
  }
});
});
