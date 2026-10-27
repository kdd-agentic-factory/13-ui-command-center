import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {compileSurface} from '../scripts/render-chassis-surface.mjs';
const manifest=JSON.parse(readFileSync('deploy/chassis-surface.json','utf8'));
it('renders exact method paths and access classes with a deny default',()=>{
 const text=compileSurface(manifest);expect(text).toContain('default denied;');expect(text).toContain('GET:/api/telemetry/api/v1/teams');expect(text).toContain('POST:/api/telemetry/api/v1/recorded/(import|inspect-2d)');expect(text).not.toContain('internal/control');expect(text).not.toContain('X-Principal');expect(compileSurface(manifest)).toBe(text);
});
it('fails closed on tampered or unsupported inventory',()=>{
 expect(()=>compileSurface({...manifest,sha256:'bad'})).toThrow();
 expect(()=>compileSurface({...manifest,version:'99'})).toThrow();
 expect(()=>compileSurface({...manifest,routes:[{method:'GET',pattern:'.*',access:'public'}]})).toThrow();
});
it('server cannot introduce service identity or generic legacy proxies',()=>{
 const text=readFileSync('default.conf.template','utf8');expect(text).not.toContain('proxy_set_header X-Principal');expect(text).not.toContain('kdd-demo');expect(text).not.toContain('location /api/database/');expect(text).toContain('proxy_ssl_verify on');expect(text).toContain('client_max_body_size 102m');expect(text).toContain('return 403');expect(text).toContain('return 404');
});
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const bash=process.platform==='win32'?'C:/Program Files/Git/bin/bash.exe':'/bin/bash';
function bootstrap(host:string,port?:string,key?:string){return ()=>execFileSync(bash,['--noprofile','--norc','-c','. "$1"; printf "%s" "$KDD_TELEMETRY_PORT"','fixture',resolve('docker/15-validate-chassis-env.envsh').split('\\').join('/')],{env:{PATH:process.platform==='win32'?'C:/Program Files/Git/usr/bin':'/usr/bin:/bin',SYSTEMROOT:process.env.SYSTEMROOT??'C:/Windows',KDD_TELEMETRY_HOST:host,...(port===undefined?{}:{KDD_TELEMETRY_PORT:port}),...(key===undefined?{}:{KDD_TELEMETRY_API_KEY:key})},encoding:'utf8',timeout:5000,stdio:'pipe'});}
it('bootstrap exports the default port without publishing credentials',()=>{expect(bootstrap('telemetry.example')()).toBe('443');});
it.each(['','https://telemetry.example','name@example','ok.example/path','ok.example\nsecond.example','a..example'])('bootstrap rejects invalid host %j',host=>{expect(bootstrap(host)).toThrow();});
it.each(['0','65536','443\n444','443;echo'])('bootstrap rejects invalid port %j',port=>{expect(bootstrap('telemetry.example',port)).toThrow();});
it('bootstrap rejects multiline credential injection',()=>{expect(bootstrap('telemetry.example','443','dummy\nheader')).toThrow();});
