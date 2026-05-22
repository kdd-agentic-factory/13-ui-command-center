from pathlib import Path
import yaml

REQUIRED_FIELDS = ["id", "name", "domain", "description", "evidence", "mapped_risks"]

def test_control_catalog_entries_have_required_fields():
    data = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    controls = data.get("controls", [])
    assert len(controls) > 0, "Control catalog must have at least one entry"
    for ctrl in controls:
        for field in REQUIRED_FIELDS:
            assert field in ctrl, f"Control '{ctrl.get('id', 'unknown')}' missing field '{field}'"

def test_control_ids_are_unique():
    data = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    ids = [c["id"] for c in data.get("controls", [])]
    assert len(ids) == len(set(ids)), "Control IDs must be unique"
