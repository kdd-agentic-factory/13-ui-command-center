# SDD ledger — plan: 2026-10-19-chassis-commercial-validation-identity.md
Spec y plan aprobados; ejecución nativa, cambios locales sin commits ni despliegue.
Pre-flight:1 comparación de variantes independiente;2→3 runtime+contrato local;4→5→6 identidad Principal→propiedad→rutas;6→7 transporte/roles;8 verifica todos. Datos legacy siguen locales sin propietario.
Task1: in progress.

Task1: complete in available scope —9 comparison tests,26 including reader/import passed. No manufacturer export found; real contrast blocked, native remains experimental.
Task2: in progress — official Ollama0.40.6 archive SHA256 matched; Authenticode valid; loopback runtime PID5652. qwen3:4b Apache-2.0 Q4_K_M selected,2.5GB download underway. Initial hash check stopped safely because checksum filename includes ./; parser corrected, actual hash matches official.
Task3: implemented bounded generation options and tests; real inference pending download.
Task4:6 identity tests pass; SQLRLS in isolated network-none PostgreSQL16 passes cross-team/admin/self-escalation checks. Migration012 prepared only, not cloud-applied.
Task5: trusted ownership and team namespace implemented; legacy backup/quarantine test green. No legacy adoption executed.
Task6: deny-by-default method/path inventory, roles and local loopback checks implemented; focused identity/route tests green.
Task7: common transport, memory token via public SDK refreshSession, user/team selection isolation and late-response rejection implemented;9 focused frontend tests passed before adding delayed-body case. Types initial errors corrected; full suite underway.
Ruling: existing store helpers retain their signatures but use request-local ContextVar propagated to worker threads, plus explicit Principal entry point load_recording — avoids unsafe process-global scope and preserves local compatibility — tests exercise concurrent/cross-team reads; final reviewer must verify boundary.
Ruling: SQLite additive ownership migration backs up legacy DB first and leaves null owners in quarantine. Offline inventory tool does not implement automatic adoption; adoption cannot be safely executed without verified live admin/environment.
Ruling: runtime installed manually with verified official artifact; checked-in management script does not auto-install executables — safer repeatable operation while satisfying actual local runtime installation.

Task2: complete — model2497293931bytes, digest359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7 verified by Ollama. Runtime official/hash/signature verified, loopback+NO_CLOUD. Managed startup checks pinned digest.
Task3: complete — first generic-JSON inference exceeded8s and fell back. Grammar+compact output tested RED→GREEN; synthetic real accepted5.641/3.953s; real2D source-verification finding accepted6.063s. Historical AiM comparison without eligible findings correctly skipped inference. Suggested tests remain deterministic; LLM ranks IDs only.
Ruling: test_choices constrained to empty in real generation — each current finding has exactly one predetermined permissible next test, so model selection adds no value — validator still rejects invented choices; numbers/text remain deterministic.
Review: fresh commercial_identity_final_review found3 important defects, reproduced RED→GREEN: CORS outer boundary, token renewal/expiry+logout race, packaged recorded schema. Relocated data test also exposed unpackaged sensor dictionary; canonical dictionary now packaged with equality tests. Wheel isolated import passes.
Operational regression: long-lived QA server exposed rate-limit cleanup replacing defaultdict with dict after300s. New-client regression RED→GREEN fixed using safe missing-bucket lookup.
Browser QA first failed because fixture provider origin violated CSP; moved fixture identity to same-origin, without weakening CSP. Subsequent import failure traced to rate-limit cleanup above. Logout returns to existing public entry flow, so test asserts that flow and removal of private content.
Cloud migration012 remains prepared-only; no live accounts, no raw export/adoption. Real2D reference remains blocked by missing Analyzer export. Do not claim fully sellable/multiuser rollout completed.


Final verification:335 frontend tests/74files GREEN;91 backend tests GREEN; types/build GREEN (existing chunk-size warning). Browser chassis progressive flow with actual local model enabled passed18.1s; fixture-provider team login/import/switch/restore/logout passed5.8s. JSON-body and logout/refresh regressions included. SQLRLS baseline and revocation/last-admin guard PASS in isolated PostgreSQL16. Wheel installed outside checkout imports/compares/persists using packaged schema+sensor dictionary; Docker chassis-core built. Ruff and diff checks GREEN. Real Ollama generation and main UI checked separately; IAB main shows real2D source and explicit local-mode banner, no fabricated ownership.
Task4: complete as prepared/local-verified — real provider credentials/session and cloud migration not activated by this plan.
Task5: complete as prepared/local-verified — legacy data kept local/unowned, backup before additive migration, inventory only. No adoption performed.
Task6: complete as local-verified — authenticated mode deny-by-default and local-only fallback boundary, deployment still needs real provider/TLS/operations.
Task7: complete — protected telemetry pages, SDK memory bearer, team selection, reader write controls, late-response/body guards, expiry refresh+logout epochs. QA same-origin respects existing CSP.
Task8: complete within approved preparation scope — independent review important fixes applied RED→GREEN and suites green. Temporary Vite5175/API8191/Postgres QA stopped;5173/8180 and Ollama11434 remain local.
Ruling:21 had main checked out with only this task's new SQL/test files. Moved uncommitted additions to codex/chassis-commercial-identity-20261019 before delivery; no main commit made.13/17/18 remain on prior feature branch with all prior changes preserved.
External gates: manufacturer export missing (2D experimental); migration012/first authorized team-admin/bootstrap and live login/permission checks not applied in cloud; measured physical suspension validation remains necessary before sales claims. No deployment/push/real invites/raw transfer.
