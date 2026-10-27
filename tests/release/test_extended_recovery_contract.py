from pathlib import Path


def test_installed_acceptance_exercises_pending_http_recovery():
    runner = Path("tests/delivery/run_stack.py").read_text()
    assert "accept_pending_recovery(" in runner
    prepare = Path("tests/delivery/prepare_pending.py").read_text()
    recover = Path("tests/delivery/recover_pending.py").read_text()
    assert "engineering.control_claim" in prepare
    assert "local_model_json" in prepare
    assert "verify_backup" in recover
    assert "restored_not_activated" in recover
    assert "quarantine_until" in recover
    assert "execution_grant" in recover
