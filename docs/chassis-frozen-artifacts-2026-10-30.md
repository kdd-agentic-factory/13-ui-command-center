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
