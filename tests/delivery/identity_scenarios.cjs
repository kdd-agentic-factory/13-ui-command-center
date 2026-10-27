// Compiled UI against real loopback HTTP fault transport. No fetch interception.
const fs=require('node:fs');
module.exports=async function identityScenarios(context,checks){
 const mode='/qa-control/identity-mode',held='/qa-control/identity-held';
 const setMode=value=>fs.writeFileSync(mode,value);
 const teamA='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',teamB='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const list=(page,team)=>page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/engineering/sessions')&&r.request().method()==='GET'&&r.request().headers()['x-team-id']===team&&r.status()===200);
 let page=await context.newPage();
 try{
  console.error('PHASE identity scope switch before POST');
  setMode('authenticated');
  await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.locator('input[type=email]').fill('fixture-admin@example.test');
  await dialog.locator('input[type=password]').fill('fixture-password');
  await dialog.locator('button[type=submit]').click();
  const select=page.getByRole('combobox',{name:'Equipo activo',exact:true});await select.waitFor();
  const first=list(page,teamA);await select.selectOption(teamA);await first;
  await page.getByRole('button',{name:'Revisar contexto',exact:true}).click();
  await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).selectOption('');
  const name='SYNTHETIC must never be dispatched across teams';
  await page.getByRole('textbox',{name:'Nombre de sesión',exact:true}).fill(name);
  await page.waitForLoadState('networkidle');
  const writes=[];
  page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname.includes('/engineering/sessions'))writes.push(request.url());});
  if(fs.existsSync(held))fs.unlinkSync(held);
  setMode('hold');
  await page.getByRole('button',{name:'Guardar sesión',exact:true}).click();
  const end=Date.now()+5000;
  while(!fs.existsSync(held)&&Date.now()<end)await new Promise(resolve=>setTimeout(resolve,50));
  if(!fs.existsSync(held))throw Error('Save did not reach held identity discovery');
  const next=list(page,teamB);await select.selectOption(teamB);
  await page.getByRole('button',{name:'Descartar cambios y continuar',exact:true}).click();
  setMode('authenticated');await next;await page.waitForLoadState('networkidle');
  if(writes.length)throw Error('Stale session POST escaped after team changed');
  const back=list(page,teamA);await select.selectOption(teamA);await back;
  await page.getByRole('button',{name:'Revisar contexto',exact:true}).click();
  if((await page.getByRole('combobox',{name:'Reabrir sesión',exact:true}).innerText()).includes(name))throw Error('Discarded cross-team session was persisted');
  checks.push('real held discovery and team switch suppress stale POST and leave original team unchanged');
  const logout=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/auth/logout'&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Cerrar sesión de usuario',exact:true}).click();await logout;
  await page.close();
  for(const value of ['local','unknown','down']){
   console.error('PHASE identity HTTP fault '+value);
   setMode(value);page=await context.newPage();
   await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'Reintentar comprobación de identidad',exact:true}).waitFor();
   if(await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).count())throw Error('Identity fault exposed engineering workspace: '+value);
   if((await page.locator('body').innerText()).includes('Modo local · sin autenticación'))throw Error('Commercial UI fell back to local operator');
   checks.push('real HTTP '+value+' identity fault leaves commercial workspace locked');
   await page.close();
  }
  console.error('PHASE authenticated issuer outage');
  setMode('authenticated');page=await context.newPage();
  await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Iniciar sesión para Chassis',exact:true}).click();
  const login=page.getByRole('dialog');
  await login.locator('input[type=email]').fill('fixture-admin@example.test');
  await login.locator('input[type=password]').fill('fixture-password');
  await login.locator('button[type=submit]').click();
  const active=page.getByRole('combobox',{name:'Equipo activo',exact:true});await active.waitFor();
  const authorized=list(page,teamA);await active.selectOption(teamA);await authorized;
  await page.getByRole('button',{name:'Revisar contexto',exact:true}).click();
  await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor();
  setMode('issuer-down');
  // The SDK can return its cached profile. Probe the actual trusted HTTPS issuer
  // and then require the backend membership check to withdraw the workspace.
  const outageStatus=await page.evaluate(async()=>{
   const response=await fetch('https://127.0.0.1:9443/api/auth/sessions/current',{headers:{Authorization:'Bearer fixture-admin',apikey:'public-fixture-only'}});
   return response.status;
  });
  if(outageStatus!==503)throw Error('Controlled issuer did not return actual HTTP503');
  const unavailable=page.waitForResponse(r=>new URL(r.url()).pathname.endsWith('/api/v1/teams')&&r.status()!==200);
  await page.getByRole('button',{name:'Comprobar acceso',exact:true}).click();await unavailable;
  await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).waitFor({state:'hidden'});
  await page.getByText('Sin membresías verificadas. Un administrador debe asignarte a un equipo.',{exact:true}).waitFor();
  if(await page.getByRole('region',{name:'Contexto de ingeniería',exact:true}).count())throw Error('Issuer503 retained the authenticated workspace');
  checks.push('actual issuer503 withdraws previously authorized workspace');
 }catch(error){
  if(page&&!page.isClosed()){fs.writeFileSync('/results/identity-failure.txt',await page.locator('body').innerText());await page.screenshot({path:'/results/identity-failure.png'});}
  throw error;
 }finally{setMode('authenticated');if(page&&!page.isClosed())await page.close();}
};
