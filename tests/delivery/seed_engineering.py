"""Actual HTTPS APIs, owned production volume, real worker and SQL authority.

Synthetic analytical input and controlled model, never acquisition certification.
"""

import json
import ssl
import time
from pathlib import Path
from uuid import uuid4

import httpx
from engineering_fixture import seed
from identity_fixture import TEAMS, USERS

context = ssl.create_default_context(cafile="/fixture/cert.pem")
result = {}
for token in ("fixture-a", "fixture-b"):
    with httpx.Client(
        base_url="https://127.0.0.1:8180",
        verify=context,
        trust_env=False,
        timeout=20,
        headers={
            "Authorization": "Bearer " + token,
            "X-Team-ID": TEAMS[token],
            "X-Workflow-ID": "isolated-synthetic-engineering",
            "X-Trace-ID": str(uuid4()),
        },
    ) as client:
        session, snapshot = seed(
            client, Path("/var/lib/chassis/recorded"), USERS[token], TEAMS[token]
        )
        response = client.post(
            "/api/v1/engineering/sessions/" + session["id"] + "/runs",
            json={
                "expected_revision": 1,
                "operation_id": str(uuid4()),
                "snapshot_id": snapshot["id"],
                "config": {},
            },
        )
        assert response.status_code in (200, 201), response.status_code
        run = response.json()
        end = time.monotonic() + 120
        while time.monotonic() < end:
            response = client.get(
                "/api/v1/engineering/runs/" + run["run_id"] + "/synthesis"
            )
            assert response.status_code == 200
            progress = response.json()
            if progress["status"] in (
                "succeeded",
                "failed",
                "unavailable",
                "timed_out",
            ):
                break
            time.sleep(0.5)
        assert progress["status"] == "succeeded", progress
        response = client.get(
            "/api/v1/engineering/proposals/" + progress["proposal_id"] + "/authority"
        )
        assert response.status_code == 200
        validity = response.json()
        assert validity["approvable"] is True, validity
        result[token] = {
            "session_id": session["id"],
            "snapshot_id": snapshot["id"],
            "proposal_id": progress["proposal_id"],
            "run_id": run["run_id"],
        }
print(
    json.dumps(
        {
            "status": "passed",
            "sessions": result,
            "authority": "actual PostgreSQL migrations",
            "model": "controlled synthetic fixture",
        }
    )
)
