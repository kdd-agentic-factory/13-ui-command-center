# AI Safety Policy

## Purpose

This policy defines safety requirements specific to AI agents and autonomous decision-making in the ecosystem.

## Core Safety Principles

1. AI recommendations require human approval before critical action execution.
2. AI agents must not suppress contradictory or uncertain information.
3. AI agents must not present simulations as real-world validated facts.
4. AI agents must not make irreversible decisions autonomously.
5. Every AI-generated output must include evidence traceability.

## LLM Safety Controls (OWASP LLM Top 10)

| Risk | Control |
|---|---|
| LLM01 Prompt Injection | Input validation, context isolation |
| LLM02 Insecure Output Handling | Output schema validation |
| LLM03 Training Data Poisoning | Source validation in RAG ingestion |
| LLM06 Sensitive Info Disclosure | No secrets in prompts or responses |
| LLM08 Excessive Agency | Human approval for critical actions |
| LLM09 Overreliance | Evidence requirement, uncertainty labeling |

## Autonomous Scope Limitation

- Race AI Copilot: analysis and recommendation only.
- Digital Twin: simulation only, never real setup application.
- AutoSkills: must pass validation gate before promotion.
- KDD Orchestrator: orchestration only, approval required for critical steps.

## Uncertainty Handling

Agents must explicitly communicate confidence level, evidence sources, limitations and cases where data is insufficient.
