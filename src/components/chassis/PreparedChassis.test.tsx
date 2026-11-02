import {render,screen,fireEvent} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({setB:vi.fn(),calculate:vi.fn(),dirty:vi.fn(),projection:vi.fn()}));
vi.mock('../../services/bikeTechnicalProfiles',()=>({readProfileGeometry:mocks.projection}));
vi.mock('../../hooks/useChassisWorkspace',()=>({useChassisWorkspace:()=>({b:{values:{},assumed:{}},setB:mocks.setB,calculate:mocks.calculate,preview:null,busy:false,error:'',specifications:[],specError:'',updateSpecification:vi.fn()})}));
vi.mock('../../context/WorkspaceDraftContext',()=>({useWorkspaceDraft:()=>({markDirty:mocks.dirty})}));
vi.mock('../../services/telemetryIdentity',()=>({canWriteTelemetry:()=>true}));
vi.mock('./workshop/ChassisWorkshop',()=>({ChassisWorkshop:({onChange,onCalculate}:{onChange:(d:unknown)=>void;onCalculate:(o:unknown)=>void})=><><button onClick={()=>onChange({values:{front_radius_m:'220'},assumed:{}})}>Edit draft</button><button onClick={()=>onCalculate({mode:'static'})}>Calculate draft</button></>}));
import {PreparedChassis} from './PreparedChassis';
it('wires actual draft edits and static calculation before recording',()=>{
 render(<PreparedChassis bikeId="bike-id" workView="engineer"/>);
 fireEvent.click(screen.getByText('Edit draft'));
 expect(mocks.setB).toHaveBeenCalled();expect(mocks.dirty).toHaveBeenCalledWith(true,'prepared-chassis');
 fireEvent.click(screen.getByText('Calculate draft'));
 expect(mocks.calculate).toHaveBeenCalledWith({mode:'static'});
});
it('reports missing checked measurements without crashing or replacing the draft',async()=>{
 mocks.setB.mockClear();
 const bike={id:'00000000-0000-4000-8000-000000000001',revision:1};
 mocks.projection.mockResolvedValue({schema_version:'1.0.0',bike_reference:bike,values:{}});
 render(<PreparedChassis bikeId={bike.id} bikeReference={bike} workView="engineer"/>);
 fireEvent.click(screen.getByRole('button',{name:'Incorporar geometría de la ficha'}));
 await screen.findByText('No hay medidas contrastadas para completar campos vacíos');
 expect(mocks.setB).not.toHaveBeenCalled();
});
