from pathlib import Path
import yaml

def test_compliance_mappings_reference_valid_controls():
    catalog = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    valid_ids = {c["id"] for c in catalog.get("controls", [])}

    mappings = yaml.safe_load(Path("compliance-matrix.yaml").read_text())
    for mapping in mappings.get("mappings", []):
        ctrl_id = mapping.get("control_id")
        assert ctrl_id in valid_ids, f"Compliance mapping references unknown control: {ctrl_id}"

def test_compliance_mappings_have_at_least_one_framework():
    mappings = yaml.safe_load(Path("compliance-matrix.yaml").read_text())
    frameworks = ["iso27001", "nist_csf", "owasp_asvs", "owasp_llm_top10", "gdpr"]
    for mapping in mappings.get("mappings", []):
        has_framework = any(f in mapping for f in frameworks)
        assert has_framework, f"Control {mapping.get('control_id')} has no framework mapping"
