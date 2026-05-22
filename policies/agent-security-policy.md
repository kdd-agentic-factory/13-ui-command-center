# Agent Security Policy

## Purpose

This policy defines the security model for all AI agents operating within the ecosystem.

## Principle: Least Privilege

Every agent must have only the permissions required to fulfill its defined role. No agent has global permissions.

## Required Agent Definition

Every agent must define:

- agent_id
- role
- allowed_actions
- forbidden_actions
- scope
- allowed_tools
- approval_requirements

## Agent Permission Model

| Agent | Allowed | Forbidden |
|---|---|---|
| documentation_agent | generate docs, read knowledge | apply Kubernetes changes |
| mcp_gateway | execute registered tools | bypass approval gates |
| race_ai_copilot | recommend with evidence | approve setup changes |
| digital_twin | simulate scenarios | apply real setup changes |
| kdd_orchestrator | orchestrate workflows | approve critical actions for itself |

## Inter-Agent Trust

- Agents do not trust each other by default.
- All inter-agent calls pass through the MCP gateway.
- Agents cannot grant permissions to other agents.
