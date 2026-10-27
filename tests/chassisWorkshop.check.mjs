import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('workshop has three operable views without invented measurements or torques',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/ChassisWorkshop.tsx'),'Workshop is missing');
 const {ChassisWorkshop}=await import('../src/components/chassis/workshop/ChassisWorkshop.tsx');
 const out=renderToStaticMarkup(createElement(ChassisWorkshop,{draft:{values:{},assumed:{}},onChange:()=>{},onCalculate:()=>{},busy:false,bike:'',recordingId:null,preview:null,error:''}));
 assert.match(out,/Geometría global/);assert.match(out,/Horquilla/);assert.match(out,/Tren trasero/);
 assert.match(out,/Pendiente de medidas/);assert.doesNotMatch(out,/22 Nm|Öhlins|Flow Score|102.5%/);
});

test('draft conversion preserves mechanical configuration and does not mutate baseline',async()=>{
 assert.ok(existsSync('src/domain/chassisWorkshop.ts'),'Workshop types missing');
 const {draftInput,previewIsCurrent}=await import('../src/domain/chassisWorkshop.ts');
 const draft={values:{front_radius_m:'300'},assumed:{},mechanical:{schema_version:'1.0.0',frame:'body_x_forward_z_up',points:{},rear_radius_m:{value:.3,unit:'m',provenance:'measured'}},configuration:{settings:{front_compression_clicks:12},shim_stack:[],source:'measured'}};
 const before=JSON.stringify(draft);const input=draftInput(draft,'bike','B','parent','operation');
 assert.equal(input.values.front_radius_m.value,.3);assert.deepEqual(input.mechanical,draft.mechanical);
 assert.equal(input.component_configuration.settings.front_compression_clicks,12);assert.equal(JSON.stringify(draft),before);
 assert.equal(previewIsCurrent('old','new'),false);assert.equal(previewIsCurrent('same','same'),true);
});

test('Target Lock requires a reference and never automatically applies a proposal',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/TargetLockPanel.tsx'),'Target Lock panel missing');
 const {TargetLockPanel}=await import('../src/components/chassis/workshop/TargetLockPanel.tsx');
 const out=renderToStaticMarkup(createElement(TargetLockPanel,{draft:{values:{},assumed:{}},bike:'',onChange:()=>{},specifications:[]}));
 assert.match(out,/Target Lock/);assert.match(out,/referencia A/);assert.doesNotMatch(out,/Aplicado automáticamente/);
});

test('work order and specification editors do not invent approval or mechanical instructions',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/WorkshopOrderPanel.tsx'),'Order panel missing');
 const {WorkshopOrderPanel}=await import('../src/components/chassis/workshop/WorkshopOrderPanel.tsx');
 const {SpecificationEditor}=await import('../src/components/chassis/workshop/SpecificationEditor.tsx');
 const out=renderToStaticMarkup(createElement(WorkshopOrderPanel,{comparisonCurrent:false}));
 assert.match(out,/Orden de taller/);assert.match(out,/comparación guardada/);assert.doesNotMatch(out,/Aprobar automáticamente/);
 const spec=renderToStaticMarkup(createElement(SpecificationEditor,{part:'fork_cap',onSaved:()=>{}}));
 assert.match(spec,/Referencia documental/);assert.match(spec,/Par de apriete/);assert.doesNotMatch(spec,/value="22"/);
});

test('shim stack editor is measurement driven and has no default stack',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/ShimStackEditor.tsx'),'Shim editor missing');
 const {ShimStackEditor}=await import('../src/components/chassis/workshop/ShimStackEditor.tsx');
 const out=renderToStaticMarkup(createElement(ShimStackEditor,{draft:{values:{},assumed:{}},onChange:()=>{}}));
 assert.match(out,/Sin arandelas registradas/);assert.match(out,/no predice amortiguación/);
});
