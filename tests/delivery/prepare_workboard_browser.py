"""Create two explicit synthetic inspection deliveries, no human decisions.

Run against installed API package with operator-owned read-only QA credentials.
Stable operation IDs come from a pre-created non-secret plan for safe recovery.
"""

import asyncio
import json
import ssl
from pathlib import Path
from uuid import UUID

import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app

report = {
    "scope": "immutable_workboard_browser_fixture",
    "status": "blocked",
    "deployment": False,
    "human_decisions_written": 0,
    "accounts_modified": False,
    "designations_modified": False,
    "gates": [],
}


def gate(name, condition):
    report["gates"].append({"name": name, "passed": bool(condition)})
    if not condition:
        raise RuntimeError("Synthetic fixture preparation failed")


async def main():
    accounts = json.loads(Path("/qa-private/accounts.json").read_text())
    plan = json.loads(Path("/qa/operations.json").read_text())
    for operation in plan.values():
        gate("canonical_operation", str(UUID(operation)) == operation)
    origin = "https://czdpamk9.eu-central.insforge.app"
    descriptor = json.loads(Path("/run/cloud/descriptor").read_text())
    gate("exact_identity_origin", descriptor["identity_url"] == origin)
    engineer = next(
        a for a in accounts["accounts"] if a["team"] == "A" and a["role"] == "engineer"
    )
    async with httpx.AsyncClient(
        verify=ssl.create_default_context(cafile="/run/cloud/identity_ca"),
        trust_env=False,
        follow_redirects=False,
        timeout=20,
    ) as remote:
        response = await remote.post(
            origin + "/api/auth/sessions?client_type=server",
            json={"email": engineer["email"], "password": engineer["password"]},
        )
        gate("real_engineer_login", response.status_code == 200)
        bearer = response.json()["accessToken"]
    headers = {
        "Authorization": "Bearer " + bearer,
        "X-Team-ID": accounts["teams"]["A"],
        "X-Workflow-ID": "synthetic-workboard-browser-qa",
        "X-Trace-ID": plan["session"],
    }
    application = load_cloud_app("/run/cloud/descriptor")
    async with (
        application.router.lifespan_context(application),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=application),
            base_url="https://qa.example",
            timeout=50,
        ) as api,
    ):
        async def call(label, path, body=None):
            response = await api.request(
                "POST" if body is not None else "GET",
                "/api/v1/engineering" + path,
                headers=headers,
                **({"json": body} if body is not None else {}),
            )
            report["last_http_status"] = response.status_code
            gate(label, response.status_code == 200)
            return response.json()

        name = "SYNTHETIC QA WORKBOARD BROWSER " + plan["session"][:8]
        session = await call(
            "synthetic_session",
            "/sessions",
            {
                "operation_id": plan["session"],
                "body": {"name": name, "provenance": "synthetic"},
            },
        )
        sid = session["id"]
        snapshot = await call(
            "server_snapshot",
            f"/sessions/{sid}/snapshots",
            {
                "operation_id": plan["snapshot"],
                "expected_revision": 1,
                "selection": {
                    "recordings": [],
                    "comparison": None,
                    "setup_a": None,
                    "setup_b": None,
                    "binding": None,
                    "calibration": None,
                    "validation": None,
                    "environment": None,
                },
            },
        )
        gate("synthetic_snapshot_not_physical", snapshot["analyzable"] is False)
        designation = await call("current_designation", "/settings/crew-chief")
        expected = {
            "session_id": sid,
            "session_name": name,
            "pending": {},
            "note": "SYNTHETIC QA browser delivery acceptance only; no mechanical authorization",
        }
        for role in ["chief", "substitute"]:
            account = next(
                a
                for a in accounts["accounts"]
                if a["team"] == "A" and a["role"] == role
            )
            gate(
                "current_designated_" + role,
                designation["primary_id" if role == "chief" else "substitute_id"]
                == account["id"],
            )
            title = "SYNTHETIC QA inspection " + role + " " + plan["session"][:8]
            task = await call(
                "create_" + role,
                f"/sessions/{sid}/workboard/tasks",
                {
                    "operation_id": plan[role + "_create"],
                    "expected_session_revision": 1,
                    "body": {
                        "title": title,
                        "instructions": "Software delivery acceptance only; no mechanical work",
                        "kind": "inspection",
                        "target_profile": "engineer",
                        "acceptance": "Immutable task delivery and authorized human decision recover after reload",
                    },
                },
            )
            tid = task["id"]
            for revision, target in [(1, "pending"), (2, "in_progress")]:
                await call(
                    "transition_" + role + "_" + target,
                    f"/workboard/tasks/{tid}/transitions",
                    {
                        "operation_id": plan[role + "_" + target],
                        "expected_revision": revision,
                        "target": target,
                    },
                )
            package = await call(
                "submit_" + role,
                f"/workboard/tasks/{tid}/submissions",
                {
                    "operation_id": plan[role + "_submit"],
                    "expected_revision": 3,
                    "body": {
                        "summary": "SYNTHETIC QA inspection delivered for browser acceptance",
                        "limitations": "No telemetry, physical conclusion or mechanical authorization",
                        "snapshot_ids": [snapshot["id"]],
                    },
                },
            )
            recovered = await call(
                "latest_delivery_" + role, f"/workboard/tasks/{tid}/latest-review"
            )
            gate("exact_latest_" + role, recovered == package)
            response = await api.get(
                f"/api/v1/engineering/workboard/reviews/{package['review']['id']}/decision",
                headers=headers,
            )
            gate("no_previous_decision_" + role, response.status_code == 404)
            expected["pending"][role] = {
                "task_id": tid,
                "task_title": title,
                "review_id": package["review"]["id"],
                "delivery_digest": package["digest"],
                "expected_revision": 4,
                "designation_revision": designation["revision"],
            }
        report["expected"] = expected
        report["status"] = "passed"


try:
    asyncio.run(main())
except (RuntimeError, KeyError, ValueError, httpx.HTTPError) as exc:
    report["error_type"] = type(exc).__name__
print(json.dumps(report))
if report["status"] != "passed":
    raise SystemExit(1)
