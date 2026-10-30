# Frozen current artifacts — 2026-10-30

The five clean repositories were frozen through the existing selected-source assembler. Commits:01 `7c2cce0`,02 `2178894`,13 `ca0f460`,17 `cae3d47`,18 `94d8b62`. Exact selected-tree SHA256 values and image metadata are retained in the plan workspace's `current-frozen-artifact-set.json`. All five frozen tree fingerprints were rechecked after construction.

The113 Linux wheels match the current runtime lock. All16 OS packages match the package hash lock. Python, Node and nginx bases were retrieved and verified at their locked digest/architecture. Python runtime/API/gateway/worker builds used network none and only the locked local wheels/packages. Frontend dependencies were resolved inside Docker using the existing public preproduction configuration and lock integrity; no private credential or service key entered the context.

| Image | Local immutable image ID |
| --- | --- |
| api | `sha256:e9af90037d71c1466f3fd9c81f27d87d244ca9befb8767c81315d5ded2f73b23` |
| gateway | `sha256:20debd9ccc39d0b73990c75bea22cd560f1e0c5133b0cb6b3546b41af3196d81` |
| worker | `sha256:856494896ba999cb712cced481ef55e49482584ca5e7d56bd64d36669a9a5f78` |
| frontend | `sha256:616d75652b67a82ec7167f5ad25208f9cb8987d9310d8ed53dc289affa492720` |

All four images were built on the Docker Desktop Linux daemon, not yet loaded into the dedicated native Chassis-Preproduction daemon. They were not pushed, published or deployed. No old image was deleted and no running service or ARGOS resource was changed.

Verification: three existing build-identity tests passed. API imports of cloud bootstrap/worker bootstrap passed; gateway and worker installed-distribution checks passed. Those three checks used nonroot, read-only, network-none containers without secrets. The frontend passed nonroot static index/assets presence checks, also without network. All four smoke containers were removed. These checks do not start the application or certify HTTP/browser/identity/model integration.

## Open artifact gate

The locked Playwright base download exceeded420 seconds. It was not substituted by another version or marked verified. Thus the coordinated all-base release resolver and sandboxed browser candidate gate remain open. The record is explicitly a frozen artifact set with `candidate_acceptance=false` and `publishable=false`, not a resolved/publishable delivery manifest.

Next: transfer these exact IDs into Chassis-Preproduction, resolve the exact browser/QA artifact, and run the current cloud bootstrap with the prepared native inputs, local1.7b model and real identity/Chief/substitute flow. Storage roundtrip and runtime generation fences remain part of that integrated gate. AiM/2D independent contrast and historical key revocation remain separate pending items.


## Follow-up: native transfer and cloud bootstrap

All four images were transferred by binary Docker save/load to the dedicated Chassis-Preproduction daemon, after verifying its name and ID. The destination independently matched every image ID, linux/amd64 architecture and nonroot runtime user (API/gateway/worker1000:1000, frontend101:101). No image publication, tag replacement on a running service, port publication or public deployment occurred. The locked Playwright base remains absent in the native daemon; no alternative version was substituted.

The exact new API image `e9af9003…` then loaded the cloud application with individually mounted native configuration files, read-only root, UID1000, dropped capabilities and network none. In-process ASGI requests returned health200 and anonymous sessions401; the app lifespan closed and the container was removed. This is a configuration/bootstrap gate, not a real HTTP/TLS server, live cloud request, browser test, admitted run or AI inference. No business writes were made.

Two acceptance-preparation defects were found and corrected with failing-then-passing regression tests:

- The fixed single-control-key mount cannot bind multiple runs because the runtime requires distinct control capabilities. This acceptance profile now accepts exactly one run per process. Teams must be tested in separate processes with separate capabilities; the general product runtime's multiworker support is unchanged. Earlier two-binding configuration-file results did not prove runtime compatibility and are superseded by the one-binding native configuration and successful bootstrap.
- The preparer had pinned an HTTP browser origin while CloudAPIConfig requires HTTPS. It now requires `https://127.0.0.1:3000` and rejects the HTTP form. The application security restriction was not relaxed.

Focused suites: Windows80 passed/5 POSIX skips; isolated Linux82 passed/3 Node probe skips, QA container removed. The current native acceptance configuration is a fresh owner-only staging directory; previous inputs were not rewritten. Its inherited base-image metadata still needs a final explicit current-image/QA binding before a unified launcher may use it; this bootstrap used the separately verified exact API image.

Remaining: exact browser/QA artifact, bound current-image launcher inputs, live Storage/identity/model flow, admission/generation checks, browser and human Chief/substitute approval, and independent vendor references. Historical key revocation remains explicitly deferred.


## Follow-up: exact native browser base available

The official MCR endpoint returned200 for the locked index digest, with amd64/arm64 entries. The amd64 child manifest hash was verified against its descriptor (`cf0daee9…`) and its four compressed layers total929,058,922 bytes; blob HEAD requests all returned200. The largest layer is791,266,357 bytes. These observations establish availability and size, not the cause of the earlier Docker Desktop timeout.

Pulling the unchanged index with explicit linux/amd64 on Chassis-Preproduction succeeded. Native inspection reports the exact index ID/RepoDigest `sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48`, linux/amd64. The initial operational check incorrectly expected the image's configuration-blob digest as Docker ID; this daemon exposes the index ID. The check was corrected to the locked index/RepoDigest and architecture, without substituting a digest or image version.

The exact base passed a no-network browser smoke with existing read-only Playwright/playwright-core1.61.1 mounts, operator UID1000, read-only root, capabilities dropped, reviewed seccomp hash, no-new-privileges and Chromium sandbox enabled. Chromium149.0.7827.55 successfully clicked a local DOM control and verified its result. No credential mount, host port, external request, trace or screenshot. Container removed. This closes the exact browser base availability and sandbox-start gates, not authenticated application acceptance.

Dependency inventory found Nodev24.17.0 and no `/usr/bin/certutil` in this upstream base. The existing integrated browser script invokes certutil to create the test NSS trust database, so a reviewed derived QA image with a pinned NSS-tools package closure is still required. No certificate-check bypass, ignoreHTTPS option, no-sandbox fallback or borrowed QA version was used. No accounts or approvals were exercised.


## Follow-up: browser QA certutil closure accepted

A derived QA image was built natively from the unchanged locked Playwright base, with a two-package signed-apt closure: libnss3 and libnss3-tools, both `2:3.98-1ubuntu0.3`, total2,060,038 bytes. Exact deb hashes are committed in `deploy/browser-qa/packages.sha256`; recipe in the adjacent Dockerfile. The native build used network none and checked both hashes before installing the local debs. Installed versions were independently queried from the resulting nonroot/read-only container and matched. No host package installation or image publication.

QA image ID: `sha256:d27ebd350409ea79534fed43463b9e71fddbb1cabf51bf445342436c5e7a1b68`. Package-lock SHA256: `5d052f603fe5fe59219dd92612571f46cfee431a31780d4c867f5f573329f532`. Recipe SHA256: `df7a786c4f80a921c920338c402e039a4c6c761943ed25bbb242c5fb5c4afa6b`.

Functional regression `tests/delivery/browser_tls_smoke.cjs`: base image blocked at missing certutil, derived image passed. It creates a temporary NSS trust database and two ephemeral local self-signed endpoints; Chromium accepts and interacts with the imported certificate endpoint and rejects the other specifically with ERR_CERT_AUTHORITY_INVALID. Chromium sandbox remains enabled with reviewed seccomp and no capabilities, UID1000, network none, read-only root/private tmpfs. Playwright1.61.1/Chromium149.0.7827.55 unchanged. No credentials or host ports; smoke containers removed. JS syntax and whitespace checks passed.

This closes the certutil and local TLS/sandbox gates. This is a browser-only QA artifact, not the Python QA image. The unified launcher must bind both artifacts explicitly and still exercise the actual candidate, real identity/Storage/model and Chief/substitute decisions. No app deployment or acceptance claim; historical key revocation remains pending.
