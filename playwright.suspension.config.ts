import {defineConfig,devices} from '@playwright/test';
const python=process.platform==='win32'?'..\\18-telemetry-dataset\\.venv\\Scripts\\python.exe':'../18-telemetry-dataset/.venv/bin/python';

export default defineConfig({
  testDir:'./tests/e2e',testMatch:'chassis-suspension-lab.spec.ts',
  fullyParallel:false,workers:1,retries:0,timeout:90000,
  expect:{timeout:20000},
  outputDir:'.superpowers/sdd/2026-10-26-chassis-suspension-spectral/e2e-results',
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:5174',trace:'retain-on-failure',actionTimeout:15000},
  webServer:[
    {command:`"${python}" tests/e2e/fixtures/suspension_backend.py`,url:'http://127.0.0.1:8184/api/v1/health',reuseExistingServer:false,timeout:30000},
    {command:'npm run dev -- --config vite.suspension.config.ts --port 5174 --strictPort',url:'http://127.0.0.1:5174/pit-wall/app',reuseExistingServer:false,timeout:30000,
      env:{VITE_TELEMETRY_URL:'/api/telemetry',VITE_INSFORGE_URL:'',VITE_INSFORGE_ANON_KEY:''}},
  ],
  projects:[{name:'chromium-suspension',use:{...devices['Desktop Chrome']}}],
});
