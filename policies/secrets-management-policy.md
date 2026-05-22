# Secrets Management Policy

## Rules

- Secrets must never be hardcoded in source code.
- Secrets must never be committed to any repository.
- Secrets must be injected at runtime via a secrets manager or CI/CD vault.
- Secret references (not values) may appear in configuration files.

## Allowed Storage

- Kubernetes Secrets (sealed or external secrets operator)
- CI/CD secrets vault
- Approved secrets manager

## Forbidden Storage

Source code, Docker images, log files, documentation files, environment files committed to git.

## Rotation

- API keys: every 90 days or on suspected compromise.
- Service accounts: every 180 days.
- Certificates: before expiry.
