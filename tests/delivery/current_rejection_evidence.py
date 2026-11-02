"""Read authoritative absence for explicit synthetic historical QA intents."""
import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
from telemetry_dataset.persistence.decisions import CloudDecisions
from telemetry_dataset.identity.models import Principal
from telemetry_dataset.identity.credentials import HumanProof,current_human_proof
report={'status':'blocked','scope':'historical_qa_rejection_evidence','business_writes':False,'deployment':False,'intents':[]}
async def main():
 accounts=json.loads(Path('/qa-private/accounts.json').read_text())
 expected=json.loads(Path('/qa-output/approval-expected.json').read_text())
 account=next(a for a in accounts['accounts'] if a['team']=='A' and a['role']=='engineer')
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,timeout=20,follow_redirects=False) as auth:
  response=await auth.post('https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server',json={'email':account['email'],'password':account['password']})
  assert response.status_code==200
  bearer=response.json()['accessToken']
 p=Principal(subject_id=account['id'],team_id=accounts['teams']['A'],role='engineer')
 audit={'X-Actor-ID':p.subject_id,'X-Workflow-ID':'qa-rejected-intent-evidence','X-Trace-ID':str(uuid4())}
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  runtime=app.state.cloud_request_runtime
  service=CloudDecisions(runtime.backend,p,audit,runtime.remote_authority)
  token=current_human_proof.set(HumanProof(p.subject_id,p.team_id,bearer))
  try:
   target=expected['pending_approvals']['chief']
   with runtime.backend.transaction(p) as uow:
    rows=uow.objects._db.execute("SELECT payload,fingerprint FROM public.chassis_entities WHERE namespace='objects' AND kind='engineering_human_intent' AND payload->>'actor_id'=%s AND payload->>'session_id'=%s ORDER BY id",(p.subject_id,target['session_id'])).fetchall()
   assert len(rows)==2
   for source in rows:
    row=source['payload']
    assert row['proposal_id']==target['proposal_id']
    request=json.loads(row['request'])
    receipt=service._remote('get_operation_receipt',p.team_id,p.subject_id,row['operation_id'],request)
    current=service.current_validity(row['proposal_id'],p,row['proposal_revision'])
    report['intents'].append({'intent_id':row['intent_id'],'intent_fingerprint':source['fingerprint'],'remote_receipt_absent':receipt is None,'current_context':current.current,'authority_available':current.authority_available,'expected_designation_revision':request['expected_designation_revision'],'current_designation_revision':current.designation_revision,'actor_designated':p.subject_id in (current.primary_id,current.substitute_id),'kind':request['kind']})
   assert all(i['remote_receipt_absent'] and i['current_context'] and i['authority_available'] and i['expected_designation_revision']==i['current_designation_revision'] and not i['actor_designated'] and i['kind']=='decision' for i in report['intents'])
   report['status']='passed'
  finally:current_human_proof.reset(token)
try:asyncio.run(main())
except Exception as error:report['error_type']=type(error).__name__
print(json.dumps(report))
