# Data Classification Policy

## Classification Levels

### Public

Information that can be shared externally without restriction.

Examples: published paper sections, public documentation, public architecture diagrams.

### Internal

Information intended for project members only.

Examples: internal design documents, workflow definitions, non-sensitive logs.

### Restricted

Information requiring controlled access and explicit authorization.

Examples: detailed telemetry sessions, operational race setup data, experimental results before publication, internal security reports.

### Sensitive

Information requiring explicit approval for access or export.

Examples: credentials and API keys, private keys, personal data, proprietary race strategy, confidential datasets.

## Required Metadata

Each dataset must include:

- dataset_id
- owner
- classification
- purpose
- retention
- allowed_consumers
- export_policy

## Export Rules

| Classification | Export Requires Approval |
|---|---|
| public | no |
| internal | no |
| restricted | yes |
| sensitive | yes, with data owner approval |
