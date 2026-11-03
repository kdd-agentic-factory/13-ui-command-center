// Real provider login and compiled workboard UI. Two synthetic acceptance decisions only.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
let phase='initialize';
const checks=[],posts={},decisions={};
const report={decision_ids:decisions,accept_attempts:{},scope:'immutable_workboard_authenticated_browser',status:'blocked',deployment:false,source_overlay:false,admin_credentials_in_browser:false,mechanical_authorizations:0,human_decisions_written:0,checks};
(async()=>{
 let browser;
 try{
  const accounts=JSON.parse(fs.readFileSync('/qa-private/accounts.json','utf8'));
  const expected=JSON.parse(fs.readFileSync('/expected.json','utf8'));
  if(!expected.session_name.startsWith('SYNTHETIC QA WORKBOARD BROWSER ')||Object.keys(expected.pending).sort().join()!=='chief,substitute')throw Error('Invalid explicit synthetic fixture');
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'workboard-browser-'));
  process.env.HOME=home;const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
  const password=path.join(home,'empty-password');fs.writeFileSync(password,'\n',{mode:0o600});
  execFileSync('certutil',['-N','--empty-password','-d','sql:'+db,'-f',password],{timeout:10000});
  execFileSync('certutil',['-A','-d','sql:'+db,'-n','chassis-local-ui','-t','C,,','-i','/ui-root.crt','-f',password],{timeout:10000});
  browser=await chromium.launch({headless:true,chromiumSandbox:true});
  for(const [team,role] of [['A','engineer'],['A','chief'],['A','substitute'],['A','reader'],['B','engineer']]){
   const account=accounts.accounts.find(a=>a.team===team&&a.role===role);
   const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
   await context.routeWebSocket('**/*',socket=>socket.close());
   await context.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    if(!['https://127.0.0.1:3000','https://czdpamk9.eu-central.insforge.app'].includes(url.origin))return route.abort();
    if(['GET','HEAD','OPTIONS'].includes(req.method()))return route.continue();
    if(req.method()==='POST'&&url.origin==='https://czdpamk9.eu-central.insforge.app'&&['/api/auth/sessions','/api/auth/refresh','/api/auth/logout'].includes(url.pathname))return route.continue();
    const fixture=expected.pending[role];let body;try{body=req.postDataJSON();}catch{}
    if(!(team==='A'&&['chief','substitute'].includes(role)&&fixture&&url.origin==='https://127.0.0.1:3000'&&url.search===''&&req.method()==='POST'&&url.pathname==='/api/telemetry/api/v1/engineering/workboard/reviews/'+fixture.review_id+'/decisions'&&Object.keys(body??{}).sort().join()==='action,expected_designation_revision,expected_revision,note,operation_id'&&body.action==='accept'&&body.note===expected.note&&body.expected_revision===fixture.expected_revision&&body.expected_designation_revision===fixture.designation_revision&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body.operation_id)))return route.abort();
    const encoded=JSON.stringify(body),prior=posts[role];
    if(prior&&(prior.body!==encoded||prior.count>=2))return route.abort();
    posts[role]={body:encoded,count:(prior?.count??0)+1};report.accept_attempts[role]=posts[role].count;
    return route.continue();
   });
   const page=await context.newPage();page.setDefaultTimeout(20000);
   const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.name));
   phase=team+'_'+role+'_login';
   await page.goto('https://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
   const dialog=page.getByRole('dialog');await dialog.locator('input[type=email]').fill(account.email);await dialog.locator('input[type=password]').fill(account.password);await dialog.locator('button[type=submit]').click();
   async function selectTeamAndSession(){
    const teamSelect=page.getByRole('combobox',{name:'Equipo activo',exact:true});await teamSelect.waitFor();
    const loaded=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/engineering/sessions')&&r.request().method()==='GET'&&r.request().headers()['x-team-id']===accounts.teams[team]);
    await teamSelect.selectOption(accounts.teams[team]);const response=await loaded;
    if(response.status()!==200)throw Error('Real session listing unavailable');await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
    const sessions=page.getByRole('combobox',{name:'Reabrir sesión',exact:true});await sessions.waitFor();
    if(team==='B'){
     for(let i=0;i<12;i++){
      if(await sessions.locator('option').evaluateAll((nodes,id)=>nodes.some(n=>n.value===id),expected.session_id))throw Error('Foreign session exposed');
      const more=page.getByRole('button',{name:'Más sesiones',exact:true});if(!await more.isVisible())break;
      if(i===11)throw Error('Foreign session pagination incomplete');
      const next=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/engineering/sessions')&&r.request().method()==='GET');await more.click();if((await next).status()!==200)throw Error('Foreign pagination failed');await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
     }
     if(pageErrors.length)throw Error('Compiled foreign workspace emitted page error');checks.push('B_engineer_foreign_session_not_listed_all_pages');return false;
    }
    for(let i=0;i<12;i++){
     if(await sessions.locator('option').evaluateAll((nodes,id)=>nodes.some(n=>n.value===id),expected.session_id))break;
     const more=page.getByRole('button',{name:'Más sesiones',exact:true});
     if(!await more.isVisible())throw Error('Synthetic session absent');
     const next=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/engineering/sessions')&&r.request().method()==='GET');await more.click();if((await next).status()!==200)throw Error('Session pagination unavailable');await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
    }
    await sessions.selectOption(expected.session_id);
    const board=page.getByRole('region',{name:'Tablero de trabajo de la sesión',exact:true});
    await board.getByText('Trabajo de la sesión',{exact:true}).click();
    await board.getByRole('combobox',{name:'Filtrar por perfil',exact:true}).selectOption('all');
    return board;
   }
   phase=team+'_'+role+'_workboard';let board=await selectTeamAndSession();
   if(!board){await context.close();continue;}
   const fixture=expected.pending[['chief','substitute'].includes(role)?role:'chief'];
   await board.getByRole('button',{name:fixture.task_title,exact:true}).click();
   const priorDecision=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/workboard/reviews/'+fixture.review_id+'/decision')&&r.request().method()==='GET');
   const read=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/workboard/tasks/'+fixture.task_id+'/latest-review')&&r.request().method()==='GET');
   await board.getByRole('button',{name:'Ver última entrega',exact:true}).click();if((await read).status()!==200)throw Error('Immutable delivery unavailable');
   await board.getByText('SYNTHETIC QA inspection delivered for browser acceptance',{exact:true}).waitFor();
   const priorResponse=await priorDecision;const previous=priorResponse.status()===200?await priorResponse.json():null;if(![200,404].includes(priorResponse.status()))throw Error('Decision read unavailable');
   const accept=board.getByRole('button',{name:'Aceptar entrega',exact:true});
   if(['chief','substitute'].includes(role)){
    let value=previous;
    if(!value){
    phase=role+'_human_note';await board.getByRole('textbox',{name:'Nota de revisión humana',exact:true}).fill(expected.note);
    const saved=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/workboard/reviews/'+fixture.review_id+'/decisions')&&r.request().method()==='POST');
    await accept.click();const response=await saved;value=await response.json();
    if(response.status()!==200||value.action!=='accept'||value.actor_id!==account.id||value.review_id!==fixture.review_id||value.delivery_digest!==fixture.delivery_digest||value.task.state!=='closed'||value.task.revision!==5||value.designation_role!==(role==='chief'?'primary':'substitute'))throw Error('Scoped human acceptance differs');
    report.human_decisions_written++;checks.push(role+'_accepts_exact_synthetic_delivery');
    await board.getByText('Decisión humana guardada. No autoriza ningún montaje.',{exact:true}).waitFor();
    }else{if(value.action!=='accept'||value.actor_id!==account.id||value.review_id!==fixture.review_id||value.delivery_digest!==fixture.delivery_digest||value.note!==expected.note||value.task.state!=='closed'||value.task.revision!==5)throw Error('Prior decision differs from exact fixture');checks.push(role+'_prior_exact_decision_recovers');}
    decisions[role]=value.id;
    phase=role+'_reload';await page.reload({waitUntil:'networkidle'});board=await selectTeamAndSession();
    await board.getByRole('button',{name:fixture.task_title,exact:true}).click();
    const recovered=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/workboard/reviews/'+fixture.review_id+'/decision')&&r.request().method()==='GET');
    await board.getByRole('button',{name:'Ver última entrega',exact:true}).click();const reread=await recovered;const outcome=await reread.json();
    if(reread.status()!==200||outcome.id!==value.id||outcome.task.revision!==5)throw Error('Decision recovery differs');
    await board.getByText(/Decisión humana: entrega aceptada/).waitFor();checks.push(role+'_decision_recovers_after_browser_reload');
   }else{
    if(previous)await board.getByText(/Decisión humana: entrega aceptada/).waitFor();
    else await board.getByText('Solo el Crew Chief humano o su suplente vigente puede decidir sobre esta entrega.',{exact:true}).waitFor();
    if(await accept.count())throw Error('Undesignated role gained human control');
    checks.push(role+'_human_acceptance_not_exposed');
   }
   if(pageErrors.length)throw Error('Compiled UI emitted page error');
   checks.push(team+'_'+role+'_compiled_ui_without_page_error');await context.close();
  }
  if(Object.keys(decisions).sort().join()!=='chief,substitute')throw Error('Two scoped decisions required');
  report.accepted_fixture_count=2;report.status='passed';
 }catch(e){report.phase=phase;report.error_type=e.name;const known=['Real session listing unavailable','Foreign session exposed','Foreign session pagination incomplete','Foreign pagination failed','Compiled foreign workspace emitted page error','Synthetic session absent','Session pagination unavailable','Immutable delivery unavailable','Decision read unavailable'];if(known.includes(e.message))report.error_code=e.message;}
 finally{if(browser)await browser.close();}
 console.log(JSON.stringify(report));if(report.status!=='passed')process.exitCode=1;
})();
