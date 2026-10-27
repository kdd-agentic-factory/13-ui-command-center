"""Real HTTP pending work and held inference, inside the owned API only."""

import json
import sqlite3
import ssl
import sys
import threading
import time
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from engineering_fixture import seed
from identity_fixture import TEAMS, USERS


def main():
    token = "fixture-badmin"
    context = ssl.create_default_context(cafile="/fixture/cert.pem")
    with httpx.Client(
        base_url="https://127.0.0.1:8180",
        verify=context,
        trust_env=False,
        timeout=15,
        headers={
            "Authorization": "Bearer " + token,
            "X-Team-ID": TEAMS[token],
            "X-Workflow-ID": "synthetic-pending-recovery",
            "X-Trace-ID": str(uuid4()),
        },
    ) as client:
        if len(sys.argv) == 3 and sys.argv[1] == "--reuse-run":
            run = {"run_id": str(UUID(sys.argv[2]))}
            session = snapshot = None
        else:
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
            assert response.status_code in (200, 201), "Pending run start failed"
            run = response.json()
        client.headers.clear()  # Private service transport must carry no human scope.
        service = {
            "X-Internal-API-Key": Path("/fixture/gateway_key").read_text(),
            "X-Principal-ID": "engineering-orchestrator",
            "X-Principal-Role": "engineering_service",
        }
        response = client.post(
            "http://127.0.0.1:8010/api/v1/tools/call",
            headers=service,
            json={
                "tool": "engineering.control_claim",
                "payload": {"worker_id": "synthetic-recovery-worker"},
                "workflow_id": "synthetic-pending-recovery",
                "coordinator_capability": Path("/fixture/control_key").read_text(),
            },
        )
        assert response.status_code == 200, "Gateway claim status " + str(
            response.status_code
        )
        lease = response.json()["result"]["lease"]
        assert lease and lease["task"]["run_id"] == run["run_id"]
        contract = lease["task"]
        target = {
            key: contract[key]
            for key in (
                "team_id",
                "scope",
                "session_id",
                "snapshot_id",
                "snapshot_digest",
                "run_id",
                "task_id",
                "branch",
                "agent_id",
            )
        }
        internal = {
            "X-Internal-API-Key": Path("/fixture/backend_key").read_text(),
            "X-Principal-ID": "engineering-orchestrator",
            "X-Principal-Role": "engineering_service",
            "X-Workflow-ID": contract["workflow_id"],
            "X-Execution-Grant": lease["execution_grant"],
        }
        response = client.post(
            "/api/v1/engineering/internal/tools/read_snapshot",
            headers=internal,
            json={"target": target},
        )
        assert response.status_code == 200, "Live grant failed before backup"
        decision = response.json()["decision_context"]
        Path("/tmp/chassis-qa-hold-model").write_text("synthetic fault only")
        payload = {
            "target": target,
            "context_version": decision["schema_version"],
            "context_digest": decision["digest"],
            "timeout_seconds": 55,
        }

        def invoke():
            try:
                with httpx.Client(verify=context, trust_env=False, timeout=65) as model:
                    model.post(
                        "https://127.0.0.1:8180/api/v1/engineering/internal/tools/local_model_json",
                        headers=internal,
                        json=payload,
                    )
            except httpx.HTTPError:
                pass  # Parent deliberately terminates this owned process.

        threading.Thread(target=invoke, daemon=True).start()
        end = time.monotonic() + 8
        slot = None
        while time.monotonic() < end:
            with sqlite3.connect(
                "file:/var/lib/chassis/chassis.sqlite?mode=ro", uri=True
            ) as db:
                slot = db.execute(
                    "SELECT expires_at FROM engineering_model_slots WHERE task_id=?",
                    (contract["task_id"],),
                ).fetchone()
            if slot:
                break
            time.sleep(0.05)
        assert slot and slot[0] > time.time() + 30, (
            "No live model reservation to recover"
        )
        # Private parent-to-helper transfer. Never uploaded as a public report.
        print(
            json.dumps(
                {
                    "token": token,
                    "session": session,
                    "snapshot": snapshot,
                    "run": run,
                    "lease": lease,
                    "target": target,
                    "quarantine_until": slot[0],
                }
            )
        )


if __name__ == "__main__":
    main()
