# CI/CD and Supply Chain Threat Model

## Scope

The CI/CD pipeline and release supply chain.

## Key Threats

| ID | Category | Threat | Mitigation |
|---|---|---|---|
| T-CICD-01 | Tampering | Malicious code introduced via dependency | Dependency pinning, vulnerability scanning |
| T-CICD-02 | Tampering | CI pipeline configuration modified | Branch protection, PR review required |
| T-CICD-03 | Information Disclosure | Secret committed to repository | Secret scanning with gitleaks |
| T-CICD-04 | Elevation of Privilege | Release published without approval | Approval gate for production releases |
| T-CICD-05 | Tampering | Container image modified after build | Image digest pinning, image signing |

## Controls

- CTRL-005: Secret Scanning in CI
- CTRL-010: Container Image Scanning
- CTRL-002: Human Approval for Critical Actions
