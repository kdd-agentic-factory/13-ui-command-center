import { beforeEach, expect, it, vi } from 'vitest';
import { getCatalogEntity,getEngineeringSession,getCurrentValidity,getCurrentAnalysisRun,readWorkspaceAssociation } from './engineeringSession';
import { entity,ids,session,transport } from '../../tests/engineeringTransport';
beforeEach(()=>{vi.restoreAllMocks();});
it('sends the chassis audit headers when associating a persisted workspace',async()=>{
  const {fetch}=transport();
  await readWorkspaceAssociation(session() as any,ids.recording);
  const call=fetch.mock.calls.find(([url])=>String(url).endsWith('/state'))!;
  const headers=new Headers(call[1]?.headers);
  expect(headers.get('X-Actor-ID')).toBeTruthy();
  expect(headers.get('X-Workflow-ID')).toBe('engineering-workspace-association');
  expect(headers.get('X-Trace-ID')).toMatch(/^[a-f0-9-]{36}$/);
});
it('rejects an owned but mismatched session response',async()=>{
  const {fetch}=transport();fetch.mockResolvedValue(new Response(JSON.stringify(session('Otra sesión',ids.second))));
  await expect(getEngineeringSession(ids.session)).rejects.toThrow(/no corresponde/);
});
it('rejects a catalog response that silently upgrades the requested revision',async()=>{
  const {fetch}=transport();fetch.mockResolvedValue(new Response(JSON.stringify(entity('circuit',3))));
  await expect(getCatalogEntity('circuit',{id:ids.circuit,revision:1})).rejects.toThrow(/revisión solicitada/);
});
it('rejects non-boolean current authority flags instead of enabling a human action',async()=>{
  const {fetch}=transport();fetch.mockResolvedValue(new Response(JSON.stringify({schema_version:'1.0.0',proposal_id:ids.a,proposal_revision:1,authority_proposal_id:ids.b,generation:1,current:true,approvable:'false',rejectable:true,revision_requestable:true,approved_current:false,authority_available:true,designation_revision:1,primary_id:null,substitute_id:null,decision_id:null,decision_action:null,reasons:[]})));
  await expect(getCurrentValidity(ids.a,1)).rejects.toThrow(/Autoridad incompatible/);
});
it('rejects unsupported run/task states instead of presenting fabricated activity',async()=>{
  const {fetch}=transport();fetch.mockResolvedValue(new Response(JSON.stringify({run:{run_id:ids.second,session_id:ids.session,snapshot_id:ids.comparison,snapshot_digest:'a'.repeat(64),workflow_id:'engineering-test',status:'active',review_mode:'blind_review',created_at:1,deadline:9,model_calls:0,revealed:false,tasks:[]}})));
  await expect(getCurrentAnalysisRun(ids.session)).rejects.toThrow(/Ejecución incompatible/);
});
