import {describe,it,expect,vi} from 'vitest';
import {Readable} from 'node:stream';
import {readFileSync} from 'node:fs';
import {createHostedTelemetry,hostedRequestUrl} from '../scripts/hosted-telemetry.mjs';

const manifest=JSON.parse(readFileSync('deploy/chassis-surface.json','utf8'));
function response(){return {code:0,headers:{} as Record<string,string>,body:undefined as unknown,
 status(code:number){this.code=code;return this;},setHeader(k:string,v:string){this.headers[k]=v;},end(body?:unknown){this.body=body;}};}
function request(path:string,method='GET',body=''){
 return Object.assign(Readable.from(body?[Buffer.from(body)]:[]),{url:path,method,headers:{authorization:'Bearer controlled', 'x-team-id':'controlled-team',cookie:'private-cookie','x-api-key':'forbidden'}});
}
describe('hosted telemetry perimeter',()=>{
 it('preserves bounded diagnostic headers on upstream failure without leaking internal headers',async()=>{
  const trace='a3a4c344-8558-4144-981a-c57061181983';
  const fetcher=vi.fn(async()=>new Response('{"detail":"Unavailable"}',{status:503,headers:{'x-trace-id':trace,'retry-after':'1','set-cookie':'private','x-internal-node':'private'}}));
  const res=response();await createHostedTelemetry(manifest,'https://api.example.test',fetcher)(request('/api/telemetry/api/v1/chassis/status'),res);
  expect(res.code).toBe(503);expect(res.headers['X-Trace-ID']).toBe(trace);expect(res.headers['Retry-After']).toBe('1');
  expect(res.headers).not.toHaveProperty('set-cookie');expect(res.headers).not.toHaveProperty('x-internal-node');expect(res.headers['Cache-Control']).toBe('no-store');
 });
 it.each(['-1','3601','tomorrow'])('drops invalid retry hints and non-UUID diagnostic IDs: %s',async(value)=>{
  const res=response();await createHostedTelemetry(manifest,'https://api.example.test',async()=>new Response('{}',{status:503,headers:{'x-trace-id':'private-provider-id','retry-after':value}}))(request('/api/telemetry/api/v1/chassis/status'),res);
  expect(res.headers).not.toHaveProperty('X-Trace-ID');expect(res.headers).not.toHaveProperty('Retry-After');
 });
 it('routes nested API paths to a concrete function before SPA fallback',()=>{
  const config=JSON.parse(readFileSync('vercel.json','utf8'));
  expect(config.rewrites[0]).toEqual({source:'/api/telemetry/:path*',destination:'/api/chassis-proxy?__chassis_path=:path*'});
  expect(hostedRequestUrl('/api/chassis-proxy?__chassis_path=ignored&limit=2','api/v1/chassis/status')).toBe('/api/telemetry/api/v1/chassis/status?limit=2');
  for(const capture of [undefined,['api/v1/chassis/status'],'https://evil.test','/api/v1/chassis/status'])expect(()=>hostedRequestUrl('/api/chassis-proxy',capture)).toThrow();
 });
 it('preserves raw bodies restored by Vercel on an already consumed request',async()=>{
  const raw='{"operation_id":"controlled","unicode":"Ã¡"}';
  const req=request('/api/telemetry/api/v1/chassis/setups','POST');
  for await(const ignored of req){void ignored;}
  const restored=Readable.from([Buffer.from(raw)]);
  const originalOn=req.on.bind(req);
  req.on=((event:string,listener:(...args:unknown[])=>void)=>['data','end'].includes(event)?restored.on(event,listener):originalOn(event,listener)) as typeof req.on;
  const fetcher=vi.fn(async()=>new Response('{}'));const res=response();
  await createHostedTelemetry(manifest,'https://api.example.test',fetcher)(req,res);
  const options=(fetcher.mock.calls[0] as unknown as [string,RequestInit])[1];
  expect(Buffer.from(options.body as Uint8Array).toString()).toBe(raw);
 });
 it('forwards allowed requests to fixed upstream with bounded credential headers',async()=>{
  const fetcher=vi.fn(async()=>new Response('{"status":"ok"}',{status:200,headers:{'content-type':'application/json','set-cookie':'must-not-forward'}}));
  const handle=createHostedTelemetry(manifest,'https://api.example.test',fetcher);const res=response();
  await handle(request('/api/telemetry/api/v1/chassis/status?limit=1'),res);
  expect(res.code).toBe(200);expect(res.headers['Cache-Control']).toBe('no-store');expect(res.headers['set-cookie']).toBeUndefined();
  const [url,options]=fetcher.mock.calls[0] as unknown as [string,RequestInit];
  expect(url).toBe('https://api.example.test/api/v1/chassis/status?limit=1');
  expect(options.redirect).toBe('manual');expect(options.headers).toMatchObject({authorization:'Bearer controlled','x-team-id':'controlled-team'});
  expect(options.headers).not.toHaveProperty('cookie');expect(options.headers).not.toHaveProperty('x-api-key');
 });
 it.each(['/api/telemetry/api/v1/engineering/internal/control','/api/telemetry//evil.test','/api/telemetry/api%2fv1/chassis/status','/api/telemetry/api/v1/chassis/../status','/api/unrelated'])('denies unsafe or unlisted path %s',async(path)=>{
  const fetcher=vi.fn();const res=response();await createHostedTelemetry(manifest,'https://api.example.test',fetcher)(request(path),res);
  expect(res.code).toBe(404);expect(fetcher).not.toHaveBeenCalled();
 });
 it('enforces the method inventory and rejects upstream redirects',async()=>{
  const fetcher=vi.fn(async()=>new Response(null,{status:302,headers:{location:'https://evil.test'}}));
  const handle=createHostedTelemetry(manifest,'https://api.example.test',fetcher);
  const denied=response();await handle(request('/api/telemetry/api/v1/chassis/status','POST'),denied);expect(denied.code).toBe(404);expect(fetcher).not.toHaveBeenCalled();
  const redirected=response();await handle(request('/api/telemetry/api/v1/chassis/status'),redirected);expect(redirected.code).toBe(502);
 });
 it('fails closed on invalid configuration and oversized bodies/responses',async()=>{
  expect(()=>createHostedTelemetry({...manifest,sha256:'wrong'},'https://api.example.test')).toThrow();
  expect(()=>createHostedTelemetry(manifest,'http://api.example.test')).toThrow();
  const fetcher=vi.fn(async()=>new Response('x'.repeat(2*1024*1024+1)));
  const handle=createHostedTelemetry(manifest,'https://api.example.test',fetcher);
  const large=response();await handle(request('/api/telemetry/api/v1/chassis/setups','POST','x'.repeat(1024*1024+1)),large);expect(large.code).toBe(413);expect(fetcher).not.toHaveBeenCalled();
  const output=response();await handle(request('/api/telemetry/api/v1/chassis/status'),output);expect(output.code).toBe(502);
 });
});

it('allows the reviewed championship catalog route without opening private worker routes',async()=>{
 const fetcher=vi.fn(async()=>new Response('{}'));
 const handle=createHostedTelemetry(manifest,'https://api.example.test',fetcher);
 const res=response();
 await handle(request('/api/telemetry/api/v1/engineering/catalog/championship','POST','{}'),res);
 expect(res.code).toBe(200);
 expect((fetcher.mock.calls[0] as unknown as [string,RequestInit])[0]).toBe('https://api.example.test/api/v1/engineering/catalog/championship');
 const denied=response();
 await handle(request('/api/telemetry/api/v1/engineering/internal/championship','POST','{}'),denied);
 expect(denied.code).toBe(404);expect(fetcher).toHaveBeenCalledTimes(1);
});


it.each([
 ['GET','/sessions/11111111-1111-4111-8111-111111111111/workboard'],
 ['POST','/sessions/11111111-1111-4111-8111-111111111111/workboard/tasks'],
 ['GET','/workboard/tasks/22222222-2222-4222-8222-222222222222'],
 ['POST','/workboard/tasks/22222222-2222-4222-8222-222222222222/transitions'],
 ['PUT','/workboard/tasks/22222222-2222-4222-8222-222222222222/assignee'],
])('forwards authenticated workboard %s %s without opening approvals',async(method,path)=>{
 const fetcher=vi.fn(async()=>new Response('{}'));
 const handle=createHostedTelemetry(manifest,'https://api.example.test',fetcher);
 const result=response();
 await handle(request('/api/telemetry/api/v1/engineering'+path,method,method==='GET'?'':'{}'),result);
 expect(result.code).toBe(200);expect(fetcher).toHaveBeenCalledTimes(1);
 expect(result.headers['Cache-Control']).toBe('no-store');
 for(const suffix of ['approve','apply','internal']){
  const denied=response();await handle(request('/api/telemetry/api/v1/engineering/workboard/tasks/22222222-2222-4222-8222-222222222222/'+suffix,'POST','{}'),denied);
  expect(denied.code).toBe(404);
 }
 expect(fetcher).toHaveBeenCalledTimes(1);
});
