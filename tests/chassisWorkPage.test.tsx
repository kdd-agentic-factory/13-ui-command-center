import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
import {ChassisPage} from '../src/pages/ChassisPage';
import {WorkspaceDraftProvider} from '../src/context/WorkspaceDraftContext';
const mock=vi.hoisted(()=>({recording:vi.fn(async()=>({id:'qa-recording',filename:'QA source',source:'2d',channels:[],laps:[],validation:{status:'experimental'},warnings:[],classification:'restricted',reader:'qa',reader_version:'1',sha256:'a'.repeat(64)})),state:vi.fn(async()=>({bike_id:'bike',setups:[],bindings:[],comparison:null})),request:vi.fn(async()=>[]),context:{scope:'team-a',workspaceEpoch:0,session:null,association:null,historical:{},workspaceChanged:()=>{}}}));
vi.mock('../src/context/EngineeringSessionContext',()=>({useEngineeringSession:()=>mock.context}));
vi.mock('../src/context/NavContext',()=>({useNavigate:()=>vi.fn()}));
vi.mock('../src/domain/recordedSession',async()=>({...await vi.importActual('../src/domain/recordedSession'),activeRecording:()=> 'qa-recording'}));
vi.mock('../src/services/recordedTelemetry',()=>({getRecording:mock.recording,getRecordedSignal:vi.fn(),saveRecordedGeometry:vi.fn()}));
vi.mock('../src/services/chassisTelemetry',()=>({getChassisState:mock.state,createSetup:vi.fn(),bindSetup:vi.fn(),compareSetups:vi.fn()}));
vi.mock('../src/services/chassisWorkshop',async()=>({...await vi.importActual('../src/services/chassisWorkshop'),listSpecifications:mock.request,workshopRequest:mock.request}));
vi.mock('../src/components/engineering/SessionPreparation',async()=>{const {useWorkspaceDraft}=await import('../src/context/WorkspaceDraftContext');return {SessionPreparation:()=>{const {markDirty}=useWorkspaceDraft();return <><h2>Preparación QA</h2><button onClick={()=>markDirty(true,'engineering-session')}>QA edit context</button></>;}};});
vi.mock('../src/components/engineering/AnalysisRunPanel',()=>({AnalysisRunPanel:()=> <h2>Análisis QA</h2>}));
vi.mock('../src/components/chassis/ChassisProductStatus',()=>({ChassisProductStatus:()=>null}));
describe('shared work views in the actual Chassis page',()=>{
 it('keeps one actual comparison, preserves B, and shows source blockers across six views',async()=>{
  render(<WorkspaceDraftProvider><ChassisPage/></WorkspaceDraftProvider>);
  await screen.findByRole('button',{name:'B · Alternativa'});
  await waitFor(()=>expect(mock.state).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button',{name:'B · Alternativa'}));
  fireEvent.change(screen.getByLabelText('Offset de dirección mm'),{target:{value:'32'}});
  for(const view of ['rider','mechanic','analyst','crew-chief','management','engineer']){
   fireEvent.change(screen.getByLabelText('Vista de trabajo'),{target:{value:view}});
   expect(screen.getByRole('heading',{name:'Fuente 2D pendiente de validar'})).toBeVisible();
   expect(document.querySelectorAll('.chassis-comparison')).toHaveLength(1);
  }
  expect(screen.getByLabelText('Offset de dirección mm')).toHaveValue(32);
  expect(mock.recording).toHaveBeenCalledTimes(1);expect(mock.state).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button',{name:'Revisar contexto'}));
  expect(screen.getByRole('heading',{name:'Preparación QA'})).toBeVisible();
 });
 it('routes a saved comparison without association and a dirty session back to context',async()=>{
  Object.assign(mock.context,{session:{id:'session',revision:1,name:'QA',session_type:'practice',circuit:{id:'c'},bike:{id:'b'},rider:{id:'r'}},association:null});
  mock.recording.mockResolvedValueOnce({id:'qa-recording',filename:'QA source',source:'2d',channels:[],laps:[],validation:{status:'validated'},warnings:[],classification:'restricted',reader:'qa',reader_version:'1',sha256:'a'.repeat(64)});
  mock.state.mockResolvedValueOnce({bike_id:'bike',setups:[],bindings:[],comparison:{id:'comparison',session_id:'qa-recording',a:{metrics:{}},b:{metrics:{}},deltas:{},evidence:[],warnings:[],missing:[],recommendation:{provider:'deterministic'}}} as any);
  render(<WorkspaceDraftProvider><ChassisPage/></WorkspaceDraftProvider>);
  const associate=await screen.findByRole('button',{name:'Asociar medición y revisiones guardadas'});
  fireEvent.click(associate);expect(screen.getByRole('heading',{name:'Preparación QA'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'QA edit context'}));
  expect(screen.getByRole('button',{name:'Revisar cambios del contexto'})).toBeInTheDocument();
 });
});
