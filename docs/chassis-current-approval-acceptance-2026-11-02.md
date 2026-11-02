# Current candidate: synthetic measurement approvals, 2026-11-02

Frozen API d801af2b and frontend f83632ec were exercised with real InsForge QA identities, sandboxed Chromium and real local Qwen3 inference. No deployment or cloud migration occurred. No mechanical application was authorized or recorded.

- A second fresh synthetic session reused verified QA source references; five actual local model calls completed. Its proposal passed 28 read-only validation gates before approval. Missing domain context remained blocked/unavailable; external validation remained false.
- Ten negative authority checks passed: engineer/reader and spoofed actor requests cannot approve; foreign team scope is rejected. No decision resulted from these rejected requests.
- Browser completed 11 checks and wrote exactly two measurement-plan approval events: designated QA Chief and substitute, on distinct proposals. Reload preserved both. Credentials were non-administrative, inputs unchanged, owned containers/networks removed.
- Independent readback confirms both current approvals, exact designated actor/event bindings, and no application/validation events. 13/14 gates pass: Chief session reports recovery_unavailable, substitute history is complete. Full acceptance remains BLOCKED.

## Open issue: incomplete history after rejected decision attempts

Chief fixture alone was used for direct negative decision requests. Cloud list_events reports pending when a human intent has no cached receipt. Inherited decide_proposal records intent and attempts recovery before checking current action availability. This ordering is a candidate cause; a focused regression and classification of rejected versus recoverable operations are required. Do not suppress recovery_unavailable, erase history, or replay successful approvals. Both valid decisions already exist.

These are automated QA actions with designated test accounts, not actual Crew Chief business consent. Full release acceptance, missing domain projection, independent AiM/2D comparison and historical-key revocation remain pending. Uncommitted visual work was preserved and excluded from the frozen frontend.
