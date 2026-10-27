import {defineConfig} from '@playwright/test';
import base from './playwright.header.config';
export default defineConfig({...base,outputDir:'.superpowers/sdd/2026-10-26-responsive-header/production-results',use:{...base.use,baseURL:'http://127.0.0.1:5176'},webServer:{command:'npx vite preview --config vite.header-qa.config.ts --outDir .superpowers/sdd/2026-10-26-responsive-header/production-dist --host 127.0.0.1 --port 5176 --strictPort',url:'http://127.0.0.1:5176/pit-wall/',reuseExistingServer:false,timeout:30000}});
