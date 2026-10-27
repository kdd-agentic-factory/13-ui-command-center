import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {it,expect,vi,beforeEach} from 'vitest';
import {useState} from 'react';
import {WorkspaceDraftProvider,useWorkspaceDraft} from '../src/context/WorkspaceDraftContext';
const mocks=vi.hoisted(()=>({request:vi.fn(async()=>[]),navigate:vi.fn(),recording:null as string|null}));
vi.mock('../src/context/EngineeringSessionContext',()=>({useEngineeringSession:()=>({scope:'local',workspaceEpoch:0,session:{id:'session',revision:1,name:'Control',session_type:'practice',circuit:{id:'circuit',revision:1},bike:{id:'bike',revision:1},rider:{id:'rider',revision:1}},association:null,historical:{},workspaceChanged:()=>{}})}));
vi.mock('../src/context/NavContext',()=>({useNavigate:()=>mocks.navigate}));
vi.mock('../src/domain/recordedSession',async()=>({...await vi.importActual('../src/domain/recordedSession'),activeRecording:()=>mocks.recording}));
vi.mock('../src/services/recordedTelemetry',()=>({getRecording:vi.fn(async(id:string)=>({id,filename:'QA recorded control',source:'aim',channels:[],laps:[],validation:{status:'validated'},warnings:[],classification:'restricted',reader:'qa',reader_version:'1',sha256:'a'.repeat(64)})),getRecordedSignal:vi.fn(),saveRecordedGeometry:vi.fn()}));
vi.mock('../src/services/chassisTelemetry',()=>({getChassisState:vi.fn(async()=>({bike_id:'bike',setups:[],bindings:[],comparison:null})),createSetup:vi.fn(),bindSetup:vi.fn(),compareSetups:vi.fn()}));
vi.mock('../src/services/chassisWorkshop',async()=>({...await vi.importActual('../src/services/chassisWorkshop'),workshopRequest:mocks.request,listSpecifications:mocks.request}));
vi.mock('../src/components/engineering/SessionPreparation',()=>({SessionPreparation:()=>null}));
vi.mock('../src/components/engineering/AnalysisRunPanel',()=>({AnalysisRunPanel:()=>null}));
vi.mock('../src/components/chassis/ChassisProductStatus',()=>({ChassisProductStatus:()=>null}));
function Draft({owner,label}:{owner:string;label:string}){const {markDirty}=useWorkspaceDraft();const [value,setValue]=useState('');return <label>{label}<input value={value} onChange={e=>{setValue(e.target.value);markDirty(true,owner);}}/></label>;}
vi.mock('../src/components/chassis/domains/DomainEvidencePanel',()=>({DomainEvidencePanel:()=> <Draft owner="domain-evidence" label="Control dominio"/>}));
vi.mock('../src/components/chassis/suspension/SuspensionLabPanel',()=>({SuspensionLabPanel:()=> <Draft owner="suspension-lab" label="Control laboratorio"/>}));
import {ChassisPage} from '../src/pages/ChassisPage';
// jsdom has no layout scrolling; browser acceptance checks real scrolling/focus.
HTMLElement.prototype.scrollIntoView=vi.fn();
beforeEach(()=>{mocks.recording=null;});
it.each([['Control dominio','Revisar el contexto medido sin guardar','domains'],['Control laboratorio','Revisar el laboratorio sin guardar','lab']])('next step focuses %s without clearing values in any view',async(label,action,target)=>{
 render(<WorkspaceDraftProvider><ChassisPage/></WorkspaceDraftProvider>);
 fireEvent.change(screen.getByLabelText(label),{target:{value:'pending measurement'}});
 for(const view of ['rider','mechanic','engineer','analyst','crew-chief','management']){
  fireEvent.change(screen.getByLabelText('Vista de trabajo'),{target:{value:view}});
  fireEvent.click(screen.getByRole('button',{name:action}));
  await waitFor(()=>expect(document.activeElement).toHaveAttribute('data-area',target));
  expect(screen.getByLabelText(label)).toHaveValue('pending measurement');
  expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
 }
 expect(mocks.navigate).not.toHaveBeenCalled();
});
it.each([null,'recording-control'])('returns to the dirty cornering tab with recording %s from a reading view',async(recordingId)=>{
 mocks.recording=recordingId;
 render(<WorkspaceDraftProvider><ChassisPage/></WorkspaceDraftProvider>);
 if(recordingId)await screen.findByRole('heading',{name:'QA recorded control'});
 fireEvent.change(screen.getByLabelText('Vista de trabajo'),{target:{value:'engineer'}});
 fireEvent.click(screen.getByRole('tab',{name:'Dinámica en curva'}));
 fireEvent.change(screen.getByLabelText('Velocidad en curva'),{target:{value:'120'}});
 fireEvent.click(screen.getByRole('tab',{name:'Geometría global'}));
 fireEvent.change(screen.getByLabelText('Vista de trabajo'),{target:{value:'rider'}});
 fireEvent.click(screen.getByRole('button',{name:'Revisar el escenario de curva sin guardar'}));
 await waitFor(()=>expect(screen.getByRole('tab',{name:'Dinámica en curva'})).toHaveAttribute('aria-selected','true'));
 expect(screen.getByLabelText('Velocidad en curva')).toHaveValue(120);
 expect(screen.getByLabelText('Vista de trabajo')).toHaveValue('engineer');
});
