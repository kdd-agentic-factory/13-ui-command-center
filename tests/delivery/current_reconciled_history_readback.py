"""Read back the two explicit synthetic QA decisions; never creates an event."""
import asyncio
import json
import ssl
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app

ORIGIN = 'https://czdpamk9.eu-central.insforge.app'
report = {'status': 'blocked', 'scope': 'reconciled_qa_history_fresh_process',
          'business_writes': False, 'workshop_application': False, 'candidate_acceptance': False,
          'deployment': False, 'gates': [], 'decisions': {}}


def gate(name, ok):
    report['gates'].append({'name': name, 'passed': bool(ok)})
    if not ok:
        raise ValueError('Readback gate failed')


async def main():
    expected = json.loads(Path('/qa-output/approval-expected.json').read_text())
    gate('two_explicit_targets', set(expected['pending_approvals']) == {'chief', 'substitute'})
    accounts = json.loads(Path('/qa-private/accounts.json').read_text())
    actor = next(a for a in accounts['accounts'] if a['team'] == 'A' and a['role'] == 'engineer')
    async with httpx.AsyncClient(verify=ssl.create_default_context(cafile='/run/cloud/identity_ca'), trust_env=False, timeout=20, follow_redirects=False) as auth:
        login = await auth.post(ORIGIN + '/api/auth/sessions?client_type=server', json={'email': actor['email'], 'password': actor['password']})
        gate('real_engineer_read_login', login.status_code == 200)
        headers = {'Authorization': 'Bearer ' + login.json()['accessToken'], 'X-Team-ID': accounts['teams']['A'], 'X-Workflow-ID': 'qa-decisions-readback', 'X-Trace-ID': str(uuid4())}
    app = load_cloud_app('/run/cloud/descriptor')
    async with app.router.lifespan_context(app):
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://127.0.0.1:8180/api/v1/engineering/', headers=headers, timeout=40) as api:
            for role, target in expected['pending_approvals'].items():
                UUID(target['session_id']); UUID(target['proposal_id'])
                designated = next(a for a in accounts['accounts'] if a['team'] == 'A' and a['role'] == role)
                response = await api.get('proposals/' + target['proposal_id'] + '/authority')
                gate(role + '_authority_read', response.status_code == 200)
                authority = response.json()
                gate(role + '_approved_current', authority['current'] is True and authority['approved_current'] is True and authority['decision_action'] == 'approve' and bool(authority['decision_id']))
                events = await api.get('sessions/' + target['session_id'] + '/events')
                report.setdefault('http_statuses', []).append({'endpoint': role + '_events', 'status': events.status_code})
                gate(role + '_events_read', events.status_code == 200)
                report['gates'].append({'name': role + '_complete_recovered_history', 'passed': events.json()['next_cursor'] is None and events.json()['recovery_unavailable'] is False})
                report.setdefault('history_summary', {})[role] = {'rejected_intents_count': events.json()['rejected_intents_count'], 'recovery_unavailable': events.json()['recovery_unavailable'], 'event_count': len(events.json()['items'])}
                gate(role + '_exact_rejection_count', events.json()['rejected_intents_count'] == (2 if role == 'chief' else 0))
                rows = events.json()['items']
                matches = [e for e in rows if e['id'] == authority['decision_id']]
                gate(role + '_exact_designated_event', len(matches) == 1 and matches[0]['actor_id'] == designated['id'] and matches[0]['action'] == 'approve' and matches[0]['proposal_id'] == target['proposal_id'])
                gate(role + '_no_mechanical_event', not any(e['kind'] in ('application', 'validation') for e in rows))
                report['decisions'][role] = {'proposal_id': target['proposal_id'], 'decision_id': authority['decision_id'], 'action': 'approve'}
    report['status'] = 'passed' if all(g['passed'] for g in report['gates']) else 'blocked'


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as error:
        report['error_type'] = type(error).__name__
    print(json.dumps(report))
