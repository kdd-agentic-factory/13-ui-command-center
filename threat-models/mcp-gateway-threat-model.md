# MCP Gateway Threat Model

## Scope

The MCP gateway that controls tool execution across the ecosystem.

## Key Threats

| ID | Category | Threat | Mitigation |
|---|---|---|---|
| T-MCP-01 | Spoofing | Caller claims to be an authorized agent | Caller identity validation |
| T-MCP-02 | Tampering | Tool input is modified in transit | Schema validation on input |
| T-MCP-03 | Repudiation | Tool call is denied | Audit log with tool_call_id |
| T-MCP-04 | Information Disclosure | Tool output leaks sensitive data | Output schema validation |
| T-MCP-05 | Elevation of Privilege | Agent calls a tool above its risk level | Tool registry with allowed_agents list |
| T-MCP-06 | Elevation of Privilege | Critical tool executed without approval | Approval gate enforcement |

## Controls

- CTRL-001: MCP Tool Registry
- CTRL-002: Human Approval for Critical Actions
- CTRL-006: Audit Logging
