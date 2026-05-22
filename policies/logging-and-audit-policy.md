# Logging and Audit Policy

## Purpose

This policy defines what must be logged, how logs are protected and how long they are retained.

## Mandatory Audit Events

All critical actions must emit structured audit events. See audit/audit-event-types.yaml.

## Required Audit Record Fields

- audit_id
- timestamp
- actor
- action
- workflow_id
- decision

## Log Protection

- Audit logs must be write-protected after creation.
- Logs must not be deleted without explicit approval.
- Logs must not contain secrets or sensitive personal data.

## Retention

- Audit logs: 36 months
- Security event logs: 36 months
- Application logs: 12 months
