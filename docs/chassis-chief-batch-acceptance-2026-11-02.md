# Bounded Chief artifact read acceptance, 2026-11-02

## Measured query pattern

The authority read made50 business queries. Profiling identified9 separate
decision-context reads and9 receipt reads, plus session/snapshot/documentary
checks. Other repeated reads remain: snapshot5times, session3times, Chief
context2times and knowledge requirements8times. This change does not assume
those checks are unnecessary.

Repository18 commit442f3c3 introduces ObjectRepository.get_objects with a bound
of32 references, parameterized kind/UUID pairs, the existing namespace and team
RLS on the same connection. Empty batches do not query, duplicate references
are normalized, missing rows remain explicit, and every call reads fresh data.
There is no shared or cross-request cache.

Chief preparation loads the18 artifacts once and passes them through the
original per-task validation. Even non-inference tasks still request a receipt,
so unexpected receipts and missing required inference receipts cannot be
silently ignored. Hash, schema, actor, scope, documentary and role checks remain.

## Verification

-7 unit cases RED before the method existed, then GREEN.
-36 tests PASS,127 deselected,39.24s with isolated actual Postgres/control-worker
  execution: bounded inputs, fresh reads, team/reader RLS, existing privilege and
  transaction controls, publication races and decision recovery.
-Focused independent read-only review: no important/critical findings.
  Reviewer did not execute tests or access cloud; test evidence is implementer's.
-Offline frozen image ebac5d1e... from clean commit442f3c3; installed Chief and
  repository hashes match source, pip check PASS, no app-source overlay.
-Real preproduction authority profiles: business queries50 to33,2 connections
  unchanged. Exactly one batch requests18 objects and returns16:9 contexts and
 7 receipts, while absence of the other2 is still verified by the old logic.
  Counts of all non-artifact object reads remain identical.
-Alternating fresh-image comparisons (same synthetic QA context):

| Pair | Scalar image | Batched image | Business queries |
|---|---:|---:|---:|
|1|7.4249s|5.3926s|50 to33|
|2|4.4985s|3.6129s|50 to33|

Small network samples are not an SLA, causal speedup percentage or measurement
of the full eight-call worker. The initial non-interleaved timings varied in
both directions and are retained.
-56 current-image readback gates PASS: original specialist receipts, SI facts,
  uncertainty, frozen Chief proposal/digests, designated authority, foreign
  team404 and reader write403. Existing inference was read, not replayed.
-Isolated browser5checks PASS: Chief/substitute see pending review, reader
  locked, identity/scope survive reload,0 decisions written, TLS/sandbox and
  input hashes preserved, owned resources removed.

## Remaining work

Re-measure a complete controlled QA analysis before claiming that the earlier
488.531s worker cycle is faster. Further query optimization must first profile
the remaining reads and retain live membership, head, lease and source checks.
Full factories, Cicerone/Kanban/session packages, complete component data and
independent AiM/2D validation remain open.

No public deployment, push, cloud migration, new billed service, model download,
human business approval or historical-key revocation occurred. Existing visual
work was preserved and remains outside the frozen frontend.
