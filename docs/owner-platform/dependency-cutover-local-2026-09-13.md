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

## Next gate: Windows build environment

Cleanup fix committed as c8735bd. `npm run build` then fails before compilation
with ERR_WORKER_INVALID_EXEC_ARGV: --use-system-ca is not allowed in NODE_OPTIONS
(de3b3b). Host Node24.13.0 reports that flag allowed; it is present in inherited
NODE_OPTIONS. A minimal worker_threads test with inherited and explicit copied
environment passes, so this is not yet attributed to Node workers generally.
Running the same build script with the bundled Node24.19.0 and unchanged trust
settings also fails (f9d326). No antivirus, trust store, TLS validation, machine
environment or production config changed. No patch to node_modules.

Next: isolate the Next/Turbopack worker boundary and compare with the previously
successful Linux candidate. Active Windows build remains red; do not commit the
dependency cutover as fully verified or deploy it on the strength of unit tests.

## Windows build gate resolved without changing TLS trust

The missing reproduction detail was `execArgv: []`: a native Node Worker with
that explicit option and inherited NODE_OPTIONS=--use-system-ca rejects the
flag (2aad10). Next's Turbopack build worker explicitly supplies execArgv. The
earlier minimal worker inherited arguments and therefore did not reproduce it.

Node documents NODE_USE_SYSTEM_CA=1 as the equivalent supported environment
form since24.6/22.19: https://nodejs.org/api/cli.html#node_use_system_ca1.
For this build only, used a child environment with NODE_OPTIONS empty and
NODE_USE_SYSTEM_CA=1, after checking the original NODE_OPTIONS contained exactly
the single --use-system-ca flag. No other options were removed; no machine or
repository settings were changed. The explicit precondition prevents silently
discarding a different configuration.

Hash comparison of sorted default trusted certificate sets from two fresh Node
processes (original flag versus environment form) matches (6e3af6). No certificate
contents were recorded. Build using the child environment passes (ebf43b):
compile15s, TypeScript22.9s, 23/23 pages, exit0. This is the active Windows tree,
not the previous Linux candidate. First trust-check command had a shell quoting
error and was rerun correctly; only6e3af6 is evidence.

Reproduce from owner-platform in PowerShell:

```powershell
node -e "const {spawnSync}=require('node:child_process');if((process.env.NODE_OPTIONS||'').trim()!=='--use-system-ca')throw Error('Unexpected NODE_OPTIONS; refusing to replace');const r=spawnSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit',env:{...process.env,NODE_OPTIONS:'',NODE_USE_SYSTEM_CA:'1'}});if(r.error)throw r.error;process.exit(r.status??1)"
```

Do not use this workaround blindly when other NODE_OPTIONS are present. It is
an explicit local invocation, not an automatic runtime/environment normalizer.

## Active SQLite integration remains incomplete

`npm run test:integration` terminated exit1 (bdffb7): 68 passed,23 skipped out of
92;7 files passed,4 skipped out of12, plus an unhandled worker-fork unexpected
exit. The skipped cases are PostgreSQL-specific; this does not explain away
the missing test/worker error. A fresh verbose run is needed to identify the
unfinished file. No production or test code has been changed to bypass it.
Do not confuse the green build with completion of all integration gates.

Verbose repeat also exits1 (7dd9a9):65 passed/23 skipped, same unexpected-worker
error. It reached editorial.integration.test.ts through the article block-only
save case, but did not finish its project save and subsequent cases. Full-config
filesystem/object tests and media/recovery/unlock suites had passed. The differing
completed-test counts across runs mean this is not yet attributed to a specific
assertion. Next diagnostic is the editorial file alone; no retry-as-success claim.
