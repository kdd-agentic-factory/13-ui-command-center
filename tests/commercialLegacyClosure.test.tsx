import {it,expect,vi,afterEach} from 'vitest';
import {renderHook,act,cleanup,render,screen} from '@testing-library/react';
vi.mock('../src/domain/productProfile',async()=>({...await vi.importActual('../src/domain/productProfile'),productProfile:'chassis'}));
import {SettingsPage} from '../src/pages/SettingsCommercialPage';
import {useServiceStatus} from '../src/hooks/useServiceStatus';
import {useGatewayServiceStatus} from '../src/hooks/useGatewayServiceStatus';
import {RACE_COMMAND_CENTER_ENABLED} from '../src/config/serviceRegistry';
import {syncDecisionsFromBackend,decide,decisionsFor} from '../src/domain/decisions';
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
it('closes automatic and manual historical probes and previews',async()=>{const f=vi.fn(async()=>new Response('{}'));vi.stubGlobal('fetch',f);const a=renderHook(()=>useServiceStatus('https://legacy.fixture','/health'));const b=renderHook(()=>useGatewayServiceStatus());await act(async()=>{a.result.current.refresh();await b.result.current.refresh()});expect(f).not.toHaveBeenCalled();expect(RACE_COMMAND_CENTER_ENABLED).toBe(false)});
it('cannot sync or mark legacy decisions approved in commercial profile',async()=>{const f=vi.fn(async()=>new Response(JSON.stringify({approvals:[]})));vi.stubGlobal('fetch',f);await syncDecisionsFromBackend();const d=decisionsFor('race-engineer')[0];expect(d).toBeDefined();{expect(()=>decide(d.id,0,1)).toThrow();expect(decisionsFor('race-engineer').find(x=>x.id===d.id)?.status).toBe(d.status)}expect(f).not.toHaveBeenCalled()});

it('commercial settings omit historical service claims and probes',()=>{const f=vi.fn(async(_url:string)=>new Response(JSON.stringify({mode:'authenticated'})));vi.stubGlobal('fetch',f);render(<SettingsPage/>);expect(screen.queryAllByText('KDD Telemetry')).toHaveLength(0);expect(f.mock.calls.every(([url])=>url.startsWith('/api/telemetry/'))).toBe(true)});
