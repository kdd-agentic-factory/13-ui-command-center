import hashlib
import importlib.util
from pathlib import Path

import pytest


def builder():
    spec = importlib.util.spec_from_file_location(
        "os_runtime_builder", Path("scripts/build-chassis-images.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_os_package_closure_checks_bytes_and_rejects_extra_or_missing_inputs(tmp_path):
    packages = tmp_path / "packages"
    packages.mkdir()
    package = packages / "fixture_1.0_amd64.deb"
    package.write_bytes(b"signed-package-fixture")
    lock = tmp_path / "packages.sha256"
    lock.write_text(
        hashlib.sha256(package.read_bytes()).hexdigest() + "  " + package.name + "\n"
    )
    assert builder().verify_os_packages(packages, lock) == [package]
    package.write_bytes(b"modified")
    with pytest.raises(ValueError):
        builder().verify_os_packages(packages, lock)
    package.write_bytes(b"signed-package-fixture")
    extra = packages / "unlocked_1.0_amd64.deb"
    extra.write_bytes(b"unlocked")
    with pytest.raises(ValueError):
        builder().verify_os_packages(packages, lock)
    extra.unlink()
    package.unlink()
    with pytest.raises(ValueError):
        builder().verify_os_packages(packages, lock)


@pytest.mark.parametrize(
    "entry",
    [
        "../escape.deb",
        "/root.deb",
        "fixture.deb\n" + "a" * 64 + "  fixture.deb",
        "fixture.py",
    ],
)
def test_os_package_lock_rejects_escape_duplicates_and_nonpackages(tmp_path, entry):
    lock = tmp_path / "packages.sha256"
    lock.write_text("a" * 64 + "  " + entry + "\n")
    with pytest.raises(ValueError):
        builder().verify_os_packages(tmp_path, lock)
