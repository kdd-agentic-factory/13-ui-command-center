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
