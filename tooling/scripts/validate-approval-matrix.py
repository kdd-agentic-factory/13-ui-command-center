from pathlib import Path
import yaml

def main():
    data = yaml.safe_load(Path("approvals/approval-matrix.yaml").read_text())
    entries = data.get("approval_matrix", [])
    errors = []
    for entry in entries:
        if entry.get("risk_level") in ["high", "critical"] and not entry.get("approval_required"):
            errors.append(f"{entry.get('action')}: high/critical action must require approval")
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("Approval matrix is valid.")

if __name__ == "__main__":
    main()
