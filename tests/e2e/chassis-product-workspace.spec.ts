import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('product: saved session library, protected draft, persisted report and download', async ({page})=>{
  test.setTimeout(90000);
  const name=`QA-product-${Date.now()}.csv`;
  await page.goto('/pit-wall/app');
  await page.getByRole('button',{name:'Importar AiM / 2D'}).click();
  await page.getByLabel('Origen de telemetría').selectOption('2d');
  await page.getByLabel('Archivo de telemetría').setInputFiles({name,mimeType:'text/csv',buffer:Buffer.from('Time;F_Susp;R_Susp\ns;mm;mm\n0;12;20\n.02;14;21\n.05;13;22\n')});
  await page.getByRole('button',{name:'Abrir Chassis Tool',exact:true}).click();
  await page.getByLabel('Identificador de moto').fill(`QA-assumed-product-${Date.now()}`);
  await page.getByLabel('Confirmo la moto de esta sesión').check();
  for(const side of ['A','B']){
    await page.getByRole('button',{name:side==='A'?'A · Base registrada':'B · Alternativa'}).click();
    for(const [label,value] of [['Radio delantero cargado mm','300'],['Dirección desde la vertical °','24'],['Offset de dirección mm',side==='A'?'30':'35'],['Batalla mm','1400'],['Masa con piloto y combustible kg','200'],['Reparto estático delantero %','50'],['Altura del centro de gravedad mm','500']]){
      await page.getByRole('spinbutton',{name:label,exact:true}).fill(value);
    }
    for(const checkbox of await page.getByRole('checkbox',{name:'Estimado',exact:true}).all())await checkbox.check();
  }
  await page.getByRole('button',{name:'Guardar y comparar A/B'}).click();
  await expect(page.getByText(/Modelo: chassis-planar/)).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:/Session Report/}).click();
  await expect(page.getByRole('button',{name:'Descargar informe JSON'})).toBeVisible();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar informe JSON'}).click()]);
  const path=await download.path();expect(path).toBeTruthy();
  const report=JSON.parse(await readFile(path!,'utf8'));
  expect(report.schema_version).toBe('1.0.0');
  expect(report.session.id).toBe(report.comparison.session_id);
  expect(report.comparison.setup_a.values.front_radius_m.provenance).toBe('assumed');
  expect(report.session.channels).toBeUndefined();
  await page.getByRole('button',{name:/Connect Data/}).click();
  await page.getByText('Abrir una sesión guardada',{exact:true}).click();
  await page.getByRole('button',{name:`Abrir ${name}`,exact:true}).click();
  await expect(page.getByRole('spinbutton',{name:'Radio delantero cargado mm',exact:true})).toHaveValue('300');
  await page.getByRole('spinbutton',{name:'Radio delantero cargado mm',exact:true}).fill('301');
  await page.getByRole('button',{name:/Setup Management/}).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button',{name:'Seguir editando'}).click();
  await expect(page.getByRole('spinbutton',{name:'Radio delantero cargado mm',exact:true})).toHaveValue('301');
  await page.getByRole('button',{name:/Setup Management/}).click();
  await page.getByRole('button',{name:'Descartar cambios y continuar'}).click();
  await expect(page.getByRole('heading',{name:'Revisiones de setup'})).toBeVisible();
  await page.getByRole('button',{name:/Session Report/}).click();
  await expect(page.getByText(`Informe ${report.comparison.id}`,{exact:false})).toBeVisible();
});
