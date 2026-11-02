import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
const mock=vi.hoisted(()=>({read:vi.fn(),save:vi.fn(),dirty:vi.fn()}));
vi.mock('../../services/bikeTechnicalProfiles',()=>({readBikeProfile:mock.read,saveBikeProfile:mock.save}));
vi.mock('../../services/telemetryIdentity',()=>({identitySnapshot:()=>({team:'team-a',user:'user-a',role:'engineer',mode:'authenticated'})}));
vi.mock('../../context/WorkspaceDraftContext',()=>({useWorkspaceDraft:()=>({markDirty:mock.dirty})}));
import {BikeTechnicalProfile} from './BikeTechnicalProfile';
it('prepares an incomplete bike before recording and persists edited identity',async()=>{
 mock.read.mockResolvedValue(null);
 mock.save.mockImplementation(async(_bike,expected,body)=>({revision:expected+1,body}));
 render(<BikeTechnicalProfile bike={{id:'00000000-0000-4000-8000-000000000001',revision:1}} name="Test bike"/>);
 await screen.findByText('Sin ficha guardada');
 fireEvent.change(screen.getByLabelText('Marca'),{target:{value:'Example'}});
 fireEvent.click(screen.getByRole('button',{name:'Guardar ficha'}));
 await waitFor(()=>expect(mock.save).toHaveBeenCalled());
 expect(mock.save.mock.calls[0][2].identity.make).toBe('Example');
 expect(mock.save.mock.calls[0][2].measurements).toEqual({});
 expect(mock.save.mock.calls[0][2].components).toEqual([]);
 await screen.findByText('Ficha guardada · revisión 1');
});
it('does not save over an unavailable profile',async()=>{
 mock.read.mockRejectedValueOnce(new Error('Servicio no disponible'));
 render(<BikeTechnicalProfile bike={{id:'00000000-0000-4000-8000-000000000002',revision:1}} name="Unavailable"/>);
 await screen.findByRole('alert');
 expect(screen.getByRole('button',{name:'Guardar ficha'})).toBeDisabled();
});
it('ignores a late response from the previously selected bike',async()=>{
 let finish!:(value:unknown)=>void;
 mock.read.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValueOnce(null);
 const first={id:'00000000-0000-4000-8000-000000000003',revision:1};
 const view=render(<BikeTechnicalProfile bike={first} name="First"/>);
 view.rerender(<BikeTechnicalProfile bike={{...first,id:'00000000-0000-4000-8000-000000000004'}} name="Second"/>);
 await screen.findByText('Sin ficha guardada');
 await act(async()=>finish({revision:9,body:{identity:{make:'Wrong bike'}}}));
 expect(screen.getByLabelText('Marca')).toHaveValue('');
});
