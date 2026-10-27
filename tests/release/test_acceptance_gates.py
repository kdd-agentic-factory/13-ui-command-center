import importlib.util
import json
from datetime import UTC
from pathlib import Path


def module():
    spec = importlib.util.spec_from_file_location(
        "acceptance", Path("tests/delivery/acceptance_evidence.py")
    )
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


def test_partial_gates_cannot_pass_isolated_acceptance():
    m = module()
    report = {"gates": {key: "passed" for key in m.REQUIRED}, "blockers": []}
    report["gates"].pop("pending_http_recovery")
    m.finalize(report)
    assert report["status"] == "blocked"
    assert report["publishable"] is False


def test_complete_isolated_evidence_never_authorizes_publication():
    m = module()
    report = {"gates": {key: "passed" for key in m.REQUIRED}, "blockers": []}
    m.finalize(report)
    assert report["status"] == "passed"
    assert report["scope"] == "isolated_fixture_acceptance"
    assert report["publishable"] is False and report["fixture_only"] is True
    report["blockers"].append("Owned cleanup failed")
    m.finalize(report)
    assert report["status"] == "failed"


def scan_fixture(tmp_path):
    import hashlib
    from test_scan_binding import archive as write_archive
    from datetime import datetime

    images = {
        name: {"reference": "synthetic-" + name, "digest": "sha256:" + "a" * 64}
        for name in ("api", "gateway", "worker", "frontend")
    }
    rows = {}
    for name, image in images.items():
        folder = tmp_path / name
        folder.mkdir()
        archive = folder / "image.tar"
        image["digest"], config = write_archive(archive)
        (folder / "scan.json").write_text(
            json.dumps(
                {
                    "Metadata": {"ImageID": config, "OS": {"Family": "ubuntu"}},
                    "Results": [{"Class": "os-pkgs", "Target": "synthetic"}],
                }
            )
        )
        rows[name] = {
            "image": image,
            "config_id": config,
            "archive_sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
            "status": "passed",
        }
    result = {
        "status": "passed",
        "scanner": "aquasec/trivy:0.76.1@sha256:790fd66d1697395d8693d1acaa1ea702406a20f109b6fc7bac8db623eca6c06c",
        "policy": ["HIGH", "CRITICAL"],
        "database_metadata": {
            "Version": 2,
            "UpdatedAt": datetime.now(UTC).isoformat(),
        },
        "images": rows,
    }
    path = tmp_path / "result.json"
    path.write_text(json.dumps(result))
    return path, images, result


def test_scan_gate_verifies_original_archives_and_raw_reports(tmp_path):
    path, images, _ = scan_fixture(tmp_path)
    assert module().verify_scans(path, images)["status"] == "passed"


import pytest


@pytest.mark.parametrize(
    "damage",
    [
        "missing_image",
        "high_in_raw",
        "stale_database",
        "tampered_archive",
        "different_image",
    ],
)
def test_scan_gate_fails_closed_for_damage(tmp_path, damage):
    import json

    path, images, data = scan_fixture(tmp_path)
    if damage == "missing_image":
        data["images"].pop("worker")
    elif damage == "stale_database":
        data["database_metadata"]["UpdatedAt"] = "2020-01-01T00:00:00Z"
    elif damage == "different_image":
        data["images"]["api"]["image"] = {
            "reference": "wrong",
            "digest": "sha256:" + "c" * 64,
        }
    elif damage == "tampered_archive":
        (tmp_path / "api/image.tar").write_bytes(b"altered")
    elif damage == "high_in_raw":
        raw = tmp_path / "api/scan.json"
        report = json.loads(raw.read_text())
        report["Results"][0]["Vulnerabilities"] = [{"Severity": "HIGH"}]
        raw.write_text(json.dumps(report))
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        module().verify_scans(path, images)
