# Documentary preparation in the analysis screen

Local implementation only; no deployment or cloud mutation.

The engineer can opt into a reviewed documentary requirement for one factory and
one section: motorcycle, circuit, rider or championship. Motorcycle section IDs
come from the existing shared topology. The default leaves historical analysis
behavior unchanged. Reading views hide mutation controls; authenticated writers
alone can select this option, with final authority enforced in the backend.

Sequence: persist snapshot, prepare its documentary plan, then use the unchanged
run-start request. The server atomically inherits requirements before a worker
can admit the run. UI checks returned actor, team, operation, snapshot hash,
factory selections, binding IDs and version. Missing/rejected sources prevent
run creation. Ambiguous failures retain the exact snapshot, operation and body;
controls freeze until recovery. No automatic fallback to a legacy run.

Independent review found that a workspace remount could lose that pending choice.
Regression reproduced RED, then fixed: a parent guard survives context remounts,
blocks fresh starts and requires explicit discard. Discard leaves documentary
selection enabled for the new snapshot, and normal server reconciliation still
precedes start. The guard does not persist across a full browser reload; existing
server reconciliation remains required. No document or credential is cached.

The option is an admission requirement, not evidence that a model has read the
manual. Source text consumption and real-model acceptance remain pending. No
mechanical recommendation or Chief/substitute authorization is added by this UI.

Validation: new missing-checkbox cases RED, then green for ordered preparation,
422 rejection and stable503 retry. Context-remount regression RED then GREEN.
Focused panel and response-claim checks42/42. Synthetic desktop1280x960 and mobile
390x844 captures checked without horizontal overflow. Harness uses controlled
responses, not real identity/Storage/model acceptance. A harness API-stub issue
was corrected before final captures. Typecheck/build and final full suite results
are recorded below after completion. ESLint reports five existing hook warnings,
zero errors. Existing public deployment and deferred historic key unchanged.


Final verification: broad suite546/546 across116 files passed243.34s. This broad
run began before the review correction; final changed panel/service suites were
then rerun42/42 (39 panel +3 response checks),4.75s. Do not describe this as a full
550-test run. Typecheck and perimeter generation passed; production build passed
with existing dynamic/static import warnings. Final diff whitespace clean.
No real inference, public browser identity or deployment acceptance claimed.
