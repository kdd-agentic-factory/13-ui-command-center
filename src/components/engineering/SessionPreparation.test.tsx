import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EngineeringSessionProvider } from '../../context/EngineeringSessionContext';
import { WorkspaceDraftProvider } from '../../context/WorkspaceDraftContext';
import { SessionPreparation } from './SessionPreparation';
import { entity, ids, session, transport } from '../../../tests/engineeringTransport';

function view(){return render(<WorkspaceDraftProvider><EngineeringSessionProvider><SessionPreparation /></EngineeringSessionProvider></WorkspaceDraftProvider>);}
beforeEach(()=>{localStorage.clear();vi.restoreAllMocks();});
describe('engineering preparation over strict human transport',()=>{
  it('discards a new form on reload and rearms its guard after editing again',async()=>{
    transport();view();await screen.findByRole('option',{name:'Circuito medido · r1'});
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Descartar nombre'}});
    fireEvent.change(screen.getByLabelText('Notas de sesión'),{target:{value:'Descartar notas'}});
    fireEvent.change(screen.getByLabelText('Nombre de nuevo circuito'),{target:{value:'Borrador de catálogo'}});
    fireEvent.change(screen.getByLabelText('Circuito'),{target:{value:`${ids.circuit}:1`}});
    fireEvent.click(screen.getByRole('button',{name:'Recargar contexto'}));fireEvent.click(screen.getByText('Descartar cambios y continuar'));
    await waitFor(()=>expect(screen.getByLabelText('Nombre de sesión')).toHaveValue(''));
    expect(screen.getByLabelText('Notas de sesión')).toHaveValue('');expect(screen.getByLabelText('Nombre de nuevo circuito')).toHaveValue('');expect(screen.getByLabelText('Circuito')).toHaveValue('');
    await waitFor(()=>expect(screen.getByLabelText('Nombre de sesión')).toBeEnabled());
    fireEvent.click(screen.getByRole('button',{name:'Recargar contexto'}));expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await waitFor(()=>expect(screen.getByLabelText('Nombre de sesión')).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Nueva edición'}});
    fireEvent.click(screen.getByRole('button',{name:'Recargar contexto'}));expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
  it('creates two deliberate identical sessions as distinct persisted entities',async()=>{
    const {state}=transport();view();await screen.findByRole('option',{name:'Circuito medido · r1'});
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Tanda idéntica'}});fireEvent.click(screen.getByRole('button',{name:'Guardar sesión'}));
    await screen.findByRole('button',{name:'Nueva sesión'});fireEvent.click(screen.getByRole('button',{name:'Nueva sesión'}));
    await waitFor(()=>expect(screen.getByLabelText('Nombre de sesión')).toHaveValue(''));
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Tanda idéntica'}});fireEvent.click(screen.getByRole('button',{name:'Guardar sesión'}));
    await waitFor(()=>expect(state.sessions).toHaveLength(2));
    expect(new Set(state.sessions.map(s=>s.id)).size).toBe(2);
    expect(new Set(state.writes.filter(w=>w.path==='/sessions').map(w=>w.body.operation_id)).size).toBe(2);
  });
  it('prepares warm-up with owned revisioned catalog and saves without a recording',async()=>{
    const {state}=transport();view();
    await screen.findByRole('option',{name:'Circuito medido · r1'});
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Warm-up domingo'}});
    fireEvent.change(screen.getByLabelText('Tipo de sesión'),{target:{value:'warm_up'}});
    for(const [label,key] of [['Circuito','circuit'],['Moto','bike'],['Piloto','rider']] as const) fireEvent.change(screen.getByLabelText(label),{target:{value:`${ids[key]}:1`}});
    fireEvent.click(screen.getByRole('button',{name:'Guardar sesión'}));
    await waitFor(()=>expect(state.sessions).toHaveLength(1));
    expect(state.sessions[0]).toMatchObject({session_type:'warm_up',provenance:'recorded',circuit:{id:ids.circuit,revision:1},bike:{id:ids.bike,revision:1},rider:{id:ids.rider,revision:1}});
    expect(screen.getByText(/Sin grabación asociada/)).toBeInTheDocument();
  });
  it('keeps race independent from recorded provenance and allows blank catalogs',async()=>{
    const {state}=transport();state.catalog={circuit:[],bike:[],rider:[]};view();
    await screen.findByText(/Catálogo de circuito vacío/);
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Carrera grabada'}});
    fireEvent.change(screen.getByLabelText('Tipo de sesión'),{target:{value:'race'}});
    fireEvent.click(screen.getByRole('button',{name:'Guardar sesión'}));
    await waitFor(()=>expect(state.sessions[0]).toMatchObject({session_type:'race',provenance:'recorded',circuit:null,bike:null,rider:null}));
  });
  it('creates real catalog entries rather than seeding demo options',async()=>{
    const {state}=transport();state.catalog.circuit=[];view();
    await screen.findByText(/Catálogo de circuito vacío/);
    fireEvent.change(screen.getByLabelText('Nombre de nuevo circuito'),{target:{value:'Pista del equipo'}});
    fireEvent.click(screen.getByRole('button',{name:'Crear circuito'}));
    expect(await screen.findByRole('option',{name:'Pista del equipo · r1'})).toBeInTheDocument();
    expect(state.writes[0].path).toBe('/catalog/circuit');
  });
  it('keeps the draft on 409 and offers a deliberate reload',async()=>{
    const {state}=transport();state.sessions=[session()];view();
    fireEvent.change(await screen.findByLabelText('Reabrir sesión'),{target:{value:ids.session}});
    await waitFor(()=>expect(screen.getByLabelText('Nombre de sesión')).toHaveValue('Tanda guardada'));
    fireEvent.change(screen.getByLabelText('Nombre de sesión'),{target:{value:'Mi borrador'}});state.conflict=true;
    fireEvent.click(screen.getByRole('button',{name:'Guardar revisión'}));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Recarga/);
    expect(screen.getByLabelText('Nombre de sesión')).toHaveValue('Mi borrador');
    fireEvent.click(screen.getByRole('button',{name:'Recargar sesión'}));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
  it('reopens the exact retired historical catalog revision without upgrading it',async()=>{
    const {state}=transport();state.catalog.circuit=[{...entity('circuit',3),retired:true}];state.sessions=[{...session(),circuit:{id:ids.circuit,revision:1}} as any];view();
    fireEvent.change(await screen.findByLabelText('Reabrir sesión'),{target:{value:ids.session}});
    await waitFor(()=>expect(screen.getByLabelText('Circuito')).toHaveValue(`${ids.circuit}:1`));
    expect(screen.getByRole('option',{name:/Circuito medido · r1/})).toBeInTheDocument();
    expect(screen.queryByRole('option',{name:'Circuito medido · r3'})).not.toBeInTheDocument();
  });
});
