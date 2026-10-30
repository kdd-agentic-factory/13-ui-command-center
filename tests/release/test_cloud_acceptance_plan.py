import importlib.util
from pathlib import Path
import sys
import pytest
from test_real_acceptance_plan import config


def module():
    path=Path('tests/delivery')
    sys.path.insert(0,str(path.resolve()))
    spec=importlib.util.spec_from_file_location('cloud_plan',path/'prepare_cloud_acceptance.py')
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result)
    return result


def cloud_config(tmp_path):
    base=config(tmp_path)
    base['model']={'name':'qwen3:1.7b','digest':'8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7','url':'http://127.0.0.1:11434'}
    private=Path(base['private_root'])
    files={}
    for name in ('descriptor','database_dsn','identity_anon_key','authority_key','service_key','storage_key','worker_bindings','signing_key','control_key','identity_ca'):
        path=private/('cloud-'+name);path.write_text('PRIVATE_SENTINEL');path.chmod(0o600);files[name]=str(path)
    model=tmp_path/'model';model.mkdir()
    return {'version':'1','base':base,'profile':'insforge-postgres-storage','cloud_files':files,'model_root':str(model)}


def test_cloud_preparation_is_metadata_only_and_never_acceptance(tmp_path,monkeypatch):
    m=module();cfg=cloud_config(tmp_path)
    def forbidden(*a,**kw):raise AssertionError('No reads or execution')
    import subprocess
    monkeypatch.setattr(Path,'open',forbidden)
    monkeypatch.setattr(subprocess,'run',forbidden)
    plan=m.prepare_cloud(cfg)
    assert plan['persistence_profile']=='insforge-postgres-storage'
    assert plan['status']=='prepared_not_executed'
    assert plan['candidate_acceptance'] is False and plan['publishable'] is False
    assert set(plan['gates'].values())=={'blocked'}
    assert 'PRIVATE_SENTINEL' not in str(plan)
    assert plan['model_root_ref']=='explicit_native_candidate_cache'
    mounts=plan['cloud_credential_mounts']
    assert all(x['read_only'] and x['role']=='api' for x in mounts)
    assert {x['name'] for x in mounts}==set(cfg['cloud_files'])
    assert all(x['target']=='/run/cloud/'+x['name'] for x in mounts)
    assert plan['bootstrap']['environment']=={'CHASSIS_CLOUD_CONFIG_FILE':'/run/cloud/descriptor'}
    assert 'telemetry_dataset.persistence.bootstrap:application_factory' in plan['bootstrap']['command']


@pytest.mark.parametrize('kind',['profile','missing','extra','duplicate','outside','missing_model','unknown','legacy_model'])
def test_cloud_plan_rejects_ambiguous_inputs(tmp_path,kind):
    cfg=cloud_config(tmp_path);m=module()
    if kind=='profile':cfg['profile']='local'
    elif kind=='missing':del cfg['cloud_files']['database_dsn']
    elif kind=='extra':cfg['cloud_files']['admin_dsn']=cfg['cloud_files']['database_dsn']
    elif kind=='duplicate':cfg['cloud_files']['database_dsn']=cfg['cloud_files']['service_key']
    elif kind=='outside':cfg['cloud_files']['database_dsn']=cfg['base']['files']['accounts']
    elif kind=='missing_model':cfg['model_root']=str(tmp_path/'missing-model')
    elif kind=='unknown':cfg['execution_authorized']=True
    elif kind=='legacy_model':cfg['base']['model']['name']='qwen3:0.6b'
    with pytest.raises((ValueError, OSError)):m.prepare_cloud(cfg)

def runtime_objects(cfg):
    from uuid import uuid4
    refs={name+'_file':'/run/cloud/'+name for name in ('database_dsn','identity_anon_key','authority_key','service_key','storage_key','worker_bindings')}
    descriptor={'schema_version':'1.0.0','identity_url':cfg['base']['identity_url'],**refs,'identity_ca_file':'/run/cloud/identity_ca','storage_region':'eu-central-1','cors_origins':['http://127.0.0.1:3000']}
    team=cfg['base']['teams'][0];actor=team['members']['engineer']
    bindings={'schema_version':'1.0.0','model':{'name':'qwen3:1.7b','timeout_seconds':60},'runs':[{'worker_id':'acceptance-worker','run_id':str(uuid4()),'principal':{'team_id':team['team_id'],'subject_id':actor,'role':'engineer'},'audit':{'X-Actor-ID':actor,'X-Workflow-ID':'acceptance','X-Trace-ID':'acceptance'},'signing_key_file':'/run/cloud/signing_key','control_key_file':'/run/cloud/control_key'}]}
    return descriptor,bindings


def test_validate_cloud_runtime_references_without_connections(tmp_path):
    m=module();cfg=cloud_config(tmp_path);descriptor,bindings=runtime_objects(cfg)
    result=m.validate_runtime_objects(cfg,descriptor,bindings)
    assert result=={'scope':'configuration_objects_only','descriptor_references':'verified','worker_count':1,'live_identity_verified':False,'database_verified':False,'candidate_acceptance':False}


@pytest.mark.parametrize('kind',['path','origin','extra','cors','region','worker_path','model','timeout','foreign','reader','audit','duplicate','nan'])
def test_runtime_objects_fail_closed(tmp_path,kind):
    m=module();cfg=cloud_config(tmp_path);d,b=runtime_objects(cfg);entry=b['runs'][0]
    if kind=='path':d['database_dsn_file']='/run/cloud/../admin'
    elif kind=='origin':d['identity_url']='https://other.invalid'
    elif kind=='extra':d['admin_dsn']='secret'
    elif kind=='cors':d['cors_origins']=['*']
    elif kind=='region':d['storage_region']='arbitrary'
    elif kind=='worker_path':entry['control_key_file']='/run/secrets/authority_key'
    elif kind=='model':b['model']['name']='qwen3:0.6b'
    elif kind=='timeout':b['model']['timeout_seconds']=61
    elif kind=='nan':b['model']['timeout_seconds']=float('nan')
    elif kind=='foreign':entry['principal']['team_id']=cfg['base']['teams'][1]['team_id']
    elif kind=='reader':entry['principal']['subject_id']=cfg['base']['teams'][0]['members']['reader']
    elif kind=='audit':entry['audit']['X-Actor-ID']='someone'
    elif kind=='duplicate':b['runs'].append(entry.copy())
    with pytest.raises(ValueError):m.validate_runtime_objects(cfg,d,b)

def write_runtime_files(cfg):
    import json
    descriptor,bindings=runtime_objects(cfg)
    for name,obj in [('descriptor',descriptor),('worker_bindings',bindings)]:
        Path(cfg['cloud_files'][name]).write_text(json.dumps(obj),encoding='utf-8')


def test_runtime_file_gate_reads_only_configuration_not_secrets(tmp_path,monkeypatch):
    import os
    m=module();cfg=cloud_config(tmp_path);write_runtime_files(cfg)
    original=os.open;opened=[]
    def checked(path,*args,**kwargs):
        assert str(path) in {cfg['cloud_files']['descriptor'],cfg['cloud_files']['worker_bindings']}
        opened.append(str(path));return original(path,*args,**kwargs)
    monkeypatch.setattr(os,'open',checked)
    result=m.verify_runtime_files(cfg)
    assert len(opened)==2 and result['scope']=='configuration_files_only'
    assert result['candidate_acceptance'] is False and result['worker_count']==1
    assert 'PRIVATE_SENTINEL' not in str(result)


@pytest.mark.parametrize('kind',['duplicate','nested_duplicate','oversize','encoding','constant','syntax','changed'])
def test_runtime_file_gate_rejects_unsafe_json_and_mutation(tmp_path,monkeypatch,kind):
    m=module();cfg=cloud_config(tmp_path);write_runtime_files(cfg)
    path=Path(cfg['cloud_files']['descriptor'])
    if kind=='duplicate':path.write_text('{"schema_version":"1.0.0","schema_version":"SENSITIVE_SENTINEL"}')
    elif kind=='nested_duplicate':Path(cfg['cloud_files']['worker_bindings']).write_text('{"model":{"name":"a","name":"SENSITIVE_SENTINEL"}}')
    elif kind=='oversize':path.write_bytes(b' '*65537)
    elif kind=='encoding':path.write_bytes(b'\xffSENSITIVE_SENTINEL')
    elif kind=='constant':path.write_text('{"x":NaN}')
    elif kind=='syntax':path.write_text('SENSITIVE_SENTINEL')
    else:
        original=m.validate_runtime_objects
        def mutate(*args):
            result=original(*args);path.write_text('{}');return result
        monkeypatch.setattr(m,'validate_runtime_objects',mutate)
    with pytest.raises(ValueError) as error:m.verify_runtime_files(cfg)
    assert str(error.value)=='Cloud runtime configuration rejected'
    assert error.value.__suppress_context__
