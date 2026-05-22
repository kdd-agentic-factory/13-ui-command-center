# Data Minimization

## Principle

Only collect and process the minimum data required for the documented purpose.

## Application

### Telemetry

- Collect only the channels required for the analysis task.
- Do not collect personal data unless strictly required and justified.
- Aggregate where individual data points are not needed.

### RAG/CAG

- Index only documents relevant to the use case.
- Do not index sensitive documents unless access controls are in place.
- Remove documents that are no longer relevant.

### Audit Logs

- Log the event and context, not the full payload.
- Do not log secrets, credentials or sensitive personal data.

### Paper Evidence

- Include only the data required to reproduce the result.
- Anonymize where possible before export.
