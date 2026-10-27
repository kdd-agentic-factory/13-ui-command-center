import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://127.0.0.1:5173/'});
globalThis.window=dom.window;globalThis.document=dom.window.document;
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.Event=dom.window.Event;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const {createElement,useState,act}=await import('react');
const {createRoot}=await import('react-dom/client');
const click=async element=>{assert.ok(element);await act(async()=>{element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true}));});};
async function input(element,value){assert.ok(element);await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});}
const button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent===text);

test('Target Lock rejects completed and delayed proposals after specification revision',async()=>{
 const {TargetLockPanel}=await import('../src/components/chassis/workshop/TargetLockPanel.tsx');
 const ref={id:'11111111-1111-4111-8111-111111111111',revision:2,digest:'a'.repeat(64)};
 const spec={...ref,status:'verified',setting:'fork_length_m'};
 const draft={values:{},assumed:{},specificationRefs:[ref]};let applied=0,resolve;
 globalThis.fetch=async()=>new Promise(r=>{resolve=r;});
 const root=createRoot(document.getElementById('root'));
 const render=specifications=>root.render(createElement(TargetLockPanel,{draft,bike:'bike',referenceId:'reference',specifications,onChange:()=>applied++}));
 const response=()=>new Response(JSON.stringify({status:'feasible',changes:{fork_length_m:.3},residuals:{},evaluations:1}),{headers:{'content-type':'application/json'}});
 await act(async()=>render([spec]));await click(button('Calcular compensación'));
 await act(async()=>resolve(response()));assert.equal(button('Usar propuesta en B').disabled,false);
 await act(async()=>render([{...spec,revision:3,status:'contributed'}]));
 assert.equal(button('Usar propuesta en B').disabled,true);
 await click(button('Usar propuesta en B'));assert.equal(applied,0);
 await act(async()=>render([spec]));await click(button('Calcular compensación'));
 await act(async()=>render([{...spec,revision:3,status:'contributed'}]));
 await act(async()=>resolve(response()));
 assert.equal(button('Usar propuesta en B').disabled,true);assert.equal(applied,0);
 await act(async()=>root.unmount());
});

test('accepting Target Lock preserves the body axis and writes derived global geometry as assumed',async()=>{
 const {TargetLockPanel}=await import('../src/components/chassis/workshop/TargetLockPanel.tsx');
 const initial={values:{rake_rad:'24'},assumed:{},mechanical:{schema_version:'1.0.0',frame:'body_x_forward_z_up',points:{},steer_axis_body_rad:{value:.1,unit:'rad',provenance:'measured'}}};
 let changed;
 globalThis.fetch=async()=>new Response(JSON.stringify({status:'feasible',changes:{fork_length_m:.3},candidate_metrics:{rake_rad:.4,wheelbase_m:1.4},residuals:{},evaluations:1}),{headers:{'content-type':'application/json'}});
 const root=createRoot(document.getElementById('root'));
 await act(async()=>root.render(createElement(TargetLockPanel,{draft:initial,bike:'bike',referenceId:'reference',specifications:[],onChange:d=>changed=d})));
 await click(button('Calcular compensación'));await click(button('Usar propuesta en B'));
 assert.ok(Math.abs(Number(changed.values.rake_rad)-.4*180/Math.PI)<1e-10);
 assert.equal(Number(changed.values.wheelbase_m),1400);
 assert.equal(changed.assumed.rake_rad,true);assert.equal(changed.assumed.wheelbase_m,true);
 assert.deepEqual(changed.mechanical.steer_axis_body_rad,initial.mechanical.steer_axis_body_rad);
 assert.equal(initial.values.rake_rad,'24');
 await act(async()=>root.unmount());
});

test('clicks and exploded view share the real B draft without modifying A',async()=>{
 const {ChassisWorkshop}=await import('../src/components/chassis/workshop/ChassisWorkshop.tsx');
 const original={values:{},assumed:{}};let latest=original;
 function App(){const [draft,setDraft]=useState(original);return createElement(ChassisWorkshop,{draft,bike:'bike',recordingId:null,preview:null,busy:false,error:'',onCalculate:()=>{},onChange:d=>{latest=d;setDraft(d);}});}
 const root=createRoot(document.getElementById('root'));await act(async()=>{root.render(createElement(App));});
 await click(button('Horquilla'));
 await input(document.querySelector('input[aria-label="Compresión delantera"]'),'12');
 assert.equal(latest.configuration.settings.front_compression_clicks,12);
 assert.deepEqual(original,{values:{},assumed:{}});
 const before=JSON.stringify(latest);await input(document.querySelector('input[aria-label="Porcentaje de explosión"]'),'100');
 assert.equal(JSON.stringify(latest),before);
 const forkTab=document.querySelector('#workshop-tab-fork');forkTab.focus();
 await act(async()=>forkTab.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})));
 assert.equal(document.querySelector('#workshop-tab-rear').getAttribute('aria-selected'),'true');
 assert.equal(document.activeElement.id,'workshop-tab-rear');
 await act(async()=>{root.unmount();});
});

test('changing workshop tabs keeps an unsaved curve scenario',async()=>{
 globalThis.fetch=async()=>new Response('[]',{headers:{'content-type':'application/json'}});
 const {ChassisWorkshop}=await import('../src/components/chassis/workshop/ChassisWorkshop.tsx');
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(createElement(ChassisWorkshop,{draft:{values:{},assumed:{}},bike:'bike',recordingId:null,preview:null,busy:false,error:'',onCalculate:()=>{},onChange:()=>{}})));
 await click(button('Dinámica en curva'));await input(document.querySelector('input[aria-label="Velocidad en curva"]'),'185');
 await click(button('Horquilla'));await click(button('Dinámica en curva'));
 assert.equal(document.querySelector('input[aria-label="Velocidad en curva"]').value,'185');
 await act(async()=>root.unmount());
});

test('late preview after editing B and changing context cannot replace current state',async()=>{
 const pending=[];globalThis.fetch=async(url,init)=>{if(String(url).endsWith('/preview'))return new Promise(resolve=>pending.push(resolve));return new Response('[]',{headers:{'content-type':'application/json'}});};
 const {useChassisWorkspace}=await import('../src/hooks/useChassisWorkspace.ts');
 let state;
 function App(){const [bike,setBike]=useState('bike');state=useChassisWorkspace({bike,recordingId:null});return createElement('div',{},createElement('button',{onClick:()=>state.calculate({mode:'static'})},'request'),createElement('button',{onClick:()=>state.setB({values:{offset_m:'31'},assumed:{}})},'edit'),createElement('button',{onClick:()=>setBike('other')},'context'));}
 const root=createRoot(document.getElementById('root'));await act(async()=>{root.render(createElement(App));});
 await click(button('request'));assert.equal(pending.length,1);await click(button('edit'));
 await act(async()=>{pending.shift()(new Response('{"input_digest":"stale"}',{headers:{'content-type':'application/json'}}));});
 assert.equal(state.preview,null);assert.equal(state.busy,false);assert.equal(state.b.values.offset_m,'31');
 await click(button('request'));await click(button('context'));
 await act(async()=>{pending.shift()(new Response('{"input_digest":"other-stale"}',{headers:{'content-type':'application/json'}}));});
 assert.equal(state.preview,null);await act(async()=>{root.unmount();});
});

test('an unsaved curve scenario participates in the existing leave guard',async()=>{
 globalThis.fetch=async()=>new Response('[]',{headers:{'content-type':'application/json'}});
 const {WorkspaceDraftProvider,useWorkspaceDraft}=await import('../src/context/WorkspaceDraftContext.tsx');
 const {ChassisWorkshop}=await import('../src/components/chassis/workshop/ChassisWorkshop.tsx');
 let left=false;function App(){const guard=useWorkspaceDraft();return createElement('div',{},createElement('button',{onClick:()=>guard.requestLeave(()=>{left=true;})},'leave'),createElement(ChassisWorkshop,{draft:{values:{},assumed:{}},bike:'bike',recordingId:null,preview:null,busy:false,error:'',onCalculate:()=>{},onChange:()=>{}}));}
 const root=createRoot(document.getElementById('root'));await act(async()=>root.render(createElement(WorkspaceDraftProvider,{},createElement(App))));
 await click(button('Dinámica en curva'));await input(document.querySelector('input[aria-label="Velocidad en curva"]'),'185');await click(button('leave'));
 assert.equal(left,false);assert.ok(document.querySelector('[role="alertdialog"]'));
 await act(async()=>root.unmount());
});
