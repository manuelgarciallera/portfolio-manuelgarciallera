# Local dependency cutover: verification incomplete

Base 0cb8d8d. User authorizes Codex technical direction; candidate browser gates
now passed. Applied only the exact tested candidate package.json/package-lock
to active owner source using patches. Lock SHA256 remains
8382EFB6B4E0CD2411403CF30765BEA476758EA4C28EA25F7160FE4EDA55BF9A.
No public manifest, provider, data migration or deployment changed.

Recovery copy: .audit/pre-owner-dependency-cutover-0cb8d8d.bundle,
complete history verified (1faa4e); local code only, not external DB/media backup.

- npm ci --strict-peer-deps --ignore-scripts --no-fund: exit0, 729 installed,
  audit730 with zero reported vulnerabilities (49f53f).
- npm ls --all JSON: exit0, problems[] (d33186).
- npm test: three script checks pass; 1304/1305 units pass, one afterEach cleanup
  hook timeout at10 seconds (0d2977/a3930e). Repeat produces the same failure
  (6b6173), so this is not declared fixed or dismissed as a one-off.
- The same 10,001-file case isolated passes in9.72 seconds (8b1ac7), no code or
  timeout edits. Failure during concurrent suite execution needs diagnosis.

The manifests remain uncommitted pending resolution and fresh whole-tree gates.
Prior isolated candidate results do not turn this active failure green. Next:
inspect cleanup/concurrency in legacy-media-inventory.test.ts without removing
the real file-limit test or silently increasing global timeouts. Preserve
ownerOnly unlock and all recovery policies. No upstream-fix claim from audit-zero.
