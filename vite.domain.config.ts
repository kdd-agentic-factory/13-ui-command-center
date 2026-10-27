import {defineConfig,mergeConfig} from 'vite';
import base from './vite.config';

// Keep the production CSP and same-origin client unchanged; only QA's proxy
// points to the separate empty backend instead of the user's live service.
export default defineConfig(env=>mergeConfig(typeof base==='function'?base(env):base,{
  preview:{host:'127.0.0.1',proxy:{'/api/telemetry':{target:'http://127.0.0.1:8185',headers:{'X-API-Key':''},rewrite:(path:string)=>path.replace(/^\/api\/telemetry/,'')}}},
  server:{proxy:{'/api/telemetry':{target:'http://127.0.0.1:8185',headers:{'X-API-Key':''}}}},
}));
