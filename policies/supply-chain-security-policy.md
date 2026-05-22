# Supply Chain Security Policy

## Dependency Controls

- All dependencies must be pinned to explicit versions.
- Dependencies must be scanned at every build.
- New dependencies require review before introduction.

## Container Image Controls

- Use minimal, verified base images.
- Pin base image versions using digest (sha256).
- Scan images before pushing to registry.
- Generate SBOM for all production images.

## Release Integrity

- All release artifacts must be produced by CI/CD.
- Releases must not be built from unreviewed code.
- Release gates must include security scan results.
