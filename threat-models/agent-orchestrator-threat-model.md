# Agent Orchestrator Threat Model

## Scope

The agent orchestrator that coordinates workflows across agents.

## Key Threats

| ID | Category | Threat | Mitigation |
|---|---|---|---|
| T-AO-01 | Spoofing | External entity triggers unauthorized workflow | Authentication at orchestrator entry |
| T-AO-02 | Tampering | Workflow steps are reordered or injected | Workflow integrity validation |
| T-AO-03 | Elevation of Privilege | Orchestrator approves its own critical actions | No self-approval policy |
| T-AO-04 | Denial of Service | Runaway workflow consumes excessive resources | Resource limits, timeout controls |
| T-AO-05 | Repudiation | Workflow execution not traceable | workflow_id required in all events |

## Controls

- CTRL-002: Human Approval for Critical Actions
- CTRL-006: Audit Logging
