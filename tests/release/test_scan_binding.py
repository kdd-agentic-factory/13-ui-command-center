import importlib.util
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


def archive(path, digest):
    with tarfile.open(path, "w") as stream:
        for name, value in [
            ("index.json", {"manifests": [{"digest": digest}]}),
            ("manifest.json", [{"Config": "blobs/sha256/" + "b" * 64}]),
        ]:
            raw = json.dumps(value).encode()
            entry = tarfile.TarInfo(name)
            entry.size = len(raw)
            stream.addfile(entry, io.BytesIO(raw))


def test_scanner_binds_oci_index_and_config_instead_of_assuming_equal_ids(tmp_path):
    m = scanner()
    path = tmp_path / "image.tar"
    archive(path, "sha256:" + "a" * 64)
    assert m.archive_config_id(path, "sha256:" + "a" * 64) == "sha256:" + "b" * 64
    with pytest.raises(ValueError):
        m.archive_config_id(path, "sha256:" + "c" * 64)


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
