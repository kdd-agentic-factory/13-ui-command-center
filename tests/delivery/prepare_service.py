"""Fixture-only wrapper; final images keep their real production entrypoints."""

import os
import shutil
import sys
import tempfile
from pathlib import Path


def main():
    root = Path(tempfile.mkdtemp(prefix="private-fixture-"))
    role = sys.argv[1]
    allowed = {
        "api": [
            "cert.pem",
            "key.pem",
            "probe_key",
            "backend_key",
            "signing_key",
            "control_key",
        ],
        "gateway": [
            "cert.pem",
            "gateway_key",
            "backend_key",
            "signing_key",
            "control_key",
        ],
        "worker": ["gateway_key", "control_key"],
    }[role]
    for name in allowed:
        shutil.copyfile("/fixture/" + name, root / name)
        (root / name).chmod(0o600)
    if role == "api":
        from identity_fixture import start

        sql = None
        if os.environ.get("KDD_DELIVERY_ENGINEERING_FIXTURE") == "1":
            from engineering_fixture import start_model
            from identity_fixture import ROLES, TEAMS, USERS
            from sql_authority_fixture import SQLAuthority

            sql = SQLAuthority(USERS, TEAMS, ROLES, (root / "backend_key").read_text())
            _model_context, model_url = start_model()
            os.environ.update(
                TDS_ENGINEERING_AUTHORITY_MODE="insforge",
                TDS_ENGINEERING_AUTHORITY_URL="https://127.0.0.1:9443",
                TDS_ENGINEERING_AUTHORITY_SERVICE_KEY_FILE=str(root / "backend_key"),
                TDS_ENGINEERING_MODEL_NAME="controlled-qa",
                TDS_ENGINEERING_MODEL_URL=model_url,
            )
        start(root / "cert.pem", root / "key.pem", sql)
        if sql is not None:
            from identity_transport import start_transport
            start_transport(root / "cert.pem", root / "key.pem")
        os.environ.update(
            TDS_PRODUCT_PROFILE="chassis",
            TDS_APP_ENV="production",
            TDS_IDENTITY_MODE="authenticated",
            TDS_IDENTITY_URL="https://127.0.0.1:9443",
            TDS_IDENTITY_CA_FILE=str(root / "cert.pem"),
            TDS_IDENTITY_ANON_KEY="public-fixture-only",
            TDS_CORS_ORIGINS="http://127.0.0.1:3000",
            TDS_STATE_ROOT="/var/lib/chassis",
            TDS_TLS_CERT_FILE=str(root / "cert.pem"),
            TDS_TLS_KEY_FILE=str(root / "key.pem"),
            TDS_OPERATIONS_PROBE_KEY_FILE=str(root / "probe_key"),
            TDS_ENGINEERING_INTERNAL_API_KEY_FILE=str(root / "backend_key"),
            TDS_ENGINEERING_CONTROL_KEY_FILE=str(root / "control_key"),
            TDS_ENGINEERING_SIGNING_KEY_FILE=str(root / "signing_key"),
            TDS_HOST="127.0.0.1",
            TDS_PORT="8180",
        )
        from telemetry_dataset.operations.server import main

        main()
    elif role == "gateway":
        os.environ.update(
            ENGINEERING_BACKEND_URL="https://127.0.0.1:8180",
            ENGINEERING_BACKEND_CA_FILE=str(root / "cert.pem"),
            MCP_INTERNAL_API_KEY_FILE=str(root / "gateway_key"),
            ENGINEERING_INTERNAL_API_KEY_FILE=str(root / "backend_key"),
            ENGINEERING_CONTROL_KEY_FILE=str(root / "control_key"),
            ENGINEERING_SIGNING_KEY_FILE=str(root / "signing_key"),
        )
        from mcp_gateway.engineering_app import main

        main()
    else:
        os.environ.update(
            MCP_GATEWAY_URL="http://127.0.0.1:8010",
            MCP_INTERNAL_API_KEY_FILE=str(root / "gateway_key"),
            ENGINEERING_CONTROL_KEY_FILE=str(root / "control_key"),
        )
        from orchestrator.engineering.worker import main

        sys.argv = [sys.argv[0]]
        main()


if __name__ == "__main__":
    main()

