"""Real HTTPS acceptance inside a nonroot, network-none, resource-limited container."""

import json
import os
import secrets
import shutil
import ssl
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import httpx
from identity_fixture import TEAMS, start

root = Path(tempfile.mkdtemp(prefix="chassis-acceptance-"))
for name in ["cert.pem", "key.pem"]:
    shutil.copyfile("/fixture-tls/" + name, root / name)
    (root / name).chmod(0o600)
probe = root / "probe.key"
probe.write_text(secrets.token_urlsafe(40))
probe.chmod(0o600)
issuer = start(root / "cert.pem", root / "key.pem")
env = {
    k: v
    for k, v in os.environ.items()
    if k in ["PATH", "LANG", "PYTHONUNBUFFERED", "PYTHONDONTWRITEBYTECODE"]
}
env.update(
    TDS_PRODUCT_PROFILE="chassis",
    TDS_APP_ENV="production",
    TDS_IDENTITY_MODE="authenticated",
    TDS_IDENTITY_URL="https://127.0.0.1:9443",
    TDS_IDENTITY_CA_FILE=str(root / "cert.pem"),
    TDS_IDENTITY_ANON_KEY="public-fixture-only",
    TDS_CORS_ORIGINS="https://app.fixture.invalid",
    TDS_STATE_ROOT=str(root / "state"),
    TDS_TLS_CERT_FILE=str(root / "cert.pem"),
    TDS_TLS_KEY_FILE=str(root / "key.pem"),
    TDS_OPERATIONS_PROBE_KEY_FILE=str(probe),
    TDS_HOST="127.0.0.1",
    TDS_PORT="8180",
)
log = (root / "api.log").open("w")
process = subprocess.Popen(
    [sys.executable, "-I", "-m", "telemetry_dataset.operations.server"],
    env=env,
    stdout=log,
    stderr=subprocess.STDOUT,
)
try:
    context = ssl.create_default_context(cafile=str(root / "cert.pem"))
    with httpx.Client(
        base_url="https://127.0.0.1:8180", verify=context, trust_env=False, timeout=10
    ) as c:
        for _ in range(120):
            if process.poll() is not None:
                raise AssertionError(
                    "API exited: " + (root / "api.log").read_text()[-2000:]
                )
            try:
                if c.get("/api/v1/health").status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.25)
        else:
            raise AssertionError("API readiness timeout")
        assert c.get("/api/v1/internal/readiness").status_code == 403
        ready = c.get(
            "/api/v1/internal/readiness", headers={"X-Readiness-Key": probe.read_text()}
        )
        assert ready.status_code == 200, ready.text
        assert ready.json()["capabilities"]["ai"] == "unavailable"
        assert c.get("/api/v1/teams").status_code == 401
        teams = c.get("/api/v1/teams", headers={"Authorization": "Bearer fixture-a"})
        assert teams.status_code == 200, teams.text
        assert teams.json()["teams"][0]["id"] == TEAMS["fixture-a"]
        assert (
            c.get(
                "/api/v1/recorded",
                headers={
                    "Authorization": "Bearer fixture-a",
                    "X-Team-ID": TEAMS["fixture-b"],
                },
            ).status_code
            == 403
        )
        headers = {
            "Authorization": "Bearer fixture-a",
            "X-Team-ID": TEAMS["fixture-a"],
            "X-Workflow-ID": "fixture-delivery",
            "X-Trace-ID": "fixture-trace",
        }

        from check_roles import check_role_boundaries

        role_checks = check_role_boundaries(c)
        before_restore = c.get("/api/v1/engineering/catalog/circuit", headers=headers)
        assert before_restore.status_code == 200
        before_restore = before_restore.json()
        assert len(before_restore["items"]) == 1

        state_root = Path(env["TDS_STATE_ROOT"])
        business_store = state_root / "chassis.sqlite"
        business_store.chmod(0o400)
        try:
            assert (
                c.get(
                    "/api/v1/internal/readiness",
                    headers={"X-Readiness-Key": probe.read_text()},
                ).status_code
                == 503
            )
        finally:
            business_store.chmod(0o600)
        recorded_dir = state_root / "recorded"
        recorded_dir.chmod(0o500)
        try:
            assert (
                c.get(
                    "/api/v1/internal/readiness",
                    headers={"X-Readiness-Key": probe.read_text()},
                ).status_code
                == 503
            )
        finally:
            recorded_dir.chmod(0o700)
        assert (
            c.get(
                "/api/v1/internal/readiness",
                headers={"X-Readiness-Key": probe.read_text()},
            ).status_code
            == 200
        )

        recordings = c.get("/api/v1/recorded", headers=headers)
        assert recordings.status_code == 200, recordings.text
        duplicate = subprocess.run(
            [sys.executable, "-I", "-m", "telemetry_dataset.operations.server"],
            env=env,
            capture_output=True,
            check=False,  # Failure is the expected second-writer result.
            timeout=20,
        )
        assert duplicate.returncode != 0
        from telemetry_dataset.operations.backup import create_backup
        from telemetry_dataset.operations.exclusive import LeaseUnavailable
        from telemetry_dataset.operations.manifest import ReleaseIdentity
        from telemetry_dataset.operations.state import StateLayout

        state = root / "state"
        layout = StateLayout(
            state,
            state / "recorded",
            state / "recorded/catalog.sqlite",
            state / "chassis.sqlite",
            state / "suspension-lab.sqlite",
            state / "domain-evidence.sqlite",
        )
        release = ReleaseIdentity(
            state_schema="1.0",
            sources={
                "control": {
                    "git_ref": "fixture",
                    "tree_sha256": "a" * 64,
                    "dirty": True,
                }
            },
            runtime_lock_sha256="b" * 64,
        )
        try:
            create_backup(layout, root / "blocked-backup", release=release)
        except LeaseUnavailable:
            pass
        else:
            raise AssertionError("Live writer allowed cold backup")
    process.terminate()
    process.wait(timeout=20)
    backup = create_backup(layout, root / "cold-backup", release=release)
    from telemetry_dataset.operations.restore import restore_backup

    report = restore_backup(root / "cold-backup", root / "restored", release=release)
    assert report["status"] == "restored_not_activated", report
    env["TDS_STATE_ROOT"] = str(root / "restored")
    process = subprocess.Popen(
        [sys.executable, "-I", "-m", "telemetry_dataset.operations.server"],
        env=env,
        stdout=log,
        stderr=subprocess.STDOUT,
    )
    with httpx.Client(
        base_url="https://127.0.0.1:8180", verify=context, trust_env=False, timeout=10
    ) as c:
        for _ in range(120):
            if process.poll() is not None:
                raise AssertionError(
                    "Restored API exited: " + (root / "api.log").read_text()[-2000:]
                )
            try:
                restored_ready = c.get(
                    "/api/v1/internal/readiness",
                    headers={"X-Readiness-Key": probe.read_text()},
                )
                if restored_ready.status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.25)
        else:
            raise AssertionError("Restored API readiness timeout")
        restored_catalog = c.get("/api/v1/engineering/catalog/circuit", headers=headers)
        assert restored_catalog.status_code == 200
        assert restored_catalog.json() == before_restore
        restored_id = before_restore["items"][0]["id"]
        resource = "/api/v1/engineering/catalog/circuit/" + restored_id
        reader_headers = {**headers, "Authorization": "Bearer fixture-reader"}
        assert c.get(resource, headers=reader_headers).status_code == 200
        assert (
            c.put(
                resource,
                headers=reader_headers,
                json={
                    "expected_revision": 1,
                    "body": {"name": "Rejected after restore"},
                },
            ).status_code
            == 403
        )
        foreign_headers = {
            "Authorization": "Bearer fixture-b",
            "X-Team-ID": TEAMS["fixture-b"],
        }
        assert c.get(resource, headers=foreign_headers).status_code == 404
    print(
        json.dumps(
            {
                "status": "passed",
                "checks": [
                    "verified TLS",
                    "readonly business store and recording directory rejected",
                    "private readiness",
                    "real issuer HTTP",
                    "foreign-team denial",
                    "second writer rejected",
                    "live backup blocked",
                    "cold backup verified",
                    "new-destination restore",
                    "restored API restart and identical catalog",
                    "role and team boundaries after restore",
                ],
                "role_checks": role_checks,
                "fixture_only": True,
            }
        )
    )
finally:
    if process.poll() is None:
        process.terminate()
        process.wait(timeout=20)
    issuer.shutdown()
    log.close()
