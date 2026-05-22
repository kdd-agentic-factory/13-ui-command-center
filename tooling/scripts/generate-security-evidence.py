from pathlib import Path
import yaml
import json
from datetime import datetime

def main():
    evidence = {
        "generated_at": datetime.utcnow().isoformat(),
        "policies": [],
        "controls": [],
        "risks": [],
        "approval_matrix": [],
    }

    for policy_file in Path("policies").glob("*.md"):
        evidence["policies"].append(policy_file.name)

    controls_data = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    evidence["controls"] = [c["id"] for c in controls_data.get("controls", [])]

    risks_data = yaml.safe_load(Path("risk-register.yaml").read_text())
    evidence["risks"] = [{"id": r["id"], "status": r["status"]} for r in risks_data.get("risks", [])]

    approval_data = yaml.safe_load(Path("approvals/approval-matrix.yaml").read_text())
    evidence["approval_matrix"] = [e["action"] for e in approval_data.get("approval_matrix", [])]

    output = json.dumps(evidence, indent=2)
    print(output)
    Path("security-evidence.json").write_text(output)
    print("Evidence written to security-evidence.json", file=__import__("sys").stderr)

if __name__ == "__main__":
    main()
