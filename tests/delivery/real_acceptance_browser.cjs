// Actual provider password login and compiled UI, never a synthetic issuer.
const {chromium}=require('/deps/playwright');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
(async()=>{
 const input=JSON.parse(fs.readFileSync('/qa-private/accounts.json','utf8'));
 const expected=JSON.parse(fs.readFileSync('/expected.json','utf8'));
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'chassis-real-browser-'));
 process.env.HOME=home;
 const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
 const passwordFile=path.join(home,'empty-password');fs.writeFileSync(passwordFile,'\n',{mode:0o600});
 execFileSync('certutil',['-N','--empty-password','-d','sql:'+db,'-f',passwordFile],{timeout:10000});
 execFileSync('certutil',['-A','-d','sql:'+db,'-n','chassis-preproduction-api','-t','C,,','-i','/run/secrets/api_ca','-f',passwordFile],{timeout:10000});
 const checks=[];let browser;
 try{
  browser=await chromium.launch({headless:true,chromiumSandbox:true});
  for(const [team,role] of [['A','chief'],['B','substitute'],['A','reader']]){
   const account=input.accounts.find(a=>a.team===team&&a.role===role);
   const context=await browser.newContext({viewport:{width:1366,height:900}});
   const page=await context.newPage();const errors=[];
   page.on('pageerror',error=>errors.push(error.name));
   await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
   const dialog=page.getByRole('dialog');
   await dialog.locator('input[type=email]').fill(account.email);
   await dialog.locator('input[type=password]').fill(account.password);
   await dialog.locator('button[type=submit]').click();
   const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});
   const own=expected.prefix+' SYNTHETIC QA '+team;
   const foreign=expected.prefix+' SYNTHETIC QA '+(team==='A'?'B':'A');
   const authorizedWorkspace=async()=>{
    await select.waitFor();
    const loaded=page.waitForResponse(response=>new URL(response.url()).pathname.endsWith('/engineering/sessions')&&
      response.request().method()==='GET'&&response.request().headers()['x-team-id']===input.teams[team]&&response.status()===200);
    await select.selectOption(input.teams[team]);await loaded;
    await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor();
    await page.getByText('Cargando contexto y catálogo del equipo…',{exact:true}).waitFor({state:'hidden'});
    const text=await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText();
    if(!text.includes(own)||text.includes(foreign))throw Error('Team session scope failed');
    if(role==='reader'&&!(await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).isDisabled()))throw Error('Reader form not locked');
   };
   await authorizedWorkspace();
   await page.reload({waitUntil:'networkidle'});
   await authorizedWorkspace();
   if(errors.length)throw Error('Browser runtime error');
   checks.push(team+'_'+role+'_real_login_scope_and_reload');
   await context.close();
  }
  console.log(JSON.stringify({status:'passed',gates:{authenticated_browser:'passed'},checks}));
 }finally{if(browser)await browser.close();}
})().catch(()=>{console.log(JSON.stringify({status:'blocked',gates:{authenticated_browser:'blocked'}}));process.exitCode=2;});
