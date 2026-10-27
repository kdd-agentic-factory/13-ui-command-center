import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineeringSessionProvider, useEngineeringSession } from './EngineeringSessionContext';
import { WorkspaceDraftProvider, useWorkspaceDraft } from './WorkspaceDraftContext';
import { ids, session, transport } from '../../tests/engineeringTransport';
import { emptySession, sessionInput } from '../domain/engineeringSession';

function Probe(){const ctx=useEngineeringSession();const draft=useWorkspaceDraft();return <><span>{ctx.session?.name??'Vacío'}</span><span>{ctx.catalog.circuit.map(c=>c.name).join(',')}</span><span data-testid="association">{JSON.stringify(ctx.association)}</span><span role="status">{ctx.error}</span><button onClick={()=>ctx.choose(ids.session)}>Primera</button><button onClick={()=>ctx.choose(ids.second)}>Segunda</button><button onClick={()=>ctx.associateWorkspace(ids.recording)}>Asociar</button><button onClick={ctx.workspaceChanged}>Cambio A/B guardado</button><button onClick={()=>draft.markDirty(true,'comparison')}>Editar A/B</button></>;}
function view(){return render(<WorkspaceDraftProvider><EngineeringSessionProvider><Probe/></EngineeringSessionProvider></WorkspaceDraftProvider>);}
beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});
describe('scope-aware engineering context',()=>{
  it('keeps one operation for an ambiguous retry of the same create attempt',async()=>{
    const {state,fetch}=transport();const normal=fetch.getMockImplementation()!;let loseReply=true;
    fetch.mockImplementation(async(input,init)=>{const reply=await normal(input,init);if(init?.method==='POST'&&String(input).endsWith('/sessions')&&loseReply){loseReply=false;throw new TypeError('Reply lost after commit');}return reply;});
    function Save(){const ctx=useEngineeringSession();return <><button onClick={()=>void ctx.save({...emptySession(),name:'Mismo intento'})}>Guardar intento</button><span>{ctx.session?.id??'Sin persistencia visible'}</span><span role="alert">{ctx.error}</span></>;}
    render(<WorkspaceDraftProvider><EngineeringSessionProvider><Save/></EngineeringSessionProvider></WorkspaceDraftProvider>);
    fireEvent.click(screen.getByText('Guardar intento'));await screen.findByText('Reply lost after commit');
    fireEvent.click(screen.getByText('Guardar intento'));await screen.findByText(ids.session);
    expect(state.sessions).toHaveLength(1);expect(state.writes).toHaveLength(2);expect(state.writes[0].body.operation_id).toBe(state.writes[1].body.operation_id);
  });
  it('coalesces same-tick double submission into one persisted create request',async()=>{
    const {state}=transport();
    function Save(){const ctx=useEngineeringSession();return <><button onClick={()=>{void ctx.save({...emptySession(),name:'Doble clic'});void ctx.save({...emptySession(),name:'Doble clic'});}}>Doble envío</button><span>{ctx.session?.id??'Vacío'}</span></>;}
    render(<WorkspaceDraftProvider><EngineeringSessionProvider><Save/></EngineeringSessionProvider></WorkspaceDraftProvider>);
    fireEvent.click(screen.getByText('Doble envío'));await screen.findByText(ids.session);
    expect(state.sessions).toHaveLength(1);expect(state.writes).toHaveLength(1);
  });
  it('protects A/B drafts before a voluntary session switch',async()=>{
    const {state}=transport();state.sessions=[session('Primera sesión'),session('Segunda sesión',ids.second)];view();
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Primera sesión');
    fireEvent.click(screen.getByText('Editar A/B'));fireEvent.click(screen.getByText('Segunda'));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();expect(screen.getByText('Primera sesión')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Seguir editando'));expect(screen.getByText('Primera sesión')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Segunda'));fireEvent.click(screen.getByText('Descartar cambios y continuar'));await screen.findByText('Segunda sesión');
  });
  it('discards a delayed session response after scope reset and aborts its request',async()=>{
    const {fetch}=transport();let resolve!: (r:Response)=>void;let signal:AbortSignal|undefined;
    const normal=fetch.getMockImplementation()!;
    fetch.mockImplementation(async(input,init)=>{if(String(input).endsWith('/sessions/'+ids.session)){signal=init?.signal as AbortSignal;return new Promise<Response>(r=>{resolve=r;});}return normal(input,init);});
    view();fireEvent.click(screen.getByText('Primera'));await waitFor(()=>expect(resolve).toBeDefined());
    act(()=>window.dispatchEvent(new Event('telemetry-scope-changed')));
    await act(async()=>resolve(new Response(JSON.stringify(session('Privada anterior')))));
    expect(signal?.aborted).toBe(true);expect(screen.queryByText('Privada anterior')).not.toBeInTheDocument();expect(screen.getByText('Vacío')).toBeInTheDocument();
  });
  it('refuses catalog rows from another owner instead of rendering them',async()=>{
    const {state}=transport();state.catalog.circuit[0]={...state.catalog.circuit[0],name:'Catálogo ajeno',team_id:ids.second} as any;view();
    await screen.findByText(/Contexto de otro equipo/);
    expect(screen.queryByText('Catálogo ajeno')).not.toBeInTheDocument();
  });
  it('associates actual source hashes, saved A/B revisions and comparison interval, then reopens them',async()=>{
    const {state}=transport();state.sessions=[session()];localStorage.setItem('kdd-recorded-session-id',ids.recording);const ui=view();
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Tanda guardada');fireEvent.click(screen.getByText('Asociar'));
    await waitFor(()=>expect(JSON.parse(screen.getByTestId('association').textContent!)).toMatchObject({session_id:ids.session,session_revision:1,recording:{id:ids.recording,sha256:'a'.repeat(64)},selection:{recordings:[{id:ids.recording,geometry_revision:null,interval_s:['1.25','8']}],comparison:{id:ids.comparison,revision:1},setup_a:{id:ids.a,revision:3},setup_b:{id:ids.b,revision:4}}}));
    ui.unmount();view();await waitFor(()=>expect(screen.getByTestId('association')).toHaveTextContent(ids.comparison));
    fireEvent.click(screen.getByText('Cambio A/B guardado'));expect(screen.getByTestId('association')).toHaveTextContent('null');
    expect(localStorage.getItem(`kdd-engineering-selection:local:${ids.session}:1`)).toBeNull();
  });
  it('does not adopt a recording merely because it is open or named like the engineering session',async()=>{
    const {state}=transport();state.sessions=[session('Fuente real.csv')];localStorage.setItem('kdd-recorded-session-id',ids.recording);view();
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Fuente real.csv');expect(screen.getByTestId('association')).toHaveTextContent('null');
  });
  it('does not restore an association behind a different open Chassis recording',async()=>{
    const {state}=transport();state.sessions=[session()];localStorage.setItem('kdd-recorded-session-id',ids.recording);const ui=view();
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Tanda guardada');fireEvent.click(screen.getByText('Asociar'));
    await waitFor(()=>expect(screen.getByTestId('association')).toHaveTextContent(ids.comparison));ui.unmount();
    localStorage.setItem('kdd-recorded-session-id',ids.second);view();await screen.findByText('Tanda guardada');
    await screen.findByText(/otra grabación/);expect(screen.getByTestId('association')).toHaveTextContent('null');
  });
  it('rejects an association response arriving after the active recording changes',async()=>{
    const {state,fetch}=transport();state.sessions=[session()];localStorage.setItem('kdd-recorded-session-id',ids.recording);
    const normal=fetch.getMockImplementation()!;let resolve!:(r:Response)=>void;let signal:AbortSignal|undefined;
    fetch.mockImplementation(async(input,init)=>{if(String(input).includes('/recorded/')){signal=init?.signal as AbortSignal;return new Promise<Response>(r=>{resolve=r;});}return normal(input,init);});
    view();fireEvent.click(screen.getByText('Primera'));await screen.findByText('Tanda guardada');fireEvent.click(screen.getByText('Asociar'));
    await waitFor(()=>expect(resolve).toBeDefined());localStorage.setItem('kdd-recorded-session-id',ids.second);act(()=>window.dispatchEvent(new Event('recorded-session-changed')));
    await act(async()=>resolve(new Response(JSON.stringify(state.recording))));expect(signal?.aborted).toBe(true);expect(screen.getByTestId('association')).toHaveTextContent('null');
  });
  it('rejects comparison selection when its persisted source hash differs',async()=>{
    const {state}=transport();state.sessions=[session()];state.chassis.comparison.source_sha256='b'.repeat(64);localStorage.setItem('kdd-recorded-session-id',ids.recording);view();
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Tanda guardada');fireEvent.click(screen.getByText('Asociar'));
    await screen.findByText(/comparación guardada no corresponde/);expect(screen.getByTestId('association')).toHaveTextContent('null');
  });
  it('discards a delayed save from the previous engineering session',async()=>{
    const {state,fetch}=transport();state.sessions=[session(),session('Segunda sesión',ids.second)];
    const normal=fetch.getMockImplementation()!;let resolve!:(r:Response)=>void;let signal:AbortSignal|undefined;
    fetch.mockImplementation(async(input,init)=>{if(init?.method==='PUT'){signal=init.signal as AbortSignal;return new Promise<Response>(r=>{resolve=r;});}return normal(input,init);});
    function Save(){const ctx=useEngineeringSession();return <button onClick={()=>ctx.session&&void ctx.save({...sessionInput(ctx.session),name:'Guardado anterior'})}>Guardar prueba</button>;}
    render(<WorkspaceDraftProvider><EngineeringSessionProvider><Probe/><Save/></EngineeringSessionProvider></WorkspaceDraftProvider>);
    fireEvent.click(screen.getByText('Primera'));await screen.findByText('Tanda guardada');fireEvent.click(screen.getByText('Guardar prueba'));await waitFor(()=>expect(resolve).toBeDefined());
    fireEvent.click(screen.getByText('Segunda'));await screen.findByText('Segunda sesión');await act(async()=>resolve(new Response(JSON.stringify({...session('Guardado anterior'),revision:2}))));
    expect(signal?.aborted).toBe(true);expect(screen.getByText('Segunda sesión')).toBeInTheDocument();expect(screen.queryByText('Guardado anterior')).not.toBeInTheDocument();
  });
});
