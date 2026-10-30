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
