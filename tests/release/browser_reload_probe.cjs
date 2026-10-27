// Execute the real browser script with a failed membership load after reload.
// A cached-user team selector remains visible, which must never count as access.
const fs=require('node:fs');
const vm=require('node:vm');
const expected={prefix:'owned-qa',pending_approvals:{
 A:{session_id:'session-a',proposal_id:'proposal-a'},B:{session_id:'session-b',proposal_id:'proposal-b'}}};
const input={teams:{A:'team-a',B:'team-b'},accounts:[
 {team:'A',role:'chief',id:'chief-a',email:'a@example.test',password:'sentinel'},
 {team:'B',role:'substitute',id:'sub-b',email:'b@example.test',password:'sentinel'},
 {team:'A',role:'reader',id:'reader-a',email:'r@example.test',password:'sentinel'}]};
let contexts=0,reloads=0,approvals=0;const messages=[];const valid=process.argv[3]==='valid';const preflight=process.argv[4]==='identity';
const chromium={launch:async options=>{
 if(options.chromiumSandbox!==true)throw Error('Sandbox disabled');
 return {close:async()=>{},newContext:async()=>{
  const index=preflight?2:contexts++;let team='A',reloaded=false;
  const generic={waitFor:async()=>{},click:async()=>{},fill:async()=>{},
   selectOption:async id=>{team=id==='team-b'?'B':'A';},
   innerText:async()=>expected.prefix+' SYNTHETIC QA '+team,
   isDisabled:async()=>index===2,locator:()=>generic};
  const page={on:()=>{},goto:async()=>{},reload:async()=>{reloaded=true;reloads++;},
   locator:()=>generic,getByText:()=>generic,
   waitForFunction:async()=>{},
   waitForResponse:async()=>({status:()=>200,json:async()=>({action:'approve',actor_id:input.accounts[index].id})}),
   getByRole:(role,options)=>role==='region'&&reloaded&&!valid?{waitFor:async()=>{throw Error('Real membership unavailable');}}:
    role==='button'&&options?.name==='Aprobar propuesta'?{click:async()=>{approvals++;}}:generic};
  return {newPage:async()=>page,close:async()=>{}};
 }};
}};
const mockRequire=name=>{
 if(name==='/deps/playwright')return {chromium};
 if(name==='node:fs')return {readFileSync:p=>JSON.stringify(p.includes('accounts')?input:expected),
  mkdtempSync:()=>'/tmp/mock-browser',mkdirSync:()=>{},writeFileSync:()=>{}};
 if(name==='node:child_process')return {execFileSync:()=>{}};
 return require(name);
};
(async()=>{
 await vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8'),{
  require:mockRequire,process:{env:{},exitCode:0,argv:preflight?['node','browser','--identity-preflight']:['node','browser']},setTimeout:callback=>callback(),console:{log:value=>messages.push(JSON.parse(value))}});
 process.stdout.write(JSON.stringify({...messages.at(-1),reloads,approvals}));
})().catch(()=>{process.exitCode=1;});
