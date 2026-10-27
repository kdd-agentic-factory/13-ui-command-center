import type {InputRequest,InputRequestDiagnostic} from '../../domain/engineeringSession';
import {AgentDecision} from './AgentDecision';

const sources={comparison:'Comparación',setup_a:'Setup A',setup_b:'Setup B',domain:'Contexto del dominio'};
const fields={interval_s:'Intervalo de telemetría',calibration:'Calibración del canal',linkage_curve:'Curva de suspensión',values_si:'Medición del setup',track_context:'Contexto del circuito',weather_context:'Contexto del clima',tires_powertrain_context:'Contexto de neumáticos y motor'};
const parameters={observation_attestation:'Revisión documental de observaciones',source_calibration:'Referencia de calibración',eligible_original_clock:'Reloj original admisible',source_validation:'Validación de la fuente',front_radius_m:'Radio delantero (m)',rake_rad:'Ángulo de lanzamiento (rad)',offset_m:'Offset (m)',wheelbase_m:'Distancia entre ejes (m)',mass_kg:'Masa (kg)',front_weight_fraction:'Fracción de peso delantero',cg_height_m:'Altura del centro de gravedad (m)',spring_rate_n_m:'Rigidez del muelle (N/m)',preload_m:'Precarga (m)',motion_ratio:'Relación de movimiento',motion_ratio_slope_per_m:'Variación de la relación (1/m)'};
const reasons={absent:'Valor ausente solicitado',unmeasured:'Medición no acreditada',incompatible:'Incompatibilidad declarada',domain_unrepresentable:'Dominio no representable'};
const reviews={geometry_review:'Revisión geométrica',suspension_replay:'Replay de suspensión',physical_setup_change:'Cambio físico de setup',domain_review:'Revisión del dominio'};
const states={absent:'Ausente',present:'Presente',unmeasured:'Sin medir',measured:'Medido',incompatible:'Incompatible',unrepresented:'No representado',unknown:'Sin comprobar'};
const has=(object:object,key:unknown):key is string=>typeof key==='string'&&Object.prototype.hasOwnProperty.call(object,key);
const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
const key=(r:InputRequest)=>[r.source,r.field,r.parameter??'',r.blocks].join('|');

function validRequest(value:unknown):value is InputRequest{
  if(!record(value)||Object.keys(value).some(k=>!['source','field','parameter','reason','blocks'].includes(k)))return false;
  if(!has(sources,value.source)||!has(fields,value.field)||!has(reasons,value.reason)||!has(reviews,value.blocks))return false;
  const allowed={comparison:['interval_s','calibration'],setup_a:['linkage_curve','values_si'],setup_b:['linkage_curve','values_si'],domain:['track_context','weather_context','tires_powertrain_context']};
  if(!allowed[value.source as InputRequest['source']].includes(value.field))return false;
  const domainParameters=['observation_attestation','source_calibration','eligible_original_clock','source_validation'];
  if(value.source==='domain'){if(value.parameter!=null&&!domainParameters.includes(String(value.parameter)))return false;}
  else if(value.field==='values_si'?!has(parameters,value.parameter)||domainParameters.includes(String(value.parameter)):value.parameter!=null)return false;
  return (value.source==='domain')===(value.blocks==='domain_review')&&(value.reason!=='domain_unrepresentable'||value.source==='domain');
}
function validDiagnostic(value:unknown):value is InputRequestDiagnostic{
  return record(value)&&Object.keys(value).every(k=>['request','observed_state'].includes(k))&&validRequest(value.request)&&has(states,value.observed_state);
}
function recovery(r:InputRequest){
  if(r.source==='domain')return r.parameter==='observation_attestation'?'Abre Contexto medido de pista, consulta la medida y registra su revisión documental.':r.parameter==='eligible_original_clock'?'Contrasta el reloj original con la fuente; no se reparan muestras.':r.parameter==='source_validation'?'Aporta el contraste de la fuente; guardar o revisar no la certifica.':r.parameter==='source_calibration'?'Documenta la calibración del instrumento y crea una nueva revisión.':'Aporta un contexto medido para este dominio y selecciónalo para el próximo análisis.';
  if(r.field==='interval_s')return 'Selecciona y guarda el intervalo en la comparación.';
  if(r.field==='calibration')return 'Revisa y guarda la calibración del canal en la comparación.';
  if(r.field==='linkage_curve')return 'Añade una curva medida al setup indicado y crea una revisión.';
  return 'Comprueba la medición y su procedencia en el setup indicado y guarda una revisión.';
}
export function InputRequests({requests,diagnostics,status}:{requests?:unknown;diagnostics?:unknown;status:string}){
  if(requests==null||(Array.isArray(requests)&&requests.length===0))return null;
  if(!Array.isArray(requests)||requests.length>20||!requests.every(validRequest))return <p role="alert">Formato de solicitudes incompatible; recarga una versión compatible.</p>;
  const checks=diagnostics??[];
  if(new Set(requests.map(key)).size!==requests.length||!Array.isArray(checks)||checks.length>20||!checks.every(validDiagnostic)||new Set(checks.map(v=>key(v.request))).size!==checks.length||checks.some(v=>!requests.some(r=>key(r)===key(v.request)&&r.reason===v.request.reason)))return <p role="alert">Formato de solicitudes incompatible; recarga una versión compatible.</p>;
  return <div className="engineering-input-requests"><h5>Entradas concretas solicitadas</h5><ul>{requests.map(r=>{
    const state=checks.find(d=>key(d.request)===key(r))?.observed_state??'unknown';
    const expected=r.reason==='domain_unrepresentable'?'unrepresented':r.reason;
    const rejected=status==='failed'||(state!=='unknown'&&state!==expected);
    return <li key={key(r)}><strong>{sources[r.source]} · {r.parameter?parameters[r.parameter]:fields[r.field]}</strong>
      <p>{reasons[r.reason]} · Tarea afectada: {reviews[r.blocks]}.</p><p>Estado comprobado: {states[state]}.</p>
      <p>{rejected?'La solicitud ha sido rechazada; revisa el diagnóstico antes de aportar datos.':state==='unknown'?'No se ha podido comprobar este campo; revisa la solicitud antes de aportar datos.':recovery(r)}</p>
    </li>;
  })}</ul></div>;
}

export function ReportInputRequests({branches}:{branches:Record<string,unknown>[]}){
  return <>{branches.map((branch,index)=>{
    const requests=branch.requested_inputs;
    if((requests==null||(Array.isArray(requests)&&requests.length===0))&&branch.model_decision==null&&branch.decision_error==null&&branch.decision_mode==null)return null;
    return <div key={index}><h4>Solicitudes · {typeof branch.agent_id==='string'?branch.agent_id.slice(0,128):'Agente'}</h4>
      <AgentDecision decision={branch.model_decision} contextMode={branch.decision_mode} status={typeof branch.status==='string'?branch.status:'unknown'} error={branch.decision_error}/><InputRequests requests={requests} diagnostics={branch.request_diagnostics} status={typeof branch.status==='string'?branch.status:'unknown'}/></div>;
  })}</>;
}
