"""One explicit synthetic bench in the two designated QA teams; no human decisions.

Run only in the reviewed Linux executor with private readonly credentials. The
operator-owned run-id file makes retries reuse immutable operation identifiers.
No migrations, deployment, agents, clinical claims or cleanup deletes.
"""
import asyncio
import hashlib
import json
import os
import ssl
from pathlib import Path
from uuid import UUID, uuid5

import httpx

from telemetry_dataset.persistence.bootstrap import load_cloud_app
from tests.test_suspension_lab_import import mapping

ORIGIN = 'https://czdpamk9.eu-central.insforge.app'
ROOT = '/api/v1/chassis/suspension-lab'
report = {'scope': 'synthetic_suspension_real_identity_postgres_storage', 'status': 'blocked',
          'synthetic_business_writes': True, 'model_executed': False, 'browser_tested': False,
          'human_approval': False, 'candidate_acceptance': False, 'gates': []}


def gate(name, passed):
    report['gates'].append({'name': name, 'passed': bool(passed)})
    if not passed:
        raise ValueError('Acceptance gate failed')


async def main():
    if os.environ.get('CHASSIS_REQUIRE_INSTALLED_PACKAGES') == '1':
        import telemetry_dataset
        import digital_twin_lab
        gate('installed_application_packages', all(str(Path(module.__file__).resolve()).startswith('/opt/python/lib/') for module in (telemetry_dataset, digital_twin_lab)))
    run = UUID(Path('/qa-output/run-id').read_text().strip())
    report['run_id'] = str(run)
    descriptor = json.loads(Path('/run/cloud/descriptor').read_text())
    gate('fixed_identity_origin', descriptor['identity_url'] == ORIGIN)
    accounts = json.loads(Path('/qa-private/accounts.json').read_text())
    gate('explicit_two_qa_teams', set(accounts['teams']) == {'A', 'B'} and len(accounts['accounts']) == 8)
    app = load_cloud_app('/run/cloud/descriptor')
    tls = ssl.create_default_context(cafile='/run/cloud/identity_ca')
    headers = {}
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://127.0.0.1:8180', timeout=45) as api:
            async with httpx.AsyncClient(verify=tls, trust_env=False, follow_redirects=False, timeout=20) as identity:
                for team, role in [('A', 'engineer'), ('A', 'reader'), ('B', 'engineer')]:
                    found = [a for a in accounts['accounts'] if a['team'] == team and a['role'] == role]
                    gate('unique_qa_account_' + team + '_' + role, len(found) == 1)
                    account = found[0]
                    response = await identity.post(ORIGIN + '/api/auth/sessions?client_type=server', json={'email': account['email'], 'password': account['password']})
                    gate('real_login_' + team + '_' + role, response.status_code == 200)
                    headers[(team, role)] = {'Authorization': 'Bearer ' + response.json()['accessToken'], 'X-Team-ID': accounts['teams'][team], 'X-Workflow-ID': 'synthetic-bench-' + str(run), 'X-Trace-ID': str(run)}
            own = headers[('A', 'engineer')]
            raw = b't;f;x\n' + b''.join(f'{i*10};{i%7};{i%5}\n'.encode() for i in range(1024))
            params = mapping().model_copy(update={'operation_id': uuid5(run, 'bench')})
            async def upload(who):
                return await api.post(ROOT + '/bench-imports', headers=who, files={'file': ('synthetic-acceptance.csv', raw, 'text/csv')}, data={'mapping': params.model_dump_json()})
            response = await upload(own)
            gate('private_bench_publication', response.status_code == 200)
            source = response.json()
            report['acquisition_id'] = source['id']
            gate('exact_original_hash_and_scope', source['team_id'] == accounts['teams']['A'] and source['original_sha256'] == hashlib.sha256(raw).hexdigest() and 'channels' not in source)
            retry = await upload(own)
            gate('import_idempotent_retry', retry.status_code == 200 and retry.json() == source)
            gate('reader_cannot_import', (await upload(headers[('A', 'reader')])).status_code == 403)
            route = ROOT + '/acquisitions/' + source['id']
            gate('other_team_cannot_read_bench', (await api.get(route, headers=headers[('B', 'engineer')])).status_code == 404)
            image_identity = os.environ.get('CHASSIS_QA_IMAGE_ID', '')
            if image_identity:
                report['image_identity'] = image_identity
            body = {'operation_id': str(uuid5(run, 'welch-image:' + image_identity if image_identity else 'welch')), 'source': {k: source[k] for k in ('kind', 'id', 'digest')}, 'channel_index': 1, 'interval_s': [0, 10], 'method': 'welch'}
            result = await api.post(ROOT + '/analyses', headers=own, json=body)
            gate('real_worker_private_result', result.status_code == 200)
            analysis = result.json()
            report['analysis_id'] = analysis['id']
            gate('exploratory_spectrum_with_density', analysis['status'] == 'complete' and analysis['observation_eligibility'] == 'exploratory' and bool(analysis['result']['density']))
            retry = await api.post(ROOT + '/analyses', headers=own, json=body)
            gate('analysis_idempotent_retry', retry.status_code == 200 and retry.json() == analysis)
            gate('reader_cannot_analyze', (await api.post(ROOT + '/analyses', headers=headers[('A', 'reader')], json=body)).status_code == 403)
            route = ROOT + '/analyses/' + analysis['id']
            gate('other_team_cannot_read_result', (await api.get(route, headers=headers[('B', 'engineer')])).status_code == 404)
            evidence = await api.get(route + '/evidence', headers=own)
            gate('no_mechanical_authority', evidence.status_code == 200 and evidence.json()['mechanical_authority'] == 'none' and 'density' not in str(evidence.json()))
    # Fresh app/connection instances must recover both private publications.
    restored = load_cloud_app('/run/cloud/descriptor')
    async with restored.router.lifespan_context(restored):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=restored), base_url='http://127.0.0.1:8180', timeout=30) as api:
            for name, path, expected in [('bench', ROOT + '/acquisitions/' + source['id'], source), ('result', route, analysis)]:
                response = await api.get(path, headers=own)
                gate('fresh_app_private_recovery_' + name, response.status_code == 200 and response.json() == expected and response.headers.get('cache-control') == 'no-store')
    report['status'] = 'passed'


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        report['error_type'] = type(error).__name__
    print(json.dumps(report))
