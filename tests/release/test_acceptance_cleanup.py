import importlib.util
from pathlib import Path
from types import SimpleNamespace


def test_cleanup_has_its_own_budget_after_acceptance_deadline(monkeypatch, tmp_path):
    monkeypatch.syspath_prepend(str(Path('tests/delivery').resolve()))
    spec = importlib.util.spec_from_file_location(
        "stack", Path("tests/delivery/run_stack.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    calls = []

    def command(args, **kwargs):
        calls.append((args, kwargs))
        return SimpleNamespace(returncode=0, stdout="", stderr="")

    monkeypatch.setattr(module.subprocess, "run", command)
    monkeypatch.setattr(module.time, "monotonic", lambda: 999999999)
    report = {"blockers": []}
    module.cleanup_owned(
        ["chassis-test-fixture-api"], "chassis-test-fixture-state", tmp_path, report
    )
    assert any(args[1:3] == ["rm", "-f"] for args, kwargs in calls)
    assert any(args[1:3] == ["volume", "rm"] for args, kwargs in calls)
    assert all(0 < kwargs["timeout"] <= 30 for args, kwargs in calls)
    assert report["blockers"] == []
