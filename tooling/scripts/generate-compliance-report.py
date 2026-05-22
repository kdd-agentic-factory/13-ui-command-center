from pathlib import Path
import yaml
from datetime import date

def main():
    controls = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    risks = yaml.safe_load(Path("risk-register.yaml").read_text())
    mappings = yaml.safe_load(Path("compliance-matrix.yaml").read_text())

    print(f"# Compliance Report — {date.today()}")
    print()
    print(f"## Controls: {len(controls['controls'])} defined")
    print(f"## Risks: {len(risks['risks'])} tracked")
    print(f"## Compliance mappings: {len(mappings['mappings'])} controls mapped")
    print()

    open_risks = [r for r in risks["risks"] if r["status"] == "open"]
    mitigated_risks = [r for r in risks["risks"] if r["status"] == "mitigated"]
    print(f"## Open risks: {len(open_risks)}")
    print(f"## Mitigated risks: {len(mitigated_risks)}")
    print()

    print("## Open risks requiring attention:")
    for r in open_risks:
        print(f"  - {r['id']}: {r['title']} (residual: {r['residual_risk']})")

if __name__ == "__main__":
    main()
