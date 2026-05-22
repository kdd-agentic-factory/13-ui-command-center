# Secure SDLC Policy

## Purpose

This policy defines security requirements at every phase of the software development lifecycle.

## Security by Design

| Phase | Security Requirement |
|---|---|
| Requirements | Include threat assumptions, data classification |
| Design | Threat model, trust boundaries, least privilege |
| Implementation | Input validation, safe error handling, no hardcoded secrets |
| Testing | Negative test cases, security test coverage |
| Review | Secure code review checklist |
| Deployment | Container hardening, image scanning, SBOM |
| Operations | Audit logging, incident response, monitoring |

## Mandatory Checklists

- secure-sdlc/secure-design-checklist.md
- secure-sdlc/secure-code-review-checklist.md
- secure-sdlc/container-hardening-checklist.md
- secure-sdlc/kubernetes-hardening-checklist.md
- secure-sdlc/release-security-checklist.md

## CI/CD Security Gates

Before merging: static analysis, secret scanning, dependency scan must pass.
Before releasing: container image scan, SBOM generation, approval required.
