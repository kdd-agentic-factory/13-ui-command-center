import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {ChassisComparison} from '../src/components/chassis/ChassisComparison';
import {WorkspaceDraftProvider,useWorkspaceDraft} from '../src/context/WorkspaceDraftContext';
const mocks=vi.hoisted(()=>({state:vi.fn(async()=>({bike_id:'bike',setups:[],bindings:[],comparison:null})),request:vi.fn(async()=>[])}));
vi.mock('../src/services/chassisTelemetry',()=>({getChassisState:mocks.state,createSetup:vi.fn(),bindSetup:vi.fn(),compareSetups:vi.fn()}));
vi.mock('../src/services/chassisWorkshop',async()=>({...await vi.importActual('../src/services/chassisWorkshop'),listSpecifications:mocks.request,workshopRequest:mocks.request}));
describe('same comparison across work views',()=>{
 it('preserves the real B draft and does not reload on view switches',async()=>{
  const present=vi.fn();
  const leave=vi.fn();function LeaveProbe(){const {requestLeave}=useWorkspaceDraft();return <button onClick={()=>requestLeave(leave)}>QA leave</button>;}
  const draw=(workView:'engineer'|'mechanic'|'analyst'|'rider')=><WorkspaceDraftProvider><LeaveProbe/><ChassisComparison sessionId="recording" channels={[]} workView={workView} contextKey="scope/session" onPresentation={present}/></WorkspaceDraftProvider>;
  const app=render(draw('engineer'));
  await waitFor(()=>expect(mocks.state).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button',{name:'B · Alternativa'}));
  fireEvent.change(screen.getByLabelText('Offset de dirección mm'),{target:{value:'31'}});
  fireEvent.click(screen.getByRole('tab',{name:'Dinámica en curva'}));
  fireEvent.change(screen.getByLabelText('Velocidad en curva'),{target:{value:'185'}});
  const reads=mocks.request.mock.calls.length;
  app.rerender(draw('mechanic'));app.rerender(draw('analyst'));app.rerender(draw('rider'));
  fireEvent.click(screen.getByRole('button',{name:'QA leave'}));
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();expect(leave).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Seguir editando'}));
  app.rerender(draw('engineer'));
  expect(screen.getByLabelText('Offset de dirección mm')).toHaveValue(31);
  expect(screen.getByLabelText('Velocidad en curva')).toHaveValue(185);
  expect(mocks.state).toHaveBeenCalledTimes(1);
  expect(mocks.request).toHaveBeenCalledTimes(reads);
  expect(present).toHaveBeenLastCalledWith(expect.objectContaining({contextKey:'scope/session',dirty:true,saved:false}));
 });
});
