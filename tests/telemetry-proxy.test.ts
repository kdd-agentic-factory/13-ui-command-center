import {describe,it,expect} from 'vitest';
import {telemetryProxyTarget} from '../scripts/telemetry-proxy.mjs';
describe('explicit development telemetry upstream',()=>{
 it('preserves local default and accepts fixed HTTPS cloud origin',()=>{
  expect(telemetryProxyTarget({})).toBe('http://127.0.0.1:8180');
  expect(telemetryProxyTarget({TDS_TELEMETRY_PROXY_ORIGIN:'https://api.example.test'})).toBe('https://api.example.test');
 });
 it.each(['http://remote.test','https://user:secret@api.test','https://api.test/path','https://api.test?target=x','https://api.test#x',''])('rejects unsafe configured upstream %s',(origin)=>{
  expect(()=>telemetryProxyTarget({TDS_TELEMETRY_PROXY_ORIGIN:origin})).toThrow();
 });
});
