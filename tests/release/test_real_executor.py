"""The real executor cannot grant QA state or administrative credentials."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess

import pytest


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fixtures(tmp_path, monkeypatch):
    delivery = Path('tests/delivery').resolve()
    monkeypatch.syspath_prepend(str(delivery))
    module = load(delivery / 'run_real_acceptance.py', 'real_executor')
    helper = load(Path('tests/release/test_real_acceptance_plan.py'), 'plan_fixture')
    cfg = helper.config(tmp_path)
    return module, cfg


def test_real_role_specs_keep_secrets_readonly_and_qa_unprivileged(tmp_path, monkeypatch):
    module, cfg = fixtures(tmp_path, monkeypatch)
    specs = module.role_specs(cfg, 'anon_' + 'a' * 64)
    assert set(specs) == {'api', 'gateway', 'worker', 'frontend', 'qa'}
    for role, spec in specs.items():
        assert spec['user'] == ('101:101' if role == 'frontend' else '1000:1000')
        assert spec['read_only'] and spec['cap_drop'] == ['ALL']
        assert all(m['read_only'] for m in spec['credentials'])
        assert all('secret' not in k.lower() and not k.endswith('_TOKEN') for k in spec['env'])
        assert not spec.get('host_ports') and not spec.get('host_socket')
    assert {m['name'] for m in specs['qa']['credentials']} == {'accounts', 'api_ca'}
    assert not specs['qa']['business_state']
    assert specs['api']['business_state']
    assert not any(spec['business_state'] for role, spec in specs.items() if role != 'api')
    assert specs['api']['env']['TDS_ENGINEERING_MODEL_URL'] == 'http://127.0.0.1:11434'
    assert specs['api']['env']['TDS_ENGINEERING_AUTHORITY_URL'] == module.ORIGIN


@pytest.mark.parametrize('key', ['service-role-key', 'ik_' + 'a' * 32, '', 'anon_' + 'g' * 64])
def test_only_explicit_public_anonymous_config_enters_environment(tmp_path, monkeypatch, key):
    module, cfg = fixtures(tmp_path, monkeypatch)
    with pytest.raises(ValueError):
        module.role_specs(cfg, key)


def test_egress_forwarder_is_fixed_to_one_real_tls_origin(monkeypatch):
    delivery = Path('tests/delivery').resolve()
    module = load(delivery / 'real_identity_egress.py', 'identity_egress')
    assert module.UPSTREAM == 'czdpamk9.eu-central.insforge.app'
    assert module.PORT == 443
    assert module.validate_addresses(['93.184.216.34']) == ['93.184.216.34']
    for address in ['127.0.0.1', '10.0.0.1', '169.254.169.254', '::1', '0.0.0.0']:
        with pytest.raises(ValueError):
            module.validate_addresses([address])


@pytest.mark.parametrize('variant', ['valid', 'extra_account', 'wrong_subject', 'wrong_team', 'duplicate_role', 'extra_token'])
def test_qa_identity_scope_is_exact_before_any_login(tmp_path, monkeypatch, variant):
    _, cfg = fixtures(tmp_path, monkeypatch)
    qa = load(Path('tests/delivery/real_acceptance_qa.py'), 'real_qa')
    data = {'teams': {label: t['team_id'] for label, t in zip('AB', cfg['teams'])}, 'accounts': []}
    for label, team in zip('AB', cfg['teams']):
        for role, identifier in team['members'].items():
            data['accounts'].append({'team': label, 'role': role, 'id': identifier,
                                     'email': label + role + '@example.test', 'password': 'private-sentinel'})
    if variant == 'extra_account':
        data['accounts'].append(dict(data['accounts'][0]))
    elif variant == 'wrong_subject':
        data['accounts'][0]['id'] = data['accounts'][1]['id']
    elif variant == 'wrong_team':
        data['accounts'][0]['team'] = 'B'
    elif variant == 'duplicate_role':
        data['accounts'][1] = dict(data['accounts'][0])
    elif variant == 'extra_token':
        data['accounts'][0]['token'] = 'unrequested-token'
    if variant == 'valid':
        assert len(qa.validate_accounts(data, cfg)) == 8
    else:
        with pytest.raises(ValueError, match='(identity|identities)'):
            qa.validate_accounts(data, cfg)


@pytest.mark.parametrize('variant', ['valid', 'extra_field', 'other_project', 'extra_identity', 'service_in_browser'])
def test_provisioning_envelope_cannot_expand_credential_scope(tmp_path, monkeypatch, variant):
    _, cfg = fixtures(tmp_path, monkeypatch)
    module = load(Path('tests/delivery/provision_real_acceptance.py'), 'real_provision')
    accounts = {'teams': {label: t['team_id'] for label, t in zip('AB', cfg['teams'])}, 'accounts': []}
    for label, team in zip('AB', cfg['teams']):
        for role, identifier in team['members'].items():
            accounts['accounts'].append({'team': label, 'role': role, 'id': identifier,
                                         'email': label + role + '@example.test', 'password': 'private-sentinel'})
    data = {'version': '1', 'project_id': cfg['project_id'], 'identity_url': cfg['identity_url'],
            'teams': cfg['teams'], 'test_accounts': accounts, 'images': cfg['images'],
            'authority_key': 'dedicated-test-authority-' + 'x' * 32, 'anon_key': 'anon_' + 'a' * 64}
    if variant == 'extra_field':
        data['unrelated_admin_key'] = 'not-permitted'
    elif variant == 'other_project':
        data['identity_url'] = 'https://other-project.example.test'
    elif variant == 'extra_identity':
        accounts['accounts'].append(dict(accounts['accounts'][0]))
    elif variant == 'service_in_browser':
        data['anon_key'] = data['authority_key']
    if variant == 'valid':
        assert module.validate_payload(data) is data
    else:
        with pytest.raises(ValueError):
            module.validate_payload(data)


def test_approval_reads_the_actual_stored_proposal_envelope():
    qa = load(Path('tests/delivery/real_acceptance_qa.py'), 'real_qa_envelope')
    stored = {'proposal_digest': 'c' * 64,
              'proposal': {'revision': 2, 'snapshot_digest': 'd' * 64,
                           'items': [{'kind': 'measurement_request', 'parameters': []}]}}
    proposal, digest = qa.proposal_input(stored)
    assert proposal['revision'] == 2 and proposal['snapshot_digest'] == 'd' * 64
    assert digest == 'c' * 64 and proposal['items'][0]['parameters'] == []
    with pytest.raises(ValueError):
        qa.proposal_input(stored['proposal'])


@pytest.mark.skipif(shutil.which('node') is None, reason='Node browser contract probe')
def test_browser_reload_does_not_accept_cached_user_without_team_membership():
    result = subprocess.run(['node', 'tests/release/browser_reload_probe.cjs',
                             'tests/delivery/real_acceptance_browser.cjs'],
                            check=True, capture_output=True, text=True, timeout=15)
    report = json.loads(result.stdout)
    assert report['status'] == 'blocked'
    assert report['gates']['authenticated_browser'] == 'blocked'
    assert report['reloads'] == 1
    assert report['approvals'] == 1


@pytest.mark.skipif(shutil.which('node') is None, reason='Node browser contract probe')
def test_browser_gate_requires_primary_and_substitute_approval_interactions():
    result = subprocess.run(['node', 'tests/release/browser_reload_probe.cjs',
                             'tests/delivery/real_acceptance_browser.cjs', 'valid'],
                            check=True, capture_output=True, text=True, timeout=15)
    report = json.loads(result.stdout)
    assert report['status'] == 'passed' and report['reloads'] == 3
    assert report['approvals'] == 2
    assert report['gates']['real_primary_and_substitute'] == 'passed'


def test_failed_chief_preserves_bounded_agent_diagnostics_without_payloads():
    qa = load(Path('tests/delivery/real_acceptance_qa.py'), 'real_qa_diagnostics')
    final = {'model_calls': 8, 'tasks': [{'agent_id': 'chassis', 'status': 'succeeded',
        'result': {'private': 'sentinel'}, 'contract': 'secret-sentinel'}]}
    result = qa.agent_run_summary('A', final, {'status': 'failed', 'cause': 'model_deadline_exceeded'})
    assert result == {'team': 'A', 'model_calls': 8, 'tasks': {'chassis': 'succeeded'},
                      'synthesis': 'failed', 'cause': 'model_deadline_exceeded'}
    assert 'sentinel' not in json.dumps(result)
    result = qa.agent_run_summary('B', final, {'status': 'failed', 'cause': 'secret-sentinel'})
    assert result['cause'] == 'unrecognized'


@pytest.mark.parametrize('cpus,memory,accepted', [(16,16,True),(8,12,True),(4,16,False),(8,8,False)])
def test_insufficient_model_capacity_is_rejected_before_acceptance(tmp_path, monkeypatch, cpus, memory, accepted):
    module, _ = fixtures(tmp_path, monkeypatch)
    info = {'NCPU': cpus, 'MemTotal': memory * 1024 ** 3}
    if accepted:
        assert module.model_cpu_budget(info) == 6
    else:
        with pytest.raises(ValueError, match='capacity'):
            module.model_cpu_budget(info)
