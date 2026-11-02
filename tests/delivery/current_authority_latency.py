"""Read-only current-candidate timing; never logs SQL, parameters or credentials."""
import asyncio,json,ssl,time
from pathlib import Path
from uuid import uuid4
import httpx
import psycopg
from telemetry_dataset.persistence.bootstrap import load_cloud_app
from telemetry_dataset.persistence.postgres.repositories import ObjectRepository
object_reads=[]
batch_reads=[]
report={'status':'blocked','scope':'synthetic_qa_readonly_database_phase_profile','business_writes':False,'model_calls':0,'deployment':False,'operations':[]}
samples=[]
class ObservedConnection:
 def __init__(self,connection,sample):self.connection=connection;self.sample=sample
 def __getattr__(self,name):return getattr(self.connection,name)
 def __enter__(self):self.connection.__enter__();return self
 def __exit__(self,*args):
  start=time.monotonic()
  try:return self.connection.__exit__(*args)
  finally:self.sample['exit_s']=time.monotonic()-start
 def execute(self,query,params=None,*args,**kwargs):
  text=str(query).strip()
  if not text.upper().startswith('SELECT '):raise ValueError('Read-only SQL profiler rejects mutation')
  category='context' if 'set_config' in text else 'role_check' if ('pg_roles' in text or 'has_schema_privilege' in text) else 'business'
  start=time.monotonic()
  try:return self.connection.execute(query,params,*args,**kwargs)
  finally:self.sample['queries'].append({'category':category,'seconds':time.monotonic()-start})
async def main():
 accounts=json.loads(Path('/qa-private/accounts.json').read_text());actor=next(a for a in accounts['accounts'] if a['team']=='A' and a['role']=='engineer')
 fixture=json.loads(Path('/qa-output/fixture-result.json').read_text());proof=json.loads(Path('/qa-output/current-proof.json').read_text())
 assert fixture['status']==proof['status']=='passed' and fixture['synthetic_observations_only']
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,timeout=20,follow_redirects=False) as auth:
  response=await auth.post('https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server',json={'email':actor['email'],'password':actor['password']})
  assert response.status_code==200 and response.json()['user']['id']==actor['id']
  headers={'Authorization':'Bearer '+response.json()['accessToken'],'X-Team-ID':accounts['teams']['A'],'X-Actor-ID':actor['id'],'X-Workflow-ID':'qa-latency-readonly','X-Trace-ID':str(uuid4())}
 app=load_cloud_app('/run/cloud/descriptor')
 original=psycopg.connect
 def observed(*args,**kwargs):
  sample={'queries':[]};samples.append(sample);start=time.monotonic()
  try:connection=original(*args,**kwargs)
  finally:sample['connect_s']=time.monotonic()-start
  return ObservedConnection(connection,sample)
 async with app.router.lifespan_context(app):
  original_get=ObjectRepository.get_object
  original_many=getattr(ObjectRepository,'get_objects',None)
  def observed_get(self,kind,identifier):
   start=time.monotonic()
   try:return original_get(self,kind,identifier)
   finally:object_reads.append({'namespace':self._namespace,'kind':kind,'key':str(identifier),'seconds':time.monotonic()-start})
  def observed_many(self,references):
   result=original_many(self,references)
   batch_reads.append({'namespace':self._namespace,'requested':len(references),'returned':len(result),'kinds':{kind:sum(1 for k,key in references if k==kind) for kind in sorted({kind for kind,key in references})}})
   return result
  if original_many is not None:ObjectRepository.get_objects=observed_many
  psycopg.connect=observed
  ObjectRepository.get_object=observed_get
  try:
   async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180/api/v1/engineering/',headers=headers,timeout=40) as api:
    for iteration in range(2):
     for name,path in [('authority','proposals/'+proof['proposal_id']+'/authority')]:
      before=len(samples);before_objects=len(object_reads);before_batches=len(batch_reads);start=time.monotonic();response=await api.get(path)
      rows=samples[before:]
      metrics={'name':name,'iteration':iteration,'status':response.status_code,'total_s':round(time.monotonic()-start,4),'connections':len(rows),'connect_s':round(sum(r['connect_s'] for r in rows),4),'exit_s':round(sum(r.get('exit_s',0) for r in rows),4)}
      for category in ['role_check','context','business']:
       q=[q for r in rows for q in r['queries'] if q['category']==category]
       metrics[category+'_queries']=len(q);metrics[category+'_s']=round(sum(q['seconds'] for q in q),4)
      selected=object_reads[before_objects:]
      metrics['object_reads']=[{'namespace':namespace,'kind':kind,'calls':len([row for row in selected if row['namespace']==namespace and row['kind']==kind]),'unique_refs':len({row['key'] for row in selected if row['namespace']==namespace and row['kind']==kind})} for namespace,kind in sorted({(row['namespace'],row['kind']) for row in selected})]
      metrics['batches']=batch_reads[before_batches:]
      report['operations'].append(metrics)
      assert response.status_code==200
   report['status']='passed'
  finally:
   psycopg.connect=original
   ObjectRepository.get_object=original_get
   if original_many is not None:ObjectRepository.get_objects=original_many
try:asyncio.run(main())
except Exception as error:report['error_type']=type(error).__name__
print(json.dumps(report))
