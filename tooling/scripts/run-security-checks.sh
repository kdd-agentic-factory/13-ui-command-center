#!/usr/bin/env bash
set -euo pipefail

echo "Running security checks..."

echo "[1/4] Validating risk register..."
python tooling/scripts/validate-risk-register.py

echo "[2/4] Validating approval matrix..."
python tooling/scripts/validate-approval-matrix.py

echo "[3/4] Validating control catalog..."
python tooling/scripts/validate-controls.py

echo "[4/4] Running tests..."
pytest -q tests/

echo "All security checks passed."
