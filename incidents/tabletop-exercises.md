# Tabletop Exercises

## Purpose

Tabletop exercises validate the incident response process before a real incident occurs.

## Recommended Scenarios

### Scenario 1: Unauthorized Production Deployment

A CI/CD pipeline is manipulated to deploy to production without the required approval.

Questions: How do we detect it? How do we contain it? What evidence do we collect?

### Scenario 2: Secret Exposure

A developer accidentally commits an API key to a public repository.

Questions: How long until detection? What is the blast radius? How do we rotate?

### Scenario 3: AI Recommendation Mistaken for Decision

A race engineer applies a setup change based on a Copilot recommendation without obtaining crew chief approval.

Questions: How do we detect this? What controls failed? How do we prevent recurrence?

### Scenario 4: Sensitive Data Export

An agent exports a restricted telemetry dataset without triggering the approval gate.

Questions: What went wrong in the policy enforcement? How do we assess the impact?

## Frequency

Conduct at least one tabletop exercise per quarter.
