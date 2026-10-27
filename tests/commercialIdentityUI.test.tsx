import {render,screen,waitFor,cleanup,fireEvent} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
vi.mock('../src/domain/productProfile',async()=>({...await vi.importActual('../src/domain/productProfile'),productProfile:'chassis'}));
vi.mock('../src/context/AuthContext',()=>({useAuth:()=>({user:{id:'human-control'}})}));
vi.mock('../src/services/telemetryIdentity',()=>({configureTelemetryIdentity:vi.fn(),identitySnapshot:()=>({user:'human-control',team:null,role:'reader',generation:0}),setTelemetryUser:vi.fn(),setActiveTeam:vi.fn(),telemetryFetch:vi.fn(async()=>new Response(JSON.stringify({subject_id:'human-control',teams:[]})))}));
import {TeamProvider,useTeam} from '../src/context/TeamContext';
function View(){const t=useTeam();return <div><button onClick={()=>void t.reload()}>refresh access</button><span data-testid="ready">{String(t.ready)}</span><span>{t.error}</span><span>{t.mode}</span></div>;}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
it.each(['local','unexpected'])('commercial rejects backend mode %s',async mode=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({mode}))));render(<TeamProvider><View/></TeamProvider>);await waitFor(()=>expect(screen.getByText('blocked')).toBeInTheDocument());expect(screen.getByTestId('ready')).toHaveTextContent('false');});
it('commercial error keeps the workspace locked',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>{throw new Error('offline control');}));render(<TeamProvider><View/></TeamProvider>);await waitFor(()=>expect(screen.getByText('offline control')).toBeInTheDocument());expect(screen.getByTestId('ready')).toHaveTextContent('false');});
it('authenticated mode without verified team is not ready',async()=>{vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({mode:'authenticated'}))));render(<TeamProvider><View/></TeamProvider>);await waitFor(()=>expect(screen.getByText('authenticated')).toBeInTheDocument());expect(screen.getByTestId('ready')).toHaveTextContent('false');});

it('revalidates mode when refreshing previously authenticated access',async()=>{let mode='authenticated';vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({mode}))));render(<TeamProvider><View/></TeamProvider>);await waitFor(()=>expect(screen.getByText('authenticated')).toBeInTheDocument());mode='local';fireEvent.click(screen.getByText('refresh access'));await waitFor(()=>expect(screen.getByText('blocked')).toBeInTheDocument());expect(screen.getByTestId('ready')).toHaveTextContent('false')});
