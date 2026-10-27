"""Reuse only explicit synthetic fixture functions, without importing app factories."""

import ast
import json
import threading
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4


def functions(principal=None):
    source = Path("/fixture-fixtures.py").read_text()
    selected = [
        node
        for node in ast.parse(source).body
        if isinstance(node, ast.FunctionDef)
        and node.name in ("request", "seed_context", "controlled_model")
    ]
    if len(selected) != 3:
        raise ValueError("Synthetic engineering fixture contract changed")
    namespace = {
        "json": json,
        "threading": threading,
        "contextmanager": contextmanager,
        "BaseHTTPRequestHandler": BaseHTTPRequestHandler,
        "ThreadingHTTPServer": ThreadingHTTPServer,
        "uuid4": uuid4,
        "P": principal,
    }
    exec(  # noqa: S102 - fixed functions from reviewed readonly test source; no app factory or operator env
        compile(
            ast.Module(body=selected, type_ignores=[]), "/fixture-fixtures.py", "exec"
        ),
        namespace,
    )
    return namespace


def start_model():
    context = functions()["controlled_model"]("domains")
    upstream = context.__enter__()

    class Proxy(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def forward(self):
            import time

            import httpx

            if self.command == "POST":
                end = time.monotonic() + 120
                while (
                    Path("/tmp/chassis-qa-hold-model").exists()
                    and time.monotonic() < end
                ):
                    time.sleep(0.05)
            size = int(self.headers.get("Content-Length", "0"))
            with httpx.Client(trust_env=False, timeout=10) as client:
                response = client.request(
                    self.command,
                    upstream + self.path,
                    content=self.rfile.read(size) if size else None,
                )
            self.send_response(response.status_code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(response.content)))
            self.end_headers()
            self.wfile.write(response.content)

        do_GET = do_POST = forward

    server = ThreadingHTTPServer(("127.0.0.1", 0), Proxy)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return (context, server), "http://127.0.0.1:" + str(server.server_port)


def seed(client, folder, subject, team):
    principal = SimpleNamespace(subject_id=subject, team_id=team)
    return functions(principal)["seed_context"](
        client, folder, domains=True, suspension=True
    )
