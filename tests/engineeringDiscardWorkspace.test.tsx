import { fireEvent,render,screen,waitFor } from '@testing-library/react';
import { expect,it } from 'vitest';
import { EngineeringSessionProvider,useEngineeringSession } from '../src/context/EngineeringSessionContext';
import { WorkspaceDraftProvider,useWorkspaceDraft } from '../src/context/WorkspaceDraftContext';
import { SessionPreparation } from '../src/components/engineering/SessionPreparation';
import { ChassisComparison } from '../src/components/chassis/ChassisComparison';
import { ids,transport } from './engineeringTransport';
function Workspace(){const ctx=useEngineeringSession();const {isDirty}=useWorkspaceDraft();return <><SessionPreparation/><ChassisComparison key={ctx.workspaceEpoch} sessionId={ids.recording} channels={[]}/><span data-testid="draft-state">{isDirty?'dirty':'clean'}</span></>;}
it('resets actual A/B drafts and their registry on discard with no engineering session, then rearms protection',async()=>{
  localStorage.clear();const {fetch}=transport();const normal=fetch.getMockImplementation()!;
  fetch.mockImplementation(async(input,init)=>String(input).endsWith('/state')?new Response(JSON.stringify({bike_id:null,setups:[],bindings:[],comparison:null})):normal(input,init));
  render(<WorkspaceDraftProvider><EngineeringSessionProvider><Workspace/></EngineeringSessionProvider></WorkspaceDraftProvider>);
  await waitFor(()=>expect(screen.getByLabelText('Identificador de moto')).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Identificador de moto'),{target:{value:'Borrador moto'}});
  fireEvent.change(screen.getByRole('spinbutton',{name:/^Radio delantero cargado mm$/}),{target:{value:'301'}});
  expect(screen.getByTestId('draft-state')).toHaveTextContent('dirty');
  fireEvent.click(screen.getByRole('button',{name:'Recargar contexto'}));fireEvent.click(screen.getByText('Descartar cambios y continuar'));
  await waitFor(()=>expect(screen.getByLabelText('Identificador de moto')).toHaveValue(''));
  expect(screen.getByRole('spinbutton',{name:/^Radio delantero cargado mm$/})).toHaveValue(null);expect(screen.getByTestId('draft-state')).toHaveTextContent('clean');
  await waitFor(()=>expect(screen.getByLabelText('Identificador de moto')).toBeEnabled());
  fireEvent.change(screen.getByLabelText('Identificador de moto'),{target:{value:'Nueva moto'}});
  expect(screen.getByTestId('draft-state')).toHaveTextContent('dirty');fireEvent.click(screen.getByRole('button',{name:'Recargar contexto'}));expect(screen.getByRole('alertdialog')).toBeInTheDocument();
});
