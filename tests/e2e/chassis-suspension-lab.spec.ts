import {test,expect} from '@playwright/test';

test('isolated measured bench: import, curves, Welch, STFT and immutable evidence',async({page})=>{
  await page.goto('/pit-wall/app');
  const lab=page.getByRole('region',{name:'Banco y señales',exact:true});
  await expect(lab).toContainText('Sin fuente seleccionada');
  await lab.getByText('Importar un ensayo medido',{exact:true}).click();
  const csv='t;f;x;v\n'+Array.from({length:1024},(_,i)=>{
    const t=i/100;return `${t};${100*Math.cos(2*Math.PI*5*t)};${10*Math.sin(2*Math.PI*5*t)};${.1*Math.PI*Math.cos(2*Math.PI*5*t)}`;
  }).join('\n')+'\n';
  await lab.getByLabel('Archivo CSV').setInputFiles({name:'QA-synthetic-bench-not-instrument.csv',mimeType:'text/csv',buffer:Buffer.from(csv)});
  await lab.getByLabel('Medida de movimiento').selectOption('both');
  for(const [label,value] of [
    ['Columna de Tiempo','t'],['Columna de Fuerza','f'],['Columna de Desplazamiento','x'],['Columna de velocidad medida','v'],
    ['Modelo del componente','QA synthetic analytical control'],['Serie o identificador de pieza','QA no physical component'],
    ['Referencia de configuración','QA sine 5Hz'],['Referencia de calibración','QA SI analytical units, no external instrument'],
    ['Origen del reloj','QA generated 100Hz'],['Referencia de sincronización','QA common analytical clock'],
    ['Condiciones de montaje','QA synthetic, no mounting'],['Referencia de cero','QA zero'],['Fecha del ensayo','2026-10-26'],
  ])await lab.getByLabel(label,{exact:true}).fill(value);
  await lab.getByRole('button',{name:'Importar ensayo medido',exact:true}).click();
  // A completed import must not ask the user to discard the form just submitted.
  await expect(lab.getByText(/Fuente: ensayo de banco/)).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await lab.getByRole('combobox',{name:/^Método/}).selectOption('bench');
  await lab.getByRole('button',{name:'Calcular y guardar observación'}).click();
  const result=lab.getByRole('region',{name:'Resultado de suspensión'});
  await expect(result).toContainText('Exploratorio');
  await expect(result).toContainText('Fuerza total');
  for(const view of ['rider','mechanic','engineer','analyst','crew-chief','management']){
    await page.getByLabel('Vista de trabajo',{exact:true}).selectOption(view);
    await expect(result).toContainText('Fuerza total');
    await expect(lab.getByRole('combobox',{name:/^Método/})).toHaveValue('bench');
  }
  await expect(result.getByRole('button',{name:'Incluir en el próximo snapshot'})).toHaveCount(0);
  let savedAnalysisId='';
  for(const method of ['welch','stft']){
    await lab.getByRole('combobox',{name:/^Método/}).selectOption(method);
    await lab.getByRole('combobox',{name:/^Canal\b/}).selectOption({label:'displacement (m) · 1024 muestras'});
    const [calculated]=await Promise.all([
      page.waitForResponse(r=>r.url().endsWith('/analyses')&&r.request().method()==='POST'),
      lab.getByRole('button',{name:'Calcular y guardar observación'}).click(),
    ]);
    expect(calculated.ok()).toBe(true);
    const analysis=await calculated.json();
    expect(analysis.request.method).toBe(method);
    savedAnalysisId=analysis.id;
    await expect(result).toContainText('Análisis espectral');
    await expect(result.getByRole('img',{name:/^Densidad espectral de potencia/})).toBeVisible();
    if(method==='stft')await expect(result.getByRole('img',{name:/^Espectrograma:/})).toBeVisible();
  }
  const [annexResponse]=await Promise.all([
    page.waitForResponse(r=>r.url().endsWith('/evidence')&&r.request().method()==='GET'),
    result.getByRole('button',{name:'Consultar anexo de evidencias'}).click(),
  ]);
  expect(annexResponse.ok()).toBe(true);
  const annex=await annexResponse.json();
  expect(annex.reference.id).toBe(savedAnalysisId);
  await expect(result).toContainText('no_physical_authorization');
  await expect(result).toContainText('"mechanical_authority": "none"');
  await page.reload();
  await expect(lab.getByRole('heading',{name:'Banco y señales'})).toBeVisible();
  await lab.getByText('Resultados guardados del equipo',{exact:true}).click();
  await lab.getByRole('button',{name:new RegExp(`stft · ${annex.reference.id.slice(-8)}`)}).click();
  await expect(result.getByRole('img',{name:/^Espectrograma:/})).toBeVisible();
  const [recovered]=await Promise.all([
    page.waitForResponse(r=>r.url().endsWith('/evidence')&&r.request().method()==='GET'),
    result.getByRole('button',{name:'Consultar anexo de evidencias'}).click(),
  ]);
  expect((await recovered.json()).reference).toEqual(annex.reference);
});
