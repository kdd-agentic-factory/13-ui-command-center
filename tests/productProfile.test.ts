import {describe,it,expect} from 'vitest';
import {resolveProductProfile,allowsProviderCapability,assertCommercialIdentity,guardProviderClient} from '../src/domain/productProfile';
describe('commercial product contract',()=>{
 it('defaults production to chassis and dev to explicit local development',()=>{expect(resolveProductProfile(undefined,true)).toBe('chassis');expect(resolveProductProfile(undefined,false)).toBe('local-development');expect(()=>resolveProductProfile('unknown',true)).toThrow();});
 it('does not confuse interface mode with human identity',()=>{expect(()=>assertCommercialIdentity('chassis','local')).toThrow();expect(()=>assertCommercialIdentity('chassis','unknown')).toThrow();expect(()=>assertCommercialIdentity('chassis','authenticated')).not.toThrow();expect(()=>assertCommercialIdentity('local-development','local')).not.toThrow();});
 it('keeps auth and closes unvalidated provider surfaces',()=>{for(const c of ['database','storage','ai','functions','realtime'] as const){expect(allowsProviderCapability('chassis',c)).toBe(false);expect(allowsProviderCapability('local-development',c)).toBe(true);}expect(allowsProviderCapability('chassis','auth')).toBe(true);});
 it('guards the client without changing auth or exposing its internal raw client',()=>{const auth={refreshSession:()=>42};const c=guardProviderClient({auth,database:{},storage:{}},'chassis');expect(c.auth.refreshSession()).toBe(42);expect(()=>c.database).toThrow('fuera');expect(()=>c.storage).toThrow();});
});

it('commercial facade hides raw transport, future services and auth internals',()=>{const client={auth:{refreshSession(){return 42},http:{request(){throw Error('network')}}},getHttpClient:()=>({}),emails:{},payments:{}};const c=guardProviderClient(client,'chassis');for(const key of ['getHttpClient','emails','payments'])expect(()=>Reflect.get(c,key)).toThrow();expect(Reflect.get(c.auth,'http')).toBeUndefined();expect(guardProviderClient(client,'local-development')).toBe(client);});
