import {test,expect} from '@playwright/test';
import {delivery,task,teamId,userId} from '../workboardFixtures';
for(const mobile of [false,true])test(`workboard desktop/mobile ${mobile}`,async({page},testInfo)=>{
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:1000});
 await page.route('**/src/services/telemetryIdentity.ts',route=>route.fulfill({contentType:'application/javascript',body:`const identity={mode:'authenticated',team:'${teamId}',user:'${userId}',role:'engineer',generation:1};export const identitySnapshot=()=>({...identity});export const telemetryFetch=(url,init)=>fetch(url,init);`}));
 const selected=task({state:'in_review',revision:4});
 await page.route('**/api/telemetry/api/v1/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let body:unknown;
  if(path.endsWith('/workboard'))body={schema_version:'1.0.0',items:[selected,task({id:'20000000-0000-4000-8000-000000000001',title:'Revisar curva de suspensión',state:'in_progress',revision:3,target_profile:'engineer'}),task({id:'20000000-0000-4000-8000-000000000002',title:'Contrastar reloj GPS',state:'blocked',blocked_reason:'Falta exportación independiente del fabricante.',target_profile:'analyst'})]};
  else if(path.endsWith('/latest-review'))body=delivery();
  else if(path.endsWith('/settings/crew-chief'))body={team_id:teamId,primary_id:userId,substitute_id:null,revision:1};
  else if(path.endsWith('/decision'))return route.fulfill({status:404,json:{detail:'No decision'}});
  else return route.abort();
  await route.fulfill({json:body});
 });
 await page.goto('/pit-wall/tests/fixtures/session-workboard.html');
 await page.getByText('Trabajo de la sesión',{exact:true}).click();
 await page.getByRole('button',{name:'Medir recorrido delantero'}).click();
 await page.getByRole('button',{name:'Ver última entrega'}).click();
 await expect(page.getByText('Tres medidas registradas',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Aceptar entrega'})).toBeDisabled();
 await page.getByLabel('Nota de revisión humana').fill('Ensayo de teclado: no se envía ninguna decisión.');
 await expect(page.getByRole('button',{name:'Aceptar entrega'})).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
 await page.screenshot({path:testInfo.outputPath(mobile?'workboard-mobile.png':'workboard-desktop.png'),fullPage:true});
});
