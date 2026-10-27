import {test,expect} from '@playwright/test';
for(const width of [320,390,768,1024,1366])test(`header keeps circuit and acquisition state readable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/pit-wall/app');
 const header=page.locator('.app-header');await expect(header).toBeVisible({timeout:60000});
 const circuit=header.locator('.header-gp-name'),status=header.locator('.header-stats');
 await expect(status).toContainText('SIN DATOS');
 const bounds=await header.evaluate(el=>{
  const rect=(selector:string)=>{const r=el.querySelector(selector)!.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};};
  const name=rect('.header-gp-name'),state=rect('.header-stats'),box=el.getBoundingClientRect();
  return {overlap:name.left<state.right&&name.right>state.left&&name.top<state.bottom&&name.bottom>state.top,overflow:el.scrollWidth>el.clientWidth+1,outside:name.right>box.right+1||state.right>box.right+1,clipped:state.bottom>box.bottom+1};
 });
 expect(bounds).toEqual({overlap:false,overflow:false,outside:false,clipped:false});
 await expect(circuit).toBeVisible();
 if(width<=768){const menu=header.getByRole('button',{name:'Open navigation menu'});await expect(menu).toBeVisible();await menu.click();await expect(page.locator('#sidebar-nav')).toBeVisible();await page.keyboard.press('Escape');await expect(menu).toBeFocused();}
 if(width===390||width===1366)await header.screenshot({path:`.superpowers/sdd/2026-10-26-responsive-header/header-${width}.png`});
});
