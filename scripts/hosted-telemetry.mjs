import {compileSurface} from './render-chassis-surface.mjs';

const INPUT_LIMIT=1024*1024, OUTPUT_LIMIT=2*1024*1024;
const FORWARD=['authorization','x-team-id','x-workflow-id','x-trace-id','content-type','accept','idempotency-key'];
function requestBody(req,signal){
 return new Promise((resolve,reject)=>{
  const chunks=[];let length=0,settled=false;
  const finish=(error)=>{if(settled)return;settled=true;signal.removeEventListener('abort',aborted);if(error)reject(error);else resolve(Buffer.concat(chunks));};
  const aborted=()=>finish(new Error('Request timed out'));
  signal.addEventListener('abort',aborted,{once:true});
  req.on('error',error=>finish(error));req.on('aborted',aborted);
  // Vercel restores data/end listeners after pre-reading typed request bodies.
  // Its consumed IncomingMessage async iterator does not expose that restored body.
  req.on('end',()=>finish());
  req.on('data',part=>{if(settled)return;const chunk=Buffer.from(part);length+=chunk.length;if(length>INPUT_LIMIT){const error=new Error('Request too large');error.status=413;finish(error);}else chunks.push(chunk);});
 });
}
export function hostedRequestUrl(raw,path){
 if(typeof path!=='string'||!path.startsWith('api/v1/'))throw Error('Invalid captured API path');
 const query=new URL(raw,'https://same-origin.invalid').searchParams;
 query.delete('__chassis_path');
 return '/api/telemetry/'+path+(query.size?'?'+query.toString():'');
}
export function createHostedTelemetry(manifest,origin,fetcher=fetch){
 compileSurface(manifest); // Reject inventory tampering before accepting requests.
 const target=new URL(origin);
 if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||target.pathname!=='/')throw Error('Fixed HTTPS upstream required');
 const routes=manifest.routes.map(route=>({method:route.method,pattern:new RegExp('^'+route.pattern+'/?$')}));
 return async function hostedTelemetry(req,res){
  res.setHeader('Cache-Control','no-store');
  const end=(status,message)=>{res.setHeader('Content-Type','application/json');res.status(status).end(JSON.stringify({detail:message}));};
  const raw=req.url??'';
  if(!raw.startsWith('/api/telemetry/api/v1/')||/[\\\s#]/.test(raw)||/%(?:2f|5c|2e|00|25)/i.test(raw.split('?')[0])||raw.split('?')[0].split('/').some(part=>part==='.'||part==='..'))return end(404,'Not Found');
  const url=new URL(raw,'https://same-origin.invalid');
  const path=url.pathname.slice('/api/telemetry'.length);
  if(!routes.some(route=>route.method===req.method&&route.pattern.test(path)))return end(404,'Not Found');
  const headers={};
  for(const name of FORWARD){const value=req.headers[name];if(typeof value==='string')headers[name]=value;}
  const abort=new AbortController();let timer=setTimeout(()=>abort.abort(),20000);
  try{
   let body;
   if(!['GET','HEAD'].includes(req.method)){
    body=await requestBody(req,abort.signal);
   }
   // Keep uploads bounded at 20s. Only model execution may wait for the
   // server's 60s inference deadline plus transport and persistence overhead.
   if(req.method==='POST'&&path==='/api/v1/engineering/guide/executions'){
    clearTimeout(timer);timer=setTimeout(()=>abort.abort(),75000);
   }
   const upstream=await fetcher(target.origin+path+url.search,{method:req.method,headers,body,redirect:'manual',signal:abort.signal});
   if(upstream.status>=300&&upstream.status<400){await upstream.body?.cancel();return end(502,'Upstream redirect refused');}
   const chunks=[];let length=0;
   if(upstream.body){
    const reader=upstream.body.getReader();
    try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>OUTPUT_LIMIT){await reader.cancel();return end(502,'Upstream response too large');}chunks.push(Buffer.from(value));}}
    finally{reader.releaseLock();}
   }
   // Do not propagate cookies, redirects, caching, or provider-internal headers.
   const trace=upstream.headers.get('x-trace-id');
   if(trace&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(trace))res.setHeader('X-Trace-ID',trace);
   const retry=upstream.headers.get('retry-after');
   if([429,503].includes(upstream.status)&&retry&&/^(0|[1-9][0-9]{0,3})$/.test(retry)&&Number(retry)<=3600)res.setHeader('Retry-After',retry);
   res.setHeader('Content-Type',upstream.headers.get('content-type')??'application/json');
   res.status(upstream.status).end(Buffer.concat(chunks));
  }catch(error){return end(error.status===413?413:502,error.status===413?'Request too large':'Telemetry upstream unavailable');}
  finally{clearTimeout(timer);}
 };
}
