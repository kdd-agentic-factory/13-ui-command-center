// Read-only public-site identity check. No approvals, uploads or captured credentials.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs');
const SITE='https://czdpamk9.insforge.site';
const IDENTITY='https://czdpamk9.eu-central.insforge.app';
(async()=>{
 let browser,phase='initialize';const checks=[];
 const report={status:'blocked',target:SITE,public_deployment_changed:false,candidate_acceptance:false,human_approval_performed:false,backend_cross_team_denial_tested:false,checks};
 try{
  const data=JSON.parse(fs.readFileSync('/qa-private/accounts.json','utf8'));
  if(!Array.isArray(data.accounts)||data.accounts.length!==8||Object.keys(data.teams).sort().join()!=='A,B')throw Error('Invalid fixture');
  browser=await chromium.launch({headless:true,chromiumSandbox:true});
  for(const [team,role] of [['A','chief'],['B','substitute']]){
   const account=data.accounts.find(a=>a.team===team&&a.role===role);
   if(!account||!data.teams[team])throw Error('Missing account');
   const context=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'});
   await context.routeWebSocket('**/*',socket=>socket.close());
   await context.route('**/*',route=>{
    const origin=new URL(route.request().url()).origin;
    return [SITE,IDENTITY].includes(origin)?route.continue():route.abort();
   });
   try{
    const page=await context.newPage();phase=team+'_'+role+'_login';
    let validReads=0,readGeneration=0;const requestGeneration=new WeakMap();const invalidReads=[];
    page.on('request',request=>requestGeneration.set(request,readGeneration));report.last_read_diagnostics={statuses:[],failures:invalidReads};
    page.on('response',async response=>{
     const generation=readGeneration;
     if(requestGeneration.get(response.request())!==generation)return;
     if(!new URL(response.url()).pathname.endsWith('/engineering/sessions')||response.request().method()!=='GET')return;
     if(report.last_read_diagnostics.statuses.length<20)report.last_read_diagnostics.statuses.push(response.status());
     const requestedTeam=response.request().headers()['x-team-id'];
     // Startup may be denied before team selection. Only a successful foreign read is a leak.
     if(response.status()!==200)return;
     if(requestedTeam!==data.teams[team]){invalidReads.push('foreign_scope');return;}
     try{
      const body=await response.json();
      if(generation!==readGeneration)return;
      if(!Array.isArray(body.items)||body.items.some(item=>item.team_id!==data.teams[team])){invalidReads.push('response_scope');return;}
      validReads++;
     }catch{invalidReads.push('invalid_json');}
    });
    await page.goto(SITE+'/pit-wall/app',{waitUntil:'domcontentloaded',timeout:30000});
    await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click({timeout:20000});
    const dialog=page.getByRole('dialog');
    await dialog.locator('input[type=email]').fill(account.email);
    await dialog.locator('input[type=password]').fill(account.password);
    await dialog.locator('button[type=submit]').click();
    const verifyScope=async(label)=>{
     phase=team+'_'+role+'_'+label;
     const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});
     await select.waitFor({timeout:30000});
     await page.waitForFunction(id=>Array.from(document.querySelectorAll('select option')).some(o=>o.value===id),data.teams[team],{timeout:30000});
     const values=await select.locator('option').evaluateAll(options=>options.map(o=>o.value));
     if(values.includes(data.teams[team==='A'?'B':'A']))throw Error('Foreign team exposed');
     await select.selectOption(data.teams[team]);
     if(await select.inputValue()!==data.teams[team])throw Error('Wrong team');
     await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor({timeout:30000});
     const deadline=Date.now()+30000;
     while(validReads===0&&invalidReads.length===0&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,200));
     if(validReads===0||invalidReads.length)throw Error('Scoped session read unverified');
     checks.push(team+'_'+role+'_'+label+'_session_read');
    };
    await verifyScope('login_scope');
    readGeneration++;validReads=0;invalidReads.length=0;
    await page.reload({waitUntil:'domcontentloaded',timeout:30000});
    await verifyScope('reload_scope');
   }finally{await context.close();}
  }
  report.status='passed';
 }catch(error){report.phase=phase;report.error_type=['TimeoutError','Error','TypeError'].includes(error.name)?error.name:'BrowserError';}
 finally{if(browser)await browser.close();}
 console.log(JSON.stringify(report));process.exitCode=report.status==='passed'?0:2;
})().catch(()=>{console.log(JSON.stringify({status:'blocked',phase:'initialization',details_redacted:true}));process.exitCode=2;});
