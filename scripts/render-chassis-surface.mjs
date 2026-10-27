import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
export function compileSurface(doc){
 if(!doc||doc.version!=='1.0'||!Array.isArray(doc.routes)||doc.routes.length<1||doc.routes.length>512)throw Error('Invalid perimeter manifest');
 const digest=createHash('sha256').update(canonical({version:doc.version,routes:doc.routes})).digest('hex');
 if(digest!==doc.sha256)throw Error('Perimeter manifest digest mismatch');
 const chars=new Set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_()-[]{}|+.'),seen=new Set();
 const lines=doc.routes.map(r=>{
  if(!['GET','POST','PUT','DELETE','PATCH'].includes(r.method)||!['public','identity','team'].includes(r.access)||typeof r.pattern!=='string'||!r.pattern.startsWith('/api/v1/')||r.pattern.includes('internal')||[...r.pattern].some(c=>!chars.has(c)))throw Error('Unsupported perimeter route');
  new RegExp('^'+r.pattern+'$');const key=r.method+':'+r.pattern;if(seen.has(key))throw Error('Duplicate perimeter route');seen.add(key);
  return '    '+JSON.stringify('~^'+r.method+':/api/telemetry'+r.pattern+'/?$')+' '+r.access+';';
 });
 return '# Generated from chassis-surface.json; do not hand edit.\n# Inventory SHA256 '+digest+'\nmap "$request_method:$uri" $chassis_access {\n    default denied;\n'+lines.join('\n')+'\n}\n';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const doc=JSON.parse(readFileSync(new URL('../deploy/chassis-surface.json',import.meta.url),'utf8'));const text=compileSurface(doc);const output=new URL('../deploy/chassis-surface.map.conf',import.meta.url);
 if(process.argv.includes('--check')){if(readFileSync(output,'utf8')!==text)throw Error('Generated perimeter drift');}else writeFileSync(output,text);
}
