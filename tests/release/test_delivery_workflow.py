from pathlib import Path

import pytest


def test_automatic_workflows_cannot_publish_commercial_images():
    for path in [
        Path(".github/workflows/ci.yml"),
        Path("../18-telemetry-dataset/.github/workflows/ci.yml"),
    ]:
        text = path.read_text()
        assert "push: false" in text
        assert "push: ${{ github.ref" not in text
    assert "run: npm run typecheck" in Path(".github/workflows/ci.yml").read_text()


def test_manual_workflow_is_fail_closed_and_has_all_source_refs():
    text = Path(".github/workflows/chassis-delivery.yml").read_text()
    assert "workflow_dispatch" in text and "contents: read" in text
    for key in ["01", "02", "13", "17", "18"]:
        assert "ref_" + key in text
    assert "continue-on-error" not in text and "docker push" not in text


def test_candidate_workflow_builds_before_acceptance_and_never_promotes_itself():
    import yaml

    text = Path(".github/workflows/chassis-delivery.yml").read_text()
    steps = yaml.safe_load(text)["jobs"]["source-contract"]["steps"]
    runs = "\n".join(step.get("run", "") for step in steps)
    assert "check-chassis-promotion.py" not in runs
    assert (
        runs.index("build-chassis-images.py")
        < runs.index("scan-chassis-images.py")
        < runs.index("tests/delivery/run_stack.py")
    )
    assert "chassis-bases.lock.json" in runs
    assert any(
        step.get("if") == "always()"
        and step.get("uses", "").startswith("actions/upload-artifact@")
        for step in steps
    )


@pytest.mark.parametrize("missing", ["dirty", "tree_sha256"])
def test_promotion_rejects_missing_source_identity(monkeypatch, tmp_path, missing):
    import importlib.util
    import json
    import types

    spec = importlib.util.spec_from_file_location(
        "promotion", Path("scripts/check-chassis-promotion.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(
        module.subprocess,
        "run",
        lambda *a, **kw: types.SimpleNamespace(stdout="a" * 40),
    )
    source = {"git_ref": "a" * 40, "tree_sha256": "b" * 64, "dirty": False}
    source.pop(missing)
    data = {
        "format": "1.0",
        "platform": "linux/amd64",
        "runtime_lock_sha256": "c" * 64,
        "bases": {
            key: {"reference": reference, "digest": "sha256:" + "d" * 64}
            for key, reference in {
                "python": "python:3.12-slim-bookworm",
                "node": "node:24-bookworm-slim",
                "nginx": "nginx:1.30.6-alpine",
                "browser": "mcr.microsoft.com/playwright:v1.61.1-noble",
            }.items()
        },
        "status": "accepted",
        "publishable": True,
        "sources": {key: dict(source) for key in ["01", "02", "13", "17", "18"]},
        "gates": {
            key: "passed"
            for key in [
                "unit",
                "typecheck",
                "build",
                "http_stack",
                "browser",
                "recovery",
                "roles_and_human_authority",
                "image_scan",
                "aim_independent_reference",
                "two_d_independent_reference",
                "historical_key_revocation",
            ]
        },
    }
    file = tmp_path / "release.json"
    file.write_text(json.dumps(data))
    with pytest.raises(ValueError):
        module.check(file)


@pytest.mark.parametrize("case", ["match", "tree_drift", "dirty_checkout",
    "missing_aim", "missing_two_d", "missing_revocation", "pending_revocation", "fixture_only", "fixture_scope"])
def test_promotion_compares_current_checkout_and_sanitized_tree(
    monkeypatch, tmp_path, case
):
    import copy
    import importlib.util
    import json
    import types

    spec = importlib.util.spec_from_file_location(
        "promotion_complete", Path("scripts/check-chassis-promotion.py")
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    source = {"git_ref": "a" * 40, "tree_sha256": "b" * 64, "dirty": False}
    data = {
        "format": "1.0",
        "platform": "linux/amd64",
        "status": "accepted",
        "publishable": True,
        "runtime_lock_sha256": "c" * 64,
        "sources": {key: dict(source) for key in ["01", "02", "13", "17", "18"]},
        "bases": {
            key: {"reference": reference, "digest": "sha256:" + "d" * 64}
            for key, reference in {
                "python": "python:3.12-slim-bookworm",
                "node": "node:24-bookworm-slim",
                "nginx": "nginx:1.30.6-alpine",
                "browser": "mcr.microsoft.com/playwright:v1.61.1-noble",
            }.items()
        },
        "gates": {
            key: "passed"
            for key in [
                "unit",
                "typecheck",
                "build",
                "http_stack",
                "browser",
                "recovery",
                "roles_and_human_authority",
                "image_scan",
                "aim_independent_reference",
                "two_d_independent_reference",
                "historical_key_revocation",
            ]
        },
    }

    def git(args, **kwargs):
        return types.SimpleNamespace(
            stdout=(" M src/changed.py" if case == "dirty_checkout" else "")
            if args[1] == "status"
            else "a" * 40
        )

    monkeypatch.setattr(module.subprocess, "run", git)
    observed = copy.deepcopy(data["sources"])
    if case == "tree_drift":
        observed["17"]["tree_sha256"] = "e" * 64
    monkeypatch.setattr(module.release_inputs, "assemble_contexts", lambda *a: observed)
    if case == "fixture_only":
        data["fixture_only"] = True
    if case == "fixture_scope":
        data["scope"] = "isolated_fixture_acceptance"
    missing_gates = {"missing_aim": "aim_independent_reference", "missing_two_d": "two_d_independent_reference",
                     "missing_revocation": "historical_key_revocation"}
    if case in missing_gates:
        data["gates"].pop(missing_gates[case])
    if case == "pending_revocation":
        data["gates"]["historical_key_revocation"] = "pending"
    file = tmp_path / "release.json"
    file.write_text(json.dumps(data))
    if case == "match":
        assert module.check(file) == data
    else:
        with pytest.raises(ValueError):
            module.check(file)


def test_manual_acceptance_requires_installed_agents_and_sql_human_authority():
    text = Path(".github/workflows/chassis-delivery.yml").read_text()
    assert "--engineering-fixture" in text
    assert "postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea" in text
    assert "candidate-acceptance/human-sql-result.json" in text


def test_ci_requires_bound_scan_and_pending_recovery_evidence():
    text=Path(".github/workflows/chassis-delivery.yml").read_text()
    assert "--scan-report candidate-scans/result.json" in text
    assert "candidate-acceptance/pending-recovery-result.json" in text
    assert "candidate-acceptance/bad-proxy-result.json" in text


def test_public_inputs_have_a_manual_reproducible_producer():
    import yaml
    path=Path('.github/workflows/chassis-public-inputs.yml')
    assert path.is_file(), 'Coordinated CI cannot depend on an unproducible artifact'
    text=path.read_text();data=yaml.safe_load(text)
    assert 'workflow_dispatch' in text and data['permissions']['contents']=='read'
    assert 'chassis-public-build-inputs' in text
    assert '--require-hashes' in text and 'sha256sum --strict -c' in text
    assert '--only-binary=:all:' in text and '--network none' in text
    assert 'docker push' not in text and 'continue-on-error' not in text


def test_coordinated_checkout_excludes_restricted_data_and_runs_release_contracts():
    import yaml
    steps=yaml.safe_load(Path('.github/workflows/chassis-delivery.yml').read_text())['jobs']['source-contract']['steps']
    dataset=next(s for s in steps if s.get('with',{}).get('path')=='18-telemetry-dataset')
    assert '!/data/' in dataset['with'].get('sparse-checkout','')
    assert dataset['with']['sparse-checkout-cone-mode'] is False
    assert any('pytest' in s.get('run','') and 'tests/release' in s.get('run','') for s in steps)


def test_standalone_policy_job_does_not_require_sibling_repositories():
    import yaml
    steps = yaml.safe_load(Path('.github/workflows/run-policy-tests.yml').read_text())['jobs']['test']['steps']
    command = next(step['run'] for step in steps if step.get('name') == 'Run tests')
    assert 'tests/test_*.py' in command
    assert 'tests/release/test_sql_fixture_contract.py' in command
    assert 'tests/' not in command.split()


def test_cross_repository_contracts_are_mandatory_in_coordinated_ci():
    import yaml
    steps = yaml.safe_load(Path('.github/workflows/chassis-delivery.yml').read_text())['jobs']['source-contract']['steps']
    run = next(s['run'] for s in steps if s.get('name') == 'Cross-repository source contracts')
    assert '01-agent-orchestrator' in run and '02-mcp-gateway' in run
    assert "'-m', 'cross_repository'" in run
    assert 'check=True' in run
