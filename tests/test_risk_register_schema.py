from pathlib import Path
import yaml

REQUIRED_FIELDS = [
    "id", "title", "domain", "likelihood", "impact",
    "inherent_risk", "mitigation", "residual_risk", "owner", "status",
]

def test_risk_register_entries_have_required_fields():
    data = yaml.safe_load(Path("risk-register.yaml").read_text())
    risks = data.get("risks", [])
    assert len(risks) > 0, "Risk register must have at least one entry"
    for risk in risks:
        for field in REQUIRED_FIELDS:
            assert field in risk, f"Risk '{risk.get('id', 'unknown')}' missing field '{field}'"

def test_risk_ids_are_unique():
    data = yaml.safe_load(Path("risk-register.yaml").read_text())
    ids = [r["id"] for r in data.get("risks", [])]
    assert len(ids) == len(set(ids)), "Risk IDs must be unique"
