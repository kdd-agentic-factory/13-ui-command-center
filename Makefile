.PHONY: test validate-risk validate-approvals validate-controls security-checks compliance-report evidence

test:
	pytest -q tests/

validate-risk:
	python tooling/scripts/validate-risk-register.py

validate-approvals:
	python tooling/scripts/validate-approval-matrix.py

validate-controls:
	python tooling/scripts/validate-controls.py

security-checks:
	bash tooling/scripts/run-security-checks.sh

compliance-report:
	python tooling/scripts/generate-compliance-report.py

evidence:
	python tooling/scripts/generate-security-evidence.py
