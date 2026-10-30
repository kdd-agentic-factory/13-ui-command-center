// Local-only TLS trust and sandbox acceptance. Mounts no accounts or product secrets.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const https=require('node:https');
const {execFileSync}=require('node:child_process');
const {chromium}=require('/deps/playwright');
(async()=>{
 const report={scope:'browser_local_tls_sandbox',status:'blocked',credentials_mounted:false,external_network:false};
 let browser;const servers=[];
 try{
  report.phase='certutil';
  fs.accessSync('/usr/bin/certutil',fs.constants.X_OK);
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'chassis-tls-'));process.env.HOME=home;
  const db=path.join(home,'.pki','nssdb');fs.mkdirSync(db,{recursive:true});
  execFileSync('certutil',['-N','--empty-password','-d','sql:'+db],{stdio:'ignore',timeout:10000});
  report.phase='certificates';
  for(const label of ['trusted','untrusted']){
   execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',path.join(home,label+'.key'),'-out',path.join(home,label+'.crt'),'-days','1','-subj','/CN=chassis-'+label,'-addext','subjectAltName=IP:127.0.0.1,DNS:localhost'],{stdio:'ignore',timeout:15000});
  }
  execFileSync('certutil',['-A','-d','sql:'+db,'-n','chassis-smoke-root','-t','C,,','-i',path.join(home,'trusted.crt')],{stdio:'ignore',timeout:10000});
  for(const [index,label] of ['trusted','untrusted'].entries()){
   const server=https.createServer({key:fs.readFileSync(path.join(home,label+'.key')),cert:fs.readFileSync(path.join(home,label+'.crt'))},(req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<button id="verify">Verificar</button><p id="result">Pendiente</p><script>document.querySelector("#verify").onclick=()=>document.querySelector("#result").textContent="Correcto"</script>');});
   servers.push(server);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(9443+index,'127.0.0.1',resolve);});
  }
  report.phase='sandbox';browser=await chromium.launch({headless:true,chromiumSandbox:true});
  const context=await browser.newContext({serviceWorkers:'block'});
  await context.routeWebSocket('**/*',socket=>socket.close());
  await context.route('**/*',route=>['https://127.0.0.1:9443','https://127.0.0.1:9444'].includes(new URL(route.request().url()).origin)?route.continue():route.abort());
  const page=await context.newPage();report.phase='trusted_tls';
  await page.goto('https://127.0.0.1:9443',{waitUntil:'load',timeout:15000});
  await page.locator('#verify').click();if(await page.locator('#result').textContent()!=='Correcto')throw Error('DOM check failed');
  report.trusted_tls=true;report.phase='untrusted_tls';let rejected=false;
  try{await page.goto('https://127.0.0.1:9444',{waitUntil:'load',timeout:15000});}catch(error){rejected=String(error.message).includes('ERR_CERT_AUTHORITY_INVALID');}
  if(!rejected)throw Error('Untrusted certificate was not rejected');
  report.untrusted_tls_rejected=true;report.chromium_sandbox=true;report.browser_version=browser.version();report.playwright_version=require('/deps/playwright/package.json').version;report.status='passed';report.phase='complete';
 }catch(error){report.error_type=error.name;}
 finally{if(browser)await browser.close();for(const server of servers){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}console.log(JSON.stringify(report));process.exitCode=report.status==='passed'?0:1;}
})();
