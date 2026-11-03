import {beforeEach,expect,it,vi} from 'vitest';
import {candidate,delivery,sessionId,task,teamId,userId} from '../../tests/workboardFixtures';
const identity=vi.hoisted(()=>({mode:'authenticated' as 'authenticated'|'local',user:'10000000-0000-4000-8000-000000000002',team:'10000000-0000-4000-8000-000000000001',role:'engineer',generation:1}));
const fetcher=vi.hoisted(()=>vi.fn());
vi.mock('./telemetryIdentity',()=>({identitySnapshot:()=>({...identity}),telemetryFetch:fetcher}));
import * as api from './sessionWorkboard';
beforeEach(()=>{vi.clearAllMocks();Object.assign(identity,{mode:'authenticated',user:userId,team:teamId,generation:1});});
it('uses explicit operations and returns owned session tasks',async()=>{
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({schema_version:'1.0.0',items:[task()]})));
 expect(await api.getBoard(sessionId)).toEqual([task()]);
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify(task())));
 await api.createTask(sessionId,1,candidate,task().id);
 const [url,options]=fetcher.mock.calls[1];expect(url).toContain(`/sessions/${sessionId}/workboard/tasks`);
 expect(JSON.parse(options.body)).toEqual({expected_session_revision:1,operation_id:task().id,body:candidate});
 expect(options.cache).toBe('no-store');
});
it('rejects foreign, wrong-session and invented-state task payloads',async()=>{
 for(const value of [task({team_id:crypto.randomUUID()}),task({session_id:crypto.randomUUID()}),task({state:'approved' as never})]){
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({schema_version:'1.0.0',items:[value]})));
  await expect(api.getBoard(sessionId)).rejects.toThrow();
 }
});
it('recovers latest review and rejects a package for another task',async()=>{
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify(delivery())));
 expect(await api.getLatestReview(task({revision:5,state:'closed'}))).toEqual(delivery());
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({...delivery(),task:task({id:crypto.randomUUID(),revision:4,state:'in_review'})})));
 await expect(api.getLatestReview(task({revision:5,state:'closed'}))).rejects.toThrow();
});
it('drops an old response when identity changes and never falls back to local',async()=>{
 fetcher.mockImplementationOnce(async()=>{identity.generation++;return new Response(JSON.stringify({schema_version:'1.0.0',items:[task()]}));});
 await expect(api.getBoard(sessionId)).rejects.toThrow(/cambi/);
 identity.mode='local';await expect(api.getBoard(sessionId)).rejects.toThrow(/verificada/);
 expect(fetcher).toHaveBeenCalledTimes(1);
});
it('preserves conflict status and distinguishes absent decision from outages',async()=>{
 fetcher.mockResolvedValueOnce(new Response('{}',{status:409}));
 await expect(api.getBoard(sessionId)).rejects.toMatchObject({status:409});
 fetcher.mockResolvedValueOnce(new Response('{}',{status:404}));
 expect(await api.getDecision(delivery())).toBeNull();
 fetcher.mockResolvedValueOnce(new Response('{}',{status:503}));
 await expect(api.getDecision(delivery())).rejects.toMatchObject({status:503});
});
