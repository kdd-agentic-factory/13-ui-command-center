import {productProfile,assertCommercialIdentity} from '../domain/productProfile';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {useAuth} from './AuthContext';
import {configureTelemetryIdentity,identitySnapshot,setActiveTeam,setTelemetryUser,telemetryFetch,type TeamRole} from '../services/telemetryIdentity';
const base=import.meta.env.VITE_TELEMETRY_URL??'/api/telemetry';
type Team={id:string;role:TeamRole};
async function loadMode(){const r=await fetch(base+'/api/v1/identity/mode',{signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Servicio de identidad no disponible');const data=await r.json();assertCommercialIdentity(productProfile,data.mode);return data.mode as string;}
const Context=createContext({mode:'local',ready:true,error:'',teams:[] as Team[],team:null as string|null,role:'engineer' as TeamRole,scope:'local',choose:(_id:string)=>{},reload:async()=>{}});
export function TeamProvider({children}:{children:ReactNode}){
 const {user}=useAuth();const [mode,setMode]=useState('loading');const [error,setError]=useState('');const [teams,setTeams]=useState<Team[]>([]);const [snapshot,setSnapshot]=useState(identitySnapshot());
 useEffect(()=>{let live=true;loadMode().then(next=>{if(!live)return;configureTelemetryIdentity(next as 'local'|'authenticated');setMode(next);}).catch(e=>{if(live){setMode('blocked');setError(e.message);}});return()=>{live=false;};},[]);
 useEffect(()=>{const change=()=>setSnapshot(identitySnapshot());window.addEventListener('telemetry-scope-changed',change);return()=>window.removeEventListener('telemetry-scope-changed',change);},[]);
 useEffect(()=>{const blocked=()=>{setMode('blocked');setTeams([]);setError('Identidad comercial no disponible; comprueba el acceso');};window.addEventListener('telemetry-identity-blocked',blocked);return()=>window.removeEventListener('telemetry-identity-blocked',blocked);},[]);
 async function reload(){
  setTeams([]);
  let next:string;
  try{next=await loadMode();configureTelemetryIdentity(next as 'local'|'authenticated');setMode(next);setError('');}
  catch(e){setActiveTeam(null,'reader');setMode('blocked');setError(e instanceof Error?e.message:'Error de identidad');return;}
  if(next!=='authenticated'||!user)return;
  try{const r=await telemetryFetch(base+'/api/v1/teams');if(!r.ok)throw new Error('No se pudieron verificar los equipos');const data=await r.json();if(data.subject_id!==user.id||!Array.isArray(data.teams))throw new Error('Identidad de equipo incompatible');setTeams(data.teams);}
  catch(e){setError(e instanceof Error?e.message:'Error de identidad');}
 }
 useEffect(()=>{setTelemetryUser(user?.id??null);setActiveTeam(null,'reader');setTeams([]);if(mode==='authenticated')void reload();},[user?.id,mode]);
 const team=teams.find(t=>t.id===snapshot.team);
 const ready=mode==='local'||mode==='authenticated'&&!!user&&snapshot.user===user.id&&!!team;
 return <Context.Provider value={{mode,ready,error,teams,team:team?.id??null,role:team?.role??'reader',scope:mode==='local'?'local':snapshot.user+':'+snapshot.team,choose(id){const t=teams.find(t=>t.id===id);setActiveTeam(t?.id??null,t?.role??'reader');},reload}}>{children}</Context.Provider>;
}
export const useTeam=()=>useContext(Context);
