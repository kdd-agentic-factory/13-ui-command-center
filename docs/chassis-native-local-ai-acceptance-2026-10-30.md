# Native local AI acceptance evidence — 2026-10-30

Scope: qwen3:1.7b in dedicated Chassis-Preproduction, current API image `e9af9003…`, CPU-only6CPU/4GiB, read-only model/runtime mounts, network none, no host ports, secrets or cloud connections. Every model container was removed. This is synthetic decision-contract evidence, not integrated real telemetry/Storage/agents/browser/Chief acceptance.

## Startup failure and correction

The model digest/blob preflight passed, but `/api/tags` returned500 because Ollama attempted `mkdir /models/manifests` on the read-only mount. The candidate cache had only blobs/manifests-v2. The operator created an empty manifests directory before launch; no model bytes were edited and no mount was made writable. All five blobs and the pinned manifest were independently rehashed after the change.

`verify_model_runtime_layout` now checks all three precreated directories without creating them or reading secrets. Two tests first failed for the missing gate, then passed; file-instead-of-directory and implicit-directory-creation cases are covered. The existing legacy runner invokes the layout gate before containers, alongside blob verification. This does not make that runner a current cloud executor.

Ollama runtime version observed0.40.6; binary SHA256 `8b4e471bcfc99125ae028b3b05938071999f8fddbebb30027f073460c5cb02e8`. This is an observed operator runtime identity, not a fresh vendor-signature verification of the entire runtime/library bundle. The model API reported the exact reviewed1.7b manifest digest.

## Real inference measurements

The frozen synthetic decision fixture includes explicitly untrusted documentary text and no human setup approval. Server decision grammar and reference validation were preserved. No generated recommendation text was logged.

| Experiment | First request | Repeated request | Result |
| --- | --- | --- | --- |
| Raw generation,256 output-token limit/4096 context | 33.541s | 10.951s | Both valid review_supported decisions; first exceeds27s |
| Application LocalModelProvider, normal request options,27s task budget | Timeout observed at29.296s | 9.591s | Cold task blocked; warm decision valid |
| Empty model preload, then application LocalModelProvider at unchanged27s | 10.693s | 4.903s | Both valid review_supported decisions |

The empty preload took6.931s, supplied no prompt or session facts, returned done with an empty response and requested keep_alive=-1. It was performed before the measured application calls and before any run admission. This experiment does not hide a task timeout or warm a task-specific prompt. It demonstrates a viable preparation step for this fixture/hardware, not universal latency guarantees or idle/restart/concurrent-load acceptance.

## Remaining readiness work

The current unified launcher must perform model identity/layout/blob checks, empty preload and readiness before admitting jobs; keep-alive behavior must remain explicit across subsequent generation requests and idle/restarts. The test used a preload request's keep_alive=-1 but did not prove retention after later requests or a long idle period. Production task deadlines were not increased. Do not silently admit work against a cold/unready model or count the isolated smoke as factory/Chief acceptance.

Focused tests: Windows90 passed/5 POSIX skips; Linux92 passed/3 Node probe skips. Native layout/artifact recheck passed. No deployment, public AI-node change, paid resource or ARGOS modification. Historical credential revocation remains pending.


## Follow-up: explicit readiness gate and retention setting

`tests/delivery/model_readiness.py` adds `preload_model`, called by an operator-owned bounded loopback JSON transport. It accepts only a reviewed exact name/digest and localhost11434 endpoint, enforces a finite readiness deadline of at most60s, checks tags before loading, sends a closed `{model,stream:false,keep_alive:-1}` request with no prompt/facts, requires empty completed output, verifies the exact model is resident via `/api/ps` and rechecks the tag digest. A missing/switched model, generated text, failed load, missing residency or elapsed deadline fails closed. The result explicitly grants neither run admission nor candidate acceptance. No model/API call occurs during metadata-only preparation.

Ten tests first failed for the absent helper and now pass, including no-load-before-identity checks and deadline exhaustion. Focused suites: Windows100 passed/5 POSIX skips; isolated Linux102 passed/3 Node probe skips. QA container removed.

The helper was then exercised inside the dedicated native model executor before actual LocalModelProvider calls. The server explicitly set `OLLAMA_KEEP_ALIVE=-1` as well as the empty preload parameter, because subsequent normal requests otherwise may reset retention to the server default. Real readiness took5.964s. Two synthetic decision-contract requests at the unchanged27s budget took8.626s and3.979s, both valid review_supported decisions. After those ordinary requests, `/api/ps` still reported the exact digest loaded and an expiry more than24h away. This checks the advertised post-request retention, not an actual24h idle soak or restart recovery.

The run used the same6CPU/4GiB, read-only verified model/runtime mounts, network none and no secrets or host ports. Model container removed. The local native executor has exercised the gate; the full cloud/worker/browser/human approval launcher is still to be completed and must place readiness before any run admission, including after restart. No public node/server settings or task timeout changed, no deployment/ARGOS modification, historical revocation still pending.


## Worker-pass guard

`run_when_model_ready` now wraps an operator-owned async worker pass: it completes the bounded model preparation in a thread before invoking the normal worker/dispatcher callback. It does not replace admission authorization. Three RED→GREEN tests prove that failed readiness never calls the worker, an existing authority denial propagates, and a no-work result remains false rather than becoming a successful task. This guard is an acceptance-launcher component, not a new product endpoint or a completed cloud worker deployment.

Inspection of the current built API image independently found that `orchestrator` was absent, although cloud `worker_runtime` imports the repository01 consumer. Repository18 commit54c324a adds that package to the offline API-image recipe before the final pip check. A freshly built image must pass the actual import check before any integrated worker execution; the previous image remains unchanged.


### Worker consumer packaging correction verified

Repository18 commit54c324a now installs the governed repository01 package into the API/cloud-worker-runtime image using the same locked offline wheels, before the final pip check. A new clean selected-source context was frozen at01=7c2cce0,02=2178894,13=91eb1bb,17=cae3d47,18=54c324a. This is a targeted API candidate rebuild; it does not retroactively change the earlier frozen artifact set or declare all delivery gates resolved.

New API candidate ID: `sha256:45b7c8abba4c76ccfb4b28c86a0145be44ff949916cfd504b41ba15c5d2f5d85`. It was built network-none, imported orchestrator.engineering.worker plus persistence.worker_runtime/worker_node successfully, and its smoke container was removed. The exact image was transferred to Chassis-Preproduction, where ID/platform/nonroot user and the imports passed again. Native cloud bootstrap with individual read-only inputs then returned ASGI health200/anonymous sessions401, network none, container removed. No model task, run admission or business write occurred in these checks.

A new private input file binds this exact API ID while preserving the explicit remaining product/Python QA/browser QA IDs. Native six-image metadata, configuration references and model artifacts passed again. Previous input files and the public deployment were unchanged. The earlier46 real identity/Storage controls were run on APIe9af9003, not on this new45b7c8ab image; repeat those live controls within the final integrated acceptance.

Worker guard focused suites: Windows103 passed/5 POSIX skips and Linux105 passed/3 Node skips, QA container removed. The guard is available to the operator launcher and proven to preserve authorization denial; a successful actual governed run through readiness, task consumption, Chief synthesis and browser approval is still pending. No global product auto-admission or readiness endpoint was added. Historical revocation remains pending.

## Fresh authenticated run and first governed worker pass

The API45b7c8ab candidate created a new explicitly synthetic preproduction session, snapshot and run through its ordinary authenticated engineering routes, using the existing team-A engineer test identity. All three requests returned200. The snapshot correctly retained its physical-analysis block. Session379bd0ff-9527-4637-a9fb-99bb6b3aea7a and runb74de932-da2c-5262-a575-5b4877c399f1 are new isolated QA objects; no existing business session was modified.

An operator-owned single-run binding then mounted the private files individually read-only and used the readiness guard before `run_registered_once(..., admit=True)`. Admission used the durable authorized-start checks; no dispatch flag, result or approval was patched. Exact native model preload passed in10.721s and the worker callback returnedTrue. No host ports or deployment; container removed.

Crucially, a subsequent authenticated read showed `model_calls=0`. Three processed specialist tasks were blocked_missing_inputs and physical became unavailable, with decision_context_unavailable. The empty synthetic snapshot cannot qualify for inference. This is evidence of authorization, dispatch and conservative missing-context handling, **not** successful AI analysis or completed integrated acceptance. The first probe also incorrectly assumed public run JSON exposed internal dispatch_ready; its KeyError occurred after successful run creation. A read-only follow-up verified the same run and nine tasks without recreating it. Native evidence retains both the original failed assertion and corrected read.

Next acceptance must use a separately labeled eligible context assembled through supported APIs, then verify model-call receipts, results, Chief synthesis and browser decisions. Do not promote incomplete-context handling to physical validation or human approval. Historical revocation remains pending.

### Same run completed conservatively; real Chief synthesis observed

The remaining bounded worker passes returned `[true,true,true,true,false]` after a fresh readiness check4.690s. Subsequent authenticated public GET of the same run reports `sealed`, all nine tasks terminal (seven blocked_missing_inputs; physical/neuro unavailable), and `model_calls=1`. Public synthesis progress returns200, `status=succeeded`, null cause and a proposal ID. This supersedes the intermediate zero-call observation above: the specialists abstained without inference, then the Chief synthesis made a real recorded model call and published a proposal. Its contents, publication/approval eligibility and browser/human decisions still require verification; synthesis success alone does not close integrated acceptance or physical validation. Both native worker containers were removed and no host ports were published.

## Proposal and designated authority validation

The published measurement-only proposal15f680d7-da57-490c-80f9-a905a0b0abf2 was read through authenticated API45 routes. FinalProposal validation, exact snapshot linkage and proposal digest passed. It contains one measurement item, no setup_change and no physical parameters. Stored eligibility reports all six gates true without blocked reasons. The actual Chief and substitute test identities both match the configured designations and receive current/authority_available/approvable true; the ordinary engineer receives approvable false. The earlier engineer-only result must not be interpreted as a context-wide prohibition: approval is identity-dependent. No approve/reject/revision action was posted, and no browser approval was performed. Read-only proposal validation completed17 gates; native container removed.

## Cloud import gap reproduced and corrected

An eligible-context fixture attempt created three labeled synthetic catalog entries and a synthetic session, then encountered recorded/import503. Investigation showed that CloudRequestRuntime.supports and create_cloud_app had not connected this business route at all. The endpoint never reached legacy persistence, so this was not a vendor decoder or Storage credential diagnosis. Those new controlled fixtures remain retained; existing business objects were unchanged.

Repository18 commitbe25097 connects only tabular import and summary/channel retrieval to the bound private recording adapter. Native files remain rejected in cloud; no historical geometry route was exposed. Upload body is bounded before multipart processing, reader writes are forbidden, no local-store fallback is permitted, and all recording responses carry no-store. Independent review identified disconnect-before-publication and error-response privacy omissions. Both were reproduced RED and fixed: the outer raw receive probe prevents both blob writes on a disconnected import; known read storage/integrity failures return bounded503/409 without diagnostics. No stored data schema changed (recorded-session2.0.0).

Controlled regression result:38 passed using ephemeral real Postgres and MemoryTransport, no cloud calls/host ports; Ruff passed and diff check clean. This is separate from the live Storage evidence below.

### Rebuilt candidate and actual private recording roundtrip

Selected clean sources01=7c2cce0,02=2178894,13=d614f46,17=cae3d47,18=be25097 produced API `sha256:946edcfa2c7fae95112b4fe5c9e8c6da14be8287880c08419d6093b75d132c1a` offline/network-none. Imports passed, exact native ID/platform/nonroot identity verified, six-image metadata/configuration and model artifacts rechecked. Previous candidates remained unchanged.

On that exact API image, actual team-A engineer authentication and import of a clearly labeled SYNTHETIC-QA.csv succeeded200. The original SHA256 matched; summary and full channel recovered privately; all1024 samples and original0..10.23s times matched the submitted arithmetic control. An actual team-B engineer received404/no-store for the same recording. Recreating the app recovered the same durable recording/hash. Nine live gates passed; native container removed, no host ports. Evidence: native-cloud-recording-roundtrip.json, native directory fresh-synthetic-run-a863894bb7d4487b9265f068f9f7bdd4. This is actual private Postgres/Storage integration with synthetic input, not AiM/2D manufacturer validation, a process-restart recovery test or full product acceptance.

Positive specialist inference still requires connecting the remaining cloud comparison/domain-context paths and assembling eligible evidence. Browser decisions by Chief/substitute remain pending. No deployment, paid resource or ARGOS change. Historical revocation remains deferred.

## Cloud comparisons and bike identity — 2026-10-30 follow-up

Repository18 commit2ac660d connects POST chassis/comparisons and the existing comparison report GET through explicit cloud route bindings, using private recordings and immutable setup objects. No local SQLite fallback or broader historical route was enabled. No-store now covers comparison successes and errors; the calculated comparison retains its no-causal-session-evidence warning.

Independent review found an important shared snapshot defect: complete setup/comparison objects for bike X could produce an analyzable snapshot in a session for bike Y. The real ephemeral-Postgres regression reproduced200/analyzabletrue before the fix. Resolution now checks the session bike against each selected comparison/setup/binding before publishing, for both cloud and local snapshots. Frozen historical payload bytes/schema were not rewritten. The positive legacy snapshot fixture was corrected to include the actual bike identity. A pre-existing exact-budget test now freezes its preparation monotonic clock instead of comparing a wall-time-reduced budget to an exact integer; production deadlines were unchanged.

Final targeted regression:91 passed, covering private imports, cloud requests, comparisons, snapshots, domain snapshots and run behavior. Ruff on changed comparison/recording modules and tests passed; diff check clean. The reviewer finding was fixed by RED→GREEN, with no deferred findings.

### Current candidate and positive context fixture

Selected clean sources01=7c2cce0,02=2178894,13=e867500,17=cae3d47,18=2ac660d produced API `sha256:3b6742994da144d1dabc99d7234a2c9e39f446dfbf70d8bc7dc5823ff90f29e3`, offline/network-none. Imports and exact native ID/platform/nonroot checks passed; separate native configuration preserved earlier candidates and passed six-image/model metadata checks.

Actual test-engineer identity plus private Storage fixture reuse passed18 gates: new synthetic circuit/bike/rider/session, assumed A/B setups, comparison using the recovered recording SHA256, immutable report, and analyzable snapshot without input blockers. The retained causal limitation was explicitly checked. New run1d631741-9230-50bd-a99d-c9e2ab135eec belongs to synthetic session4fc5d0db-250e-4a64-9e17-2741fd411d15. These remain synthetic arithmetic/assumed-geometry controls, not measured physical performance or vendor validation.

The readiness-guarded authorized worker was then exercised. Its container was removed, but the pass ended with TimeoutError. Authenticated durable follow-up reports one model call and Chassis timed_out/model_deadline_exceeded; track is blocked_missing_inputs/domain_context_not_projected, with remaining tasks queued. This is **not** a successful specialist acceptance. No timeout was widened, task state patched or alternate result injected. The next diagnosis must measure prompt/inference/control latency on an explicitly authorized fresh attempt and retain absolute deadlines.

The investigation also confirms that domain-evidence persistence still uses a local store protected by reject_local_in_cloud; it needs a proper durable cloud adapter, not just extra public route registration. Browser Chief/substitute decisions and full acceptance remain open. No deployment, ARGOS change or paid resource; historical revocation pending.

Operator evidence correction: several throwaway runner copies initially retained the generic local report filename. Exact native run directories had preserved their individual result.json files. The distinct proposal/Storage reports were recovered from those explicit directories and runner output filenames corrected; the positive fixture now has its own native-positive-chassis-fixture.json. No business operations were repeated for that correction.

## Local inference latency follow-up

Frozen-context diagnostics retained all values, units, provenance and uncertainty through declared reversible tuples. Explicit six-thread generation with matching empty preload returned valid decisions in 25.146 and 12.200 seconds (27-second request budget). These were diagnostic source overrides, not immutable-image or integrated acceptance. The first call has limited margin. No worker state was reopened, no deadline extended and no human decision posted.

Private worker model settings 1.1.0 require explicit bounded integer num_threads; legacy 1.0.0 remains closed. Review found no actionable defects. Fresh verification: 79 model/decision/grant tests; 122 isolated database/resource/route tests; 107 Linux readiness/executor tests with three browser probes skipped. The Windows grant subprocess tests passed after selecting the isolated interpreter and sibling source paths. Pending: rebuild immutable API, align versioned bindings and readiness, fresh governed run, then actual browser Chief/substitute acceptance. No deployment.
