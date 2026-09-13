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

Follow-up diagnostic: host reports 12 logical CPUs and Vitest config has no
explicit worker bound. Ran the unchanged full suite with `--maxWorkers=2`
(session 89528). It produced no terminal test summary before manual interruption
(dd5b09, exit1). This is inconclusive, not a passing gate and not evidence that
limiting workers fixes the cleanup timeout. No test, timeout or configuration
was changed. Dependency manifests remain uncommitted.

## Cleanup gate corrected (subsequent verification)

Full isolated inventory file passed unchanged: 75 tests, 20.64s (9839b8).
Temporary count/timing instrumentation in the full suite reproduced the failure:
1304 pass / one afterEach timeout, exit1, 138.27s (dfda75). Cleanup began only
after the real 10,001-file limit assertion. No successful cleanup duration was
captured before timeout, so no precise IO duration or antivirus cause is claimed.

Removed the diagnostic logging. The fixture now snapshots its own paths/lists
before awaiting cleanup, preventing a late hook from using the next fixture's
mutable state. Its cleanup hook gets 30s, matching the existing 30s file-creation
test budget. This is a deliberate test-harness allowance, not a performance fix:
global timeouts, the physical 10,001 files, runtime assertions and production
limits are unchanged. No concurrency setting or retry was added.

Fresh `npm test` passes: three script checks plus all 1305 unit tests / 170 files,
147.01s, exit0 (08de8a). Typecheck and full owner lint pass (b4c1de).
Build is the next active gate; manifests are still pending final integration.
Checkpoint resolves unchanged to 0f0adf686b2752e23c25d224f8c60815b10fd451.
