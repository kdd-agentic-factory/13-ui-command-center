# KDD Knowledge Network — Product Spec

## Goal
Convert KDD from a telemetry tool into a federated learning network for riders, teams, garages, and academies.

## Positioning

KDD is not just a platform.
KDD is a track knowledge network.

Each node keeps its own data.
The network learns from aggregated patterns.
Each node receives better intelligence.

### Core promise

> Your data stays yours. Your learning accelerates because you belong to a network that learns.

## Product concept

### Node types

- Rider Node — private learning for a single rider.
- Team Node — learning inside a team or garage.
- Academy Node — shared learning for coaches and students.
- Garage Node — setup and validation knowledge.
- Federated Node — contributes anonymized patterns to the network.

### Privacy modes

- Private — session analysis only, no contribution.
- Team — learning shared within the group.
- Federated — anonymous signals and model updates contribute to the network.

## Architecture direction

1. Local Data Vault
2. Feature Extraction Node
3. Privacy Guard
4. Federated Learning Client
5. Knowledge Aggregation Network
6. Global Intelligence Services

### What stays private

- Raw telemetry
- Onboard video
- Exact private setup
- Identity and internal notes
- Sensitive team history

### What can be shared

- Anonymous features
- Aggregated benchmarks
- Validated patterns
- Model updates
- Group-level trends

## MVP scope

### Phase 1

- Landing page for Founding Nodes
- Waitlist and intake form
- Private session analysis
- Basic session summary
- Anonymous benchmarks

### Phase 2

- Team mode
- Learning paths
- Knowledge graph per node
- Optional federated contribution

### Phase 3

- Federated learning
- Model registry
- Secure aggregation
- Node reputation and quality weighting

## Messaging

### Hero options

- KDD is the first intelligent learning network for motorcycle performance.
- Connect your telemetry. Protect your data. Learn from the network.
- KDD learns with you, but improves through the network.

### Founder offer

KDD Founding Nodes is early access for the first riders, teams, and academies building the network.

## Landing structure

1. Hero
2. Problem / current fragmentation
3. How the network learns
4. Privacy by design
5. Learning modes
6. Founding Nodes CTA
7. Final value statement

## Risks

- Overpromising federated learning before enough data exists.
- Losing trust if privacy is not explained clearly.
- Adding too much technical complexity too early.

## Recommendation

Launch with private analysis, aggregated benchmarks, and a clear Founding Nodes story.
Move to federated learning once the network has enough high-quality nodes.

## Lead ops

- `LEAD_ALERT_TO` (InsForge secret/env): optional internal inbox for new founder/trial submissions.
- When present, the lead function sends a team alert in addition to the prospect confirmation email.

## Outreach next step

See `docs/founding-node-outreach.md` for the first outbound playbook and `docs/founding-node-crm-template.csv` for the tracking sheet template.
