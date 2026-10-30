import {afterEach,expect,it,vi} from 'vitest';
import {prepareSnapshotSources} from './engineeringSession';
import {ids} from '../../tests/engineeringTransport';
vi.mock('./telemetryIdentity',()=>({identitySnapshot:()=>({mode:'authenticated',user:'00000000-0000-4000-8000-000000000010',team:'00000000-0000-4000-8000-000000000011'}),telemetryFetch:(url:string,init:RequestInit)=>fetch(url,init)}));
afterEach(()=>vi.unstubAllGlobals());
const factories=[{factory:'bike' as const,components:['suspension']}];
for(const changed of [{actor_id:ids.a},{snapshot_digest:'b'.repeat(64)},{factories:[{factory:'bike',components:['engine']}]}])it('rejects a source plan bound to different claims '+JSON.stringify(changed),async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({schema_version:'1.0.0',snapshot_id:ids.comparison,snapshot_digest:'a'.repeat(64),team_id:'00000000-0000-4000-8000-000000000011',actor_id:'00000000-0000-4000-8000-000000000010',operation_id:ids.rider,binding_ids:[ids.b],review_version:1,on:'2026-10-30',factories,...changed}))));
 await expect(prepareSnapshotSources(ids.comparison,'a'.repeat(64),factories,ids.rider)).rejects.toThrow(/inicio bloqueado/);
});
