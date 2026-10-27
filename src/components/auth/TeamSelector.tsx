import {useState,type ReactNode} from 'react';
import {useTeam} from '../../context/TeamContext';
import {useAuth} from '../../context/AuthContext';
import {LoginModal} from './LoginModal';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';
export function TelemetryGate({children}:{children:ReactNode}){
 const t=useTeam();const {user,refreshUser,logout}=useAuth();const [login,setLogin]=useState(false);
 const {requestLeave}=useWorkspaceDraft();
 return <><div className="recorded-identity" role="region" aria-label="Identidad y equipo">
 {t.mode==='local'?<p>Modo local · sin autenticación de equipos · acceso de operador en este equipo.</p>:<>
 <strong>Espacio de equipo</strong>{user?<><label>Equipo activo <select aria-label="Equipo activo" value={t.team??''} onChange={e=>{const id=e.target.value;requestLeave(()=>t.choose(id));}}><option value="">Seleccionar equipo autorizado</option>{t.teams.map(x=><option key={x.id} value={x.id}>{x.id} · {x.role}</option>)}</select></label><button onClick={()=>requestLeave(()=>void logout())}>Cerrar sesión de usuario</button><button onClick={async()=>{await refreshUser();await t.reload();}}>Comprobar acceso</button></>:<button onClick={()=>setLogin(true)}>Iniciar sesión para Chassis</button>}
 {t.error&&<p role="alert">{t.error}</p>}{t.mode==='blocked'&&<button onClick={()=>void t.reload()}>Reintentar comprobación de identidad</button>}{t.mode==='loading'&&<p>Comprobando identidad…</p>}{t.mode==='authenticated'&&user&&t.teams.length===0&&<p>Sin membresías verificadas. Un administrador debe asignarte a un equipo.</p>}
 </>}
 </div>{t.ready?<div key={t.scope}>{children}</div>:<p>Selecciona una sesión y un equipo verificados para acceder a la telemetría.</p>}
 {login&&<LoginModal onClose={()=>setLogin(false)} onSuccess={async()=>{setLogin(false);await refreshUser();await t.reload();}}/>}</>;
}
