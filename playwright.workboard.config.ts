import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/workboard-ui',workers:1,reporter:'list',use:{baseURL:'http://127.0.0.1:5197',browserName:'chromium',launchOptions:{chromiumSandbox:true}},webServer:{command:'npm run dev -- --port 5197 --strictPort',url:'http://127.0.0.1:5197/pit-wall/tests/fixtures/session-workboard.html',reuseExistingServer:true}});
