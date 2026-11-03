import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
report={'scope':'immutable_api_real_membership_rpc_and_recovery','status':'blocked','deployment':False,'immutable_image_acceptance':True,'human_decisions_written':0,'task_writes':0,'gates':[]}
def gate(name,ok):
 report['gates'].append({'name':name,'passed':bool(ok)})
 if not ok:raise RuntimeError('Read-only QA gate failed')
async def main():
 import telemetry_dataset,hashlib
 root=Path(telemetry_dataset.__file__).parent
 gate('installed_application_package',str(root).startswith('/opt/python/'))
 expected={'identity/insforge.py': '59c670192ee613522059f4c8fe0ada1844a3757ea6c5836489a60847ccb27a25', 'persistence/workboard_http.py': '4bb7acf40c874723c8d380df5161bdef378e29660a38ac34286fd1b91b669d2e', 'persistence/workboard.py': '787f4149e283ac2bfd0bef3a29d71b62b6142809f50773f1bbffb114a2c57479', 'persistence/postgres/workboard.py': 'e4a4d7fb40f9146325e463510b1060102af95d343617490f5b9a6d84dbdf93f3'}
 gate('installed_application_hashes',all(hashlib.sha256((root/name).read_bytes()).hexdigest()==value for name,value in expected.items()))
 report['application_source_overlay']=False
 accounts=json.loads(Path('/qa-private/accounts.json').read_text());fixture=json.loads(Path('/qa/live-fixture.json').read_text())
 origin='https://czdpamk9.eu-central.insforge.app';descriptor=json.loads(Path('/run/cloud/descriptor').read_text());gate('fixed_project_origin',descriptor['identity_url']==origin)
 anon=Path('/run/cloud/identity_anon_key').read_text().strip()
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,follow_redirects=False,timeout=20) as remote:
  async def login(team,role):
   account=next(a for a in accounts['accounts'] if a['team']==team and a['role']==role)
   response=await remote.post(origin+'/api/auth/sessions?client_type=server',json={'email':account['email'],'password':account['password']});gate('login_'+team+'_'+role,response.status_code==200)
   return account,{'Authorization':'Bearer '+response.json()['accessToken'],'apikey':anon}
  engineer,eh=await login('A','engineer');reader,rh=await login('A','reader');foreign,bh=await login('B','engineer')
  endpoint=origin+'/api/database/rpc/chassis_get_workboard_member';ta=accounts['teams']['A'];tb=accounts['teams']['B']
  response=await remote.post(endpoint,headers=eh,json={'p_team':ta,'p_user':reader['id']});gate('engineer_exact_other_active_member',response.status_code==200 and response.json()['user_id']==reader['id'])
  response=await remote.post(endpoint,headers=rh,json={'p_team':ta,'p_user':engineer['id']});report['reader_rpc_http']=response.status_code;gate('reader_cannot_query_other_members',response.status_code==403)
  response=await remote.post(endpoint,headers={'apikey':anon},json={'p_team':ta,'p_user':reader['id']});gate('anonymous_rpc_denied',response.status_code in (401,403))
  response=await remote.post(endpoint,headers=eh,json={'p_team':tb,'p_user':foreign['id']});gate('actor_cannot_query_foreign_team',response.status_code==403)
  for label,target in [('foreign_target',foreign['id']),('unknown_target',str(uuid4()))]:
   response=await remote.post(endpoint,headers=eh,json={'p_team':ta,'p_user':target});gate(label+'_not_a_member',response.status_code==200 and response.json() is None)
  response=await remote.get(origin+'/api/database/records/chassis_team_memberships',headers=eh,params={'select':'team_id,user_id,role,active','team_id':'eq.'+ta,'user_id':'eq.'+reader['id'],'limit':'2'});gate('direct_membership_rls_still_own_only',response.status_code==200 and response.json()==[])
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180',timeout=50) as api:
   path='/api/v1/engineering/workboard/tasks/'+fixture['task_id'];board='/api/v1/engineering/sessions/'+fixture['session_id']+'/workboard'
   def headers(h,team):return {'Authorization':h['Authorization'],'X-Team-ID':team,'X-Workflow-ID':'workboard-readonly-final-qa','X-Trace-ID':str(uuid4())}
   response=await api.get(path,headers=headers(eh,ta));gate('new_process_recovers_assignee_revision',response.status_code==200 and response.json()['revision']==4 and response.json()['responsible_id']==reader['id'])
   response=await api.get(path,headers=headers(rh,ta));gate('assignee_reader_can_read_own_task',response.status_code==200)
   response=await api.post(path+'/transitions',headers=headers(rh,ta),json={'operation_id':str(uuid4()),'expected_revision':4,'target':'in_progress'});gate('assignment_does_not_grant_write_permission',response.status_code==403)
   response=await api.get(path,headers=headers(bh,tb));gate('foreign_team_task_hidden_after_assignment',response.status_code==404)
   response=await api.get(board,headers=headers(eh,ta));gate('board_still_single_revision_four_task',response.status_code==200 and len(response.json()['items'])==1 and response.json()['items'][0]['revision']==4)
 report['status']='passed'
try:asyncio.run(main())
except Exception:report['status']='blocked'
print(json.dumps(report))
if report['status']!='passed':raise SystemExit(1)
