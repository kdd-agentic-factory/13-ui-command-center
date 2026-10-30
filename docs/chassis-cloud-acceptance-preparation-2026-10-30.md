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


## Follow-up: descriptor and worker object validation

`validate_runtime_objects` now checks already bounded/parsed configuration objects before any connection. It requires the fixed identity origin, explicit isolated browser origin, designated Storage region and exact `/run/cloud/` descriptor references. Worker bindings must use the configured pinned model, finite positive timeouts of at most60 seconds, unique worker/run identities and the explicit signing/control mount paths.

The configured worker principal must be a writable member of one of the two declared test teams, with its matching role; a reader, cross-team subject substitution or mismatched audit actor is rejected. These are comparisons against operator-supplied expected identities, not a live membership or authority verification. Agent bindings grant no human approval proof.

A failing test first exposed the absent validator. Fourteen additional cases cover a valid object pair and rejection of path/origin/field/CORS/region substitution, incorrect worker key paths/model/timeouts (including NaN), foreign identities, readers, audit mismatch and duplicate entries. Focused suites now pass68 Windows tests (5 POSIX skips) and70 isolated Linux tests (3 Node probe skips); container removed and no cloud calls or host ports.

The function does not read files, parse the DSN or contact a provider. The executor must still perform bounded JSON parsing with duplicate-field rejection, verify private input identities around use, load restricted Postgres/Storage configuration inside the isolated runtime, and run the integrated gates. The object validator is not yet connected to a launcher. No acceptance or deployment is claimed.


## Follow-up: bounded configuration-file gate

`verify_runtime_files` connects the file paths to the object validator. After metadata validation it opens only the descriptor and worker-bindings JSON, using read-only/nonblocking descriptors and no-follow where supported. It reads at most65,537 bytes per file to enforce the64KiB limit, requires UTF-8, rejects duplicate fields at every depth and rejects nonfinite JSON constants. No DSN, token, Storage key or account payload is opened.

Device/inode/size/modification time/owner/mode/link count are checked against the opened handle and again for all explicitly supplied base/cloud inputs after object validation; POSIX additionally checks change time. Windows path-stat and descriptor-stat report different ctime semantics on this runtime, so Windows does not compare that field. This was demonstrated with synthetic test files before correcting the cross-platform identity tuple. Native UID/mode checks remain POSIX-only.

All errors are normalized to a fixed suppressed-context message, without parser excerpts or paths. The successful report contains no parsed bodies and remains `candidate_acceptance=false`. The gate is a preflight, not an atomic handoff: the eventual launcher must retain read-only mounts and recheck identities before use. Restricted DSN/TLS validation and live cloud calls remain separate.

Eight additional tests first failed because the gate was absent, then passed: only the two JSON files opened; duplicate/nested duplicate fields; oversized input; invalid UTF-8; nonfinite constants; invalid syntax; and mutation after object validation. Focused suites: Windows76 passed/5 POSIX skips; Linux78 passed/3 Node probe skips. Linux container removed; no cloud calls or ports. These are controlled-file tests, not a real-credential acceptance run.

No deployment or cloud modification was performed. Historical revocation remains pending.


## Follow-up: actual native configuration and restricted database

Explicit candidate inputs were provisioned under a fresh native owner-only directory, using only the enumerated existing test-account/base inputs, restricted runtime DSN, designated Storage credentials and authority/CA files. New internal service/signing/control keys were generated for the isolated candidate. The prior inputs and published services were unchanged. Two planned worker bindings were prepared, not admitted; their random run IDs do not imply actual authorized runs.

The actual configuration-file gate passed with two worker bindings. No secret values or parsed configuration bodies were printed. Two real-input incompatibilities were corrected with RED→GREEN regression tests: the existing S3 signing region is `us-east-2` (independent of the project's European hostname), and the public CA bundle needs the existing1MiB public-certificate limit rather than the64KiB JSON/private-token limit. JSON reading remains capped at64KiB.

A separate pinned-image container connected to the real designated Postgres using the candidate restricted DSN. It used `verify-full`, checked the client libpq TLS flag, and ran only `BEGIN READ ONLY`, a catalog SELECT and ROLLBACK. The current role had `rolsuper=false`, `rolcreaterole=false`, `rolcreatedb=false`, `rolbypassrls=false`. The client TLS connection was active. `pg_stat_ssl` reported false for the server-observed backend leg; that observation is retained and is not represented as an end-to-end internal-provider encryption guarantee. The successful gate concerns the verified client connection and restricted role only. The container was removed; no ports or business writes.

Source inventory found01/02/17/18 clean at their current local revisions;13 contained this milestone's pending fixes before commit. No matching image rebuild or new source freeze was performed. Native candidate base-image metadata remains stale and the integrated acceptance stays blocked. The supplied credentials/configuration are not deployed.

Focused verification after these fixes: Windows78 passed/5 POSIX skips; isolated Linux80 passed/3 Node probe skips, container removed. Actual native configuration-file gate passed; actual restricted database read-only gate passed. Neither gate claims private Storage recovery, live agent execution, browser approval or full acceptance.


## Runtime compatibility correction

Native loading exposed the HTTPS-only CORS requirement and the unique-control-capability invariant. This fixed-mount acceptance profile now permits exactly one run per process and requires `https://127.0.0.1:3000`; the previous multiple-run/HTTP contract was invalid for the runtime. The broader product dispatcher is unchanged. New one-binding native inputs passed file validation and actual image bootstrap (network none, ASGI health200/anonymous401, container removed). These observations supersede the earlier two-binding preflight as evidence of runtime compatibility. Windows80/Linux82 focused tests pass, with5POSIX/3Node skips respectively. Integrated cloud/model/human acceptance remains pending.


## Follow-up: current image bindings and real read-only API acceptance

`verify_runtime_images` now requires six distinct immutable image IDs: API, gateway, worker, frontend, Python QA and browser QA. It uses an operator-owned inspect callback to check exact ID/linux/amd64/nonroot user, rejects tags, role aliasing and mismatched metadata, and normalizes inspect failures. Metadata checks do not grant source-provenance or integrated-acceptance gates. Eight tests first failed for the absent verifier and now pass.

A fresh private native configuration binds the four rebuilt product IDs and Python QA `f371634b…`; browser QA `d27ebd35…` is supplied separately. All six native inspections passed. The same preparation rechecked its descriptor/one-run bindings and all five1.7b model blobs. No legacy image substitution or private-input rewrite. This supersedes the inherited stale base-image metadata for the current candidate inputs.

Actual candidate API probe `tests/delivery/cloud_readonly_identity_probe.py` passed46 controls against real preproduction identity, restricted Postgres and private Storage. It authenticated the eight designated test accounts, checked current subjects/own-session reads and foreign-team403 denials, verified primary/substitute designations for both teams, listed existing bounded text documents and retrieved one per team with exact length/SHA256/no-store checks. The other team's authenticated principal received404 for each source. Document content and tokens were not printed or saved in the report.

The probe used the exact rebuilt API image `e9af9003…`, an in-process ASGI transport and individually mounted read-only native files, nonroot/read-only/cap-drop container with bounded resources and no host ports or Docker socket. It had outbound access for fixed provider dependencies; this was not a network-firewall/egress-isolation test. API sessions were not served through real HTTP/TLS/nginx/browser in this gate. Provider logins create authentication sessions; no business objects, uploads, reviews, agent admissions or human decisions were created. The container was removed. Native result directory: `current-cloud-readonly-443f41a597d74903a031836f40c25bbf`.

Focused suites now pass88 Windows tests (5 POSIX skips) and90 Linux tests (3 Node skips). Python probe syntax and repository whitespace checks passed. Current-candidate private Storage read recovery and identity isolation are demonstrated; current upload/recovery roundtrip, actual AI generation, compiled UI/browser and human approval remain open. No deployment/ARGOS change; historical key revocation pending.
