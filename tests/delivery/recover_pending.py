"""Cold recovery and actual HTTPS replay checks. Owned fixture state only."""

import json
import os
import shutil
import sqlite3
import ssl
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from uuid import uuid4

import httpx
from identity_fixture import ROLES, TEAMS, USERS, start
from sql_authority_fixture import SQLAuthority
from telemetry_dataset.operations.backup import create_backup, verify_backup
from telemetry_dataset.operations.manifest import ReleaseIdentity
from telemetry_dataset.operations.restore import restore_backup
from telemetry_dataset.operations.state import StateLayout


def phase(name):
    print("PHASE " + name, file=sys.stderr, flush=True)


def main():
    phase("cold backup")
    root = Path(tempfile.mkdtemp(prefix="pending-recovery-"))
    for name in (
        "cert.pem",
        "key.pem",
        "backend_key",
        "control_key",
        "signing_key",
        "probe_key",
    ):
        shutil.copyfile("/fixture/" + name, root / name)
        (root / name).chmod(0o600)
    pending = json.loads(Path("/pending-private.json").read_text())
    declaration = json.loads(Path("/release.json").read_text())
    release = ReleaseIdentity(
        state_schema="1.0",
        sources=declaration["sources"],
        runtime_lock_sha256=declaration["runtime_lock_sha256"],
        images=declaration["images"],
    )
    state = Path("/var/lib/chassis")
    layout = StateLayout(
        state,
        state / "recorded",
        state / "recorded/catalog.sqlite",
        state / "chassis.sqlite",
        state / "suspension-lab.sqlite",
        state / "domain-evidence.sqlite",
    )
    before = create_backup(layout, root / "backup", release=release)
    verified = verify_backup(root / "backup")
    phase("backup inventory verified")
    assert before == verified and verified["entries"], "Backup inventory did not verify"
    restored = root / "restored"
    report = restore_backup(root / "backup", restored, release=release)
    phase("restored state")
    assert report["status"] == "restored_not_activated"
    metadata = json.loads((restored / ".state-format.json").read_text())["restoration"]
    assert metadata["interrupted_runs"] >= 1 and metadata["invalidated_leases"] >= 2
    assert metadata["quarantine_until"] == pending["quarantine_until"]
    assert time.time() < pending["capacity_until"], (
        "Acceptance missed the live quarantine window"
    )
    with sqlite3.connect(restored / "chassis.sqlite") as db:
        assert db.execute("SELECT count(*) FROM engineering_leases").fetchone()[0] == 0
        assert (
            sorted(
                row[0]
                for row in db.execute("SELECT expires_at FROM engineering_model_slots")
            )
            == pending["reservation_expiries"]
        )
        assert (
            db.execute(
                "SELECT status FROM engineering_runs WHERE run_id=?",
                (pending["run"]["run_id"],),
            ).fetchone()[0]
            == "failed"
        )
    sql = SQLAuthority(USERS, TEAMS, ROLES, (root / "backend_key").read_text())
    phase("SQL authority reconnected")
    issuer = start(root / "cert.pem", root / "key.pem", sql)
    from engineering_fixture import start_model

    _model_context, model_url = start_model()
    phase("controlled model restarted")
    env = {
        key: value
        for key, value in os.environ.items()
        if key in ("PATH", "LANG", "PYTHONUNBUFFERED", "PYTHONDONTWRITEBYTECODE")
    }
    env.update(
        TDS_PRODUCT_PROFILE="chassis",
        TDS_APP_ENV="production",
        TDS_IDENTITY_MODE="authenticated",
        TDS_IDENTITY_URL="https://127.0.0.1:9443",
        TDS_IDENTITY_CA_FILE=str(root / "cert.pem"),
        TDS_IDENTITY_ANON_KEY="public-fixture-only",
        TDS_CORS_ORIGINS="https://app.example.test",
        TDS_STATE_ROOT=str(restored),
        TDS_TLS_CERT_FILE=str(root / "cert.pem"),
        TDS_TLS_KEY_FILE=str(root / "key.pem"),
        TDS_OPERATIONS_PROBE_KEY_FILE=str(root / "probe_key"),
        TDS_HOST="127.0.0.1",
        TDS_PORT="8180",
        TDS_ENGINEERING_AUTHORITY_MODE="insforge",
        TDS_ENGINEERING_AUTHORITY_URL="https://127.0.0.1:9443",
        TDS_ENGINEERING_AUTHORITY_SERVICE_KEY_FILE=str(root / "backend_key"),
        TDS_ENGINEERING_INTERNAL_API_KEY_FILE=str(root / "backend_key"),
        TDS_ENGINEERING_CONTROL_KEY_FILE=str(root / "control_key"),
        TDS_ENGINEERING_SIGNING_KEY_FILE=str(root / "signing_key"),
    )
    env.update(
        TDS_ENGINEERING_MODEL_NAME="controlled-qa", TDS_ENGINEERING_MODEL_URL=model_url
    )
    log = (root / "server.log").open("w")
    server = subprocess.Popen(
        [sys.executable, "-I", "-m", "telemetry_dataset.operations.server"],
        env=env,
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    phase("restored API process started")
    try:
        context = ssl.create_default_context(cafile=str(root / "cert.pem"))
        with httpx.Client(
            base_url="https://127.0.0.1:8180",
            verify=context,
            trust_env=False,
            timeout=10,
        ) as client:
            for _ in range(100):
                if server.poll() is not None:
                    raise AssertionError(
                        "Restored API failed: "
                        + (root / "server.log").read_text()[-1800:]
                    )
                try:
                    if client.get("/api/v1/health").status_code == 200:
                        break
                except httpx.HTTPError:
                    pass
                time.sleep(0.1)
            else:
                raise AssertionError("Restored API did not become ready")
            phase("restored HTTPS ready")
            human = {
                "Authorization": "Bearer " + pending["token"],
                "X-Team-ID": TEAMS[pending["token"]],
            }
            response = client.get(
                "/api/v1/engineering/runs/" + pending["run"]["run_id"], headers=human
            )
            assert response.status_code == 200 and response.json()["status"] == "failed"
            internal = {
                "X-Internal-API-Key": (root / "backend_key").read_text(),
                "X-Principal-ID": "engineering-orchestrator",
                "X-Principal-Role": "engineering_service",
                "X-Workflow-ID": pending["lease"]["task"]["workflow_id"],
                "X-Execution-Grant": pending["lease"]["execution_grant"],
            }
            response = client.post(
                "/api/v1/engineering/internal/tools/read_snapshot",
                headers=internal,
                json={"target": pending["target"]},
            )
            assert response.status_code == 403, "Pre-restore delegation remained usable"
            internal.pop("X-Execution-Grant")
            internal["X-Coordinator-Capability"] = (root / "control_key").read_text()
            response = client.post(
                "/api/v1/engineering/internal/control/renew",
                headers=internal,
                json={
                    "task_id": pending["target"]["task_id"],
                    "lease_id": pending["lease"]["lease_id"],
                    "worker_id": pending["lease"]["worker_id"],
                },
            )
            assert response.status_code == 403, "Pre-restore lease remained usable"
            phase("old grant and lease rejected")
            for token, item in pending["sealed"].items():
                response = client.get(
                    "/api/v1/engineering/proposals/"
                    + item["proposal_id"]
                    + "/authority",
                    headers={
                        "Authorization": "Bearer " + token,
                        "X-Team-ID": TEAMS[token],
                    },
                )
                assert (
                    response.status_code == 200 and response.json()["current"] is False
                ), "Restored sealed proposal still current"
            phase("sealed proposals fenced")
            with sqlite3.connect(restored / "chassis.sqlite") as db:
                assert (
                    db.execute("SELECT count(*) FROM engineering_leases").fetchone()[0]
                    == 0
                )
                assert (
                    db.execute(
                        "SELECT count(*) FROM engineering_model_slots"
                    ).fetchone()[0]
                    == 2
                )
                assert (
                    db.execute(
                        "SELECT count(*) FROM engineering_restore_fences"
                    ).fetchone()[0]
                    >= 3
                )
            response = client.post(
                "/api/v1/engineering/internal/control/claim",
                headers=internal,
                json={"worker_id": "restored-no-automatic-work"},
            )
            assert response.status_code == 200 and response.json()["lease"] is None, (
                "Restored claim status " + str(response.status_code)
            )
            phase("no automatic work")
            session_id = pending["session"]["id"]
            response = client.post(
                "/api/v1/engineering/sessions/" + session_id + "/runs/reconcile",
                headers=human,
                json={},
            )
            assert response.status_code == 200, (
                "Explicit restored reconciliation failed"
            )
            phase("explicit reconciliation")
            response = client.post(
                "/api/v1/engineering/sessions/" + session_id + "/snapshots",
                headers=human,
                json={
                    "expected_revision": 1,
                    "operation_id": str(uuid4()),
                    "selection": pending["snapshot"]["selection"],
                },
            )
            assert response.status_code == 200, (
                "Fresh snapshot after reconciliation failed"
            )
            fresh = response.json()
            phase("fresh snapshot")
            response = client.post(
                "/api/v1/engineering/sessions/" + session_id + "/runs",
                headers=human,
                json={
                    "expected_revision": 1,
                    "operation_id": str(uuid4()),
                    "snapshot_id": fresh["id"],
                    "config": {},
                },
            )
            assert response.status_code in (200, 201), (
                "Fresh explicitly requested run failed"
            )
            new_run = response.json()
            phase("fresh run")
            internal["X-Workflow-ID"] = new_run["workflow_id"]
            response = client.post(
                "/api/v1/engineering/internal/control/claim",
                headers=internal,
                json={"worker_id": "restored-explicit-fresh-work"},
            )
            assert response.status_code == 200
            new_lease = response.json()["lease"]
            phase("fresh lease")
            assert new_lease and new_lease["task"]["run_id"] == new_run["run_id"]
            internal.pop("X-Coordinator-Capability")
            internal["X-Execution-Grant"] = new_lease["execution_grant"]
            target = {key: new_lease["task"][key] for key in pending["target"]}
            response = client.post(
                "/api/v1/engineering/internal/tools/read_snapshot",
                headers=internal,
                json={"target": target},
            )
            assert response.status_code == 200
            decision = response.json()["decision_context"]
            response = client.post(
                "/api/v1/engineering/internal/tools/local_model_json",
                headers=internal,
                json={
                    "target": target,
                    "context_version": decision["schema_version"],
                    "context_digest": decision["digest"],
                    "timeout_seconds": 1,
                },
            )
            assert response.status_code == 403, (
                "Restored inference capacity rejection status "
                + str(response.status_code)
            )
            phase("fresh inference rejected during quarantine")
            with sqlite3.connect(restored / "chassis.sqlite") as db:
                assert (
                    db.execute(
                        "SELECT model_calls FROM engineering_runs WHERE run_id=?",
                        (new_run["run_id"],),
                    ).fetchone()[0]
                    == 0
                )
                assert (
                    db.execute(
                        "SELECT count(*) FROM engineering_model_slots"
                    ).fetchone()[0]
                    == 2
                )
            assert time.time() < pending["capacity_until"], (
                "Replay checks finished after quarantine expiry"
            )
        print(
            json.dumps(
                {
                    "status": "passed",
                    "checks": [
                        "pending run and live delegation created through HTTPS/gateway",
                        "real HTTP inference reservation interrupted in owned fixture",
                        "cold backup inventory and SHA256 verified",
                        "new-destination restore and actual HTTPS restart",
                        "pending run failed after restore",
                        "old execution grant and lease rejected by HTTP",
                        "sealed proposals no longer current",
                        "both live model reservations retained through replay checks",
                        "no automatic lease after restart",
                        "explicit reconciliation permits fresh snapshot and run",
                        "fresh HTTP inference denied until retained reservation expires",
                    ],
                    "fixture_only": True,
                    "quarantine_seconds_remaining": pending["capacity_until"]
                    - time.time(),
                }
            )
        )
    finally:
        phase("stop restored API")
        if server.poll() is None:
            server.terminate()
            server.wait(timeout=15)
        issuer.shutdown()
        issuer.server_close()
        model_context, model_proxy = _model_context
        model_proxy.shutdown()
        model_proxy.server_close()
        model_context.__exit__(None, None, None)
        phase("recovery complete")


if __name__ == "__main__":
    main()
