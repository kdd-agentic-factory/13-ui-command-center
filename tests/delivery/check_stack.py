"""HTTP assertions against real services in the isolated shared network namespace."""

import json
import ssl
import time
from pathlib import Path

import httpx
from identity_fixture import TEAMS

context = ssl.create_default_context(cafile="/fixture/cert.pem")
with httpx.Client(verify=context, trust_env=False, timeout=5) as c:
    for _ in range(120):
        try:
            if (
                c.get("https://127.0.0.1:8180/api/v1/health").status_code == 200
                and c.get("http://127.0.0.1:3000/health").status_code == 200
            ):
                break
        except httpx.HTTPError:
            pass
        time.sleep(0.25)
    else:
        raise AssertionError("Services unavailable")
    proxy = "http://127.0.0.1:3000/api/telemetry"
    assert c.get(proxy + "/api/v1/teams").status_code == 401
    headers = {"Authorization": "Bearer fixture-a", "X-Team-ID": TEAMS["fixture-a"]}
    response = c.get(proxy + "/api/v1/recorded", headers=headers)
    assert response.status_code == 200, response.text
    assert (
        c.get(
            proxy + "/api/v1/recorded",
            headers={**headers, "X-Team-ID": TEAMS["fixture-b"]},
        ).status_code
        == 403
    )
    for path in [
        "/api/v1/internal/readiness",
        "/api/v1/tools",
        "/api/v1/catalog",
        "/api/v1/%74eams",
    ]:
        assert c.get(proxy + path, headers=headers).status_code in [
            400,
            401,
            403,
            404,
        ], path
    for _ in range(120):
        try:
            gateway = c.get(
                "http://127.0.0.1:8010/api/v1/tools",
                headers={
                    "X-Internal-API-Key": Path("/fixture/gateway_key").read_text(),
                    "X-Principal-ID": "engineering-orchestrator",
                    "X-Principal-Role": "engineering_service",
                },
            )
            if gateway.status_code == 200:
                break
        except httpx.HTTPError:
            pass
        time.sleep(0.25)
    else:
        raise AssertionError("Private gateway unavailable")
    assert all(name.startswith("engineering.") for name in gateway.json()["tools"])
    assert c.get("http://127.0.0.1:8010/api/v1/tools").status_code == 401
    control = c.post(
        "http://127.0.0.1:8010/api/v1/tools/call",
        headers={
            "X-Internal-API-Key": Path("/fixture/gateway_key").read_text(),
            "X-Principal-ID": "engineering-orchestrator",
            "X-Principal-Role": "engineering_service",
        },
        json={
            "tool": "engineering.control_claim",
            "payload": {"worker_id": "fixture-control-probe"},
            "workflow_id": "fixture-control-probe",
            "coordinator_capability": Path("/fixture/control_key").read_text(),
        },
    )
    assert control.status_code == 200, control.status_code
    result = control.json()
    assert result.get("success") is True, "Private control operation failed"
    assert result["result"]["lease"] is None

    from check_roles import check_role_boundaries

    role_checks = check_role_boundaries(c, base=proxy + "/api/v1")

    print(
        json.dumps(
            {
                "status": "passed",
                "role_checks": role_checks,
                "checks": [
                    "nginx to API verified TLS",
                    "authenticated recording list",
                    "foreign-team denial",
                    "legacy/internal/encoded denied",
                    "private engineering gateway",
                ],
            }
        )
    )
