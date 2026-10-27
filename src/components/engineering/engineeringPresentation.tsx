/** Presentation labels only: persisted contracts and downloaded reports keep original codes. */
const labels: Record<string,string> = {
  suspension_observations_exploratory:'Las observaciones de suspensión son exploratorias y requieren contraste independiente',
  suspension_specialist_contract_not_validated:'Las nuevas observaciones de suspensión aún requieren validar el contrato de especialistas; no habilitan una decisión física',
  measurement:'Medición', controlled_test:'Prueba controlada', setup_change:'Cambio de setup',
  collect_validated_inputs:'Recopilar entradas validadas', repeat_measurement:'Repetir medición', compare_frozen_setups:'Comparar setups guardados',
  collect_missing_evidence:'Recopilar evidencia ausente', repeat_for_consistency:'Comprobar repetibilidad', compare_persisted_alternatives:'Comparar alternativas persistidas',
  verify_input_provenance_and_units:'Verificar procedencia y unidades de las entradas',
  compare_repeated_metrics_to_frozen_reference:'Comparar mediciones repetidas con la referencia congelada',
  compare_persisted_ab_and_record_observed_response:'Comparar A/B guardados y registrar la respuesta observada',
  retain_session_and_interval:'Conservar sesión e intervalo', validate_source_before_physical_action:'Validar la fuente antes de actuar físicamente',
  record_actual_setup_revision:'Registrar la revisión real del setup', record_units_and_provenance:'Registrar unidades y procedencia',
  no_optimality_or_gain_claim:'Sin afirmación de óptimo ni ganancia', no_causal_validation:'Sin validación causal', no_external_validation:'Sin validación externa',
  experimental_source_blocks_physical_action:'La fuente experimental bloquea acciones físicas',
  measurement_artifact:'Posible artefacto de medición', unresolved_mechanism:'Mecanismo sin resolver', context_not_comparable:'Contexto no comparable',
  agreement:'Acuerdo', material_disagreement:'Desacuerdo material', not_comparable:'No comparable', insufficient_evidence:'Evidencia insuficiente',
  matching_frozen_measurements:'Coinciden las mediciones congeladas', different_hypotheses:'Hipótesis diferentes', explicit_parameter_contradiction:'Contradicción explícita del parámetro', missing_parameter_evidence:'Falta evidencia del parámetro',
  hypothesis_difference:'Diferencia de hipótesis', parameter_contradiction:'Contradicción de parámetros',
  queued:'En cola', running:'En curso', succeeded:'Completado', blocked_missing_inputs:'Bloqueado: evidencia pendiente', unavailable:'No disponible', failed:'Fallido', timed_out:'Plazo agotado', cancelled:'Cancelado', sealed:'Sellada', not_requested:'No solicitada',
  principal:'Principal', review:'Revisión', blind_review:'Revisión ciega', informed_review:'Revisión informada', published:'Publicada', pending:'Pendiente', validated:'Validada', experimental:'Experimental',
  model_unavailable:'Modelo no disponible', model_deadline_exceeded:'El modelo agotó su plazo', execution_deadline_exceeded:'La ejecución agotó su plazo', domain_context_not_projected:'Falta contexto del dominio', biometric_inference_not_enabled:'Inferencia biométrica no habilitada',
  model_reported_missing_inputs:'Petición de evidencia del modelo; consulta sus entradas pendientes',
  model_reported_insufficient_evidence:'El modelo declara evidencia insuficiente sin concretar una entrada; revisar el análisis',
  model_evidence_references_missing:'La respuesta no incluye referencias de medición; revisar el análisis',
  model_request_not_actionable:'El modelo no concreta la entrada necesaria; revisar su respuesta',
  requested_input_state_mismatch:'La solicitud contradice el estado guardado; respuesta rechazada',
  input_request_not_applicable:'La solicitud no corresponde a esta revisión; respuesta rechazada',
  input_request_not_verifiable:'No se puede comprobar la solicitud con el contexto guardado',
  additional_evidence:'Evidencia adicional solicitada; el modelo no especifica qué dato falta',
  validated_context:'Contexto validado solicitado por el modelo',
  measured_linkage_curve:'Curva de suspensión medida solicitada por el modelo',
  requested_input_already_present:'El modelo pide una curva medida ya incluida en A/B; resultado rechazado',
  same_model_family:'Ambas ramas usan la misma familia de modelo', model_digest_unknown:'Digest del modelo no acreditado', priority_selection_not_exhaustive:'Se presenta una prioridad seleccionada; no es una cobertura exhaustiva',
  assumptions:'Supuestos', missing_inputs:'Entradas solicitadas', limitations:'Límites', proposed_tests:'Pruebas propuestas', hypotheses:'Hipótesis',
  'Collect validated inputs with explicit units and provenance before evaluating a physical action.':'Recopilar entradas validadas con unidades y procedencia explícitas antes de evaluar una acción física.',
  'Repeat the referenced measurements over the retained session interval and compare with the frozen reference.':'Repetir las mediciones referenciadas en el intervalo de la sesión y compararlas con la referencia congelada.',
  'Compare the persisted A and B revisions using the referenced measurements; record observed response without predicting gain.':'Comparar las revisiones A y B guardadas con las mediciones referenciadas; registrar la respuesta observada sin predecir ganancias.',
};
export const engineeringLabel=(code:string)=>labels[code]??`Código técnico: ${code}`;
export const shortIdentifier=(value:string)=>value.length>16?`${value.slice(0,8)}…${value.slice(-4)}`:value;
export function EngineeringIdentifier({value,label='ID'}:{value:string|null;label?:string}){
  if(!value)return <span>Sin {label.toLowerCase()}</span>;
  return <details className="engineering-identifier"><summary>{label} {shortIdentifier(value)}</summary><code>{value}</code></details>;
}
