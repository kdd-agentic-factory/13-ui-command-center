"""Verify persisted human actors in the parent-owned isolated SQL fixture."""
import json
import subprocess

QUERY = """SELECT coalesce(json_agg(json_build_object('team_id',e.team_id,'proposal_id',e.proposal_id,'actor_id',e.actor_id,'action',e.action,'designated',e.actor_id IN (d.primary_id,d.substitute_id))), '[]'::json) FROM chassis_approval_events e JOIN chassis_crew_chief_designations d USING(team_id)"""


def verify(container):
    result = subprocess.run(
        ['docker','exec',container,'psql','-U','postgres','-d','postgres','-t','-A','-c',QUERY],
        check=True,capture_output=True,text=True,timeout=15,
    )
    events=json.loads(result.stdout)
    assert len(events)==2, 'Expected two human approval records'
    assert all(event['action']=='approve' and event['designated'] for event in events)
    assert {event['actor_id'] for event in events}=={
        '11111111-1111-4111-8111-111111111111',
        '77777777-7777-4777-8777-777777777777',
    }, 'Must be primary A and designated substitute B'
    return {'status':'passed','authority':'actual isolated PostgreSQL','events':events}
