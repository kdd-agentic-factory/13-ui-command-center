# Human Approval Policy

## Purpose

This policy defines which actions require explicit human approval before execution.

## Critical Actions

The following actions always require approval:

- production deployment
- Kubernetes manifest application in production
- promotion of AutoSkills
- deletion of evidence
- changes to security policies
- data export of sensitive datasets
- race setup changes
- operational recommendations with high or critical risk
- release publication
- permission model changes

## Approval Record

Each approval must include:

- approval_id
- workflow_id
- requester
- approver
- approver_role
- action
- risk_level
- evidence
- timestamp
- decision
- justification

## AI Limitation

AI agents may request approval, prepare evidence and explain risk. They must not approve their own critical action requests.

## Enforcement

The approval gate is enforced by:

- 02-mcp-gateway for tool calls
- 01-agent-orchestrator for workflow actions
- 12-ci-cd-release-engineering for deployments and releases
- OPA policy at tooling/opa/policies/approval-policy.rego
