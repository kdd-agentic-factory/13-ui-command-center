import {defineConfig,mergeConfig} from 'vite';
import base from './vite.config';
// QA-only multi-entry build verifies tree-shaken production 3D components.
export default defineConfig(env=>mergeConfig(typeof base==='function'?base(env):base,{build:{rollupOptions:{input:{app:'index.html',render:'tests/e2e/fixtures/babylon-smoke.html'}}}}));
