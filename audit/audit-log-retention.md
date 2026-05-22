# Audit Log Retention

## Retention Schedule

| Log Type | Retention Period |
|---|---|
| Audit records (critical actions) | 36 months |
| Security event logs | 36 months |
| Approval records | 36 months |
| Application logs | 12 months |
| CI/CD build logs | 12 months |
| Telemetry session data | 12 months |
| Paper evidence artifacts | 36 months |

## Deletion Policy

Audit records must not be deleted before the end of their retention period. Deletion before expiry requires approval from the platform owner and generates its own audit event.

## Storage

Audit records are stored in the observability platform and backed up to long-term storage.
