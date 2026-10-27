import importlib.util
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock


def module():
    spec = importlib.util.spec_from_file_location(
        "fixture_permissions", Path("tests/delivery/fixture_permissions.py")
    )
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def test_posix_shared_paths_use_only_their_own_groups(monkeypatch):
    m = module()
    monkeypatch.setattr(m, "IS_POSIX", True)
    path = SimpleNamespace(stat=lambda: SimpleNamespace(st_gid=2001), chmod=Mock())
    assert m.group_args(path, path) == ["--group-add", "2001"]
    m.share_directory(path)
    path.chmod.assert_called_once_with(0o770)
    assert m.transfer_mode() == 0o640


def test_windows_does_not_fake_posix_groups(monkeypatch):
    m = module()
    monkeypatch.setattr(m, "IS_POSIX", False)
    assert m.group_args(None) == []
    assert m.transfer_mode() == 0o600
