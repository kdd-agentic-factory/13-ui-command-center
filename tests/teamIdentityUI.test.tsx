import { insforge } from '../src/lib/insforge';
import {beforeEach,expect,it,vi} from 'vitest';
import {configureTelemetryIdentity,setTelemetryUser,setActiveTeam,telemetryFetch,telemetryScope} from '../src/services/telemetryIdentity';
vi.mock('../src/lib/insforge',()=>({insforge:{auth:{refreshSession:vi.fn(async()=>({data:{accessToken:'verified-token',user:{id:'userA'}},error:null}))}}}));
beforeEach(()=>{vi.unstubAllGlobals();configureTelemetryIdentity('authenticated');setTelemetryUser(null);setTelemetryUser('userA');setActiveTeam('teamA','engineer');});
it('uses memory bearer and selected scope, never actor header as authority',async()=>{
 const f=vi.fn(async(_url:string,_init?:RequestInit)=>new Response('{}',{status:200}));vi.stubGlobal('fetch',f);
 await telemetryFetch('/api/telemetry/api/v1/chassis/setups');
 const headers=new Headers(f.mock.calls[0][1]?.headers);expect(headers.get('Authorization')).toBe('Bearer verified-token');expect(headers.get('X-Team-ID')).toBe('teamA');
 expect(localStorage.getItem('verified-token')).toBeNull();
});
it('rejects late responses after switching team and logout',async()=>{
 let release!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(()=>new Promise<Response>(r=>{release=r;})));
 const promise=telemetryFetch('/api/telemetry/api/v1/chassis/setups');await vi.waitFor(()=>expect(release).toBeDefined());
 setActiveTeam('teamB','reader');release(new Response('{}'));await expect(promise).rejects.toThrow('equipo');
 setTelemetryUser(null);expect(telemetryScope()).toBe('anonymous');
 await expect(telemetryFetch('/api/telemetry/api/v1/recorded/capabilities')).rejects.toThrow('sesión');
});
it('never sends credentials to arbitrary destinations',async()=>{
 await expect(telemetryFetch('https://evil.example/collect')).rejects.toThrow('Destino');
});

it('discards a body that finishes after switching scope',async()=>{
 let body!:(data:unknown)=>void;
 vi.stubGlobal('fetch',vi.fn(async()=>({status:200,json:()=>new Promise(r=>{body=r;})})));
 const response=await telemetryFetch('/api/telemetry/api/v1/chassis/setups');
 const result=response.json();setActiveTeam('teamB','reader');body({secret:'A'});
 await expect(result).rejects.toThrow('equipo');
});

it('refreshes once after rejected access token and retries the authorized request',async()=>{
 const f=vi.fn().mockResolvedValueOnce(new Response('{}',{status:401})).mockResolvedValueOnce(new Response('{}',{status:200}));vi.stubGlobal('fetch',f);
 const r=await telemetryFetch('/api/telemetry/api/v1/recorded/capabilities');expect(r.status).toBe(200);expect(f).toHaveBeenCalledTimes(2);
});

it('clears the visible identity when initial credential renewal fails',async()=>{
 vi.mocked(insforge.auth.refreshSession).mockRejectedValueOnce(new Error('expired'));
 const expired=vi.fn();window.addEventListener('telemetry-auth-expired',expired);
 try{await expect(telemetryFetch('/api/telemetry/api/v1/recorded/capabilities')).rejects.toThrow('expired');expect(telemetryScope()).toBe('anonymous');expect(expired).toHaveBeenCalledTimes(1);}
 finally{window.removeEventListener('telemetry-auth-expired',expired);}
});

it('never dispatches a cached-token mutation across a synchronous team switch',async()=>{const f=vi.fn(async()=>new Response('{}'));vi.stubGlobal('fetch',f);await telemetryFetch('/api/telemetry/api/v1/chassis/setups');f.mockClear();const pending=telemetryFetch('/api/telemetry/api/v1/chassis/setups',{method:'POST',body:'team A'});setActiveTeam('teamB','engineer');await expect(pending).rejects.toThrow('equipo');expect(f).not.toHaveBeenCalled();});


it('rejects pre-identity requests without cancelling cold identity restoration',async()=>{
 setTelemetryUser(null);
 const expired=vi.fn();window.addEventListener('telemetry-auth-expired',expired);
 const network=vi.fn();vi.stubGlobal('fetch',network);
 try{
  await expect(telemetryFetch('/api/telemetry/api/v1/engineering/sessions')).rejects.toThrow('sesión');
  expect(network).not.toHaveBeenCalled();
  expect(expired).not.toHaveBeenCalled();
 }finally{window.removeEventListener('telemetry-auth-expired',expired);}
});
