import {render,screen,fireEvent} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
vi.mock('../src/services/domainEvidence',()=>({listPackets:vi.fn().mockResolvedValue({items:[],next_cursor:null}),listReadiness:vi.fn().mockResolvedValue({items:[],next_cursor:null})}));
vi.mock('../src/services/telemetryIdentity',()=>({canWriteTelemetry:()=>false,telemetryScope:()=> 'test'}));
import * as api from '../src/services/domainEvidence';
import type {EngineeringSession} from '../src/domain/engineeringSession';
import {DomainEvidencePanel} from '../src/components/chassis/domains/DomainEvidencePanel';

describe('documented domain observations',()=>{
 it('shows missing evidence without invented measurements or write authority',async()=>{
  render(<DomainEvidencePanel contextKey="test" session={null} recordingId={null} selection={[]} onSelection={()=>{}}/>);
  expect(screen.getByRole('heading',{name:'Contexto medido de pista'})).toBeInTheDocument();
  expect(screen.getByText('Selecciona una sesión con circuito antes de aportar contexto.')).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Guardar medición'})).not.toBeInTheDocument();
 });
});


const session=(id:string):EngineeringSession=>({id,revision:1,schema_version:'1.0.0',name:'QA session',session_type:'practice',other_label:null,provenance:'synthetic',circuit:{id:'circuit',revision:1},bike:null,rider:null,notes:'',team_id:null,created_by:null,created_at:'2026-10-26T10:00:00Z'});
it('reader can inspect session coverage but cannot write or attest',async()=>{
 render(<DomainEvidencePanel contextKey="reader" session={session('reader')} recordingId={null} selection={[]} onSelection={()=>{}}/>);
 expect(await screen.findByText('No hay contextos medidos guardados para esta sesión.')).toBeInTheDocument();
 expect(screen.queryByText('Aportar medición o importar CSV')).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Registrar revisión de observaciones'})).not.toBeInTheDocument();
});
it('drops a response from the previous context even if the transport resolves late',async()=>{
 let resolve!:(value:unknown)=>void;
 vi.mocked(api.listPackets).mockImplementationOnce(()=>new Promise(r=>{resolve=r as typeof resolve;}));
 const {rerender}=render(<DomainEvidencePanel contextKey="old" session={session('old')} recordingId={null} selection={[]} onSelection={()=>{}}/>);
 rerender(<DomainEvidencePanel contextKey="new" session={session('new')} recordingId={null} selection={[]} onSelection={()=>{}}/>);
 expect(await screen.findByText('No hay contextos medidos guardados para esta sesión.')).toBeInTheDocument();
 resolve({items:[{id:'old',domain:'weather',revision:99,created_at:'2026-10-26T10:00:00Z',assessment:{status:'contributed'}}],next_cursor:null});
 await new Promise(r=>setTimeout(r,0));
 expect(screen.queryByText(/r99/)).not.toBeInTheDocument();
});
