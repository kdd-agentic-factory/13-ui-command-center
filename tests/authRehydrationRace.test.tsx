import {useEffect} from 'react';
import {render,screen,act,cleanup,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('../src/lib/insforge',()=>({insforge:{auth:{getCurrentUser:vi.fn(),refreshSession:vi.fn()}}}));
import {insforge} from '../src/lib/insforge';
import {AuthProvider,useAuth} from '../src/context/AuthContext';
import {configureTelemetryIdentity,setTelemetryUser,telemetryFetch} from '../src/services/telemetryIdentity';
function Startup(){
 const {user,authLoading}=useAuth();
 useEffect(()=>{void telemetryFetch('/api/telemetry/api/v1/engineering/sessions').catch(()=>{});},[]);
 return <span>{authLoading?'restoring':user?.id??'anonymous'}</span>;
}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it('a denied startup read cannot cancel successful cold cookie identity recovery',async()=>{
 configureTelemetryIdentity('authenticated');setTelemetryUser(null);
 let finish!:(value:unknown)=>void;
 vi.mocked(insforge.auth.getCurrentUser).mockImplementation(()=>new Promise(resolve=>{finish=resolve as typeof finish;}));
 const network=vi.fn();vi.stubGlobal('fetch',network);
 render(<AuthProvider><Startup/></AuthProvider>);
 await waitFor(()=>expect(finish).toBeDefined());
 await act(async()=>{await Promise.resolve();await Promise.resolve();});
 expect(network).not.toHaveBeenCalled();
 await act(async()=>finish({data:{user:{id:'verified-human'}},error:null}));
 expect(await screen.findByText('verified-human')).toBeInTheDocument();
});
