import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({recording:vi.fn(),create:vi.fn(),import:vi.fn(),list:vi.fn().mockResolvedValue({items:[],next_cursor:null})}));
vi.mock('../src/services/suspensionLab',()=>({listAcquisitions:mock.list,listAnalyses:mock.list,recordingManifest:mock.recording,createAnalysis:mock.create,importBench:mock.import}));
vi.mock('../src/services/telemetryIdentity',()=>({canWriteTelemetry:()=>true,telemetryScope:()=> 'test'}));
import {SuspensionLabPanel} from '../src/components/chassis/suspension/SuspensionLabPanel';
import {WorkspaceDraftProvider} from '../src/context/WorkspaceDraftContext';

const source={id:'source',kind:'recording',digest:'a'.repeat(64),channel_catalog:[{index:0,name:'Measured channel',unit:'mm',sample_count:1000,start_s:0,end_s:10}]};
describe('suspension context fences',()=>{
 it('prevents an old result action from cancelling the calculation in progress',async()=>{
  mock.recording.mockResolvedValueOnce(source);
  mock.create.mockReset().mockResolvedValueOnce({id:'previous',digest:'b'.repeat(64),revision:1,request:{method:'movement'},result:{},reasons:[],observation_eligibility:'exploratory'}).mockReturnValueOnce(new Promise(()=>{}));
  render(<SuspensionLabPanel contextKey="busy-result" recordingId="recording"/>);
  fireEvent.click(screen.getByRole('button',{name:'Usar grabación actual'}));
  fireEvent.change(await screen.findByLabelText('Referencia de calibración del canal'),{target:{value:'fixture calibration'}});
  fireEvent.click(screen.getByRole('button',{name:'Calcular y guardar observación'}));
  await screen.findByRole('region',{name:'Resultado de suspensión'});
  fireEvent.click(screen.getByRole('button',{name:'Calcular y guardar observación'}));
  await screen.findByRole('button',{name:'Cancelar cálculo'});
  expect(screen.getByRole('button',{name:'Consultar anexo de evidencias'})).toBeDisabled();
 });
 it('adopts the imported source without asking to discard the completed form',async()=>{
  mock.import.mockResolvedValueOnce({...source,id:'bench',kind:'suspension_bench',metadata:{}});
  const ui=render(<WorkspaceDraftProvider><SuspensionLabPanel contextKey="import" recordingId={null}/></WorkspaceDraftProvider>);
  fireEvent.click(screen.getByText('Importar un ensayo medido',{exact:true}));
  fireEvent.change(screen.getByLabelText('Archivo CSV'),{target:{files:[new File(['t;f;x\n'],'fixture.csv',{type:'text/csv'})]}});
  fireEvent.change(screen.getByLabelText('Modelo del componente'),{target:{value:'controlled fixture'}});
  fireEvent.submit(ui.container.querySelector('form')!);
  await waitFor(()=>expect(mock.import).toHaveBeenCalledTimes(1));
  expect(await screen.findByText(/Fuente: ensayo de banco/)).toBeInTheDocument();
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
 });
 it('cannot attach an observation with no comparison to an undefined active comparison',async()=>{
  mock.recording.mockResolvedValueOnce(source);
  mock.create.mockReset().mockResolvedValueOnce({id:'unbound',digest:'b'.repeat(64),revision:1,request:{method:'movement'},result:{},reasons:[],observation_eligibility:'exploratory'});
  render(<SuspensionLabPanel contextKey="unbound" recordingId="recording" onEvidenceSaved={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:'Usar grabación actual'}));
  fireEvent.change(await screen.findByLabelText('Referencia de calibración del canal'),{target:{value:'fixture calibration'}});
  fireEvent.click(screen.getByRole('button',{name:'Calcular y guardar observación'}));
  await screen.findByRole('region',{name:'Resultado de suspensión'});
  expect(screen.queryByRole('button',{name:'Incluir en el próximo snapshot'})).not.toBeInTheDocument();
 });
 it('rejects a late source response after context changes',async()=>{
  mock.create.mockClear();
  let resolve!:(value:unknown)=>void;mock.recording.mockReturnValueOnce(new Promise(r=>{resolve=r;}));
  const ui=render(<SuspensionLabPanel contextKey="A" recordingId="a"/>);
  fireEvent.click(screen.getByRole('button',{name:'Usar grabación actual'}));
  ui.rerender(<SuspensionLabPanel contextKey="B" recordingId="b"/>);
  await act(async()=>resolve(source));
  expect(screen.queryByText(/huella aaaa/)).not.toBeInTheDocument();
  expect(mock.create).not.toHaveBeenCalled();
 });
 it('requires explicit calibration and rejects a cancelled calculation response',async()=>{
  mock.recording.mockResolvedValueOnce(source);
  let resolve!:(value:unknown)=>void;mock.create.mockReturnValueOnce(new Promise(r=>{resolve=r;}));
  render(<SuspensionLabPanel contextKey="C" recordingId="c"/>);
  fireEvent.click(screen.getByRole('button',{name:'Usar grabación actual'}));
  const calculate=await screen.findByRole('button',{name:'Calcular y guardar observación'});
  expect(calculate).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Referencia de calibración del canal'),{target:{value:'measured calibration fixture'}});
  await waitFor(()=>expect(calculate).not.toBeDisabled());fireEvent.click(calculate);
  fireEvent.click(await screen.findByRole('button',{name:'Cancelar cálculo'}));
  await act(async()=>resolve({id:'late-result',result:{},request:{method:'movement'},reasons:[]}));
  expect(screen.queryByRole('region',{name:'Resultado de suspensión'})).not.toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('cancelada');
 });
 it('retains operation identity when an unchanged calculation is retried',async()=>{
  mock.create.mockReset().mockRejectedValue(new Error('Transport unavailable'));
  mock.recording.mockResolvedValueOnce(source);
  render(<SuspensionLabPanel contextKey="retry" recordingId="retry"/>);
  fireEvent.click(screen.getByRole('button',{name:'Usar grabación actual'}));
  fireEvent.change(await screen.findByLabelText('Referencia de calibración del canal'),{target:{value:'fixture calibration'}});
  fireEvent.click(screen.getByRole('button',{name:'Calcular y guardar observación'}));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button',{name:'Calcular y guardar observación'}));
  await waitFor(()=>expect(mock.create).toHaveBeenCalledTimes(2));
  expect(mock.create.mock.calls[0][0].operation_id).toBe(mock.create.mock.calls[1][0].operation_id);
 });
});
