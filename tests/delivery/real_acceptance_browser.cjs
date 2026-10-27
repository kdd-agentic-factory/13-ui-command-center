// Actual provider password login and compiled UI, never a synthetic issuer.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
let phase='initialize';const checks=[];const httpStatuses=[];
let uiFlags=null;
const identityOnly=process.argv?.includes('--identity-preflight')??false;
(async()=>{
 const input=JSON.parse(fs.readFileSync('/qa-private/accounts.json','utf8'));
 const expected=JSON.parse(fs.readFileSync('/expected.json','utf8'));
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'chassis-real-browser-'));
 process.env.HOME=home;
 const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
 const passwordFile=path.join(home,'empty-password');fs.writeFileSync(passwordFile,'\n',{mode:0o600});
 execFileSync('certutil',['-N','--empty-password','-d','sql:'+db,'-f',passwordFile],{timeout:10000});
 execFileSync('certutil',['-A','-d','sql:'+db,'-n','chassis-preproduction-api','-t','C,,','-i','/run/secrets/api_ca','-f',passwordFile],{timeout:10000});
 let browser;let lastPage;
 try{
  browser=await chromium.launch({headless:true,chromiumSandbox:true});
  for(const [team,role] of (identityOnly?[['A','reader']]:[['A','chief'],['B','substitute'],['A','reader']])){
   // Keep the deployed human quota unchanged between scripted operators.
   if(role!=='reader')await new Promise(resolve=>setTimeout(resolve,61000));
   const account=input.accounts.find(a=>a.team===team&&a.role===role);
   const context=await browser.newContext({viewport:{width:1366,height:900}});
   phase=team+'_'+role+'_login';
   const page=await context.newPage();lastPage=page;const errors=[];
   page.on('pageerror',error=>errors.push(error.name));
   page.on('response',async response=>{
    const pathname=new URL(response.url()).pathname;
    const endpoint=pathname.endsWith('/teams')?'teams':pathname.endsWith('/engineering/sessions')?'sessions':
      pathname.endsWith('/api/auth/refresh')?'refresh':pathname.endsWith('/api/auth/users/current')?'current_user':null;
    if(endpoint){
      const record={endpoint,status:response.status()};
      if(endpoint==='refresh'&&response.status()===200){try{const data=await response.json();record.has_user=typeof data.user?.id==='string';record.has_access_token=typeof data.accessToken==='string';}catch{record.invalid_json=true;}}
      httpStatuses.push(record);if(httpStatuses.length>20)httpStatuses.shift();
    }
   });
   await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
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
      response.request().method()==='GET'&&response.request().headers()['x-team-id']===input.teams[team]&&response.status()===200);
    phase=team+'_'+role+'_'+stage+'_session_request';await select.selectOption(input.teams[team]);await loaded;
    phase=team+'_'+role+'_'+stage+'_context';
    await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor();
    await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
    const text=await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText();
    if(!identityOnly&&(!text.includes(own)||text.includes(foreign)))throw Error('Team session scope failed');
    if(role==='reader'&&!(await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).isDisabled()))throw Error('Reader form not locked');
   };
   phase=team+'_'+role+'_workspace';
   await authorizedWorkspace('workspace');
   if(role!=='reader'){
    phase=team+'_'+role+'_approval';
    const pending=expected.pending_approvals[team];
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(pending.session_id);
    await page.getByRole('textbox',{name:'Nota de decisión',exact:true}).fill('SYNTHETIC QA measurement-plan approval; no workshop application');
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Aprobar propuesta'&&!button.disabled));
    const decision=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/proposals/'+pending.proposal_id+'/decisions')&&response.request().method()==='POST');
    await page.getByRole('button',{name:'Aprobar propuesta',exact:true}).click();
    const response=await decision;const event=await response.json();
    if(response.status()!==200||event.action!=='approve'||event.actor_id!==account.id)throw Error('Actual designated approval failed');
    await page.getByText('Estado: Aprobada y vigente.',{exact:true}).waitFor();
    checks.push(team+'_'+role+'_approves_via_real_UI_and_remote_authority');
   }
   phase=team+'_'+role+'_reload';
   await page.reload({waitUntil:'networkidle'});
   await authorizedWorkspace('reload');
   if(role!=='reader'){
    phase=team+'_'+role+'_reload_proposal';
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(expected.pending_approvals[team].session_id);
    await page.getByText('Estado: Aprobada y vigente.',{exact:true}).waitFor();
   }
   if(errors.length)throw Error('Browser runtime error');
   checks.push(team+'_'+role+'_real_login_scope_and_reload');
   await context.close();
  }
  console.log(JSON.stringify({status:'passed',gates:identityOnly?{real_browser_identity_preflight:'passed'}:{authenticated_browser:'passed',real_primary_and_substitute:'passed'},checks}));
 }catch(error){
  if(lastPage)try{uiFlags=await lastPage.evaluate(()=>({
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
