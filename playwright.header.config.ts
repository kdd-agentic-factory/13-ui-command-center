import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',testMatch:['header-layout.spec.ts','babylon-loading.spec.ts'],workers:1,retries:0,timeout:60000,reporter:'list',outputDir:'.superpowers/sdd/2026-10-26-responsive-header/results',use:{baseURL:'http://127.0.0.1:5173',...devices['Desktop Chrome'],trace:'retain-on-failure'}});
