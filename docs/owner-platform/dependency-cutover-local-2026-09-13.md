# Local dependency cutover: verification incomplete

## Current integration checkpoint

The candidate is now being committed as a recoverable local integration, not a
stable-release declaration. Current lock SHA256 is
6D137A173CB560F26029E77FEF1A1691C783C34FC567C6836B7C5C729F2D93FC
(postinstall metadata added). Fresh strict npm ci with lifecycle enabled passes
ee76a4; both Lexical patched artifact hashes match448d1b. Full unit suite1313/171
plus8 script checks passes920f8a/77e838; types/lint passaa5875; native browser
390/1280 with immediate save and restart passesb3aacd. See the dedicated
lexical-immediate-save-patch-2026-09-13.md for maintenance and scope.

The previously observed Windows access violation remains unresolved. Committing
the exact tested dependency set makes the work recoverable; it does not erase
that failure, authorize deployment, or prove the entire CMS complete. Historical
gate results below retain their original dates/order and are not fresh runs.

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

## Native exit diagnostic

Editorial alone also failed (7836c1),24 pass/2 skipped before unexpected exit.
An untracked local preload that logs only fork exit code/signal produced two
passing focal runs (738de7,1b448d:35 pass/2 skipped). These are instrumentation
observations, not a fix. Without the preload the next run failed after15 passes
(3ccd3c). An independent Windows Process handle captured its actual exit code
-1073741819, i.e.0xC0000005 (9d7f5d). This indicates an access violation, not a
test assertion: https://learn.microsoft.com/en-us/shows/inside/c0000005.

Bundled Node24.19.0 without instrumentation also fails after24 passes (2ea8e4).
The lock comparison shows libsql0.4.7, @libsql/client0.14.0 and sharp0.35.4 unchanged
from the committed pre-upgrade lock (988d42); that does not identify the faulty
component. No dump, secrets or certificate contents collected. No native module
has been upgraded or blamed without evidence.

Created an isolated baseline at .audit/owner-baseline-388-20260913/owner-platform
from committed HEAD51dab67 using git archive (ea4ef1): same committed sources,
Payload3.88/Vitest4.1.10 manifests, no developer env files. Strict npm ci is next;
compare the identical editorial test there before attributing this to the upgrade.
The working application, its dependencies and user data remain untouched by this
baseline. All prior failing runs remain part of the evidence.

Baseline strict npm ci passes (70d39d),733 packages; the old lock reports10
moderate advisories, so this isolated control is not a recommended rollback or
production dependency set. Baseline editorial run without diagnostic preload
passes35/2 skipped,exit0,31.97s (791e0d). One pass is not enough to establish
causality. Next comparison must separate Payload3.88→3.89 from Vitest4.1.10→4.1.11
and account for the different isolated path/install. Do not infer a specific
upstream regression yet or accept the active upgrade because another tree passes.

## Dependency controls narrow, but do not resolve, the native failure

In the isolated copy, Payload3.88 + Vitest4.1.11 passes35/2 skipped (e5e1e5).
The Vitest install also updates its Vite/Rolldown transitives (2b800a); this is not
a claim that only one physical package changed. Payload packages remained3.88.

Attempting the Payload upgrade incrementally with strict peers is rejected
(4534d1). No force/legacy-peer switch used. Applied the active candidate lock to
the isolated copy and ran npm ci strictly:729 installed,zero reported advisories
(5d3dc1). Parsed manifests and lock match the active candidate exactly (e80d38).
This Payload3.89/Vitest4.1.11 isolated run also passes35/2 skipped (a546f5).

Read-only comparison of538 src/tests/scripts files reports no differences.
Native libsql and Rolldown binary hashes match (a74b54); Sharp comparison used
an absent path, so it supplies no evidence about that binary. The next active
editorial run without instrumentation also passes35/2 skipped (6bff32).
This confirms intermittency, not a fix. No production source was changed during
these controls. A fresh complete active integration run follows; previous native
failures remain unresolved even if an individual repetition passes.

## Current-tree integration revalidation

The complete active Windows SQLite run finished exit0 (455d9d):69 passed,
23 PostgreSQL-only skipped,8 passed files/4 skipped,126.96s. This is a passing
execution, not a resolution of the previously measured native access violation.
No retry setting or instrumentation was used, and no native-failure fix exists.

With the isolated container idle, copied current src/tests/scripts to its
existing candidate directory. SHA-256 comparison of541 files, including both
package manifests and the integration configuration, found no differences
(b940a6). Its Git HEAD is still the earlier candidate: this is a verified source
overlay, not a clean checkout of9e06fc2. No developer environment files copied.

The full PostgreSQL runner on that source passes92/92 across12 files,121.41s,
exit0 (a4a858). PostgreSQL16.15, loopback SCRAM, synthetic credentials only;
runner confirms the child and database sessions closed and the exact cluster
was stopped/removed. Some suites explicitly select SQLite; this does not claim
that every assertion used PostgreSQL. Both complete engine runs are retained.

Root protection tests pass22/22 and the public dependency boundary passes21
entries (c7ae8c). Checkpoint still resolves to0f0adf686b2752e23c25d224f8c60815b10fd451.
Hub delivery d261330b-ed4c-47f1-a0e1-ca69b0788508 records these results; delivery
is not independent review or acceptance. Dependency manifests remain uncommitted
while the native issue is unresolved. No deployment or public source changes.

Full physical recovery on the same verified source overlay passes (ea7fc7),
after47 helper tests (919cb3). Native pg_dump/pg_restore recovered18 backup files,
12 media files and3 revisions;12 corruption/missing-file cases were rejected
before target allocation. Login, history, frozen preview and independent editing
of restored pages/articles pass;3 page versions and2 article versions recovered.
Source logical state and backup receipts remain unchanged,3 retained files and3
reconciled revisions verified. Runner confirms exact cluster shutdown and cleanup.
The emitted applicationCommit0b0c308 identifies the container's earlier Git base,
not the overlay: use the541-file comparison above for tested-source provenance.
This is a synthetic local recovery drill, not an external production backup.

## Native lifecycle probes: no root-cause claim

Read the installed Payload/Drizzle begin/commit/rollback/destroy implementations
and libsql client transaction lifecycle. Drizzle destroy clears schema state;
it does not itself close the SQLite client. Thus the explicit client.close in
the suite is not shown to be a duplicate close. Earlier failures occur before
afterAll, so changing teardown alone would not explain those observations.

A standalone diagnostic outside application source executed1000 real libsql
transactions with explicit GC checkpoints and exact row-count assertions:
666 committed,334 rolled back (e1eec9). Transaction assertions pass, but the
command exits1 because cleanup hits EBUSY (be24d3). This is not a passing whole
test or a fix. No access violation was observed. The synthetic directory
`owner-libsql-lifetime-Y1gLU0` under the user's Windows Temp remains retained:
a subsequent exact-path cleanup request was rejected by tool policy and was
not retried through another mechanism. It contains only generated test data.

An untracked diagnostic debugger validates the worker command and its explicit
editorial-test parent before attaching, captures only access-violation module
name/offset (no memory dumps), and detaches without killing the worker. The
attached run passes35/2 skipped,30.50s (34bc42); debugger exits0 with no captured
access violation (a00917). Debugger attachment can affect timing. This is another
non-reproduction, not grounds to close the native issue. The diagnostic scripts
remain outside application code; no dependency, runtime or assertion changed.
