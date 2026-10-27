// @vitest-environment node
import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync,readdirSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
it('builds a commercial artifact without legacy operational defaults or static previews',()=>{
 const out=resolve('.superpowers/sdd/2026-10-26-chassis-commercial-perimeter','artifact-check-'+randomUUID());mkdirSync(out,{recursive:true});
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('VITE_')));
 execFileSync(process.execPath,['node_modules/vite/bin/vite.js','build','--outDir',out],{env:{...env,NODE_ENV:'production',VITE_ORCHESTRATOR_URL:'https://legacy.fixture.invalid',VITE_PRODUCT_PROFILE:'chassis',VITE_TELEMETRY_URL:'/api/telemetry',VITE_INSFORGE_URL:'https://identity.fixture.example',VITE_INSFORGE_ANON_KEY:'public-fixture-key',VITE_POSTHOG_KEY:''},stdio:'pipe',timeout:60000});
 const js=readdirSync(join(out,'assets')).filter(f=>f.endsWith('.js')).map(f=>readFileSync(join(out,'assets',f),'utf8')).join('');
 expect(js.includes('fly.dev')).toBe(false);expect(js.includes('legacy.fixture.invalid')).toBe(false);expect(js.includes('identity.fixture.example')).toBe(true);expect(js.includes('czdpamk9.insforge.site')).toBe(false);expect(js.includes('All Services Deployed')).toBe(false);
 expect(existsSync(join(out,'pit-wall-os'))).toBe(false);expect(existsSync(join(out,'vercel.json'))).toBe(false);expect(existsSync(join(out,'favicon.svg'))).toBe(true);expect(existsSync(join(out,'kdd-application-manual.md'))).toBe(true);
},65000);
it('does not send local plan artifacts and synthetic TLS keys to Docker builds',()=>{const lines=readFileSync('.dockerignore','utf8').split(/\r?\n/);expect(lines).toContain('.superpowers/');});
