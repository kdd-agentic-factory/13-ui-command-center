from pathlib import Path
import yaml

REQUIRED_FIELDS = ["id", "name", "domain", "description", "evidence", "mapped_risks"]

def main():
    data = yaml.safe_load(Path("controls/control-catalog.yaml").read_text())
    controls = data.get("controls", [])
    errors = []
    for ctrl in controls:
        for field in REQUIRED_FIELDS:
            if field not in ctrl:
                errors.append(f"{ctrl.get('id', 'unknown')}: missing {field}")
    if errors:
        for error in errors:
            print(error)
        raise SystemExit(1)
    print("Control catalog is valid.")

if __name__ == "__main__":
    main()
