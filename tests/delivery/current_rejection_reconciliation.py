"""Repair only two explicitly evidenced synthetic historical QA rejections."""
import asyncio,json,ssl,hashlib
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
from telemetry_dataset.persistence.decisions import CloudDecisions
from telemetry_dataset.identity.models import Principal
from telemetry_dataset.identity.credentials import HumanProof,current_human_proof
from telemetry_dataset.chassis.engineering.runs import encoded as canonical
report={'status':'blocked','scope':'two_synthetic_qa_rejection_reconciliations','deployment':False,'human_decisions_written':0,'originals_modified':False,'gates':[],'outcomes':[]}
def gate(name,value):
 report['gates'].append({'name':name,'passed':bool(value)})
 if not value:raise ValueError('Reconciliation gate failed')
async def main():
 accounts=json.loads(Path('/qa-private/accounts.json').read_text())
 expected=json.loads(Path('/qa-output/approval-expected.json').read_text())
 evidence=json.loads(Path('/qa-output/historical-rejection-evidence.json').read_text())
 gate('explicit_two_absent_receipt_candidates',evidence['status']=='passed' and len(evidence['intents'])==2 and all(i['remote_receipt_absent'] and not i['actor_designated'] and i['expected_designation_revision']==i['current_designation_revision'] for i in evidence['intents']))
 account=next(a for a in accounts['accounts'] if a['team']=='A' and a['role']=='engineer')
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,timeout=20,follow_redirects=False) as auth:
  response=await auth.post('https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server',json={'email':account['email'],'password':account['password']})
  gate('real_original_actor_login',response.status_code==200 and response.json()['user']['id']==account['id'])
  bearer=response.json()['accessToken']
 p=Principal(subject_id=account['id'],team_id=accounts['teams']['A'],role='engineer')
 audit={'X-Actor-ID':p.subject_id,'X-Workflow-ID':'qa-historical-rejection-repair','X-Trace-ID':str(uuid4())}
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  runtime=app.state.cloud_request_runtime
  service=CloudDecisions(runtime.backend,p,audit,runtime.remote_authority)
  def originals():
   with runtime.backend.transaction(p) as uow:
    rows=uow.objects._db.execute("SELECT id,payload,fingerprint FROM public.chassis_entities WHERE namespace='objects' AND kind IN ('engineering_human_intent','engineering_human_receipt','engineering_human_event_binding') ORDER BY id").fetchall()
    return rows
  before=originals()
  token=current_human_proof.set(HumanProof(p.subject_id,p.team_id,bearer))
  try:
   for entry in evidence['intents']:
    with runtime.backend.transaction(p) as uow:
     source=uow.objects.get_object('engineering_human_intent',entry['intent_id'])
     gate('explicit_original_intent_'+str(len(report['outcomes'])),source['fingerprint']==entry['intent_fingerprint'] and source['payload']['actor_id']==p.subject_id and source['payload']['proposal_id']==expected['pending_approvals']['chief']['proposal_id'])
    outcome=service.reconcile_rejected_decision(entry['intent_id'])
    report['outcomes'].append(outcome)
    gate('rejection_without_human_event_'+str(len(report['outcomes'])),outcome['outcome']=='rejected_not_designated')
    gate('same_reconciliation_idempotent_'+str(len(report['outcomes'])),service.reconcile_rejected_decision(entry['intent_id'])==outcome)
   after=originals()
   gate('all_original_intents_receipts_bindings_identical',after==before)
   report['original_rows_unchanged']=len(before)
   report['original_rows_digest']=hashlib.sha256(canonical([{**row,'id':str(row['id'])} for row in before]).encode()).hexdigest()
  finally:current_human_proof.reset(token)
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180/api/v1/engineering/',headers={'Authorization':'Bearer '+bearer,'X-Team-ID':p.team_id,**audit},timeout=40) as api:
   for role,target in expected['pending_approvals'].items():
    response=await api.get('sessions/'+target['session_id']+'/events')
    gate(role+'_public_history_read',response.status_code==200)
    history=response.json()
    gate(role+'_complete_history',history['next_cursor'] is None and history['recovery_unavailable'] is False)
    gate(role+'_rejections_separate_from_decisions',history['rejected_intents_count']==(2 if role=='chief' else 0) and len(history['items'])==1 and history['items'][0]['kind']=='decision' and history['items'][0]['action']=='approve')
    authority=await api.get('proposals/'+target['proposal_id']+'/authority')
    gate(role+'_existing_approval_unchanged',authority.status_code==200 and authority.json()['approved_current'] is True and authority.json()['decision_id']==history['items'][0]['id'])
 report['status']='passed'
try:asyncio.run(main())
except Exception as error:report['error_type']=type(error).__name__
print(json.dumps(report))
