import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
test('workshop report distinguishes immutable scenarios from recorded evidence and current authorization',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/WorkshopAnnexPanel.tsx'),'Workshop annex missing');
 const {WorkshopAnnexContent}=await import('../src/components/chassis/workshop/WorkshopAnnexPanel.tsx');
 const out=renderToStaticMarkup(createElement(WorkshopAnnexContent,{annex:{id:'annex',revision:1,digest:'a'.repeat(64),comparison_id:'comparison',created_at:'2026-10-26',authority_consulted_at:'2026-10-26',model_version:'planar',limitations:['scenario_results_not_recorded_telemetry'],order:{status:'draft',executable:false},scenarios:[{id:'scenario',mode:'scenario',result:{model_version:'cornering-ideal-1.0.0',metrics:{lateral_force_n:2000},assumptions:['steady_state']}}]}}));
 assert.match(out,/histórico/);assert.match(out,/no concede autorización/);assert.match(out,/Hipótesis/);assert.doesNotMatch(out,/Telemetría medida: 2000/);
});
