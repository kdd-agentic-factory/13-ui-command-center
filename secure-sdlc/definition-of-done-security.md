# Security Definition of Done

A feature is not done until:

- requirements include security considerations
- design includes threat assumptions
- inputs are validated
- errors are handled safely
- logs do not expose secrets
- tests cover negative cases
- dependencies are scanned
- container image is scanned
- documentation is updated
- audit events are emitted for critical actions
- approvals are enforced when required
