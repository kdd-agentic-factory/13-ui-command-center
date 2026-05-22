# MCP Tool Security Policy

## Purpose

This policy governs the secure use of MCP tools across all agentic workflows.

## Tool Risk Levels

- low: read-only and non-sensitive operations.
- medium: write action in non-critical scope.
- high: modifies repositories, datasets or runtime configuration.
- critical: production, security, deployment, race setup or data export actions.

## Mandatory Controls

Every registered tool must define:

- tool_id
- category
- input_schema
- output_schema
- risk_level
- allowed_agents
- approval_requirement
- audit_requirement

## Critical Tool Rules

Critical tools must:

- require approval_id before execution
- validate caller identity
- validate workflow_id
- emit audit event on call and completion
- support dry_run when possible
- return evidence packet

## Forbidden Behavior

Tools must not:

- execute shell commands without an explicit allowlist
- access arbitrary destinations not in the allowlist
- bypass the approval gate
- write secrets to logs or outputs
- delete evidence or audit records without approval
- call other tools outside the MCP gateway
