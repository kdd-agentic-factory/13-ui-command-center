import { fireEvent,render,screen } from '@testing-library/react';
import { beforeEach,expect,it,vi } from 'vitest';
import { WorkspaceDraftProvider,useWorkspaceDraft } from '../src/context/WorkspaceDraftContext';
import { TelemetryGate } from '../src/components/auth/TeamSelector';
const {choose,logout}=vi.hoisted(()=>({choose:vi.fn(),logout:vi.fn()}));
vi.mock('../src/context/TeamContext',()=>({useTeam:()=>({mode:'authenticated',ready:true,team:'a',teams:[{id:'a',role:'engineer'},{id:'b',role:'engineer'}],choose,reload:vi.fn()})}));
vi.mock('../src/context/AuthContext',()=>({useAuth:()=>({user:{id:'human'},logout,refreshUser:vi.fn()})}));
vi.mock('../src/components/auth/LoginModal',()=>({LoginModal:()=>null}));
function Dirty(){const {markDirty}=useWorkspaceDraft();return <button onClick={()=>markDirty(true,'engineering-session')}>Editar contexto</button>;}
beforeEach(()=>{vi.clearAllMocks();});
it('protects the engineering session draft before a voluntary team switch or logout',()=>{
  render(<WorkspaceDraftProvider><TelemetryGate><Dirty/></TelemetryGate></WorkspaceDraftProvider>);
  fireEvent.click(screen.getByText('Editar contexto'));fireEvent.change(screen.getByLabelText('Equipo activo'),{target:{value:'b'}});
  expect(screen.getByRole('alertdialog')).toBeInTheDocument();expect(choose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Seguir editando'));fireEvent.click(screen.getByText('Cerrar sesión de usuario'));
  expect(logout).not.toHaveBeenCalled();fireEvent.click(screen.getByText('Descartar cambios y continuar'));expect(logout).toHaveBeenCalledOnce();
});
