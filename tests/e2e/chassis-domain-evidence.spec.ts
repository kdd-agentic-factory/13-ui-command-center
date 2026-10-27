import {test,expect} from '@playwright/test';

test('real isolated backend: measured context, documentary review, six views and original CSV',async({page,request})=>{
 const headers={'X-Actor-ID':'local-operator','X-Workflow-ID':'domain-e2e','X-Trace-ID':'synthetic-control'};
 async function post(path:string,body:unknown){const response=await request.post('http://127.0.0.1:8185/api/v1/'+path,{headers,data:body});expect(response.ok()).toBe(true);return response.json();}
 const context:Record<string,unknown>={name:'SYNTHETIC domain QA — no physical validation'};
 for(const kind of ['circuit','bike','rider']){const obj=await post('engineering/catalog/'+kind,{operation_id:crypto.randomUUID(),body:{name:'SYNTHETIC QA '+kind}});context[kind]={id:obj.id,revision:1};}
 const session=await post('engineering/sessions',{operation_id:crypto.randomUUID(),body:context});
 await page.addInitScript(id=>localStorage.setItem('kdd-engineering-session:local',id),session.id);
 await page.goto('/pit-wall/app');
 let panel=page.getByRole('region',{name:'Evidencia por dominio',exact:true});
 await expect(panel).toBeVisible({timeout:60000});
 await expect(panel).toContainText('No hay contextos medidos guardados para esta sesión.',{timeout:60000});
 await panel.getByText('Aportar medición o importar CSV',{exact:true}).click();
 for(const [label,value] of [['Fecha y hora de la medida','2026-10-26T12:00'],['Documento o registro de origen','SYNTHETIC arithmetic control, no metrology acceptance'],['Instrumento utilizado','SYNTHETIC probe'],['Referencia de calibración','SYNTHETIC SI control only'],['Valor medido 1','20']])await panel.getByLabel(label,{exact:true}).fill(value);
 const [created]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/domain-evidence/packets')&&r.request().method()==='POST'),panel.getByRole('button',{name:'Guardar medición',exact:true}).click()]);
 expect(created.ok()).toBe(true);const packet=await created.json();
 await expect(panel.getByRole('region',{name:'Observación consultada'})).toContainText('293.15');
 await panel.getByText('Registrar revisión documental',{exact:true}).click();
 await panel.getByLabel('Documento de revisión',{exact:true}).fill('SYNTHETIC documentary check');
 await panel.getByLabel('Instrumento contrastado',{exact:true}).fill('SYNTHETIC probe');
 const [reviewed]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/attestations')&&r.request().method()==='POST'),panel.getByRole('button',{name:'Registrar revisión de observaciones'}).click()]);
 expect(reviewed.ok()).toBe(true);const revision=await reviewed.json();expect(revision.revision).toBe(2);expect(revision.assessment.mechanical_authority).toBe('none');
 await panel.getByRole('button',{name:'Usar en próximo análisis',exact:true}).click();
 for(const view of ['rider','mechanic','engineer','analyst','crew-chief','management']){await page.getByLabel('Vista de trabajo',{exact:true}).selectOption(view);await expect(panel).toContainText('Selección para el próximo snapshot');await expect(panel).toContainText(revision.id.slice(-8));}
 await page.reload();panel=page.getByRole('region',{name:'Evidencia por dominio',exact:true});
 await expect(panel).toContainText('Selección para el próximo snapshot');
 const snapshot=await post('engineering/sessions/'+session.id+'/snapshots',{expected_revision:1,operation_id:crypto.randomUUID(),selection:{domain_contexts:[{domain:revision.domain,id:revision.id,revision:revision.revision,digest:revision.digest}]}});
 expect(snapshot.schema_version).toBe('1.2.0');expect(snapshot.analyzable).toBe(false);
 expect(snapshot.evidence.domain_contexts[0].quantities[0].value).toBe('293.15');
 await panel.getByText('Aportar medición o importar CSV',{exact:true}).click();
 await panel.getByRole('combobox',{name:/^Dominio medido/}).selectOption('track');
 await panel.getByRole('combobox',{name:/^Origen/}).selectOption('csv');
 for(const [label,value] of [['Anclaje UTC del segundo cero (hora local)','2026-10-26T12:00'],['Documento o registro de origen','SYNTHETIC CSV control'],['Instrumento utilizado','SYNTHETIC length control'],['Referencia de calibración','SYNTHETIC SI reference'],['Referencia del reloj','SYNTHETIC original clock'],['Sector 1','QA-T1'],['Columna de tiempo','t'],['Inicio del intervalo (s)','0'],['Final del intervalo (s)','2'],['Columna de la medida 1','length']])await panel.getByLabel(label,{exact:true}).fill(value);
 await panel.getByLabel('Archivo CSV',{exact:true}).setInputFiles({name:'SYNTHETIC-control.csv',mimeType:'text/csv',buffer:Buffer.from('t;length\n0;240\n1;241\n2;242\n')});
 const [imported]=await Promise.all([page.waitForResponse(r=>r.url().endsWith('/packets/imports')&&r.request().method()==='POST'),panel.getByRole('button',{name:'Importar CSV medido',exact:true}).click()]);
 expect(imported.ok()).toBe(true);const track=await imported.json();expect(track.statistics[0].mean).toBe('241');expect(track.statistics[0].count).toBe(3);expect(track.assessment.status).toBe('contributed');
 await expect(panel.getByRole('region',{name:'Observación consultada'})).toContainText('Media de muestras');
 await expect(panel.getByRole('region',{name:'Observación consultada'})).toContainText('240–242');
 await expect(page.getByRole('alertdialog')).toHaveCount(0);
 for(const width of [390,1024,1366]){await page.setViewportSize({width,height:900});await panel.scrollIntoViewIfNeeded();expect(await panel.evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);await page.screenshot({path:`.superpowers/sdd/2026-10-26-chassis-domain-evidence/domain-${width}.png`});}
 expect(packet.revision).toBe(1);
});
