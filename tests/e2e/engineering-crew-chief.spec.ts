import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

test('synthetic HTTP + SQL: saved context and A/B, both branches, proposal, human, invalidation',async({page})=>{
  test.setTimeout(120000);
  page.setDefaultTimeout(15000);
  const manifest=JSON.parse(await readFile(path.resolve('.superpowers/sdd/2026-10-25-session-crew-chief-dual-analysis/task-11-browser-fixture.json'),'utf8'));
  expect(manifest.synthetic).toBe(true);
  const url='/pit-wall/tests/e2e/engineering-harness.html?'+new URLSearchParams({backend:manifest.backend,recording:manifest.recording});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(url);
  await page.getByLabel('Nombre de sesión',{exact:true}).fill('SYNTHETIC browser acceptance');
  await page.getByLabel(/^Procedencia/).selectOption('synthetic');
  await page.getByLabel('Circuito',{exact:true}).selectOption(`${manifest.catalog.circuit.id}:1`);
  await page.getByLabel('Moto',{exact:true}).selectOption(`${manifest.catalog.bike.id}:1`);
  await page.getByRole('button',{name:'Guardar sesión',exact:true}).click();
  await expect(page.getByRole('heading',{name:'SYNTHETIC browser acceptance',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Asociar grabación y setup actuales'})).toBeEnabled();
  await page.getByRole('button',{name:'Asociar grabación y setup actuales'}).click();
  await expect(page.getByRole('button',{name:'Iniciar análisis',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Iniciar análisis',exact:true}).click();
  await expect(page.getByText('Ejecución Sellada',{exact:true})).toBeVisible({timeout:60000});
  await expect(page.getByRole('button',{name:'Aprobar propuesta'})).toBeEnabled({timeout:20000});
  await expect(page.getByRole('row',{name:/Principal chassis Completado/})).toBeVisible();
  await expect(page.getByRole('row',{name:/Revisión mechanical-check Completado/})).toBeVisible();
  const artifacts=path.resolve('.superpowers/sdd/2026-10-25-session-crew-chief-dual-analysis');
  await page.screenshot({path:path.join(artifacts,'task-11-engineering-desktop.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:path.join(artifacts,'task-11-engineering-mobile.png'),fullPage:true});
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    await page.setViewportSize(viewport);
    await page.getByRole('region',{name:'Propuesta Crew Chief agente',exact:true}).evaluate(element=>element.scrollIntoView({block:'start'}));
    await page.screenshot({path:path.join(artifacts,`task-11-proposal-${viewport.width}.png`)});
    await page.getByLabel('Nota de decisión').evaluate(element=>element.closest('section')!.scrollIntoView({block:'start'}));
    await page.screenshot({path:path.join(artifacts,`task-11-decision-${viewport.width}.png`)});
  }
  await page.getByLabel('Nota de decisión').fill('SYNTHETIC QA approval; no physical action');
  await page.getByRole('button',{name:'Aprobar propuesta'}).click();
  await expect(page.getByText(/Evento humano persistido/)).toBeVisible();
  await expect(page.getByRole('button',{name:'Aprobar propuesta'})).toBeDisabled();
  await page.getByRole('button',{name:'Guardar nueva versión del informe'}).click();
  await expect(page.getByRole('button',{name:'Descargar informe de ingeniería JSON'})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar informe de ingeniería JSON'}).click()]);
  const saved=JSON.parse(await readFile((await download.path())!,'utf8'));
  expect(saved.human_events.some((event:any)=>event.action==='approve')).toBe(true);
  await page.getByText('Editar contexto de la sesión',{exact:true}).click();
  await page.getByLabel('Nombre de sesión',{exact:true}).fill('SYNTHETIC changed context');
  await page.getByRole('button',{name:'Guardar revisión',exact:true}).click();
  await expect(page.getByRole('button',{name:'Aprobar propuesta'})).toHaveCount(0);
  const authority=await page.request.get(`${manifest.backend}/api/v1/engineering/proposals/${saved.proposal.proposal_id}/authority`,{headers:{Authorization:`Bearer ${manifest.subject}`,'X-Team-ID':manifest.team}});
  expect(authority.status()).toBe(200);
  expect((await authority.json()).current).toBe(false);
});



