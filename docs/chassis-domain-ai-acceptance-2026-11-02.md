# Three-domain local AI acceptance, 2026-11-02

## Result and scope

The previous QA snapshot deliberately had no selected domain references.
Its domain_context_not_projected blocker was legacy fail-closed behavior, not
evidence of a broken domain adapter. Existing tests explicitly preserve this
compatibility. No default observations were added to historical snapshots.

A new private, explicitly synthetic QA session was created with three manually
declared software-test observations. Each packet was published, documentarily
reviewed, and explicitly selected in a new immutable snapshot. Original
recording and setup references were retained, not duplicated or resampled.

| Specialist | Synthetic input | Frozen SI value and uncertainty |
|---|---|---|
| Track | One named test sector length |100m, uncertainty1m|
| Weather | One air temperature20degC |293.15K, uncertainty0.5K|
| Tires-powertrain | One front cold gauge pressure2bar |200000Pa, uncertainty5000Pa|

These values are not measured motorcycle data. The test instrument/calibration
references explicitly say software-only, no metrological certification. A point
observation does not establish interval coverage or telemetry clock alignment.

## Verification

- 14 existing decision/projection tests PASS, including legacy snapshots,
  domain request policy, units and source boundaries.
- 29 fixture gates PASS through current authenticated public routes against
  real InsForge: three eligible-for-observation packets, exact revision/digest
  selection, source references unchanged and new run admitted.
- Real local Qwen3:1.7b, verified manifest8f688... and5blobs:8 actual calls.
  Chassis, track, weather, tires-powertrain and the three independent reviewers
  succeeded. Chief synthesis succeeded and was published. Physical/neuro remain
  unavailable, consume no model calls and are not represented as analyzed.
- 56 validation gates PASS: exact frozen refs, SI values/units/uncertainties,
  role projections, each domain's durable inference receipt containing only its
  metric and one authorized model call, private source text excluded, policy
  receipt and proposal digest valid, foreign team404 and reader write403.
- Browser5checks PASS with the same frozen API41b8... and frontendf836...:
  designated Chief/substitute see the pending proposal and enabled approval;
  reader locked; identity/scope survive reload. No decision was clicked or
  submitted. Sandbox/TLS/internal network/input hashes/cleanup retained.

## Interpretation and remaining gaps

This verifies selected domain observations reach real specialist inference,
independent reviews and the Chief in the current candidate. It does not prove
full AI factories or all mechanical component agents, engine analysis, tyre
degradation, comprehensive track mapping, biometrics, external telemetry
accuracy or human business consent. The proposal contains only a measurement
item; external_validation remains false and original source status unknown.

Timing: measured worker passes sum488.531s, model transport140.287s. The remaining
348.244s has no causal attribution. These are synchronous-pass sums, not a full
startup wall-clock or production SLA. Profile that remainder before choosing an
optimization; no quota, physical gate or model budget was increased.

No application behavior was changed merely to make this test pass. Added
reusable acceptance probes and evidence. No public deployment, push, cloud
migration, model download, billed service creation or historical-key revocation.
Existing uncommitted visual work remains separate. Cicerone/Kanban/session
packages, complete bike/component data and independent AiM/2D validation remain.
