"""The isolated issuer must exercise SDK cookie refresh, not token injection."""

import importlib.util
import json
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


def test_browser_session_cookie_refresh_and_cors():
    spec = importlib.util.spec_from_file_location(
        "issuer", Path("tests/delivery/identity_fixture.py")
    )
    issuer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(issuer)
    server = ThreadingHTTPServer(("127.0.0.1", 0), issuer.Issuer)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        body = json.dumps(
            {"email": "fixture-a@example.test", "password": "fixture-password"}
        ).encode()
        request = Request(
            base + "/api/auth/sessions",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Origin": "http://127.0.0.1:3000",
            },
        )
        with urlopen(request) as response:
            assert response.status == 200
            assert (
                response.headers["Access-Control-Allow-Origin"]
                == "http://127.0.0.1:3000"
            )
            cookie = response.headers["Set-Cookie"]
            assert "HttpOnly" in cookie and "Secure" in cookie
            assert json.load(response)["accessToken"] == "fixture-a"
        with urlopen(
            Request(
                base + "/api/auth/refresh",
                data=b"{}",
                headers={"Cookie": cookie.split(";")[0]},
            )
        ) as response:
            assert json.load(response)["user"]["id"] == issuer.USERS["fixture-a"]
        try:
            urlopen(Request(base + "/api/auth/refresh", data=b"{}"))
            assert False, "Missing cookie must not create a session"
        except HTTPError as error:
            assert error.code == 401
    finally:
        server.shutdown()
        thread.join(timeout=2)
        server.server_close()
