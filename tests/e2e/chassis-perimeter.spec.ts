import {test,expect} from '@playwright/test';
// Dedicated config requires an OS-isolated fixture. This file is not a claim
// that an ordinary host browser or an unspecified production URL is isolated.
test.describe('commercial perimeter acceptance',()=>{
 test.skip(!process.env.KDD_PERIMETER_BASE_URL,'Blocked: no isolated commercial browser fixture');
 test('anonymous and forged service requests cannot operate',async({request})=>{
  expect((await request.get('/api/telemetry/api/v1/teams')).status()).toBe(401);
  expect((await request.post('/api/telemetry/api/v1/engineering/internal/control/claim')).status()).toBe(404);
  expect((await request.get('/api/telemetry/api/v1/teams',{headers:{'X-Principal-Role':'engineering_service'}})).status()).toBe(403);
 });
 test('commercial workspace never accepts a local backend',async({page})=>{
  await page.route('**/api/telemetry/api/v1/identity/mode',route=>route.fulfill({json:{mode:'local'}}));
  await page.goto('/pit-wall/app');
  await expect(page.getByRole('alert').filter({hasText:'identidad autenticada'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Reintentar comprobación de identidad'})).toBeVisible();
 });
});
