import { test, expect } from '@playwright/test';

test('local recorded chassis: import, measured A/B, evidence, restore and backend failure', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('/pit-wall/app');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
  await page.getByRole('button', { name: 'Importar AiM / 2D' }).click();
  await page.getByLabel('Origen de telemetría').selectOption('2d');
  await page.getByLabel('Archivo de telemetría').setInputFiles({ name: 'QA-2D-format-fixture.csv', mimeType: 'text/csv', buffer: Buffer.from('Time;F_Susp;R_Susp\ns;mm;mm\n0;12;20\n0.02;14;21\n0.05;13;22\n') });
  await page.getByRole('button', { name: 'Abrir Chassis Tool' }).click();
  await expect(page.getByRole('heading', { name: 'Comparar setups medidos' })).toBeVisible();
  await page.getByLabel('Identificador de moto').fill(`QA-fixture-${Date.now()}`);
  await page.getByLabel('Confirmo la moto de esta sesión').check();
  for (const side of ['A', 'B']) {
    await page.getByRole('button', { name: side === 'A' ? 'A · Base registrada' : 'B · Alternativa' }).click();
    await page.getByLabel('Radio delantero cargado').fill('300');
    await page.getByRole('spinbutton', { name: 'Dirección desde la vertical °', exact: true }).fill('24');
    await page.getByRole('spinbutton', { name: 'Offset de dirección mm', exact: true }).fill(side === 'A' ? '30' : '35');
    await page.getByLabel('Batalla', { exact: false }).fill('1400');
  }
  await page.getByRole('button', { name: 'Guardar y comparar A/B' }).click();
  await expect(page.getByText('Modelo: chassis-planar-1.1.0')).toBeVisible();
  const table = page.getByRole('table');
  await expect(table).toContainText('100.73 mm');
  await expect(table).toContainText('-5.47 mm');
  await expect(page.getByRole('img', { name: /Superposición/ })).toBeVisible();
  await page.getByText('Vincular una señal calibrada', { exact: true }).click();
  await page.getByLabel('Canal para el modelo').selectOption('0');
  await page.getByLabel('Cero en unidades originales').fill('0');
  await page.getByLabel('Escala de calibración').fill('1');
  await page.getByLabel('Referencia de calibración').fill('QA fixture units; not real 2D validation');
  await page.getByLabel('Punto de medida').selectOption('shock');
  await page.getByLabel('Cero del sensor referido a extensión completa').check();
  for (const side of ['A', 'B']) {
    await page.getByRole('button', { name: side === 'A' ? 'A · Base registrada' : 'B · Alternativa' }).click();
    if (!(await page.getByLabel('Constante del muelle', { exact: false }).isVisible())) await page.getByText('Muelle y relación de suspensión medida', { exact: true }).click();
    await page.getByLabel('Constante del muelle', { exact: false }).fill('100');
    await page.getByLabel('Precarga del muelle', { exact: false }).fill('10');
    if (!(await page.getByLabel('Usar curva progresiva').isVisible())) await page.getByText('Curva de suspensión progresiva', { exact: true }).click();
    await page.getByLabel('Usar curva progresiva').check();
    await page.getByLabel('Puntos rueda; amortiguador (mm)').fill(side === 'A' ? '0;0\n50;25\n100;50' : '0;0\n50;30\n100;60');
    await page.getByLabel('Referencia de la curva', { exact: true }).fill('QA synthetic fixture, not measured bike');
    await page.getByLabel('Referencia: extensión completa', { exact: true }).check();
  }
  await page.getByRole('button', { name: 'Guardar y comparar A/B' }).click();
  await expect(page.getByText(/^Calculado · Suspensión progresiva · [AB]$/)).toHaveCount(2, { timeout: 15000 });
  await expect(page.getByText('Observado · Desplazamiento de suspensión', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Modelo: chassis-planar-1.1.0')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('-5.47 mm');
  await page.getByText('Vincular una señal calibrada', { exact: true }).click();
  await expect(page.getByLabel('Canal para el modelo')).toHaveValue('0');
  await expect(page.getByLabel('Referencia de calibración')).toHaveValue('QA fixture units; not real 2D validation');
  await page.getByText('Vincular una señal calibrada', { exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Guardar y comparar A/B' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/chassis-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.screenshot({ path: 'test-results/chassis-desktop.png', fullPage: true });
  await page.route('**/api/v1/chassis/comparisons', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ detail: 'Backend test outage' }) }));
  await page.getByLabel('Confirmo la moto de esta sesión').check();
  await page.getByRole('button', { name: 'Guardar y comparar A/B' }).click();
  await expect(page.getByRole('alert')).toContainText('Backend test outage');
  await expect(page.getByRole('table')).toContainText('-5.47 mm');
});
