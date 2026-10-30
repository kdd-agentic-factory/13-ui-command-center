# Acceptance model artifact preflight — 2026-10-30

## Scope

The preparation contract accepts only the pinned qwen3:0.6b and qwen3:1.7b name/digest pairs. Before network access or container creation, the legacy executor verifies the selected manifest and every referenced blob, including SHA-256, declared size, bounded reads and file identity. Missing artifacts are never downloaded implicitly.

Ollama v2 content-addressed manifest aliases are supported only when they resolve to the exact expected manifest blob inside the cache. Arbitrary, external and legacy-layout links remain rejected. A matching v2 manifest may coexist with an older legacy-layout manifest.

Plans and reports explicitly declare `persistence_profile=legacy-file` and `candidate_acceptance=false`. This runner does not certify the current Postgres/Storage candidate.

## Verification

- Windows focused acceptance-plan/executor suite: 45 passed, 5 POSIX-specific cases skipped.
- Isolated Linux focused suite: 47 passed, 3 Node browser-contract probes skipped because Node is absent from the Python QA image. POSIX credential and manifest-link cases passed. Container removed; no cloud calls or host ports.
- Regression tests first exposed unsupported 1.7b, arbitrary digest acceptance, missing artifact verification and legitimate v2 manifest compatibility. Each was corrected and verified.
- Bounded independent code review found no important issue. The later native-cache compatibility correction was covered by positive and negative POSIX alias tests.

## Read-only native evidence

Chassis-Preproduction has 16 CPUs and 16,418,684,928 bytes of host memory. This is capacity inventory, not a latency or resource acceptance result.

The native cache verified qwen3:0.6b manifest `7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435`, five blobs totaling 522,653,767 bytes. qwen3:1.7b remains unavailable in that cache. Its presence in the separate local AI node does not satisfy this gate. No model was started, downloaded or transferred.

## Remaining gates

1. Provision and verify the pinned 1.7b artifacts in a dedicated Linux candidate cache.
2. Freeze the current five-repository source matrix and rebuild matching images; old image IDs do not prove current-source coverage.
3. Complete the integrated executor for the current Postgres/private Storage profile rather than reuse the legacy file runner as candidate acceptance.
4. Run real identity, private documentary evidence, model inference, browser and human Chief/substitute approval together. Measure cold-start and warm latency.
5. Independent AiM/2D contrast remains separate. Historical credential revocation remains explicitly deferred.

No deployment, publication, cloud configuration mutation or ARGOS modification was performed in this milestone. The integrated production acceptance has not passed.
