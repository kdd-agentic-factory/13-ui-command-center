import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
vi.mock('../src/services/telemetryIdentity',()=>({canWriteTelemetry:()=>true,telemetryScope:()=> 'draft-control'}));
const data=vi.hoisted(()=>({packet:{id:'weather-id',domain:'weather',revision:1,digest:'a'.repeat(64),session_revision:1,created_at:'2026-10-26T10:00:00Z',assessment:{status:'contributed',mechanical_authority:'none'},packet:{source:{reference:'original',instrument:'probe'},temporal:{kind:'point',observed_at:'2026-10-26T10:00:00Z'},quantities:[]}}}));
vi.mock('../src/services/domainEvidence',()=>({listPackets:vi.fn().mockImplementation(async()=>({items:[data.packet],next_cursor:null})),listReadiness:vi.fn().mockResolvedValue({items:[],next_cursor:null}),getPacket:vi.fn().mockImplementation(async()=>data.packet),saveReadiness:vi.fn().mockResolvedValue({...data.packet,id:'neuro-id',domain:'neuro',packet:undefined,requirements:[]}),attestPacket:vi.fn().mockImplementation(async()=>({...data.packet,revision:2})),createPacket:vi.fn().mockImplementation(async()=>data.packet)}));
import {DomainEvidencePanel} from '../src/components/chassis/domains/DomainEvidencePanel';
import {WorkspaceDraftProvider,useWorkspaceDraft} from '../src/context/WorkspaceDraftContext';
import type {EngineeringSession} from '../src/domain/engineeringSession';
function Probe(){const draft=useWorkspaceDraft();return <button onClick={()=>draft.requestLeave(()=>{})}>Salir de prueba {String(draft.isDirty)}</button>;}
function mount(){const session={id:'session',revision:1,circuit:{id:'circuit',revision:1},bike:null,rider:null} as EngineeringSession;render(<WorkspaceDraftProvider><DomainEvidencePanel contextKey="draft" session={session} recordingId={null} selection={[]} onSelection={()=>{}}/><Probe/></WorkspaceDraftProvider>);}
it('saving readiness preserves another form and its navigation protection',async()=>{
 mount();await screen.findByRole('button',{name:'Consultar Clima r1'});
 fireEvent.click(screen.getByText('Aportar medición o importar CSV'));
 fireEvent.change(screen.getByLabelText('Documento o registro de origen'),{target:{value:'unsaved manual document'}});
 fireEvent.click(screen.getByText('Preparar adquisición física y neuro'));
 fireEvent.change(screen.getByLabelText('Referencia del instrumento'),{target:{value:'readiness device'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar requisitos de adquisición'}));
 await screen.findByRole('button',{name:'Consultar Adquisición neuro r1'});
 expect(screen.getByLabelText('Documento o registro de origen')).toHaveValue('unsaved manual document');
 expect(screen.getByRole('button',{name:'Salir de prueba true'})).toBeInTheDocument();
});
it('consulting another observation asks before discarding documentary edits',async()=>{
 mount();fireEvent.click(await screen.findByRole('button',{name:'Consultar Clima r1'}));
 fireEvent.click(await screen.findByText('Registrar revisión documental'));
 fireEvent.change(screen.getByLabelText('Documento de revisión'),{target:{value:'unsaved attestation'}});
 fireEvent.click(screen.getByRole('button',{name:'Consultar Clima r1'}));
 expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Seguir editando'}));
 await waitFor(()=>expect(screen.getByLabelText('Documento de revisión')).toHaveValue('unsaved attestation'));
});
