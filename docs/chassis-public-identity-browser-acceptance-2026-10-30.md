# Public-site identity browser acceptance

Scope: existing published https://czdpamk9.insforge.site/pit-wall/app. This is not
acceptance of current candidate sources or a new deployment. No proposal approval,
setup change, upload or account modification. Provider logins create sessions.

Dedicated Chassis-Preproduction Linux executor, operator UID1000. Pinned existing
QA image7b5c71fae1f4864cadd775a137e58f1ee5b0445c9f741149a2a82fa0730d7ca5;
read-only accounts/script/dependency mounts, read-only root, dropped capabilities,
reviewed seccomp and Chromium sandbox, bounded memory/time and no host ports.
No Docker socket in browser container. No snapshots, traces or credential logs.
Playwright allows page HTTP traffic only to fixed site and identity origins,
blocks service workers and all WebSockets. This is page-request filtering, not a
network firewall for all browser background traffic. Credentials remain native
Linux private files; no copying into repository or Windows.

Test source: tests/delivery/public_identity_browser.cjs. Native bounded launcher
and hashes retained privately under the existing SDD workspace. Chief of test
teamA and substitute of test teamB each use a fresh browser context. Checks login,
team selector excludes the other fixture team, successful200 session reads with
own X-Team-ID, returned rows belong to that team, and repeats after page reload.
Request generations exclude late pre-reload responses; pending JSON reads also
recheck generation. Does not perform a forged foreign-team request, mechanical
approval, real inference, Storage ingestion or end-to-end candidate acceptance.

Independent review found incomplete service-worker/WebSocket filtering and weak
UI-only scope assertions; both addressed before credentialed execution. Initial
runs blocked at reload/login scope because a legitimate startup403 before team
selection was marked a foreign read. Redacted diagnostics established403, not
foreign successful data. Corrected harness to tolerate denied startup requests
while still requiring a subsequent scoped200 and rejecting any successful foreign
scope/body. No product auth/RLS/quota control weakened. First corrected run passed
all4 browser checks; final generation-bound confirmation recorded below.

The old unified runner still pins qwen3:0.6b and old images, whereas current local
node uses qwen3:1.7b. It was not run as current candidate acceptance. Reconcile its
explicit image/model/resource matrix before unified real identity+Storage+model+
Chief/substitute acceptance. Keep the existing production/public deployment and
historical-key revocation status unchanged. Cold-start model latency remains open.


Final confirmation:4/4 browser checks passed with generation-bound responses.
Native evidence public-browser-919b4371fd494bd2a0bf655d9404ee6f; scriptSHA256
935109f4160095b7e8881275ba1c696ee2fee4e4fe0f4e98c5abd25fe55e498b.
Reported session status sequence403/200/403/200 for the last fixture role, no
successful foreign response. Browser container removed successfully, no host ports.
JavaScript syntax and repository whitespace checks passed. No current-candidate
or human-approval acceptance claim; no production code change this milestone.
