import { vi } from 'vitest';

export const ids = { session: '00000000-0000-4000-8000-000000000001', second: '00000000-0000-4000-8000-000000000002', circuit: '00000000-0000-4000-8000-000000000003', bike: '00000000-0000-4000-8000-000000000004', rider: '00000000-0000-4000-8000-000000000005', recording: '00000000-0000-4000-8000-000000000006', comparison: '00000000-0000-4000-8000-000000000007', a: '00000000-0000-4000-8000-000000000008', b: '00000000-0000-4000-8000-000000000009' };
const stamp = { schema_version: '1.0.0', team_id: null, created_by: null, created_at: '2026-10-25T10:00:00Z' };
export const entity = (kind: 'circuit'|'bike'|'rider', revision = 1) => ({ ...stamp, id: ids[kind], kind, revision, name: {circuit:'Circuito medido',bike:'Moto taller',rider:'Piloto titular'}[kind], notes: '', retired: false });
export const session = (name = 'Tanda guardada', id = ids.session) => ({ ...stamp, id, revision: 1, name, session_type: 'practice', provenance: 'recorded', other_label: null, circuit: null, bike: null, rider: null, notes: '' });
export const recording = () => ({id:ids.recording,filename:'Fuente real.csv',source:'aim',sha256:'a'.repeat(64),geometry_version:null,channels:[],laps:[]});
export const chassisState = () => {
  const a={id:ids.a,version:3,bike_id:'moto-confirmada',values:{},label:'A'},b={id:ids.b,version:4,bike_id:'moto-confirmada',values:{},label:'B'};
  return {bike_id:'moto-confirmada',setups:[a,b],bindings:[],comparison:{id:ids.comparison,session_id:ids.recording,setup_a_id:ids.a,setup_b_id:ids.b,setup_a:a,setup_b:b,source_sha256:'a'.repeat(64),interval_s:[1.25,8]}};
};
export function transport() {
  const operations=new Map<string,{fingerprint:string;saved:ReturnType<typeof session>}>();
  const state = { sessions: [] as ReturnType<typeof session>[], catalog: { circuit: [entity('circuit')], bike: [entity('bike')], rider: [entity('rider')] }, recording:recording(), chassis:chassisState(), conflict: false, writes: [] as {path:string;body:any}[] };
  const fetch = vi.fn(async (input: RequestInfo|URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const path = url.pathname.replace('/api/telemetry/api/v1/engineering', '');
    const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), {status, headers: {'Content-Type':'application/json'}});
    const method = init?.method ?? 'GET';
    if(method==='GET'&&url.pathname.endsWith('/recorded/'+ids.recording))return reply(state.recording);
    if(method==='GET'&&url.pathname.endsWith('/chassis/sessions/'+ids.recording+'/state'))return reply(state.chassis);
    if (method === 'GET' && path === '/sessions') return reply({items:state.sessions,next_cursor:null});
    if (method === 'GET' && path.startsWith('/sessions/')) return reply(state.sessions.find(s=>s.id===path.split('/')[2]), state.sessions.some(s=>s.id===path.split('/')[2])?200:404);
    if (method === 'GET' && /^\/catalog\/[^/]+$/.test(path)) return reply({items:state.catalog[path.split('/')[2] as keyof typeof state.catalog],next_cursor:null});
    if (method === 'GET' && path.startsWith('/catalog/')) { const kind=path.split('/')[2] as keyof typeof state.catalog; return reply(entity(kind, Number(url.searchParams.get('revision')??1))); }
    if (['POST','PUT'].includes(method)) {
      const body = JSON.parse(String(init?.body)); state.writes.push({path,body});
      const envelope=method==='POST'?['operation_id','body']:['expected_revision','body'];
      if(Object.keys(body).sort().join()!==envelope.sort().join()) return reply({detail:'Unexpected envelope'},422);
      if(method==='POST'&&!/^[0-9a-f-]{36}$/.test(body.operation_id)) return reply({detail:'Canonical UUID required'},422);
      if (path.startsWith('/sessions')) {
        const allowed=['name','session_type','other_label','provenance','circuit','bike','rider','notes'];
        if(Object.keys(body.body).some(k=>!allowed.includes(k)) || !body.body.name || (body.body.session_type==='other'&&!body.body.other_label?.trim())) return reply({detail:'Strict SessionInput'},422);
        for(const kind of ['circuit','bike','rider']) {const ref=body.body[kind]; if(ref&&Object.keys(ref).sort().join()!=='id,revision') return reply({detail:'Strict Reference'},422);}
        if(state.conflict) return reply({detail:'Revision conflict'},409);
        if(method==='POST'&&operations.has(body.operation_id)) {
          const prior=operations.get(body.operation_id)!;
          return prior.fingerprint===JSON.stringify(body.body)?reply(prior.saved):reply({detail:'Operation reused with different context'},409);
        }
        const old=state.sessions.find(s=>s.id===path.split('/')[2]);
        const createdId=!state.sessions.some(s=>s.id===ids.session)?ids.session:!state.sessions.some(s=>s.id===ids.second)?ids.second:crypto.randomUUID();
        const saved={...session(),...body.body,id:old?.id??createdId,revision:old?old.revision+1:1};
        if(method==='POST')operations.set(body.operation_id,{fingerprint:JSON.stringify(body.body),saved});
        state.sessions=[...state.sessions.filter(s=>s.id!==saved.id),saved]; return reply(saved);
      }
      const kind=path.split('/')[2] as keyof typeof state.catalog;
      if(Object.keys(body.body).sort().join()!=='name,notes') return reply({detail:'Strict CatalogInput'},422);
      const saved={...entity(kind),...body.body}; state.catalog[kind]=[saved]; return reply(saved);
    }
    throw new Error(`Unexpected transport ${method} ${url.pathname}`);
  });
  vi.stubGlobal('fetch', fetch);
  return {state,fetch};
}
