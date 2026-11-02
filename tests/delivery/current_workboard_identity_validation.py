import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
report={'scope':'real_identity_workboard_source_qa','status':'blocked','immutable_image_acceptance':False,'deployment':False,'human_decisions_written':0,'gates':[]}
def gate(name,ok):
 report['gates'].append({'name':name,'passed':bool(ok)})
 if not ok:raise RuntimeError('QA gate failed')
async def main():
 accounts=json.loads(Path('/qa-private/accounts.json').read_text())
 descriptor=json.loads(Path('/run/cloud/descriptor').read_text())
 origin='https://czdpamk9.eu-central.insforge.app'
 gate('fixed_identity_origin',descriptor['identity_url']==origin)
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,follow_redirects=False,timeout=20) as auth:
  async def identity(team,role):
   account=next(a for a in accounts['accounts'] if a['team']==team and a['role']==role)
   response=await auth.post(origin+'/api/auth/sessions?client_type=server',json={'email':account['email'],'password':account['password']})
   gate('real_login_'+team+'_'+role,response.status_code==200)
   return {'Authorization':'Bearer '+response.json()['accessToken'],'X-Team-ID':accounts['teams'][team],'X-Workflow-ID':'synthetic-workboard-source-qa','X-Trace-ID':str(uuid4())},account
  engineer,actor=await identity('A','engineer')
  reader,_=await identity('A','reader')
  foreign,_=await identity('B','engineer')
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180',timeout=50) as api:
   root='/api/v1/engineering'
   response=await api.post(root+'/sessions',headers=engineer,json={'operation_id':str(uuid4()),'body':{'name':'SYNTHETIC QA WORKBOARD '+uuid4().hex[:8]}})
   report['last_http_status']=response.status_code;gate('create_private_qa_session',response.status_code==200)
   sid=response.json()['id'];report['session_id']=sid;board=root+'/sessions/'+sid+'/workboard'
   response=await api.get(board,headers=engineer);report['last_http_status']=response.status_code
   gate('fresh_real_membership_board_read',response.status_code==200)
   gate('board_initially_empty',response.json()['items']==[])
   operation=str(uuid4());body={'operation_id':operation,'expected_session_revision':1,'body':{'title':'SYNTHETIC QA inspect','instructions':'Software acceptance only; no mechanical action','kind':'inspection','target_profile':'engineer','acceptance':'Private storage and role checks','responsible_id':actor['id']}}
   response=await api.post(board+'/tasks',headers=engineer,json=body);report['last_http_status']=response.status_code
   gate('create_task_with_current_real_self_membership',response.status_code==200)
   task=response.json();path=root+'/workboard/tasks/'+task['id'];report['task_id']=task['id']
   response=await api.post(board+'/tasks',headers=engineer,json=body)
   gate('retry_returns_original',response.status_code==200 and response.json()==task)
   response=await api.post(path+'/transitions',headers=engineer,json={'operation_id':str(uuid4()),'expected_revision':1,'target':'pending'})
   report['last_http_status']=response.status_code;gate('move_task_with_current_membership',response.status_code==200)
   response=await api.put(path+'/assignee',headers=engineer,json={'operation_id':str(uuid4()),'expected_revision':2,'responsible_id':actor['id']})
   gate('assign_current_self_without_role_grant',response.status_code==200)
   response=await api.get(path+'?revision=1',headers=engineer)
   gate('historic_revision_read',response.status_code==200 and response.json()==task)
   response=await api.get(path,headers=reader);gate('real_reader_own_team_read',response.status_code==200)
   response=await api.post(board+'/tasks',headers=reader,json=body);gate('real_reader_write_denied',response.status_code==403)
   response=await api.get(path,headers=foreign);gate('foreign_team_task_hidden',response.status_code==404)
   response=await api.get(board,headers=foreign);gate('foreign_team_board_hidden',response.status_code==404)
   response=await api.get(board);gate('no_bearer_denied',response.status_code==401)
   gate('boundary_error_not_cached',response.headers.get('cache-control')=='no-store')
   response=await api.post(path+'/transitions',headers=engineer,json={'operation_id':str(uuid4()),'expected_revision':3,'target':'closed'})
   gate('task_cannot_grant_human_review',response.status_code==422)
   response=await api.get(board,headers=engineer)
   gate('final_durable_board',response.status_code==200 and len(response.json()['items'])==1 and response.json()['items'][0]['revision']==3)
 report['status']='passed'
try:asyncio.run(main())
except Exception:report['status']='blocked'
print(json.dumps(report))
if report['status']!='passed':raise SystemExit(1)
