"""Wrong upstream CA must deny telemetry while the real nginx UI stays up."""

import json
import time

import httpx

with httpx.Client(trust_env=False, timeout=3) as client:
    for _ in range(100):
        try:
            if client.get("http://127.0.0.1:3001/pit-wall/app").status_code == 200:
                break
        except httpx.HTTPError:
            pass
        time.sleep(0.1)
    else:
        raise AssertionError("Wrong-CA nginx did not start")
    result = client.get("http://127.0.0.1:3001/api/telemetry/api/v1/identity/mode")
    assert result.status_code == 502, "Wrong CA did not deny upstream"
    print(
        json.dumps(
            {
                "status": "passed",
                "checks": ["nginx UI reachable", "wrong upstream CA returns502"],
            }
        )
    )
