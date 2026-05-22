# Release Security Checklist

- [ ] All CI security gates passed.
- [ ] Secret scanning completed with no findings.
- [ ] Dependency scan completed.
- [ ] Container image scan completed.
- [ ] SBOM generated.
- [ ] Release artifacts produced by CI/CD (not local builds).
- [ ] Release notes document security changes.
- [ ] Human approval obtained for production deployment.
- [ ] Rollback plan documented.
- [ ] Monitoring alerts active post-deployment.
