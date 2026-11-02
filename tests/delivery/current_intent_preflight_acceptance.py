"""Regression against an already approved synthetic QA target; never approve."""
import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
target=json.loads(Path('/qa-output/current-proof.json').read_text());assert target['status']=='passed' and target['item_kinds']==['measurement'];PROPOSAL=target['proposal_id']
async def main():
 data=json.loads(Path('/qa-private/accounts.json').read_text());app=load_cloud_app('/run/cloud/descriptor')
 report={'scope':'current_image_denial_creates_no_intent','status':'blocked','checks':[],'deployment':False,'human_decisions_written':0}
 def gate(name,value):
  report['checks'].append({'name':name,'passed':bool(value)})
  if not value:raise ValueError('Negative boundary gate failed')
 try:
  async with app.router.lifespan_context(app):
   async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,timeout=20) as auth:
    async def headers(team,role):
     actor=next(a for a in data['accounts'] if a['team']==team and a['role']==role)
     reply=await auth.post('https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server',json={'email':actor['email'],'password':actor['password']})
     gate('actual_'+team+'_'+role+'_login',reply.status_code==200)
     return {'Authorization':'Bearer '+reply.json()['accessToken'],'X-Team-ID':data['teams'][team],'X-Actor-ID':actor['id'],'X-Workflow-ID':'synthetic-negative-approval-boundary','X-Trace-ID':str(uuid4())}
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180',timeout=40) as api:
     route='/api/v1/engineering/proposals/'+PROPOSAL
     engineer=await headers('A','engineer')
     before=await api.get(route+'/authority',headers=engineer)
     gate('existing_owned_approval_before_negative_checks',before.status_code==200 and before.json()['current'] is True and before.json()['approved_current'] is True and before.json()['approvable'] is False and bool(before.json()['decision_id']))
     from telemetry_dataset.identity.models import Principal
     principal=Principal(subject_id=next(a['id'] for a in data['accounts'] if a['team']=='A' and a['role']=='engineer'),team_id=data['teams']['A'],role='engineer')
     def durable_rows():
      with app.state.cloud_request_runtime.backend.transaction(principal) as uow:
       rows=uow.objects._db.execute("SELECT id,fingerprint FROM public.chassis_entities WHERE namespace='objects' AND kind IN ('engineering_human_intent','engineering_human_receipt') ORDER BY id").fetchall()
       return [(row['id'],row['fingerprint']) for row in rows]
     original_rows=durable_rows()
     report['durable_rows_before']=len(original_rows)
     stored=(await api.get(route,headers=engineer)).json()
     proposal=stored['proposal']
     run=(await api.get('/api/v1/engineering/runs/'+proposal['run_id'],headers=engineer)).json()
     snapshot=(await api.get('/api/v1/engineering/snapshots/'+run['snapshot_id'],headers=engineer)).json()
     decision_base={'expected_session_revision':snapshot['session_revision'],'expected_proposal_revision':proposal['revision'],'expected_designation_revision':before.json()['designation_revision'],'proposal_digest':stored['proposal_digest'],'snapshot_digest':proposal['snapshot_digest']}
     for role in ['engineer','reader']:
      scoped=engineer if role=='engineer' else await headers('A',role)
      report['human_decisions_written']=None
      reply=await api.post(route+'/decisions',headers=scoped,json={'operation_id':str(uuid4()),'body':{**decision_base,'action':'approve','note':'SYNTHETIC QA denied authorization test only; no workshop application'}})
      report['human_decisions_written']=0 if reply.status_code==403 else 1 if reply.status_code==200 else None
      report['last_http_status']=reply.status_code
      gate('A_'+role+'_valid_approval_request_denied',reply.status_code==403)
     spoofed={**engineer,'X-Actor-ID':next(a['id'] for a in data['accounts'] if a['team']=='A' and a['role']=='chief')}
     report['human_decisions_written']=None
     reply=await api.post(route+'/decisions',headers=spoofed,json={'operation_id':str(uuid4()),'body':{**decision_base,'action':'approve','note':'SYNTHETIC QA denied actor-header test only; no workshop application'}})
     report['human_decisions_written']=0 if reply.status_code==403 else 1 if reply.status_code==200 else None
     gate('spoofed_actor_header_does_not_grant_chief',reply.status_code==403)
     foreign=await headers('B','engineer')
     reply=await api.get(route,headers=foreign);gate('B_cannot_read_A_proposal',reply.status_code==404)
     reply=await api.get(route,headers={**foreign,'X-Team-ID':data['teams']['A']});gate('B_cannot_select_A_team',reply.status_code==403)
     after=await api.get(route+'/authority',headers=engineer)
     gate('existing_approval_unchanged',after.status_code==200 and after.json()==before.json())
     final_rows=durable_rows()
     report['durable_rows_after']=len(final_rows)
     gate('no_new_or_modified_durable_human_intent_or_receipt',final_rows==original_rows)
  report['status']='passed'
 except Exception as error:report['error_type']=type(error).__name__
 return report
print(json.dumps(asyncio.run(main())))
