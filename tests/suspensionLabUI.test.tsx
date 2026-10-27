import {render,screen,fireEvent} from '@testing-library/react';
import {describe,it,expect,vi} from 'vitest';
vi.mock('../src/services/suspensionLab',()=>({listAcquisitions:vi.fn().mockResolvedValue({items:[],next_cursor:null}),listAnalyses:vi.fn().mockResolvedValue({items:[],next_cursor:null})}));
vi.mock('../src/services/telemetryIdentity',()=>({canWriteTelemetry:()=>false,telemetryScope:()=> 'test'}));
import {SuspensionLabPanel} from '../src/components/chassis/suspension/SuspensionLabPanel';
import * as api from '../src/services/suspensionLab';
describe('measured suspension lab',()=>{
 it('shows an honest empty state and no synthetic curves',async()=>{
  render(<SuspensionLabPanel contextKey="test" recordingId={null}/>);
  expect(screen.getByRole('heading',{name:'Banco y señales'})).toBeInTheDocument();
  expect(await screen.findByText('No hay ensayos de banco guardados en este equipo.')).toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Importar ensayo medido'})).not.toBeInTheDocument();
 });
 it('allows recovering the catalog after the backend becomes available',async()=>{
  vi.mocked(api.listAcquisitions).mockRejectedValueOnce(new Error('Backend unavailable'));
  render(<SuspensionLabPanel contextKey="recover" recordingId={null}/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Backend unavailable');
  fireEvent.click(screen.getByRole('button',{name:'Recargar laboratorio'}));
  expect(await screen.findByText('No hay ensayos de banco guardados en este equipo.')).toBeInTheDocument();
 });
});
