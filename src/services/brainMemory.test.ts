import {beforeEach,describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({fetch:vi.fn(),identity:{mode:'authenticated',team:'11111111-1111-4111-8111-111111111111',role:'engineer',generation:1}}));
vi.mock('./telemetryIdentity',()=>({telemetryFetch:mock.fetch,identitySnapshot:()=>mock.identity}));
import {listBrainNotes,createBrainNote} from './brainMemory';
const context={subject_key:'bike:qa',model_year:2026};const scope=['bike'];
function record(){return {schema_version:'1.0.0',operation_id:'55555555-5555-4555-8555-555555555555',audit:{'X-Actor-ID':'33333333-3333-4333-8333-333333333333','X-Workflow-ID':'qa','X-Trace-ID':'trace'},id:'22222222-2222-4222-8222-222222222222',team_id:mock.identity.team,created_by:'33333333-3333-4333-8333-333333333333',created_at:'2026-10-29T12:00:00Z',review:'unreviewed',usable_by_agents:false,classification:'restricted',body:{scope:{path:scope},context:{...context},text:'Synthetic note.',related_entries:[]}};}
beforeEach(()=>{mock.fetch.mockReset();mock.identity.generation=1;});
describe('Brain team/context transport',()=>{
 it('loads exact context only',async()=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify({items:[record()],next_cursor:null})));expect((await listBrainNotes(scope,context)).items).toHaveLength(1);expect(String(mock.fetch.mock.calls[0][0])).toContain('brain/notes?');});
 it.each(['foreign','approved','context'])('rejects incompatible %s response',async kind=>{const item=record();if(kind==='foreign')item.team_id='44444444-4444-4444-8444-444444444444';if(kind==='approved')item.usable_by_agents=true;if(kind==='context')item.body.context.subject_key='bike:other';mock.fetch.mockResolvedValue(new Response(JSON.stringify({items:[item],next_cursor:null})));await expect(listBrainNotes(scope,context)).rejects.toThrow();});
 it('discards a response after identity changes',async()=>{mock.fetch.mockImplementation(async()=>{mock.identity.generation++;return new Response(JSON.stringify({items:[],next_cursor:null}));});await expect(listBrainNotes(scope,context)).rejects.toThrow();});
 it('keeps deliberate operation on save and refuses mismatched text',async()=>{mock.fetch.mockResolvedValue(new Response(JSON.stringify(record())));await createBrainNote({scope:{path:scope},context:{...context},text:'Synthetic note.',related_entries:[]},'55555555-5555-4555-8555-555555555555');const request=JSON.parse(mock.fetch.mock.calls[0][1].body);expect(request.operation_id).toBe('55555555-5555-4555-8555-555555555555');});
});

it('discards a body whose identity changes while JSON is read',async()=>{const response=new Response(JSON.stringify({items:[],next_cursor:null}));vi.spyOn(response,'json').mockImplementation(async()=>{mock.identity.generation++;return {items:[],next_cursor:null};});mock.fetch.mockResolvedValue(response);await expect(listBrainNotes(scope,context)).rejects.toThrow(/Cambió/);});
