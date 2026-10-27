import {test,expect} from '@playwright/test';
test('four existing scenes render with registered materials and dispose their engines',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/pit-wall/tests/e2e/fixtures/babylon-smoke.html');
 await expect(page.locator('canvas')).toHaveCount(4);
 await page.waitForFunction(()=>{const result=(window as any).__babylonQA?.();return result?.length===4&&result.every((scenes:any[])=>scenes.some(s=>s.meshes>0&&s.ready));},{},{timeout:30000});
 await page.screenshot({path:'.superpowers/sdd/2026-10-26-responsive-header/four-scenes.png',fullPage:true});
 expect(errors).toEqual([]);
 await page.evaluate(()=>(window as any).__disposeBabylonQA());
 expect(await page.evaluate(()=>(window as any).__babylonQA())).toEqual([]);
});
test('WebGL unavailable keeps the page alive and all components mount',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:any[]){if(type.includes('webgl')||type==='experimental-webgl')return null;return (get as any).call(this,type,...args);} as any;});
 await page.goto('/pit-wall/tests/e2e/fixtures/babylon-smoke.html');
 await expect(page.getByRole('heading',{name:'Controles sintéticos del renderizador'})).toBeVisible();
 await expect(page.locator('canvas')).toHaveCount(4);expect(errors).toEqual([]);
 await page.evaluate(()=>(window as any).__disposeBabylonQA());
 expect(await page.evaluate(()=>(window as any).__babylonQA())).toEqual([]);
});
