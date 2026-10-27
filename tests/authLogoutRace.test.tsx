import {act,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {AuthProvider,useAuth} from '../src/context/AuthContext';
import {insforge} from '../src/lib/insforge';
vi.mock('../src/lib/insforge',()=>({insforge:{auth:{getCurrentUser:vi.fn(),signOut:vi.fn(async()=>{})}}}));
function Probe(){const a=useAuth();return <><span>{a.user?.id??'anonymous'}</span><button onClick={()=>void a.logout()}>logout</button></>;}
it('does not resurrect a user when a pending restore finishes after logout',async()=>{
 type Result=Awaited<ReturnType<typeof insforge.auth.getCurrentUser>>;
 let finish!:(v:Result)=>void;
 vi.mocked(insforge.auth.getCurrentUser).mockReturnValue(new Promise(r=>{finish=r;}) as ReturnType<typeof insforge.auth.getCurrentUser>);
 render(<AuthProvider><Probe/></AuthProvider>);fireEvent.click(screen.getByText('logout'));
 await act(async()=>{finish({data:{user:{id:'old-user',email:'qa@example.invalid'}},error:null} as Result);});
 await waitFor(()=>expect(screen.getByText('anonymous')).toBeInTheDocument());
});
