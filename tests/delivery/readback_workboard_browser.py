"""Read-only reconciliation of the two exact browser fixture review IDs."""

import asyncio
import json
import ssl
from pathlib import Path

import httpx
from telemetry_dataset.persistence.bootstrap import load_cloud_app

report = {
    "scope": "browser_fixture_authoritative_readback",
    "status": "blocked",
    "decision_writes": 0,
    "records": {},
    "deployment": False,
}


async def main():
    accounts = json.loads(Path("/qa-private/accounts.json").read_text())
    expected = json.loads(Path("/qa/expected.json").read_text())
    operator = next(
        a for a in accounts["accounts"] if a["team"] == "A" and a["role"] == "engineer"
    )
    async with httpx.AsyncClient(
        verify=ssl.create_default_context(cafile="/run/cloud/identity_ca"),
        trust_env=False,
        follow_redirects=False,
        timeout=20,
    ) as remote:
        response = await remote.post(
            "https://czdpamk9.eu-central.insforge.app/api/auth/sessions?client_type=server",
            json={"email": operator["email"], "password": operator["password"]},
        )
        if response.status_code != 200:
            raise RuntimeError("Readback identity unavailable")
        bearer = response.json()["accessToken"]
    headers = {"Authorization": "Bearer " + bearer, "X-Team-ID": accounts["teams"]["A"]}
    app = load_cloud_app("/run/cloud/descriptor")
    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="https://qa.example",
            timeout=50,
        ) as api,
    ):
        for role in ["chief", "substitute"]:
            fixture = expected["pending"][role]
            actor = next(
                a
                for a in accounts["accounts"]
                if a["team"] == "A" and a["role"] == role
            )
            response = await api.get(
                "/api/v1/engineering/workboard/reviews/"
                + fixture["review_id"]
                + "/decision",
                headers=headers,
            )
            if response.status_code == 404:
                report["records"][role] = {"state": "absent"}
                continue
            if response.status_code != 200:
                raise RuntimeError("Readback is uncertain")
            value = response.json()
            if (
                value["actor_id"] != actor["id"]
                or value["review_id"] != fixture["review_id"]
                or value["delivery_digest"] != fixture["delivery_digest"]
                or value["note"] != expected["note"]
                or value["action"] != "accept"
                or value["task"]["id"] != fixture["task_id"]
                or value["task"]["state"] != "closed"
                or value["task"]["revision"] != 5
            ):
                raise RuntimeError("Readback decision differs from exact fixture")
            report["records"][role] = {
                "state": "accepted",
                "id": value["id"],
                "task_revision": value["task"]["revision"],
            }
    report["accepted_fixture_count"] = sum(
        r["state"] == "accepted" for r in report["records"].values()
    )
    report["status"] = "passed"


try:
    asyncio.run(main())
except (RuntimeError, KeyError, ValueError, httpx.HTTPError) as exc:
    report["error_type"] = type(exc).__name__
print(json.dumps(report))
if report["status"] != "passed":
    raise SystemExit(1)
