"""Frozen SQL contract integrity and designated human evidence boundaries."""
import hashlib
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import pytest


def test_frozen_authority_sql_matches_recorded_hashes():
    root=Path('tests/delivery/sql-contracts')
    provenance=json.loads((root/'provenance.json').read_text())
    assert set(provenance['files'])=={'012_chassis_teams.sql','013_chassis_crew_chief_authority.sql'}
    for name,expected in provenance['files'].items():
        assert hashlib.sha256((root/name).read_bytes()).hexdigest()==expected


def load_verifier():
    spec=importlib.util.spec_from_file_location('human_sql',Path('tests/delivery/verify_human_sql.py'))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_approval_evidence_requires_two_designated_humans():
    module=load_verifier()
    events=[{'actor_id':actor,'action':'approve','designated':True} for actor in (
        '11111111-1111-4111-8111-111111111111',
        '77777777-7777-4777-8777-777777777777')]
    with patch.object(module.subprocess,'run',return_value=SimpleNamespace(stdout=json.dumps(events))):
        assert module.verify('owned-fixture')['status']=='passed'
    for invalid in ([],events[:1],[dict(events[0],designated=False),events[1]],
                    [events[0],dict(events[1],actor_id='service-agent')]):
        with patch.object(module.subprocess,'run',return_value=SimpleNamespace(stdout=json.dumps(invalid))):
            with pytest.raises(AssertionError):module.verify('owned-fixture')
