
import copy
import importlib.util
from pathlib import Path
from uuid import uuid4
import pytest

def module():
    spec=importlib.util.spec_from_file_location('real_plan',Path('tests/delivery/prepare_real_acceptance.py'))
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    return mod

def config(tmp_path):
    root=tmp_path/'private';root.mkdir(mode=0o700)
    names=('accounts','api_cert','api_key','api_ca','identity_ca','probe_key','backend_key','gateway_key','signing_key','control_key','authority_key')
    files={}
    for name in names:
        path=root/name;path.write_text('SENSITIVE_SENTINEL');path.chmod(0o600)
        files[name]=str(path)
    return {'version':'1','project_id':'23afcca6-10d0-4bae-83d0-9999f4717a81',
        'identity_url':'https://czdpamk9.eu-central.insforge.app','private_root':str(root),'files':files,
        'model':{'name':'qwen3:0.6b','digest':'7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435','url':'http://host.docker.internal:11434'},
        'images':{role:'sha256:'+'a'*64 for role in ('api','gateway','worker','frontend','qa')},
        'teams':[{'team_id':str(uuid4()),'members':{role:str(uuid4()) for role in ('chief','substitute','engineer','reader')}} for _ in range(2)]}

def test_preparation_never_reads_copies_or_executes_secrets(tmp_path,monkeypatch):
    m=module();cfg=config(tmp_path)
    def forbidden(*args,**kwargs):raise AssertionError('secret content must not be read')
    import subprocess
    import shutil
    monkeypatch.setattr(Path,'read_bytes',forbidden);monkeypatch.setattr(Path,'read_text',forbidden)
    monkeypatch.setattr(Path,'open',forbidden)
    monkeypatch.setattr(subprocess,'run',forbidden);monkeypatch.setattr(subprocess,'Popen',forbidden)
    monkeypatch.setattr(shutil,'copyfile',forbidden)
    plan=m.prepare(cfg)
    assert plan['status']=='prepared_not_executed' and plan['publishable'] is False
    assert plan['acceptance_status']=='blocked' and plan['execution_authorized'] is False
    assert 'SENSITIVE_SENTINEL' not in str(plan)
    assert set(plan['services'])=={'api','gateway','worker','frontend','qa'}
    for service in plan['services'].values():
        assert service['read_only'] is True
        assert service['cap_drop']==['ALL'] and 'ports' not in service
        assert all(v['read_only'] for v in service.get('credential_mounts',[]))
    assert {v['name'] for v in plan['services']['qa']['credential_mounts']}=={'accounts','api_ca'}
    assert 'authority_key' not in str(plan['services']['qa'])
    assert all(not s.get('state_access') for role,s in plan['services'].items() if role!='api')

@pytest.mark.parametrize('kind',['unknown_file','missing_file','unknown_option','wrong_project','wrong_origin','remote_model','tag_image','same_humans','extra_team','duplicate_source'])
def test_preparation_fails_closed_for_ambiguous_scope(tmp_path,kind):
    m=module();cfg=config(tmp_path)
    if kind=='unknown_file':cfg['files']['unrelated_key']=cfg['files']['accounts']
    elif kind=='missing_file':del cfg['files']['authority_key']
    elif kind=='unknown_option':cfg['copy_secrets']=True
    elif kind=='wrong_project':cfg['project_id']=str(uuid4())
    elif kind=='wrong_origin':cfg['identity_url']='https://other.invalid'
    elif kind=='remote_model':cfg['model']['url']='https://external.invalid'
    elif kind=='tag_image':cfg['images']['api']='latest'
    elif kind=='same_humans':cfg['teams'][0]['members']['substitute']=cfg['teams'][0]['members']['chief']
    elif kind=='extra_team':cfg['teams'].append(copy.deepcopy(cfg['teams'][0]))
    elif kind=='duplicate_source':cfg['files']['authority_key']=cfg['files']['accounts']
    with pytest.raises(ValueError):m.prepare(cfg)

def test_rejects_credentials_with_symlink_or_git_ancestor(tmp_path):
    m=module();cfg=config(tmp_path)
    (Path(cfg['private_root'])/'.git').mkdir()
    with pytest.raises(ValueError):m.prepare(cfg)

def test_pending_gates_cannot_be_relabelled_by_config(tmp_path):
    m=module();cfg=config(tmp_path);cfg['acceptance_status']='passed'
    with pytest.raises(ValueError):m.prepare(cfg)


def test_public_ca_bundle_has_separate_bounded_size_from_private_keys(tmp_path):
    m=module();cfg=config(tmp_path)
    Path(cfg['files']['identity_ca']).write_bytes(b'public certificate bundle' * 12000)
    assert m.prepare(cfg)['status']=='prepared_not_executed'
    Path(cfg['files']['identity_ca']).write_bytes(b'x' * (1048576+1))
    with pytest.raises(ValueError):m.prepare(cfg)


@pytest.mark.skipif(__import__('os').name=='nt',reason='POSIX link and mode controls')
@pytest.mark.parametrize('kind',['symlink','hardlink','open_mode'])
def test_private_inputs_reject_links_and_public_read_permissions(tmp_path,kind):
    import os
    m=module();cfg=config(tmp_path);path=Path(cfg['files']['authority_key'])
    if kind=='symlink':
        target=path.with_suffix('.target');path.rename(target);path.symlink_to(target)
    elif kind=='hardlink':
        target=path.with_suffix('.target');os.link(path,target)
    else:path.chmod(0o644)
    with pytest.raises(ValueError):m.prepare(cfg)


def test_current_local_model_requires_the_observed_exact_digest(tmp_path):
    m=module();cfg=config(tmp_path)
    cfg['model'].update(name='qwen3:1.7b',digest='8f68893c685c3ddff2aa3fffce2aa60a30bb2da65ca488b61fff134a4d1730e7')
    plan=m.prepare(cfg)
    assert plan['model']==cfg['model']
    assert plan['persistence_profile']=='legacy-file'
    assert plan['candidate_acceptance'] is False
    cfg['model']['digest']='0'*64
    with pytest.raises(ValueError):m.prepare(cfg)


def test_historical_model_name_cannot_relabel_an_unknown_digest(tmp_path):
    m=module();cfg=config(tmp_path);cfg['model']['digest']='0'*64
    with pytest.raises(ValueError):m.prepare(cfg)


def test_model_cache_is_verified_before_runtime_use(tmp_path):
    import hashlib,json
    m=module();root=tmp_path/'models';blobdir=root/'blobs';blobdir.mkdir(parents=True)
    descriptors=[]
    for raw in (b'synthetic config',b'synthetic weights'):
        checksum=hashlib.sha256(raw).hexdigest()
        (blobdir/('sha256-'+checksum)).write_bytes(raw)
        descriptors.append({'mediaType':'synthetic','digest':'sha256:'+checksum,'size':len(raw)})
    raw=json.dumps({'schemaVersion':2,'mediaType':'synthetic','config':descriptors[0],'layers':descriptors[1:]}).encode()
    checksum=hashlib.sha256(raw).hexdigest()
    manifest=root/'manifests/registry.ollama.ai/library/qwen3/1.7b';manifest.parent.mkdir(parents=True);manifest.write_bytes(raw)
    m.MODEL_DIGESTS['qwen3:1.7b']=checksum  # Synthetic test identity only.
    model={'name':'qwen3:1.7b','digest':checksum,'url':'http://127.0.0.1:11434'}
    identity=m.verify_model_artifacts(root,model)
    assert identity['manifest_sha256']==checksum and identity['blob_count']==2
    (blobdir/('sha256-'+descriptors[1]['digest'].split(':')[1])).write_bytes(b'corrupt')
    with pytest.raises(ValueError):m.verify_model_artifacts(root,model)


def test_absent_model_cache_does_not_get_created_or_fetched(tmp_path):
    m=module();root=tmp_path/'absent'
    with pytest.raises((ValueError,FileNotFoundError)):
        m.verify_model_artifacts(root,{'name':'qwen3:1.7b','digest':m.MODEL_DIGESTS['qwen3:1.7b'],'url':'http://127.0.0.1:11434'})
    assert not root.exists()


def test_exact_v2_manifest_can_coexist_with_a_historical_legacy_copy(tmp_path):
    import hashlib,json
    m=module();root=tmp_path/'models';blobdir=root/'blobs';blobdir.mkdir(parents=True)
    raw=b'synthetic weights';checksum=hashlib.sha256(raw).hexdigest()
    (blobdir/('sha256-'+checksum)).write_bytes(raw)
    descriptor={'mediaType':'synthetic','digest':'sha256:'+checksum,'size':len(raw)}
    content=json.dumps({'schemaVersion':2,'mediaType':'synthetic','config':descriptor,'layers':[descriptor]}).encode()
    checksum=hashlib.sha256(content).hexdigest();m.MODEL_DIGESTS['qwen3:1.7b']=checksum
    legacy=root/'manifests/registry.ollama.ai/library/qwen3/1.7b';legacy.parent.mkdir(parents=True);legacy.write_bytes(b'old layout')
    current=root/'manifests-v2/ollama.com/library/qwen3/1.7b';current.parent.mkdir(parents=True);current.write_bytes(content)
    result=m.verify_model_artifacts(root,{'name':'qwen3:1.7b','digest':checksum,'url':'http://127.0.0.1:11434'})
    assert result['manifest_layout']=='manifests-v2'


@pytest.mark.skipif(__import__('os').name=='nt',reason='POSIX model manifest alias')
@pytest.mark.parametrize('external',[False,True])
def test_v2_alias_is_allowed_only_to_its_exact_content_blob(tmp_path,external):
    import hashlib,json
    m=module();root=tmp_path/'models';blobs=root/'blobs';blobs.mkdir(parents=True)
    raw=b'synthetic weights';checksum=hashlib.sha256(raw).hexdigest();(blobs/('sha256-'+checksum)).write_bytes(raw)
    item={'mediaType':'synthetic','digest':'sha256:'+checksum,'size':len(raw)}
    content=json.dumps({'schemaVersion':2,'mediaType':'synthetic','config':item,'layers':[item]}).encode()
    checksum=hashlib.sha256(content).hexdigest();m.MODEL_DIGESTS['qwen3:1.7b']=checksum
    target=tmp_path/'outside' if external else blobs/('sha256-'+checksum)
    target.write_bytes(content)
    manifest=root/'manifests-v2/ollama.com/library/qwen3/1.7b';manifest.parent.mkdir(parents=True);manifest.symlink_to(target)
    model={'name':'qwen3:1.7b','digest':checksum,'url':'http://127.0.0.1:11434'}
    if external:
        with pytest.raises(ValueError):m.verify_model_artifacts(root,model)
    else:
        assert m.verify_model_artifacts(root,model)['manifest_sha256']==checksum
