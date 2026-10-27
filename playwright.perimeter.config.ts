import {defineConfig,devices} from '@playwright/test';
const raw=process.env.KDD_PERIMETER_BASE_URL;
if(!raw)throw new Error('Perimeter browser acceptance BLOCKED: isolated fixture URL is required; no cloud default.');
const target=new URL(raw);
if(!['127.0.0.1','localhost','[::1]'].includes(target.hostname)||!['http:','https:'].includes(target.protocol)||target.username||target.password||target.search||target.hash)throw new Error('Perimeter fixture must be a fixed isolated loopback origin.');
export default defineConfig({testDir:'./tests/e2e',testMatch:'chassis-perimeter.spec.ts',workers:1,retries:0,use:{baseURL:target.origin,serviceWorkers:'block',ignoreHTTPSErrors:true},projects:[{name:'isolated-commercial-chromium',use:{...devices['Desktop Chrome']}}]});
