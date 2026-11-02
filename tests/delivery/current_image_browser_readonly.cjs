// Actual provider password login and compiled UI, never a synthetic issuer.
// --identity-preflight checks Chief/substitute/reader login, scope and reload.
// Default mode also requires the designated proposal to be pending. No approval
// is clicked; browser routing blocks every write except provider authentication.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
let phase='initialize';const checks=[];const httpStatuses=[];
let uiFlags=null;
const identityOnly=process.argv?.includes('--identity-preflight')??false;
const approvedReadback=process.argv?.includes('--approved-readback')??false;
(async()=>{
 const input=JSON.parse(fs.readFileSync('/qa-private/accounts.json','utf8'));
 const expected=JSON.parse(fs.readFileSync('/expected.json','utf8'));
 let browser;let lastPage;
 try{
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'chassis-candidate-browser-'));
  process.env.HOME=home;const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
  const passwordFile=path.join(home,'empty-password');fs.writeFileSync(passwordFile,'\n',{mode:0o600});
  execFileSync('certutil',['-N','--empty-password','-d','sql:'+db,'-f',passwordFile],{timeout:10000});
  execFileSync('certutil',['-A','-d','sql:'+db,'-n','chassis-local-ui','-t','C,,','-i','/ui-root.crt','-f',passwordFile],{timeout:10000});
  browser=await chromium.launch({headless:true,chromiumSandbox:true});
  for(const [team,role] of [['A','chief'],['A','substitute'],['A','reader']]){
   // Keep the deployed human quota unchanged between scripted operators.
   if(role==='substitute')await new Promise(resolve=>setTimeout(resolve,1500));
   const account=input.accounts.find(a=>a.team===team&&a.role===role);
   const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
   await context.routeWebSocket('**/*',socket=>socket.close());
   await context.route('**/*',route=>{
    const request=route.request();const url=new URL(request.url());
    if(!['https://127.0.0.1:3000','https://czdpamk9.eu-central.insforge.app'].includes(url.origin))return route.abort();
    if(!['GET','HEAD','OPTIONS'].includes(request.method())){
     if(url.pathname.startsWith('/api/auth/'))return route.continue();
     return route.abort();
    }
    return route.continue();
   });
   phase=team+'_'+role+'_login';
   const page=await context.newPage();lastPage=page;const errors=[];
   page.on('pageerror',error=>errors.push(error.name));
   page.on('response',async response=>{
    const pathname=new URL(response.url()).pathname;
    const endpoint=pathname.endsWith('/teams')?'teams':pathname.endsWith('/engineering/sessions')?'sessions':
      pathname.endsWith('/api/auth/refresh')?'refresh':pathname.endsWith('/api/auth/users/current')?'current_user':pathname.endsWith('/authority')?'authority':pathname.endsWith('/current')?'current_run':pathname.endsWith('/synthesis')?'synthesis':pathname.includes('/engineering/proposals/')?'proposal':null;
    if(endpoint){
      const record={endpoint,status:response.status()};
      if(endpoint==='refresh'&&response.status()===200){try{const data=await response.json();record.has_user=typeof data.user?.id==='string';record.has_access_token=typeof data.accessToken==='string';}catch{record.invalid_json=true;}}
      httpStatuses.push(record);if(httpStatuses.length>20)httpStatuses.shift();
    }
   });
   await page.goto('https://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
   const dialog=page.getByRole('dialog');
   await dialog.locator('input[type=email]').fill(account.email);
   await dialog.locator('input[type=password]').fill(account.password);
   await dialog.locator('button[type=submit]').click();
   const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});
   const own=expected.prefix+' SYNTHETIC QA '+team;
   const foreign=expected.prefix+' SYNTHETIC QA '+(team==='A'?'B':'A');
   const authorizedWorkspace=async(stage)=>{
    phase=team+'_'+role+'_'+stage+'_team_selector';await select.waitFor();
    const loaded=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions')&&
      response.request().method()==='GET'&&response.request().headers()['x-team-id']===input.teams[team]);
    phase=team+'_'+role+'_'+stage+'_session_request';await select.selectOption(input.teams[team]);let sessionReply=await loaded;
    if(sessionReply.status()>=500){
     phase=team+'_'+role+'_'+stage+'_context_read_recovery';
     const recovered=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions')&&response.request().method()==='GET'&&response.request().headers()['x-team-id']===input.teams[team]);
     await page.getByRole('button',{name:'Recargar contexto',exact:true}).click();sessionReply=await recovered;
     checks.push(team+'_'+role+'_retried_read_after_transient_5xx');
    }
    if(sessionReply.status()!==200)throw Error('Scoped session read failed');
    phase=team+'_'+role+'_'+stage+'_context';
    await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor();
    await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
    const text=await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText();
    const teamOptions=await select.locator('option').evaluateAll(options=>options.map(o=>o.value));if(teamOptions.includes(input.teams[team==='A'?'B':'A']))throw Error('Foreign team exposed');
    if(role==='reader'&&!(await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).isDisabled()))throw Error('Reader form not locked');
   };
   phase=team+'_'+role+'_workspace';
   await authorizedWorkspace('workspace');
   if(role!=='reader'&&!identityOnly){
    phase=team+'_'+role+'_review_pending';
    const pending=approvedReadback?expected.pending_approvals[role]:expected.pending;
    const authorityReply=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/proposals/'+pending.proposal_id+'/authority')&&response.request().method()==='GET');
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(pending.session_id);
    const authorityResponse=await authorityReply;const authority=await authorityResponse.json();
    if(approvedReadback){
     if(authorityResponse.status()!==200||authority.current!==true||authority.approved_current!==true||!authority.decision_id||authority[role==='chief'?'primary_id':'substitute_id']!==account.id)throw Error('Existing designated approval unavailable');
     await page.getByText('Estado: Aprobada y vigente.',{exact:true}).waitFor();
     checks.push(team+'_'+role+'_existing_approval_visible_no_write');
    }else{
     if(authorityResponse.status()!==200||authority.approvable!==true||authority.current!==true||authority.approved_current!==false||authority[role==='chief'?'primary_id':'substitute_id']!==account.id)throw Error('Designated pending measurement authority unavailable');
     await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Aprobar propuesta'&&!button.disabled));
     checks.push(team+'_'+role+'_pending_measurement_approval_visible_no_decision');
    }
   }
   phase=team+'_'+role+'_reload';
   await page.reload({waitUntil:'networkidle'});
   await authorizedWorkspace('reload');
   if(approvedReadback&&role!=='reader'){
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(expected.pending_approvals[role].session_id);
    await page.getByText('Estado: Aprobada y vigente.',{exact:true}).waitFor();
    checks.push(team+'_'+role+'_existing_approval_survives_reload_no_write');
   }
   if(errors.length)throw Error('Browser runtime error');
   checks.push(team+'_'+role+'_real_login_scope_and_reload');
   await context.close();
  }
  console.log(JSON.stringify({status:'passed',scope:identityOnly?'identity_and_role_reload':approvedReadback?'approved_measurement_readback':'pending_measurement_review_readonly',gates:{candidate_browser_identity_readonly:'passed'},candidate_acceptance:false,synthetic_only:true,checks,human_decisions_written:0}));
 }catch(error){
  if(lastPage)try{uiFlags=await lastPage.evaluate(()=>({
   dialog_count:document.querySelectorAll('[role=dialog]').length,
   unsaved:document.body.innerText.includes('sin guardar'),
   approval_visible:[...document.querySelectorAll('button')].some(b=>b.textContent==='Aprobar propuesta'),
   approval_disabled:[...document.querySelectorAll('button')].find(b=>b.textContent==='Aprobar propuesta')?.disabled??null,
   error_boundary:document.body.innerText.includes('Something went wrong'),
   restoring:document.body.innerText.includes('Restoring your latest session'),
   loading_session:document.body.innerText.includes('Loading session'),
   login_visible:document.body.innerText.includes('Iniciar sesión para Chassis'),
   team_visible:document.body.innerText.includes('Equipo activo'),
   form_count:document.querySelectorAll('select').length,
   profile:['founding-node','race-engineer','team-principal','data-analyst','mechanic','spectator'].includes(localStorage.getItem('kdd-profile'))?localStorage.getItem('kdd-profile'):'unknown'
  }));}catch{}
  throw error;
 }finally{if(browser)await browser.close();}
})().catch(error=>{console.log(JSON.stringify({status:'blocked',phase,error_type:error.name,
 checks,http_statuses:httpStatuses,ui_flags:uiFlags,gates:identityOnly?{real_browser_identity_preflight:'blocked'}:{authenticated_browser:'blocked'}}));process.exitCode=2;});
