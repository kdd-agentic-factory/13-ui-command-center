# Historical secret-scan review

The ignore file contains four immutable finding fingerprints, not path-wide or rule-wide exemptions:

- Two `deploy/chassis-release.json` findings are content-addressed Docker image references, not credentials.
- The historical `.env.production` JWT has role `anon`; it was a browser public identifier. The file is absent from the current release.
- The historical `phc_` value is a PostHog public project token, not a personal API key. See https://posthog.com/docs/privacy#is-it-ok-for-my-api-key-to-be-exposed-and-public .

The administrative InsForge key in commit `d4fdb49586fdb1cfcecd50ac2facd85182041160`, `src/services/insforgeStorage.ts:18`, is **not ignored**. Its SHA-256 identifier is `479ec67f80bd82e0` (abbreviated). It is absent from current source; revocation for the historical project `vdf553wq.eu-central.insforge.app` still needs owner confirmation. No credential value belongs in this document or scan output.

Full-history scanning remains mandatory and redacted. Newly committed credentials are not covered by these fingerprint exceptions. No history rewrite or credential probe was performed.
