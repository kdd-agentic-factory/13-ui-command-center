# Isolated browser QA image

This QA-only image extends the exact Playwright1.61.1 base locked in `../chassis-bases.lock.json`. It adds only the NSS package closure needed by `certutil`, then returns to UID1000. It is not the Python acceptance/probe image and must not replace that separate dependency contract.

The two `.deb` inputs are downloaded explicitly from signed Ubuntu Noble apt indexes inside the pinned base, using versions `libnss3=2:3.98-1ubuntu0.3` and `libnss3-tools=2:3.98-1ubuntu0.3`. Apt validates package integrity; `packages.sha256` then freezes their exact bytes. Package binaries are not committed. A changed/unavailable version or hash must fail rather than silently refresh this lock.

Place only the reviewed two debs, this Dockerfile and packages.sha256 in a dedicated public build context. Build with network none and pull disabled:

    docker build --network none --pull=false --platform linux/amd64 -f Dockerfile -t <explicit-qa-tag> .

The apt installation uses only local debs; missing dependencies fail offline. No accounts, authority, Storage or database credentials enter the build. Do not install these packages on the operator host.

Runtime verification is `tests/delivery/browser_tls_smoke.cjs`, with matching Playwright/playwright-core1.61.1 read-only mounts. It needs the reviewed browser seccomp, nonroot execution, read-only root and writable private/tmpfs HOME. It creates ephemeral certificates inside tmpfs, imports only one into a new NSS database, requires Chromium sandbox, tests the trusted local TLS endpoint and requires an untrusted endpoint to fail. It does not use ignoreHTTPS/no-sandbox or external networking. No real identity/approval or product acceptance is implied.
