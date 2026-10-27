"""Loopback HTTPS fault transport; absent from every product image."""

import json
import ssl
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import httpx


def start_transport(cert, key):
    control = Path("/qa-control")
    context = ssl.create_default_context(cafile=str(cert))

    class Transport(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def mode(self):
            source = control / "identity-mode"
            return source.read_text().strip() if source.exists() else "authenticated"

        def forward(self):
            if self.path.split("?")[0] == "/api/v1/identity/mode":
                end = time.monotonic() + 10
                while self.mode() == "hold" and time.monotonic() < end:
                    (control / "identity-held").write_text("held synthetic discovery")
                    time.sleep(0.05)
                mode = self.mode()
                if mode in ("local", "unknown", "down"):
                    body = json.dumps({"mode": mode}).encode()
                    self.send_response(503 if mode == "down" else 200)
                    self.send_header("Content-Type", "application/json")
                    self.send_header("Content-Length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
            size = int(self.headers.get("Content-Length", "0"))
            if size > 32 * 1024 * 1024:
                self.send_error(413)
                return
            with httpx.Client(verify=context, trust_env=False, timeout=20) as client:
                response = client.request(
                    self.command,
                    "https://127.0.0.1:8180" + self.path,
                    headers=dict(self.headers),
                    content=self.rfile.read(size) if size else None,
                )
            self.send_response(response.status_code)
            self.send_header(
                "Content-Type", response.headers.get("content-type", "application/json")
            )
            self.send_header("Content-Length", str(len(response.content)))
            self.end_headers()
            self.wfile.write(response.content)

        do_GET = do_POST = do_PUT = do_DELETE = forward

    server = ThreadingHTTPServer(("127.0.0.1", 8181), Transport)
    tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    tls.load_cert_chain(cert, key)
    server.socket = tls.wrap_socket(server.socket, server_side=True)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server
