import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {applyCommercialCsp} from '../scripts/commercial-csp.mjs';

describe('commercial identity CSP',()=>{
 it('uses configured identity and removes historical service permissions',()=>{
  const html=applyCommercialCsp(readFileSync('index.html','utf8'),{VITE_INSFORGE_URL:'https://czdpamk9.eu-central.insforge.app'});
  expect(html).toContain("connect-src 'self' https://czdpamk9.eu-central.insforge.app;");
  expect(html).not.toContain('vdf553wq');expect(html).not.toContain('kdd-rjz');
  expect(html).not.toContain("connect-src 'self' https:;");
 });
 it('allows the exact HTTPS fixture origin without certificate exceptions',()=>{
  expect(applyCommercialCsp(readFileSync('index.html','utf8'),{VITE_INSFORGE_URL:'https://127.0.0.1:9443'})).toContain("connect-src 'self' https://127.0.0.1:9443;");
 });
 it('rejects CSP injection and insecure identity origins',()=>{
  for(const value of ['https://identity.test; https://evil.test','http://identity.test','https://user:password@identity.test','https://identity.test/path','https://identity.test\nhttps://evil.test']){
   expect(()=>applyCommercialCsp(readFileSync('index.html','utf8'),{VITE_INSFORGE_URL:value})).toThrow();
  }
 });
});
