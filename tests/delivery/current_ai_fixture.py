"""One new synthetic QA session/run from an explicit existing synthetic snapshot.

No catalog duplication, model execution, physical application or human decision.
Retries reuse the operator-owned run-id and immutable source references.
"""
import asyncio
import json
import ssl
from pathlib import Path
from uuid import UUID, uuid5

import httpx

from telemetry_dataset.persistence.bootstrap import load_cloud_app

ORIGIN = 'https://czdpamk9.eu-central.insforge.app'
report = {'status': 'blocked', 'scope': 'current_image_synthetic_ai_fixture',
          'model_executed': False, 'human_approval': False, 'candidate_acceptance': False,
          'deployment': False, 'gates': []}


def gate(name, ok):
    report['gates'].append({'name': name, 'passed': bool(ok)})
    if not ok:
        raise ValueError('Fixture gate failed')


async def main():
    operation = UUID(Path('/qa-output/run-id').read_text().strip())
    source = json.loads(Path('/qa-output/source-fixture.json').read_text())
    for key in ('session_id', 'snapshot_id'):
        UUID(source[key])
    descriptor = json.loads(Path('/run/cloud/descriptor').read_text())
    gate('fixed_origin', descriptor['identity_url'] == ORIGIN)
    accounts = json.loads(Path('/qa-private/accounts.json').read_text())
    found = [a for a in accounts['accounts'] if a['team'] == 'A' and a['role'] == 'engineer']
    gate('unique_designated_qa_engineer', len(found) == 1)
    actor = found[0]
    async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'), trust_env=False, timeout=20, follow_redirects=False) as auth:
        login = await auth.post(ORIGIN + '/api/auth/sessions?client_type=server', json={'email': actor['email'], 'password': actor['password']})
        gate('real_login', login.status_code == 200)
        headers = {'Authorization': 'Bearer ' + login.json()['accessToken'], 'X-Team-ID': accounts['teams']['A'], 'X-Workflow-ID': 'current-ai-fixture-' + str(operation), 'X-Trace-ID': str(operation)}
    app = load_cloud_app('/run/cloud/descriptor')
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://127.0.0.1:8180/api/v1/', headers=headers, timeout=40) as api:
            async def call(method, path, body=None):
                response = await api.request(method, path, json=body)
                report['last_http_status'] = response.status_code
                gate(method + '_' + path.split('/')[0], response.status_code == 200)
                return response.json()

            original = await call('GET', 'engineering/sessions/' + source['session_id'])
            snapshot = await call('GET', 'engineering/snapshots/' + source['snapshot_id'])
            gate('owned_synthetic_source', original['team_id'] == accounts['teams']['A'] and original['provenance'] == 'synthetic' and snapshot['analyzable'] is True)
            recordings = snapshot['selection']['recordings']
            gate('single_explicit_recording', len(recordings) == 1)
            recording = await call('GET', 'recorded/' + recordings[0]['id'])
            gate('synthetic_recording_only', recording['filename'] == 'SYNTHETIC-QA.csv')
            session = await call('POST', 'engineering/sessions', {'operation_id': str(uuid5(operation, 'session')), 'body': {'name': 'QA SYNTHETIC current AI ' + str(operation)[:8], 'provenance': 'synthetic', 'session_type': 'test', **{k: original[k] for k in ('circuit', 'bike', 'rider')}}})
            report['session_id'] = session['id']
            frozen = await call('POST', 'engineering/sessions/' + session['id'] + '/snapshots', {'operation_id': str(uuid5(operation, 'snapshot')), 'expected_revision': session['revision'], 'selection': snapshot['selection']})
            report['snapshot_id'] = frozen['id']
            gate('new_snapshot_analyzable', frozen['analyzable'] is True)
            run = await call('POST', 'engineering/sessions/' + session['id'] + '/runs', {'operation_id': str(uuid5(operation, 'analysis-run')), 'expected_revision': session['revision'], 'snapshot_id': frozen['id'], 'config': {}})
            report['run_id'] = run['run_id']
            report['run_status'] = run['status']
            report['status'] = 'passed'


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        report['error_type'] = type(error).__name__
    print(json.dumps(report))
