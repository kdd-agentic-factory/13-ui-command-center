"""Validate an existing synthetic run and matched baseline through authenticated public routes."""
import asyncio,json,ssl
from pathlib import Path
from uuid import uuid4
import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app
report={'status':'blocked','scope':'optimized_cycle_real_model_and_matched_inputs','candidate_acceptance':False,'agents_executed_by_this_readonly_probe':False,'human_approval':False,'deployment':False,'gates':[],'fixtures':[]}
def gate(name,ok):
 report['gates'].append({'name':name,'passed':bool(ok)})
 if not ok: raise ValueError('Acceptance gate failed')
async def main():
 accounts=json.loads(Path('/qa-private/accounts.json').read_text());a=next(a for a in accounts['accounts'] if a['team']=='A' and a['role']=='engineer')
 descriptor=json.loads(Path('/run/cloud/descriptor').read_text());origin='https://czdpamk9.eu-central.insforge.app';gate('fixed_origin',descriptor['identity_url']==origin)
 async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,follow_redirects=False,timeout=20) as auth:
  login=await auth.post(origin+'/api/auth/sessions?client_type=server',json={'email':a['email'],'password':a['password']});gate('real_engineer_login',login.status_code==200);bearer=login.json()['accessToken']
 headers={'Authorization':'Bearer '+bearer,'X-Team-ID':accounts['teams']['A'],'X-Actor-ID':a['id'],'X-Workflow-ID':'fresh-synthetic-run-acceptance','X-Trace-ID':str(uuid4())}
 app=load_cloud_app('/run/cloud/descriptor')
 async with app.router.lifespan_context(app):
  async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://127.0.0.1:8180',timeout=40,headers=headers) as api:
   async def post(path,payload,label):
    response=await api.post('/api/v1/engineering/'+path,json=payload);report['last_http_status']=response.status_code;gate(label,response.status_code==200);return response.json()
   fixture=json.loads(Path('/qa-output/fixture-result.json').read_text());gate('current_fixture_passed',fixture['status']=='passed');run_id=fixture['run_id']
   response=await api.get('/api/v1/engineering/runs/'+run_id);gate('existing_authorized_run_read',response.status_code==200)
   run=response.json();report['public_run_keys']=sorted(run);report['run_id']=run_id;report['run_status']=run.get('status');report['model_calls']=run.get('model_calls');report['task_field_names']=[sorted(t) for t in run.get('tasks',[])];report['task_states']=[{'agent':t.get('agent_id'), 'status':t.get('status'), 'cause':t.get('cause')} for t in run.get('tasks',[])]
   gate('fresh_run_has_tasks',len(run.get('tasks',[]))==9)
   roles={t.get('agent_id'):t for t in run['tasks']}
   gate('seven_specialist_and_independent_results_succeeded',all(roles[r]['status']=='succeeded' for r in ['chassis','track','weather','tires-powertrain','mechanical-check','evidence-quality','alternative-hypotheses']))
   gate('physical_neuro_not_enabled',all(roles[r]['status']=='unavailable' for r in ['physical','neuro']))
   gate('eight_real_model_calls',run['model_calls']==8)
   snapshot_reply=await api.get('/api/v1/engineering/snapshots/'+run['snapshot_id'])
   gate('frozen_snapshot_read',snapshot_reply.status_code==200)
   from telemetry_dataset.chassis.engineering.snapshots import AnalysisSnapshot
   from telemetry_dataset.chassis.engineering.technical_context import project,for_role
   from importlib.resources import files
   snapshot_value=AnalysisSnapshot.model_validate(snapshot_reply.json())
   gate('three_domain_refs_preserved',snapshot_value.selection.model_dump(mode='json')['domain_contexts']==fixture['domain_refs'])
   baseline=json.loads(Path('/qa-output/baseline-fixture.json').read_text())
   baseline_reply=await api.get('/api/v1/engineering/snapshots/'+baseline['snapshot_id'])
   gate('baseline_snapshot_read',baseline_reply.status_code==200)
   baseline_snapshot=AnalysisSnapshot.model_validate(baseline_reply.json())
   current_selection=snapshot_value.selection.model_dump(mode='json')
   previous_selection=baseline_snapshot.selection.model_dump(mode='json')
   gate('matched_recording_setup_and_analysis_selection',{k:v for k,v in current_selection.items() if k!='domain_contexts'}=={k:v for k,v in previous_selection.items() if k!='domain_contexts'})
   gate('matched_non_domain_evidence',{k:v for k,v in snapshot_value.evidence.items() if k!='domain_contexts'}=={k:v for k,v in baseline_snapshot.evidence.items() if k!='domain_contexts'})
   current_domains={row['reference']['domain']:{k:v for k,v in row.items() if k!='reference'} for row in snapshot_value.evidence['domain_contexts']}
   previous_domains={row['reference']['domain']:{k:v for k,v in row.items() if k!='reference'} for row in baseline_snapshot.evidence['domain_contexts']}
   gate('matched_domain_facts_units_uncertainties_and_point_times',current_domains==previous_domains)

   schema=json.loads(files('telemetry_dataset.chassis').joinpath('schemas/engineering-tools.json').read_text())['tools'][0]['output_schema']['properties']['technical_context']
   projected=project(snapshot_value,schema)
   gate('domain_projection_complete',projected['coverage']=='complete' and projected['schema_version'] in ('2.2.0','2.3.0'))
   expected_si={'track':('sector_length_m','100','m','1'),'weather':('air_temperature_k','293.15','K','0.5'),'tires-powertrain':('tire_pressure_pa','200000','Pa','5000')}
   for role,expected_metric in expected_si.items():
    scoped=for_role(projected,role)
    gate(role+'_sees_only_own_domain',len(scoped.get('domain_contexts',[]))==1 and scoped['domain_contexts'][0]['reference']['domain']==role and scoped['setups']==[] and scoped['recordings']==[])
    quantity=scoped['domain_contexts'][0]['quantities'][0]
    gate(role+'_si_value_unit_uncertainty_preserved',(quantity['metric'],quantity['value'],quantity['unit'],quantity['uncertainty'])==expected_metric)
   gate('chassis_does_not_receive_unrelated_domain_facts','domain_contexts' not in for_role(projected,'chassis'))
   gate('independent_reviewers_receive_all_three_domains',all(len(for_role(projected,r).get('domain_contexts',[]))==3 for r in ['mechanical-check','evidence-quality','alternative-hypotheses']))
   gate('private_source_and_attestation_text_not_projected','software-only instrument' not in json.dumps(projected) and 'no metrological certification' not in json.dumps(projected))
   report['synthetic_observations_only']=True

   synthesis=await api.get('/api/v1/engineering/runs/'+run_id+'/synthesis');gate('synthesis_progress_read',synthesis.status_code==200);data=synthesis.json();report['synthesis_field_names']=sorted(data);report['synthesis_status']=data.get('status');report['synthesis_stage']=data.get('stage');report['synthesis_cause']=data.get('cause');report['proposal_present']=bool(data.get('proposal_id'))
   stored_response=await api.get('/api/v1/engineering/proposals/'+data['proposal_id']);gate('proposal_read',stored_response.status_code==200)
   stored=stored_response.json();proposal=stored['proposal'];report['proposal_field_names']=sorted(proposal);report['publication_status']=stored.get('publication_status');report['proposal_id']=data['proposal_id']
   from telemetry_dataset.chassis.engineering.proposals import FinalProposal
   FinalProposal.model_validate(proposal);gate('proposal_schema_valid',True)
   gate('same_run_snapshot',proposal['snapshot_digest']==run['snapshot_digest'])
   from telemetry_dataset.chassis.engineering.runs import digest
   gate('proposal_digest_valid',digest(proposal)==stored['proposal_digest'])
   report['eligibility']=stored['eligibility']
   items=proposal['items'];report['item_kinds']=[item['kind'] for item in items];report['item_count']=len(items)
   report['source_status']=proposal['source_status'];report['external_validation']=proposal['external_validation']
   gate('measurement_only',set(report['item_kinds'])=={'measurement'})
   gate('external_validation_remains_false',proposal['external_validation'] is False)
   gate('no_physical_prescription',all(not item.get('parameters') and item['kind']!='setup_change' for item in items))
   gate('publication_complete',stored['publication_status']=='published')
   gate('all_six_eligibility_checks',all(stored['eligibility'][k] is True for k in ['inputs_valid','branches_sealed','independence_checked','conflicts_resolved','domain_valid','source_valid']) and not stored['eligibility']['blocked_reasons'])
   from telemetry_dataset.identity.models import Principal
   from telemetry_dataset.persistence.chief_context import CloudChiefPreparation
   from telemetry_dataset.persistence.chief_synthesis import CloudChiefSynthesis
   from telemetry_dataset.persistence.runs import RunObjects
   from telemetry_dataset.persistence.postgres.dependencies import canonical
   import hashlib
   principal=Principal(subject_id=a['id'],team_id=accounts['teams']['A'],role='engineer')
   audit={k:v for k,v in headers.items() if k.startswith('X-')}
   with app.state.cloud_request_runtime.backend.transaction(principal) as uow:
    state=uow.engineering.get(run_id)
    from uuid import UUID,uuid5
    for task in state['tasks']:
     role=task.get('agent_id') or task.get('contract',{}).get('agent_id')
     if role not in expected_si:continue
     inference=uow.objects.get_object('engineering_decision_receipt',str(uuid5(UUID(task['task_id']),'decision-receipt:v1')))['payload']['body']
     actual_metrics={row['metric'] for row in inference['evidence']}
     gate(role+'_durable_inference_evidence_scoped',actual_metrics=={expected_si[role][0]})
     gate(role+'_one_authorized_model_call',task['model_calls']==1)

    attempts=[(key,value) for key,value in state['chief_attempts'].items() if value['status']=='succeeded']
    gate('one_successful_chief_attempt',len(attempts)==1)
    operation,attempt=attempts[0]
    receipt=uow.objects.find_operation('engineering_chief_attempt',operation)['payload']
    frozen=CloudChiefPreparation(app.state.cloud_request_runtime.backend,principal,audit,read_only=True)._prepare(uow,state,run['snapshot_digest'])
    snapshot=RunObjects._snapshot(uow,state,principal)
    gate('original_source_status_preserved',proposal['source_status']==[r.get('validation_status') or 'unknown' for r in snapshot.evidence.get('recordings',[])])
    selected=CloudChiefSynthesis._selection_context(frozen,state,snapshot)
    gate('policy_receipt_version',receipt['schema_version']=='1.1.0' and receipt['selection']['policy_version']=='1.0.0')
    gate('policy_receipt_matches',receipt['selection']==attempt['selection'] and receipt['selection']['candidate_digest']==hashlib.sha256(canonical(selected['candidates']).encode()).hexdigest())
    report['selection_receipt']={'schema_version':receipt['schema_version'],**receipt['selection'],'eligible_count':len(selected['candidates']),'eligible_kinds':[c['kind'] for c in selected['candidates']]}
   validity_response=await api.get('/api/v1/engineering/proposals/'+data['proposal_id']+'/authority');gate('authority_read',validity_response.status_code==200)
   validity=validity_response.json();report['authority_field_names']=sorted(validity);report['approvable']=validity.get('approvable');report['authority_blockers']=validity.get('reasons')
   report['designated_authority']={}
   async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,follow_redirects=False,timeout=20) as auth:
    for role in ['chief','substitute']:
     actor=next(x for x in accounts['accounts'] if x['team']=='A' and x['role']==role)
     login=await auth.post(origin+'/api/auth/sessions?client_type=server',json={'email':actor['email'],'password':actor['password']});gate('real_'+role+'_login',login.status_code==200)
     role_headers={**headers,'Authorization':'Bearer '+login.json()['accessToken'],'X-Actor-ID':actor['id']}
     reply=await api.get('/api/v1/engineering/proposals/'+data['proposal_id']+'/authority',headers=role_headers);gate(role+'_authority_read',reply.status_code==200)
     body=reply.json();report['designated_authority'][role]={k:body.get(k) for k in ['approvable','rejectable','revision_requestable','authority_available','current','reasons']}
     gate(role+'_approvable_for_measurement_only',body.get('approvable') is True and body.get('current') is True and body.get('approved_current') is False)
     gate(role+'_designation_matches',body.get('primary_id')==next(x['id'] for x in accounts['accounts'] if x['team']=='A' and x['role']=='chief') and body.get('substitute_id')==next(x['id'] for x in accounts['accounts'] if x['team']=='A' and x['role']=='substitute'))

   # Exercise the new domain/snapshot surfaces under real foreign/reader identities.
   first_ref=fixture['domain_refs'][0]
   packet_path='/api/v1/chassis/domain-evidence/packets/'+first_ref['id']
   params={k:first_ref[k] for k in ('domain','revision','digest')}
   own_packet=await api.get(packet_path,params=params,headers=headers)
   gate('own_private_domain_packet_read',own_packet.status_code==200)
   async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'),trust_env=False,timeout=20,follow_redirects=False) as auth:
    for team,role in [('B','engineer'),('A','reader')]:
     actor=next(x for x in accounts['accounts'] if x['team']==team and x['role']==role)
     login=await auth.post(origin+'/api/auth/sessions?client_type=server',json={'email':actor['email'],'password':actor['password']})
     gate(team+'_'+role+'_actual_login',login.status_code==200)
     scoped={**headers,'Authorization':'Bearer '+login.json()['accessToken'],'X-Team-ID':accounts['teams'][team],'X-Actor-ID':actor['id']}
     if team=='B':
      reply=await api.get(packet_path,params=params,headers=scoped);gate('foreign_domain_packet_hidden',reply.status_code==404)
      reply=await api.get('/api/v1/engineering/snapshots/'+run['snapshot_id'],headers=scoped);gate('foreign_snapshot_hidden',reply.status_code==404)
     else:
      reply=await api.get(packet_path,params=params,headers=scoped);gate('reader_can_read_own_domain_packet',reply.status_code==200)
      reply=await api.post('/api/v1/chassis/domain-evidence/packets',headers=scoped,json={'operation_id':str(uuid4()),'body':own_packet.json()['input']})
      gate('reader_cannot_publish_valid_domain_packet',reply.status_code==403)
 report['status']='passed'
try: asyncio.run(main())
except Exception as error: report['error_type']=type(error).__name__
print(json.dumps(report))
