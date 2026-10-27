const {chromium}=require('/deps/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,chromiumSandbox:true});
 try {
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000/pit-wall/app',{waitUntil:'networkidle'});
  if(!(await page.locator('body').innerText()).trim())throw Error('Empty application');
  await page.reload({waitUntil:'networkidle'});
  if(errors.length)throw Error('Browser runtime errors: '+errors.join(';'));
  const denied=await page.request.get('http://127.0.0.1:3000/api/telemetry/api/v1/teams');
  if(denied.status()!==401)throw Error('Anonymous boundary failed');
  console.log(JSON.stringify({status:'passed',checks:['page renders','reload','no runtime errors','anonymous denied'],sandbox:true}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.message);process.exit(1);});
