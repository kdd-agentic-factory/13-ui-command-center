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
