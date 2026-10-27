import hashlib
import importlib.util
from pathlib import Path

import pytest

spec = importlib.util.spec_from_file_location(
    "chassis_release", Path("scripts/resolve-chassis-release.py")
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def test_tree_fingerprint_rejects_escape_and_detects_dirty_content(tmp_path):
    root = tmp_path / "source"
    root.mkdir()
    (root / "main.py").write_text("control")
    first = mod.tree_fingerprint(root)
    (root / "main.py").write_text("changed")
    assert first != mod.tree_fingerprint(root)
    with pytest.raises(ValueError):
        mod.source_files(tmp_path / "missing")


def test_release_requires_pinned_hashes_and_source_parity(tmp_path):
    with pytest.raises(ValueError):
        mod.validate_release({"status": "unresolved"})
    with pytest.raises(ValueError):
        mod.validate_release(
            {"format": "1.0", "status": "resolved", "platform": "win/amd64"}
        )


def test_wheel_lock_records_exact_versions_and_hashes(tmp_path):
    (tmp_path / "demo_control-1.2.3-py3-none-any.whl").write_bytes(
        b"public-control-wheel"
    )
    lock = mod.wheel_lock(tmp_path)
    assert (
        "demo-control==1.2.3 --hash=sha256:"
        + hashlib.sha256(b"public-control-wheel").hexdigest()
        in lock
    )
    (tmp_path / "unsafe-1.0-cp312-cp312-win_amd64.whl").write_bytes(b"not Linux")
    with pytest.raises(ValueError):
        mod.wheel_lock(tmp_path)


def test_image_recipe_requires_immutable_base_and_offline_dependencies():
    root = Path("..")
    for repo, recipe in [
        ("18-telemetry-dataset", "Dockerfile.chassis"),
        ("01-agent-orchestrator", "Dockerfile.engineering-worker"),
        ("02-mcp-gateway", "Dockerfile.engineering"),
    ]:
        content = (root / repo / recipe).read_text()
        assert "ARG PYTHON_IMAGE\nFROM ${PYTHON_IMAGE}" in content
        assert "--require-hashes" in content and "--no-index" in content
        assert "USER 1000:1000" in content


def test_release_check_requires_locally_verified_image_identity(monkeypatch):
    def unavailable(*args, **kwargs):
        raise RuntimeError("image missing")

    monkeypatch.setattr(mod.subprocess, "run", unavailable)
    with pytest.raises(ValueError):
        mod.verify_bases(
            {
                "python": {
                    "reference": "python:3.12-slim-bookworm",
                    "digest": "sha256:" + "a" * 64,
                }
            }
        )


def test_resolved_lock_identity_matches_exact_bytes_on_windows(monkeypatch, tmp_path):
    import json
    import sys

    lock = tmp_path / "18-telemetry-dataset/requirements/chassis-runtime.lock"
    lock.parent.mkdir(parents=True)
    lock.write_bytes(b"fixture==1.0\r\n")
    bases = tmp_path / "bases.json"
    bases.write_text("{}")
    output = tmp_path / "resolved"
    monkeypatch.setattr(mod, "verify_bases", lambda value: value)
    monkeypatch.setattr(mod, "wheel_lock", lambda value: "fixture==1.0\n")
    monkeypatch.setattr(mod, "validate_release", lambda value: value)

    def assemble(root, destination):
        destination.mkdir()
        return {}

    monkeypatch.setattr(mod, "assemble_contexts", assemble)
    monkeypatch.setattr(
        sys,
        "argv",
        [
            "resolve",
            "--resolve",
            "--bases",
            str(bases),
            "--wheel-dir",
            str(tmp_path),
            "--source-root",
            str(tmp_path),
            "--output",
            str(output),
        ],
    )
    assert mod.main() == 0
    data = json.loads((output / "release.json").read_text())
    assert data["runtime_lock_sha256"] == hashlib.sha256(lock.read_bytes()).hexdigest()
