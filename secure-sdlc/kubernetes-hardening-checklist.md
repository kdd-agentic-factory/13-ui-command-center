# Kubernetes Hardening Checklist

- [ ] RBAC roles defined with least privilege.
- [ ] ServiceAccount per workload (no default SA).
- [ ] NetworkPolicy applied (default deny + explicit allow).
- [ ] Secrets stored in Kubernetes Secrets or external secrets operator.
- [ ] Resource limits defined for all containers.
- [ ] Pod Security Standards applied (restricted profile preferred).
- [ ] No privileged containers.
- [ ] No hostPath mounts with sensitive paths.
- [ ] Liveness and readiness probes defined.
- [ ] Image digest pinning used in production.
