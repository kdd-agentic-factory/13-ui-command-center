"""Read-only current cloud API probe. Fixed test accounts, no object creation."""
import asyncio
import hashlib
import json
import ssl
from pathlib import Path
from uuid import uuid4

import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app

ORIGIN = 'https://czdpamk9.eu-central.insforge.app'
report = {'scope': 'current_cloud_real_identity_storage_readonly', 'status': 'blocked',
          'business_writes': False, 'model_executed': False, 'browser_tested': False,
          'human_approval': False, 'candidate_acceptance': False, 'gates': []}


def gate(name, passed):
    report['gates'].append({'name': name, 'passed': bool(passed)})
    if not passed:
        raise ValueError('Read-only gate failed')


async def main():
    descriptor = json.loads(Path('/run/cloud/descriptor').read_text())
    gate('fixed_identity_origin', descriptor['identity_url'] == ORIGIN)
    accounts = json.loads(Path('/qa-private/accounts.json').read_text())
    gate('eight_test_accounts', len(accounts['accounts']) == 8 and
         {(a['team'], a['role']) for a in accounts['accounts']} ==
         {(t, r) for t in ['A', 'B'] for r in ['chief', 'substitute', 'engineer', 'reader']}
         and set(accounts['teams']) == {'A', 'B'})
    app = load_cloud_app('/run/cloud/descriptor')
    tls = ssl.create_default_context(cafile='/run/cloud/identity_ca')
    headers_by_role = {}
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://127.0.0.1:8180', timeout=30) as api:
            async with httpx.AsyncClient(verify=tls, trust_env=False, follow_redirects=False, timeout=20) as identity:
                for account in accounts['accounts']:
                    label = account['team'] + '_' + account['role']
                    response = await identity.post(ORIGIN + '/api/auth/sessions?client_type=server', json={'email': account['email'], 'password': account['password']})
                    gate('login_' + label, response.status_code == 200)
                    headers = {'Authorization': 'Bearer ' + response.json()['accessToken'],
                               'X-Team-ID': accounts['teams'][account['team']],
                               'X-Actor-ID': account['id'], 'X-Workflow-ID': 'current-cloud-readonly', 'X-Trace-ID': str(uuid4())}
                    teams = await api.get('/api/v1/teams', headers=headers)
                    gate('subject_' + label, teams.status_code == 200 and teams.json().get('subject_id') == account['id'])
                    own = await api.get('/api/v1/engineering/sessions?limit=1', headers=headers)
                    gate('own_sessions_' + label, own.status_code == 200)
                    other = 'B' if account['team'] == 'A' else 'A'
                    denied = await api.get('/api/v1/engineering/sessions?limit=1', headers=headers | {'X-Team-ID': accounts['teams'][other]})
                    gate('foreign_team_' + label, denied.status_code == 403)
                    headers_by_role[(account['team'], account['role'])] = headers
                    if account['role'] in ('chief', 'substitute'):
                        designation = await api.get('/api/v1/engineering/settings/crew-chief', headers=headers)
                        members = {a['role']: a['id'] for a in accounts['accounts'] if a['team'] == account['team']}
                        gate('designation_' + label, designation.status_code == 200 and designation.json().get('primary_id') == members['chief'] and designation.json().get('substitute_id') == members['substitute'])
            for team, other in [('A', 'B'), ('B', 'A')]:
                headers = headers_by_role[(team, 'engineer')]
                listed = await api.get('/api/v1/engineering/knowledge/documents?limit=20', headers=headers)
                gate('private_document_list_' + team, listed.status_code == 200)
                candidates = [item for item in listed.json()['items'] if item.get('content_type') == 'text/plain' and 0 < item.get('byte_length', 0) <= 65536]
                gate('existing_bounded_document_' + team, bool(candidates))
                item = candidates[0]; doc = item['document']; route = '/api/v1/engineering/knowledge/documents/' + doc['id'] + '/source'
                source = await api.get(route, headers=headers)
                gate('private_storage_read_' + team, source.status_code == 200 and len(source.content) == item['byte_length'] and hashlib.sha256(source.content).hexdigest() == doc['sha256'] and source.headers.get('cache-control') == 'no-store')
                foreign = await api.get(route, headers=headers_by_role[(other, 'engineer')])
                gate('foreign_document_hidden_' + team, foreign.status_code == 404)
    report['status'] = 'passed'


try:
    asyncio.run(main())
except Exception as error:
    report['error_type'] = type(error).__name__
print(json.dumps(report))
