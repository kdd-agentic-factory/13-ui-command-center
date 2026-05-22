# Audit Model

## Purpose

This document defines the audit model for the KDD-governed agentic ecosystem.

## Audit Principles

- Every critical action generates an immutable audit record.
- Audit records cannot be deleted without explicit approval and logging of the deletion itself.
- Audit records are forwarded to the observability platform.
- Audit records must comply with the audit-record.schema.yaml schema.

## Event Types

See audit-event-types.yaml for the full list of auditable events.

## Audit Record Required Fields

- audit_id: unique identifier
- timestamp: ISO 8601
- actor: agent_id or human username
- actor_type: human, agent or service
- action: action identifier
- workflow_id: originating workflow
- decision: allowed, blocked, approved, rejected or failed
- reason: explanation of the decision
- evidence: list of evidence artifact IDs

## Audit Trail for Paper

The audit trail provides reproducibility evidence for the paper by recording every analysis, recommendation, approval and decision with its full context and evidence chain.
