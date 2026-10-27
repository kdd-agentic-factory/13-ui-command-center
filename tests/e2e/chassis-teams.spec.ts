import {test,expect} from '@playwright/test';
const A='22222222-2222-4222-8222-222222222222',B='33333333-3333-4333-8333-333333333333';
test('QA authenticated provider: team switch hides recordings and logout removes identity',async({page})=>{
 let signedIn=false;
 page.on('requestfailed',r=>{if(r.url().includes('/auth/')) console.log('QA auth request failed:',new URL(r.url()).pathname,r.failure()?.errorText);});
 test.skip(!process.env.KDD_TEAM_E2E_URL,'Requires isolated QA identity server and configured QA Vite origin');
 await page.route('**/api/auth/refresh*',route=>!signedIn?route.fulfill({status:401,json:{error:'QA logged out'}}):route.fulfill({headers:{'access-control-allow-origin':new URL(process.env.KDD_TEAM_E2E_URL!).origin,'access-control-allow-credentials':'true','access-control-allow-headers':'content-type,authorization,apikey,x-csrf-token'},json:{accessToken:'QA-only-token',user:{id:'11111111-1111-4111-8111-111111111111',email:'qa@example.invalid',profile:{name:'QA fixture'}},expiresIn:3600}}));
 await page.route('**/api/auth/sessions*',route=>{signedIn=true;return route.fulfill({headers:{'access-control-allow-origin':new URL(process.env.KDD_TEAM_E2E_URL!).origin,'access-control-allow-credentials':'true'},json:{accessToken:'QA-only-token',user:{id:'11111111-1111-4111-8111-111111111111',email:'qa@example.invalid',profile:{name:'QA fixture'}},expiresIn:3600}});});
 await page.route('**/api/auth/logout*',route=>{signedIn=false;return route.fulfill({json:{success:true}});});
 await page.route('**/api/telemetry/**',async route=>{
  const url=new URL(route.request().url());const response=await route.fetch({url:'http://127.0.0.1:8191'+url.pathname.replace('/api/telemetry','')+url.search});await route.fulfill({response});
 });
 await page.goto(process.env.KDD_TEAM_E2E_URL!+'/pit-wall/app');await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();});await page.reload();
 await expect(page.getByRole('button',{name:'Iniciar sesión para Chassis'})).toBeVisible();
 {
  await page.getByRole('button',{name:'Iniciar sesión para Chassis'}).click();
  await page.getByLabel(/email/i).fill('qa@example.invalid');
  await page.getByLabel(/password|contraseña/i).fill('QA-not-a-real-password');
  await page.getByRole('button',{name:/^Sign in$|^Iniciar sesión$/i}).click();
 }
 await page.getByLabel('Equipo activo').selectOption(A);
 await page.getByRole('button',{name:'Importar AiM / 2D'}).click();
 await page.getByLabel('Origen de telemetría').selectOption('2d');
 await page.getByLabel('Archivo de telemetría').setInputFiles({name:'QA-team-private.csv',mimeType:'text/csv',buffer:Buffer.from('Time,Shock\ns,mm\n0,10\n.01,20\n')});
 await page.getByRole('button',{name:'Abrir Chassis Tool'}).click();
 await expect(page.getByRole('heading',{name:'QA-team-private.csv',exact:true})).toBeVisible();
 await page.getByLabel('Equipo activo').selectOption(B);
 await expect(page.getByRole('heading',{name:'QA-team-private.csv',exact:true})).toHaveCount(0);
 await page.getByLabel('Equipo activo').selectOption(A);
 await expect(page.getByRole('heading',{name:'QA-team-private.csv',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cerrar sesión de usuario'}).click();
 await expect(page.getByRole('heading',{name:'KDD MOTO INTELLIGENCE',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'QA-team-private.csv',exact:true})).toHaveCount(0);
});
