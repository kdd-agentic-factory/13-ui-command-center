import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {InputRequests,ReportInputRequests} from '../src/components/engineering/InputRequests.tsx';
import {ContrastPanel} from '../src/components/engineering/ContrastPanel.tsx';

const interval = {source:'comparison',field:'interval_s',parameter:null,reason:'absent',blocks:'suspension_replay'};
const html = (requests, diagnostics=[], status='blocked_missing_inputs') => renderToStaticMarkup(createElement(InputRequests,{requests,diagnostics,status}));

test('a checked missing interval names the field and recovery',()=>{
  const out=html([interval],[{request:interval,observed_state:'absent'}]);
  assert.match(out,/Intervalo de telemetría/);
  assert.match(out,/Comparación/);
  assert.match(out,/Ausente/);
  assert.match(out,/Selecciona y guarda el intervalo/);
});
test('a contradicted curve request never tells the user to upload it again',()=>{
  const curve={source:'setup_a',field:'linkage_curve',parameter:null,reason:'unmeasured',blocks:'suspension_replay'};
  const out=html([curve],[{request:curve,observed_state:'measured'}],'failed');
  assert.match(out,/Medido/);
  assert.match(out,/solicitud ha sido rechazada/);
  assert.doesNotMatch(out,/Añade una curva/);
});
test('historical absent requests do not fabricate a field',()=>{
  assert.equal(html(undefined), '');
});
test('an unsupported domain is not described as a missing measurement',()=>{
  const r={source:'domain',field:'weather_context',parameter:null,reason:'domain_unrepresentable',blocks:'domain_review'};
  const out=html([r],[{request:r,observed_state:'unrepresented'}]);
  assert.match(out,/todavía no se entrega/);
  assert.doesNotMatch(out,/Estado comprobado: Ausente/);
});
test('invalid and oversized request payloads fail visibly without rendering unknown selectors',()=>{
  assert.match(html([{...interval,source:'__proto__'}]),/Formato de solicitudes incompatible/);
  assert.match(html(Array.from({length:21},()=>interval)),/Formato de solicitudes incompatible/);
});
test('the sealed contrast shows concrete requests even when its position is unavailable',()=>{
  const position={agent_id:'chassis',result_hash:'a'.repeat(64),available:false,status:'blocked_missing_inputs',
    assumptions:[],missing_inputs:[],limitations:[],proposed_tests:[],hypotheses:[],evidence_ids:[],
    measurement_refs:[],hypotheses_with_references:[],alternatives_with_references:[],
    requested_inputs:[interval],request_diagnostics:[{request:interval,observed_state:'absent'}]};
  const sections=[{section_id:'motorcycle',leader_id:'motorcycle-section-leader',available_agents:[],
    missing_agents:['chassis','tires-powertrain'],positions:[position],hypothesis_differences:[]}];
  const matrix={independence:'unavailable',conflicts:[],missing_reviewers:[],object_reviews:[]};
  const out=renderToStaticMarkup(createElement(ContrastPanel,{sections,matrix}));
  assert.match(out,/Entradas concretas solicitadas/);
  assert.match(out,/Intervalo de telemetría/);
  assert.match(out,/Bloqueado: evidencia pendiente/);
});
test('persisted report branches expose requests with agent identity and preserve historical empty reports',()=>{
  const out=renderToStaticMarkup(createElement(ReportInputRequests,{branches:[{agent_id:'mechanical-check',status:'blocked_missing_inputs',requested_inputs:[interval],request_diagnostics:[{request:interval,observed_state:'absent'}]}]}));
  assert.match(out,/mechanical-check/);
  assert.match(out,/Intervalo de telemetría/);
  const old=renderToStaticMarkup(createElement(ReportInputRequests,{branches:[{agent_id:'chassis',status:'blocked_missing_inputs'}]}));
  assert.equal(old,'');
});
