# Secure Code Review Checklist

- [ ] No hardcoded secrets or credentials.
- [ ] All inputs are validated.
- [ ] All errors are handled safely without exposing internals.
- [ ] SQL/NoSQL queries use parameterized statements.
- [ ] No shell injection risk in subprocess calls.
- [ ] Logs do not contain secrets or sensitive personal data.
- [ ] Dependencies are pinned and scanned.
- [ ] Critical actions emit audit events.
- [ ] Approval gates are enforced for critical actions.
- [ ] Output is validated against schema before use.
