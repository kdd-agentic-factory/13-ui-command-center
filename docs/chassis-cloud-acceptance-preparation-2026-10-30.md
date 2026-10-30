# Current cloud acceptance preparation — 2026-10-30

`tests/delivery/prepare_cloud_acceptance.py` is a metadata-only entry contract for the current InsForge Postgres/private Storage candidate. It is separate from `run_real_acceptance.py`, which remains the legacy-file runner. There is no new launcher or deployment in this change.

## Explicit inputs

The contract takes the existing reviewed base identity/image metadata, an exact cloud profile, a separate native model cache and an exact set of private files: descriptor, restricted database DSN, anonymous identity key, authority key, service key, Storage key, worker bindings, signing/control keys and identity CA. The current candidate requires the pinned qwen3:1.7b pair validated by the base preparation.

Cloud input files must be distinct bounded regular files under the explicitly designated private root, without linked paths or hard links; on POSIX they must belong to UID1000 with no group/other permissions. A cloud file cannot alias a base credential source. The model directory must be separate from the private root in both directions.

All cloud mounts are individual read-only API mounts at `/run/cloud/<name>`. The preparation never grants database or Storage mounts to frontend, browser or gateway. It names the existing `telemetry_dataset.persistence.bootstrap:application_factory` factory and its explicit `CHASSIS_CLOUD_CONFIG_FILE` entrypoint. This is a preparation contract, not a complete TLS/container launch specification.

## Fail-closed scope

Preparation does not open the private files, run commands, connect to cloud, validate descriptor contents or prove image provenance. Its result remains `prepared_not_executed`, `candidate_acceptance=false`, `execution_authorized=false` and `publishable=false`. Every runtime gate starts blocked.

The isolated runtime still must verify descriptor references against the exact mounted path allowlist, validate the restricted DSN and TLS, verify Storage publication/recovery and run-generation isolation, verify model artifacts/latency, and execute the real documentary/identity/browser/Chief/substitute flow. A metadata result cannot substitute for any of those checks. Credentials must be provisioned explicitly; this preparer copies none.

## Verification

A failing test first demonstrated the absent cloud contract. Nine new cases now cover metadata-only preparation, exact role mount ownership, closed initial gates and rejection of unknown fields, profiles, missing/extra/duplicate inputs, aliases to base credentials, absent model caches and legacy model identity.

Focused suites: Windows54 passed/5 POSIX cases skipped; isolated Linux56 passed/3 Node browser contract probes skipped (Node absent from Python image). Linux container removed, no cloud calls or host ports. Existing legacy tests remain green.

Historical credential revocation remains pending. No cloud mutation, model start, deployment, image publication or ARGOS modification occurred.
