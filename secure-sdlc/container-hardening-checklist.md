# Container Hardening Checklist

- [ ] Use minimal base image.
- [ ] Do not run as root.
- [ ] Do not mount docker.sock.
- [ ] Do not store secrets in image.
- [ ] Define healthcheck.
- [ ] Define resource limits (CPU and memory).
- [ ] Scan image before release.
- [ ] Generate SBOM.
- [ ] Pin dependencies where possible.
- [ ] Avoid privileged mode.
- [ ] Drop unnecessary Linux capabilities.
- [ ] Use read-only root filesystem where possible.
