"""Synthetic issuer for isolated transport tests only; never part of product images."""

import json
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

USERS = {
    "fixture-a": "11111111-1111-4111-8111-111111111111",
    "fixture-b": "22222222-2222-4222-8222-222222222222",
    "fixture-reader": "33333333-3333-4333-8333-333333333333",
    "fixture-revoked": "44444444-4444-4444-8444-444444444444",
    "fixture-sub": "55555555-5555-4555-8555-555555555555",
    "fixture-admin": "66666666-6666-4666-8666-666666666666",
    "fixture-bsub": "77777777-7777-4777-8777-777777777777",
    "fixture-breader": "88888888-8888-4888-8888-888888888888",
    "fixture-badmin": "99999999-9999-4999-8999-999999999999",
}
TEAMS = {
    "fixture-a": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixture-b": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "fixture-reader": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixture-revoked": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixture-sub": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixture-admin": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    "fixture-bsub": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "fixture-breader": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    "fixture-badmin": "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
}
ROLES = {"fixture-admin": "admin", "fixture-reader": "reader", "fixture-breader":"reader", "fixture-badmin":"admin"}


class Issuer(BaseHTTPRequestHandler):
    def outage(self):
        control = Path('/qa-control/identity-mode')
        if control.exists() and control.read_text().strip() == 'issuer-down':
            self.send_error(503, 'Synthetic identity outage')
            return True
        return False
    def log_message(self, *args):
        pass

    def end_headers(self):
        if self.headers.get("Origin") == "http://127.0.0.1:3000":
            self.send_header("Access-Control-Allow-Origin", "http://127.0.0.1:3000")
            self.send_header("Access-Control-Allow-Credentials", "true")
            self.send_header("Vary", "Origin")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "authorization,apikey,content-type,x-csrf-token,x-client-info",
        )
        self.end_headers()

    def do_POST(self):
        if self.outage():
            return
        path = urlsplit(self.path).path
        size = int(self.headers.get("Content-Length", "0"))
        if size > 4096:
            self.send_error(413)
            return
        body = json.loads(self.rfile.read(size) or b"{}")
        sql = getattr(self.server, "sql_authority", None)
        if path.startswith("/api/database/rpc/") and sql is not None:
            token = self.headers.get("Authorization", "").removeprefix("Bearer ")
            status, data = sql.rpc(token, path.rsplit("/", 1)[-1], body)
            raw = json.dumps(data).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
            return
        cookie = SimpleCookie(self.headers.get("Cookie", ""))
        token = cookie["fixture_refresh"].value if "fixture_refresh" in cookie else ""
        if path == "/api/auth/sessions":
            token = body.get("email", "").removesuffix("@example.test")
            if body.get("password") != "fixture-password":
                token = ""
        elif path == "/api/auth/logout":
            self.send_response(200)
            self.send_header(
                "Set-Cookie",
                "fixture_refresh=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0",
            )
            self.end_headers()
            self.wfile.write(b"{}")
            return
        elif path != "/api/auth/refresh":
            self.send_error(404)
            return
        if token not in USERS:
            self.send_error(401)
            return
        data = {
            "accessToken": token,
            "csrfToken": "fixture-csrf",
            "user": {
                "id": USERS[token],
                "email": token + "@example.test",
                "profile": {"name": token},
            },
        }
        raw = json.dumps(data).encode()
        self.send_response(200)
        self.send_header(
            "Set-Cookie",
            "fixture_refresh=" + token + "; Path=/; HttpOnly; Secure; SameSite=None",
        )
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.outage():
            return
        token = self.headers.get("Authorization", "").removeprefix("Bearer ")
        if token not in USERS:
            self.send_error(401)
            return
        path = urlsplit(self.path).path
        if path == "/api/auth/sessions/current":
            data = {
                "user": {
                    "id": USERS[token],
                    "email": token + "@example.test",
                    "profile": {"name": token},
                }
            }
        elif path == "/api/database/records/chassis_team_memberships":
            sql = getattr(self.server, "sql_authority", None)
            if sql is not None:
                status, data = sql.memberships(token)
                raw = json.dumps(data).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return
            data = (
                [
                    {
                        "team_id": TEAMS[token],
                        "user_id": USERS[token],
                        "role": ROLES.get(token, "engineer"),
                        "active": True,
                    }
                ]
                if token != "fixture-revoked"
                else []
            )
        else:
            self.send_error(404)
            return
        body = json.dumps(data).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def start(cert, key, sql_authority=None):
    import ssl
    import threading

    server = ThreadingHTTPServer(("127.0.0.1", 9443), Issuer)
    server.sql_authority = sql_authority
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert, key)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server
