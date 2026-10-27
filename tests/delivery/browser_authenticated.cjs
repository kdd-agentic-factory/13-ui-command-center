// Synthetic issuer, real SDK login/cookie renewal, compiled UI and installed API.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
(async()=>{
 console.error('PHASE initialize private browser trust store');
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'chassis-browser-home-'));
 process.env.HOME=home;
 const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
 const passwordFile=path.join(home,'empty-password');fs.writeFileSync(passwordFile,'\n',{mode:0o600});
 execFileSync('certutil',['-N','--empty-password','-d','sql:'+db,'-f',passwordFile],{timeout:10000});
 const checks=[];let browser;let page;let completed=false;
 // Exercise human interaction within the unchanged production quota. Seed setup
 // and rapid automation otherwise consume a minute of requests before a human click.
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const launch=()=>chromium.launch({headless:true,chromiumSandbox:true});
 const scopedList=(page,team)=>page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions')&&response.request().method()==='GET'&&response.request().headers()['x-team-id']===team&&response.status()===200);
 const loaded=async(page)=>{await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor();await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});};
 try{
  console.error('PHASE launch sandbox, reject untrusted certificate');
  browser=await launch();page=await browser.newPage();
  let rejected=false;
  try{await page.goto('https://127.0.0.1:9443/api/auth/sessions/current');}catch(error){rejected=error.message.includes('ERR_CERT_AUTHORITY_INVALID');}
  if(!rejected)throw Error('Untrusted fixture certificate was not rejected');
  checks.push('untrusted certificate rejected');console.error('PHASE close untrusted browser');await browser.close();browser=null;
  execFileSync('certutil',['-A','-d','sql:'+db,'-n','isolated-fixture-only','-t','C,,','-i','/fixture/cert.pem','-f',passwordFile],{timeout:10000});
  browser=await launch();
  console.error('PHASE trusted browser ready');
  const probe=await browser.newPage();
  const trusted=await probe.goto('https://127.0.0.1:9443/api/auth/sessions/current');
  if(trusted.status()!==401)throw Error('Trusted issuer probe must reach its HTTP identity boundary');
  checks.push('trusted CA reaches real HTTPS fixture');await probe.close();
  const sharedContext=await browser.newContext({viewport:{width:1366,height:900}});
  let firstSessionName='';
  await pause(61000); // expire requests from synthetic fixture preparation
  for(const [identity,team] of [['fixture-a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],['fixture-b','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'],['fixture-reader','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa']]){
   const context=sharedContext;
   if(identity!=='fixture-a')await pause(61000); // separate human work intervals
   page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
   page.on('console',message=>{if(message.type()==='error')console.error('CONSOLE',message.text());});
   page.on('request',request=>{const u=new URL(request.url());if(u.pathname.startsWith('/api/auth/'))console.error('AUTH_REQUEST',u.origin,u.pathname);});
   page.on('requestfailed',request=>console.error('NETWORK',new URL(request.url()).pathname,request.failure()?.errorText));
   page.on('response',response=>{if(response.status()>=400)console.error('HTTP',response.status(),new URL(response.url()).pathname);});
   await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   console.error('PHASE login '+identity);
   await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
   const dialog=page.getByRole('dialog');
   await dialog.locator('input[type=email]').fill(identity+'@example.test');
   await dialog.locator('input[type=password]').fill('fixture-password');
   await dialog.locator('button[type=submit]').click();
   const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});
   try{await select.waitFor();}catch(error){const body=(await page.locator('body').innerText()).slice(-4000);fs.writeFileSync('/results/browser-failure.txt',body);await page.screenshot({path:'/results/browser-failure.png'});console.error('LOGIN_VIEW',body);throw error;}
   const list=scopedList(page,team);await select.selectOption(team);await list;await loaded(page);
   console.error('PHASE authorized workspace '+identity);
   console.error('COOKIE_METADATA',JSON.stringify((await context.cookies()).map(({name,domain,secure,httpOnly,sameSite})=>({name,domain,secure,httpOnly,sameSite}))));
   checks.push(identity+' UI password login and authorized team');
   let savedSessionId='';
   if(identity==='fixture-reader'){
    if(!(await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText()).includes(firstSessionName))throw Error('Reader did not load the persisted team session');
    if(!(await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).isDisabled()))throw Error('Reader can edit a session in the UI');
    checks.push('reader reads persisted team session and form stays locked after loading');
   }else{
    if(identity==='fixture-b'){
     if((await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText()).includes(firstSessionName))throw Error('Foreign session leaked after account change');
     checks.push('account change in shared browser storage does not expose foreign sessions');
    }
    const name='BROWSER SYNTHETIC '+identity;
    if(identity==='fixture-a')firstSessionName=name;
    await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).fill(name);
    const saved=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions')&&response.request().method()==='POST');
    await page.getByRole('button',{name:'Guardar sesión',exact:true}).click();
    const response=await saved;
    if(![200,201].includes(response.status()))throw Error('UI session save rejected: '+response.status());
    savedSessionId=(await response.json()).id;
    checks.push(identity+' creates a persisted session through UI');
   }
   await page.reload({waitUntil:'networkidle'});
   try{await page.getByRole('combobox',{name:'Equipo activo',exact:true}).waitFor();}catch(error){fs.writeFileSync('/results/refresh-failure.txt',await page.locator('body').innerText());console.error('REFRESH_VIEW',(await page.locator('body').innerText()).slice(-2500));throw error;}
   const refreshedList=scopedList(page,team);await page.getByRole('combobox',{name:'Equipo activo',exact:true}).selectOption(team);await refreshedList;await loaded(page);
   if(savedSessionId){
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(savedSessionId);
    await page.getByRole('button',{name:'Revisar contexto',exact:true}).click();
    await loaded(page);
    await page.getByText('Editar contexto de la sesión',{exact:true}).click();
    checks.push(identity+' reopens persisted session after cold load');
    const name='BROWSER SYNTHETIC '+identity+' revised';
    await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).fill(name);
    const updated=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions/'+savedSessionId)&&response.request().method()==='PUT');
    await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();
    if((await updated).status()!==200)throw Error('Session revision did not persist');
    if(identity==='fixture-a')firstSessionName=name;
    checks.push(identity+' updates the persisted session through UI');
   }
   checks.push(identity+' cold refresh cookie rehydration');
   if(errors.length)throw Error('Browser runtime errors: '+errors.join(';'));
   checks.push(identity+' no runtime exceptions');
   await page.getByRole('combobox',{name:'Equipo activo',exact:true}).selectOption('');
   await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor({state:'hidden'});
   const resumedList=scopedList(page,team);await page.getByRole('combobox',{name:'Equipo activo',exact:true}).selectOption(team);await resumedList;await loaded(page);
   checks.push(identity+' clearing team locks workspace and verified selection restores it');
   const logout=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/logout'&&response.request().method()==='POST');
   await page.getByRole('button',{name:'Cerrar sesión de usuario',exact:true}).click();
   if((await logout).status()!==200)throw Error('Logout did not clear the issuer session');
   await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).waitFor();
   checks.push(identity+' logout survives reload');
   await page.close();
  }
  let humanAuthority=false,identityScenarios=false;
  if(process.env.KDD_ENGINEERING_FIXTURE==='1'){
   const seeded=JSON.parse(fs.readFileSync('/results/engineering-seed.json','utf8'));
   for(const [identity,owner,team] of [['fixture-a','fixture-a','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],['fixture-bsub','fixture-b','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb']]){
    await pause(61000);
    page=await sharedContext.newPage();
    await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
    await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
    const dialog=page.getByRole('dialog');await dialog.locator('input[type=email]').fill(identity+'@example.test');await dialog.locator('input[type=password]').fill('fixture-password');await dialog.locator('button[type=submit]').click();
    const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});await select.waitFor();
    const list=scopedList(page,team);await select.selectOption(team);await list;await loaded(page);
    const session=seeded.sessions[owner];
    await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption(session.session_id);
    await page.getByRole('textbox',{name:'Nota de decisión',exact:true}).fill('SYNTHETIC isolated QA only; no real mechanical instruction');
    await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(button=>button.textContent==='Aprobar propuesta'&&!button.disabled));
    const decision=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/proposals/'+session.proposal_id+'/decisions')&&response.request().method()==='POST');
    await page.getByRole('button',{name:'Aprobar propuesta',exact:true}).click();
    const response=await decision;if(response.status()!==200||(await response.json()).action!=='approve')throw Error('UI human approval failed');
    await page.getByText('Estado: Aprobada y vigente.',{exact:true}).waitFor();
    checks.push(identity+' approves through UI and actual SQL authority');
    const logout=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/auth/logout'&&response.request().method()==='POST');
    await page.getByRole('button',{name:'Cerrar sesión de usuario',exact:true}).click();await logout;await page.close();
   }
   humanAuthority=true;
   await require('/acceptance/identity_scenarios.cjs')(sharedContext,checks);
   identityScenarios=true;
  }
  await sharedContext.close();
  completed=true;
  console.log(JSON.stringify({status:'passed',checks,sandbox:true,tls_verified:true,human_authority:humanAuthority,identity_scenarios:identityScenarios,identity:'synthetic cookie issuer; not external RLS acceptance'}));
 }finally{if(!completed&&page&&!page.isClosed()){fs.writeFileSync('/results/browser-failure.txt',await page.locator('body').innerText());await page.screenshot({path:'/results/browser-failure.png'});}if(browser)await browser.close();}
})().catch(error=>{console.error(error.message);process.exit(1);});
