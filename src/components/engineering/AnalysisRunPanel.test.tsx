import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AnalysisRunPanel } from './AnalysisRunPanel';
import { HumanDecisionPanel } from './HumanDecisionPanel';
import { HistoricalValidationPanel } from './HistoricalValidationPanel';
import { DesignationSettings } from './DesignationSettings';
import { ids, session } from '../../../tests/engineeringTransport';
import { StrictMode } from 'react';

const state=vi.hoisted(()=>({identity:{mode:'authenticated',user:'00000000-0000-4000-8000-000000000010',team:'00000000-0000-4000-8000-000000000011',role:'admin'},context:{} as any,dirty:false}));
vi.mock('../../context/EngineeringSessionContext',()=>({useEngineeringSession:()=>state.context}));
vi.mock('../../context/WorkspaceDraftContext',()=>({useWorkspaceDraft:()=>({isDirty:state.dirty})}));
vi.mock('../../services/telemetryIdentity',()=>({identitySnapshot:()=>state.identity,canWriteTelemetry:()=>true,telemetryFetch:(url:string,init:RequestInit)=>fetch(url,init)}));
const run={run_id:ids.second,session_id:ids.session,snapshot_id:ids.comparison,snapshot_digest:'a'.repeat(64),workflow_id:'engineering-test',status:'running',review_mode:'blind_review',created_at:1,deadline:9,model_calls:0,revealed:false,tasks:[{task_id:ids.a,branch:'principal',agent_id:'chassis',status:'unavailable',cause:'model_unavailable',result_hash:null}]};
const stored={authority_proposal_id:ids.a,generation:1,proposal_id:ids.b,proposal_digest:'b'.repeat(64),publication_status:'published',approvable:false,eligibility:{inputs_valid:true,branches_sealed:true,independence_checked:true,conflicts_resolved:true,domain_valid:true,source_valid:true,blocked_reasons:[]},proposal:{schema_version:'2.0.0',run_id:ids.second,snapshot_digest:'a'.repeat(64),revision:2,section_summaries:[],matrix:{conflicts:[],missing_reviewers:[],review_evidence:{},consensus:'not_established',independence:'process_independent_same_model',external_validation:false,object_reviews:[]},items:[],result_hashes:[],model_metadata:null,source_status:[],limitations:[],resolution:null}};
const validity={schema_version:'1.0.0' as const,proposal_id:ids.b,proposal_revision:2,authority_proposal_id:ids.a,generation:1,current:true,approvable:true,rejectable:true,revision_requestable:true,approved_current:false,authority_available:true,designation_revision:3,primary_id:state.identity.user,substitute_id:null,decision_id:null,decision_action:null,reasons:[]};
const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status});
beforeEach(()=>{state.dirty=false;state.identity.mode='authenticated';state.identity.role='admin';state.context={scope:'team',workspaceEpoch:0,session:session(),association:null,reload:vi.fn()};});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
it('reading views keep analysis state without exposing mutation controls or refetching',async()=>{
 const fetcher=vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:null});if(path.includes('/events?'))return reply({items:[],next_cursor:null,recovery_unavailable:false});throw Error(path);});
 vi.stubGlobal('fetch',fetcher);const present=vi.fn();
 const app=render(<AnalysisRunPanel workView="rider" contextKey="team/session" onPresentation={present}/>);
 await waitFor(()=>expect(present).toHaveBeenLastCalledWith(expect.objectContaining({contextKey:'team/session',status:'idle'})));
 expect(screen.queryByRole('button',{name:'Iniciar análisis'})).not.toBeInTheDocument();
 const reads=fetcher.mock.calls.length;
 app.rerender(<AnalysisRunPanel workView="crew-chief" contextKey="team/session" onPresentation={present}/>);
 expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeInTheDocument();
 expect(fetcher).toHaveBeenCalledTimes(reads);
 fireEvent.change(screen.getByLabelText('Nota de validación'),{target:{value:'Medida pendiente de confirmar'}});
 app.rerender(<AnalysisRunPanel workView="rider" contextKey="team/session" onPresentation={present}/>);
 expect(screen.queryByRole('button',{name:'Registrar validación'})).not.toBeInTheDocument();
 app.rerender(<AnalysisRunPanel workView="crew-chief" contextKey="team/session" onPresentation={present}/>);
 expect(screen.getByLabelText('Nota de validación')).toHaveValue('Medida pendiente de confirmar');
});
it('all views retain stale authority blockers while reading views collapse diagnostics',async()=>{
 const stale={...validity,current:false,approvable:false,reasons:['designation_missing']};
 vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:{...run,status:'sealed'}});if(path.endsWith('/synthesis'))return reply({status:'succeeded',proposal_id:ids.b});if(path.includes('/authority'))return reply(stale);if(path.includes('/proposals/'))return reply(stored);if(path.includes('/snapshots/'))return reply({session_id:ids.session,session_revision:1,snapshot_digest:run.snapshot_digest,selection:{setup_a:{id:ids.a,revision:1},setup_b:{id:ids.b,revision:1}},analyzable:true,blocked_reasons:[]});if(path.includes('/events?'))return reply({items:[],next_cursor:null,recovery_unavailable:false});throw Error(path);}));
 const app=render(<AnalysisRunPanel workView="engineer"/>);
 await screen.findByRole('button',{name:'Aprobar propuesta'});
 for(const view of ['rider','management','mechanic','analyst','crew-chief','engineer'] as const){
  app.rerender(<AnalysisRunPanel workView={view}/>);
  expect(screen.getByRole('region',{name:'Autoridad actual de la propuesta'})).toHaveTextContent('designation_missing');
  expect(screen.getByRole('button',{name:'Consultar vigencia actual'})).toBeEnabled();
  if(view==='rider'||view==='management'){expect(screen.queryByRole('button',{name:'Aprobar propuesta'})).not.toBeInTheDocument();expect(screen.getByRole('table',{name:/Estados originales/})).not.toBeVisible();}
  else expect(screen.getByRole('button',{name:'Aprobar propuesta'})).toBeDisabled();
 }
});
it('discovers persisted run after cache loss and renders only server task states',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run});if(path.endsWith('/synthesis'))return reply({status:'not_requested',proposal_id:null,report:null});if(path.includes('/events?'))return reply({items:[],next_cursor:null,recovery_unavailable:false});throw Error(path);}));
  render(<AnalysisRunPanel/>);
  expect(await screen.findByText('Modelo no disponible')).toBeInTheDocument();
  expect(screen.getByText('No disponible')).toBeInTheDocument();
  expect(screen.queryByText('Agente trabajando')).not.toBeInTheDocument();
});
it('blocks profile/local authority and each action uses its own current server flag',()=>{
  const {rerender}=render(<HumanDecisionPanel stored={stored as any} validity={{...validity,approvable:false}} sessionRevision={1} events={[]} onRefresh={vi.fn()}/>);
  expect(screen.getByRole('button',{name:'Aprobar propuesta'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Rechazar propuesta'})).toBeEnabled();
  state.identity.mode='local';rerender(<HumanDecisionPanel stored={stored as any} validity={validity as any} sessionRevision={1} events={[]} onRefresh={vi.fn()}/>);
  expect(screen.getByRole('button',{name:'Aprobar propuesta'})).toBeDisabled();
});
it('keeps ambiguous decision operation and exact body across retry while double clicks send once',async()=>{
  let release!:(r:Response)=>void;const writes:any[]=[];
  vi.stubGlobal('fetch',vi.fn(async(_url,init)=>{writes.push(JSON.parse(String(init?.body)));if(writes.length===1)return new Promise<Response>(r=>release=r);return reply({id:ids.rider,kind:'decision',action:'approve'});}));
  render(<HumanDecisionPanel stored={stored as any} validity={validity as any} sessionRevision={1} events={[]} onRefresh={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Nota de decisión'),{target:{value:'Revisado'}});
  const button=screen.getByRole('button',{name:'Aprobar propuesta'});fireEvent.click(button);fireEvent.click(button);
  await waitFor(()=>expect(writes).toHaveLength(1));release(reply({detail:'Receipt unavailable'},503));
  await screen.findByRole('button',{name:'Recuperar decisión pendiente'});
  fireEvent.change(screen.getByLabelText('Nota de decisión'),{target:{value:'Otro texto'}});
  fireEvent.click(screen.getByRole('button',{name:'Recuperar decisión pendiente'}));
  await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[1]).toEqual(writes[0]);
  expect(writes[0].body).toEqual({expected_session_revision:1,expected_proposal_revision:2,expected_designation_revision:3,proposal_digest:'b'.repeat(64),snapshot_digest:'a'.repeat(64),action:'approve',note:'Revisado'});
});
it('reloads authority after a conflict and never creates a replacement signature',async()=>{
  const onRefresh=vi.fn();vi.stubGlobal('fetch',vi.fn(async()=>reply({detail:'stale'},409)));
  render(<HumanDecisionPanel stored={stored as any} validity={validity as any} sessionRevision={1} events={[]} onRefresh={onRefresh}/>);
  fireEvent.click(screen.getByRole('button',{name:'Aprobar propuesta'}));
  await waitFor(()=>expect(onRefresh).toHaveBeenCalledOnce());
  expect(await screen.findByRole('alert')).toHaveTextContent('contexto ha cambiado');
});
it('clears late old-scope run and report state on workspace epoch change',async()=>{
  let finish!:(r:Response)=>void;
  vi.stubGlobal('fetch',vi.fn(async(input)=>String(input).endsWith('/runs/current')?new Promise<Response>(r=>finish=r):reply({items:[],next_cursor:null,recovery_unavailable:false})));
  const {rerender}=render(<AnalysisRunPanel/>);await waitFor(()=>expect(finish).toBeDefined());
  state.context={...state.context,workspaceEpoch:1,session:null};rerender(<AnalysisRunPanel/>);finish(reply({run}));
  await waitFor(()=>expect(screen.queryByText('Modelo no disponible')).not.toBeInTheDocument());
  expect(screen.getByText(/Selecciona una sesión de ingeniería/)).toBeInTheDocument();
});
it('designation admin uses actual paginated member UUIDs and server revisions',async()=>{
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(input,init)=>{
    if(init?.method==='PUT'){writes.push(JSON.parse(String(init.body)));return reply({team_id:state.identity.team,primary_id:state.identity.user,substitute_id:null,revision:5});}
    if(String(input).includes('/candidates?'))return reply({items:[{user_id:state.identity.user,role:'admin'}],next_cursor:null});
    return reply({team_id:state.identity.team,primary_id:null,substitute_id:null,revision:4});
  }));
  render(<DesignationSettings/>);const select=await screen.findByLabelText('Titular humano');
  await within(select).findByRole('option',{name:new RegExp(state.identity.user)});fireEvent.change(select,{target:{value:state.identity.user}});fireEvent.click(screen.getByRole('button',{name:'Guardar designación'}));
  await waitFor(()=>expect(writes).toEqual([{primary_id:state.identity.user,substitute_id:null,expected_revision:4}]));
});
it('starts only from persisted Task9 selection through POST snapshot then POST run',async()=>{
  const selection={recordings:[{id:ids.recording,geometry_revision:null,interval_s:['1.25','8']}],comparison:{id:ids.comparison,revision:1},setup_a:{id:ids.a,revision:3},setup_b:{id:ids.b,revision:4},binding:null,calibration:null,validation:null,environment:null};
  state.context.association={session_id:ids.session,session_revision:1,recording:{id:ids.recording,sha256:'a'.repeat(64)},selection};
  const writes:{path:string;body:any}[]=[];let current:any=null;
  vi.stubGlobal('fetch',vi.fn(async(input,init)=>{const path=String(input);
    if(path.endsWith('/runs/reconcile'))return reply({session_id:ids.session,starts:[]});
    if(init?.method==='POST'){const body=JSON.parse(String(init.body));writes.push({path,body});if(path.endsWith('/snapshots'))return reply({id:ids.comparison,session_id:ids.session,session_revision:1,analyzable:false,blocked_reasons:['comparison_missing']});if(path.endsWith('/runs')){current=run;return reply(run);}}
    if(path.endsWith('/runs/current'))return reply({run:current});if(path.endsWith('/synthesis'))return reply({status:'not_requested',proposal_id:null,report:null});return reply({items:[],next_cursor:null,recovery_unavailable:false});
  }));
  render(<AnalysisRunPanel/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Iniciar análisis'}));fireEvent.click(screen.getByRole('button',{name:'Iniciar análisis'}));
  await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[0].body.selection).toEqual(selection);expect(writes[0].body.expected_revision).toBe(1);expect(writes[1].body).toMatchObject({snapshot_id:ids.comparison,expected_revision:1,config:{analysis_version:'2.0.0',retry_of:null}});expect(writes[0].body.operation_id).not.toBe(writes[1].body.operation_id);
  expect(await screen.findByText('comparison_missing')).toBeInTheDocument();
});
it('continues opaque event pagination through an empty page and exposes receipt recovery',async()=>{
  const cursors:string[]=[];vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:null});if(path.includes('/events?')){cursors.push(path);return reply({items:[],next_cursor:cursors.length===1?'scope+opaque/=?':null,recovery_unavailable:true});}throw Error(path);}));
  render(<AnalysisRunPanel/>);fireEvent.click(await screen.findByRole('button',{name:'Cargar más eventos'}));
  await waitFor(()=>expect(cursors).toHaveLength(2));expect(cursors[1]).toContain('&after=scope%2Bopaque%2F%3D%3F');expect(screen.getByText(/Recuperación de recibos no disponible/)).toBeInTheDocument();
});
it('polls every five seconds only while visible and active, and cancellation rejects a late running response',async()=>{
  let reads=0,late!:(r:Response)=>void;vi.stubGlobal('fetch',vi.fn(async(input,init)=>{const path=String(input);if(path.endsWith('/runs/current')){reads++;if(reads===2)return new Promise<Response>(r=>late=r);return reply({run});}if(path.endsWith('/cancel')&&init?.method==='POST')return reply({...run,status:'cancelled'});if(path.endsWith('/synthesis'))return reply({status:'not_requested',proposal_id:null,report:null});return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  vi.useFakeTimers();await act(async()=>{render(<AnalysisRunPanel/>);await vi.advanceTimersByTimeAsync(0);});expect(screen.getByText('Modelo no disponible')).toBeInTheDocument();vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden');
  await act(async()=>{await vi.advanceTimersByTimeAsync(4000);});expect(reads).toBe(1);
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');await act(async()=>{await vi.advanceTimersByTimeAsync(5000);});expect(reads).toBe(2);
  await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Cancelar ejecución'}));});
  await act(async()=>{late(reply({run}));});expect(screen.getByText('Ejecución Cancelado')).toBeInTheDocument();
  await act(async()=>{await vi.advanceTimersByTimeAsync(4000);});expect(reads).toBe(2);vi.useRealTimers();
});
it('offers the frozen baseline returned by server for an approved measurement proposal',()=>{
  render(<HumanDecisionPanel stored={stored as any} validity={{...validity,approved_current:true}} sessionRevision={1} events={[]} frozenSetups={[{id:ids.a,revision:3}]} onRefresh={vi.fn()}/>);
  expect(within(screen.getByLabelText('Setup realmente montado')).getByRole('option',{name:`${ids.a} · r3`})).toBeInTheDocument();
  expect(screen.getByRole('button',{name:'Registrar aplicación'})).toBeDisabled();
});
it('recovers initial run and events after StrictMode effect replay',async()=>{
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run});if(path.endsWith('/synthesis'))return reply({status:'not_requested',proposal_id:null,report:null});return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  render(<StrictMode><AnalysisRunPanel/></StrictMode>);
  expect(await screen.findByText('Modelo no disponible')).toBeInTheDocument();
  expect(await screen.findByText(/0 eventos cargados/)).toBeInTheDocument();
  await waitFor(()=>expect(screen.queryByText('Consultando ejecución persistida…')).not.toBeInTheDocument());
});
it('exports and prints only the report read back from persistence, then clears private artifacts on scope change',async()=>{
  const saved={schema_version:'1.0.0',id:ids.rider,session_id:ids.session,session_revision:1,created_at:'2026-10-25T10:00:00Z',context:{revision:1},snapshot:null,run:null,branches:[],synthesis:null,proposal:null,human_events:[],current_validity:null,limitations:['human_events_paginated_use_events_route'],content_digest:'c'.repeat(64)};
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(input,init)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:null});if(path.endsWith('/reports')&&init?.method==='POST'){writes.push(JSON.parse(String(init.body)));return reply({...saved,content_digest:'unconfirmed-create-reply'});}if(path.endsWith('/reports/'+ids.rider))return reply(saved);return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  const {rerender}=render(<AnalysisRunPanel/>);expect(screen.queryByRole('button',{name:'Descargar informe de ingeniería JSON'})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Guardar nueva versión del informe'}));
  await screen.findByRole('button',{name:'Descargar informe de ingeniería JSON'});expect(writes).toEqual([{revision:1}]);expect(screen.queryByText('unconfirmed-create-reply')).not.toBeInTheDocument();
  const url=vi.fn((_blob:Blob)=> 'blob:report-test'),revoke=vi.fn();Object.defineProperty(URL,'createObjectURL',{configurable:true,value:url});Object.defineProperty(URL,'revokeObjectURL',{configurable:true,value:revoke});vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
  fireEvent.click(screen.getByRole('button',{name:'Descargar informe de ingeniería JSON'}));const blob=url.mock.calls[0][0] as Blob;const contents=await new Promise<string>(resolve=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.readAsText(blob);});expect(JSON.parse(contents)).toEqual(saved);expect(revoke).toHaveBeenCalledWith('blob:report-test');
  const getWindow=Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype,'contentWindow')!.get!;
  vi.spyOn(HTMLIFrameElement.prototype,'contentWindow','get').mockImplementation(function(this:HTMLIFrameElement){const view=getWindow.call(this);if(view){view.print=vi.fn();view.focus=vi.fn();}return view;});
  fireEvent.click(screen.getByRole('button',{name:'Imprimir informe de ingeniería'}));
  const frame=document.querySelector<HTMLIFrameElement>('iframe[title="Informe de ingeniería persistido"]');expect(frame).not.toBeNull();expect(frame!.contentDocument!.querySelector('pre')!.textContent).toBe(JSON.stringify(saved,null,2));
  state.context={...state.context,scope:'other-team',session:null};rerender(<AnalysisRunPanel/>);expect(screen.queryByRole('button',{name:'Descargar informe de ingeniería JSON'})).not.toBeInTheDocument();expect(document.querySelector('iframe[title="Informe de ingeniería persistido"]')).toBeNull();
});
it('blocks starting against dirty or saving workspace even when a persisted association exists',async()=>{
  state.context.association={session_id:ids.session,session_revision:1,selection:{recordings:[]}};
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(_input,init)=>{if(init?.method==='POST')writes.push(init.body);return reply(init?.method==='POST'?{}:{run:null,items:[],next_cursor:null,recovery_unavailable:false});}));
  const {rerender}=render(<AnalysisRunPanel/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeEnabled());
  state.dirty=true;rerender(<AnalysisRunPanel/>);expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Iniciar análisis'}));expect(writes).toHaveLength(0);
  state.dirty=false;state.context={...state.context,busy:true};rerender(<AnalysisRunPanel/>);expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeDisabled();
});
it('reloads a conflicting designation and keeps the conflict visible for the admin',async()=>{
  let revision=4;vi.stubGlobal('fetch',vi.fn(async(input,init)=>{if(init?.method==='PUT'){revision=5;return reply({detail:'stale'},409);}if(String(input).includes('/candidates?'))return reply({items:[{user_id:state.identity.user,role:'admin'}],next_cursor:null});return reply({team_id:state.identity.team,primary_id:null,substitute_id:null,revision});}));
  render(<DesignationSettings/>);const select=await screen.findByLabelText('Titular humano');await within(select).findByRole('option',{name:new RegExp(state.identity.user)});fireEvent.change(select,{target:{value:state.identity.user}});fireEvent.click(screen.getByRole('button',{name:'Guardar designación'}));
  expect(await screen.findByText(/Designación vigente r5/)).toBeInTheDocument();expect(screen.getByRole('alert')).toHaveTextContent('contexto ha cambiado');
});
it('does not grant any decision to a non-designated engineer even if publication says approvable',()=>{
  render(<HumanDecisionPanel stored={{...stored,approvable:true} as any} validity={{...validity,primary_id:ids.recording}} sessionRevision={1} events={[]} onRefresh={vi.fn()}/>);
  for(const name of ['Aprobar propuesta','Rechazar propuesta','Solicitar revisión'])expect(screen.getByRole('button',{name})).toBeDisabled();
});
it('retries the failed event page with its exact opaque cursor',async()=>{
  const pages:string[]=[];vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:null});pages.push(path);if(pages.length===2)return reply({detail:'temporarily unavailable'},503);return reply({items:[],next_cursor:'opaque/page+',recovery_unavailable:false});}));
  render(<AnalysisRunPanel/>);fireEvent.click(await screen.findByRole('button',{name:'Cargar más eventos'}));await screen.findByText('temporarily unavailable');fireEvent.click(screen.getByRole('button',{name:'Reintentar página de eventos'}));
  await waitFor(()=>expect(pages).toHaveLength(3));expect(pages[2]).toBe(pages[1]);
});
it('records an explicit mounted frozen setup with timezone-aware past time, without applying on approval',async()=>{
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(input,init)=>{writes.push({path:String(input),body:JSON.parse(String(init?.body))});return reply({id:ids.rider,kind:'application'});}));
  render(<HumanDecisionPanel stored={stored as any} validity={{...validity,approved_current:true}} sessionRevision={1} events={[]} frozenSetups={[{id:ids.a,revision:3}]} onRefresh={vi.fn()}/>);
  expect(writes).toHaveLength(0);fireEvent.change(screen.getByLabelText('Setup realmente montado'),{target:{value:`${ids.a}:3`}});fireEvent.change(screen.getByLabelText('Nota del montaje'),{target:{value:'Montado por el equipo'}});fireEvent.change(screen.getByLabelText('Fecha de montaje con zona horaria'),{target:{value:'2099-10-25T10:00:00Z'}});expect(screen.getByRole('button',{name:'Registrar aplicación'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Fecha de montaje con zona horaria'),{target:{value:'2026-10-24T10:00:00Z'}});fireEvent.click(screen.getByRole('button',{name:'Registrar aplicación'}));
  await waitFor(()=>expect(writes).toHaveLength(1));expect(writes[0].path).toMatch(/\/applications$/);expect(writes[0].body.body).toEqual({expected_session_revision:1,expected_proposal_revision:2,expected_designation_revision:3,proposal_digest:'b'.repeat(64),snapshot_digest:'a'.repeat(64),setup:{id:ids.a,revision:3},mounted_at:'2026-10-24T10:00:00Z',note:'Montado por el equipo'});
});
it('validates separately against owned new evidence after the actual application',async()=>{
  const application={schema_version:'1.0.0',id:ids.rider,kind:'application',action:null,actor_id:state.identity.user,designation_revision:3,created_at:'2026-10-24T10:00:00Z',generation:1,authority_proposal_id:ids.a,proposal_digest:'b'.repeat(64),snapshot_digest:'a'.repeat(64),parent_event_id:ids.recording,payload:{mounted_at:'2026-10-24T10:00:00Z'},proposal_id:ids.b,proposal_revision:2,session_id:ids.session,operation_id:ids.circuit};
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(input,init)=>{if(init?.method==='POST'){writes.push({path:String(input),body:JSON.parse(String(init.body))});return reply({...application,id:ids.b,kind:'validation'});}if(String(input).includes('/proposals/'))return reply(stored);if(String(input).endsWith('/settings/crew-chief'))return reply({team_id:state.identity.team,revision:3,primary_id:state.identity.user,substitute_id:null});return reply({id:ids.comparison,session_id:ids.session,created_at:'2026-10-24T11:00:00Z',selection:{comparison:{id:ids.comparison,revision:1}}});}));
  render(<HistoricalValidationPanel sessionId={ids.session} events={[application as any]} onRefresh={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Aplicación a validar'),{target:{value:ids.rider}});fireEvent.change(screen.getByLabelText('Snapshot persistido de nueva evidencia'),{target:{value:ids.comparison}});fireEvent.change(screen.getByLabelText('IDs de evidencia (1–30 únicos)'),{target:{value:ids.recording}});fireEvent.change(screen.getByLabelText('Fecha de validación con zona horaria'),{target:{value:'2026-10-24T12:00:00Z'}});fireEvent.change(screen.getByLabelText('Nota de validación'),{target:{value:'Resultado observado inconcluso'}});await waitFor(()=>expect(screen.getByRole('button',{name:'Registrar validación'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Registrar validación'}));
  await waitFor(()=>expect(writes).toHaveLength(1));expect(writes[0].path).toMatch(new RegExp('/applications/'+ids.rider+'/validations$'));expect(writes[0].body.body).toEqual({expected_designation_revision:3,evidence_snapshot_id:ids.comparison,evidence_ids:[ids.recording],validated_at:'2026-10-24T12:00:00Z',outcome:'inconclusive',note:'Resultado observado inconcluso'});
});
it('loads current authority separately from historical publication and disables malformed conflict evidence',async()=>{
  const proposal={...stored,proposal:{...stored.proposal,source_status:['experimental'],matrix:{...stored.proposal.matrix,conflicts:[{code:'hypothesis_difference',topic:'trail_m',sources:['chassis','mechanical-check']}]}}};
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:{...run,status:'sealed'}});if(path.endsWith('/synthesis'))return reply({status:'succeeded',proposal_id:ids.b,report:null});if(path.includes('/authority?revision=2'))return reply(validity);if(path.endsWith('/proposals/'+ids.b))return reply(proposal);if(path.endsWith('/snapshots/'+ids.comparison))return reply({id:ids.comparison,session_id:ids.session,session_revision:1,snapshot_digest:'a'.repeat(64),analyzable:true,blocked_reasons:[],selection:{setup_a:{id:ids.a,revision:3},setup_b:{id:ids.b,revision:4}}});return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  render(<AnalysisRunPanel/>);expect(await screen.findByRole('button',{name:'Aprobar propuesta'})).toBeEnabled();expect(screen.getByRole('note')).toHaveTextContent('2D experimental sigue bloqueando actuaciones físicas');
  fireEvent.change(screen.getByLabelText('Justificación de resolución'),{target:{value:'Necesita evidencia adicional'}});fireEvent.change(screen.getByLabelText('IDs de evidencia de la resolución'),{target:{value:'invented-from-filename'}});expect(screen.getByRole('button',{name:'Guardar revisión de resolución'})).toBeDisabled();
});
it('drops a former proposal when current-run changes and the new synthesis cannot be read',async()=>{
  let changed=false;vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run:{...run,run_id:changed?ids.recording:run.run_id,status:'sealed'}});if(path.endsWith('/synthesis'))return changed?reply({detail:'new synthesis unavailable'},503):reply({status:'succeeded',proposal_id:ids.b,report:null});if(path.includes('/authority?revision=2'))return reply(validity);if(path.endsWith('/proposals/'+ids.b))return reply(stored);if(path.endsWith('/snapshots/'+ids.comparison))return reply({id:ids.comparison,session_id:ids.session,session_revision:1,snapshot_digest:'a'.repeat(64),analyzable:true,blocked_reasons:[],selection:{setup_a:null,setup_b:null}});return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  render(<AnalysisRunPanel/>);await screen.findByRole('button',{name:'Aprobar propuesta'});changed=true;fireEvent.click(screen.getByRole('button',{name:'Recargar análisis y autoridad'}));await screen.findByText('new synthesis unavailable');expect(screen.queryByRole('button',{name:'Aprobar propuesta'})).not.toBeInTheDocument();
});
it('allows correcting validation evidence rejected before any human write was attempted',async()=>{
  const application=historicalApplication;
  const writes:any[]=[];vi.stubGlobal('fetch',vi.fn(async(input,init)=>{if(init?.method==='POST')writes.push(init.body);if(String(input).includes('/proposals/'))return reply(stored);if(String(input).endsWith('/settings/crew-chief'))return reply({team_id:state.identity.team,revision:3,primary_id:state.identity.user,substitute_id:null});return reply({session_id:ids.second,created_at:'2026-10-24T11:00:00Z',selection:{comparison:{id:ids.comparison,revision:1}}});}));
  render(<HistoricalValidationPanel sessionId={ids.session} events={[application as any]} onRefresh={vi.fn()}/>);
  for(const [label,value] of [['Aplicación a validar',ids.rider],['Snapshot persistido de nueva evidencia',ids.comparison],['IDs de evidencia (1–30 únicos)',ids.recording],['Fecha de validación con zona horaria','2026-10-24T12:00:00Z'],['Nota de validación','Evidencia por contrastar']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Registrar validación'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Registrar validación'}));await screen.findByText(/Selecciona evidencia de la misma sesión/);expect(writes).toHaveLength(0);expect(screen.queryByRole('button',{name:'Recuperar validación pendiente'})).not.toBeInTheDocument();
});
it('shows the persisted resolution and its indexed evidence before deciding a revised server proposal',async()=>{
  const note='Contrastar el avance con la medida congelada de la revisión anterior.';
  const revised={...stored,proposal:{...stored.proposal,revision:3,resolution:{expected_revision:2,note,evidence_ids:[ids.circuit]}}};
  const writes:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(input,init)=>{
    const path=String(input);if(init?.method==='POST')writes.push(path);
    if(path.endsWith('/runs/current'))return reply({run:{...run,status:'sealed'}});
    if(path.endsWith('/synthesis'))return reply({status:'succeeded',proposal_id:ids.b,report:null});
    if(path.endsWith('/proposals/'+ids.b))return reply(revised);
    if(path.includes('/authority?revision=3'))return reply({...validity,proposal_revision:3});
    if(path.endsWith('/snapshots/'+ids.comparison))return reply({id:ids.comparison,session_id:ids.session,session_revision:1,snapshot_digest:'a'.repeat(64),analyzable:true,blocked_reasons:[],selection:{setup_a:null,setup_b:null}});
    return reply({items:[],next_cursor:null,recovery_unavailable:false});
  }));
  render(<AnalysisRunPanel/>);
  const approve=await screen.findByRole('button',{name:'Aprobar propuesta'});
  const resolution=screen.getByRole('region',{name:'Resolución persistida'});
  const rationale=within(resolution).getByText(note);
  expect(rationale).toBeVisible();expect(within(resolution).getByText('Revisión de referencia: 2')).toBeVisible();
  expect(rationale.compareDocumentPosition(approve)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const link=within(resolution).getByRole('link',{name:`Evidencia de resolución ${ids.circuit}`});
  expect(link).toHaveAttribute('href',`#engineering-evidence-${ids.circuit}`);
  expect(document.getElementById(`engineering-evidence-${ids.circuit}`)).toHaveTextContent(ids.circuit);
  expect(approve).toBeEnabled();expect(writes).toHaveLength(0);
});


const historicalApplication={schema_version:'1.0.0',id:ids.rider,kind:'application',action:null,actor_id:state.identity.user,designation_revision:3,created_at:'2026-10-24T10:00:00Z',generation:1,authority_proposal_id:ids.a,proposal_digest:'b'.repeat(64),snapshot_digest:'a'.repeat(64),parent_event_id:ids.recording,payload:{mounted_at:'2026-10-24T10:00:00Z'},proposal_id:ids.b,proposal_revision:2,session_id:ids.session,operation_id:ids.circuit};
it.each([false,true])('validates P1 after remount at context r2 with P2=%s using historical revision and current designation',async(newProposal)=>{
  const calls:string[]=[],writes:any[]=[];
  state.context.session={...session(),revision:2};
  vi.stubGlobal('fetch',vi.fn(async(input,init)=>{
    const path=String(input);calls.push(path);
    if(path.endsWith('/runs/current'))return reply({run:newProposal?{...run,status:'sealed'}:null});
    if(path.endsWith('/synthesis'))return reply({status:'succeeded',proposal_id:ids.circuit,report:null});
    if(path.endsWith('/proposals/'+ids.circuit))return reply({...stored,proposal_id:ids.circuit});
    if(path.includes('/proposals/'+ids.circuit+'/authority'))return reply({...validity,proposal_id:ids.circuit});
    if(path.endsWith('/proposals/'+ids.b+'?revision=2'))return reply(stored);
    if(path.endsWith('/settings/crew-chief'))return reply({team_id:state.identity.team,revision:4,primary_id:state.identity.user,substitute_id:null});
    if(path.endsWith('/snapshots/'+ids.comparison))return reply({id:ids.comparison,session_id:ids.session,session_revision:2,snapshot_digest:'a'.repeat(64),created_at:'2026-10-24T11:00:00Z',analyzable:true,blocked_reasons:[],selection:{comparison:{id:ids.comparison,revision:1},setup_a:null,setup_b:null}});
    if(path.endsWith('/validations')){writes.push(JSON.parse(String(init?.body)));return reply({...historicalApplication,kind:'validation'});}
    if(path.includes('/events?'))return reply({items:[historicalApplication],next_cursor:null,recovery_unavailable:false});
    throw Error(path);
  }));
  render(<AnalysisRunPanel/>);
  const select=await screen.findByLabelText('Aplicación a validar');await within(select).findByRole('option',{name:new RegExp(ids.rider)});
  fireEvent.change(select,{target:{value:ids.rider}});
  for(const [label,value] of [['Snapshot persistido de nueva evidencia',ids.comparison],['IDs de evidencia (1–30 únicos)',ids.recording],['Fecha de validación con zona horaria','2026-10-24T12:00:00Z'],['Nota de validación','Medida posterior']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  const button=screen.getByRole('button',{name:'Registrar validación'});await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button);
  await waitFor(()=>expect(writes).toHaveLength(1));expect(writes[0].body.expected_designation_revision).toBe(4);expect(calls).toContainEqual(expect.stringContaining('/proposals/'+ids.b+'?revision=2'));
  if(!newProposal)expect(screen.queryByRole('button',{name:'Aprobar propuesta'})).not.toBeInTheDocument();
});
it('reconciles a persisted pending start after remount before another snapshot, retaining block on unavailable authority',async()=>{
  state.context.association={session_id:ids.session,session_revision:1,selection:{recordings:[]}};
  let available=false;const calls:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);calls.push(path);if(path.endsWith('/runs/reconcile'))return available?reply({session_id:ids.session,starts:[]}):reply({detail:'Authority reconciliation unavailable'},503);if(path.endsWith('/runs/current'))return reply({run:null});if(path.includes('/events?'))return reply({items:[],next_cursor:null,recovery_unavailable:false});throw Error(path);}));
  const first=render(<AnalysisRunPanel/>);first.unmount();render(<AnalysisRunPanel/>);
  const recover=await screen.findByRole('button',{name:'Reconciliar inicios persistidos'});fireEvent.click(recover);
  await screen.findByText('Authority reconciliation unavailable');expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeDisabled();expect(calls.some(p=>p.endsWith('/snapshots'))).toBe(false);
  available=true;fireEvent.click(recover);await waitFor(()=>expect(state.context.reload).toHaveBeenCalled());
  expect(calls.filter(p=>p.endsWith('/runs/reconcile'))).toHaveLength(2);expect(calls.lastIndexOf(calls.find(p=>p.endsWith('/runs/current'))!)).toBeGreaterThan(calls.map(p=>p.endsWith('/runs/reconcile')).lastIndexOf(true));
});

it('preserves an ambiguous start body in memory and reconciles its persisted fence after losing component state',async()=>{
  state.context.association={session_id:ids.session,session_revision:1,selection:{recordings:[]}};
  let pending=false,available=false;const starts:any[]=[],snapshots:any[]=[],sequence:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(input,init)=>{
    const path=String(input);sequence.push(path);
    if(path.endsWith('/runs/current'))return reply({run:null});
    if(path.includes('/events?'))return reply({items:[],next_cursor:null,recovery_unavailable:false});
    if(path.endsWith('/runs/reconcile')){
      if(pending&&!available)return reply({detail:'Authority reconciliation unavailable'},503);
      const recovered=pending?[{operation_id:starts[0].operation_id,run_id:ids.second,status:'superseded',generation:2}]:[];pending=false;return reply({session_id:ids.session,starts:recovered});
    }
    if(path.endsWith('/snapshots')){snapshots.push(JSON.parse(String(init?.body)));return reply({id:ids.comparison,session_id:ids.session,session_revision:1,analyzable:false,blocked_reasons:[]});}
    if(path.endsWith('/runs')){starts.push(JSON.parse(String(init?.body)));pending=true;return reply({detail:'Committed fence reply lost'},503);}
    throw Error(path);
  }));
  const first=render(<AnalysisRunPanel/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Iniciar análisis'}));
  fireEvent.click(await screen.findByRole('button',{name:'Recuperar inicio pendiente'}));await waitFor(()=>expect(starts).toHaveLength(2));expect(starts[1]).toEqual(starts[0]);expect(snapshots).toHaveLength(1);
  first.unmount();render(<AnalysisRunPanel/>);fireEvent.click(await screen.findByRole('button',{name:'Reconciliar inicios persistidos'}));await screen.findByText('Authority reconciliation unavailable');expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeDisabled();expect(pending).toBe(true);
  available=true;fireEvent.click(screen.getByRole('button',{name:'Reconciliar inicios persistidos'}));await screen.findByText('Inicios reconciliados. Contexto y ejecución recargados.');expect(pending).toBe(false);expect(snapshots).toHaveLength(1);expect(starts).toHaveLength(2);expect(state.context.reload).toHaveBeenCalled();
});
it('does not snapshot over a concurrent run discovered during authenticated reconciliation',async()=>{
  state.context.association={session_id:ids.session,session_revision:1,selection:{recordings:[]}};let concurrent=false;const snapshots:string[]=[];
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/reconcile')){concurrent=true;return reply({session_id:ids.session,starts:[]});}if(path.endsWith('/runs/current'))return reply({run:concurrent?run:null});if(path.endsWith('/snapshots'))snapshots.push(path);if(path.endsWith('/synthesis'))return reply({status:'not_requested',proposal_id:null,report:null});return reply({items:[],next_cursor:null,recovery_unavailable:false});}));
  render(<AnalysisRunPanel/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Iniciar análisis'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Iniciar análisis'}));await screen.findByText('Modelo no disponible');expect(snapshots).toHaveLength(0);
});
it.each(['foreign_proposal','non_designated','authority_unavailable'])('blocks historical validation for %s',async(reason)=>{
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.includes('/proposals/'))return reply(reason==='foreign_proposal'?{...stored,proposal_digest:'c'.repeat(64)}:stored);if(reason==='authority_unavailable')return reply({detail:'Authority unavailable'},503);return reply({team_id:state.identity.team,revision:4,primary_id:reason==='non_designated'?ids.circuit:state.identity.user,substitute_id:null});}));
  render(<HistoricalValidationPanel sessionId={ids.session} events={[historicalApplication as any]} onRefresh={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText('Aplicación a validar'),{target:{value:ids.rider}});
  for(const [label,value] of [['Snapshot persistido de nueva evidencia',ids.comparison],['IDs de evidencia (1–30 únicos)',ids.recording],['Fecha de validación con zona horaria','2026-10-24T12:00:00Z'],['Nota de validación','Medida posterior']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));expect(screen.getByRole('button',{name:'Registrar validación'})).toBeDisabled();
});
it('historical validation retries the exact parent and body after an ambiguous write',async()=>{
  const writes:any[]=[];
  vi.stubGlobal('fetch',vi.fn(async(input,init)=>{const path=String(input);if(path.includes('/proposals/'))return reply(stored);if(path.endsWith('/settings/crew-chief'))return reply({team_id:state.identity.team,revision:4,primary_id:state.identity.user,substitute_id:null});if(path.includes('/snapshots/'))return reply({id:ids.comparison,session_id:ids.session,created_at:'2026-10-24T11:00:00Z',selection:{comparison:{id:ids.comparison,revision:1}}});writes.push({path,body:JSON.parse(String(init?.body))});return writes.length===1?reply({detail:'Receipt unavailable'},503):reply({...historicalApplication,kind:'validation'});}));
  render(<HistoricalValidationPanel sessionId={ids.session} events={[historicalApplication as any]} onRefresh={vi.fn()}/>);
  for(const [label,value] of [['Aplicación a validar',ids.rider],['Snapshot persistido de nueva evidencia',ids.comparison],['IDs de evidencia (1–30 únicos)',ids.recording],['Fecha de validación con zona horaria','2026-10-24T12:00:00Z'],['Nota de validación','Medida posterior']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Registrar validación'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Registrar validación'}));
  fireEvent.click(await screen.findByRole('button',{name:'Recuperar validación pendiente'}));await waitFor(()=>expect(writes).toHaveLength(2));expect(writes[1]).toEqual(writes[0]);
});

it('aborts a validation write on unmount even if an event refresh started a newer authority read',async()=>{
  let finish!:(response:Response)=>void;const refreshed=vi.fn();
  vi.stubGlobal('fetch',vi.fn(async(input)=>{const path=String(input);if(path.includes('/proposals/'))return reply(stored);if(path.endsWith('/settings/crew-chief'))return reply({team_id:state.identity.team,revision:4,primary_id:state.identity.user,substitute_id:null});if(path.includes('/snapshots/'))return reply({id:ids.comparison,session_id:ids.session,created_at:'2026-10-24T11:00:00Z',selection:{comparison:{id:ids.comparison,revision:1}}});return new Promise<Response>(resolve=>finish=resolve);}));
  const view=render(<HistoricalValidationPanel sessionId={ids.session} events={[historicalApplication as any]} onRefresh={refreshed}/>);
  for(const [label,value] of [['Aplicación a validar',ids.rider],['Snapshot persistido de nueva evidencia',ids.comparison],['IDs de evidencia (1–30 únicos)',ids.recording],['Fecha de validación con zona horaria','2026-10-24T12:00:00Z'],['Nota de validación','Medida posterior']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
  await waitFor(()=>expect(screen.getByRole('button',{name:'Registrar validación'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Registrar validación'}));await waitFor(()=>expect(finish).toBeDefined());
  view.rerender(<HistoricalValidationPanel sessionId={ids.session} events={[{...historicalApplication} as any]} onRefresh={refreshed}/>);view.unmount();
  await act(async()=>finish(reply({...historicalApplication,kind:'validation'})));expect(refreshed).not.toHaveBeenCalled();
});

it('leaves request budget for human actions during a minute of active analysis',async()=>{
 const fetcher=vi.fn(async(input)=>{const path=String(input);if(path.endsWith('/runs/current'))return reply({run});if(path.endsWith('/synthesis'))return reply({status:'running',proposal_id:null,report:null});return reply({items:[],next_cursor:null,recovery_unavailable:false});});
 vi.stubGlobal('fetch',fetcher);vi.useFakeTimers();
 await act(async()=>{render(<AnalysisRunPanel/>);await vi.advanceTimersByTimeAsync(0);});
 await act(async()=>{await vi.advanceTimersByTimeAsync(60000);});
 // Production allows 60 calls/minute per human, across every session and team.
 // Polling alone must leave at least 20 requests for reads and decisions.
 expect(fetcher.mock.calls.length).toBeLessThanOrEqual(40);
});
