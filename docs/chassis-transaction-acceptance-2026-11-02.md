# Batched transaction initialization acceptance, 2026-11-02

## Measured cause and correction

A read-only profile of the existing synthetic three-domain QA case showed every
Postgres transaction used3 privilege queries and6 transaction-local set_config
queries before business reads. The backend opened fresh connections each time.
These timings do not attribute all previously unmeasured worker time to SQL.

Repository18 commit77995c9 combines the six privilege rejection booleans in one
SELECT, then installs all six bound transaction-local settings in one SELECT.
Privilege checks remain fresh on every transaction. No role cache, connection
pool, new shared context or permission bypass was introduced. Verified TLS,
UUID validation, semaphore4,5s connection/capacity timeout and existing SQL
timeouts are retained.

## Verification

- RED: initialization regression observed9 round trips and failed its bound2.
- GREEN:8 unit cases PASS, including all unsafe flags, distinct team contexts and
  an unsafe role change between transactions.
-28 tests PASS,127 deselected,37.14s with isolated actual Postgres and controlled
  worker/Chief execution. Includes privilege/settable-admin rejection, cross-team
  isolation, reader/write policy, rollback and decision recovery.
- Focused independent code review found no important/critical regressions.
  Reviewer could not independently collect tests in its default environment
  without psycopg; the isolated-container test results are implementer evidence.
- Offline immutable API image d3b787e9... built from clean commit77995c9. Installed
  connection.py hash matches source; pip check PASS; no app source overlay.
- Same real-identity six reads:8 connections,106 business queries unchanged;
  preparation queries72 to16 (9 to2 per transaction). All six responses200.
-56 existing-run revalidation gates PASS with the new image: frozen domains,
  SI/uncertainty, durable inference receipts, Chief publication, designated
  authority and cross-team/reader checks. No new inference was executed.
- Isolated browser5checks PASS: Chief/substitute pending review visible,
  identity/scope survive reload and reader remains locked;0 decisions written,
  private inputs unchanged, sandbox/TLS/cleanup preserved.

## Timing limits and next investigation

The six sequential reads totaled25.7751s before and23.2735s after. The second
iteration subtotal was7.8368s before and6.8646s after. Individual first-iteration
reads varied in both directions. This small network sample is not a production
SLA or a causal latency percentage. The full eight-call worker has not been
rerun, so its previous488.531s measurement is not replaced by an estimate.

The authority read still executes50 business queries. Profile their necessity
and repetition before choosing any further optimization. Do not cache live
membership/designation, context heads or leases, or skip source-integrity checks
to meet a timing goal.

No public deployment, push, cloud migration, billed service creation, model
download or historical-key revocation occurred. Existing uncommitted visual
work remains separate; full product acceptance and other Brain gaps remain.
