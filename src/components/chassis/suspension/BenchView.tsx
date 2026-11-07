import {useState} from 'react';
import {SignalPlot} from './SignalPlot';

type ForceChange={pair_count:number;rms_force_change_n:number;max_force_change_n:number};
type LagScenario={
 force_offset_samples:number;
 minimum_force_offset_s:number;
 maximum_force_offset_s:number;
 force_displacement?:ForceChange;
 force_velocity?:ForceChange;
};
type LagSensitivity={
 status:'evaluated'|'synchronization_reference_required'|'insufficient_common_samples';
 scenarios?:LagScenario[];
};

function BenchLagSensitivity({lag}:{lag:LagSensitivity|undefined}){
 const format=(v:number)=>v.toLocaleString('es-ES',{maximumSignificantDigits:5});
 return <section>
  <h5>Sensibilidad al desfase</h5>
  {lag?.status==='evaluated'?<>
   <p>Se empareja cada muestra de movimiento con la fuerza registrada una muestra antes o después. El cambio se calcula frente al emparejamiento original en el tramo común. Son escenarios hipotéticos de sensibilidad.</p>
   <div className="lab-table-scroll"><table>
    <thead><tr><th>Emparejamiento de fuerza</th><th>Desfase registrado (ms)</th><th>Curva</th><th>Pares</th><th>Cambio RMS (N)</th><th>Cambio máximo (N)</th></tr></thead>
    <tbody>{lag.scenarios?.flatMap(row=>{
     const curves=[['Fuerza–desplazamiento',row.force_displacement],['Fuerza–velocidad',row.force_velocity]] as const;
     return curves.map(([label,change])=>change&&<tr key={`${row.force_offset_samples}-${label}`}>
      <th scope="row">{row.force_offset_samples<0?'−1 muestra anterior':'+1 muestra posterior'}</th>
      <td>{format(1000*row.minimum_force_offset_s)} a {format(1000*row.maximum_force_offset_s)}</td>
      <td>{label}</td><td>{change.pair_count}</td><td>{format(change.rms_force_change_n)}</td><td>{format(change.max_force_change_n)}</td>
     </tr>);
    })}</tbody>
   </table></div>
  </>:<p>{lag?.status==='synchronization_reference_required'?'Se requiere una referencia de sincronización.':lag?.status==='insufficient_common_samples'?'Se requieren más muestras de movimiento con fuerza en común.':'Vuelve a analizar el ensayo para calcular la sensibilidad al desfase.'}</p>}
 </section>;
}

export function BenchView({result:r}:{result:Record<string,unknown>}){
 const times=r.times_s as number[]??[],[cursor,setCursor]=useState(times[0]??0),time=Math.max(times[0]??0,Math.min(cursor,times[times.length-1]??0));
 return <><p>{r.force_definition==='total_measured'?'Fuerza total medida; no es fuerza hidráulica aislada.':'Fuerza corregida según el método aportado; corrección no contrastada independientemente.'} Temperatura: {r.temperature_c==null?'desconocida':`${r.temperature_c} °C`}.</p>{Array.isArray(r.velocity_m_s)&&<SignalPlot title="Fuerza frente a velocidad" x={r.velocity_m_s as (number|null)[]} y={r.force_n as number[]} xLabel="Velocidad (m/s)" yLabel="Fuerza (N)" branches={r.branch as string[]}/>} {Array.isArray(r.displacement_m)&&<SignalPlot title="Fuerza frente a desplazamiento" x={r.displacement_m as number[]} y={r.force_n as number[]} xLabel="Desplazamiento (m)" yLabel="Fuerza (N)"/>}<p>Trabajo por ciclo completo (J): {Array.isArray(r.cycle_work_j)&&r.cycle_work_j.length?r.cycle_work_j.map(v=>Number(v).toPrecision(5)).join(', '):'no disponible; requiere desplazamiento, sincronización y convención de trabajo'}</p><BenchLagSensitivity lag={r.lag_sensitivity as LagSensitivity|undefined}/><details><summary>Series temporales del ensayo</summary>{times.length>1&&<label>Cursor temporal del banco <output>{time.toFixed(3)} s</output><input type="range" min={times[0]} max={times[times.length-1]} step="any" value={time} onChange={e=>setCursor(Number(e.target.value))}/></label>}<SignalPlot title="Fuerza registrada" x={times} y={r.force_n as number[]??[]} xLabel="Tiempo (s)" yLabel="Fuerza (N)" cursorX={time}/>{Array.isArray(r.displacement_m)&&<SignalPlot title="Desplazamiento registrado" x={times} y={r.displacement_m as number[]} xLabel="Tiempo (s)" yLabel="Desplazamiento (m)" cursorX={time}/>} {Array.isArray(r.velocity_m_s)&&<SignalPlot title="Velocidad del vástago" x={times} y={r.velocity_m_s as (number|null)[]} xLabel="Tiempo (s)" yLabel="Velocidad (m/s)" cursorX={time}/>}</details></>;
}
