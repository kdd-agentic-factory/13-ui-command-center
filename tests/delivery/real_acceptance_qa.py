"""Real identity and API-only synthetic acceptance; no business-volume access."""
import asyncio
import json
import math
from pathlib import Path
import ssl
import time
from uuid import uuid4

ORIGIN = 'https://czdpamk9.eu-central.insforge.app'


def proposal_input(stored):
    if (not isinstance(stored, dict) or not isinstance(stored.get('proposal'), dict) or
            not isinstance(stored.get('proposal_digest'), str)):
        raise ValueError('Stored proposal envelope required')
    return stored['proposal'], stored['proposal_digest']


def validate_accounts(data, expected):
    if set(data) != {'accounts', 'teams'} or set(data['teams']) != {'A', 'B'}:
        raise ValueError('Explicit two-team credentials required')
    if set(data['teams'].values()) != {t['team_id'] for t in expected['teams']}:
        raise ValueError('Test teams do not match reviewed scope')
    accounts = data['accounts']
    if not isinstance(accounts, list) or len(accounts) != 8:
        raise ValueError('Exactly eight test identities required')
    seen = set()
    for account in accounts:
        if set(account) != {'team', 'role', 'email', 'password', 'id'}:
            raise ValueError('Closed test identity record required')
        team = next((t for t in expected['teams'] if t['team_id'] == data['teams'].get(account['team'])), None)
        if (team is None or account['role'] not in team['members'] or
                team['members'][account['role']] != account['id'] or
                (account['team'], account['role']) in seen or
                not isinstance(account['email'], str) or not 0 < len(account['email']) <= 254 or
                not isinstance(account['password'], str) or not 8 <= len(account['password']) <= 256):
            raise ValueError('Test identity binding mismatch')
        seen.add((account['team'], account['role']))
    return accounts


def main():
    import httpx
    from telemetry_dataset.identity.insforge import IdentityProvider
    expected = json.loads(Path('/expected.json').read_text())
    raw = Path('/qa-private/accounts.json')
    if not 0 < raw.stat().st_size <= 65536 or expected['identity_url'] != ORIGIN:
        raise ValueError('Invalid designated QA inputs')
    credentials = json.loads(raw.read_text())
    accounts = validate_accounts(credentials, expected)
    context = ssl.create_default_context(cafile='/run/secrets/api_ca')
    checks = []; owned = []; sessions = {}; tokens = {}; agent_runs = []; pending_approvals = {}
    client = httpx.Client(verify=context, trust_env=False, follow_redirects=False, timeout=25)
    identity = httpx.Client(trust_env=False, follow_redirects=False, timeout=20)
    api = 'https://127.0.0.1:8180/api/v1/'
    proxy = 'http://127.0.0.1:3000/api/telemetry/api/v1/'

    def check(name, valid):
        checks.append({'check': name, 'passed': bool(valid)})
        if not valid:
            raise ValueError('Acceptance check failed: ' + name)

    def call(method, path, account=None, body=None, codes=(200, 201), **kwargs):
        headers = {}
        if account is not None:
            headers = {'Authorization': 'Bearer ' + tokens[(account['team'], account['role'])],
                       'X-Team-ID': credentials['teams'][account['team']],
                       'X-Workflow-ID': expected['prefix'], 'X-Trace-ID': str(uuid4()),
                       'X-Actor-ID': account['id']}
        response = client.request(method, api + path, headers=headers, json=body, **kwargs)
        if response.status_code == 429 and method == 'GET':
            time.sleep(min(65, max(1, int(response.headers.get('Retry-After', '60')))))
            response = client.request(method, api + path, headers=headers, **kwargs)
        if response.status_code not in codes:
            checks.append({'check': 'http_' + method + '_' + path.split('/')[0],
                           'passed': False, 'status_code': response.status_code})
            raise ValueError('API phase failed: ' + method + ':' + path.split('/')[0] + ':' + str(response.status_code))
        return response.json() if response.content else None

    def account(team, role):
        return next(a for a in accounts if a['team'] == team and a['role'] == role)

    def seed(team):
        human = account(team, 'engineer')
        refs = {}
        label = expected['prefix'] + ' SYNTHETIC QA ' + team
        for kind in ('circuit', 'bike', 'rider'):
            item = call('POST', 'engineering/catalog/' + kind, human,
                        {'operation_id': str(uuid4()), 'body': {'name': label + ' ' + kind}})
            refs[kind] = {'id': item['id'], 'revision': 1}
        session = call('POST', 'engineering/sessions', human,
                       {'operation_id': str(uuid4()), 'body': {'name': label, **refs}})
        sessions[team] = session
        owned.append({'team': team, 'kind': 'session', 'id': session['id']})
        # Explicit synthetic arithmetic control: never a fabricated native log
        # or independent manufacturer export, and no validation override field.
        csv = 'Time,SYNTHETIC Fork\ns,mm\n' + ''.join(
            f'{i / 100:.2f},{10 + 5 * math.sin(i * .1):.8f}\n' for i in range(1024))
        recording = call('POST', 'recorded/import', human, params={'source': 'aim'},
                         files={'file': ('SYNTHETIC-QA.csv', csv.encode(), 'text/csv')})
        owned.append({'team': team, 'kind': 'recording', 'id': recording['id']})
        setups = []
        for name, offset in [('A', .03), ('B', .035)]:
            values = {k: {'value': v, 'unit': u, 'provenance': 'assumed'} for k, v, u in [
                ('front_radius_m', .3, 'm'), ('rake_rad', .4, 'rad'), ('offset_m', offset, 'm'),
                ('wheelbase_m', 1.4, 'm'), ('mass_kg', 200, 'kg'),
                ('front_weight_fraction', .5, '1'), ('cg_height_m', .5, 'm')]}
            setups.append(call('POST', 'chassis/setups', human,
                               {'bike_id': refs['bike']['id'], 'label': 'SYNTHETIC ' + name,
                                'operation_id': str(uuid4()), 'values': values}))
        comparison = call('POST', 'chassis/comparisons', human,
                          {'session_id': recording['id'], 'setup_a_id': setups[0]['id'],
                           'setup_b_id': setups[1]['id']})
        selection = {'recordings': [{'id': recording['id']}],
                     'comparison': {'id': comparison['id'], 'revision': 1},
                     'setup_a': {'id': setups[0]['id'], 'revision': 1},
                     'setup_b': {'id': setups[1]['id'], 'revision': 1}, 'domain_contexts': []}
        for domain, quantity in [
            ('track', dict(metric='sector_length_m', value='240', unit='m', sensor_id='track_sector_length', sector='QA-T1')),
            ('weather', dict(metric='air_temperature_k', value='20', unit='degC', sensor_id='air_temperature')),
            ('tires-powertrain', dict(metric='tire_pressure_pa', value='2.1', unit='bar', sensor_id='tire_pressure_front', axle='front', pressure_reference='gauge', condition='hot')),
        ]:
            packet = {'domain': domain, 'session_id': session['id'], 'session_revision': 1,
                      'circuit': refs['circuit'], 'bike': refs['bike'],
                      'temporal': {'kind': 'point', 'observed_at': '2026-10-26T10:00:00Z'},
                      'source': {'kind': 'manual', 'reference': 'SYNTHETIC acceptance control; no external validation',
                                 'instrument': 'SYNTHETIC instrument', 'calibration_reference': 'SYNTHETIC SI control'},
                      'quantities': [quantity]}
            if domain == 'tires-powertrain':
                packet.update(setup=selection['setup_b'], mounting_reference='SYNTHETIC mounting')
            obj = call('POST', 'chassis/domain-evidence/packets', human,
                       {'operation_id': str(uuid4()), 'body': packet})
            ref = {k: obj[k] for k in ('id', 'revision', 'digest', 'domain')}
            obj = call('POST', f"chassis/domain-evidence/packets/{obj['id']}/attestations", human,
                       {'operation_id': str(uuid4()), 'ref': ref,
                        'body': {'reference': 'SYNTHETIC documentary control',
                                 'instrument_reference': 'SYNTHETIC instrument', 'scope': 'reported_conditions'}})
            selection['domain_contexts'].append({k: obj[k] for k in ('id', 'revision', 'digest', 'domain')})
        snapshot = call('POST', f"engineering/sessions/{session['id']}/snapshots", human,
                        {'expected_revision': 1, 'operation_id': str(uuid4()), 'selection': selection})
        return session, snapshot

    try:
        for _ in range(120):
            try:
                if client.get(api + 'health').status_code == 200 and client.get('http://127.0.0.1:3000/health').status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(.5)
        else:
            raise ValueError('Installed HTTP services unavailable')
        check('anonymous_identity_rejected', client.get(proxy + 'teams').status_code == 401)
        response = client.get('http://127.0.0.1:11434/api/tags')
        check('local_model_runtime_ready', response.status_code == 200)
        model = next(m for m in response.json()['models'] if m['name'] == expected['model']['name'])
        check('local_model_runtime_digest', model['digest'] == expected['model']['digest'])
        for a in accounts:
            label = a['team'] + '_' + a['role']
            response = identity.post(ORIGIN + '/api/auth/sessions?client_type=server',
                                     json={'email': a['email'], 'password': a['password']})
            check('real_login_' + label, response.status_code == 200)
            token = response.json().get('accessToken')
            check('real_token_' + label, isinstance(token, str) and bool(token))
            tokens[(a['team'], a['role'])] = token
            # Product middleware, not an unsigned JWT decode, verifies this bearer.
            call('GET', 'teams', a)
            check('installed_identity_' + label, True)
            provider = IdentityProvider(ORIGIN)
            subject = asyncio.run(provider.verify_identity(token))
            memberships = asyncio.run(provider.list_memberships(subject, token))
            check('verified_subject_and_membership_' + label,
                  subject == a['id'] and len(memberships) == 1 and
                  memberships[0].team_id == credentials['teams'][a['team']])
            response = identity.post(ORIGIN + '/api/database/rpc/chassis_get_authority',
                                     headers={'Authorization': 'Bearer ' + token},
                                     json={'p_team': credentials['teams'][a['team']], 'p_session': str(uuid4())})
            check('authority_read_before_write_' + label, response.status_code == 200)
            designation = response.json()
            check('actual_designation_before_write_' + label,
                  designation.get('primary_id') == account(a['team'], 'chief')['id'] and
                  designation.get('substitute_id') == account(a['team'], 'substitute')['id'])
            foreign = 'B' if a['team'] == 'A' else 'A'
            denied = client.get(proxy + 'recorded', headers={'Authorization': 'Bearer ' + token,
                                'X-Team-ID': credentials['teams'][foreign]})
            check('foreign_membership_denied_' + label, denied.status_code == 403)
        for team, approver in [('A', 'chief'), ('B', 'substitute')]:
            session, snapshot = seed(team)
            engineer = account(team, 'engineer')
            reader = account(team, 'reader')
            call('POST', 'engineering/sessions', reader,
                          {'operation_id': str(uuid4()), 'body': {'name': 'DENIED QA write'}}, codes=(403,))
            check('reader_write_denied_' + team, True)
            foreign = 'B' if team == 'A' else 'A'
            call('GET', 'engineering/sessions/' + session['id'], account(foreign, 'engineer'), codes=(403, 404))
            check('foreign_session_hidden_' + team, True)
            run = call('POST', f"engineering/sessions/{session['id']}/runs", engineer,
                       {'expected_revision': 1, 'operation_id': str(uuid4()), 'snapshot_id': snapshot['id'], 'config': {}})
            until = time.monotonic() + 480
            while time.monotonic() < until:
                progress = call('GET', f"engineering/runs/{run['run_id']}/synthesis", engineer)
                if progress['status'] in ('succeeded', 'failed', 'unavailable', 'timed_out'):
                    break
                time.sleep(2)
            check('real_chief_synthesis_' + team, progress['status'] == 'succeeded')
            final = call('GET', f"engineering/runs/{run['run_id']}", engineer)
            tasks = {t['agent_id']: t for t in final['tasks']}
            check('independent_branches_' + team, final['status'] == 'sealed' and len(tasks) == 9 and final['review_mode'] == 'blind_review')
            check('real_model_calls_' + team, final['model_calls'] > 0)
            check('unsupported_biometrics_unavailable_' + team,
                  all(tasks[r]['status'] == 'unavailable' for r in ('physical', 'neuro')))
            check('specialists_and_reviewers_' + team,
                  all(tasks[r]['status'] == 'succeeded' for r in ('chassis', 'track', 'weather', 'tires-powertrain',
                                                                 'mechanical-check', 'evidence-quality', 'alternative-hypotheses')))
            agent_runs.append({'team': team, 'model_calls': final['model_calls'],
                               'tasks': {role: task['status'] for role, task in tasks.items()},
                               'synthesis': progress['status']})
            stored = call('GET', 'engineering/proposals/' + progress['proposal_id'], engineer)
            proposal, proposal_digest = proposal_input(stored)
            check('no_unvalidated_physical_prescription_' + team,
                  all(not item.get('parameters') and item['kind'] != 'setup_change' for item in proposal['items']))
            human = account(team, approver)
            validity = call('GET', 'engineering/proposals/' + progress['proposal_id'] + '/authority', human)
            check('proposal_approvable_' + team, validity['approvable'] is True)
            check('designated_humans_' + team,
                  validity['primary_id'] == account(team, 'chief')['id'] and validity['substitute_id'] == account(team, 'substitute')['id'])
            body = {'expected_session_revision': 1, 'expected_proposal_revision': proposal['revision'],
                    'expected_designation_revision': validity['designation_revision'],
                    'proposal_digest': proposal_digest, 'snapshot_digest': proposal['snapshot_digest'],
                    'action': 'approve', 'note': 'SYNTHETIC QA measurement-plan approval; no workshop application'}
            call('POST', 'engineering/proposals/' + progress['proposal_id'] + '/decisions', engineer,
                 {'operation_id': str(uuid4()), 'body': body}, codes=(403,))
            check('undesignated_engineer_approval_denied_' + team, True)
            # Positive decisions are made through the real browser UI, not
            # substituted by a successful HTTP-only authorization test.
            pending_approvals[team] = {'session_id': session['id'], 'proposal_id': progress['proposal_id']}
            owned.append({'team': team, 'kind': 'proposal', 'id': progress['proposal_id']})
            # Keep the production quota intact between the two scripted operators.
            if team == 'A':
                time.sleep(61)
        report = {'status': 'passed', 'gates': {'real_identity': 'passed', 'two_team_isolation': 'passed',
                  'real_agent_pipeline': 'passed', 'real_designated_approval_preconditions': 'passed',
                  'physical_guardrails': 'passed'}, 'checks': checks, 'owned_objects': owned, 'agent_runs': agent_runs,
                  'pending_approvals': pending_approvals,
                  'input_scope': 'synthetic CSV and assumed setups; no AiM/2D certification',
                  'cloud_audit': 'owned synthetic authority events retained; no accounts or permissions modified'}
    except Exception as error:
        report = {'status': 'blocked', 'gates': {'real_http_acceptance': 'blocked'}, 'checks': checks,
                  'owned_objects': owned, 'agent_runs': agent_runs, 'failure_type': type(error).__name__}
    finally:
        client.close(); identity.close()
    print(json.dumps(report))
    return 0 if report['status'] == 'passed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
