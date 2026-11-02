"""One explicit synthetic QA session with three selected domain observations.

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
report = {'status': 'blocked', 'scope': 'current_image_synthetic_domain_ai_fixture',
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
            session = await call('POST', 'engineering/sessions', {'operation_id': str(uuid5(operation, 'session')), 'body': {'name': 'QA SYNTHETIC domain AI ' + str(operation)[:8], 'provenance': 'synthetic', 'session_type': 'test', **{k: original[k] for k in ('circuit', 'bike', 'rider')}}})
            report['session_id'] = session['id']
            from copy import deepcopy
            selection = deepcopy(snapshot['selection'])
            gate('source_has_no_domain_selection', not selection.get('domain_contexts'))
            gate('explicit_setup_for_tire_observation', bool(selection.get('setup_a')))
            observed_at = snapshot['created_at']
            from datetime import datetime, timezone
            # Timestamp labels a software test observation, never a synthetic GPS clock.
            if not observed_at:
                observed_at = datetime.now(timezone.utc).isoformat()
            refs = []
            quantities = {
                'track': {'metric': 'sector_length_m', 'value': '100', 'unit': 'm', 'uncertainty': '1', 'sensor_id': 'track_sector_length', 'sector': 'SYNTHETIC-QA-Z1'},
                'weather': {'metric': 'air_temperature_k', 'value': '20', 'unit': 'degC', 'uncertainty': '0.5', 'sensor_id': 'air_temperature'},
                'tires-powertrain': {'metric': 'tire_pressure_pa', 'value': '2', 'unit': 'bar', 'uncertainty': '0.05', 'sensor_id': 'tire_pressure_front', 'axle': 'front', 'pressure_reference': 'gauge', 'condition': 'cold'},
            }
            for domain, quantity in quantities.items():
                body = {'domain': domain, 'session_id': session['id'], 'session_revision': session['revision'],
                        'circuit': session['circuit'], 'bike': session['bike'], 'rider': session['rider'],
                        'temporal': {'kind': 'point', 'observed_at': observed_at},
                        'source': {'kind': 'manual', 'reference': 'SYNTHETIC QA software test input, not measured telemetry',
                                   'instrument': 'SYNTHETIC QA software-only instrument',
                                   'calibration_reference': 'SYNTHETIC QA software contract only, no metrological certification'},
                        'quantities': [quantity]}
                if domain == 'tires-powertrain':
                    body.update(setup=selection['setup_a'], mounting_reference='SYNTHETIC QA fixture mounting only')
                packet = await call('POST', 'chassis/domain-evidence/packets', {'operation_id': str(uuid5(operation, 'packet-' + domain)), 'body': body})
                gate(domain + '_contribution_not_physical_validation', packet['assessment']['status'] == 'contributed')
                ref = {k: packet[k] for k in ('id', 'revision', 'domain', 'digest')}
                reviewed = await call('POST', 'chassis/domain-evidence/packets/' + packet['id'] + '/attestations',
                    {'operation_id': str(uuid5(operation, 'review-' + domain)), 'ref': ref,
                     'body': {'reference': 'SYNTHETIC QA documentary test only; not an instrument calibration',
                              'instrument_reference': 'SYNTHETIC QA software-only instrument', 'scope': 'reported_conditions'}})
                gate(domain + '_observation_only', reviewed['assessment']['status'] == 'eligible_for_observation')
                refs.append({k: reviewed[k] for k in ('id', 'revision', 'domain', 'digest')})
            selection['domain_contexts'] = refs
            frozen = await call('POST', 'engineering/sessions/' + session['id'] + '/snapshots', {'operation_id': str(uuid5(operation, 'snapshot')), 'expected_revision': session['revision'], 'selection': selection})
            gate('three_domains_frozen', {row['reference']['domain'] for row in frozen['evidence']['domain_contexts']} == set(quantities))
            gate('native_recordings_and_setup_refs_unchanged', frozen['selection']['recordings'] == snapshot['selection']['recordings'] and frozen['selection']['setup_a'] == snapshot['selection']['setup_a'])
            report['domain_refs'] = refs
            report['synthetic_observations_only'] = True
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
