import {test,expect} from '@playwright/test';
for(const width of [390,1366])for(const owner of ['domains','lab','cornering'])test(`unfinished ${owner} stays recoverable at ${width}px without telemetry`,async({page,request})=>{
 await page.setViewportSize({width,height:900});
 const headers={'X-Actor-ID':'local-operator','X-Workflow-ID':'workflow-recovery-qa','X-Trace-ID':'synthetic-context-only'};
 const context:Record<string,unknown>={name:'SYNTHETIC workflow control only'};
 for(const kind of ['circuit','bike','rider']){
  const r=await request.post(`http://127.0.0.1:8185/api/v1/engineering/catalog/${kind}`,{headers,data:{operation_id:crypto.randomUUID(),body:{name:'SYNTHETIC '+kind}}});expect(r.ok(),`catalog ${r.status()}: ${await r.text()}`).toBe(true);const entity=await r.json();context[kind]={id:entity.id,revision:1};
 }
 const response=await request.post('http://127.0.0.1:8185/api/v1/engineering/sessions',{headers,data:{operation_id:crypto.randomUUID(),body:context}});expect(response.ok(),`session ${response.status()}: ${await response.text()}`).toBe(true);const session=await response.json();
 await page.addInitScript(id=>localStorage.setItem('kdd-engineering-session:local',id),session.id);
 await page.goto('/pit-wall/app');
 await expect(page.getByRole('region',{name:'Evidencia por dominio',exact:true})).toContainText('No hay contextos medidos guardados');
 await page.getByLabel('Vista de trabajo',{exact:true}).selectOption('engineer');
 const area=page.locator(`[data-area="${owner==='cornering'?'workshop':owner}"]`);
 let action:string,field:string;
 if(owner==='domains'){
  await area.getByText('Aportar medición o importar CSV',{exact:true}).click();field='Documento o registro de origen';action='Revisar el contexto medido sin guardar';
 }else if(owner==='lab'){
  await area.locator('.lab-import > summary').click();field='Modelo del componente';action='Revisar el laboratorio sin guardar';
 }else{
  await area.getByRole('tab',{name:'Dinámica en curva'}).click();field='Velocidad en curva';action='Revisar el escenario de curva sin guardar';
 }
 await area.getByLabel(field,{exact:true}).fill(owner==='cornering'?'120':'SYNTHETIC unsaved input');
 if(owner==='cornering')await area.getByRole('tab',{name:'Geometría global'}).click();
 for(const view of ['rider','mechanic','engineer','analyst','crew-chief','management']){
  await page.getByLabel('Vista de trabajo',{exact:true}).selectOption(view);
  await page.getByRole('button',{name:action,exact:true}).click();
  await expect(area).toBeFocused();
  await expect(area.getByLabel(field,{exact:true})).toHaveValue(owner==='cornering'?'120':'SYNTHETIC unsaved input');
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
 }
 if(owner==='cornering')await expect(area.getByRole('tab',{name:'Dinámica en curva'})).toHaveAttribute('aria-selected','true');
 // The normal leave guard still protects the same pending input.
 await page.getByRole('button',{name:'Importar AiM / 2D',exact:true}).click();
 await expect(page.getByRole('alertdialog')).toBeVisible();
 await page.getByRole('button',{name:'Seguir editando',exact:true}).click();
 await expect(area.getByLabel(field,{exact:true})).toHaveValue(owner==='cornering'?'120':'SYNTHETIC unsaved input');
 await page.screenshot({path:`.superpowers/sdd/2026-10-26-workflow-recovery/${owner}-${width}.png`});
});
