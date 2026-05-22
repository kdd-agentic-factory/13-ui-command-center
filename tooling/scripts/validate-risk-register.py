from pathlib import Path
import yaml

REQUIRED_FIELDS = [
    "id", "title", "domain", "likelihood", "impact",
    "inherent_risk", "mitigation", "residual_risk", "owner", "status",
]

def main():
    data = yaml.safe_load(Path("risk-register.yaml").read_text())
    risks = data.get("risks", [])
    errors = []
    for risk in risks:
        for field in REQUIRED_FIELDS:
            if field not in risk:
                errors.append(f"{risk.get('id', 'unknown')}: missing {field}")
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("Risk register is valid.")

if __name__ == "__main__":
    main()
