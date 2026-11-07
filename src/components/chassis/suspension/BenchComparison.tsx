import type {LabAnalysis} from '../../../domain/suspensionLab';
import {BenchView} from './BenchView';

function numberLabel(value:unknown, scale=1){
 return typeof value==='number'&&Number.isFinite(value)?(value*scale).toLocaleString('es-ES',{maximumSignificantDigits:5}):'Sin datos';
}

function excitation(analysis:LabAnalysis){
 const data=(analysis.result.excitation??{}) as Record<string,unknown>;
 const min=data.minimum_cycle_frequency_hz,max=data.maximum_cycle_frequency_hz;
 const lowForce=analysis.result.minimum_force_n,highForce=analysis.result.maximum_force_n;
 const peakSpeed=numberLabel(data.peak_absolute_velocity_m_s);
 return [
  numberLabel(data.stroke_m,1000),
  peakSpeed==='Sin datos'?peakSpeed:`${peakSpeed} (${data.velocity_method==='measured'?'medida':'estimada'})`,
  typeof min==='number'&&typeof max==='number'?`${numberLabel(min)} – ${numberLabel(max)}`:'Sin datos',
  numberLabel(data.complete_cycle_count),
  numberLabel(typeof lowForce==='number'&&typeof highForce==='number'?highForce-lowForce:null),
 ];
}

export function BenchComparison({reference:a,candidate:b}:{reference:LabAnalysis;candidate:LabAnalysis}){
 const ma=(a.source_manifest.metadata??{}) as Record<string,unknown>,mb=(b.source_manifest.metadata??{}) as Record<string,unknown>;
 const fields=['model_reference','serial_reference','component','mounting','zero_reference','force_definition'];
 const provenance = [
  ['calibration_reference', 'Calibración declarada'],
  ['clock_reference', 'Origen del reloj'],
  ['synchronization_reference', 'Sincronización declarada'],
 ];
 const conditions=[...fields,...provenance.map(([key])=>key)].every(k=>Boolean(ma[k])&&ma[k]===mb[k])
  &&a.result.temperature_c!=null&&a.result.temperature_c===b.result.temperature_c
  &&(ma.force_definition!=='corrected_documented'||Boolean(ma.correction_method)&&ma.correction_method===mb.correction_method);
 const ea=excitation(a),eb=excitation(b);
 const excitationLabels=['Carrera observada (mm)','Velocidad absoluta máxima (m/s)','Frecuencia de los ciclos completos (Hz)','Ciclos completos','Fuerza pico a pico (N)'];
 return <section aria-label="Comparación de ensayos">
  <h3>Comparación de ensayos medidos</h3>
  <p>{conditions?'Coinciden las declaraciones de adquisición indicadas.':'Condiciones incompletas o diferentes en las declaraciones de adquisición.'} La atribución al setup requiere controlar la excitación y repetir el ensayo con la sincronización verificada.</p>
  <p>El contraste físico independiente requiere los registros originales y una curva de referencia del mismo intervalo.</p>
  <div className="lab-table-scroll"><table>
   <thead><tr><th>Condición</th><th>Referencia</th><th>Candidato</th></tr></thead>
   <tbody>
    {[...fields,'configuration_reference'].map(k=><tr key={k}><th scope="row">{k}</th><td>{String(ma[k]??'No declarada')}</td><td>{String(mb[k]??'No declarada')}</td></tr>)}
    {provenance.map(([key,label])=><tr key={key}><th scope="row">{label}</th><td>{String(ma[key]??'No declarada')}</td><td>{String(mb[key]??'No declarada')}</td></tr>)}
    <tr><th scope="row">Temperatura (°C)</th><td>{String(a.result.temperature_c??'Desconocida')}</td><td>{String(b.result.temperature_c??'Desconocida')}</td></tr>
    {excitationLabels.map((label,i)=><tr key={label}><th scope="row">{label}</th><td>{ea[i]}</td><td>{eb[i]}</td></tr>)}
   </tbody>
  </table></div>
  <p>La carrera, la velocidad, la frecuencia y la fuerza pico a pico se resumen en el intervalo seleccionado de cada ensayo.</p>
  <h4>Referencia · {a.id.slice(-8)}</h4><BenchView result={a.result}/>
  <h4>Candidato · {b.id.slice(-8)}</h4><BenchView result={b.result}/>
 </section>;
}
