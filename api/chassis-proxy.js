import {readFileSync} from 'node:fs';
import {createHostedTelemetry,hostedRequestUrl} from '../scripts/hosted-telemetry.mjs';

// Public destination only. Never provision a service/admin key in this function.
const origin='https://chassis-engineering-api-23afcca6-10d0-4bae-83d0-9999f4717a81.fly.dev';
const manifest=JSON.parse(readFileSync(new URL('../deploy/chassis-surface.json',import.meta.url),'utf8'));
const proxy=createHostedTelemetry(manifest,origin);
export default async function handler(req,res){
 try{req.url=hostedRequestUrl(req.url,req.query.__chassis_path);}
 catch{res.setHeader('Cache-Control','no-store');res.status(404).end();return;}
 return proxy(req,res);
}
