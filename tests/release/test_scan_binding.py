import importlib.util
import hashlib
import io
import json
import tarfile
from pathlib import Path

import pytest


def scanner():
    spec = importlib.util.spec_from_file_location(
        "scan", Path("scripts/scan-chassis-images.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def archive(path, *, legacy=False, corrupt=False):
    config = json.dumps({"architecture": "amd64", "os": "linux", "rootfs": {"type": "layers", "diff_ids": []}}).encode()
    config_id = "sha256:" + hashlib.sha256(config).hexdigest()
    config_path = config_id[7:] + ".json" if legacy else "blobs/sha256/" + config_id[7:]
    manifest = json.dumps({"schemaVersion": 2, "config": {"digest": config_id}, "layers": []}).encode()
    manifest_id = "sha256:" + hashlib.sha256(manifest).hexdigest()
    records = {config_path: b"{}" if corrupt else config,
               "manifest.json": json.dumps([{"Config": config_path}]).encode()}
    if not legacy:
        records["index.json"] = json.dumps({"manifests": [{"digest": manifest_id}]}).encode()
        records["blobs/sha256/" + manifest_id[7:]] = manifest
    with tarfile.open(path, "w") as stream:
        for name, raw in records.items():
            entry = tarfile.TarInfo(name)
            entry.size = len(raw)
            stream.addfile(entry, io.BytesIO(raw))
    return manifest_id, config_id


@pytest.mark.parametrize("legacy", [False, True])
def test_scanner_binds_exported_image_for_classic_and_containerd_stores(tmp_path, legacy):
    m = scanner()
    path = tmp_path / "image.tar"
    manifest_id, config_id = archive(path, legacy=legacy)
    assert m.archive_config_id(path, config_id) == config_id
    if not legacy:
        assert m.archive_config_id(path, manifest_id) == config_id
    with pytest.raises(ValueError):
        m.archive_config_id(path, "sha256:" + "c" * 64)


def test_scanner_rejects_config_bytes_that_do_not_match_the_bound_identity(tmp_path):
    m = scanner()
    path = tmp_path / "tampered.tar"
    manifest_id, _ = archive(path, corrupt=True)
    with pytest.raises(ValueError):
        m.archive_config_id(path, manifest_id)


def test_scanner_rejects_mismatched_or_incomplete_reports():
    m = scanner()
    config = "sha256:" + "b" * 64
    good = {
        "Metadata": {"ImageID": config, "OS": {"Family": "ubuntu"}},
        "Results": [{"Class": "os-pkgs", "Target": "image"}],
    }
    assert m.verify_report(good, config) is True
    with pytest.raises(ValueError):
        m.verify_report(good, "sha256:" + "c" * 64)
    with pytest.raises(ValueError):
        m.verify_report(dict(good, Results=[]), config)
    bad = dict(
        good, Results=[{"Class": "os-pkgs", "Vulnerabilities": [{"Severity": "HIGH"}]}]
    )
    with pytest.raises(ValueError):
        m.verify_report(bad, config)


def test_scan_failure_reports_do_not_expose_arbitrary_exception_text(tmp_path, monkeypatch, capsys):
    import sys
    m = scanner()
    images = tmp_path / 'images.json'
    images.write_text('{}')
    output = tmp_path / 'scan'
    output.mkdir()
    def fail(*args):
        raise ValueError('SENSITIVE_SENTINEL')
    monkeypatch.setattr(m, 'scan', fail)
    monkeypatch.setattr(sys, 'argv', ['scan', '--images', str(images), '--output', str(output), '--db-volume', 'fixture-db'])
    assert m.main() == 2
    report = (output / 'failure.json').read_text()
    assert 'SENSITIVE_SENTINEL' not in report + capsys.readouterr().out
    assert json.loads(report)['reason'] == 'scanner_execution_failed'
