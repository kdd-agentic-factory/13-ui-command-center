import { useEffect, useState } from 'react';
import { TelemetryGate } from '../components/auth/TeamSelector';
import { ChassisReport } from '../components/chassis/ChassisReport';
import { activeRecording } from '../domain/recordedSession';
import { getChassisState, type ChassisState } from '../services/chassisTelemetry';
import { useNavigate } from '../context/NavContext';
import '../styles/recorded.css';
function SessionView({view}:{view:'setups'|'report'}){
  const [state,setState]=useState<ChassisState|null>(null),[error,setError]=useState('');const navigate=useNavigate();const id=activeRecording();
  useEffect(()=>{let live=true;setState(null);setError('');if(id)getChassisState(id).then(data=>{if(live)setState(data);}).catch(e=>{if(live)setError(e.message);});return()=>{live=false;};},[id]);
  return <div className="page recorded-workspace"><h1 className="page-title">{view==='setups'?'Revisiones de setup':'Evidencia e informe'}</h1><button className="btn" onClick={()=>navigate('chassis')}>Editar y comparar en Chassis</button>{error&&<p role="alert">{error}</p>}{!id?<p>Abre una sesión grabada para consultar sus revisiones e informes.</p>:!state&&!error?<p role="status">Cargando estado guardado…</p>:state&&view==='setups'?<section><h2>Revisiones guardadas de esta sesión</h2><p>Los valores corresponden a revisiones persistidas. Una alternativa calculada no es otra sesión medida.</p>{state.setups.length?state.setups.map(setup=><article className="recorded-setup-revision" key={setup.id}><h3>{setup.label} · versión {setup.version}</h3><p>Moto {setup.bike_id} · revisión {setup.id}</p><details><summary>Medidas y procedencia guardadas</summary><pre>{JSON.stringify({values:setup.values,curve:setup.linkage_curve},null,2)}</pre></details></article>):<p>No hay revisiones guardadas. Registra el setup en Chassis.</p>}</section>:state?.comparison?<ChassisReport comparisonId={state.comparison.id}/>:state&&<p>Guarda una comparación en Chassis para generar el informe reproducible.</p>}</div>;
}
export function ChassisSessionPage({view}:{view:'setups'|'report'}){return <TelemetryGate><SessionView view={view}/></TelemetryGate>;}
