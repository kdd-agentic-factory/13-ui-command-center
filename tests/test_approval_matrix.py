from pathlib import Path
import yaml

def test_high_and_critical_actions_require_approval():
    data = yaml.safe_load(Path("approvals/approval-matrix.yaml").read_text())
    entries = data.get("approval_matrix", [])
    for entry in entries:
        if entry.get("risk_level") in ["high", "critical"]:
            assert entry.get("approval_required") is True, (
                f"Action '{entry.get('action')}' is {entry.get('risk_level')} risk but approval_required is not True"
            )

def test_all_entries_have_required_fields():
    data = yaml.safe_load(Path("approvals/approval-matrix.yaml").read_text())
    entries = data.get("approval_matrix", [])
    required = ["action", "risk_level", "approval_required", "approver_role"]
    for entry in entries:
        for field in required:
            assert field in entry, f"Entry '{entry.get('action', 'unknown')}' missing field '{field}'"
