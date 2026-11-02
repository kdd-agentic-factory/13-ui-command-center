# Frozen decision-preflight image acceptance, 2026-11-02

API image sha256:927b450517d40534af352083b55e7864fc056ea378eca84fa572ba7df6528882 was built offline from clean repository18 commit bd32b1885fea975f938acdab8bc81e829bd36afa. Repository01/17, runtime, wheel locks and frontend were retained at the previous frozen versions. Installed decisions.py hash matches the frozen source; pip check passed. This is a local candidate, not a deployment.

## Verified against real preproduction

- 11 rejection gates PASS with real QA identities: engineer and reader denied valid approval requests, actor-header spoof denied, other-team access denied. All 16 durable human intent/receipt IDs and fingerprints remain identical before/after. Existing approval unchanged; zero decisions written.
- Isolated Chromium identity/reload PASS for Chief, substitute and reader, followed by 7 approved-state readback checks PASS. Both designated QA approvals are visible and survive reload on the new API image; browser routing blocks business writes. Sandbox, internal browser network, provider TLS trust, private input hashes and owned-runtime cleanup preserved.
- Independent public-route readback confirms exact current Chief/substitute decisions and no mechanical application/validation events. 13/14 gates PASS. Chief history still reports recovery_unavailable for two existing engineer intents without receipts; substitute history is complete.
- First concurrent readback stopped at events_read; its receipt is retained. A subsequent read with HTTP status capture returned 200 for both event routes. The first response status was not captured, so no root cause is claimed for that transient failed read.

## Remaining blocker

Historical rejected intents remain immutable and unclassified. The new guard prevents recurrence; it does not reconcile old records. Do not clear the flag, erase intents, or repeat existing approvals. A future reconciliation needs authoritative evidence and an audited terminal outcome distinct from an approval. Full platform acceptance remains blocked. AiM/2D independent validation and historical-key revocation remain pending.

Automated test-account decisions are synthetic measurement-plan approvals, not real Crew Chief business consent. No cloud migrations, service changes, public deployment, model downloads or push occurred. Uncommitted visual changes were preserved and excluded from the frontend image.
