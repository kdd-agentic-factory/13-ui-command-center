"""Isolated integration evidence is never permission to publish a release."""

import hashlib
import importlib.util
import json
from datetime import UTC, datetime
from pathlib import Path

REQUIRED = (
    "http_stack",
    "frontend_health",
    "installed_agent_pipeline",
    "cold_recovery",
    "role_boundaries",
    "browser_authenticated",
    "identity_scenarios",
    "isolated_human_authority",
    "proxy_ca_rejection",
    "pending_http_recovery",
    "image_scan",
)


def finalize(report):
    report.update(
        scope="isolated_fixture_acceptance",
        publishable=False,
        fixture_only=True,
        required_gates=list(REQUIRED),
    )
    gates = report["gates"]

    def complete(*names):
        return (
            "passed"
            if all(gates.get(name) == "passed" for name in names)
            else "blocked"
        )

    gates["browser"] = complete("browser_authenticated", "identity_scenarios")
    gates["recovery"] = complete("cold_recovery", "pending_http_recovery")
    gates["roles_and_human_authority"] = complete(
        "role_boundaries", "isolated_human_authority"
    )
    for name in ("real_ai", "external_provider_rls", "aim_2d_reference"):
        gates[name] = "blocked"
    report["limits"] = [
        "Synthetic acquisition and controlled model only",
        "External provider RLS, real AI and acquisition references require separate acceptance",
        "No publication, deployment or clean-source promotion authorized by this result",
    ]
    report["status"] = (
        "failed"
        if report["blockers"]
        else (
            "passed"
            if all(gates.get(name) == "passed" for name in REQUIRED)
            else "blocked"
        )
    )
    report["missing_required_gates"] = [
        name for name in REQUIRED if gates.get(name) != "passed"
    ]


def verify_scans(path, images):
    path = Path(path).resolve()
    data = json.loads(path.read_text())
    spec = importlib.util.spec_from_file_location(
        "fixed_scanner", Path(__file__).parents[2] / "scripts/scan-chassis-images.py"
    )
    scanner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(scanner)
    if (
        data.get("status") != "passed"
        or data.get("scanner") != scanner.SCANNER
        or data.get("policy") != ["HIGH", "CRITICAL"]
    ):
        raise ValueError("Scanner result is incomplete or uses another policy/runtime")
    metadata = data["database_metadata"]
    age = (
        datetime.now(UTC)
        - datetime.fromisoformat(metadata["UpdatedAt"])
    ).total_seconds()
    if metadata["Version"] != 2 or not -300 <= age <= 86400:
        raise ValueError("Scanner database is stale or invalid")
    if set(data["images"]) != set(images):
        raise ValueError("Scanner images are incomplete")
    for name, image in images.items():
        result = data["images"][name]
        if result["status"] != "passed" or result["image"] != image:
            raise ValueError("Scanner image identity mismatch")
        archive = path.parent / name / "image.tar"
        with archive.open("rb") as stream:
            if (
                hashlib.file_digest(stream, "sha256").hexdigest()
                != result["archive_sha256"]
            ):
                raise ValueError("Scanned archive changed")
        config = scanner.archive_config_id(archive, image["digest"])
        if config != result["config_id"]:
            raise ValueError("Scanned config identity mismatch")
        scanner.verify_report(
            json.loads((path.parent / name / "scan.json").read_text()), config
        )
    return {
        "status": "passed",
        "checked": [
            "fresh database",
            "all four exact image archives",
            "raw scanner reports",
        ],
        "report_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }
