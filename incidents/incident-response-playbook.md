# Incident Response Playbook

## 1. Detect

Sources: observability alerts, CI/CD security scan, MCP policy block, audit log anomaly, human report.

## 2. Triage

Classify: severity, affected repository, affected service, affected data, affected workflow, business impact.

## 3. Contain

Possible containment actions: disable tool, pause workflow, revoke credential, rollback release, isolate namespace, block data export.

## 4. Eradicate

Remove root cause: patch vulnerable dependency, update policy, fix workflow, rotate secret, update RBAC.

## 5. Recover

Validate: service health, audit logs, release state, data integrity, policy enforcement.

## 6. Postmortem

Produce: incident report, timeline, root cause, corrective actions, controls updated, evidence archived.
