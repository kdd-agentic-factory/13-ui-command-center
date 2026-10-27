import type {MeasurementReference} from '../../domain/engineeringSession';
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const keys=(v:Record<string,unknown>,allowed:string[])=>Object.keys(v).every(k=>allowed.includes(k));
const one=(v:unknown,allowed:string[]):v is string=>typeof v==='string'&&allowed.includes(v);
const list=(v:unknown,allowed:string[])=>v===undefined||(Array.isArray(v)&&v.length<=20&&v.every(item=>one(item,allowed)));
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const units:Record<string,string>={sector_length_m:'m',bank_angle_rad:'rad',gradient_rad:'rad',air_temperature_k:'K',surface_temperature_k:'K',relative_humidity_fraction:'1',wind_speed_m_s:'m/s',tire_pressure_pa:'Pa',tire_temperature_k:'K',engine_speed_rad_s:'rad/s',throttle_fraction:'1',vehicle_speed_m_s:'m/s',lab_suspension_displacement:'m',lab_suspension_velocity:'m/s',bench_force_n:'N',cycle_work_j:'J',dominant_frequency_hz:'Hz',trail_m:'m',normal_trail_m:'m',wheelbase_m:'m',longitudinal_acceleration:'m/s2',suspension_displacement:'m',filtered_suspension_velocity:'m/s'};
function reference(v:unknown):v is MeasurementReference{return record(v)&&keys(v,['evidence_id','metric','measurement','unit'])&&typeof v.evidence_id==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(v.evidence_id)&&typeof v.metric==='string'&&Object.prototype.hasOwnProperty.call(units,v.metric)&&v.unit===units[v.metric]&&one(v.measurement,['value_a','value_b','delta','min','max','value']);}
const refs=(v:unknown,required=false)=>v===undefined?!required:Array.isArray(v)&&v.length<=20&&(!required||v.length>0)&&v.every(reference);
function hypotheses(v:unknown){return v===undefined||(Array.isArray(v)&&v.length<=20&&v.every(h=>record(h)&&keys(h,['label','code','references'])&&(h.label===undefined||h.label==='hypothesis')&&one(h.code,['measurement_artifact','setup_difference','unresolved_mechanism'])&&Array.isArray(h.references)&&h.references.length<=8&&refs(h.references,true)));}
function valid(v:unknown){
 if(!record(v)||!list(v.limitations,['no_external_validation','context_limited','model_digest_unknown']))return false;
 if(v.kind==='abstain')return keys(v,['kind','reason','references','limitations'])&&one(v.reason,['insufficient_evidence','model_capability_limit','context_not_representable'])&&refs(v.references);
 if(v.kind==='request_input')return keys(v,['kind','request_id','references','limitations'])&&hash(v.request_id)&&refs(v.references);
 return v.kind==='review_supported'&&keys(v,['kind','references','hypotheses','alternatives','assumptions','limitations'])&&refs(v.references,true)&&hypotheses(v.hypotheses)&&hypotheses(v.alternatives)&&list(v.assumptions,['frozen_snapshot_only','no_causal_inference']);
}
const errorPhases=['context','transport','schema','expansion','policy','deadline'];
const errorCauses=['context_unavailable','context_mismatch','model_unavailable','model_deadline_exceeded','invalid_decision_schema','unknown_decision_reference','decision_not_applicable','decision_contradiction','decision_exceeds_limit','execution_deadline_exceeded'];
export function AgentDecision({decision,contextMode,status,error}:{decision?:unknown;contextMode?:unknown;status:string;diagnostics?:unknown;error?:unknown}){
 if(decision==null&&contextMode==null&&error==null)return null;
 const incompatible=<p role="alert">Formato de decisión incompatible; recarga una versión compatible.</p>;
 if(!one(contextMode,['reference_review','input_triage','domain_triage','blocked'])&&contextMode!=null)return incompatible;
 if(error!=null){
  if(!record(error)||!keys(error,['phase','cause','response_sha256'])||!one(error.phase,errorPhases)||!one(error.cause,errorCauses)||(error.response_sha256!=null&&!hash(error.response_sha256))||!one(status,['failed','unavailable','timed_out','cancelled'])||decision!=null)return incompatible;
  return <div className="engineering-agent-decision"><p><strong>Respuesta de IA no validada</strong> · El análisis no se ha completado.</p><p>Etapa: {error.phase}. Código: {error.cause}.</p></div>;
 }
 if(decision==null)return <p>Comprobación previa del servidor: análisis bloqueado antes de obtener una decisión de IA.</p>;
 if(!one(contextMode,['reference_review','input_triage','domain_triage'])||!valid(decision)||!record(decision))return incompatible;
 const review=decision.kind==='review_supported';
 if(review?(status!=='succeeded'||contextMode!=='reference_review'):(status!=='blocked_missing_inputs'||contextMode==='blocked'))return incompatible;
 const reason=decision.reason==='model_capability_limit'?'Límite de capacidad del modelo.':decision.reason==='context_not_representable'?'El contexto no permite una interpretación fiable.':'La evidencia no permite concluir.';
 return <div className="engineering-agent-decision">
  {contextMode==='domain_triage'&&<p><strong>Completar contexto del dominio</strong> · Esta petición no habilita cambios físicos.</p>}
  {contextMode==='input_triage'&&<p><strong>Corrección de entradas</strong> · El análisis físico permanece bloqueado.</p>}
  {review?<p><strong>Revisión sustentada</strong> · Alcance limitado a las referencias seleccionadas; sin validación causal.</p>:decision.kind==='abstain'?<p><strong>El agente no pudo concluir</strong> · {reason}</p>:<p><strong>Petición concreta del agente</strong> · Consulta la entrada y el diagnóstico comprobados por el servidor.</p>}
  {Array.isArray(decision.references)&&decision.references.length>0&&<ul>{decision.references.filter(reference).map((r,i)=><li key={i}>{r.metric}.{r.measurement} · {r.unit} · referencia {r.evidence_id.slice(-8)}</li>)}</ul>}
  <p>La decisión final corresponde al Crew Chief humano titular o a su sustituto designado.</p>
 </div>;
}
