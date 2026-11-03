import {beforeEach,expect,it,vi} from 'vitest';
import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {candidate,delivery,sessionId,snapshotId,task,teamId,userId} from '../../../../tests/workboardFixtures';
import type {EngineeringSession} from '../../../domain/engineeringSession';
const identity=vi.hoisted(()=>({mode:'authenticated',team:'10000000-0000-4000-8000-000000000001',user:'10000000-0000-4000-8000-000000000002',role:'engineer',generation:1}));
vi.mock('../../../services/telemetryIdentity',()=>({identitySnapshot:()=>({...identity})}));
vi.mock('../../../services/sessionWorkboard',async(importOriginal)=>({...await importOriginal<typeof import('../../../services/sessionWorkboard')>(),getBoard:vi.fn(),getLatestReview:vi.fn(),getDecision:vi.fn(),createTask:vi.fn(),transitionTask:vi.fn(),assignTask:vi.fn(),submitTask:vi.fn(),decideReview:vi.fn()}));
vi.mock('../../../services/engineeringSession',()=>({getDesignation:vi.fn(),getCurrentAnalysisRun:vi.fn(),getAnalysisSnapshot:vi.fn()}));
import * as api from '../../../services/sessionWorkboard';
import * as engineering from '../../../services/engineeringSession';
import {SessionWorkboard} from './SessionWorkboard';
import {WorkspaceDraftProvider} from '../../../context/WorkspaceDraftContext';
const session:EngineeringSession={schema_version:'1.0.0',id:sessionId,revision:1,name:'Tanda DR7 · ensayo de interfaz',session_type:'practice',provenance:'synthetic',other_label:null,circuit:null,bike:null,rider:null,notes:'',team_id:teamId,created_by:userId,created_at:'2026-11-03T10:00:00Z'};
beforeEach(()=>{vi.clearAllMocks();Object.assign(identity,{team:teamId,user:userId,role:'engineer',mode:'authenticated',generation:1});vi.mocked(api.getBoard).mockResolvedValue([task()]);vi.mocked(engineering.getDesignation).mockResolvedValue({team_id:teamId,primary_id:userId,substitute_id:null,revision:1});vi.mocked(api.getDecision).mockResolvedValue(null);});
function view(){return render(<SessionWorkboard session={session} scope="qa"/>);}
it('shows real task criteria, separate unknown estimates and role filter',async()=>{
 vi.mocked(api.getBoard).mockResolvedValue([task(),task({id:crypto.randomUUID(),title:'Contrastar GPS',target_profile:'analyst'})]);view();
 fireEvent.click(screen.getByText('Trabajo de la sesión'));
 expect(await screen.findByRole('button',{name:'Medir recorrido delantero'})).toBeVisible();
 fireEvent.change(screen.getByLabelText('Filtrar por perfil'),{target:{value:'mechanic'}});
 expect(screen.queryByRole('button',{name:'Contrastar GPS'})).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Medir recorrido delantero'}));
 expect(screen.getByText(candidate.acceptance)).toBeVisible();
 expect(screen.getByText('Ejecución: sin estimar')).toBeVisible();expect(screen.getByText('Revisión: sin estimar')).toBeVisible();
});
it('uses accessible transition buttons and keeps server revision on conflict',async()=>{
 vi.mocked(api.transitionTask).mockRejectedValue(new api.WorkboardRequestError(409));view();fireEvent.click(screen.getByText('Trabajo de la sesión'));
 fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));
 fireEvent.click(screen.getByRole('button',{name:'Pasar a pendientes'}));
 expect(await screen.findByRole('alert')).toHaveTextContent(/cambió/);
 expect(api.transitionTask).toHaveBeenCalledWith(task(),'pending',null,expect.any(String),expect.any(AbortSignal));
 expect(screen.queryByRole('button',{name:'Iniciar tarea'})).not.toBeInTheDocument();
});
it('opens a stored review and sends only explicit human acceptance',async()=>{
 vi.mocked(api.getBoard).mockResolvedValue([task({state:'in_review',revision:4})]);vi.mocked(api.getLatestReview).mockResolvedValue(delivery());
 vi.mocked(api.decideReview).mockResolvedValue({schema_version:'1.0.0',id:crypto.randomUUID(),team_id:teamId,review_id:delivery().review.id,delivery_digest:delivery().digest,actor_id:userId,designation_role:'primary',designation_revision:1,action:'accept',note:'Lecturas revisadas',created_at:'2026-11-03T10:00:00Z',task:task({state:'closed',revision:5}),digest:'e'.repeat(64)});
 view();fireEvent.click(screen.getByText('Trabajo de la sesión'));fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));
 fireEvent.click(screen.getByRole('button',{name:'Ver última entrega'}));
 expect(await screen.findByText('Tres medidas registradas')).toBeVisible();expect(screen.getByText('Sin validación física externa')).toBeVisible();
 fireEvent.change(screen.getByLabelText('Nota de revisión humana'),{target:{value:'Lecturas revisadas'}});
 fireEvent.click(screen.getByRole('button',{name:'Aceptar entrega'}));
 await waitFor(()=>expect(api.decideReview).toHaveBeenCalledWith(delivery(),1,'accept','Lecturas revisadas',expect.any(String),expect.any(AbortSignal)));
});
it('does not enable human decisions for an expert or reader view',async()=>{
 vi.mocked(api.getBoard).mockResolvedValue([task({state:'in_review',revision:4})]);vi.mocked(api.getLatestReview).mockResolvedValue(delivery());
 vi.mocked(engineering.getDesignation).mockResolvedValue({team_id:teamId,primary_id:crypto.randomUUID(),substitute_id:null,revision:1});
 view();fireEvent.click(screen.getByText('Trabajo de la sesión'));fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));fireEvent.click(screen.getByRole('button',{name:'Ver última entrega'}));
 await screen.findByText('Tres medidas registradas');expect(screen.queryByRole('button',{name:'Aceptar entrega'})).not.toBeInTheDocument();
 expect(screen.getByText(/Solo el Crew Chief/)).toBeVisible();
});
it('clears prior team content and ignores late board responses',async()=>{
 let resolve!:(value:ReturnType<typeof task>[])=>void;vi.mocked(api.getBoard).mockImplementation(()=>new Promise(r=>{resolve=r;}));
 view();fireEvent.click(screen.getByText('Trabajo de la sesión'));
 identity.team=crypto.randomUUID();identity.generation++;
 act(()=>window.dispatchEvent(new Event('telemetry-scope-changed')));
 await waitFor(()=>expect(screen.queryByText(session.name)).not.toBeInTheDocument());
 resolve([task()]);await Promise.resolve();expect(screen.queryByText(candidate.title)).not.toBeInTheDocument();
});
it('retains a submission operation when the network result is uncertain',async()=>{
 vi.mocked(api.getBoard).mockResolvedValue([task({state:'in_progress',revision:3})]);vi.mocked(api.submitTask).mockRejectedValue(new Error('Sin conexión'));
 view();fireEvent.click(screen.getByText('Trabajo de la sesión'));fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));
 fireEvent.change(screen.getByLabelText('Resultado de la tarea'),{target:{value:'Tres medidas guardadas'}});
 fireEvent.change(screen.getByLabelText('Límites y pruebas pendientes'),{target:{value:'Falta contraste externo'}});
 fireEvent.change(screen.getByLabelText('Snapshot guardado'),{target:{value:snapshotId}});
 fireEvent.click(screen.getByRole('button',{name:'Entregar para revisión'}));await screen.findByRole('alert');
 fireEvent.click(screen.getByRole('button',{name:'Entregar para revisión'}));
 await waitFor(()=>expect(api.submitTask).toHaveBeenCalledTimes(2));
 expect(vi.mocked(api.submitTask).mock.calls[0][2]).toBe(vi.mocked(api.submitTask).mock.calls[1][2]);
});
it('creates a new operation for a deliberately repeated successful task',async()=>{
 vi.mocked(api.getBoard).mockResolvedValue([]);vi.mocked(api.createTask).mockResolvedValue(task());view();fireEvent.click(screen.getByText('Trabajo de la sesión'));
 for(let i=0;i<2;i++){
  fireEvent.click(screen.getByRole('button',{name:'Nueva tarea'}));
  fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Inspeccionar sensor'}});
  fireEvent.change(screen.getByLabelText('Instrucciones'),{target:{value:'Registrar lecturas'}});
  fireEvent.change(screen.getByLabelText('Criterio de aceptación'),{target:{value:'Tres lecturas'}});
  fireEvent.click(screen.getByRole('button',{name:'Guardar tarea'}));
  await waitFor(()=>expect(screen.queryByLabelText('Título')).not.toBeInTheDocument());
 }
 expect(api.createTask).toHaveBeenCalledTimes(2);
 expect(vi.mocked(api.createTask).mock.calls[0][3]).not.toBe(vi.mocked(api.createTask).mock.calls[1][3]);
});
it('really discards an open creation draft when selecting another task',async()=>{
 render(<WorkspaceDraftProvider><SessionWorkboard session={session} scope="qa"/></WorkspaceDraftProvider>);fireEvent.click(screen.getByText('Trabajo de la sesión'));
 fireEvent.click(screen.getByRole('button',{name:'Nueva tarea'}));fireEvent.change(screen.getByLabelText('Título'),{target:{value:'Borrador sin guardar'}});
 fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));
 fireEvent.click(screen.getByRole('button',{name:'Descartar cambios y continuar'}));
 expect(screen.queryByLabelText('Título')).not.toBeInTheDocument();
});
it('protects a snapshot-only draft and locks inputs during a pending submission',async()=>{
 const other=task({id:crypto.randomUUID(),title:'Otra tarea'});
 vi.mocked(api.getBoard).mockResolvedValue([task({state:'in_progress',revision:3}),other]);
 render(<WorkspaceDraftProvider><SessionWorkboard session={session} scope="qa"/></WorkspaceDraftProvider>);fireEvent.click(screen.getByText('Trabajo de la sesión'));fireEvent.click(await screen.findByRole('button',{name:'Medir recorrido delantero'}));
 fireEvent.change(screen.getByLabelText('Snapshot guardado'),{target:{value:snapshotId}});fireEvent.click(screen.getByRole('button',{name:'Otra tarea'}));
 expect(screen.getByRole('alertdialog')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Seguir editando'}));
 fireEvent.change(screen.getByLabelText('Resultado de la tarea'),{target:{value:'Tres lecturas'}});fireEvent.change(screen.getByLabelText('Límites y pruebas pendientes'),{target:{value:'Sin contraste externo'}});
 let reject!:(reason:Error)=>void;vi.mocked(api.submitTask).mockImplementation(()=>new Promise((_,r)=>{reject=r;}));
 fireEvent.click(screen.getByRole('button',{name:'Entregar para revisión'}));
 expect(screen.getByLabelText('Resultado de la tarea')).toBeDisabled();expect(screen.getByLabelText('Snapshot guardado')).toBeDisabled();
 await act(async()=>reject(new Error('Sin conexión')));
});
