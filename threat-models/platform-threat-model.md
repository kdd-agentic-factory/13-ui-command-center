# Platform Threat Model

## Scope

The overall KDD-governed agentic race engineering platform.

## Trust Boundaries

- External users → Command Center UI
- Command Center UI → Agent Orchestrator
- Agent Orchestrator → MCP Gateway
- MCP Gateway → registered tools
- Tools → external services (controlled allowlist)

## Key Threats

| ID | Category | Threat | Mitigation |
|---|---|---|---|
| T-P-01 | Spoofing | Unauthorized agent impersonates a trusted agent | Agent identity validation in MCP gateway |
| T-P-02 | Tampering | Adversary modifies workflow definition | Workflow integrity checks, audit logging |
| T-P-03 | Repudiation | Agent denies executing a critical action | Immutable audit log with actor and action |
| T-P-04 | Information Disclosure | Sensitive data leaked through logs | Log sanitization policy |
| T-P-05 | Elevation of Privilege | Agent escalates permissions beyond its role | Least privilege, no self-approval |
| T-P-06 | Elevation of Privilege | AI recommendation bypasses human approval | Approval enforcement at MCP gateway |

## Residual Risks

See risk-register.yaml.
