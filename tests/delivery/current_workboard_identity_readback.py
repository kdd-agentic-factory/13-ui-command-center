import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
report={'scope':'real_identity_workboard_fresh_process_readback','status':'blocked','immutable_image_acceptance':False,'deployment':False,'human_decisions_written':0,'gates':[]}
def gate(name,ok):
 report['gates'].append({'name':name,'passed':bool(ok)})
 if not ok:raise RuntimeError('QA gate failed')
async def main():
 fixture=json.loads(Path('/qa/live-fixture.json').read_text());gate('source_fixture_passed',fixture['status']=='passed')
 accounts=json.loads(Path('/qa-private/accounts.json').read_text());a=next(x for x in accounts['accounts'] if x['team']=='A' and x['role']=='engineer');r=next(x for x in accounts['accounts'] if x['team']=='A' and x['role']=='reader');b=next(x for x in accounts['accounts'] if x['team']=='B' and x['role']=='engineer')
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,follow_redirects=False,timeout=20) as auth:
  result=await auth.post('https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server',json={'email':a['email'],'password':a['password']});gate('real_engineer_relogin',result.status_code==200);bearer=result.json()['accessToken']
 headers={'Authorization':'Bearer '+bearer,'X-Team-ID':accounts['teams']['A'],'X-Workflow-ID':'synthetic-workboard-readback-qa','X-Trace-ID':str(uuid4())}
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180',timeout=50,headers=headers) as api:
   root='/api/v1/engineering';path=root+'/workboard/tasks/'+fixture['task_id']
   response=await api.get(path);gate('task_survives_process_restart',response.status_code==200);current=response.json();gate('task_context_preserved',current['session_id']==fixture['session_id'] and current['revision']==3)
   request={'operation_id':str(uuid4()),'expected_revision':3,'responsible_id':r['id']}
   response=await api.put(path+'/assignee',json=request);report['cross_member_assignment_http']=response.status_code
   if response.status_code==200:
    report['cross_member_assignment_supported']=True;gate('other_current_member_assignment',response.json()['responsible_id']==r['id']);revision=4
    replay=await api.put(path+'/assignee',json=request);gate('other_member_assignment_replay',replay.status_code==200 and replay.json()==response.json())
   else:
    report['cross_member_assignment_supported']=False;gate('invisible_other_member_rejected_safely',response.status_code in (401,403,422));revision=3
   denied=await api.put(path+'/assignee',json={'operation_id':str(uuid4()),'expected_revision':revision,'responsible_id':b['id']});gate('foreign_member_not_assignable',denied.status_code==422)
   response=await api.get(path+'?revision=1');gate('original_revision_intact',response.status_code==200 and response.json()['revision']==1)
   response=await api.get(root+'/sessions/'+fixture['session_id']+'/workboard');gate('recovered_board_revision',response.status_code==200 and len(response.json()['items'])==1 and response.json()['items'][0]['revision']==revision)
   report['final_revision']=revision;report['status']='passed'
try:asyncio.run(main())
except Exception:report['status']='blocked'
print(json.dumps(report))
if report['status']!='passed':raise SystemExit(1)
