import { useEffect, useRef, useState } from 'react';
import { getChassisProductStatus, type ChassisProductStatus as Status } from '../../services/chassisProductStatus';
export function ChassisProductStatus(){
  const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);const epoch=useRef(0);
  async function load(){const token=epoch.current;setBusy(true);setError('');try{const data=await getChassisProductStatus();if(token===epoch.current)setStatus(data);}catch{if(token===epoch.current){setStatus(null);setError('No se pudo comprobar el backend. Reintenta o revisa el servicio local.');}}finally{if(token===epoch.current)setBusy(false);}}
  useEffect(()=>{void load();const reset=()=>{epoch.current++;setStatus(null);setError('');setBusy(false);};window.addEventListener('telemetry-scope-changed',reset);return()=>{epoch.current++;window.removeEventListener('telemetry-scope-changed',reset);};},[]);
  return <div className="chassis-product-status" aria-label="Estado de Chassis">
    <span role="status">{status?'Backend disponible':busy?'Comprobando backend…':'Estado de backend sin verificar'}</span>
    {status&&<>
      <span>{status.ai.status==='ready'?`Modelo del explicador instalado · ${status.ai.model}`:status.ai.status==='not_configured'?'Explicador de comparación sin configurar':'Explicador de comparación no disponible'} · reglas deterministas conservadas</span>
      <span>Consulta el resultado de los agentes en Análisis y decisión.</span>
      <span>2D nativo experimental · contraste externo pendiente</span>
    </>}
    {error&&<p>{error}</p>}
    <button className="btn" disabled={busy} onClick={()=>void load()}>Comprobar estado</button>
  </div>;
}
