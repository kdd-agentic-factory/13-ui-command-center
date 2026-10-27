import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {AgentDecision} from '../src/components/engineering/AgentDecision.tsx';
const html=(decision,status='blocked_missing_inputs',contextMode='reference_review',error=null)=>renderToStaticMarkup(createElement(AgentDecision,{decision,status,contextMode,error}));
test('abstention is blocked without inventing a missing measurement',()=>{
 const out=html({kind:'abstain',reason:'model_capability_limit'});
 assert.match(out,/El agente no pudo concluir/);assert.match(out,/capacidad del modelo/);
 assert.doesNotMatch(out,/Revisión sustentada|Añade una curva|datos completos/);
 assert.match(out,/Crew Chief humano/);
});
test('triage and contradictory success are never presented as a review',()=>{
 assert.match(html({kind:'abstain',reason:'insufficient_evidence'},'succeeded'),/incompatible/);
 const out=html({kind:'request_input',request_id:'a'.repeat(64)},'blocked_missing_inputs','input_triage');
 assert.match(out,/Corrección de entradas/);assert.match(out,/Petición concreta del agente/);
 assert.doesNotMatch(out,/Revisión sustentada/);
});
test('empty options and historical records never imply completeness',()=>{
 assert.equal(html(undefined,'blocked_missing_inputs',null),'');
 assert.match(html(null,'blocked_missing_inputs','blocked'),/Comprobación previa del servidor/);
 assert.doesNotMatch(html(null,'blocked_missing_inputs','blocked'),/datos completos/);
});
test('strict variants reject extras, foreign reference formats and unknown reasons',()=>{
 for(const d of [{kind:'abstain',reason:'guess'},{kind:'abstain',reason:'insufficient_evidence',prompt:'text'},{kind:'review_supported',references:[{evidence_id:'foreign',metric:'trail_m',measurement:'value_a',unit:'m'}]}])assert.match(html(d),/incompatible/);
});
test('supported review stays scoped and execution failure is distinct',()=>{
 const ref={evidence_id:'11111111-1111-4111-8111-111111111111',metric:'trail_m',measurement:'value_a',unit:'m'};
 assert.match(html({kind:'review_supported',references:[ref]},'succeeded'),/Revisión sustentada/);
 assert.match(html(null,'failed','reference_review',{phase:'schema',cause:'invalid_decision_schema'}),/Respuesta de IA no validada/);
});

test('a persisted report keeps an abstention even without requests',async()=>{
 const {ReportInputRequests}=await import('../src/components/engineering/InputRequests.tsx');
 const out=renderToStaticMarkup(createElement(ReportInputRequests,{branches:[{agent_id:'chassis',status:'blocked_missing_inputs',decision_mode:'reference_review',model_decision:{kind:'abstain',reason:'insufficient_evidence'},requested_inputs:[]}]}));
 assert.match(out,/El agente no pudo concluir/);
});