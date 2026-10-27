import {test} from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
test('curve controls are explicit scenarios, without false grip diagnosis',async()=>{
 assert.ok(existsSync('src/components/chassis/workshop/CorneringView.tsx'),'Cornering view missing');
 const {CorneringView}=await import('../src/components/chassis/workshop/CorneringView.tsx');
 const out=renderToStaticMarkup(createElement(CorneringView,{bike:'',recordingId:null}));
 assert.match(out,/Dinámica en curva/);assert.match(out,/idealizada/);assert.match(out,/Sin calcular/);assert.doesNotMatch(out,/Low.Side Crítico|127,3%|Pacejka en vivo/);
});
